import {Inject, Injectable, Logger} from '@nestjs/common';
import {databaseError,pageQuery, type ResourceQuery} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';
import type {AuthenticatedUser} from '../auth/auth.service.js';

type AuditInput = {
  actor: AuthenticatedUser; action: string; resourceType: string; resourceId?: string;
  requestMethod: string; requestPath: string; requestId: string; status: 'succeeded' | 'failed';
  statusCode: number; changes: unknown; ipAddress?: string; userAgent?: string; errorCode?: string;
};

const SORT_COLUMNS:Record<string,string>={occurredAt:'occurred_at',actorName:'actor_name',action:'action',resourceType:'resource_type',status:'status'};

@Injectable()
export class AuditService {
  private readonly logger=new Logger(AuditService.name);
  constructor(@Inject(SupabaseService) private readonly supabase:SupabaseService) {}

  async record(input:AuditInput) {
    try {
      const {error}=await this.supabase.database.from('audit_logs').insert({
        actor_user_id:input.actor.id,actor_name:input.actor.name,actor_account:input.actor.account,
        action:input.action,resource_type:input.resourceType,resource_id:input.resourceId||null,
        request_method:input.requestMethod,request_path:input.requestPath,request_id:input.requestId,
        status:input.status,status_code:input.statusCode,changes:input.changes,ip_address:input.ipAddress||null,
        user_agent:input.userAgent||null,error_code:input.errorCode||null,
      });
      if(error) this.logger.error(`Could not persist audit ${input.requestId}: ${error.message}`);
    } catch(error) {
      this.logger.error(`Could not persist audit ${input.requestId}: ${error instanceof Error?error.message:String(error)}`);
    }
  }

  async findAll(query:ResourceQuery) {
    const {page,pageSize,start}=pageQuery(query);
    let request=this.supabase.database.from('audit_logs').select('*',{count:'exact'});
    if(query.actor) request=request.ilike('actor_name',`%${query.actor}%`);
    if(query.resourceType) request=request.eq('resource_type',query.resourceType);
    if(query.action) request=request.eq('action',query.action);
    if(query.status) request=request.eq('status',query.status);
    if(query.from) request=request.gte('occurred_at',query.from);
    if(query.to) request=request.lte('occurred_at',query.to);
    const {data,error,count}=await request.order(SORT_COLUMNS[query.sortKey??'']??'occurred_at',{ascending:query.sortDirection==='asc'}).range(start,start+pageSize-1);
    if(error) throw databaseError(error.message,error.code);
    return {items:(data??[]).map(row=>({
      id:row.id,occurredAt:row.occurred_at,actorUserId:row.actor_user_id,actorName:row.actor_name,
      actorAccount:row.actor_account,action:row.action,resourceType:row.resource_type,resourceId:row.resource_id,
      requestMethod:row.request_method,requestPath:row.request_path,requestId:row.request_id,status:row.status,
      statusCode:row.status_code,changes:row.changes,ipAddress:row.ip_address,userAgent:row.user_agent,errorCode:row.error_code,
    })),total:count??0,page,pageSize};
  }
}
