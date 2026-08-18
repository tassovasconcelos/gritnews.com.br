create or replace function public.current_user_tenants()
returns table(id uuid, name text, subscription_status text, trial_ends_at timestamptz, setup_status text, is_owner boolean, courtesy_type text, courtesy_ends_at timestamptz)
language sql
stable
set search_path=''
as $$
 select t.id,t.name,t.subscription_status,t.trial_ends_at,coalesce(t.setup_status,'approved'),t.owner_user_id=(select auth.uid()),t.courtesy_type,t.courtesy_ends_at
 from public.tenants t
 where t.owner_user_id=(select auth.uid())
 or exists(select 1 from public.tenant_users tu where tu.tenant_id=t.id and tu.user_id=(select auth.uid()) and tu.active=true)
 or exists(select 1 from public.support_access_grants sag join public.admin_users au on au.user_id=sag.admin_user_id and au.active=true where sag.tenant_id=t.id and sag.admin_user_id=(select auth.uid()) and sag.revoked_at is null and sag.expires_at>now())
 order by (
   select max(sag.granted_at)
   from public.support_access_grants sag
   join public.admin_users au on au.user_id=sag.admin_user_id and au.active=true
   where sag.tenant_id=t.id
     and sag.admin_user_id=(select auth.uid())
     and sag.revoked_at is null
     and sag.expires_at>now()
 ) desc nulls last,
 (t.owner_user_id=(select auth.uid())) desc,
 t.name asc
$$;
