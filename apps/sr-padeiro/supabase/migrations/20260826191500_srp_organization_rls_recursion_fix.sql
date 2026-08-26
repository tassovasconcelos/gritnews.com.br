drop policy if exists srp_org_select on public.srp_organizations;

create policy srp_org_select on public.srp_organizations
for select to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.srp_role_allowed(id, array['owner', 'manager', 'cashier']::text[])
  or exists (
    select 1
    from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.active
      and a.role = 'superadmin'
  )
);
