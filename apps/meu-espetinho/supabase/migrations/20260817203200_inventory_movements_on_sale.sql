create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null check (movement_type in ('sale','adjustment','restock','correction')),
  quantity_delta numeric not null,
  balance_after numeric,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_tenant_product_idx on public.inventory_movements(tenant_id,product_id,created_at desc);
alter table public.inventory_movements enable row level security;
drop policy if exists inventory_movements_tenant_select on public.inventory_movements;
create policy inventory_movements_tenant_select on public.inventory_movements for select to authenticated using (private.user_has_tenant_access(tenant_id));
revoke all on table public.inventory_movements from anon;

create or replace function private.close_order_atomic_internal(p_tenant_id uuid,p_order_id uuid,p_user_id uuid,p_amount numeric,p_method text,p_customer_id uuid default null)
returns jsonb language plpgsql security definer set search_path='public','private','pg_temp' as $$
declare v_label text; v_status text; v_item record; v_balance numeric;
begin
  if auth.uid() is null or p_user_id<>auth.uid() then raise exception 'invalid_user'; end if;
  if not private.user_has_tenant_access(p_tenant_id) then raise exception 'forbidden'; end if;
  if p_amount<0 then raise exception 'invalid_amount'; end if;
  if p_method not in ('cash','pix','credit_card','debit_card','other','fiado') then raise exception 'invalid_payment_method'; end if;
  select label,status into v_label,v_status from public.orders where id=p_order_id and tenant_id=p_tenant_id for update;
  if v_label is null then raise exception 'order_not_found'; end if;
  if v_status='closed' then return jsonb_build_object('ok',true,'order_id',p_order_id,'already_closed',true); end if;
  if v_status<>'open' then raise exception 'order_not_open'; end if;
  update public.orders set status='closed',settlement_status=case when p_method='fiado' then 'credit' else 'paid' end,subtotal=p_amount,total=p_amount,closed_by=p_user_id,closed_at=now() where id=p_order_id and tenant_id=p_tenant_id;
  for v_item in select product_id,sum(quantity)::numeric as qty from public.order_items where tenant_id=p_tenant_id and order_id=p_order_id and product_id is not null group by product_id loop
    update public.products set stock_qty=greatest(coalesce(stock_qty,0)-v_item.qty,0) where id=v_item.product_id and tenant_id=p_tenant_id returning stock_qty into v_balance;
    if found then
      insert into public.inventory_movements(tenant_id,product_id,order_id,movement_type,quantity_delta,balance_after,created_by)
      values(p_tenant_id,v_item.product_id,p_order_id,'sale',-v_item.qty,v_balance,p_user_id);
    end if;
  end loop;
  if p_method='fiado' then
    if p_customer_id is null then raise exception 'customer_required'; end if;
    if not exists(select 1 from public.customer_credit_accounts where tenant_id=p_tenant_id and customer_id=p_customer_id and enabled=true) then raise exception 'credit_not_authorized'; end if;
    insert into public.customer_credit_entries(tenant_id,customer_id,order_id,entry_type,amount,description,created_by) values(p_tenant_id,p_customer_id,p_order_id,'charge',p_amount,'Venda fiada - '||v_label,p_user_id);
  elsif p_amount>0 then
    insert into public.payments_received(tenant_id,order_id,method,amount,created_by) values(p_tenant_id,p_order_id,p_method,p_amount,p_user_id);
  end if;
  insert into public.audit_logs(tenant_id,user_id,action,entity,entity_id,metadata) values(p_tenant_id,p_user_id,'order_closed','order',p_order_id::text,jsonb_build_object('amount',p_amount,'method',p_method));
  return jsonb_build_object('ok',true,'order_id',p_order_id,'already_closed',false);
end;$$;