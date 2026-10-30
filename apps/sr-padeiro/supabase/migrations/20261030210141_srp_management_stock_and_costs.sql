-- Manager workspace: scoped reports, audited stock/cost changes and historical cost snapshots.
alter table public.srp_inventory add column if not exists target_quantity numeric not null default 50 check(target_quantity>=0);
alter table public.srp_products add column if not exists cost_reviewed boolean not null default false;
alter table public.srp_sale_items add column if not exists unit_cost_snapshot numeric check(unit_cost_snapshot>=0);

create or replace function private.srp_capture_item_cost() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 select case when p.cost_reviewed or p.cost_price>0 then p.cost_price else null end into new.unit_cost_snapshot
 from public.srp_products p where p.id=new.product_id and p.organization_id=new.organization_id;
 return new;
end $$;
revoke all on function private.srp_capture_item_cost() from public,anon,authenticated;
create trigger srp_capture_item_cost before insert on public.srp_sale_items for each row execute function private.srp_capture_item_cost();

-- Include explicitly authorized support sessions in operational auditing.
create policy srp_manager_audit_insert on public.srp_operation_events for insert to authenticated
with check(user_id=(select auth.uid()) and public.srp_runtime_access(organization_id)
 and public.srp_role_allowed(organization_id,array['owner','manager','stockist']));

create or replace function public.srp_stock_management(o uuid, st uuid) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 perform public.ops_account_request_guard();
 if not(public.srp_runtime_access(o) and public.srp_role_allowed(o,array['owner','manager','stockist'])) and not private.ops_super() then raise exception 'Acesso de gestão necessário' using errcode='42501'; end if;
 if st is null or not exists(select 1 from public.srp_stores where id=st and organization_id=o) then raise exception 'Loja inválida'; end if;
 with sold as (
 select i.product_id,coalesce(sum(i.quantity) filter(where s.created_at>=now()-interval '7 days'),0) sold7,sum(i.quantity) sold28
 from public.srp_sale_items i join public.srp_sales s on s.id=i.sale_id and s.organization_id=i.organization_id
 where s.organization_id=o and s.store_id=st and s.status='completed' and s.created_at>=now()-interval '28 days' group by i.product_id
 ), stock_rows as (
 select p.id,p.name,p.variant,p.unit,p.active,p.fulfillment,p.sale_price,p.cost_price,(p.cost_reviewed or p.cost_price>0) cost_known,
 i.product_id is not null stock_configured,coalesce(i.quantity,0) quantity,coalesce(i.minimum_quantity,5) minimum_quantity,coalesce(i.target_quantity,50) target_quantity,
 coalesce(s.sold7,0) sold7,coalesce(s.sold28,0) sold28,
 greatest(coalesce(i.target_quantity,50),coalesce(i.minimum_quantity,5),ceil(greatest(coalesce(s.sold7,0),coalesce(s.sold28,0)/4)*1.15)) target
 from public.srp_products p left join public.srp_inventory i on i.organization_id=p.organization_id and i.product_id=p.id and i.store_id=st left join sold s on s.product_id=p.id
 where p.organization_id=o
 ) select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('suggested',case when active and fulfillment='pronta_entrega' then greatest(0,target-quantity) else 0 end) order by name,variant),'[]') into result from stock_rows r;
 return result;
end $$;
revoke all on function public.srp_stock_management(uuid,uuid) from public,anon;
grant execute on function public.srp_stock_management(uuid,uuid) to authenticated;

