-- Make cross-system file deletion observable, retryable, and database-atomic after Storage removal.

alter table public.files drop constraint if exists files_status_check;
alter table public.files
  add constraint files_status_check
  check (status in ('ready','quarantined','failed','deleting','delete_failed','deleted'));

alter table public.files
  add column if not exists delete_started_at timestamptz,
  add column if not exists delete_error text;

create or replace function public.finalize_file_delete(p_file_id uuid) returns void
language plpgsql security invoker set search_path=public as $$
begin
  if not exists(
    select 1 from public.files
    where id=p_file_id and deleted_at is null and status in('deleting','delete_failed')
  ) then
    raise exception 'File % is not pending deletion.',p_file_id using errcode='22023';
  end if;

  update public.users
  set avatar_url=null
  where deleted_at is null and exists(
    select 1 from public.file_links link
    where link.file_id=p_file_id and link.resource_type='users' and link.field_key='avatarUrl'
      and link.resource_id=users.id::text
  );

  delete from public.file_links where file_id=p_file_id;
  update public.files
  set status='deleted',deleted_at=now(),delete_error=null
  where id=p_file_id and deleted_at is null;
end;
$$;

revoke all on function public.finalize_file_delete(uuid) from public,anon,authenticated;
grant execute on function public.finalize_file_delete(uuid) to service_role;

comment on column public.files.delete_started_at is '最近一次开始删除对象的时间，用于重试和对账。';
comment on column public.files.delete_error is '最近一次删除失败的限幅错误摘要，不包含凭据。';
comment on function public.finalize_file_delete(uuid) is 'Storage 对象删除后，原子清理业务引用并软删除文件元数据。';

notify pgrst,'reload schema';
