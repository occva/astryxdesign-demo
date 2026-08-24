import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {databaseError, pageQuery, type ResourceQuery} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';
import type {CreateDepartmentDto} from './dto/create-department.dto.js';
import type {UpdateDepartmentDto} from './dto/update-department.dto.js';
import {BadRequestException} from '@nestjs/common';
import Papa from 'papaparse';

type DepartmentRow = {
  id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  parent_name: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  member_count: number | null;
  status: string;
  sort_order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type DepartmentMemberRow = {
  id: string;
  department_id: string | null;
  name: string;
  account: string;
  employee_no: string | null;
  job_title: string | null;
  manager_name: string | null;
  avatar_url: string | null;
  status: 'normal' | 'disabled';
};

const DEPARTMENT_SELECT = [
  'id', 'name', 'code', 'parent_id', 'parent_name', 'owner_user_id',
  'owner_name', 'member_count', 'status', 'sort_order', 'description',
  'created_at', 'updated_at',
].join(',');

const SORT_COLUMNS: Record<string, string> = {
  name: 'name',
  code: 'code',
  status: 'status',
  sortOrder: 'sort_order',
};

function toDepartmentRecord(row: DepartmentRow, memberCount = row.member_count ?? 0) {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? '',
    parentId: row.parent_id,
    parent: row.parent_name || '',
    ownerUserId: row.owner_user_id,
    owner: row.owner_name || '',
    status: row.status,
    sortOrder: row.sort_order,
    members: memberCount,
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDatabasePatch(dto: UpdateDepartmentDto) {
  const patch: Record<string, unknown> = {};

  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.code !== undefined) patch.code = dto.code || null;
  if (dto.parent !== undefined) patch.parent_name = dto.parent || null;
  if (dto.parentId !== undefined) patch.parent_id = dto.parentId || null;
  if (dto.owner !== undefined) patch.owner_name = dto.owner || null;
  if (dto.ownerUserId !== undefined) patch.owner_user_id = dto.ownerUserId || null;
  if (dto.status !== undefined) patch.status = dto.status;
  if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;
  if (dto.description !== undefined) patch.description = dto.description || null;

  return patch;
}

@Injectable()
export class DepartmentsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  private async assertOwnerBelongsToDepartment(departmentId:string, ownerUserId:string) {
    const {data,error}=await this.supabase.database.from('users').select('id')
      .eq('id',ownerUserId).eq('department_id',departmentId).eq('status','normal')
      .is('deleted_at',null).maybeSingle();
    if(error) throw databaseError(error.message,error.code);
    if(!data) throw new BadRequestException({code:'DEPARTMENT_OWNER_NOT_MEMBER'});
  }

  async findAll(query: ResourceQuery) {
    const {page, pageSize, start} = pageQuery(query);
    let request = this.supabase.database
      .from('departments')
      .select(DEPARTMENT_SELECT, {count: 'exact'})
      .is('deleted_at', null);

    if (query.name) request = request.ilike('name', `%${query.name}%`);
    if (query.owner) request = request.ilike('owner_name', `%${query.owner}%`);
    if (query.status) request = request.eq('status', query.status);

    const {data, error, count} = await request
      .order(SORT_COLUMNS[query.sortKey ?? ''] ?? 'sort_order', {ascending: query.sortDirection !== 'desc'})
      .range(start, start + pageSize - 1);

    if (error) throw databaseError(error.message, error.code);
    const departmentRows = (data ?? []) as unknown as DepartmentRow[];
    const memberCounts = await this.departmentMemberCounts(departmentRows.map(row => row.id));
    return {
      items: departmentRows.map(row => toDepartmentRecord(row, memberCounts.get(row.id) ?? 0)),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async create(dto: CreateDepartmentDto) {
    if(dto.ownerUserId) throw new BadRequestException({code:'DEPARTMENT_OWNER_NOT_MEMBER'});
    const {data, error} = await this.supabase.database
      .from('departments')
      .insert({
        ...toDatabasePatch(dto),
        status: dto.status ?? 'enabled',
        sort_order: dto.sortOrder ?? 0,
      })
      .select(DEPARTMENT_SELECT)
      .single();

    if (error) throw databaseError(error.message, error.code);
    return toDepartmentRecord(data as unknown as DepartmentRow);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    if(dto.ownerUserId) await this.assertOwnerBelongsToDepartment(id,dto.ownerUserId);
    const {data, error} = await this.supabase.database
      .from('departments')
      .update(toDatabasePatch(dto))
      .eq('id', id)
      .is('deleted_at', null)
      .select(DEPARTMENT_SELECT)
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`Department ${id} was not found.`);
    return toDepartmentRecord(data as unknown as DepartmentRow);
  }

  async remove(id: string) {
    const {data, error} = await this.supabase.database
      .from('departments')
      .update({deleted_at: new Date().toISOString()})
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw databaseError(error.message, error.code);
    if (!data) throw new NotFoundException(`Department ${id} was not found.`);
  }

  private async allRows() {
    const rows:DepartmentRow[]=[];
    for(let start=0;;start+=1000){
      const {data,error}=await this.supabase.database.from('departments').select(DEPARTMENT_SELECT).is('deleted_at',null).order('sort_order').range(start,start+999);
      if(error) throw databaseError(error.message,error.code);
      rows.push(...((data??[]) as unknown as DepartmentRow[]));
      if((data??[]).length<1000) break;
    }
    return rows;
  }

  private async allDepartmentMembers() {
    const rows: DepartmentMemberRow[] = [];
    for (let start = 0; ; start += 1000) {
      const {data, error} = await this.supabase.database
        .from('users')
        .select('id,department_id,name,account,employee_no,job_title,manager_name,avatar_url,status')
        .is('deleted_at', null)
        .not('department_id', 'is', null)
        .order('name')
        .range(start, start + 999);
      if (error) throw databaseError(error.message, error.code);
      rows.push(...((data ?? []) as unknown as DepartmentMemberRow[]));
      if ((data ?? []).length < 1000) break;
    }
    return rows;
  }

  private async departmentMemberCounts(departmentIds: string[]) {
    const counts = new Map<string, number>();
    if (!departmentIds.length) return counts;
    for (let start = 0; ; start += 1000) {
      const {data, error} = await this.supabase.database
        .from('users')
        .select('department_id')
        .is('deleted_at', null)
        .in('department_id', departmentIds)
        .range(start, start + 999);
      if (error) throw databaseError(error.message, error.code);
      for (const user of data ?? []) {
        if (user.department_id) {
          const departmentId = String(user.department_id);
          counts.set(departmentId, (counts.get(departmentId) ?? 0) + 1);
        }
      }
      if ((data ?? []).length < 1000) break;
    }
    return counts;
  }

  async tree(){
    const [departmentRows, memberRows] = await Promise.all([
      this.allRows(),
      this.allDepartmentMembers(),
    ]);
    const membersByDepartment = new Map<string, DepartmentMemberRow[]>();
    for (const member of memberRows) {
      if (!member.department_id) continue;
      const members = membersByDepartment.get(member.department_id) ?? [];
      members.push(member);
      membersByDepartment.set(member.department_id, members);
    }
    const records=departmentRows.map(row=>toDepartmentRecord(row, membersByDepartment.get(row.id)?.length ?? 0));
    type Person={
      id:string; name:string; account:string; employeeNo:string; jobTitle:string; managerName:string;
      avatarUrl:string|null; status:'normal'|'disabled';
    };
    type Node=ReturnType<typeof toDepartmentRecord>&{people:Person[];totalMembers:number;children:Node[]};
    const nodes=new Map(records.map(record=>[record.id,{
      ...record,
      people:(membersByDepartment.get(record.id) ?? []).map(member=>({
        id:member.id,
        name:member.name,
        account:member.account,
        employeeNo:member.employee_no ?? '',
        jobTitle:member.job_title ?? '',
        managerName:member.manager_name ?? '',
        avatarUrl:member.avatar_url,
        status:member.status,
      })),
      totalMembers:0,
      children:[],
    } as Node]));
    const roots:Node[]=[];
    for(const node of nodes.values()){
      const parent=node.parentId?nodes.get(node.parentId):undefined;
      if(parent) parent.children.push(node); else roots.push(node);
    }
    const sort=(items:Node[])=>{items.sort((a,b)=>a.sortOrder-b.sortOrder||a.name.localeCompare(b.name));items.forEach(item=>sort(item.children));};
    sort(roots);
    const countMembers=(node:Node):number=>{
      node.totalMembers=node.people.length+node.children.reduce((sum,child)=>sum+countMembers(child),0);
      return node.totalMembers;
    };
    roots.forEach(countMembers);
    return {
      items:roots,
      total:records.length,
      enabled:records.filter(item=>item.status==='enabled').length,
      members:records.reduce((sum,item)=>sum+item.members,0),
    };
  }

  async exportCsv(){
    const rows=await this.allRows();
    const codeById=new Map(rows.map(row=>[row.id,row.code??'']));
    const ownerIds=[...new Set(rows.map(row=>row.owner_user_id).filter((id):id is string=>Boolean(id)))];
    const ownerById=new Map<string,string>();
    if(ownerIds.length){const {data,error}=await this.supabase.database.from('users').select('id,account').in('id',ownerIds);if(error) throw databaseError(error.message,error.code);for(const user of data??[]) ownerById.set(String(user.id),String(user.account));}
    const header=['code','name','parentCode','ownerAccount','status','sortOrder','description'];
    const body=rows.map(row=>[row.code,row.name,row.parent_id?codeById.get(row.parent_id):'',row.owner_user_id?ownerById.get(row.owner_user_id):'',row.status,row.sort_order,row.description]);
    return `\uFEFF${Papa.unparse([header,...body],{newline:'\r\n',escapeFormulae:true})}`;
  }

  private parseCsv(csv:string){
    const result=Papa.parse<string[]>(csv,{skipEmptyLines:'greedy'});
    if(result.errors.length){
      throw new BadRequestException({code:'INVALID_CSV',message:result.errors[0]?.message??'CSV could not be parsed.'});
    }
    return result.data;
  }

  async previewImport(csv:string){
    const matrix=this.parseCsv(csv.replace(/^\uFEFF/,''));
    const required=['code','name','parentCode','ownerAccount','status','sortOrder','description'];
    const headers=matrix[0]?.map(value=>value.trim())??[];
    const missing=required.filter(name=>!headers.includes(name));
    if(missing.length) throw new BadRequestException({code:'INVALID_CSV_HEADERS',message:`Missing CSV columns: ${missing.join(', ')}`});
    const index=Object.fromEntries(headers.map((name,position)=>[name,position])) as Record<string,number>;
    const rows=matrix.slice(1).map((values,offset)=>({line:offset+2,code:(values[index.code]??'').trim().toLowerCase(),name:(values[index.name]??'').trim(),parentCode:(values[index.parentCode]??'').trim().toLowerCase(),ownerAccount:(values[index.ownerAccount]??'').trim().toLowerCase(),status:(values[index.status]??'enabled').trim().toLowerCase()||'enabled',sortOrder:Number((values[index.sortOrder]??'0').trim()||0),description:(values[index.description]??'').trim()}));
    const errors:Array<{line:number;field:string;message:string}>=[];
    if(!rows.length) errors.push({line:1,field:'csv',message:'CSV contains no department rows.'});
    const seen=new Map<string,number>();
    for(const row of rows){
      if(!/^[a-z][a-z0-9_-]{0,99}$/.test(row.code)) errors.push({line:row.line,field:'code',message:'Code must start with a letter and contain only letters, numbers, _ or -.'});
      if(!row.name||row.name.length>100) errors.push({line:row.line,field:'name',message:'Name is required and must not exceed 100 characters.'});
      if(row.parentCode===row.code&&row.code) errors.push({line:row.line,field:'parentCode',message:'A department cannot be its own parent.'});
      if(!['enabled','disabled'].includes(row.status)) errors.push({line:row.line,field:'status',message:'Status must be enabled or disabled.'});
      if(!Number.isInteger(row.sortOrder)||row.sortOrder<0) errors.push({line:row.line,field:'sortOrder',message:'Sort order must be a non-negative integer.'});
      if(seen.has(row.code)) errors.push({line:row.line,field:'code',message:`Code duplicates row ${seen.get(row.code)}.`}); else seen.set(row.code,row.line);
    }
    const {data:departments,error:departmentError}=await this.supabase.database.from('departments').select('id,code,parent_id').is('deleted_at',null);
    if(departmentError) throw databaseError(departmentError.message,departmentError.code);
    const {data:users,error:userError}=await this.supabase.database.from('users').select('account').is('deleted_at',null);
    if(userError) throw databaseError(userError.message,userError.code);
    const existingCodes=new Set((departments??[]).map(item=>String(item.code??'')));
    const importedCodes=new Set(rows.map(row=>row.code));
    const userAccounts=new Set((users??[]).map(item=>String(item.account)));
    for(const row of rows){
      if(row.parentCode&&!existingCodes.has(row.parentCode)&&!importedCodes.has(row.parentCode)) errors.push({line:row.line,field:'parentCode',message:`Parent ${row.parentCode} was not found.`});
      if(row.ownerAccount&&!userAccounts.has(row.ownerAccount)) errors.push({line:row.line,field:'ownerAccount',message:`Owner account ${row.ownerAccount} was not found.`});
    }
    const codeById=new Map((departments??[]).map(item=>[String(item.id),String(item.code??'')]));
    const parentByCode=new Map((departments??[]).map(item=>[String(item.code??''),item.parent_id?codeById.get(String(item.parent_id))??'':'']));
    rows.forEach(row=>parentByCode.set(row.code,row.parentCode));
    for(const row of rows){const visited=new Set<string>();let cursor=row.code;while(cursor){if(visited.has(cursor)){errors.push({line:row.line,field:'parentCode',message:'Department hierarchy contains a cycle.'});break;}visited.add(cursor);cursor=parentByCode.get(cursor)??'';}}
    return {total:rows.length,created:rows.filter(row=>!existingCodes.has(row.code)).length,updated:rows.filter(row=>existingCodes.has(row.code)).length,rows,errors:errors.filter((item,position,list)=>list.findIndex(other=>other.line===item.line&&other.field===item.field&&other.message===item.message)===position)};
  }

  async importCsv(csv:string){
    const preview=await this.previewImport(csv);
    if(preview.errors.length) throw new BadRequestException({code:'DEPARTMENT_IMPORT_INVALID',errors:preview.errors});
    const payload=preview.rows.map(({line,...row})=>({...row,sortOrder:row.sortOrder}));
    const {data,error}=await this.supabase.database.rpc('import_departments',{p_rows:payload});
    if(error) throw databaseError(error.message,error.code);
    return data;
  }
}
