import {randomUUID} from 'node:crypto';
import {isIP} from 'node:net';
import {CallHandler,ExecutionContext,Inject,Injectable,NestInterceptor} from '@nestjs/common';
import {catchError,from,map,mergeMap,throwError} from 'rxjs';
import type {AuthenticatedUser} from '../auth/auth.service.js';
import {AuditService} from './audit.service.js';

const WRITE_METHODS=new Set(['POST','PUT','PATCH','DELETE']);
const SENSITIVE_KEY=/(password|token|secret|authorization|cookie|signedurl|^url$)/i;

function sanitize(value:unknown,depth=0):unknown {
  if(depth>6) return '[TRUNCATED]';
  if(typeof value==='string') return value.length>2000?`${value.slice(0,2000)}…`:value;
  if(typeof value==='number'||typeof value==='boolean'||value===null||value===undefined) return value;
  if(Buffer.isBuffer(value)) return `[BINARY ${value.length} bytes]`;
  if(Array.isArray(value)) return value.slice(0,100).map(item=>sanitize(item,depth+1));
  if(typeof value==='object') return Object.fromEntries(Object.entries(value as Record<string,unknown>).slice(0,100).map(([key,item])=>[key,SENSITIVE_KEY.test(key)?'[REDACTED]':sanitize(item,depth+1)]));
  return String(value);
}

function auditCoordinates(method:string,path:string,params:Record<string,string>) {
  const segments=path.split('?')[0].replace(/^\/api\//,'').split('/').filter(Boolean);
  let resourceType=(segments[0]??'unknown').replace(/-/g,'_');
  let action=method==='POST'?'create':method==='PATCH'?'update':method==='DELETE'?'delete':'update';
  if(resourceType==='files'&&method==='POST'&&segments.length===1) action='upload';
  if(resourceType==='auth'&&segments.includes('avatar')){resourceType='files';action='upload';}
  if(segments.includes('download')) action='download';
  if(segments.includes('preview')) action='preview';
  if(segments.includes('import')) action='import';
  if(segments.includes('read-all')||segments.includes('read')) action='mark_read';
  if(segments.includes('permissions')) action='assign_permissions';
  if(segments.includes('password')||segments.includes('auth')) action='manage_auth';
  return {resourceType,action,resourceId:params.id??(segments[1]?.match(/^[0-9a-f-]{36}$/i)?segments[1]:undefined)};
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(AuditService) private readonly audit:AuditService) {}
  intercept(context:ExecutionContext,next:CallHandler) {
    const http=context.switchToHttp();
    const request=http.getRequest<{method:string;originalUrl?:string;url:string;body?:unknown;params?:Record<string,string>;headers:Record<string,string|undefined>;ip?:string;authUser?:AuthenticatedUser}>();
    const response=http.getResponse<{statusCode:number;setHeader(name:string,value:string):void}>();
    if(!WRITE_METHODS.has(request.method)||!request.authUser) return next.handle();
    const requestId=request.headers['x-request-id']?.match(/^[0-9a-f-]{36}$/i)?.[0]??randomUUID();
    response.setHeader('X-Request-Id',requestId);
    const path=request.originalUrl??request.url;
    const coordinates=auditCoordinates(request.method,path,request.params??{});
    const candidateIp=(request.headers['x-forwarded-for']?.split(',')[0]??request.ip??'').trim().replace(/^::ffff:/,'');
    const base={actor:request.authUser,...coordinates,requestMethod:request.method,requestPath:path,requestId,
      ipAddress:isIP(candidateIp)?candidateIp:undefined,userAgent:request.headers['user-agent']};
    return next.handle().pipe(
      mergeMap(result=>from(this.audit.record({...base,status:'succeeded',statusCode:response.statusCode,changes:{request:sanitize(request.body),response:sanitize(result)}})).pipe(map(()=>result))),
      catchError(error=>{
        const statusCode=typeof error?.getStatus==='function'?error.getStatus():500;
        const payload=typeof error?.getResponse==='function'?error.getResponse():undefined;
        const errorCode=typeof payload==='object'&&payload&&'code' in payload?String(payload.code):undefined;
        return from(this.audit.record({...base,status:'failed',statusCode,errorCode,changes:{request:sanitize(request.body),error:sanitize(payload)}})).pipe(mergeMap(()=>throwError(()=>error)));
      }),
    );
  }
}
