-- Meu Espetinho — homologação v1: endurecimento das RPCs administrativas
-- Anônimos nunca devem conseguir executar funções SECURITY DEFINER de Super Admin.

revoke all on function public.admin_customer_overview() from public, anon;
revoke all on function public.admin_set_tenant_access(uuid,text) from public, anon;

grant execute on function public.admin_customer_overview() to authenticated, service_role;
grant execute on function public.admin_set_tenant_access(uuid,text) to authenticated, service_role;
