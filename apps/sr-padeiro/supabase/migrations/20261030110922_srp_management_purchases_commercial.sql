-- Requires the shared operations migrations and sr-padeiro/admin-console.sql.
create table public.srp_purchases (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.srp_organizations(id),
 store_id uuid not null references public.srp_stores(id),product_id uuid not null references public.srp_products(id),
 request_id uuid not null,quantity numeric(14,3) not null check(quantity>0 and quantity<10000000),
 unit_cost numeric(14,2) not null check(unit_cost>=0 and unit_cost<10000000),
 total numeric generated always as (round(quantity*unit_cost,2)) stored,
 supplier text not null check(length(supplier) between 2 and 160),document text not null default '' check(length(document)<=120),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),unique(organization_id,request_id)
);
create index srp_purchases_org_date on public.srp_purchases(organization_id,created_at desc);
alter table public.srp_purchases enable row level security;
revoke all on public.srp_purchases from public,anon,authenticated;
grant select on public.srp_purchases to authenticated;
create policy srp_purchases_read on public.srp_purchases for select to authenticated
 using(private.ops_catalog_access('sr-padeiro',organization_id) or private.ops_super());

create table public.srp_commercial_settings (
 organization_id uuid primary key references public.srp_organizations(id),
 allowed_providers text[] not null default array['asaas','mercadopago']
   check(allowed_providers<@array['asaas','mercadopago']::text[]),
 preferred_provider text not null default 'asaas' check(preferred_provider in ('asaas','mercadopago','manual')),
 onboarding_stage text not null default 'setup' check(onboarding_stage in ('setup','training','ready','live')),
 notes text not null default '' check(length(notes)<=1000),updated_by uuid references auth.users(id),updated_at timestamptz not null default now(),
 check((preferred_provider='manual' and cardinality(allowed_providers)=0) or preferred_provider=any(allowed_providers))
);
alter table public.srp_commercial_settings enable row level security;
revoke all on public.srp_commercial_settings from public,anon,authenticated;
grant select on public.srp_commercial_settings to authenticated,service_role;
create policy srp_commercial_read on public.srp_commercial_settings for select to authenticated
 using(private.ops_access('sr-padeiro',organization_id,true) or private.ops_super());

alter table public.srp_sale_items add column if not exists cost_price_snapshot numeric(14,2);
create function private.srp_snapshot_cost() returns trigger language plpgsql security definer set search_path='' as $$
begin
 select p.cost_price into new.cost_price_snapshot from public.srp_products p where p.id=new.product_id and p.organization_id=new.organization_id;
 return new;
end $$;
revoke all on function private.srp_snapshot_cost() from public,anon,authenticated;
create trigger srp_snapshot_cost before insert on public.srp_sale_items for each row execute function private.srp_snapshot_cost();
create function private.srp_protect_cost_snapshot() returns trigger language plpgsql set search_path='' as $$
begin
 if new.cost_price_snapshot is distinct from old.cost_price_snapshot then raise exception 'historical_cost_is_immutable'; end if;
 return new;
end $$;
revoke all on function private.srp_protect_cost_snapshot() from public,anon,authenticated;
create trigger srp_protect_cost_snapshot before update on public.srp_sale_items for each row execute function private.srp_protect_cost_snapshot();
create index if not exists srp_management_sales_period on public.srp_sales(organization_id,created_at) where status='completed';
create index if not exists srp_management_items_sale on public.srp_sale_items(organization_id,sale_id);
create index if not exists srp_management_expenses_period on public.srp_expenses(organization_id,created_at);

