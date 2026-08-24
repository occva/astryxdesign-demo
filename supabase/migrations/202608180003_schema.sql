-- Kumo Admin final baseline schema.
-- This file contains DDL only. Initial/reference data lives in supabase/seed.sql.

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  description text,
  status text not null default 'enabled' check (status in ('enabled','disabled')),
  is_system boolean not null default false,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint roles_name_not_blank check (btrim(name) <> ''),
  constraint roles_code_not_blank check (btrim(code) <> ''),
  constraint roles_name_length check (char_length(btrim(name)) <= 100),
  constraint roles_code_format check (btrim(code) ~ '^[A-Za-z][A-Za-z0-9_-]{0,99}$')
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  resource text not null,
  action text not null,
  description text,
  status text not null default 'enabled' check (status in ('enabled','disabled')),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint permissions_code_format check (code ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint permissions_resource_format check (resource ~ '^[a-z][a-z0-9_]*$'),
  constraint permissions_action_format check (action ~ '^[a-z][a-z0-9_]*$')
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  parent_id uuid references public.departments(id),
  owner_user_id uuid,
  status text not null default 'enabled' check (status in ('enabled','disabled')),
  sort_order integer not null default 0,
  description text,
  parent_name text,
  owner_name text,
  member_count integer not null default 0 check (member_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint departments_name_not_blank check (btrim(name) <> ''),
  constraint departments_code_not_blank check (code is null or btrim(code) <> ''),
  constraint departments_name_length check (char_length(btrim(name)) <= 100),
  constraint departments_code_format check (code is null or btrim(code) ~ '^[A-Za-z][A-Za-z0-9_-]{0,99}$')
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  account text not null,
  email text,
  phone text,
  avatar_url text,
  gender text,
  status text not null default 'normal' check (status in ('normal','disabled')),
  department_id uuid references public.departments(id) on delete set null,
  department_name text,
  tags text[],
  last_login_at timestamptz,
  employee_no text,
  job_title text,
  manager_name text,
  enterprise_wechat text,
  emergency_contact text,
  office_location text,
  joined_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_name_not_blank check (btrim(name) <> ''),
  constraint users_account_not_blank check (btrim(account) <> ''),
  constraint users_name_length check (char_length(btrim(name)) <= 100),
  constraint users_account_format check (deleted_at is not null or btrim(account) ~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$'),
  constraint users_email_not_blank check (email is null or btrim(email) <> ''),
  constraint users_email_length check (email is null or char_length(btrim(email)) <= 254)
);

alter table public.departments
  add constraint departments_owner_user_id_fkey
  foreign key (owner_user_id) references public.users(id) on delete set null;

create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,role_id)
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id,permission_id)
);

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  parent_id uuid references public.menus(id),
  path text not null,
  icon text not null,
  component_key text,
  required_permission_id uuid references public.permissions(id) on delete set null,
  status text not null default 'enabled' check (status in ('enabled','disabled')),
  visible boolean not null default true,
  sort_order integer not null default 0,
  sort_key text,
  i18n_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint menus_name_not_blank check (btrim(name) <> ''),
  constraint menus_code_not_blank check (code is null or btrim(code) <> ''),
  constraint menus_path_not_blank check (btrim(path) <> ''),
  constraint menus_name_length check (char_length(btrim(name)) <= 100),
  constraint menus_code_format check (code is null or btrim(code) ~ '^[A-Za-z][A-Za-z0-9_-]{0,99}$'),
  constraint menus_path_format check (char_length(btrim(path)) <= 300 and btrim(path) ~ '^/')
);

