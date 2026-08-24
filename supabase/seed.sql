-- Initial/reference data only. Schema DDL lives in migrations/202608180003_schema.sql.
begin;

insert into public.roles(id,name,code,description,status,is_system,scope) values
  ('02000000-0000-0000-0000-000000000001','Super Administrator','admin','系统超级管理员','enabled',true,'全部资源和数据'),
  ('02000000-0000-0000-0000-000000000002','Operator','operator','日常运营角色','enabled',false,'仪表盘和用户管理'),
  ('02000000-0000-0000-0000-000000000003','Finance','finance','财务角色','enabled',false,'仪表盘和财务数据'),
  ('02000000-0000-0000-0000-000000000004','Guest','guest','访客角色','enabled',false,'仪表盘')
on conflict(id) do nothing;

insert into public.permissions(id,code,name,resource,action,description,status,is_system) values
  ('05000000-0000-0000-0000-000000000001','dashboard.read','查看仪表盘','dashboard','read','查看仪表盘指标和动态。','enabled',true),
  ('05000000-0000-0000-0000-000000000002','users.read','查看用户','users','read','查看用户记录。','enabled',true),
  ('05000000-0000-0000-0000-000000000003','users.create','创建用户','users','create','创建用户记录。','enabled',true),
  ('05000000-0000-0000-0000-000000000004','users.update','修改用户','users','update','修改用户记录。','enabled',true),
  ('05000000-0000-0000-0000-000000000005','users.delete','删除用户','users','delete','软删除用户记录。','enabled',true),
  ('05000000-0000-0000-0000-000000000006','users.assign_roles','分配用户角色','users','assign_roles','为用户分配角色。','enabled',true),
  ('05000000-0000-0000-0000-000000000007','roles.read','查看角色','roles','read','查看角色。','enabled',true),
  ('05000000-0000-0000-0000-000000000008','roles.create','创建角色','roles','create','创建角色。','enabled',true),
  ('05000000-0000-0000-0000-000000000009','roles.update','修改角色','roles','update','修改角色。','enabled',true),
  ('05000000-0000-0000-0000-000000000010','roles.delete','删除角色','roles','delete','软删除角色。','enabled',true),
  ('05000000-0000-0000-0000-000000000011','role_permissions.read','查看角色权限','role_permissions','read','查看角色权限。','enabled',true),
  ('05000000-0000-0000-0000-000000000012','role_permissions.manage','管理角色权限','role_permissions','manage','整体替换角色权限。','enabled',true),
  ('05000000-0000-0000-0000-000000000013','departments.read','查看部门','departments','read','查看部门。','enabled',true),
  ('05000000-0000-0000-0000-000000000014','departments.create','创建部门','departments','create','创建部门。','enabled',true),
  ('05000000-0000-0000-0000-000000000015','departments.update','修改部门','departments','update','修改部门。','enabled',true),
  ('05000000-0000-0000-0000-000000000016','departments.delete','删除部门','departments','delete','软删除部门。','enabled',true),
  ('05000000-0000-0000-0000-000000000017','menus.read','查看菜单','menus','read','查看菜单配置。','enabled',true),
  ('05000000-0000-0000-0000-000000000018','menus.create','创建菜单','menus','create','创建菜单。','enabled',true),
  ('05000000-0000-0000-0000-000000000019','menus.update','修改菜单','menus','update','修改菜单。','enabled',true),
  ('05000000-0000-0000-0000-000000000020','menus.delete','删除菜单','menus','delete','软删除菜单。','enabled',true),
  ('05000000-0000-0000-0000-000000000021','notifications.read','查看通知','notifications','read','查看通知。','enabled',true),
  ('05000000-0000-0000-0000-000000000022','notifications.update','更新通知状态','notifications','update','标记通知已读。','enabled',true),
  ('05000000-0000-0000-0000-000000000023','users.manage_auth','管理用户登录账号','users','manage_auth','开通用户登录账号或重置密码。','enabled',true),
  ('05000000-0000-0000-0000-000000000024','audit_logs.read','查看审计日志','audit_logs','read','查看不可变操作审计记录。','enabled',true),
  ('05000000-0000-0000-0000-000000000025','files.read','查看文件','files','read','查看文件元数据和附件关系。','enabled',true),
  ('05000000-0000-0000-0000-000000000026','files.upload','上传文件','files','upload','向私有附件空间上传文件。','enabled',true),
  ('05000000-0000-0000-0000-000000000027','files.download','下载文件','files','download','获取文件的短时下载地址。','enabled',true),
  ('05000000-0000-0000-0000-000000000028','files.delete','删除文件','files','delete','删除文件对象并软删除元数据。','enabled',true),
  ('05000000-0000-0000-0000-000000000029','files.link','绑定文件','files','link','将文件绑定或解绑到业务资源字段。','enabled',true),
  ('05000000-0000-0000-0000-000000000030','departments.import','导入部门','departments','import','预检并批量导入组织架构。','enabled',true)
