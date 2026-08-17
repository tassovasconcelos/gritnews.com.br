-- Permite que o próprio Super Admin leia somente suas concessões ativas.
grant select on public.support_access_grants to authenticated;
drop policy if exists support_grants_read_own on public.support_access_grants;
create policy support_grants_read_own on public.support_access_grants
for select to authenticated
using (
  admin_user_id=(select auth.uid())
  and revoked_at is null
  and expires_at>now()
);

-- Suporte ativo ignora o bloqueio comercial da loja; clientes continuam sujeitos
-- a assinatura, trial, cortesia e suspensão.
create or replace function private.user_has_tenant_access(target_tenant uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.tenants t
    where t.id=target_tenant and (
      exists(
        select 1 from public.support_access_grants sag
        join public.admin_users au on au.user_id=sag.admin_user_id and au.active=true
        where sag.tenant_id=t.id
          and sag.admin_user_id=(select auth.uid())
          and sag.revoked_at is null
          and sag.expires_at>now()
      )
      or (
        coalesce(t.setup_status,'approved')<>'suspended'
        and (t.subscription_status='active' or t.trial_ends_at>now() or (t.courtesy_type is not null and t.courtesy_ends_at>now()))
        and (
          t.owner_user_id=(select auth.uid())
          or exists(
            select 1 from public.tenant_users tu
            where tu.tenant_id=t.id and tu.user_id=(select auth.uid()) and tu.active=true
          )
        )
      )
    )
  )
$$;
revoke all on function private.user_has_tenant_access(uuid) from public;
grant execute on function private.user_has_tenant_access(uuid) to authenticated;