create or replace function public.srp_management_report(o uuid, st uuid, days integer default 30) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; start_at timestamptz; end_at timestamptz;
begin
 perform public.ops_account_request_guard();
 if not(public.srp_runtime_access(o) and public.srp_role_allowed(o,array['owner','manager'])) and not private.ops_super() then raise exception 'Acesso de proprietário ou gestor necessário' using errcode='42501'; end if;
 if days not in (7,30,90) then raise exception 'Período inválido'; end if;
 if st is null or not exists(select 1 from public.srp_stores where id=st and organization_id=o) then raise exception 'Loja inválida'; end if;
 end_at:=((now() at time zone 'America/Fortaleza')::date+1)::timestamp at time zone 'America/Fortaleza';
 start_at:=end_at-make_interval(days=>days);
 with sales as materialized (
 select * from public.srp_sales where organization_id=o and store_id=st and status='completed' and created_at>=start_at and created_at<end_at
 ), lines as materialized (
 select i.*,case when s.subtotal>0 then i.total*s.total/s.subtotal else i.total end net
 from public.srp_sale_items i join sales s on s.id=i.sale_id and s.organization_id=i.organization_id
 ), perf as (
 select l.product_id,sum(l.quantity) quantity,sum(l.net) revenue,sum(l.quantity*l.unit_cost_snapshot) known_cost,
 sum(l.net) filter(where l.unit_cost_snapshot is not null) known_revenue,count(*) filter(where l.unit_cost_snapshot is null) missing_cost_lines
 from lines l group by product_id
 ), daily as (
 select (created_at at time zone 'America/Fortaleza')::date day_key,sum(total) revenue,count(*) sales from sales group by 1
 ), expenses as materialized (
 select id,description,category,amount,created_at from public.srp_expenses where organization_id=o and store_id=st and created_at>=start_at and created_at<end_at
 ) select jsonb_build_object(
 'period',jsonb_build_object('days',days,'start',start_at,'end',end_at),
 'summary',jsonb_build_object('revenue',coalesce((select sum(total) from sales),0),'sales',(select count(*) from sales),
 'previous_revenue',coalesce((select sum(total) from public.srp_sales where organization_id=o and store_id=st and status='completed' and created_at>=start_at-make_interval(days=>days) and created_at<start_at),0),
 'ticket',coalesce((select avg(total) from sales),0),'expenses',coalesce((select sum(amount) from expenses),0),
 'known_cost',coalesce((select sum(quantity*unit_cost_snapshot) from lines),0),
 'known_revenue',coalesce((select sum(net) from lines where unit_cost_snapshot is not null),0),
 'missing_cost_lines',(select count(*) from lines where unit_cost_snapshot is null),'item_lines',(select count(*) from lines)),
 'daily',coalesce((select jsonb_agg(jsonb_build_object('day',d::date,'revenue',coalesce(v.revenue,0),'sales',coalesce(v.sales,0)) order by d) from generate_series(start_at at time zone 'America/Fortaleza',(end_at at time zone 'America/Fortaleza')-interval '1 day',interval '1 day') d left join daily v on v.day_key=d::date),'[]'),
 'products',coalesce((select jsonb_agg(to_jsonb(x) order by revenue desc) from (select p.id,p.name,p.variant,p.unit,p.sale_price,p.cost_price,(p.cost_reviewed or p.cost_price>0) cost_known,coalesce(f.quantity,0) quantity,coalesce(f.revenue,0) revenue,coalesce(f.known_cost,0) known_cost,coalesce(f.known_revenue,0) known_revenue,coalesce(f.missing_cost_lines,0) missing_cost_lines from public.srp_products p left join perf f on f.product_id=p.id where p.organization_id=o)x),'[]'),
 'payments',coalesce((select jsonb_agg(to_jsonb(x)) from (select p.method,sum(p.amount) amount from public.srp_sale_payments p join sales s on s.id=p.sale_id and s.organization_id=p.organization_id group by p.method)x),'[]'),
 'expenses',coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc) from expenses e),'[]'),
 'recent_sales',coalesce((select jsonb_agg(to_jsonb(x) order by created_at desc) from (select id,total,discount,created_at from sales order by created_at desc limit 100)x),'[]'),
 'stock',public.srp_stock_management(o,st)
 ) into result;
 return result;
end $$;
revoke all on function public.srp_management_report(uuid,uuid,integer) from public,anon;
grant execute on function public.srp_management_report(uuid,uuid,integer) to authenticated;

