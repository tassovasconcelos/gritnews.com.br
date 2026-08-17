-- SessÃ£o temporÃ¡ria e auditada para suporte do Super Admin.
create table if not exists public.support_access_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default 'support',
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > granted_at),
  check (length(reason) between 3 and 300)
);
alter table public.support_access_grants enable row level security;
revoke all on table public.support_access_grants from public,anon,authenticated;
grant all on table public.support_access_grants to service_role;

create or replace function private.start_support_access(target_tenant uuid, support_reason text default 'Suporte e treinamento')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_admin uuid := auth.uid(); v_exp timestamptz := now()+interval '60 minutes';
begin
  if v_admin is null or not exists(select 1 from public.admin_users where user_id=v_admin and active=true) then raise exception 'forbidden'; end if;
  if not exists(select 1 from public.tenants where id=target_tenant) then raise exception 'tenant_not_found'; end if;
  update public.support_access_grants set revoked_at=now() where admin_user_id=v_admin and tenant_id=target_tenant and revoked_at is null and expires_at>now();
  insert into public.support_access_grants(tenant_id,admin_user_id,reason,expires_at) values(target_tenant,v_admin,left(coalesce(nullif(trim(support_reason),''),'Suporte e treinamento'),300),v_exp);
  insert into public.audit_logs(tenant_id,user_id,action,entity,entity_id,metadata) values(target_tenant,v_admin,'support_access_started','tenant',target_tenant::text,jsonb_build_object('expires_at',v_exp,'reason',support_reason));
  return jsonb_build_object('ok',true,'tenant_id',target_tenant,'expires_at',v_exp);
end $$;
revoke all on function private.start_support_access(uuid,text) from public,anon;
grant execute on function private.start_support_access(uuid,text) to authenticated,service_role;

create or replace function public.admin_start_support_access(p_tenant_id uuid,p_reason text default 'Suporte e treinamento')
returns jsonb language sql security invoker set search_path='' as $$ select private.start_support_access(p_tenant_id,p_reason) $$;
revoke all on function public.admin_start_support_access(uuid,text) from public,anon;
grant execute on function public.admin_start_support_access(uuid,text) to authenticated,service_role;

create or replace function private.user_has_tenant_access(target_tenant uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.tenants t where t.id=target_tenant and coalesce(t.setup_status,'approved')<>'suspended' and (
    ((t.subscription_status='active' or t.trial_ends_at>now() or (t.courtesy_type is not null and t.courtesy_ends_at>now())) and
      (t.owner_user_id=(select auth.uid()) or exists(select 1 from public.tenant_users tu where tu.tenant_id=t.id and tu.user_id=(select auth.uid()) and tu.active=true)))
    or exists(select 1 from public.support_access_grants sag join public.admin_users au on au.user_id=sag.admin_user_id and au.active=true
      where sag.tenant_id=t.id and sag.admin_user_id=(select auth.uid()) and sag.revoked_at is null and sag.expires_at>now())))
$$;
revoke all on function private.user_has_tenant_access(uuid) from public;
grant execute on function private.user_has_tenant_access(uuid) to authenticated;

drop function if exists public.current_user_tenants();
create function public.current_user_tenants()
returns table(id uuid,name text,subscription_status text,trial_ends_at timestamptz,setup_status text,is_owner boolean,courtesy_type text,courtesy_ends_at timestamptz)
language sql stable security invoker set search_path='' as $$
  select t.id,t.name,t.subscription_status,t.trial_ends_at,coalesce(t.setup_status,'approved'),t.owner_user_id=(select auth.uid()),t.courtesy_type,t.courtesy_ends_at
  from public.tenants t where t.owner_user_id=(select auth.uid())
    or exists(select 1 from public.tenant_users tu where tu.tenant_id=t.id and tu.user_id=(select auth.uid()) and tu.active=true)
    or exists(select 1 from public.support_access_grants sag join public.admin_users au on au.user_id=sag.admin_user_id and au.active=true
      where sag.tenant_id=t.id and sag.admin_user_id=(select auth.uid()) and sag.revoked_at is null and sag.expires_at>now())
  order by (t.owner_user_id=(select auth.uid())) desc,t.name asc
$$;
revoke all on function public.current_user_tenants() from public,anon;
grant execute on function public.current_user_tenants() to authenticated;