create table public.dashboard_metrics (
  id uuid primary key default gen_random_uuid(), label text not null, value text not null, delta text not null,
  tone text not null check (tone in ('positive','negative','neutral')), sort_order integer not null default 0,
  active boolean not null default true, i18n_key text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.dashboard_trends (
  id uuid primary key default gen_random_uuid(), label text not null, value numeric not null, target numeric not null,
  sort_order integer not null default 0, active boolean not null default true, i18n_key text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.dashboard_modules (
  id uuid primary key default gen_random_uuid(), label text not null, value numeric not null, capacity numeric not null,
  color text not null, sort_order integer not null default 0, active boolean not null default true, i18n_key text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.dashboard_activities (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  occurred_at timestamptz not null default now(), status text not null, sort_order integer not null default 0,
  active boolean not null default true, i18n_key text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null check (status in ('info','success','warning','error')),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  i18n_key text
);
create table public.notification_reads (
  user_id uuid not null references public.users(id) on delete cascade,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id,notification_id)
);

create unique index users_account_unique on public.users(lower(btrim(account)));
create unique index users_email_unique on public.users(lower(btrim(email))) where email is not null;
create unique index users_employee_no_unique on public.users(employee_no) where employee_no is not null and deleted_at is null;
create index users_status_idx on public.users(status) where deleted_at is null;
create index users_department_idx on public.users(department_id) where deleted_at is null;
create index users_tags_idx on public.users using gin(tags);
create unique index roles_active_code_unique on public.roles(lower(btrim(code))) where deleted_at is null;
create index roles_status_idx on public.roles(status);
create index permissions_resource_action_idx on public.permissions(resource,action) where deleted_at is null;
create unique index departments_active_code_unique on public.departments(lower(btrim(code))) where deleted_at is null and code is not null;
create index departments_parent_sort_idx on public.departments(parent_id,sort_order);
create index departments_owner_idx on public.departments(owner_user_id);
create index departments_status_idx on public.departments(status);
create unique index menus_active_code_unique on public.menus(lower(btrim(code))) where deleted_at is null and code is not null;
create unique index menus_active_path_unique on public.menus(lower(btrim(path))) where deleted_at is null;
create index menus_parent_sort_idx on public.menus(parent_id,sort_order);
create index menus_status_visible_idx on public.menus(status,visible);
create index menus_required_permission_id_idx on public.menus(required_permission_id) where deleted_at is null;
create index user_roles_role_id_idx on public.user_roles(role_id);
create index role_permissions_permission_id_idx on public.role_permissions(permission_id);
create index notifications_created_at_idx on public.notifications(created_at desc) where active;
create index notification_reads_notification_idx on public.notification_reads(notification_id);
create function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'users','roles','permissions','departments','menus',
    'dashboard_metrics','dashboard_trends','dashboard_modules','dashboard_activities'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',table_name||'_set_updated_at',table_name);
  end loop;
end;
$$;

create function public.normalize_identifiers() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='users' then
    new.name=btrim(new.name); new.account=lower(btrim(new.account));
    if new.email is not null then new.email=nullif(lower(btrim(new.email)),''); end if;
  elsif tg_table_name='roles' then new.name=btrim(new.name); new.code=lower(btrim(new.code));
  elsif tg_table_name='permissions' then
    new.name=btrim(new.name); new.code=lower(btrim(new.code));
    new.resource=lower(btrim(new.resource)); new.action=lower(btrim(new.action));
  elsif tg_table_name='departments' then new.name=btrim(new.name); new.code=nullif(lower(btrim(new.code)),'');
  elsif tg_table_name='menus' then
    new.name=btrim(new.name); new.code=nullif(lower(btrim(new.code)),''); new.path=btrim(new.path);
  end if;
  return new;
end;
$$;
create trigger users_normalize_identifiers before insert or update of name,account,email on public.users for each row execute function public.normalize_identifiers();
create trigger roles_normalize_identifiers before insert or update of name,code on public.roles for each row execute function public.normalize_identifiers();
create trigger permissions_normalize_identifiers before insert or update of name,code,resource,action on public.permissions for each row execute function public.normalize_identifiers();
create trigger departments_normalize_identifiers before insert or update of name,code on public.departments for each row execute function public.normalize_identifiers();
create trigger menus_normalize_identifiers before insert or update of name,code,path on public.menus for each row execute function public.normalize_identifiers();

create function public.validate_tree_parent() returns trigger language plpgsql set search_path='' as $$
declare parent_exists boolean; cycle_exists boolean;
begin
  if new.parent_id is null then return new; end if;
  if new.parent_id=new.id then raise exception '% cannot be its own parent',tg_table_name using errcode='23514'; end if;
  execute format('select exists(select 1 from %I.%I where id=$1 and deleted_at is null)',tg_table_schema,tg_table_name)
    into parent_exists using new.parent_id;
  if not parent_exists then raise exception 'Active parent % was not found in %',new.parent_id,tg_table_name using errcode='23503'; end if;
  execute format(
    'with recursive ancestors(id,parent_id) as (select id,parent_id from %I.%I where id=$1 union select p.id,p.parent_id from %I.%I p join ancestors a on p.id=a.parent_id) select exists(select 1 from ancestors where id=$2)',
    tg_table_schema,tg_table_name,tg_table_schema,tg_table_name)
    into cycle_exists using new.parent_id,new.id;
  if cycle_exists then raise exception '% hierarchy cannot contain a cycle',tg_table_name using errcode='23514'; end if;
  return new;
end;
$$;
create trigger departments_validate_parent before insert or update of parent_id,deleted_at on public.departments for each row execute function public.validate_tree_parent();
create trigger menus_validate_parent before insert or update of parent_id,deleted_at on public.menus for each row execute function public.validate_tree_parent();

create function public.sync_reference_labels() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='users' then
    if new.department_id is not null then
      select name into new.department_name from public.departments where id=new.department_id and deleted_at is null;
      if not found then raise exception 'Active department % was not found',new.department_id using errcode='23503'; end if;
    end if;
  elsif tg_table_name='departments' then
    if new.parent_id is not null then
      select name into new.parent_name from public.departments where id=new.parent_id and deleted_at is null;
      if not found then raise exception 'Active parent department % was not found',new.parent_id using errcode='23503'; end if;
    end if;
    if new.owner_user_id is not null then
      select name into new.owner_name from public.users where id=new.owner_user_id and deleted_at is null;
      if not found then raise exception 'Active department owner % was not found',new.owner_user_id using errcode='23503'; end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger users_sync_department_label before insert or update of department_id,department_name,deleted_at on public.users for each row execute function public.sync_reference_labels();
create trigger departments_sync_reference_labels before insert or update of parent_id,parent_name,owner_user_id,owner_name,deleted_at on public.departments for each row execute function public.sync_reference_labels();

create function public.propagate_reference_labels() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='users' then update public.departments set owner_name=new.name where owner_user_id=new.id and deleted_at is null;
  elsif tg_table_name='departments' then
    update public.users set department_name=new.name where department_id=new.id and deleted_at is null;
    update public.departments set parent_name=new.name where parent_id=new.id and deleted_at is null;
  end if;
  return null;
end;
$$;
create trigger users_propagate_owner_label after update of name on public.users for each row when(old.name is distinct from new.name) execute function public.propagate_reference_labels();
create trigger departments_propagate_labels after update of name on public.departments for each row when(old.name is distinct from new.name) execute function public.propagate_reference_labels();

create function public.refresh_department_member_count() returns trigger language plpgsql set search_path='' as $$
declare old_department_id uuid; new_department_id uuid;
begin
  if tg_op<>'INSERT' then old_department_id=old.department_id; end if;
  if tg_op<>'DELETE' then new_department_id=new.department_id; end if;
  update public.departments d set member_count=(select count(*)::integer from public.users u where u.department_id=d.id and u.deleted_at is null)
  where d.id in(old_department_id,new_department_id) and d.deleted_at is null;
  return null;
end;
$$;
create trigger users_refresh_department_member_count after insert or delete or update of department_id,deleted_at on public.users for each row execute function public.refresh_department_member_count();

create function public.validate_active_reference() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='user_roles' then
    perform 1 from public.users where id=new.user_id and deleted_at is null;
    if not found then raise exception 'Active user % was not found',new.user_id using errcode='23503'; end if;
    perform 1 from public.roles where id=new.role_id and deleted_at is null;
    if not found then raise exception 'Active role % was not found',new.role_id using errcode='23503'; end if;
  elsif tg_table_name='role_permissions' then
    perform 1 from public.roles where id=new.role_id and deleted_at is null;
    if not found then raise exception 'Active role % was not found',new.role_id using errcode='23503'; end if;
    perform 1 from public.permissions where id=new.permission_id and deleted_at is null;
    if not found then raise exception 'Active permission % was not found',new.permission_id using errcode='23503'; end if;
  elsif tg_table_name='menus' then
    if new.required_permission_id is not null then
      perform 1 from public.permissions where id=new.required_permission_id and deleted_at is null;
      if not found then raise exception 'Active permission % was not found',new.required_permission_id using errcode='23503'; end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger user_roles_validate_active_references before insert or update of user_id,role_id on public.user_roles for each row execute function public.validate_active_reference();
create trigger role_permissions_validate_active_references before insert or update of role_id,permission_id on public.role_permissions for each row execute function public.validate_active_reference();
create trigger menus_validate_required_permission before insert or update of required_permission_id on public.menus for each row execute function public.validate_active_reference();

create function public.protect_soft_delete() returns trigger language plpgsql set search_path='' as $$
declare referenced boolean;
begin
  if old.deleted_at is not null or new.deleted_at is null then return new; end if;
  if tg_table_name='users' then
    select exists(select 1 from public.departments where owner_user_id=new.id and deleted_at is null) into referenced;
  elsif tg_table_name='roles' then
    if new.is_system then raise exception 'System roles cannot be deleted' using errcode='23514'; end if;
    select exists(select 1 from public.user_roles ur join public.users u on u.id=ur.user_id where ur.role_id=new.id and u.deleted_at is null) into referenced;
  elsif tg_table_name='permissions' then
    if new.is_system then raise exception 'System permissions cannot be deleted' using errcode='23514'; end if;
    select exists(select 1 from public.role_permissions where permission_id=new.id union all select 1 from public.menus where required_permission_id=new.id and deleted_at is null) into referenced;
  elsif tg_table_name='departments' then
    select exists(select 1 from public.departments where parent_id=new.id and deleted_at is null union all select 1 from public.users where department_id=new.id and deleted_at is null) into referenced;
  elsif tg_table_name='menus' then
    select exists(select 1 from public.menus where parent_id=new.id and deleted_at is null) into referenced;
  end if;
  if referenced then raise exception 'Active records still reference % %',tg_table_name,new.id using errcode='23514'; end if;
  return new;
end;
$$;
create trigger users_protect_soft_delete before update of deleted_at on public.users for each row execute function public.protect_soft_delete();
create trigger roles_protect_soft_delete before update of deleted_at on public.roles for each row execute function public.protect_soft_delete();
create trigger permissions_protect_soft_delete before update of deleted_at on public.permissions for each row execute function public.protect_soft_delete();
create trigger departments_protect_soft_delete before update of deleted_at on public.departments for each row execute function public.protect_soft_delete();
create trigger menus_protect_soft_delete before update of deleted_at on public.menus for each row execute function public.protect_soft_delete();

create function public.cleanup_rbac_on_soft_delete() returns trigger language plpgsql set search_path='' as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    if tg_table_name='roles' then delete from public.role_permissions where role_id=new.id; delete from public.user_roles where role_id=new.id;
    elsif tg_table_name='permissions' then delete from public.role_permissions where permission_id=new.id; end if;
  end if;
  return null;
end;
$$;
create trigger roles_cleanup_rbac after update of deleted_at on public.roles for each row execute function public.cleanup_rbac_on_soft_delete();
create trigger permissions_cleanup_rbac after update of deleted_at on public.permissions for each row execute function public.cleanup_rbac_on_soft_delete();

create function public.replace_role_permissions(p_role_id uuid,p_permission_ids uuid[]) returns void
language plpgsql security invoker set search_path=public as $$
begin
  if not exists(select 1 from public.roles where id=p_role_id and deleted_at is null) then raise exception 'Role % was not found.',p_role_id using errcode='23503'; end if;
  if exists(select 1 from unnest(coalesce(p_permission_ids,'{}'::uuid[])) id left join public.permissions p on p.id=id and p.deleted_at is null where p.id is null)
    then raise exception 'One or more permissions were not found.' using errcode='23503'; end if;
  delete from public.role_permissions where role_id=p_role_id;
  insert into public.role_permissions(role_id,permission_id) select p_role_id,id from unnest(coalesce(p_permission_ids,'{}'::uuid[])) id on conflict do nothing;
end;
$$;

create function public.replace_user_roles(p_user_id uuid,p_role_ids uuid[]) returns void
language plpgsql security invoker set search_path=public as $$
begin
  if not exists(select 1 from public.users where id=p_user_id and deleted_at is null) then raise exception 'User % was not found.',p_user_id using errcode='23503'; end if;
  if exists(select 1 from unnest(coalesce(p_role_ids,'{}'::uuid[])) id left join public.roles r on r.id=id and r.deleted_at is null and r.status='enabled' where r.id is null)
    then raise exception 'One or more roles were not found.' using errcode='23503'; end if;
  delete from public.user_roles where user_id=p_user_id;
  insert into public.user_roles(user_id,role_id) select p_user_id,id from unnest(coalesce(p_role_ids,'{}'::uuid[])) id on conflict do nothing;
end;
$$;

create function public.handle_auth_user_created() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  application_user_id uuid;
  default_role_id uuid;
  account_value text;
  name_value text;
  business_email_value text;
begin
  account_value=lower(btrim(coalesce(
    nullif(new.raw_user_meta_data->>'account',''),
    split_part(coalesce(new.email,''),'@',1)
  )));
  name_value=btrim(coalesce(nullif(new.raw_user_meta_data->>'name',''),account_value));
  business_email_value=nullif(lower(btrim(new.raw_user_meta_data->>'business_email')),'');

  if account_value!~'^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$' then
    raise exception 'Auth user metadata must contain a valid account.' using errcode='22023';
  end if;

  insert into public.users(auth_user_id,name,account,email,status,tags)
  values(new.id,name_value,account_value,business_email_value,'normal','{}'::text[])
  on conflict ((lower(btrim(account)))) do update
    set auth_user_id=excluded.auth_user_id
    where users.auth_user_id is null or users.auth_user_id=excluded.auth_user_id
  returning id into application_user_id;

  if application_user_id is null then
    raise exception 'Application account % is already bound to another Auth user.',account_value using errcode='23505';
  end if;

  select id into default_role_id from public.roles
  where code='guest' and status='enabled' and deleted_at is null
  order by created_at limit 1;
  if default_role_id is null then
    raise exception 'Enabled guest role was not found.' using errcode='23503';
  end if;

  if not exists(select 1 from public.user_roles where user_id=application_user_id) then
    insert into public.user_roles(user_id,role_id) values(application_user_id,default_role_id);
  end if;
  return new;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.departments enable row level security;
alter table public.menus enable row level security;
alter table public.dashboard_metrics enable row level security;
alter table public.dashboard_trends enable row level security;
alter table public.dashboard_modules enable row level security;
alter table public.dashboard_activities enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

revoke all on table public.users,public.roles,public.permissions,public.user_roles,public.role_permissions,
  public.departments,public.menus,public.dashboard_metrics,public.dashboard_trends,public.dashboard_modules,
  public.dashboard_activities,public.notifications,public.notification_reads from anon,authenticated;
revoke all on function public.replace_role_permissions(uuid,uuid[]) from public,anon,authenticated;
revoke all on function public.replace_user_roles(uuid,uuid[]) from public,anon,authenticated;
revoke all on function public.handle_auth_user_created() from public,anon,authenticated;
grant execute on function public.replace_role_permissions(uuid,uuid[]) to service_role;
grant execute on function public.replace_user_roles(uuid,uuid[]) to service_role;

-- Chinese table and column descriptions.
comment on table public.users is '应用用户档案表；通过 auth_user_id 关联 Supabase Auth 登录身份。';
comment on column public.users.id is '应用用户主键。';
comment on column public.users.auth_user_id is 'Supabase Auth 用户 ID；未开通登录的业务用户可以为空。';
comment on column public.users.name is '用户显示姓名。';
comment on column public.users.account is '登录账号；统一存储为小写且全生命周期唯一。';
comment on column public.users.email is '业务联系邮箱，不作为 Supabase Auth 的实际认证邮箱。';
comment on column public.users.phone is '联系电话。';
comment on column public.users.avatar_url is '头像地址。';
comment on column public.users.gender is '性别展示值。';
comment on column public.users.status is '用户状态：normal 正常，disabled 禁用。';
comment on column public.users.department_id is '所属部门 ID。';
comment on column public.users.department_name is '所属部门名称快照；department_id 非空时由数据库同步。';
comment on column public.users.tags is '用户标签数组。';
comment on column public.users.last_login_at is '最近一次成功登录时间。';
comment on column public.users.employee_no is '员工编号。';
comment on column public.users.job_title is '职位名称。';
comment on column public.users.manager_name is '直属上级姓名。';
comment on column public.users.enterprise_wechat is '企业微信标识。';
comment on column public.users.emergency_contact is '紧急联系人信息。';
comment on column public.users.office_location is '办公地点。';
comment on column public.users.joined_at is '入职日期。';
comment on column public.users.created_at is '创建时间。';
comment on column public.users.updated_at is '最后更新时间。';
comment on column public.users.deleted_at is '软删除时间；为空表示有效记录。';
comment on table public.roles is 'RBAC 角色定义表。';
comment on column public.roles.id is '角色主键。';
comment on column public.roles.name is '角色名称。';
comment on column public.roles.code is '角色唯一编码。';
comment on column public.roles.description is '角色说明。';
comment on column public.roles.status is '角色状态：enabled 启用，disabled 禁用。';
comment on column public.roles.is_system is '是否系统内置角色；系统角色禁止删除和普通编辑。';
comment on column public.roles.scope is '数据范围说明；当前为展示字段，尚未参与权限计算。';
comment on column public.roles.created_at is '创建时间。';
comment on column public.roles.updated_at is '最后更新时间。';
comment on column public.roles.deleted_at is '软删除时间；为空表示有效记录。';
comment on table public.permissions is 'RBAC 动作权限定义表；每项权限使用 resource.action 编码。';
comment on column public.permissions.id is '权限主键。';
comment on column public.permissions.code is '权限唯一编码，例如 users.read。';
comment on column public.permissions.name is '权限名称。';
comment on column public.permissions.resource is '受保护资源，例如 users。';
comment on column public.permissions.action is '允许执行的动作，例如 read、create、update。';
comment on column public.permissions.description is '权限用途说明。';
comment on column public.permissions.status is '权限状态：enabled 启用，disabled 禁用。';
comment on column public.permissions.is_system is '是否系统内置权限；系统权限禁止删除。';
comment on column public.permissions.created_at is '创建时间。';
comment on column public.permissions.updated_at is '最后更新时间。';
comment on column public.permissions.deleted_at is '软删除时间；为空表示有效记录。';
comment on table public.user_roles is '用户与角色的多对多分配表。';
comment on column public.user_roles.user_id is '应用用户 ID。';
comment on column public.user_roles.role_id is 'RBAC 角色 ID。';
comment on column public.user_roles.created_at is '角色分配时间。';
comment on table public.role_permissions is '角色与权限的多对多授权表；存在记录即表示授权。';
comment on column public.role_permissions.role_id is 'RBAC 角色 ID。';
comment on column public.role_permissions.permission_id is '动作权限 ID。';
comment on column public.role_permissions.created_at is '授权时间。';
comment on table public.departments is '部门树表。';
comment on column public.departments.id is '部门主键。';
comment on column public.departments.name is '部门名称。';
comment on column public.departments.code is '部门唯一编码。';
comment on column public.departments.parent_id is '上级部门 ID；为空表示根部门。';
comment on column public.departments.parent_name is '上级部门名称快照。';
comment on column public.departments.owner_user_id is '部门负责人用户 ID。';
comment on column public.departments.owner_name is '部门负责人姓名快照。';
comment on column public.departments.status is '部门状态：enabled 启用，disabled 禁用。';
comment on column public.departments.sort_order is '同级部门排序值。';
comment on column public.departments.description is '部门说明。';
comment on column public.departments.member_count is '有效部门成员数量；由数据库触发器维护。';
comment on column public.departments.created_at is '创建时间。';
comment on column public.departments.updated_at is '最后更新时间。';
comment on column public.departments.deleted_at is '软删除时间；为空表示有效记录。';
comment on table public.menus is '前端导航菜单树；菜单显示由 required_permission_id 控制。';
comment on column public.menus.id is '菜单主键。';
comment on column public.menus.name is '菜单名称。';
comment on column public.menus.code is '菜单唯一编码。';
comment on column public.menus.parent_id is '父菜单 ID；为空表示根菜单。';
comment on column public.menus.path is '前端路由路径。';
comment on column public.menus.icon is '菜单图标标识。';
comment on column public.menus.component_key is '前端组件或模块标识。';
comment on column public.menus.required_permission_id is '显示该菜单所需的读取权限；目录菜单可以为空。';
comment on column public.menus.status is '菜单状态：enabled 启用，disabled 禁用。';
comment on column public.menus.visible is '是否在导航中显示。';
comment on column public.menus.sort_order is '菜单排序值。';
comment on column public.menus.sort_key is '兼容树形排序的字符串键。';
comment on column public.menus.i18n_key is '菜单国际化文案键。';
comment on column public.menus.created_at is '创建时间。';
comment on column public.menus.updated_at is '最后更新时间。';
comment on column public.menus.deleted_at is '软删除时间；为空表示有效记录。';
comment on table public.notifications is '面向应用用户的全局通知表。';
comment on column public.notifications.id is '通知主键。';
comment on column public.notifications.title is '通知标题。';
comment on column public.notifications.description is '通知内容。';
comment on column public.notifications.status is '通知级别：info、success、warning 或 error。';
comment on column public.notifications.created_at is '发布时间。';
comment on column public.notifications.expires_at is '过期时间；为空表示不过期。';
comment on column public.notifications.active is '通知是否有效。';
comment on column public.notifications.i18n_key is '通知国际化文案键。';
comment on table public.notification_reads is '用户通知已读状态表。';
comment on column public.notification_reads.user_id is '应用用户 ID。';
comment on column public.notification_reads.notification_id is '通知 ID。';
comment on column public.notification_reads.read_at is '首次标记已读时间。';
comment on table public.dashboard_metrics is '仪表盘指标卡配置表。';
comment on column public.dashboard_metrics.id is '指标主键。';
comment on column public.dashboard_metrics.label is '指标名称。';
comment on column public.dashboard_metrics.value is '格式化后的指标值。';
comment on column public.dashboard_metrics.delta is '格式化后的变化幅度。';
comment on column public.dashboard_metrics.tone is '变化语义：positive、negative 或 neutral。';
comment on column public.dashboard_metrics.sort_order is '展示排序值。';
comment on column public.dashboard_metrics.active is '是否展示。';
comment on column public.dashboard_metrics.i18n_key is '国际化文案键。';
comment on column public.dashboard_metrics.created_at is '创建时间。';
comment on column public.dashboard_metrics.updated_at is '最后更新时间。';
comment on table public.dashboard_trends is '仪表盘趋势序列配置表。';
comment on column public.dashboard_trends.id is '趋势点主键。';
comment on column public.dashboard_trends.label is '趋势点标签。';
comment on column public.dashboard_trends.value is '实际值。';
comment on column public.dashboard_trends.target is '目标值。';
comment on column public.dashboard_trends.sort_order is '展示排序值。';
comment on column public.dashboard_trends.active is '是否展示。';
comment on column public.dashboard_trends.i18n_key is '国际化文案键。';
comment on column public.dashboard_trends.created_at is '创建时间。';
comment on column public.dashboard_trends.updated_at is '最后更新时间。';
comment on table public.dashboard_modules is '仪表盘模块占比配置表。';
comment on column public.dashboard_modules.id is '模块主键。';
comment on column public.dashboard_modules.label is '模块名称。';
comment on column public.dashboard_modules.value is '当前值。';
comment on column public.dashboard_modules.capacity is '容量或最大值。';
comment on column public.dashboard_modules.color is '展示颜色标识。';
comment on column public.dashboard_modules.sort_order is '展示排序值。';
comment on column public.dashboard_modules.active is '是否展示。';
comment on column public.dashboard_modules.i18n_key is '国际化文案键。';
comment on column public.dashboard_modules.created_at is '创建时间。';
comment on column public.dashboard_modules.updated_at is '最后更新时间。';
comment on table public.dashboard_activities is '仪表盘最近动态表。';
comment on column public.dashboard_activities.id is '动态主键。';
comment on column public.dashboard_activities.title is '动态标题。';
comment on column public.dashboard_activities.description is '动态说明。';
comment on column public.dashboard_activities.occurred_at is '业务发生时间。';
comment on column public.dashboard_activities.status is '动态状态或展示语义。';
comment on column public.dashboard_activities.sort_order is '展示排序值。';
comment on column public.dashboard_activities.active is '是否展示。';
comment on column public.dashboard_activities.i18n_key is '国际化文案键。';
comment on column public.dashboard_activities.created_at is '创建时间。';
comment on column public.dashboard_activities.updated_at is '最后更新时间。';

-- Enterprise audit, managed files, imports, and storage.
-- Enterprise administration features: immutable audit trail, private files, and atomic department imports.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_name text not null,
  actor_account text not null,
  action text not null,
  resource_type text not null,
  resource_id text,
  request_method text not null,
  request_path text not null,
  request_id uuid not null,
  status text not null check (status in ('succeeded','failed')),
  status_code integer not null check (status_code between 100 and 599),
  changes jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  error_code text,
  constraint audit_logs_actor_name_not_blank check (btrim(actor_name) <> ''),
  constraint audit_logs_actor_account_not_blank check (btrim(actor_account) <> ''),
  constraint audit_logs_action_format check (action ~ '^[a-z][a-z0-9_]*$'),
  constraint audit_logs_resource_type_format check (resource_type ~ '^[a-z][a-z0-9_]*$')
);

create index audit_logs_occurred_at_idx on public.audit_logs(occurred_at desc);
create index audit_logs_actor_occurred_idx on public.audit_logs(actor_user_id,occurred_at desc);
create index audit_logs_resource_occurred_idx on public.audit_logs(resource_type,resource_id,occurred_at desc);
create index audit_logs_status_occurred_idx on public.audit_logs(status,occurred_at desc);
create index audit_logs_changes_idx on public.audit_logs using gin(changes);

create function public.protect_audit_log() returns trigger language plpgsql set search_path='' as $$
begin
  raise exception 'Audit logs are immutable.' using errcode='55000';
end;
$$;
create trigger audit_logs_immutable before update or delete on public.audit_logs
for each row execute function public.protect_audit_log();

create table public.files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'attachments',
  object_path text not null,
  original_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text,
  status text not null default 'ready' check (status in ('ready','quarantined','failed')),
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_by_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint files_object_path_unique unique(bucket,object_path),
  constraint files_original_name_not_blank check (btrim(original_name) <> ''),
  constraint files_uploaded_by_name_not_blank check (btrim(uploaded_by_name) <> '')
);

