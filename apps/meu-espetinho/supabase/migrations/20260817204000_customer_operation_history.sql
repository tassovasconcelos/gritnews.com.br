create or replace function public.customer_operation_history(p_tenant_id uuid,p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_temp'
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not private.user_has_tenant_access(p_tenant_id) then raise exception 'forbidden'; end if;
  if not exists(select 1 from public.customers where id=p_customer_id and tenant_id=p_tenant_id) then raise exception 'customer_not_found'; end if;
  select jsonb_build_object(
    'orders',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'status',o.status,'total',o.total,'opened_at',o.opened_at,'closed_at',o.closed_at) order by o.opened_at desc) from public.orders o where o.tenant_id=p_tenant_id and o.customer_id=p_customer_id),'[]'::jsonb),
    'total_spent',coalesce((select sum(o.total) from public.orders o where o.tenant_id=p_tenant_id and o.customer_id=p_customer_id and o.status='closed'),0),
    'visits',coalesce((select count(*) from public.orders o where o.tenant_id=p_tenant_id and o.customer_id=p_customer_id and o.status='closed'),0),
    'last_visit',(select max(o.closed_at) from public.orders o where o.tenant_id=p_tenant_id and o.customer_id=p_customer_id and o.status='closed'),
    'credit_balance',coalesce((select sum(case when e.entry_type='charge' then e.amount when e.entry_type='payment' then -e.amount else e.amount end) from public.customer_credit_entries e where e.tenant_id=p_tenant_id and e.customer_id=p_customer_id),0)
  ) into v_result;
  return v_result;
end;$$;
revoke all on function public.customer_operation_history(uuid,uuid) from public,anon;
grant execute on function public.customer_operation_history(uuid,uuid) to authenticated;