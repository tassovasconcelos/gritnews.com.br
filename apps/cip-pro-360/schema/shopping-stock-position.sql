begin;
create table public.cip_shopping_stock_batches(
 source_hash text primary key check(source_hash ~ '^[a-f0-9]{64}$'),
 company_id text not null default 'shopping_prohospital' references public.cip_companies(id) check(company_id='shopping_prohospital'),
 source_file text not null,source_sheet text not null,as_of date not null,
 status text not null default 'loading' check(status in ('loading','reference_unreconciled','retired')),
 summary jsonb not null,loaded_at timestamptz not null default now()
);
create table public.cip_shopping_stock_rows(
 source_hash text not null references public.cip_shopping_stock_batches(source_hash),
 company_id text not null default 'shopping_prohospital' check(company_id='shopping_prohospital'),
 source_row integer not null,store_code text not null,store_name text not null,sku text not null,
 description text not null,unit text not null,brand text,product_group text,subgroup text,reference text,curve text,product_status text,as_of date not null,
 quantity numeric(20,6) not null check(quantity>=0),cost_basis text not null,unit_cost numeric(20,6) not null check(unit_cost>=0),declared_cost numeric(20,2) not null,
 accounting_unit_cost numeric(20,6),declared_accounting numeric(20,2),sale_price numeric(20,6),declared_potential numeric(20,2),
 last_purchase date,purchase_unit_cost numeric(20,6),declared_purchase numeric(20,2),last_sale date,
 security_stock numeric(20,6),min_stock numeric(20,6),max_stock numeric(20,6),source_markup numeric(20,6),cost_delta numeric(20,2),
 alerts text[] not null,priority integer not null check(priority between 0 and 100),analysis jsonb not null,source_values jsonb not null,
 primary key(source_hash,store_code,sku),unique(source_hash,source_row)
);
create index cip_shopping_stock_queue_idx on public.cip_shopping_stock_rows(source_hash,priority desc,declared_cost desc,store_code,sku);
create index cip_shopping_stock_alerts_idx on public.cip_shopping_stock_rows using gin(alerts);
create table public.cip_price_decision_log(
 id uuid primary key default gen_random_uuid(),company_id text not null default 'shopping_prohospital' check(company_id='shopping_prohospital'),
 source_hash text not null,store_code text not null,sku text not null,
 actor uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),
 status text not null check(status in ('em_analise','aguardando_dados','proposta_em_revisao','encerrado')),
 note text not null check(char_length(btrim(note)) between 10 and 2000),
 foreign key(source_hash,store_code,sku) references public.cip_shopping_stock_rows(source_hash,store_code,sku)
);
create index cip_price_decision_latest_idx on public.cip_price_decision_log(source_hash,store_code,sku,created_at desc);
alter table public.cip_shopping_stock_batches enable row level security;
alter table public.cip_shopping_stock_rows enable row level security;
alter table public.cip_price_decision_log enable row level security;
revoke all on public.cip_shopping_stock_batches,public.cip_shopping_stock_rows,public.cip_price_decision_log from public,anon,authenticated;
grant select on public.cip_shopping_stock_batches,public.cip_shopping_stock_rows,public.cip_price_decision_log to authenticated;
grant insert(company_id,source_hash,store_code,sku,status,note) on public.cip_price_decision_log to authenticated;
grant all on public.cip_shopping_stock_batches,public.cip_shopping_stock_rows,public.cip_price_decision_log to service_role;
create policy shopping_position_batch_read on public.cip_shopping_stock_batches for select to authenticated using((select public.cip_can_access('shopping_prohospital')) and status='reference_unreconciled');
create policy shopping_position_rows_read on public.cip_shopping_stock_rows for select to authenticated using((select public.cip_can_access('shopping_prohospital')) and exists(select 1 from public.cip_shopping_stock_batches b where b.source_hash=cip_shopping_stock_rows.source_hash and b.status='reference_unreconciled'));
create policy price_decision_read on public.cip_price_decision_log for select to authenticated using((select public.cip_can_access('shopping_prohospital')));
create policy price_decision_insert on public.cip_price_decision_log for insert to authenticated with check(
 actor=(select auth.uid()) and (select public.cip_can_access('shopping_prohospital'))
 and exists(select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active and p.role in ('superadm','diretoria'))
 and exists(select 1 from public.cip_shopping_stock_batches b where b.source_hash=cip_price_decision_log.source_hash and b.status='reference_unreconciled')
);
create function public.cip_shopping_stock_get(p_query text default '',p_store text default '',p_scope text default 'all',p_alert text default '',p_offset integer default 0,p_limit integer default 20) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare b public.cip_shopping_stock_batches;totals jsonb;items jsonb;units jsonb;counts jsonb;
begin
 if p_query is null or char_length(p_query)>200 or p_store is null or p_store!~ '^[0-9]{0,8}$' or p_scope is null or p_scope not in ('all','stores','cd') or p_alert is null or p_alert not in ('','cost_review','missing_price','below_cost','stock_rules','protect_stock','curve_review','no_recent_sale','over_max','curve_a','curve_e') or p_offset is null or p_offset<0 or p_offset>100000 or p_limit is null or p_limit not between 1 and 1000 then raise exception 'invalid_filter';end if;
 select * into b from public.cip_shopping_stock_batches where company_id='shopping_prohospital' and status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1;
 if not found then return jsonb_build_object('available',false);end if;
 with filtered as materialized (select r.* from public.cip_shopping_stock_rows r where r.company_id='shopping_prohospital' and r.source_hash=b.source_hash and (p_store='' or r.store_code=p_store) and (p_scope='all' or p_scope='cd' and r.store_code='100' or p_scope='stores' and r.store_code<>'100') and (p_alert='' or p_alert=any(r.alerts) or p_alert='curve_a' and r.curve='A' or p_alert='curve_e' and r.curve='E') and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',r.sku,r.description,r.brand,r.unit,r.reference,r.product_group)))=0))
 select jsonb_build_object('rows',count(*),'skus',count(distinct sku),'stores',count(distinct store_code),'declared_cost',coalesce(sum(declared_cost),0)::text,'declared_accounting',coalesce(sum(declared_accounting),0)::text,'declared_potential',coalesce(sum(declared_potential),0)::text,'last_sale_max',max(last_sale),'last_sale_missing',count(*) filter(where last_sale is null),'alert_rows',count(*) filter(where cardinality(alerts)>0)) into totals from filtered;
 select coalesce(jsonb_object_agg(code,n),'{}') into counts from(select a.code,count(*) n from public.cip_shopping_stock_rows r cross join lateral unnest(r.alerts) a(code) where (p_alert='' or p_alert=any(r.alerts) or p_alert='curve_a' and r.curve='A' or p_alert='curve_e' and r.curve='E') and r.source_hash=b.source_hash and r.company_id='shopping_prohospital' and (p_store='' or r.store_code=p_store) and (p_scope='all' or p_scope='cd' and r.store_code='100' or p_scope='stores' and r.store_code<>'100') and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',r.sku,r.description,r.brand,r.unit,r.reference,r.product_group)))=0) group by a.code)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from(
  select q.*,l.status decision_status,l.note decision_note from(
   select r.source_hash,r.store_code,r.store_name,r.sku,r.description,r.unit,r.brand,r.product_group,r.reference,r.curve,r.as_of,r.product_status,r.quantity::text,r.cost_basis,r.unit_cost::text,r.declared_cost::text,r.sale_price::text,r.last_sale,r.last_purchase,r.purchase_unit_cost::text,r.min_stock::text,r.max_stock::text,r.security_stock::text,r.alerts,r.priority,r.analysis,r.cost_delta::text
   from public.cip_shopping_stock_rows r where r.source_hash=b.source_hash and r.company_id='shopping_prohospital' and (p_store='' or r.store_code=p_store) and (p_scope='all' or p_scope='cd' and r.store_code='100' or p_scope='stores' and r.store_code<>'100') and (p_alert='' or p_alert=any(r.alerts) or p_alert='curve_a' and r.curve='A' or p_alert='curve_e' and r.curve='E') and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',r.sku,r.description,r.brand,r.unit,r.reference,r.product_group)))=0)
   order by priority desc,declared_cost desc,store_code,sku limit p_limit offset p_offset
  )q left join lateral(select status,note from public.cip_price_decision_log l where l.company_id='shopping_prohospital' and l.source_hash=q.source_hash and l.store_code=q.store_code and l.sku=q.sku order by created_at desc,id desc limit 1)l on true
 )x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into units from(select r.store_code,min(r.store_name) name,count(*) rows,sum(r.declared_cost)::text cost from public.cip_shopping_stock_rows r where r.source_hash=b.source_hash and r.company_id='shopping_prohospital' group by store_code order by store_code::integer)x;
 return jsonb_build_object('available',true,'company','shopping_prohospital','batch',jsonb_build_object('source_hash',b.source_hash,'source_file',b.source_file,'as_of',b.as_of,'status',b.status,'loaded_at',b.loaded_at,'summary',b.summary),'summary',totals,'alerts',counts,'items',items,'units',units,'query',p_query,'store',p_store,'scope',p_scope,'alert',p_alert,'offset',p_offset,'limit',p_limit);
end;$$;
revoke all on function public.cip_shopping_stock_get(text,text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.cip_shopping_stock_get(text,text,text,text,integer,integer) to authenticated,service_role;
create function public.cip_bot_shopping_stock(p_telegram text,p_chat text,p_company text,p_scope text default 'all',p_query text default '',p_store text default '',p_alert text default '') returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid;
begin
 select user_id into actor from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and chat_id=telegram_id and active;
 if actor is null or not coalesce(p_company=any(public.cip_report_companies(actor)),false) then raise exception 'authorized_company_required';end if;
 if p_company<>'shopping_prohospital' then return jsonb_build_object('available',false);end if;
 return public.cip_shopping_stock_get(p_query,p_store,p_scope,p_alert,0,5);
end;$$;
revoke all on function public.cip_bot_shopping_stock(text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_shopping_stock(text,text,text,text,text,text,text) to service_role;
comment on table public.cip_shopping_stock_rows is 'Private dated Shopping workbook position including CD100. Source valuation types, curve and last sale are retained. No verified sales velocity, complete company coverage, lot aging or realized margin. Do not add overlapping historical references.';
comment on table public.cip_price_decision_log is 'Append-only review notes by directors. Not ERP price approval or execution. Snapshot-specific; never carries approval to another position.';
commit;