create table public.file_links (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  field_key text not null,
  sort_order integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint file_links_resource_type_format check (resource_type ~ '^[a-z][a-z0-9_]*$'),
  constraint file_links_field_key_format check (field_key ~ '^[A-Za-z][A-Za-z0-9_-]*$'),
  constraint file_links_unique unique(file_id,resource_type,resource_id,field_key)
);

create index files_created_at_idx on public.files(created_at desc) where deleted_at is null;
create index files_uploader_idx on public.files(uploaded_by,created_at desc) where deleted_at is null;
create index file_links_resource_idx on public.file_links(resource_type,resource_id,field_key,sort_order);
create index file_links_file_idx on public.file_links(file_id);
create trigger files_set_updated_at before update on public.files
for each row execute function public.set_updated_at();

-- Clear compatibility label snapshots when their references are cleared.
create or replace function public.sync_reference_labels() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='users' then
    if new.department_id is not null then
      select name into new.department_name from public.departments where id=new.department_id and deleted_at is null;
      if not found then raise exception 'Active department % was not found',new.department_id using errcode='23503'; end if;
    else
      new.department_name=null;
    end if;
  elsif tg_table_name='departments' then
    if new.parent_id is not null then
      select name into new.parent_name from public.departments where id=new.parent_id and deleted_at is null;
      if not found then raise exception 'Active parent department % was not found',new.parent_id using errcode='23503'; end if;
    else
      new.parent_name=null;
    end if;
    if new.owner_user_id is not null then
      select name into new.owner_name from public.users where id=new.owner_user_id and deleted_at is null;
      if not found then raise exception 'Active department owner % was not found',new.owner_user_id using errcode='23503'; end if;
    else
      new.owner_name=null;
    end if;
  end if;
  return new;