on conflict(id) do nothing;

insert into public.users(
  id,name,account,email,status,phone,gender,tags,department_id,department_name,created_at,
  employee_no,job_title,manager_name,enterprise_wechat,emergency_contact,office_location,joined_at
) values
  ('01000000-0000-0000-0000-000000000007','System Administrator','admin','admin@example.com','normal',null,null,array['System'],null,null,now(),'ADMIN-001','系统管理员',null,'admin',null,null,null)
on conflict(id) do nothing;

insert into public.user_roles(user_id,role_id) values
  ('01000000-0000-0000-0000-000000000007','02000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into public.menus(id,name,code,parent_id,path,icon,component_key,required_permission_id,status,visible,sort_order,sort_key,i18n_key) values
  ('04000000-0000-0000-0000-000000000001','Dashboard','dashboard',null,'/home','ChartBarIcon','dashboard','05000000-0000-0000-0000-000000000001','enabled',true,1,'1','menus:dashboard'),
  ('04000000-0000-0000-0000-000000000003','System Management','system',null,'/system','GearSixIcon',null,null,'enabled',true,3,'3','menus:system'),
  ('04000000-0000-0000-0000-000000000004','User Management','users','04000000-0000-0000-0000-000000000003','/system/user','UsersIcon','users','05000000-0000-0000-0000-000000000002','enabled',true,4,'3-1','menus:users'),
  ('04000000-0000-0000-0000-000000000005','Role Management','roles','04000000-0000-0000-0000-000000000003','/system/role','UserGearIcon','roles','05000000-0000-0000-0000-000000000007','enabled',true,5,'3-2','menus:roles'),
  ('04000000-0000-0000-0000-000000000006','组织架构','departments','04000000-0000-0000-0000-000000000003','/system/department','TreeStructureIcon','organization','05000000-0000-0000-0000-000000000013','enabled',true,6,'3-3','menus:departments'),
  ('04000000-0000-0000-0000-000000000007','菜单管理','menus','04000000-0000-0000-0000-000000000003','/system/menu','ListBulletsIcon','menus','05000000-0000-0000-0000-000000000017','enabled',true,7,'3-4','menus:menus'),
  ('04000000-0000-0000-0000-000000000008','审计日志','audit_logs','04000000-0000-0000-0000-000000000003','/system/audit','ClipboardTextIcon','audit_logs','05000000-0000-0000-0000-000000000024','enabled',true,8,'3-5','menus:auditLogs'),
  ('04000000-0000-0000-0000-000000000009','文件管理','files','04000000-0000-0000-0000-000000000003','/system/files','FolderIcon','files','05000000-0000-0000-0000-000000000025','enabled',true,9,'3-6','menus:files')
on conflict(id) do nothing;

-- System administrator gets every action.
insert into public.role_permissions(role_id,permission_id)
select '02000000-0000-0000-0000-000000000001',id from public.permissions on conflict do nothing;
-- Operator: daily user maintenance without role assignment or Auth account control.
delete from public.role_permissions
where role_id='02000000-0000-0000-0000-000000000002'
  and permission_id in(select id from public.permissions where code in('users.assign_roles','users.manage_auth'));
insert into public.role_permissions(role_id,permission_id)
select '02000000-0000-0000-0000-000000000002',id from public.permissions
where code in(
  'dashboard.read','users.read','users.create','users.update','users.delete',
  'notifications.read','notifications.update'
) on conflict do nothing;
-- Finance and Guest retain their former dashboard/notification access.
insert into public.role_permissions(role_id,permission_id)
select role_id,permission.id
from (values
  ('02000000-0000-0000-0000-000000000003'::uuid),
  ('02000000-0000-0000-0000-000000000004'::uuid)
) role(role_id)
cross join public.permissions permission
where permission.resource in('dashboard','notifications') on conflict do nothing;

insert into public.dashboard_metrics(id,label,value,delta,tone,sort_order,i18n_key) values
  ('20000000-0000-0000-0000-000000000001','Visits','86,420','+12.8%','positive',1,'dashboard:content.metrics.visits'),
  ('20000000-0000-0000-0000-000000000002','Revenue','$128,430','+8.4%','positive',2,'dashboard:content.metrics.revenue'),
  ('20000000-0000-0000-0000-000000000003','New users','2,846','+6.1%','positive',3,'dashboard:content.metrics.newUsers'),
  ('20000000-0000-0000-0000-000000000004','Conversion rate','12.6%','-1.2%','negative',4,'dashboard:content.metrics.conversionRate')
on conflict(id) do nothing;

insert into public.dashboard_trends(id,label,value,target,sort_order,i18n_key)
select ('30000000-0000-0000-0000-'||lpad(month_no::text,12,'0'))::uuid,label,value,target,month_no,
  'dashboard:content.months.'||lower(label)
from (values
  (1,'Jan',42,50),(2,'Feb',58,54),(3,'Mar',36,48),(4,'Apr',64,58),(5,'May',72,62),(6,'Jun',54,60),
  (7,'Jul',88,70),(8,'Aug',76,72),(9,'Sep',92,78),(10,'Oct',80,74),(11,'Nov',98,82),(12,'Dec',86,80)
) trend(month_no,label,value,target)
on conflict(id) do nothing;

insert into public.dashboard_modules(id,label,value,capacity,color,sort_order,i18n_key) values
  ('40000000-0000-0000-0000-000000000002','System configuration',22,100,'teal',2,'dashboard:content.modules.systemConfiguration'),
  ('40000000-0000-0000-0000-000000000003','Chart views',10,100,'orange',3,'dashboard:content.modules.chartViews')
on conflict(id) do nothing;

insert into public.dashboard_activities(id,title,description,occurred_at,status,sort_order,i18n_key) values
  ('50000000-0000-0000-0000-000000000002','Role permissions need review','The Operator role requested user search access.',now()-interval '28 minutes','warning',2,'dashboard:content.activities.roleReview'),
  ('50000000-0000-0000-0000-000000000003','Department headcount changed','Content Center now has more than 50 members; consider creating subdepartments.',now()-interval '1 hour','accent',3,'dashboard:content.activities.departmentChanged'),
  ('50000000-0000-0000-0000-000000000004','Menu configuration changed','A new System Management menu item is awaiting publication approval.',now()-interval '2 hours','neutral',4,'dashboard:content.activities.menuChanged')
on conflict(id) do nothing;

insert into public.notifications(id,title,description,status,created_at,i18n_key) values
  ('60000000-0000-0000-0000-000000000001','Role permissions need review','The Operator role requested user search access.','warning',now()-interval '28 minutes','notifications:content.roleReview'),
  ('60000000-0000-0000-0000-000000000002','Menu configuration changed','A new System Management menu item is awaiting publication approval.','info',now()-interval '2 hours','notifications:content.menuChanged')
on conflict(id) do nothing;

commit;
