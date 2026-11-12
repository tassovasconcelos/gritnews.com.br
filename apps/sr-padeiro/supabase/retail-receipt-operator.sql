-- Preserve the sale actor when another operator opens its receipt.
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

notify pgrst,'reload schema';