end;
$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('attachments','attachments',false,20971520,null)
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit;

create function public.import_departments(p_rows jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  invalid_row record;
  created_count integer;
  updated_count integer;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows)=0 then
    raise exception 'Department import must contain at least one row.' using errcode='22023';
  end if;

  create temporary table department_import_stage on commit drop as
  select
    source.ordinality::integer + 1 as line_number,
    lower(btrim(source.value->>'code')) as code,
    btrim(source.value->>'name') as name,
    nullif(lower(btrim(source.value->>'parentCode')),'') as parent_code,
    nullif(lower(btrim(source.value->>'ownerAccount')),'') as owner_account,
    coalesce(nullif(lower(btrim(source.value->>'status')),''),'enabled') as status,
    coalesce(nullif(source.value->>'sortOrder','')::integer,0) as sort_order,
    nullif(btrim(source.value->>'description'),'') as description
  from jsonb_array_elements(p_rows) with ordinality source(value,ordinality);

  select * into invalid_row from department_import_stage
  where code is null or code !~ '^[a-z][a-z0-9_-]{0,99}$' or name is null or name='' or char_length(name)>100
    or status not in('enabled','disabled') or sort_order<0 or parent_code=code
  limit 1;
  if found then raise exception 'Invalid department import row %.',invalid_row.line_number using errcode='22023'; end if;

  select min(line_number) line_number into invalid_row from department_import_stage group by code having count(*)>1 limit 1;
  if found then raise exception 'Duplicate department code at row %.',invalid_row.line_number using errcode='23505'; end if;

  select s.* into invalid_row from department_import_stage s
  where s.parent_code is not null
    and not exists(select 1 from department_import_stage p where p.code=s.parent_code)
    and not exists(select 1 from departments p where p.code=s.parent_code and p.deleted_at is null)
  limit 1;
  if found then raise exception 'Parent department was not found at row %.',invalid_row.line_number using errcode='23503'; end if;

  select s.* into invalid_row from department_import_stage s
  where s.owner_account is not null
    and not exists(select 1 from users u where u.account=s.owner_account and u.deleted_at is null)
  limit 1;
  if found then raise exception 'Department owner was not found at row %.',invalid_row.line_number using errcode='23503'; end if;

  select count(*)::integer into updated_count from department_import_stage s
  join departments d on d.code=s.code and d.deleted_at is null;
  select count(*)::integer-updated_count into created_count from department_import_stage;

  insert into departments(name,code,status,sort_order,description)
  select name,code,status,sort_order,description from department_import_stage
  on conflict((lower(btrim(code)))) where deleted_at is null and code is not null do update set
    name=excluded.name,status=excluded.status,sort_order=excluded.sort_order,description=excluded.description;

  update departments d set parent_id=null,owner_user_id=null
  from department_import_stage s where d.code=s.code and d.deleted_at is null;

  update departments d set
    parent_id=p.id,
    owner_user_id=u.id
  from department_import_stage s
  left join departments p on p.code=s.parent_code and p.deleted_at is null
  left join users u on u.account=s.owner_account and u.deleted_at is null
  where d.code=s.code and d.deleted_at is null;

  return jsonb_build_object('created',created_count,'updated',updated_count,'total',created_count+updated_count);
