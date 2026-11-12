-- Additive retail/CRM API. Private storage; every request validates account and scope.
alter table public.srp_customers add column if not exists whatsapp_opt_in boolean not null default false;
create index if not exists srp_customers_org_name on public.srp_customers(organization_id,name,id);
create index if not exists srp_sales_customer_history on public.srp_sales(organization_id,customer_id,created_at desc,id);
create unique index if not exists srp_one_open_cash_per_store on public.srp_cash_registers(organization_id,store_id) where status='open';
-- The validated API owns writes, including store checks and idempotent cash operations.
revoke insert,update,delete,truncate,references,trigger on public.srp_customers,public.srp_cash_registers from public,anon,authenticated;
create table private.srp_customer_contacts (
 id uuid primary key, organization_id uuid not null references public.srp_organizations(id),
 customer_id uuid not null references public.srp_customers(id), created_by uuid not null references auth.users(id),
 note text not null check(length(note) between 3 and 1000), created_at timestamptz not null default now()
);
alter table private.srp_customer_contacts enable row level security;
revoke all on private.srp_customer_contacts from public,anon,authenticated;
create index srp_contacts_customer on private.srp_customer_contacts(organization_id,customer_id,created_at desc);

create or replace function private.srp_retail(p_action text,p_org uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare store uuid; cid uuid; sid uuid; row public.srp_customers; cash public.srp_cash_registers;
 n text; v_phone text; q text; days integer; page integer; result jsonb; amount numeric; expected numeric;
 writer boolean; reader boolean; start_at timestamptz;
begin
 perform public.ops_account_request_guard();
 if auth.uid() is null or not public.srp_runtime_access(p_org) then raise exception 'forbidden' using errcode='42501';end if;
 writer:=public.srp_role_allowed(p_org,array['owner','manager','cashier']);
 reader:=writer or public.srp_role_allowed(p_org,array['viewer']) or private.ops_super();
 if not reader then raise exception 'forbidden' using errcode='42501';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>10000 then raise exception 'invalid_request';end if;
 store:=nullif(p_payload->>'store_id','')::uuid;
 if store is not null and not exists(select 1 from public.srp_stores where id=store and organization_id=p_org and active) then raise exception 'invalid_store';end if;
 cid:=nullif(p_payload->>'customer_id','')::uuid;
 if cid is not null and not exists(select 1 from public.srp_customers where id=cid and organization_id=p_org) then raise exception 'invalid_customer';end if;
 page:=greatest(0,least(10000,coalesce((p_payload->>'page')::integer,0)));
 q:=left(trim(coalesce(p_payload->>'search','')),100);
 if p_action='customers' then
  return jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(x)) from(select c.* from public.srp_customers c where organization_id=p_org and (q='' or position(lower(q) in lower(c.name))>0 or position(regexp_replace(q,'[^0-9]','','g') in coalesce(c.phone,''))>0 and regexp_replace(q,'[^0-9]','','g')<>'') order by c.name,c.id limit 51 offset page*50)x),'[]'::jsonb));
 elsif p_action='customer_save' then
  if not writer then raise exception 'forbidden' using errcode='42501';end if;
  sid:=nullif(p_payload->>'id','')::uuid;n:=trim(p_payload->>'name');v_phone:=regexp_replace(coalesce(p_payload->>'phone',''),'[^0-9]','','g');
  if length(v_phone) in (10,11) then v_phone:='55'||v_phone;end if;
  if sid is null or n is null or length(n) not between 2 and 120 or (v_phone<>'' and v_phone!~'^55[1-9][0-9]{9,10}$') then raise exception 'invalid_customer_details';end if;
  perform pg_advisory_xact_lock(hashtextextended(p_org::text||v_phone,0));
  if exists(select 1 from public.srp_customers where id=sid and organization_id<>p_org) then raise exception 'invalid_customer';end if;
  if v_phone<>'' and exists(select 1 from public.srp_customers where organization_id=p_org and regexp_replace(coalesce(srp_customers.phone,''),'[^0-9]','','g') in (v_phone,substring(v_phone from 3)) and id<>sid) then raise exception 'customer_phone_exists';end if;
  insert into public.srp_customers(id,organization_id,name,phone,whatsapp_opt_in) values(sid,p_org,n,nullif(v_phone,''),coalesce((p_payload->>'whatsapp_opt_in')::boolean,false))
  on conflict(id) do update set name=excluded.name,phone=excluded.phone,whatsapp_opt_in=excluded.whatsapp_opt_in where srp_customers.organization_id=p_org returning * into row;
  if not found then raise exception 'invalid_customer';end if;
  insert into public.srp_operation_events(organization_id,user_id,event_name,entity_type,entity_id,metadata) values(p_org,auth.uid(),'customer_saved','customer',sid,jsonb_build_object('whatsapp_opt_in',row.whatsapp_opt_in));
  return to_jsonb(row);
 elsif p_action='contact' then
  if not writer then raise exception 'forbidden' using errcode='42501';end if;
  n:=trim(p_payload->>'note');sid:=nullif(p_payload->>'id','')::uuid;
  if cid is null or sid is null or n is null or length(n) not between 3 and 1000 then raise exception 'invalid_contact';end if;
  insert into private.srp_customer_contacts(id,organization_id,customer_id,created_by,note) values(sid,p_org,cid,auth.uid(),n) on conflict(id) do nothing;
  if not exists(select 1 from private.srp_customer_contacts where id=sid and organization_id=p_org and customer_id=cid and note=n) then raise exception 'invalid_contact';end if;
  return jsonb_build_object('saved',true);
 elsif p_action='customer' then
  if cid is null then raise exception 'invalid_customer';end if;
  select to_jsonb(c) into result from public.srp_customers c where id=cid and organization_id=p_org;
  return result||jsonb_build_object('summary',(select jsonb_build_object('visits',count(*),'total',coalesce(sum(total),0),'last_sale',max(created_at)) from public.srp_sales where organization_id=p_org and customer_id=cid and status='completed'),
   'contacts',coalesce((select jsonb_agg(to_jsonb(x)) from(select id,note,created_at from private.srp_customer_contacts where organization_id=p_org and customer_id=cid order by created_at desc,id limit 50)x),'[]'::jsonb));
 elsif p_action='sales' then
  days:=coalesce((p_payload->>'days')::integer,30);if days not between 1 and 366 then raise exception 'invalid_period';end if;
  start_at:=(date_trunc('day',now() at time zone 'America/Fortaleza')-make_interval(days=>days-1)) at time zone 'America/Fortaleza';
  return jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(x)) from(select s.id,s.total,s.status,s.created_at,s.customer_id,c.name as customer_name,
   (select string_agg(method,', ') from public.srp_sale_payments where sale_id=s.id and organization_id=p_org) as payment
   from public.srp_sales s left join public.srp_customers c on c.id=s.customer_id and c.organization_id=s.organization_id
   where s.organization_id=p_org and (store is null or s.store_id=store) and (cid is null or s.customer_id=cid) and s.created_at>=start_at and (q='' or s.id::text ilike '%'||q||'%' or position(lower(q) in lower(coalesce(c.name,'')))>0)
   order by s.created_at desc,s.id desc limit 51 offset page*50)x),'[]'::jsonb));
 elsif p_action='receipt' then
  sid:=(p_payload->>'sale_id')::uuid;
  select to_jsonb(s) into result from public.srp_sales s where id=sid and organization_id=p_org and (store is null or store_id=store) and status='completed';
  if result is null then raise exception 'sale_not_found';end if;
  return result||jsonb_build_object('operator_name',coalesce((select nullif(trim(raw_user_meta_data->>'full_name'),'') from auth.users where id=(result->>'seller_id')::uuid),'Equipe'),'customer',(select jsonb_build_object('id',id,'name',name,'phone',srp_customers.phone) from public.srp_customers where id=(result->>'customer_id')::uuid and organization_id=p_org),
   'items',coalesce((select items from private.srp_counter_orders where sale_id=sid and organization_id=p_org),
    (select jsonb_agg(jsonb_build_object('product_id',i.product_id,'name',coalesce(p.name,'Produto indisponível'),'unit',coalesce(p.unit,'UN'),'quantity',i.quantity,'unit_price',i.unit_price)) from public.srp_sale_items i left join public.srp_products p on p.id=i.product_id and p.organization_id=i.organization_id where i.sale_id=sid and i.organization_id=p_org)),
   'payments',(select jsonb_agg(jsonb_build_object('method',method,'amount',srp_sale_payments.amount)) from public.srp_sale_payments where sale_id=sid and organization_id=p_org));
 elsif p_action in ('cash_summary','cash_open','cash_close') then
  if store is null then raise exception 'invalid_store';end if;
  if p_action<>'cash_summary' and not writer then raise exception 'forbidden' using errcode='42501';end if;
  perform pg_advisory_xact_lock(hashtextextended('srp-cash:'||store::text,0));
  if p_action='cash_open' then
   sid:=(p_payload->>'id')::uuid;amount:=(p_payload->>'amount')::numeric;
   if sid is null or amount is null or amount<0 or amount>99999999 or amount='NaN'::numeric or amount<>round(amount,2) then raise exception 'invalid_amount';end if;
   select * into cash from public.srp_cash_registers where id=sid;
   if found then
    if cash.organization_id<>p_org or cash.store_id<>store or cash.opening_amount<>amount then raise exception 'cash_conflict';end if;
   else
    if exists(select 1 from public.srp_cash_registers where organization_id=p_org and store_id=store and status='open') then raise exception 'cash_already_open';end if;
    insert into public.srp_cash_registers(id,organization_id,store_id,opened_by,opening_amount,status) values(sid,p_org,store,auth.uid(),amount,'open') returning * into cash;
   end if;
  elsif p_action='cash_close' then
   sid:=(p_payload->>'id')::uuid;amount:=(p_payload->>'amount')::numeric;
   if sid is null or amount is null or amount<0 or amount>99999999 or amount='NaN'::numeric or amount<>round(amount,2) then raise exception 'invalid_amount';end if;
   select * into cash from public.srp_cash_registers where id=sid and organization_id=p_org and store_id=store for update;
   if not found then raise exception 'cash_not_found';end if;
   if cash.status='closed' and cash.counted_amount<>amount then raise exception 'cash_conflict';end if;
   if cash.status='open' then
    select cash.opening_amount+coalesce(sum(p.amount),0) into expected from public.srp_sale_payments p join public.srp_sales s on s.id=p.sale_id and s.organization_id=p.organization_id where s.organization_id=p_org and s.cash_register_id=sid and s.status='completed' and p.method='cash';
    update public.srp_cash_registers set status='closed',closed_at=now(),counted_amount=amount,expected_amount=expected where id=sid returning * into cash;
    insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata) values(p_org,store,auth.uid(),'cash_closed','cash_register',sid,jsonb_build_object('expected',expected,'counted',amount));
   end if;
  else
   select * into cash from public.srp_cash_registers where organization_id=p_org and store_id=store order by (status='open') desc,opened_at desc,id limit 1;
  end if;
  return jsonb_build_object('cash',case when cash.id is null then null else to_jsonb(cash) end,'methods',coalesce((select jsonb_agg(to_jsonb(x)) from(select p.method,sum(p.amount) as total from public.srp_sale_payments p join public.srp_sales s on s.id=p.sale_id and s.organization_id=p.organization_id where s.organization_id=p_org and s.cash_register_id=cash.id and s.status='completed' group by p.method)x),'[]'::jsonb));
 end if;
 raise exception 'invalid_action';
