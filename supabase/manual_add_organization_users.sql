-- 手动执行脚本：为现有组织架构增加 12 名关联用户。
-- 特性：
-- 1. 使用 account 作为幂等键，可重复执行；
-- 2. 通过 department_id 关联部门，department_name 和 member_count 由数据库触发器维护；
-- 3. 仅创建业务用户数据，不创建 Supabase Auth 登录账号；
-- 4. 账号统一使用 orgdemo 前缀，便于识别和后续清理。

begin;

do $$
declare
  required_department text;
  matched_count integer;
begin
  foreach required_department in array array[
    '华南运营部',
    '客户成功部',
    '商品中心',
    '供应链部'
  ] loop
    select count(*)::integer into matched_count
    from public.departments
    where name = required_department
      and deleted_at is null;

    if matched_count <> 1 then
      raise exception '部门“%”需要且只能存在一条有效记录，当前匹配 % 条。',
        required_department,
        matched_count;
    end if;
  end loop;
end;
$$;

with sample_user(
  name,
  account,
  email,
  employee_no,
  job_title,
  manager_name,
  office_location,
  joined_at,
  department_name,
  tags
) as (
  values
    ('林澜','orgdemo001','orgdemo001@example.invalid','ORG-1001','运营经理','华南运营负责人','广州','2021-03-08'::date,'华南运营部',array['运营','管理']::text[]),
    ('陈曦','orgdemo002','orgdemo002@example.invalid','ORG-1002','活动运营','林澜','广州','2022-06-13'::date,'华南运营部',array['运营','活动']::text[]),
    ('周宁','orgdemo003','orgdemo003@example.invalid','ORG-1003','数据运营','林澜','深圳','2023-02-20'::date,'华南运营部',array['运营','数据']::text[]),

    ('赵晴','orgdemo004','orgdemo004@example.invalid','ORG-2001','客户成功经理','客户成功负责人','深圳','2020-11-02'::date,'客户成功部',array['客户成功','管理']::text[]),
    ('孙悦','orgdemo005','orgdemo005@example.invalid','ORG-2002','实施顾问','赵晴','深圳','2022-04-18'::date,'客户成功部',array['客户成功','实施']::text[]),
    ('罗诚','orgdemo006','orgdemo006@example.invalid','ORG-2003','客户支持','赵晴','广州','2023-08-07'::date,'客户成功部',array['客户成功','支持']::text[]),

    ('徐可','orgdemo007','orgdemo007@example.invalid','ORG-3001','商品经理','商品中心负责人','杭州','2020-05-11'::date,'商品中心',array['商品','管理']::text[]),
    ('何安','orgdemo008','orgdemo008@example.invalid','ORG-3002','选品专员','徐可','杭州','2022-09-05'::date,'商品中心',array['商品','选品']::text[]),
    ('唐米','orgdemo009','orgdemo009@example.invalid','ORG-3003','商品运营','徐可','上海','2023-03-27'::date,'商品中心',array['商品','运营']::text[]),

    ('魏川','orgdemo010','orgdemo010@example.invalid','ORG-4001','供应链经理','供应链负责人','佛山','2019-07-15'::date,'供应链部',array['供应链','管理']::text[]),
    ('沈舟','orgdemo011','orgdemo011@example.invalid','ORG-4002','采购专员','魏川','佛山','2021-12-06'::date,'供应链部',array['供应链','采购']::text[]),
    ('方圆','orgdemo012','orgdemo012@example.invalid','ORG-4003','库存计划','魏川','广州','2023-05-22'::date,'供应链部',array['供应链','库存']::text[])
)
insert into public.users(
  name,
  account,
  email,
  employee_no,
  job_title,
  manager_name,
  office_location,
  joined_at,
  department_id,
  tags,
  status,
  deleted_at
)
select
  sample_user.name,
  sample_user.account,
  sample_user.email,
  sample_user.employee_no,
  sample_user.job_title,
  sample_user.manager_name,
  sample_user.office_location,
  sample_user.joined_at,
  department.id,
  sample_user.tags,
  'normal',
  null
from sample_user
join public.departments department
  on department.name = sample_user.department_name
 and department.deleted_at is null
on conflict ((lower(btrim(account)))) do update
set name = excluded.name,
    email = excluded.email,
    employee_no = excluded.employee_no,
    job_title = excluded.job_title,
    manager_name = excluded.manager_name,
    office_location = excluded.office_location,
    joined_at = excluded.joined_at,
    department_id = excluded.department_id,
    tags = excluded.tags,
    status = excluded.status,
    deleted_at = null,
    updated_at = now();

insert into public.user_roles(user_id, role_id)
select app_user.id, role.id
from public.users app_user
join public.roles role
  on role.code = 'guest'
 and role.status = 'enabled'
 and role.deleted_at is null
where app_user.account = any(array[
  'orgdemo001','orgdemo002','orgdemo003','orgdemo004','orgdemo005','orgdemo006',
  'orgdemo007','orgdemo008','orgdemo009','orgdemo010','orgdemo011','orgdemo012'
])
  and app_user.deleted_at is null
on conflict do nothing;

commit;

-- 执行结果核对：人数应由 users.department_id 的真实关联产生。
select
  department.name as department_name,
  department.member_count,
  count(app_user.id)::integer as actual_member_count
from public.departments department
left join public.users app_user
  on app_user.department_id = department.id
 and app_user.deleted_at is null
where department.name = any(array['华南运营部','客户成功部','商品中心','供应链部'])
  and department.deleted_at is null
group by department.id, department.name, department.member_count
order by department.sort_order, department.name;
