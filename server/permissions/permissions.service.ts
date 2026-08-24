import {ForbiddenException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {databaseError} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';
import type {ReplacePermissionsDto} from './dto/replace-permissions.dto.js';
import type {AuthenticatedUser} from '../auth/auth.service.js';

@Injectable()
export class PermissionsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  private async findRole(roleId: string) {
    const {data, error} = await this.supabase.database
      .from('roles')
      .select('id,is_system')
      .eq('id', roleId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException({code: 'ROLE_NOT_FOUND'});
    return data;
  }

  async findByRole(roleId: string, actor: AuthenticatedUser) {
    const [
      {data: permissions, error: permissionError},
      {data: role, error: roleError},
    ] = await Promise.all([
      this.supabase.database
        .from('permissions')
        .select('id,code,name,resource,action,description,status,is_system')
        .is('deleted_at', null)
        .eq('status', 'enabled')
        .order('resource')
        .order('action'),
      this.supabase.database
        .from('roles')
        .select('id,grants:role_permissions(permission_id)')
        .eq('id', roleId)
        .is('deleted_at', null)
        .maybeSingle(),
    ]);

    if (permissionError) throw databaseError(permissionError.message, permissionError.code);
    if (roleError) throw databaseError(roleError.message, roleError.code);
    if (!role) throw new NotFoundException({code: 'ROLE_NOT_FOUND'});

    const grantedIds = new Set((role.grants ?? []).map(grant => grant.permission_id));
    return (permissions ?? []).map(permission => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description ?? '',
      isSystem: permission.is_system,
      granted: grantedIds.has(permission.id),
      assignable: actor.hasSystemRole || actor.permissionCodes.includes(permission.code),
    }));
  }

  async replace(roleId: string, dto: ReplacePermissionsDto, actor: AuthenticatedUser) {
    const role = await this.findRole(roleId);
    if (role.is_system) throw new ForbiddenException({code: 'SYSTEM_ROLE_PROTECTED'});
    if (actor.roleIds.includes(roleId)) {
      throw new ForbiddenException({code: 'SELF_ROLE_PERMISSION_CHANGE_DENIED'});
    }

    if (!actor.hasSystemRole) {
      const [{data: permissions, error: permissionError}, {data: grants, error: grantError}] = await Promise.all([
        this.supabase.database
          .from('permissions')
          .select('id,code')
          .is('deleted_at', null)
          .eq('status', 'enabled'),
        this.supabase.database
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', roleId),
      ]);
      if (permissionError) throw databaseError(permissionError.message, permissionError.code);
      if (grantError) throw databaseError(grantError.message, grantError.code);

      const requestedIds = new Set(dto.permissionIds);
      const currentIds = new Set((grants ?? []).map(grant => String(grant.permission_id)));
      const actorPermissions = new Set(actor.permissionCodes);
      const changedRestrictedPermission = (permissions ?? []).some(permission =>
        !actorPermissions.has(String(permission.code))
        && requestedIds.has(String(permission.id)) !== currentIds.has(String(permission.id)),
      );
      if (changedRestrictedPermission) {
        throw new ForbiddenException({code: 'ROLE_PERMISSION_ESCALATION_DENIED'});
      }
    }

    const {error} = await this.supabase.database.rpc('replace_role_permissions', {
      p_role_id: roleId,
      p_permission_ids: dto.permissionIds,
    });

    if (error) throw databaseError(error.message, error.code);
    return {updated: true};
  }
}
