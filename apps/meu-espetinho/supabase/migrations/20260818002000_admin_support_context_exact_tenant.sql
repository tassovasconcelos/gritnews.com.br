create or replace function public.admin_support_context(p_tenant_id uuid)
returns table(id uuid, name text, subscription_status text, trial_ends_at timestamptz, setup_status text, courtesy_type text, courtesy_ends_at timestamptz)
language sql
stable
security definer
set search_path=''
as $$
  select t.id,t.name,t.subscription_status,t.trial_ends_at,coalesce(t.setup_status,'approved'),t.courtesy_type,t.courtesy_ends_at
  from public.tenants t
  where t.id=p_tenant_id
    and exists (
      select 1
      from public.support_access_grants sag
      join public.admin_users au on au.user_id=sag.admin_user_id and au.active=true
      where sag.tenant_id=t.id
        and sag.admin_user_id=(select auth.uid())
        and sag.revoked_at is null
        and sag.expires_at>now()
    )
$$;

revoke all on function public.admin_support_context(uuid) from public, anon;
grant execute on function public.admin_support_context(uuid) to authenticated;
