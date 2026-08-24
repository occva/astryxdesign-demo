import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {databaseError, pageQuery, type ResourceQuery} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';
import type {CreateMenuDto} from './dto/create-menu.dto.js';
import type {UpdateMenuDto} from './dto/update-menu.dto.js';

type MenuRow = {
  id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  path: string;
  icon: string | null;
  component_key: string | null;
  required_permission_id: string | null;
  status: string;
  visible: boolean;
  sort_order: number;
  sort_key: string | null;
  created_at: string;
  updated_at: string;
  parent?: {name: string} | null;
};

const MENU_SELECT = [
  'id', 'name', 'code', 'parent_id', 'path', 'icon', 'component_key',
  'required_permission_id', 'status', 'visible', 'sort_order', 'sort_key',
  'created_at', 'updated_at',
].join(',');

const SORT_COLUMNS: Record<string, string> = {
  name: 'name',
  path: 'path',
  status: 'status',
  sortOrder: 'sort_order',
  sort: 'sort_key',
};

function toMenuRecord(row: MenuRow) {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? '',
    parentId: row.parent_id,
    parent: row.parent?.name ?? '',
    path: row.path,
    icon: row.icon,
    componentKey: row.component_key ?? '',
    requiredPermissionId: row.required_permission_id,
    status: row.status,
    visible: row.visible,
    sortOrder: row.sort_order,
    sort: row.sort_key ?? String(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDatabasePatch(dto: UpdateMenuDto) {
  const patch: Record<string, unknown> = {};

  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.code !== undefined) patch.code = dto.code || null;
  if (dto.parentId !== undefined) patch.parent_id = dto.parentId || null;
  if (dto.path !== undefined) patch.path = dto.path;
  if (dto.icon !== undefined) patch.icon = dto.icon || '';
  if (dto.componentKey !== undefined) patch.component_key = dto.componentKey || null;
  if (dto.status !== undefined) patch.status = dto.status;
  if (dto.visible !== undefined) patch.visible = dto.visible;
  if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;
  if (dto.sort !== undefined) patch.sort_key = dto.sort || null;

  return patch;
}

@Injectable()
export class MenusService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  private async withParentNames(rows: MenuRow[]) {
    const parentIds = [...new Set(rows.map(row => row.parent_id).filter((id): id is string => Boolean(id)))];
    if (!parentIds.length) return rows;
    const {data, error} = await this.supabase.database
      .from('menus')
      .select('id,name')
      .in('id', parentIds)
      .is('deleted_at', null);
    if (error) throw databaseError(error.message, error.code);
    const parentById = new Map((data ?? []).map(parent => [String(parent.id), String(parent.name)]));
    return rows.map(row => ({
      ...row,
      parent: row.parent_id ? {name: parentById.get(row.parent_id) ?? ''} : null,
    }));
  }

  private async permissionId(componentKey: string | undefined) {
    if (!componentKey) return null;
    const permissionResource = componentKey === 'organization' ? 'departments' : componentKey;

    const {data, error} = await this.supabase.database
      .from('permissions')
      .select('id')
      .eq('code', `${permissionResource}.read`)
      .eq('status', 'enabled')
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException({code: 'MENU_PERMISSION_NOT_FOUND'});
    return data.id;
  }

  async findAll(query: ResourceQuery) {
    const {page, pageSize, start} = pageQuery(query);
    let request = this.supabase.database
      .from('menus')
      .select(MENU_SELECT, {count: 'exact'})
      .is('deleted_at', null);

    if (query.name) request = request.ilike('name', `%${query.name}%`);
    if (query.path) request = request.ilike('path', `%${query.path}%`);
    if (query.status) request = request.eq('status', query.status);

    const {data, error, count} = await request
      .order(SORT_COLUMNS[query.sortKey ?? ''] ?? 'sort_order', {ascending: query.sortDirection !== 'desc'})
      .order('id', {ascending: true})
      .range(start, start + pageSize - 1);

    if (error) throw databaseError(error.message, error.code);
    const rows = await this.withParentNames((data ?? []) as unknown as MenuRow[]);
    return {
      items: rows.map(toMenuRecord),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async create(dto: CreateMenuDto) {
    const value = {
      ...toDatabasePatch(dto),
      required_permission_id: await this.permissionId(dto.componentKey),
      icon: dto.icon ?? '',
      status: dto.status ?? 'enabled',
      visible: dto.visible ?? true,
      sort_order: dto.sortOrder ?? 0,
    };
    const {data, error} = await this.supabase.database
      .from('menus')
      .insert(value)
      .select(MENU_SELECT)
      .single();

    if (error) throw databaseError(error.message, error.code);
    const [row] = await this.withParentNames([data as unknown as MenuRow]);
    return toMenuRecord(row);
  }

  async update(id: string, dto: UpdateMenuDto) {
    const {data: existing, error: existingError} = await this.supabase.database
      .from('menus')
      .select('name')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingError) throw databaseError(existingError.message, existingError.code);
    if (!existing) throw new NotFoundException(`Menu ${id} was not found.`);

    const value = toDatabasePatch(dto);
    if (dto.name !== undefined && dto.name.trim() !== existing.name) value.i18n_key = null;
    if (dto.componentKey !== undefined) {
      value.required_permission_id = await this.permissionId(dto.componentKey);
    }

    const {data, error} = await this.supabase.database
      .from('menus')
      .update(value)
      .eq('id', id)
      .is('deleted_at', null)
      .select(MENU_SELECT)
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`Menu ${id} was not found.`);
    const [row] = await this.withParentNames([data as unknown as MenuRow]);
    return toMenuRecord(row);
  }

  async remove(id: string) {
    const {data, error} = await this.supabase.database
      .from('menus')
      .update({deleted_at: new Date().toISOString()})
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`Menu ${id} was not found.`);
  }
}