create or replace function public.srp_set_stock(o uuid, st uuid, p uuid, qty numeric, min_qty numeric, target_qty numeric, reason text) returns void language plpgsql security invoker set search_path='' as $$
declare before_qty numeric;
begin
 perform public.ops_account_request_guard();
 if not(public.srp_runtime_access(o) and public.srp_role_allowed(o,array['owner','manager','stockist'])) then raise exception 'Sem permissão' using errcode='42501'; end if;
 if qty is null or min_qty is null or target_qty is null or qty<0 or min_qty<0 or target_qty<min_qty or qty>999999999 or target_qty>999999999 or qty::text='NaN' or min_qty::text='NaN' or target_qty::text='NaN' or length(trim(reason))<5 or reason is null then raise exception 'Confira saldo, mínimo, alvo e motivo'; end if;
 if not exists(select 1 from public.srp_stores where id=st and organization_id=o) or not exists(select 1 from public.srp_products where id=p and organization_id=o) then raise exception 'Produto ou loja inválidos'; end if;
 insert into public.srp_inventory(organization_id,store_id,product_id,quantity,minimum_quantity,target_quantity) values(o,st,p,0,min_qty,target_qty) on conflict(store_id,product_id) do nothing;
 select quantity into before_qty from public.srp_inventory where organization_id=o and store_id=st and product_id=p for update;
 update public.srp_inventory set quantity=qty,minimum_quantity=min_qty,target_quantity=target_qty,updated_at=now() where organization_id=o and store_id=st and product_id=p;
 insert into public.srp_inventory_movements(organization_id,store_id,product_id,movement_type,quantity,reason,created_by) values(o,st,p,'adjustment',qty-before_qty,trim(reason),auth.uid());
 insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata) values(o,st,auth.uid(),'stock_adjusted','product',p,jsonb_build_object('before',before_qty,'after',qty,'minimum',min_qty,'target',target_qty,'reason',trim(reason)));
end $$;
revoke all on function public.srp_set_stock(uuid,uuid,uuid,numeric,numeric,numeric,text) from public,anon;
grant execute on function public.srp_set_stock(uuid,uuid,uuid,numeric,numeric,numeric,text) to authenticated;

create or replace function public.srp_set_product_cost(o uuid,p uuid,cost numeric,price numeric,reason text) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform public.ops_account_request_guard();
 if not(public.srp_runtime_access(o) and public.srp_role_allowed(o,array['owner','manager'])) then raise exception 'Sem permissão' using errcode='42501'; end if;
 if cost is null or price is null or cost<0 or price<0 or cost>999999999 or price>999999999 or cost::text='NaN' or price::text='NaN' or reason is null or length(trim(reason))<5 then raise exception 'Confira custo, preço e motivo'; end if;
 update public.srp_products set cost_price=cost,sale_price=price,cost_reviewed=true where organization_id=o and id=p;
 if not found then raise exception 'Produto inválido'; end if;
 insert into public.srp_operation_events(organization_id,user_id,event_name,entity_type,entity_id,metadata) values(o,auth.uid(),'product_cost_reviewed','product',p,jsonb_build_object('cost',cost,'price',price,'reason',trim(reason)));
end $$;
revoke all on function public.srp_set_product_cost(uuid,uuid,numeric,numeric,text) from public,anon;
grant execute on function public.srp_set_product_cost(uuid,uuid,numeric,numeric,text) to authenticated;

create or replace function public.srp_register_expense(o uuid,st uuid,description text,category text,amount numeric) returns void language plpgsql security invoker set search_path='' as $$
declare expense_id uuid;
begin
 perform public.ops_account_request_guard();
 if not(public.srp_runtime_access(o) and public.srp_role_allowed(o,array['owner','manager'])) then raise exception 'Sem permissão' using errcode='42501'; end if;
 if description is null or length(trim(description))<3 or length(description)>200 or category is null or length(category)>100 or amount is null or amount<=0 or amount>999999999 or amount::text='NaN' then raise exception 'Despesa inválida'; end if;
 if not exists(select 1 from public.srp_stores where id=st and organization_id=o) then raise exception 'Loja inválida'; end if;
 insert into public.srp_expenses(organization_id,store_id,description,category,amount,created_by) values(o,st,trim(description),category,amount,auth.uid()) returning id into expense_id;
 insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata) values(o,st,auth.uid(),'expense_registered','expense',expense_id,jsonb_build_object('amount',amount,'category',category));
end $$;
revoke all on function public.srp_register_expense(uuid,uuid,text,text,numeric) from public,anon;
grant execute on function public.srp_register_expense(uuid,uuid,text,text,numeric) to authenticated;
