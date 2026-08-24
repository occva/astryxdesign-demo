import {ConflictException, Inject, Injectable, InternalServerErrorException, UnauthorizedException} from '@nestjs/common';
import type {Session} from '@supabase/supabase-js';
import {SupabaseService} from '../supabase/supabase.service.js';
import {FilesService} from '../files/files.service.js';
import type {RegisterDto} from './dto/register.dto.js';

type DepartmentRelation = {name: string; owner: {name: string} | Array<{name: string}> | null};
type SystemUserRow = {
  id:string; auth_user_id:string|null; name:string; account:string; email:string|null; phone:string|null;
  employee_no:string|null; job_title:string|null; manager_name:string|null; enterprise_wechat:string|null;
  emergency_contact:string|null; office_location:string|null; joined_at:string|null; avatar_url:string|null;
  gender:string|null; department_name:string|null; status:string; tags:string[]|null; last_login_at:string|null;
  created_at:string; department:DepartmentRelation|DepartmentRelation[]|null;
};
type AssignedRole = {id:string; name:string; code:string; isSystem:boolean};
type AccessContext = {roles:AssignedRole[]; permissionIds:Set<string>; permissionCodes:string[]};

export type AuthenticatedMenu = {
  id:string; name:string; code:string; parentId:string|null; path:string; icon:string;
  componentKey:string; sortOrder:number; i18nKey:string;
};
export type AuthenticatedUser = {
  id:string; authUserId:string; name:string; email:string; account:string; phone:string; employeeNo:string;
  jobTitle:string; managerName:string; enterpriseWechat:string; emergencyContact:string; officeLocation:string;
  joinedAt:string; avatarUrl:string; gender:string; status:string; department:string; departmentOwner:string;
  roleName:string; roleCode:string; roleId:string; roleIds:string[]; roleNames:string[]; roleCodes:string[];
  hasSystemRole:boolean; permissionCodes:string[]; tags:string[]; lastLoginAt:string; createdAt:string; menuPaths:string[];
  menuKeys:string[]; menus:AuthenticatedMenu[];
};

const systemUserSelect = `
  id,auth_user_id,name,account,email,phone,avatar_url,gender,employee_no,job_title,manager_name,
  enterprise_wechat,emergency_contact,office_location,joined_at,department_name,status,tags,
  last_login_at,created_at,
  department:departments!users_department_id_fkey(name,owner:users!departments_owner_user_id_fkey(name))
`;

function first<T>(relation:T|T[]|null) { return Array.isArray(relation) ? relation[0] : relation; }

@Injectable()
export class AuthService {
  constructor(@Inject(SupabaseService) private readonly supabase:SupabaseService,@Inject(FilesService) private readonly files:FilesService) {}

  private async sessionResponse(row:SystemUserRow, session:Session) {
    return {
      token:session.access_token,
      refreshToken:session.refresh_token,
      expiresAt:session.expires_at ?? 0,
      user:await this.toAuthenticatedUser(row,session.user.id),
    };
  }

  private tokenExpiresAt(accessToken:string) {
    try {
      const payload = JSON.parse(Buffer.from(accessToken.split('.')[1] ?? '', 'base64url').toString()) as {exp?:unknown};
      return typeof payload.exp === 'number' ? payload.exp : 0;
    } catch {
      return 0;
    }
  }

  private async findSystemUser(column:'account'|'auth_user_id', value:string) {
    const {data,error} = await this.supabase.database.from('users').select(systemUserSelect)
      .eq(column,value).is('deleted_at',null).maybeSingle();
    if (error || !data) throw new UnauthorizedException({code:'AUTH_INVALID_CREDENTIALS'});
    const user = data as unknown as SystemUserRow;
    if (user.status === 'disabled') throw new UnauthorizedException({code:'AUTH_ACCOUNT_DISABLED'});
    return user;
  }

  private async accessContext(userId:string):Promise<AccessContext> {
    const {data:assignments,error:roleError} = await this.supabase.database.from('user_roles')
      .select('role_id,role:roles(id,name,code,status,is_system,deleted_at)').eq('user_id',userId);
    if (roleError) throw new UnauthorizedException({code:'AUTH_PERMISSIONS_UNAVAILABLE'});
    const roles = (assignments ?? []).flatMap((assignment):AssignedRole[] => {
      const role = first(assignment.role);
      return role && role.status === 'enabled' && !role.deleted_at
        ? [{id:String(role.id),name:String(role.name),code:String(role.code),isSystem:Boolean(role.is_system)}]
        : [];
    }).sort((a,b) => Number(b.isSystem)-Number(a.isSystem) || a.code.localeCompare(b.code));
    if (!roles.length) return {roles:[],permissionIds:new Set(),permissionCodes:[]};

    const {data:grants,error:permissionError} = await this.supabase.database.from('role_permissions')
      .select('permission:permissions(id,code,status,deleted_at)').in('role_id',roles.map(role=>role.id));
    if (permissionError) throw new UnauthorizedException({code:'AUTH_PERMISSIONS_UNAVAILABLE'});
    const permissions = (grants ?? []).flatMap(grant => {
      const permission = first(grant.permission);
      return permission && permission.status === 'enabled' && !permission.deleted_at
        ? [{id:String(permission.id),code:String(permission.code)}] : [];
    });
    return {
      roles,
      permissionIds:new Set(permissions.map(permission=>permission.id)),
      permissionCodes:[...new Set(permissions.map(permission=>permission.code))].sort(),
    };
  }

