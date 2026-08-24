import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {databaseError, pageQuery, type ResourceQuery} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';
import type {CreateUserDto} from './dto/create-user.dto.js';
import type {UpdateUserDto} from './dto/update-user.dto.js';
import {UserAccessPolicy, type UserMutationActor} from './user-access.policy.js';
import {toUserRecord, type UserRow} from './user-record.js';

const USER_SELECT = `
  id,auth_user_id,name,account,email,phone,avatar_url,gender,status,employee_no,job_title,manager_name,
  enterprise_wechat,emergency_contact,office_location,joined_at,department_id,department_name,tags,
  last_login_at,created_at,updated_at,department:departments!users_department_id_fkey(name),
  role_assignments:user_roles(role_id,role:roles(name))
`;

const SORT_COLUMNS: Record<string, string> = {
  name: 'name',
  account: 'account',
  email: 'email',
  phone: 'phone',
  status: 'status',
  createdAt: 'created_at',
};

function toDatabasePatch(dto: UpdateUserDto) {
  const patch: Record<string, unknown> = {};

  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.account !== undefined) patch.account = dto.account;
  if (dto.email !== undefined) patch.email = dto.email;
  if (dto.phone !== undefined) patch.phone = dto.phone || null;
  if (dto.employeeNo !== undefined) patch.employee_no = dto.employeeNo || null;
  if (dto.jobTitle !== undefined) patch.job_title = dto.jobTitle || null;
  if (dto.managerName !== undefined) patch.manager_name = dto.managerName || null;
  if (dto.enterpriseWechat !== undefined) patch.enterprise_wechat = dto.enterpriseWechat || null;
  if (dto.emergencyContact !== undefined) patch.emergency_contact = dto.emergencyContact || null;
  if (dto.officeLocation !== undefined) patch.office_location = dto.officeLocation || null;
  if (dto.joinedAt !== undefined) patch.joined_at = dto.joinedAt || null;
  if (dto.avatarUrl !== undefined) patch.avatar_url = dto.avatarUrl || null;
  if (dto.gender !== undefined) patch.gender = dto.gender || null;
  if (dto.status !== undefined) patch.status = dto.status;
  if (dto.department !== undefined) patch.department_name = dto.department || null;
  if (dto.departmentId !== undefined) patch.department_id = dto.departmentId || null;
  if (dto.tags !== undefined) patch.tags = dto.tags;

  return patch;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
    @Inject(UserAccessPolicy) private readonly accessPolicy: UserAccessPolicy,
  ) {}

  private async readUser(id: string) {
    const {data, error} = await this.supabase.database
      .from('users')
      .select(USER_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`User ${id} was not found.`);
    return toUserRecord(data as unknown as UserRow);
  }

  private async replaceRoles(userId: string, roleIds: string[] | undefined) {
    if (roleIds === undefined) return;

    const {error} = await this.supabase.database.rpc('replace_user_roles', {
      p_user_id: userId,
      p_role_ids: roleIds,
    });
    if (error) throw databaseError(error.message, error.code);
  }

  private async rolesChanged(userId:string,roleIds:string[]|undefined) {
    if(roleIds===undefined) return false;
    const {data,error}=await this.supabase.database.from('user_roles').select('role_id').eq('user_id',userId);
    if(error) throw databaseError(error.message,error.code);
    const current=(data??[]).map(item=>String(item.role_id)).sort();
    const requested=[...roleIds].sort();
    return current.length!==requested.length||current.some((id,index)=>id!==requested[index]);
  }

  async assignableRoles(actor: UserMutationActor) {
    return this.accessPolicy.assignableRoles(actor);
  }

  private async assertOwnerAssignmentRemainsValid(id:string, dto:UpdateUserDto, currentDepartmentId:string|null, currentStatus:string) {
    if(dto.departmentId===undefined&&dto.status===undefined) return;
    const nextDepartmentId=dto.departmentId===undefined?currentDepartmentId:dto.departmentId;
    const nextStatus=dto.status??currentStatus;
    const {data,error}=await this.supabase.database.from('departments').select('id')
      .eq('owner_user_id',id).is('deleted_at',null).limit(1).maybeSingle();
    if(error) throw databaseError(error.message,error.code);
    if(data&&(data.id!==nextDepartmentId||nextStatus!=='normal')) {
      throw new ConflictException({code:'DEPARTMENT_OWNER_REASSIGN_REQUIRED'});
    }
  }

  async findAll(query: ResourceQuery, actor: UserMutationActor) {
    const {page, pageSize, start} = pageQuery(query);
    let request = this.supabase.database
      .from('users')
      .select(USER_SELECT, {count: 'exact'})
      .is('deleted_at', null);

    const scope=await this.accessPolicy.scope(actor);
    if(scope.kind==='self') request=request.eq('id',scope.userId);
    if(scope.kind==='departments') request=request.in('department_id',scope.departmentIds);

    if (query.name) request = request.ilike('name', `%${query.name}%`);
    if (query.phone) request = request.ilike('phone', `%${query.phone}%`);
    if (query.status) request = request.eq('status', query.status);
    if (query.createdAt) {
      const date = query.createdAt.slice(0, 10);
      request = request
        .gte('created_at', `${date}T00:00:00.000Z`)
        .lt('created_at', `${date}T23:59:59.999Z`);
    }

    const {data, error, count} = await request
      .order(SORT_COLUMNS[query.sortKey ?? ''] ?? 'created_at', {ascending: query.sortDirection === 'asc'})
      .range(start, start + pageSize - 1);

    if (error) throw databaseError(error.message, error.code);
    return {
      items: ((data ?? []) as unknown as UserRow[]).map(toUserRecord),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async create(dto: CreateUserDto, actor: UserMutationActor) {
    await this.accessPolicy.assertCreateAllowed(dto.departmentId,actor);
    await this.accessPolicy.assertRoleAssignmentAllowed(dto.roleIds, actor);

    const {data, error} = await this.supabase.database
      .from('users')
      .insert({...toDatabasePatch(dto), status: dto.status ?? 'normal'})
      .select('id')
      .single();
    if (error) throw databaseError(error.message, error.code);

    try {
      await this.replaceRoles(data.id, dto.roleIds);
    } catch (roleError) {
      await this.supabase.database.from('users').delete().eq('id', data.id);
      throw roleError;
    }

    return this.readUser(data.id);
  }

  async update(id: string, dto: UpdateUserDto, actor: UserMutationActor) {
    const target = await this.accessPolicy.assertTargetAllowed(id, actor);
    const rolesChanged=await this.rolesChanged(id,dto.roleIds);
    if(rolesChanged) await this.accessPolicy.assertRoleAssignmentAllowed(dto.roleIds, actor);
    await this.assertOwnerAssignmentRemainsValid(id,dto,String(target.departmentId??'')||null,String(target.status));

    if (
      dto.account !== undefined
      && target.authUserId
      && target.account !== dto.account.trim().toLowerCase()
    ) {
      throw new ForbiddenException({code: 'PROVISIONED_ACCOUNT_IMMUTABLE'});
    }

    const {data, error} = await this.supabase.database
      .from('users')
      .update(toDatabasePatch(dto))
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`User ${id} was not found.`);

    if(rolesChanged) await this.replaceRoles(id, dto.roleIds);
    return this.readUser(id);
  }

  async remove(id: string, actor: UserMutationActor) {
    await this.accessPolicy.assertTargetAllowed(id, actor, {allowSelf: false});

    const {data, error} = await this.supabase.database
      .from('users')
      .update({deleted_at: new Date().toISOString()})
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`User ${id} was not found.`);
  }

  async provisionAuth(id: string, password: string, actor: UserMutationActor) {
    const user = await this.accessPolicy.assertTargetAllowed(id, actor);
    if (user.authUserId) throw new ConflictException({code: 'AUTH_ACCOUNT_ALREADY_PROVISIONED'});

    const {data: authData, error: authError} = await this.supabase.database.auth.admin.createUser({
      email: this.supabase.passwordAuthEmail(user.account),
      password,
      email_confirm: true,
      user_metadata: {account: user.account, name: user.name, business_email: user.email},
    });

    if (authError || !authData.user) {
      if (authError?.message.toLowerCase().includes('already')) {
        throw new ConflictException({code: 'AUTH_ACCOUNT_EXISTS'});
      }
      throw new InternalServerErrorException({code: 'AUTH_PROVISION_FAILED'});
    }

    try {
      const provisionedUser = await this.readUser(id);
      if (provisionedUser.authUserId !== authData.user.id) {
        throw new Error('Auth identity was not linked to the application user.');
      }
      return provisionedUser;
    } catch {
      await this.supabase.database.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException({code: 'AUTH_PROVISION_FAILED'});
    }
  }

  async resetAuthPassword(id: string, password: string, actor: UserMutationActor) {
    const user = await this.accessPolicy.assertTargetAllowed(id, actor);
    if (!user.authUserId) throw new ConflictException({code: 'AUTH_ACCOUNT_NOT_PROVISIONED'});

    const {error} = await this.supabase.database.auth.admin.updateUserById(user.authUserId, {password});
    if (error) throw new InternalServerErrorException({code: 'AUTH_PASSWORD_UPDATE_FAILED'});
    return {updated: true};
  }
}
