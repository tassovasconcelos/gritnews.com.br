-- Revoga explicitamente execução anônima após a recriação das RPCs no migration 008.
revoke execute on function public.admin_grant_tenant_courtesy(uuid,text,integer,boolean) from public, anon;
revoke execute on function public.admin_customer_overview() from public, anon;
revoke execute on function public.current_user_tenants() from public, anon;

grant execute on function public.admin_grant_tenant_courtesy(uuid,text,integer,boolean) to authenticated, service_role;
grant execute on function public.admin_customer_overview() to authenticated, service_role;
grant execute on function public.current_user_tenants() to authenticated, service_role;

create index if not exists tenant_courtesy_grants_tenant_created_idx
  on public.tenant_courtesy_grants (tenant_id, created_at desc);
create index if not exists tenant_courtesy_grants_granted_by_idx
  on public.tenant_courtesy_grants (granted_by);

