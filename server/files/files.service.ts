import {createHash,randomUUID} from 'node:crypto';
import {BadRequestException,ForbiddenException,Inject,Injectable,NotFoundException} from '@nestjs/common';
import type {AuthenticatedUser} from '../auth/auth.service.js';
import {databaseError,pageQuery,type ResourceQuery} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';
import type {CreateFileLinkDto} from './dto/create-file-link.dto.js';

type UploadedFile={originalname:string;mimetype:string;size:number;buffer:Buffer};
const BUCKET='attachments';
const AVATAR_BUCKET='avatars';
const SORT_COLUMNS:Record<string,string>={originalName:'original_name',mimeType:'mime_type',sizeBytes:'size_bytes',createdAt:'created_at'};

function fileRecord(row:Record<string,any>){return {id:row.id,originalName:decodedOriginalName(row.original_name),mimeType:row.mime_type,sizeBytes:Number(row.size_bytes),status:row.status,uploadedBy:row.uploaded_by_name,createdAt:row.created_at,metadata:row.metadata??{},links:row.links??[]};}

function decodedOriginalName(value:string) {
  if ([...value].some(character => character.charCodeAt(0) > 255)) return value;
  const decoded = Buffer.from(value, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? value : decoded;
}

@Injectable()
export class FilesService {
  constructor(@Inject(SupabaseService) private readonly supabase:SupabaseService){}

  private async visibleUploaderIds(actor:AuthenticatedUser) {
    if(actor.hasSystemRole) return null;
    const {data:owned,error:ownerError}=await this.supabase.database.from('departments').select('id').eq('owner_user_id',actor.id).is('deleted_at',null);
    if(ownerError) throw databaseError(ownerError.message,ownerError.code);
    if(!(owned??[]).length) return [actor.id];
    const departmentIds=(owned??[]).map(item=>String(item.id));
    const {data:members,error:memberError}=await this.supabase.database.from('users').select('id').in('department_id',departmentIds).is('deleted_at',null);
    if(memberError) throw databaseError(memberError.message,memberError.code);
    return [...new Set([actor.id,...(members??[]).map(item=>String(item.id))])];
  }

  private async activeFile(id:string,actor:AuthenticatedUser,requireReady=false){
    const {data,error}=await this.supabase.database.from('files').select('*').eq('id',id).is('deleted_at',null).maybeSingle();
    if(error) throw databaseError(error.message,error.code);
    if(!data) throw new NotFoundException(`File ${id} was not found.`);
    const uploaderIds=await this.visibleUploaderIds(actor);
    if(uploaderIds&&!uploaderIds.includes(String(data.uploaded_by))) throw new ForbiddenException({code:'FILE_SCOPE_DENIED'});
    if(requireReady&&data.status!=='ready') throw new ForbiddenException({code:'FILE_NOT_READY'});
    return data;
  }

  async findAll(query:ResourceQuery,actor:AuthenticatedUser){
    const {page,pageSize,start}=pageQuery(query);
    let request=this.supabase.database.from('files').select('*,links:file_links(id,resource_type,resource_id,field_key,sort_order)',{count:'exact'}).is('deleted_at',null);
    const uploaderIds=await this.visibleUploaderIds(actor);
    if(uploaderIds) request=request.in('uploaded_by',uploaderIds);
    if(query.fileName) request=request.ilike('original_name',`%${query.fileName}%`);
    if(query.mimeType) request=request.ilike('mime_type',`%${query.mimeType}%`);
    const {data,error,count}=await request.order(SORT_COLUMNS[query.sortKey??'']??'created_at',{ascending:query.sortDirection==='asc'}).range(start,start+pageSize-1);
    if(error) throw databaseError(error.message,error.code);
    return {items:(data??[]).map(row=>fileRecord(row)),total:count??0,page,pageSize};
  }

  async upload(file:UploadedFile,actor:AuthenticatedUser){
    const safeName=decodedOriginalName(file.originalname).normalize('NFKC').replace(/[\u0000-\u001f]/g,'').slice(0,255)||'unnamed';
    const extension=safeName.match(/\.[A-Za-z0-9]{1,10}$/)?.[0]?.toLowerCase()??'';
    const date=new Date().toISOString().slice(0,10);
    const objectPath=`${date}/${actor.id}/${randomUUID()}${extension}`;
    const checksum=createHash('sha256').update(file.buffer).digest('hex');
    const {error:uploadError}=await this.supabase.database.storage.from(BUCKET).upload(objectPath,file.buffer,{contentType:file.mimetype||'application/octet-stream',upsert:false});
    if(uploadError) throw databaseError(uploadError.message);
    const {data,error}=await this.supabase.database.from('files').insert({bucket:BUCKET,object_path:objectPath,original_name:safeName,mime_type:file.mimetype||'application/octet-stream',size_bytes:file.size,checksum_sha256:checksum,uploaded_by:actor.id,uploaded_by_name:actor.name}).select('*').single();
    if(error){await this.supabase.database.storage.from(BUCKET).remove([objectPath]);throw databaseError(error.message,error.code);}
    return fileRecord(data);
  }

  async uploadAvatar(file:UploadedFile,actor:AuthenticatedUser) {
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException({code:'AVATAR_IMAGE_REQUIRED'});
    const extension=file.originalname.match(/\.[A-Za-z0-9]{1,10}$/)?.[0]?.toLowerCase()??'';
    const objectPath=`${actor.id}/${randomUUID()}${extension}`;
    const checksum=createHash('sha256').update(file.buffer).digest('hex');
    const storage=this.supabase.database.storage.from(AVATAR_BUCKET);
    const {error:uploadError}=await storage.upload(objectPath,file.buffer,{contentType:file.mimetype,upsert:false});
    if(uploadError) throw databaseError(uploadError.message);
    const {data:fileRow,error:fileError}=await this.supabase.database.from('files').insert({
      bucket:AVATAR_BUCKET,object_path:objectPath,original_name:decodedOriginalName(file.originalname),
      mime_type:file.mimetype,size_bytes:file.size,checksum_sha256:checksum,uploaded_by:actor.id,
      uploaded_by_name:actor.name,metadata:{kind:'user_avatar'},
    }).select('*').single();
    if(fileError){await storage.remove([objectPath]);throw databaseError(fileError.message,fileError.code);}
    const avatarUrl=storage.getPublicUrl(objectPath).data.publicUrl;
    const {error:linkError}=await this.supabase.database.from('file_links').insert({
      file_id:fileRow.id,resource_type:'users',resource_id:actor.id,field_key:'avatarUrl',created_by:actor.id,
    });
    if(linkError){await this.supabase.database.from('files').delete().eq('id',fileRow.id);await storage.remove([objectPath]);throw databaseError(linkError.message,linkError.code);}
    const {error:userError}=await this.supabase.database.from('users').update({avatar_url:avatarUrl}).eq('id',actor.id).is('deleted_at',null);
    if(userError){await this.supabase.database.from('file_links').delete().eq('file_id',fileRow.id);await this.supabase.database.from('files').delete().eq('id',fileRow.id);await storage.remove([objectPath]);throw databaseError(userError.message,userError.code);}
    return {...fileRecord(fileRow),avatarUrl};
  }

  async download(id:string,actor:AuthenticatedUser){
    const file=await this.activeFile(id,actor,true);
    const fileName=decodedOriginalName(file.original_name);
    const {data,error}=await this.supabase.database.storage.from(file.bucket).createSignedUrl(file.object_path,60,{download:fileName});
    if(error||!data) throw databaseError(error?.message??'Could not sign file download.');
    return {url:data.signedUrl,expiresIn:60,fileName};
  }

  async preview(id:string,actor:AuthenticatedUser){
    const file=await this.activeFile(id,actor,true);
    const expiresIn=300;
    const {data,error}=await this.supabase.database.storage.from(file.bucket).createSignedUrl(file.object_path,expiresIn);
    if(error||!data) throw databaseError(error?.message??'Could not sign file preview.');
    return {url:data.signedUrl,expiresIn,fileName:decodedOriginalName(file.original_name),mimeType:file.mime_type};
  }

  async remove(id:string,actor:AuthenticatedUser){
    const file=await this.activeFile(id,actor);
    const {error:markError}=await this.supabase.database.from('files').update({
      status:'deleting',delete_started_at:new Date().toISOString(),delete_error:null,
    }).eq('id',id).is('deleted_at',null);
    if(markError) throw databaseError(markError.message,markError.code);

    const {error:storageError}=await this.supabase.database.storage.from(file.bucket).remove([file.object_path]);
    if(storageError){
      await this.supabase.database.from('files').update({
        status:'delete_failed',delete_error:storageError.message.slice(0,1000),
      }).eq('id',id).is('deleted_at',null);
      throw databaseError(storageError.message);
    }

    const {error:finalizeError}=await this.supabase.database.rpc('finalize_file_delete',{p_file_id:id});
    if(finalizeError){
      await this.supabase.database.from('files').update({
        status:'delete_failed',delete_error:finalizeError.message.slice(0,1000),
      }).eq('id',id).is('deleted_at',null);
      throw databaseError(finalizeError.message,finalizeError.code);
    }
  }

  async link(id:string,dto:CreateFileLinkDto,actor:AuthenticatedUser){
    await this.activeFile(id,actor,true);
    const {data,error}=await this.supabase.database.from('file_links').insert({file_id:id,resource_type:dto.resourceType,resource_id:dto.resourceId,field_key:dto.fieldKey,sort_order:dto.sortOrder??0,created_by:actor.id}).select('*').single();
    if(error) throw databaseError(error.message,error.code);
    return {id:data.id,fileId:data.file_id,resourceType:data.resource_type,resourceId:data.resource_id,fieldKey:data.field_key,sortOrder:data.sort_order,createdAt:data.created_at};
  }

  async unlink(fileId:string,linkId:string,actor:AuthenticatedUser){
    await this.activeFile(fileId,actor);
    const {data,error}=await this.supabase.database.from('file_links').delete().eq('id',linkId).eq('file_id',fileId).select('id').maybeSingle();
    if(error) throw databaseError(error.message,error.code);
    if(!data) throw new NotFoundException(`File link ${linkId} was not found.`);
  }
}