  private async menus(permissionIds:Set<string>):Promise<AuthenticatedMenu[]> {
    if (!permissionIds.size) return [];
    const {data,error} = await this.supabase.database.from('menus')
      .select('id,name,code,parent_id,path,icon,component_key,sort_order,i18n_key,required_permission_id')
      .is('deleted_at',null).eq('status','enabled').eq('visible',true).order('sort_order');
    if (error) throw new UnauthorizedException({code:'AUTH_PERMISSIONS_UNAVAILABLE'});
    const rows = data ?? [];
    const byId = new Map(rows.map(menu=>[String(menu.id),menu]));
    const included = new Set(rows.filter(menu=>menu.required_permission_id && permissionIds.has(String(menu.required_permission_id))).map(menu=>String(menu.id)));
    for (const id of [...included]) {
      let parentId = byId.get(id)?.parent_id ? String(byId.get(id)?.parent_id) : '';
      while (parentId && byId.has(parentId)) {
        included.add(parentId);
        parentId = byId.get(parentId)?.parent_id ? String(byId.get(parentId)?.parent_id) : '';
      }
    }
    return rows.filter(menu=>included.has(String(menu.id))).map(menu=>({
      id:String(menu.id),name:String(menu.name),code:String(menu.code??''),parentId:menu.parent_id?String(menu.parent_id):null,
      path:String(menu.path),icon:String(menu.icon??''),componentKey:String(menu.component_key??''),
      sortOrder:Number(menu.sort_order??0),i18nKey:String(menu.i18n_key??''),
    }));
  }

  private async toAuthenticatedUser(row:SystemUserRow, authUserId:string):Promise<AuthenticatedUser> {
    const access = await this.accessContext(row.id);
    const menus = await this.menus(access.permissionIds);
    const role = access.roles[0];
    const department = first(row.department);
    const owner = first(department?.owner ?? null);
    return {
      id:row.id,authUserId,name:row.name,email:row.email??'',account:row.account,phone:row.phone??'',
      employeeNo:row.employee_no??'',jobTitle:row.job_title??'',managerName:row.manager_name??'',
      enterpriseWechat:row.enterprise_wechat??'',emergencyContact:row.emergency_contact??'',officeLocation:row.office_location??'',
      joinedAt:row.joined_at??'',avatarUrl:row.avatar_url??'',gender:row.gender??'',status:row.status,
      department:department?.name??row.department_name??'',departmentOwner:owner?.name??'',
      roleName:role?.name??'',roleCode:role?.code??'',roleId:role?.id??'',roleIds:access.roles.map(item=>item.id),
      roleNames:access.roles.map(item=>item.name),roleCodes:access.roles.map(item=>item.code),
      hasSystemRole:access.roles.some(item=>item.isSystem),
      permissionCodes:access.permissionCodes,tags:row.tags??[],lastLoginAt:row.last_login_at??'',createdAt:row.created_at,
      menuPaths:menus.map(menu=>menu.path),menuKeys:menus.map(menu=>menu.componentKey).filter(Boolean),menus,
    };
  }

  async login(account:string,password:string) {
    const normalizedAccount = account.trim().toLowerCase();
    const systemUser = await this.findSystemUser('account',normalizedAccount);
    if (!systemUser.auth_user_id) throw new UnauthorizedException({code:'AUTH_ACCOUNT_NOT_PROVISIONED'});
    const {data,error} = await this.supabase.createPasswordAuthClient().auth.signInWithPassword({
      email:this.supabase.passwordAuthEmail(normalizedAccount),password,
    });
    if (error || !data.session || data.user.id !== systemUser.auth_user_id) {
      throw new UnauthorizedException({code:'AUTH_INVALID_CREDENTIALS'});
    }
    const loggedInAt = new Date().toISOString();
    await this.supabase.database.from('users').update({last_login_at:loggedInAt}).eq('id',systemUser.id);
    systemUser.last_login_at = loggedInAt;
    return this.sessionResponse(systemUser,data.session);
  }

