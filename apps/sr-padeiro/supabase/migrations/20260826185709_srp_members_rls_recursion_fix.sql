create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.srp_role_allowed(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.srp_members m
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
      and m.active
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function private.srp_role_allowed(uuid, text[]) from public, anon;
grant execute on function private.srp_role_allowed(uuid, text[]) to authenticated, service_role;

create or replace function public.srp_role_allowed(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.srp_role_allowed(org_id, allowed_roles);
$$;

revoke all on function public.srp_role_allowed(uuid, text[]) from public, anon;
grant execute on function public.srp_role_allowed(uuid, text[]) to authenticated, service_role;

drop policy if exists srp_members_insert_owner on public.srp_members;
create policy srp_members_insert_owner on public.srp_members
for insert to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1 from public.srp_organizations o
      where o.id = organization_id
        and o.owner_user_id = (select auth.uid())
    )
  )
  or public.srp_role_allowed(organization_id, array['owner']::text[])
  or exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.active
      and a.role = 'superadmin'
  )
);
