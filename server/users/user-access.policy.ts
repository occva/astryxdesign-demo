import {ForbiddenException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {databaseError} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';

export type UserMutationActor = {
  id: string;
  permissionCodes: string[];
  hasSystemRole: boolean;
};

export type UserAccessScope = {kind:'all'} | {kind:'departments';departmentIds:string[]} | {kind:'self';userId:string};

type RoleRelation = {
  is_system: boolean;
  status: string;
  deleted_at: string | null;
};

type TargetUser = {
  id: string;
  name: string;
  account: string;
  email: string | null;
  authUserId: string | null;
  departmentId: string | null;
  status: string;
  hasSystemRole: boolean;
};

function first<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

@Injectable()
export class UserAccessPolicy {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  private async targetUser(userId: string): Promise<TargetUser> {
    const {data, error} = await this.supabase.database
      .from('users')
      .select(`
        id,name,account,email,auth_user_id,department_id,status,
        role_assignments:user_roles(role:roles(is_system,status,deleted_at))
      `)
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`User ${userId} was not found.`);
    const hasSystemRole = (data.role_assignments ?? []).some(assignment => {
      const role = first(assignment.role as RoleRelation | RoleRelation[] | null);
      return role?.is_system && role.status === 'enabled' && !role.deleted_at;
    });
    return {
      id: data.id,
      name: data.name,
      account: data.account,
      email: data.email,
      authUserId: data.auth_user_id,
      departmentId: data.department_id,
      status: data.status,
      hasSystemRole,
    };
  }

  async scope(actor:UserMutationActor):Promise<UserAccessScope> {
    if(actor.hasSystemRole) return {kind:'all'};
    const {data,error}=await this.supabase.database.from('departments').select('id')
      .eq('owner_user_id',actor.id).is('deleted_at',null);
    if(error) throw databaseError(error.message,error.code);
    const departmentIds=(data??[]).map(item=>String(item.id));
    return departmentIds.length ? {kind:'departments',departmentIds} : {kind:'self',userId:actor.id};
  }

  async assertTargetAllowed(
    userId: string,
    actor: UserMutationActor,
    options: {allowSelf?: boolean} = {},
  ) {
    if (options.allowSelf === false && userId === actor.id) {
      throw new ForbiddenException({code: 'SELF_DELETE_DENIED'});
    }

    const target = await this.targetUser(userId);
    if (target.hasSystemRole && !actor.hasSystemRole) {
      throw new ForbiddenException({code: 'SYSTEM_USER_PROTECTED'});
    }
    const scope=await this.scope(actor);
    const allowed=scope.kind==='all'||target.id===actor.id||(scope.kind==='departments'&&Boolean(target.departmentId)&&scope.departmentIds.includes(target.departmentId!));
    if(!allowed) throw new ForbiddenException({code:'USER_SCOPE_DENIED'});
    return target;
  }

  async assertCreateAllowed(departmentId:string|null|undefined,actor:UserMutationActor) {
    const scope=await this.scope(actor);
    if(scope.kind==='all') return;
    if(scope.kind==='departments'&&departmentId&&scope.departmentIds.includes(departmentId)) return;
    throw new ForbiddenException({code:'USER_SCOPE_DENIED'});
  }

  async assertRoleAssignmentAllowed(roleIds: string[] | undefined, actor: UserMutationActor) {
    if (roleIds === undefined) return;
    if (!actor.permissionCodes.includes('users.assign_roles')) {
      throw new ForbiddenException({code: 'ROLE_ASSIGNMENT_DENIED'});
    }
    if (roleIds.length === 0) return;

    const {data: roles, error} = await this.supabase.database
      .from('roles')
      .select('id,is_system')
      .in('id', roleIds)
      .eq('status', 'enabled')
      .is('deleted_at', null);

    if (error) throw databaseError(error.message, error.code);
    if ((roles ?? []).length !== new Set(roleIds).size) throw new NotFoundException({code: 'ASSIGNABLE_ROLE_NOT_FOUND'});
    if ((roles ?? []).some(role => role.is_system) && !actor.hasSystemRole) {
      throw new ForbiddenException({code: 'SYSTEM_ROLE_ASSIGNMENT_DENIED'});
    }

    const {data: grants, error: grantError} = await this.supabase.database
      .from('role_permissions')
      .select('permission:permissions(code,status,deleted_at)')
      .in('role_id', roleIds);
    if (grantError) throw databaseError(grantError.message, grantError.code);

    const actorPermissions = new Set(actor.permissionCodes);
    const exceedsActorAccess = (grants ?? []).some(grant => {
      const permission = first(grant.permission);
      return permission
        && permission.status === 'enabled'
        && !permission.deleted_at
        && !actorPermissions.has(permission.code);
    });
    if (exceedsActorAccess) {
      throw new ForbiddenException({code: 'ROLE_PERMISSION_ESCALATION_DENIED'});
    }
  }

  async assignableRoles(actor: UserMutationActor) {
    const {data: roles, error} = await this.supabase.database
      .from('roles')
      .select('id,name,code,is_system')
      .eq('status', 'enabled')
      .is('deleted_at', null)
      .order('name');
    if (error) throw databaseError(error.message, error.code);
    if (actor.hasSystemRole || !(roles ?? []).length) return roles ?? [];

    const roleIds = (roles ?? []).filter(role => !role.is_system).map(role => String(role.id));
    if (!roleIds.length) return [];
    const {data: grants, error: grantError} = await this.supabase.database
      .from('role_permissions')
      .select('role_id,permission:permissions(code,status,deleted_at)')
      .in('role_id', roleIds);
    if (grantError) throw databaseError(grantError.message, grantError.code);
    const actorPermissions = new Set(actor.permissionCodes);
    const inaccessibleRoleIds = new Set((grants ?? []).flatMap(grant => {
      const permission = first(grant.permission);
      return permission && permission.status === 'enabled' && !permission.deleted_at && !actorPermissions.has(permission.code)
        ? [String(grant.role_id)]
        : [];
    }));
    return (roles ?? []).filter(role => !role.is_system && !inaccessibleRoleIds.has(String(role.id)));
  }
}
