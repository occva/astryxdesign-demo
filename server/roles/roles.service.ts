import {ForbiddenException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {databaseError, pageQuery, type ResourceQuery} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';
import type {CreateRoleDto} from './dto/create-role.dto.js';
import type {UpdateRoleDto} from './dto/update-role.dto.js';

type RoleRow = {
  id: string;
  name: string;
  code: string;
  scope: string | null;
  description: string | null;
  status: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Array<{count?: number}>;
};

const ROLE_SELECT = [
  'id', 'name', 'code', 'scope', 'description', 'status', 'is_system',
  'created_at', 'updated_at', 'permissions:role_permissions(count)',
].join(',');

const SORT_COLUMNS: Record<string, string> = {
  name: 'name',
  code: 'code',
  status: 'status',
  updatedAt: 'updated_at',
};

function toRoleRecord(row: RoleRow) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    scope: row.scope ?? '',
    description: row.description ?? '',
    status: row.status,
    isSystem: row.is_system,
    menuCount: row.permissions?.[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDatabasePatch(dto: UpdateRoleDto) {
  const patch: Record<string, unknown> = {};

  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.code !== undefined) patch.code = dto.code;
  if (dto.description !== undefined) patch.description = dto.description || null;
  if (dto.scope !== undefined) patch.scope = dto.scope || null;
  if (dto.status !== undefined) patch.status = dto.status;

  return patch;
}

@Injectable()
export class RolesService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async findAll(query: ResourceQuery) {
    const {page, pageSize, start} = pageQuery(query);
    let request = this.supabase.database
      .from('roles')
      .select(ROLE_SELECT, {count: 'exact'})
      .is('deleted_at', null);

    if (query.name) request = request.ilike('name', `%${query.name}%`);
    if (query.code) request = request.ilike('code', `%${query.code}%`);
    if (query.status) request = request.eq('status', query.status);
    if (query.updatedAt) {
      const date = query.updatedAt.slice(0, 10);
      request = request
        .gte('updated_at', `${date}T00:00:00.000Z`)
        .lt('updated_at', `${date}T23:59:59.999Z`);
    }

    const {data, error, count} = await request
      .order(SORT_COLUMNS[query.sortKey ?? ''] ?? 'created_at', {ascending: query.sortDirection === 'asc'})
      .range(start, start + pageSize - 1);

    if (error) throw databaseError(error.message, error.code);
    return {
      items: ((data ?? []) as unknown as RoleRow[]).map(toRoleRecord),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async create(dto: CreateRoleDto) {
    const {data, error} = await this.supabase.database
      .from('roles')
      .insert({...toDatabasePatch(dto), status: dto.status ?? 'enabled', is_system: false})
      .select(ROLE_SELECT)
      .single();

    if (error) throw databaseError(error.message, error.code);
    return toRoleRecord(data as unknown as RoleRow);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const {data: existing, error: existingError} = await this.supabase.database
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingError) throw databaseError(existingError.message, existingError.code);
    if (!existing) throw new NotFoundException(`Role ${id} was not found.`);
    if (existing.is_system) throw new ForbiddenException({code: 'SYSTEM_ROLE_PROTECTED'});

    const {data, error} = await this.supabase.database
      .from('roles')
      .update(toDatabasePatch(dto))
      .eq('id', id)
      .is('deleted_at', null)
      .select(ROLE_SELECT)
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`Role ${id} was not found.`);
    return toRoleRecord(data as unknown as RoleRow);
  }

  async remove(id: string) {
    const {data, error} = await this.supabase.database
      .from('roles')
      .update({deleted_at: new Date().toISOString()})
      .eq('id', id)
      .eq('is_system', false)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`Role ${id} was not found or is system-protected.`);
  }
}
