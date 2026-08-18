-- Cliente 360: impede execução anônima de ações administrativas sensíveis.
-- As funções continuam exigindo as validações internas de Super Admin.
revoke execute on function public.admin_clear_tenant_courtesy(uuid) from anon;
revoke execute on function public.admin_waive_tenant_activation(uuid,text) from anon;

grant execute on function public.admin_clear_tenant_courtesy(uuid) to authenticated;
grant execute on function public.admin_waive_tenant_activation(uuid,text) to authenticated;