end $$;
create or replace function public.srp_retail(p_action text,p_org uuid,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.srp_retail(p_action,p_org,p_payload)$$;
revoke all on function private.srp_retail(text,uuid,jsonb),public.srp_retail(text,uuid,jsonb) from public,anon;
grant execute on function private.srp_retail(text,uuid,jsonb),public.srp_retail(text,uuid,jsonb) to authenticated;

alter table private.srp_counter_orders add column customer_id uuid references public.srp_customers(id);
create or replace function private.srp_counter(p_action text,p_org uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 store uuid; oid uuid; save_key uuid; expected integer; row private.srp_counter_orders; normalized jsonb; entry jsonb; product record;
 customer uuid; qty numeric; subtotal numeric:=0; order_kind text; label text; due timestamptz; sid uuid; cashier uuid; method text; manager boolean; seller boolean; catalog boolean;
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
  update public.srp_products set sale_price=qty,cost_price=subtotal,cost_reviewed=(subtotal is not null) where id=(p_payload->>'product_id')::uuid and organization_id=p_org returning * into product;
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
   'missing_costs',(select count(*) from public.srp_products where organization_id=p_org and active and (cost_price is null or (cost_price=0 and not cost_reviewed))),
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
  customer:=nullif(p_payload->>'customer_id','')::uuid;
  if customer is not null and not exists(select 1 from public.srp_customers where id=customer and organization_id=p_org) then raise exception 'invalid_customer';end if;
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
   if row.customer_id is distinct from customer or row.items<>normalized or row.kind<>order_kind or row.customer_label<>label or row.due_at is distinct from due then raise exception 'save_key_conflict';end if;
   return to_jsonb(row);
  end if;
  if (row.id is null and expected<>0) or (row.id is not null and row.version<>expected) then raise exception 'order_changed';end if;
  if row.id is null then
   insert into private.srp_counter_orders(id,organization_id,store_id,created_by,kind,customer_label,due_at,items,total,last_save,customer_id) values(oid,p_org,store,auth.uid(),order_kind,label,due,normalized,subtotal,save_key,customer) returning * into row;
  else
   update private.srp_counter_orders set customer_id=customer,items=normalized,total=subtotal,kind=order_kind,customer_label=label,due_at=due,version=version+1,last_save=save_key,updated_at=now() where id=oid returning * into row;
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
   values(p_org,store,cashier,row.customer_id,auth.uid(),row.total,0,row.total,'completed') returning id into sid;
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

notify pgrst,'reload schema';