  async register(dto:RegisterDto) {
    const account = dto.account.trim().toLowerCase();
    const name = dto.name.trim();
    const {data:existing,error:existingError} = await this.supabase.database.from('users').select('id').eq('account',account).maybeSingle();
    if (existingError) throw new InternalServerErrorException({code:'AUTH_REGISTRATION_FAILED'});
    if (existing) throw new ConflictException({code:'AUTH_ACCOUNT_EXISTS'});
    const {data:role,error:roleError} = await this.supabase.database.from('roles').select('id')
      .eq('code','guest').eq('status','enabled').is('deleted_at',null).maybeSingle();
    if (roleError || !role) throw new InternalServerErrorException({code:'AUTH_REGISTRATION_UNAVAILABLE'});
    const {data:authData,error:authError} = await this.supabase.database.auth.admin.createUser({
      email:this.supabase.passwordAuthEmail(account),password:dto.password,email_confirm:true,
      user_metadata:{account,name,business_email:dto.email?.trim()||null},
    });
    if (authError || !authData.user) {
      if (authError?.message.toLowerCase().includes('already')) throw new ConflictException({code:'AUTH_ACCOUNT_EXISTS'});
      throw new InternalServerErrorException({code:'AUTH_REGISTRATION_FAILED'});
    }
    const {data:appUser,error:userError} = await this.supabase.database.from('users').select('id')
      .eq('auth_user_id',authData.user.id).maybeSingle();
    if (userError || !appUser) {
      await this.supabase.database.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException({code:'AUTH_REGISTRATION_FAILED'});
    }
    const {data:assignment,error:assignmentError} = await this.supabase.database.from('user_roles')
      .select('role_id').eq('user_id',appUser.id).eq('role_id',role.id).maybeSingle();
    if (assignmentError || !assignment) {
      await this.supabase.database.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException({code:'AUTH_REGISTRATION_FAILED'});
    }
    return this.login(account,dto.password);
  }

  async refresh(refreshToken:string) {
    const {data,error} = await this.supabase.createPasswordAuthClient().auth.refreshSession({refresh_token:refreshToken});
    if (error || !data.session || !data.user) throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    const systemUser = await this.findSystemUser('auth_user_id',data.user.id);
    return this.sessionResponse(systemUser,data.session);
  }

  async authenticate(accessToken:string) {
    const {data,error} = await this.supabase.database.auth.getUser(accessToken);
    if (error || !data.user) throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    return this.toAuthenticatedUser(await this.findSystemUser('auth_user_id',data.user.id),data.user.id);
  }

  session(accessToken:string, user:AuthenticatedUser) {
    return {
      token:accessToken,
      refreshToken:'',
      expiresAt:this.tokenExpiresAt(accessToken),
      user,
    };
  }

  async logout(accessToken:string) {
    const {error} = await this.supabase.database.auth.admin.signOut(accessToken,'global');
    if (error) throw new UnauthorizedException({code:'AUTH_REQUIRED'});
  }

  async changePassword(current:AuthenticatedUser,password:string) {
    const {error} = await this.supabase.database.auth.admin.updateUserById(current.authUserId,{password});
    if (error) throw new InternalServerErrorException({code:'AUTH_PASSWORD_UPDATE_FAILED'});
  }

  async updateProfile(accessToken:string, current:AuthenticatedUser, patch:{
    name?:string;email?:string;phone?:string;employeeNo?:string;jobTitle?:string;managerName?:string;
    enterpriseWechat?:string;emergencyContact?:string;officeLocation?:string;joinedAt?:string;
  }) {
    const value:Record<string,string|null> = {};
    if (patch.name!==undefined) value.name=patch.name.trim();
    if (patch.email!==undefined) value.email=patch.email.trim()||null;
    if (patch.phone!==undefined) value.phone=patch.phone.trim()||null;
    if (patch.employeeNo!==undefined) value.employee_no=patch.employeeNo.trim()||null;
    if (patch.jobTitle!==undefined) value.job_title=patch.jobTitle.trim()||null;
    if (patch.managerName!==undefined) value.manager_name=patch.managerName.trim()||null;
    if (patch.enterpriseWechat!==undefined) value.enterprise_wechat=patch.enterpriseWechat.trim()||null;
    if (patch.emergencyContact!==undefined) value.emergency_contact=patch.emergencyContact.trim()||null;
    if (patch.officeLocation!==undefined) value.office_location=patch.officeLocation.trim()||null;
    if (patch.joinedAt!==undefined) value.joined_at=patch.joinedAt||null;
    const {data,error} = await this.supabase.database.from('users').update(value).eq('id',current.id)
      .is('deleted_at',null)
      .select('name,email,phone,employee_no,job_title,manager_name,enterprise_wechat,emergency_contact,office_location,joined_at')
      .single();
    if (error) throw new UnauthorizedException({code:'PROFILE_SAVE_FAILED'});
    return {
      token:accessToken,
      refreshToken:'',
      expiresAt:this.tokenExpiresAt(accessToken),
      user:{
        ...current,
        name:data.name,
        email:data.email??'',
        phone:data.phone??'',
        employeeNo:data.employee_no??'',
        jobTitle:data.job_title??'',
        managerName:data.manager_name??'',
        enterpriseWechat:data.enterprise_wechat??'',
        emergencyContact:data.emergency_contact??'',
        officeLocation:data.office_location??'',
        joinedAt:data.joined_at??'',
      },
    };
  }

  async updateAvatar(accessToken:string,current:AuthenticatedUser,file:{originalname:string;mimetype:string;size:number;buffer:Buffer}) {
    await this.files.uploadAvatar(file,current);
    const user=await this.toAuthenticatedUser(await this.findSystemUser('auth_user_id',current.authUserId),current.authUserId);
    return {token:accessToken,refreshToken:'',expiresAt:this.tokenExpiresAt(accessToken),user};
  }
}