create function private.srp_management(p_action text,p_org uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 manager boolean; catalog boolean; is_super boolean:=private.ops_super();
 v_store uuid; v_product uuid; v_request uuid; v_id uuid; v_qty numeric; v_cost numeric; v_before numeric;
 v_days int:=coalesce((p_payload->>'days')::int,30); v_start timestamptz; v_end timestamptz;
 v_sales numeric; v_expenses numeric; v_cogs numeric; v_missing int; v_count int; v_reason text;
 v_providers text[]; v_preferred text; v_stage text;
begin
 if auth.uid() is null then raise exception 'forbidden' using errcode='42501'; end if;
 manager:=is_super or private.ops_access('sr-padeiro',p_org,true);
 catalog:=is_super or private.ops_catalog_access('sr-padeiro',p_org);
 if p_action not in ('report','stock','purchase','adjust','expense','commercial','save_commercial','launch','brand') or p_action is null then raise exception 'invalid_action'; end if;
 if not exists(select 1 from public.srp_organizations where id=p_org) then raise exception 'scope_not_found'; end if;
 if p_action in ('stock','purchase','adjust') then
   if not catalog then raise exception 'forbidden' using errcode='42501'; end if;
 elsif not manager then raise exception 'forbidden' using errcode='42501'; end if;

 if p_action='report' then
   if v_days not in (7,30,90) then raise exception 'invalid_period'; end if;
   v_store:=nullif(p_payload->>'store_id','')::uuid;
   if v_store is not null and not exists(select 1 from public.srp_stores where id=v_store and organization_id=p_org) then raise exception 'invalid_store'; end if;
   v_start:=((now() at time zone 'America/Fortaleza')::date-(v_days-1))::timestamp at time zone 'America/Fortaleza';
   v_end:=((now() at time zone 'America/Fortaleza')::date+1)::timestamp at time zone 'America/Fortaleza';
   select coalesce(sum(total),0),count(*) into v_sales,v_count from public.srp_sales
    where organization_id=p_org and status='completed' and created_at>=v_start and created_at<v_end and (v_store is null or store_id=v_store);
   select coalesce(sum(amount),0) into v_expenses from public.srp_expenses where organization_id=p_org
    and created_at>=v_start and created_at<v_end and (v_store is null or store_id=v_store);
   select coalesce(sum(i.quantity*i.cost_price_snapshot),0),count(*) filter(where i.cost_price_snapshot is null)
    into v_cogs,v_missing from public.srp_sale_items i join public.srp_sales s on s.id=i.sale_id and s.organization_id=i.organization_id
    where s.organization_id=p_org and s.status='completed' and s.created_at>=v_start and s.created_at<v_end and (v_store is null or s.store_id=v_store);
   v_missing:=v_missing+(select count(*) from public.srp_sales s where s.organization_id=p_org and s.status='completed' and s.created_at>=v_start and s.created_at<v_end
     and (v_store is null or s.store_id=v_store) and not exists(select 1 from public.srp_sale_items i where i.sale_id=s.id and i.organization_id=p_org));
   return jsonb_build_object('revenue',v_sales,'count',v_count,'expenses',v_expenses,'cogs',case when v_missing=0 then v_cogs end,
    'result',case when v_missing=0 then v_sales-v_cogs-v_expenses end,'missing_costs',v_missing,'starts_at',v_start,'ends_at',v_end,
    'purchases',(select coalesce(sum(total),0) from public.srp_purchases where organization_id=p_org and created_at>=v_start and created_at<v_end and (v_store is null or store_id=v_store)),
    'daily',coalesce((select jsonb_agg(to_jsonb(t) order by t.day) from (select (created_at at time zone 'America/Fortaleza')::date as day,sum(total) as total from public.srp_sales
      where organization_id=p_org and status='completed' and created_at>=v_start and created_at<v_end and (v_store is null or store_id=v_store) group by 1)t),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(to_jsonb(t)) from (select p.method,sum(p.amount) as total from public.srp_sale_payments p join public.srp_sales s on s.id=p.sale_id and s.organization_id=p.organization_id
      where s.organization_id=p_org and s.status='completed' and s.created_at>=v_start and s.created_at<v_end and (v_store is null or s.store_id=v_store) group by 1)t),'[]'::jsonb),
    'top_products',coalesce((select jsonb_agg(to_jsonb(t)) from (select p.name,p.variant,sum(i.quantity) as quantity,sum(i.total) as total from public.srp_sale_items i join public.srp_sales s on s.id=i.sale_id and s.organization_id=i.organization_id join public.srp_products p on p.id=i.product_id and p.organization_id=i.organization_id
      where s.organization_id=p_org and s.status='completed' and s.created_at>=v_start and s.created_at<v_end and (v_store is null or s.store_id=v_store) group by p.id,p.name,p.variant order by sum(i.total) desc limit 10)t),'[]'::jsonb),
    'sales',coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc) from (select s.id,s.created_at,s.status,s.total,s.seller_id,coalesce(p.full_name,'Usuário') as seller_name from public.srp_sales s left join public.profiles p on p.id=s.seller_id where s.organization_id=p_org and s.created_at>=v_start and s.created_at<v_end and (v_store is null or s.store_id=v_store) order by s.created_at desc limit 100)t),'[]'::jsonb));
 elsif p_action='stock' then
   return jsonb_build_object('stores',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name)) from public.srp_stores where organization_id=p_org and active),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'variant',variant,'unit',unit)) from public.srp_products where organization_id=p_org),'[]'::jsonb),
    'inventory',coalesce((select jsonb_agg(to_jsonb(i)) from public.srp_inventory i where organization_id=p_org),'[]'::jsonb),
    'purchases',coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc) from (select * from public.srp_purchases where organization_id=p_org order by created_at desc limit 50)t),'[]'::jsonb),
    'movements',coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc) from (select product_id,store_id,movement_type,quantity,reason,created_at from public.srp_inventory_movements where organization_id=p_org order by created_at desc limit 100)t),'[]'::jsonb));
 elsif p_action in ('purchase','adjust','expense') then
   v_store:=(p_payload->>'store_id')::uuid;v_request:=(p_payload->>'request_id')::uuid;
   if v_store is null or v_request is null or not exists(select 1 from public.srp_stores where id=v_store and organization_id=p_org and active) then raise exception 'invalid_store_or_request'; end if;
   perform pg_advisory_xact_lock(hashtextextended(p_org::text||v_request::text,0));
   if exists(select 1 from public.srp_operation_events where organization_id=p_org and event_name='management_'||p_action and entity_id=v_request) then return jsonb_build_object('ok',true,'reused',true); end if;
   if p_action='expense' then
     v_cost:=(p_payload->>'amount')::numeric;v_reason:=trim(p_payload->>'description');
     if v_cost is null or v_cost<=0 or v_cost>=10000000 or length(coalesce(v_reason,'')) not between 3 and 300 then raise exception 'invalid_expense'; end if;
     insert into public.srp_expenses(organization_id,store_id,description,category,amount,created_by)
     values(p_org,v_store,v_reason,left(coalesce(p_payload->>'category','Operacional'),100),v_cost,auth.uid());
   else
     v_product:=(p_payload->>'product_id')::uuid;v_qty:=(p_payload->>'quantity')::numeric;
     if v_qty is null or v_qty<0 or v_qty>=10000000 or v_qty<>round(v_qty,3) then raise exception 'invalid_quantity'; end if;
     perform 1 from public.srp_products where id=v_product and organization_id=p_org for update;
     if not found then raise exception 'invalid_product'; end if;
     insert into public.srp_inventory(organization_id,store_id,product_id,quantity,minimum_quantity) values(p_org,v_store,v_product,0,0) on conflict do nothing;
     select quantity into v_before from public.srp_inventory where organization_id=p_org and store_id=v_store and product_id=v_product for update;
     if p_action='purchase' then
       v_cost:=(p_payload->>'unit_cost')::numeric;
       if v_qty<=0 or v_cost is null or v_cost<0 or v_cost>=10000000 or v_cost<>round(v_cost,2) then raise exception 'invalid_cost_or_quantity'; end if;
       insert into public.srp_purchases(organization_id,store_id,product_id,request_id,quantity,unit_cost,supplier,document,created_by)
       values(p_org,v_store,v_product,v_request,v_qty,v_cost,trim(p_payload->>'supplier'),coalesce(p_payload->>'document',''),auth.uid()) returning id into v_id;
       update public.srp_inventory set quantity=quantity+v_qty,updated_at=now() where organization_id=p_org and store_id=v_store and product_id=v_product;
       if coalesce((p_payload->>'update_cost')::boolean,false) then update public.srp_products set cost_price=v_cost where id=v_product and organization_id=p_org; end if;
       insert into public.srp_inventory_movements(organization_id,store_id,product_id,movement_type,quantity,reference_id,reason,created_by)
       values(p_org,v_store,v_product,'purchase',v_qty,v_id,'Recebimento de compra',auth.uid());
     else
       v_reason:=trim(p_payload->>'reason');
       if length(coalesce(v_reason,'')) not between 5 and 300 then raise exception 'reason_required'; end if;
       v_cost:=(p_payload->>'minimum')::numeric;
       if v_cost is null or v_cost<0 or v_cost>=10000000 then raise exception 'invalid_minimum'; end if;
       update public.srp_inventory set quantity=v_qty,minimum_quantity=v_cost,updated_at=now() where organization_id=p_org and store_id=v_store and product_id=v_product;
       insert into public.srp_inventory_movements(organization_id,store_id,product_id,movement_type,quantity,reference_id,reason,created_by)
       values(p_org,v_store,v_product,'adjustment',v_qty-v_before,v_request,v_reason,auth.uid());
     end if;
   end if;
   insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata)
   values(p_org,v_store,auth.uid(),'management_'||p_action,'request',v_request,jsonb_build_object('product_id',v_product,'quantity',v_qty,'reason',v_reason));
 elsif p_action='brand' then
   if coalesce(p_payload->>'color','') !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'invalid_color'; end if;
   update public.srp_organizations set primary_color=p_payload->>'color' where id=p_org;
 elsif p_action in ('save_commercial','launch') then
   if not is_super then raise exception 'superadmin_required' using errcode='42501'; end if;
   v_reason:=trim(p_payload->>'reason');
   if length(coalesce(v_reason,'')) not between 5 and 500 then raise exception 'reason_required'; end if;
   if p_action='launch' then
     if not exists(select 1 from public.srp_commercial_settings where organization_id=p_org and onboarding_stage='ready')
       or not exists(select 1 from public.srp_members m join auth.users u on u.id=m.user_id where m.organization_id=p_org and m.active and m.role in ('owner','manager') and u.email_confirmed_at is not null)
       or not exists(select 1 from public.srp_products p join public.srp_inventory i on i.product_id=p.id and i.organization_id=p.organization_id where p.organization_id=p_org and p.active and p.fulfillment<>'confirmar' and i.quantity>0)
       then raise exception 'onboarding_not_ready'; end if;
     if exists(select 1 from public.srp_commercial_settings where organization_id=p_org and cardinality(allowed_providers)>0)
       and not exists(select 1 from public.srp_members m join auth.users u on u.id=m.user_id where m.organization_id=p_org and m.active and m.role='owner' and u.email_confirmed_at is not null)
       then raise exception 'confirmed_owner_required_for_online_billing'; end if;
     update public.srp_organizations set environment='production' where id=p_org;
     update public.srp_commercial_settings set onboarding_stage='live',updated_at=now(),updated_by=auth.uid() where organization_id=p_org;
   else
     v_providers:=array(select jsonb_array_elements_text(p_payload->'allowed_providers'));
     v_preferred:=p_payload->>'preferred_provider';v_stage:=p_payload->>'onboarding_stage';
     if v_stage='live' and not exists(select 1 from public.srp_commercial_settings where organization_id=p_org and onboarding_stage='live') then raise exception 'use_launch_action'; end if;
     insert into public.srp_commercial_settings(organization_id,allowed_providers,preferred_provider,onboarding_stage,notes,updated_by)
     values(p_org,v_providers,v_preferred,v_stage,left(coalesce(p_payload->>'notes',''),1000),auth.uid())
     on conflict(organization_id) do update set allowed_providers=excluded.allowed_providers,preferred_provider=excluded.preferred_provider,
       onboarding_stage=case when srp_commercial_settings.onboarding_stage='live' then 'live' else excluded.onboarding_stage end,notes=excluded.notes,updated_by=auth.uid(),updated_at=now();
   end if;
   insert into public.srp_operation_events(organization_id,user_id,event_name,metadata) values(p_org,auth.uid(),'commercial_'||p_action,jsonb_build_object('reason',v_reason));
 elsif p_action='commercial' then
   return jsonb_build_object('settings',coalesce((select to_jsonb(c) from public.srp_commercial_settings c where organization_id=p_org),jsonb_build_object('allowed_providers',array['asaas','mercadopago'],'preferred_provider','asaas','onboarding_stage','setup','notes','')),
     'subscription',(select jsonb_build_object('status',status,'provider',provider,'monthly_amount',monthly_amount,'current_period_end',current_period_end) from public.srp_subscriptions where organization_id=p_org),
     'transactions',coalesce((select jsonb_agg(to_jsonb(t)) from (select kind,provider,status,amount,created_at from public.srp_billing_transactions where organization_id=p_org order by created_at desc limit 30)t),'[]'::jsonb));
 end if;
 insert into public.operation_audit(app,scope_id,actor_id,action) values('sr-padeiro',p_org,auth.uid(),'management_'||p_action);
 return jsonb_build_object('ok',true);
end $$;
create function public.srp_management(p_action text,p_org uuid,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$select private.srp_management(p_action,p_org,p_payload)$$;
revoke all on function private.srp_management(text,uuid,jsonb),public.srp_management(text,uuid,jsonb) from public,anon;
grant execute on function private.srp_management(text,uuid,jsonb),public.srp_management(text,uuid,jsonb) to authenticated;
