import type {AuditLog,DepartmentImportPreview,DepartmentNode,ManagedFile,ResourcePage,ResourceQuery} from '../types';
import {apiRequest,resourceQueryString} from './apiClient';

export const enterpriseApi={
  auditLogs:(query:ResourceQuery)=>apiRequest<ResourcePage<AuditLog>>(`/audit-logs?${resourceQueryString(query)}`),
  files:(query:ResourceQuery)=>apiRequest<ResourcePage<ManagedFile>>(`/files?${resourceQueryString(query)}`),
  uploadFile(file:File){const body=new FormData();body.append('file',file);return apiRequest<ManagedFile>('/files',{method:'POST',body});},
  downloadFile:(id:string)=>apiRequest<{url:string;expiresIn:number;fileName:string}>(`/files/${encodeURIComponent(id)}/download`,{method:'POST'}),
  previewFile:(id:string)=>apiRequest<{url:string;expiresIn:number;fileName:string;mimeType:string}>(`/files/${encodeURIComponent(id)}/preview`,{method:'POST'}),
  deleteFile:(id:string)=>apiRequest<void>(`/files/${encodeURIComponent(id)}`,{method:'DELETE'}),
  departmentTree:()=>apiRequest<{items:DepartmentNode[];total:number;enabled:number;members:number}>('/departments/tree'),
  exportDepartments:()=>apiRequest<string>('/departments/export'),
  previewDepartmentImport:(csv:string)=>apiRequest<DepartmentImportPreview>('/departments/import/preview',{method:'POST',body:JSON.stringify({csv})}),
  importDepartments:(csv:string)=>apiRequest<{created:number;updated:number;total:number}>('/departments/import',{method:'POST',body:JSON.stringify({csv})}),
};
