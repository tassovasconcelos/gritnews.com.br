-- Corrige o rollback do fechamento causado pela auditoria protegida por RLS.
-- A função valida identidade, acesso ao tenant, estado da comanda e forma de pagamento.
create or replace function private.close_order_atomic_internal(
  p_tenant_id uuid,p_order_id uuid,p_user_id uuid,p_amount numeric,
  p_method text,p_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare v_label text; v_status text;
begin
  if auth.uid() is null or p_user_id <> auth.uid() then raise exception 'invalid_user'; end if;
  if not private.user_has_tenant_access(p_tenant_id) then raise exception 'forbidden'; end if;
  if p_amount < 0 then raise exception 'invalid_amount'; end if;
  if p_method not in ('cash','pix','credit_card','debit_card','other','fiado') then
    raise exception 'invalid_payment_method';
  end if;

  select label,status into v_label,v_status
  from public.orders where id=p_order_id and tenant_id=p_tenant_id for update;
  if v_label is null then raise exception 'order_not_found'; end if;
  if v_status='closed' then
    return jsonb_build_object('ok',true,'order_id',p_order_id,'already_closed',true);
  end if;
  if v_status<>'open' then raise exception 'order_not_open'; end if;

  update public.orders set status='closed',
    settlement_status=case when p_method='fiado' then 'credit' else 'paid' end,
    subtotal=p_amount,total=p_amount,closed_by=p_user_id,closed_at=now()
  where id=p_order_id and tenant_id=p_tenant_id;

  if p_method='fiado' then
    if p_customer_id is null then raise exception 'customer_required'; end if;
    if not exists(
      select 1 from public.customer_credit_accounts
      where tenant_id=p_tenant_id and customer_id=p_customer_id and enabled=true
    ) then raise exception 'credit_not_authorized'; end if;
    insert into public.customer_credit_entries(
      tenant_id,customer_id,order_id,entry_type,amount,description,created_by
    ) values (
      p_tenant_id,p_customer_id,p_order_id,'charge',p_amount,'Venda fiada - '||v_label,p_user_id
    );
  elsif p_amount>0 then
    insert into public.payments_received(tenant_id,order_id,method,amount,created_by)
    values(p_tenant_id,p_order_id,p_method,p_amount,p_user_id);
  end if;

  insert into public.audit_logs(tenant_id,user_id,action,entity,entity_id,metadata)
  values(p_tenant_id,p_user_id,'order_closed','order',p_order_id::text,
    jsonb_build_object('amount',p_amount,'method',p_method));
  return jsonb_build_object('ok',true,'order_id',p_order_id,'already_closed',false);
end;
$$;

revoke all on function private.close_order_atomic_internal(uuid,uuid,uuid,numeric,text,uuid) from public,anon;
grant execute on function private.close_order_atomic_internal(uuid,uuid,uuid,numeric,text,uuid) to authenticated,service_role;

-- O endpoint exposto permanece invoker; a operação privilegiada fica no schema privado.
create or replace function public.close_order_atomic(
  p_tenant_id uuid,p_order_id uuid,p_user_id uuid,p_amount numeric,
  p_method text,p_customer_id uuid default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_temp
as $$
  select private.close_order_atomic_internal(
    p_tenant_id,p_order_id,p_user_id,p_amount,p_method,p_customer_id
  );
$$;

revoke all on function public.close_order_atomic(uuid,uuid,uuid,numeric,text,uuid) from public,anon;
grant execute on function public.close_order_atomic(uuid,uuid,uuid,numeric,text,uuid) to authenticated,service_role;
