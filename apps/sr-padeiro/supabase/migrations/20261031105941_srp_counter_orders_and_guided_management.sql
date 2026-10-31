-- Requires the shared operations/account guard and Sr. Padeiro management foundations.
create table private.srp_counter_orders (
 id uuid primary key,organization_id uuid not null references public.srp_organizations(id),store_id uuid not null references public.srp_stores(id),
 created_by uuid not null references auth.users(id),kind text not null check(kind in ('counter','pickup','preorder')),customer_label text not null default '',due_at timestamptz,
 status text not null default 'open' check(status in ('open','ready','completed','cancelled')),items jsonb not null,total numeric(14,2) not null,
 version integer not null default 1,last_save uuid not null,sale_id uuid unique references public.srp_sales(id),payment_method text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index srp_counter_queue on private.srp_counter_orders(organization_id,store_id,status,created_at desc);
create table private.srp_counter_goals(organization_id uuid not null,store_id uuid not null,target numeric(14,2) not null check(target>=0),primary key(organization_id,store_id));
alter table private.srp_counter_orders enable row level security;
alter table private.srp_counter_goals enable row level security;
revoke all on private.srp_counter_orders,private.srp_counter_goals from public,anon,authenticated;

-- A coordinated frontend deployment is required: old checkout cannot retry safely.
alter function public.srp_complete_sale(uuid,uuid,uuid,jsonb,text,uuid) set schema private;
alter function private.srp_complete_sale(uuid,uuid,uuid,jsonb,text,uuid) rename to srp_complete_sale_counter_internal;
revoke all on function private.srp_complete_sale_counter_internal(uuid,uuid,uuid,jsonb,text,uuid) from public,anon,authenticated;
create function public.srp_complete_sale(p_organization_id uuid,p_store_id uuid,p_cash_register_id uuid,p_items jsonb,p_payment_method text,p_customer_id uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$begin raise exception 'counter_update_required';end$$;
revoke all on function public.srp_complete_sale(uuid,uuid,uuid,jsonb,text,uuid) from public,anon;
grant execute on function public.srp_complete_sale(uuid,uuid,uuid,jsonb,text,uuid) to authenticated;
-- Direct table writes bypass the checkout invariant; reads still use existing RLS.
revoke insert,update,delete,truncate,references,trigger on public.srp_sales,public.srp_sale_items,public.srp_sale_payments from public,anon,authenticated;
revoke select on public.srp_sales,public.srp_sale_items,public.srp_sale_payments from public,anon;
grant select on public.srp_sales,public.srp_sale_items,public.srp_sale_payments to authenticated;

create function private.srp_counter(p_action text,p_org uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 store uuid; oid uuid; save_key uuid; expected integer; row private.srp_counter_orders; normalized jsonb; entry jsonb; product record;
 qty numeric; subtotal numeric:=0; order_kind text; label text; due timestamptz; sid uuid; cashier uuid; method text; manager boolean; seller boolean; catalog boolean;
 result jsonb; day_start timestamptz:=date_trunc('day',now() at time zone 'America/Fortaleza') at time zone 'America/Fortaleza';
begin
 perform public.ops_account_request_guard();
 if auth.uid() is null or not public.srp_runtime_access(p_org) then raise exception 'forbidden' using errcode='42501';end if;
 catalog:=public.srp_role_allowed(p_org,array['owner','manager','stockist']);
 manager:=public.srp_role_allowed(p_org,array['owner','manager']);seller:=public.srp_role_allowed(p_org,array['owner','manager','cashier']);
 if not seller and not (p_action='product' and catalog) and not (p_action='overview' and private.ops_super()) then raise exception 'forbidden' using errcode='42501';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>50000 then raise exception 'invalid_request';end if;
 store:=(p_payload->>'store_id')::uuid;
 if store is null or not exists(select 1 from public.srp_stores where id=store and organization_id=p_org and active) then raise exception 'invalid_store';end if;
 if p_action='product' then
  if not catalog then raise exception 'forbidden' using errcode='42501';end if;
  qty:=(p_payload->>'price')::numeric;subtotal:=(p_payload->>'cost')::numeric;
  if qty is null or qty<=0 or qty>99999999 or qty='NaN'::numeric or qty<>round(qty,2) or (subtotal is not null and (subtotal<0 or subtotal>99999999 or subtotal='NaN'::numeric or subtotal<>round(subtotal,2))) then raise exception 'invalid_product_price';end if;
  update public.srp_products set sale_price=qty,cost_price=subtotal where id=(p_payload->>'product_id')::uuid and organization_id=p_org returning * into product;
  if not found then raise exception 'invalid_product';end if;
  insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata) values(p_org,store,auth.uid(),'product_price_saved','product',product.id,jsonb_build_object('price',qty,'cost',subtotal));
  return to_jsonb(product);
 end if;
 if p_action in ('overview','goal') then
  if not manager and not private.ops_super() then raise exception 'forbidden' using errcode='42501';end if;
  if p_action='goal' then
   if not manager then raise exception 'forbidden' using errcode='42501';end if;
   qty:=(p_payload->>'target')::numeric;
   if qty is null or qty<0 or qty>99999999 or qty='NaN'::numeric then raise exception 'invalid_target';end if;
   insert into private.srp_counter_goals values(p_org,store,round(qty,2)) on conflict(organization_id,store_id) do update set target=excluded.target;
   insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata) values(p_org,store,auth.uid(),'daily_goal_saved','store',store,jsonb_build_object('target',qty));
  end if;
  select jsonb_build_object(
   'sales_today',count(*) filter(where created_at>=day_start),'revenue_today',coalesce(sum(total) filter(where created_at>=day_start),0),
   'revenue_yesterday',coalesce(sum(total) filter(where created_at>=day_start-interval '1 day' and created_at<day_start),0)) into result
   from public.srp_sales where organization_id=p_org and store_id=store and status='completed' and created_at>=day_start-interval '1 day';
  return result||jsonb_build_object(
   'target',coalesce((select target from private.srp_counter_goals where organization_id=p_org and store_id=store),0),
   'open_orders',(select count(*) from private.srp_counter_orders where organization_id=p_org and store_id=store and status in ('open','ready')),
   'late_orders',(select count(*) from private.srp_counter_orders where organization_id=p_org and store_id=store and status in ('open','ready') and due_at<now()),
   'cash_open',exists(select 1 from public.srp_cash_registers where organization_id=p_org and store_id=store and status='open'),
   'pending_products',(select count(*) from public.srp_products where organization_id=p_org and (not active or fulfillment='confirmar')),
   'missing_costs',(select count(*) from public.srp_products where organization_id=p_org and active and cost_price is null),
   'out_of_stock',(select count(*) from public.srp_products p where p.organization_id=p_org and p.active and p.fulfillment<>'confirmar' and not exists(select 1 from public.srp_inventory i where i.organization_id=p_org and i.store_id=store and i.product_id=p.id and i.quantity>0)),
   'low_stock',coalesce((select jsonb_agg(x) from(select p.name,i.quantity,i.minimum_quantity from public.srp_inventory i join public.srp_products p on p.id=i.product_id and p.organization_id=i.organization_id where i.organization_id=p_org and i.store_id=store and p.active and i.quantity<=i.minimum_quantity order by i.quantity limit 5)x),'[]'::jsonb));
 end if;
 if p_action='list' then
  return jsonb_build_object('orders',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from(select * from private.srp_counter_orders where organization_id=p_org and store_id=store and (status in ('open','ready') or updated_at>=day_start) order by case when status in ('open','ready') then 0 else 1 end,due_at nulls last,created_at desc limit 100)x),'[]'::jsonb),
   'open_count',(select count(*) from private.srp_counter_orders where organization_id=p_org and store_id=store and status in ('open','ready')));
 end if;
 oid:=(p_payload->>'id')::uuid;
 if oid is null then raise exception 'invalid_order';end if;
 -- Serialize even the first save of a UUID; retries cannot race an absent row.
 perform pg_advisory_xact_lock(hashtextextended(oid::text,0));
 select * into row from private.srp_counter_orders where id=oid for update;
 if found and (row.organization_id<>p_org or row.store_id<>store) then raise exception 'forbidden' using errcode='42501';end if;
 if p_action='get' then if row.id is null then return jsonb_build_object('status','not_found');end if;return to_jsonb(row);end if;
 if p_action='save' then
  if row.status='completed' then return to_jsonb(row);end if;
  if row.status='cancelled' then raise exception 'order_closed';end if;
  save_key:=(p_payload->>'save_key')::uuid;expected:=(p_payload->>'version')::integer;
  order_kind:=p_payload->>'kind';label:=trim(coalesce(p_payload->>'customer_label',''));due:=(p_payload->>'due_at')::timestamptz;
  if save_key is null or expected is null or order_kind is null or order_kind not in ('counter','pickup','preorder') or length(label)>120 or (order_kind<>'counter' and length(label)<2) or (order_kind='preorder' and due is null) then raise exception 'invalid_order_details';end if;
  if jsonb_typeof(p_payload->'items') is distinct from 'array' then raise exception 'invalid_items';end if;
  if jsonb_array_length(p_payload->'items') not between 1 and 60 then raise exception 'invalid_items';end if;
  if (select count(distinct e->>'product_id') from jsonb_array_elements(p_payload->'items') e)<>jsonb_array_length(p_payload->'items') then raise exception 'duplicate_product';end if;
  normalized:='[]'::jsonb;
  for entry in select value from jsonb_array_elements(p_payload->'items') order by value->>'product_id' loop
   qty:=(entry->>'quantity')::numeric;
   select * into product from public.srp_products where id=(entry->>'product_id')::uuid and organization_id=p_org and active and fulfillment<>'confirmar' for share;
   if not found or product.sale_price is null or product.sale_price<=0 or product.sale_price='NaN'::numeric or qty is null or qty<=0 or qty>100000 or qty='NaN'::numeric or qty<>round(qty,3) or (product.unit='UN' and qty<>trunc(qty)) then raise exception 'invalid_product_or_quantity';end if;
   subtotal:=subtotal+round(product.sale_price*qty,2);
   normalized:=normalized||jsonb_build_array(jsonb_build_object('product_id',product.id,'name',concat_ws(' • ',product.name,nullif(product.variant,'')),'quantity',qty,'unit',product.unit,'unit_price',product.sale_price));
  end loop;
  if row.last_save=save_key then
   if row.items<>normalized or row.kind<>order_kind or row.customer_label<>label or row.due_at is distinct from due then raise exception 'save_key_conflict';end if;
   return to_jsonb(row);
  end if;
  if (row.id is null and expected<>0) or (row.id is not null and row.version<>expected) then raise exception 'order_changed';end if;
  if row.id is null then
   insert into private.srp_counter_orders(id,organization_id,store_id,created_by,kind,customer_label,due_at,items,total,last_save) values(oid,p_org,store,auth.uid(),order_kind,label,due,normalized,subtotal,save_key) returning * into row;
  else
   update private.srp_counter_orders set items=normalized,total=subtotal,kind=order_kind,customer_label=label,due_at=due,version=version+1,last_save=save_key,updated_at=now() where id=oid returning * into row;
  end if;
 elsif row.id is null then raise exception 'order_not_found';
 elsif p_action='complete' then
  if row.status='completed' then return to_jsonb(row);end if;
  if row.status='cancelled' then raise exception 'order_closed';end if;
  if row.version is distinct from (p_payload->>'version')::integer then raise exception 'order_changed';end if;
  method:=p_payload->>'payment_method';cashier:=(p_payload->>'cash_id')::uuid;
  if method is null or method not in ('cash','pix','debit','credit') then raise exception 'identified_credit_required';end if;
  if cashier is null or not exists(select 1 from public.srp_cash_registers where id=cashier and organization_id=p_org and store_id=store and status='open') then raise exception 'open_cash_required';end if;
  for entry in select value from jsonb_array_elements(row.items) order by value->>'product_id' loop
   select * into product from public.srp_products where id=(entry->>'product_id')::uuid and organization_id=p_org and active and fulfillment<>'confirmar' for share;
   if not found or product.sale_price<>(entry->>'unit_price')::numeric then raise exception 'price_or_product_changed';end if;
  end loop;
  perform 1 from public.srp_cash_registers where id=cashier and organization_id=p_org and store_id=store and status='open' for share;
  if not found then raise exception 'open_cash_required';end if;
  insert into public.srp_sales(organization_id,store_id,cash_register_id,customer_id,seller_id,subtotal,discount,total,status)
   values(p_org,store,cashier,null,auth.uid(),row.total,0,row.total,'completed') returning id into sid;
  for entry in select value from jsonb_array_elements(row.items) order by value->>'product_id' loop
   insert into public.srp_sale_items(organization_id,sale_id,product_id,quantity,unit_price,total)
    values(p_org,sid,(entry->>'product_id')::uuid,(entry->>'quantity')::numeric,(entry->>'unit_price')::numeric,round((entry->>'quantity')::numeric*(entry->>'unit_price')::numeric,2));
  end loop;
  insert into public.srp_sale_payments(organization_id,sale_id,method,amount) values(p_org,sid,method,row.total);
  insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata)
   values(p_org,store,auth.uid(),'sale_completed','sale',sid,jsonb_build_object('total',row.total,'payment',method,'order_id',oid));
  -- Keep the receipt consistent with the committed sale total.
  update private.srp_counter_orders set status='completed',sale_id=sid,payment_method=method,total=(select total from public.srp_sales where id=sid),version=version+1,updated_at=now() where id=oid returning * into row;
 elsif p_action in ('ready','cancel') then
  if row.status not in ('open','ready') then raise exception 'order_closed';end if;
  if row.version is distinct from (p_payload->>'version')::integer then raise exception 'order_changed';end if;
  if p_action='cancel' and (length(trim(coalesce(p_payload->>'reason','')))<3 or length(p_payload->>'reason')>300 or (not manager and row.created_by<>auth.uid())) then raise exception 'cancellation_denied';end if;
  update private.srp_counter_orders set status=case when p_action='ready' then 'ready' else 'cancelled' end,version=version+1,updated_at=now() where id=oid returning * into row;
 else raise exception 'invalid_action';end if;
 insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata) values(p_org,store,auth.uid(),'counter_'||p_action,'counter_order',oid,jsonb_build_object('status',row.status,'version',row.version,'reason',p_payload->>'reason'));
 return to_jsonb(row);
end $$;
create function public.srp_counter(p_action text,p_org uuid,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.srp_counter(p_action,p_org,p_payload)$$;
revoke all on function private.srp_counter(text,uuid,jsonb),public.srp_counter(text,uuid,jsonb) from public,anon;
grant execute on function private.srp_counter(text,uuid,jsonb),public.srp_counter(text,uuid,jsonb) to authenticated;

notify pgrst,'reload schema';