end;
$$;

alter table public.audit_logs enable row level security;
alter table public.files enable row level security;
alter table public.file_links enable row level security;
revoke all on table public.audit_logs,public.files,public.file_links from anon,authenticated;
revoke all on function public.protect_audit_log() from public,anon,authenticated;
revoke all on function public.import_departments(jsonb) from public,anon,authenticated;
grant execute on function public.import_departments(jsonb) to service_role;
comment on table public.audit_logs is '不可变的后台操作审计日志。';
comment on column public.audit_logs.changes is '服务端脱敏后的请求与响应摘要。';
comment on table public.files is 'Supabase Storage 文件对象元数据。';
comment on column public.files.object_path is '由服务端生成且在 bucket 内唯一的对象路径。';
comment on table public.file_links is '文件与动态业务资源字段的多态绑定关系。';
comment on function public.import_departments(jsonb) is '在单个数据库事务中按部门编码批量新增或更新组织架构。';

-- A department owner must remain an active member of that department.
create or replace function public.validate_department_owner_membership()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if tg_table_name = 'departments' and new.owner_user_id is not null then
    perform 1
    from public.users
    where id = new.owner_user_id
      and department_id = new.id
      and status = 'normal'
      and deleted_at is null;
    if not found then
      raise exception 'Department owner must be an active member of the same department'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'users' then
    if exists(
      select 1
      from public.departments
      where owner_user_id = new.id
        and id is distinct from new.department_id
        and deleted_at is null
    ) or ((new.status <> 'normal' or new.deleted_at is not null) and exists(
      select 1 from public.departments
      where owner_user_id = new.id and deleted_at is null
    )) then
      raise exception 'Department owner cannot leave or become inactive before reassignment'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists departments_validate_owner_membership on public.departments;
create trigger departments_validate_owner_membership
before insert or update of owner_user_id on public.departments
for each row execute function public.validate_department_owner_membership();

drop trigger if exists users_protect_owner_membership on public.users;
create trigger users_protect_owner_membership
before update of department_id,status,deleted_at on public.users
for each row execute function public.validate_department_owner_membership();

-- Public avatar objects are tracked in public.files and public.file_links.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update
set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

notify pgrst,'reload schema';
