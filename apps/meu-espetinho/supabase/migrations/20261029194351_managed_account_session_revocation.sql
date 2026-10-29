-- Keep sessions established before a reset blocked even after the personal password is saved.
create or replace function private.ops_account_requires_change() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
 exists(select 1 from public.operation_password_requirements where user_id=auth.uid() and required)
 or exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'ops_password_required'='true')
 or exists(select 1 from public.operation_password_requirements r where r.user_id=auth.uid() and not exists(
  select 1 from auth.sessions s where s.user_id=r.user_id and s.created_at>=r.issued_at
  and s.id::text=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id'))))
$$;
revoke all on function private.ops_account_requires_change() from public,anon;
grant execute on function private.ops_account_requires_change() to authenticated,service_role;
notify pgrst,'reload schema';
