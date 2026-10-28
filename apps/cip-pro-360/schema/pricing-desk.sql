-- Marca-passo desk: evidence, supervised scheduling and an analytical agent. No ERP writes.
begin;
create schema if not exists cip_pricing_private;
revoke all on schema cip_pricing_private from public,anon;
grant usage on schema cip_pricing_private to authenticated;
create table public.cip_mp_market_refs(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),sku text not null,competitor text not null,
 our_unit text not null,pack_price numeric(20,6) not null check(pack_price>0),shipping numeric(20,6) not null check(shipping>=0),equivalent_units numeric(20,6) not null check(equivalent_units>0),
 normalized_price numeric(20,6) generated always as ((pack_price+shipping)/equivalent_units) stored check(normalized_price>0),
 channel text not null check(channel in ('loja','b2b','ecommerce','marketplace')),conditions text not null,source_url text not null,
 observed_on date not null,equivalent boolean not null,availability text not null check(availability in ('available','unknown','unavailable')),
 active boolean not null default true,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 unique(id,company_id),check(length(sku) between 1 and 80),check(length(competitor) between 2 and 120),check(length(our_unit) between 1 and 80),check(length(conditions) between 10 and 600),check(length(source_url)<=1000 and source_url~'^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$')
);
create index cip_mp_refs_scope on public.cip_mp_market_refs(company_id,sku,observed_on desc);
create index cip_mp_refs_actor on public.cip_mp_market_refs(created_by);
create table public.cip_mp_agent_config(
 company_id text primary key references public.cip_companies(id),enabled boolean not null default true,
 interval_minutes integer not null default 360 check(interval_minutes between 60 and 1440),
 strategy text not null default 'protect_margin' check(strategy in ('protect_margin','target_margin','competitive')),
 reference_days integer not null default 7 check(reference_days between 1 and 7),last_analysis_at timestamptz,version integer not null default 1,updated_by uuid references auth.users(id),updated_at timestamptz not null default now()
);
create table public.cip_mp_price_plans(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),sku text not null,description text not null,store_code text not null,our_unit text not null,
 destination text not null check(destination in ('procfit','pdv','ecommerce','marketplace')),channel text not null check(channel in ('loja','b2b','ecommerce','marketplace')),price_table text not null,owner_name text not null,
 start_at timestamptz not null,end_at timestamptz not null,reference_id uuid,
 expense_pct numeric(12,6) not null check(expense_pct>=0 and expense_pct<100),fixed_cost numeric(20,6) not null check(fixed_cost>=0),
 new_price numeric(20,2) not null check(new_price>0),reason text not null,
 policy_version integer,source_at timestamptz,source_cost numeric(20,6),previous_price numeric(20,6),strategy text not null,
 state text not null default 'draft' check(state in ('draft','scheduled','ready','blocked','reported_applied','ended','cancelled')),
 analysis jsonb not null default '{}',version integer not null default 1,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 approved_by uuid references auth.users(id),approved_at timestamptz,approval_note text,applied_by uuid references auth.users(id),reported_at timestamptz,application_evidence text,
 foreign key(reference_id,company_id) references public.cip_mp_market_refs(id,company_id),
 check(end_at>start_at and end_at<=start_at+interval '90 days'),check(length(sku) between 1 and 80),check(length(store_code) between 1 and 80),check(length(description) between 1 and 300),check(length(our_unit) between 1 and 80),check(length(price_table) between 1 and 80),check(length(owner_name) between 3 and 120),check(length(reason) between 10 and 2000),unique(id,company_id)
);
create index cip_mp_plans_scope on public.cip_mp_price_plans(company_id,state,start_at,created_at desc);
create index cip_mp_plans_ref on public.cip_mp_price_plans(reference_id,company_id);
create index cip_mp_plans_created_actor on public.cip_mp_price_plans(created_by);
create index cip_mp_plans_approved_actor on public.cip_mp_price_plans(approved_by);
create index cip_mp_plans_applied_actor on public.cip_mp_price_plans(applied_by);
create table public.cip_mp_desk_events(
 id bigint generated always as identity primary key,company_id text not null references public.cip_companies(id),plan_id uuid references public.cip_mp_price_plans(id),actor uuid references auth.users(id),kind text not null,detail jsonb not null,created_at timestamptz not null default now()
);
create index cip_mp_desk_events_scope on public.cip_mp_desk_events(company_id,created_at desc);
create index cip_mp_desk_events_plan on public.cip_mp_desk_events(plan_id);
create index cip_mp_desk_events_actor on public.cip_mp_desk_events(actor);
do $$declare t text;begin
 foreach t in array array['cip_mp_market_refs','cip_mp_agent_config','cip_mp_price_plans','cip_mp_desk_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy scoped_read on public.%I for select to authenticated using(public.cip_can_access(company_id))',t);
 end loop;
end;$$;
grant usage,select on sequence public.cip_mp_desk_events_id_seq to service_role;
create function cip_pricing_private.writer(c text) returns boolean language sql stable security invoker set search_path='' as $$
 select public.cip_can_access(c) and exists(select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active and (p.role in ('superadm','diretoria') or exists(select 1 from public.cip_memberships m where m.user_id=p.user_id and m.company_id=c and m.active and m.role in ('gestor','precificacao','compras'))));
$$;
revoke all on function cip_pricing_private.writer(text) from public,anon;
grant execute on function cip_pricing_private.writer(text) to authenticated;
create function cip_pricing_private.director(c text) returns boolean language sql stable security invoker set search_path='' as $$
 select public.cip_can_access(c) and exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role in ('superadm','diretoria'));
$$;
revoke all on function cip_pricing_private.director(text) from public,anon;
grant execute on function cip_pricing_private.director(text) to authenticated;

-- Internal source lookup. Returns only one item, never an entire ERP payload.
create function cip_pricing_private.source_item(c text,k text,store text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s public.cip_erp_snapshots;q numeric;v numeric;p numeric;u text;descr text;prices integer;r record;
begin
 select * into s from public.cip_erp_snapshots where company_id=c and status='approved' order by captured_at desc,created_at desc,id limit 1;
 if s.id is not null then
 select sum((x->>'quantity')::numeric),sum((x->>'stock_value')::numeric) into q,v from jsonb_array_elements(s.payload->'data'->'inventory')x where x->>'sku'=k and x->>'store_id'=store;
 select count(*),max((x->>'current_price')::numeric) into prices,p from jsonb_array_elements(s.payload->'data'->'prices')x where x->>'sku'=k and x->>'store_id'=store;
 select x->>'unit',x->>'description' into u,descr from jsonb_array_elements(s.payload->'data'->'products')x where x->>'sku'=k limit 1;
 return jsonb_build_object('sku',k,'store_code',store,'description',coalesce(descr,k),'unit',u,'cost',case when q>0 then v/q end,'price',case when prices=1 then p end,'quantity',q,'captured_at',s.captured_at,'source','erp_approved','approved',s.metadata->>'scope'='company_all','fresh',s.captured_at<=now()+interval '5 minutes' and s.captured_at>=now()-interval '36 hours');
 end if;
 if c='shopping_prohospital' then
 select a.sku,a.store_code,a.description,a.unit,a.unit_cost,a.sale_price,a.quantity,b.as_of into r from public.cip_shopping_stock_rows a join public.cip_shopping_stock_batches b using(source_hash,company_id) where a.company_id=c and a.sku=k and a.store_code=store and b.status='reference_unreconciled' order by b.as_of desc,b.loaded_at desc,b.source_hash,a.source_row limit 1;
 if found then return jsonb_build_object('sku',k,'store_code',store,'description',r.description,'unit',r.unit,'cost',r.unit_cost,'price',r.sale_price,'quantity',r.quantity,'captured_at',r.as_of,'source','stock_reference','approved',false,'fresh',false);end if;
 end if;
 return jsonb_build_object('sku',k,'store_code',store,'source','unavailable','approved',false,'fresh',false);
end;$$;
revoke all on function cip_pricing_private.source_item(text,text,text) from public,anon,authenticated,service_role;
create function cip_pricing_private.assess(p public.cip_mp_price_plans) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb;policy public.cip_mp_campaign_policies;cfg public.cip_mp_agent_config;ref public.cip_mp_market_refs;issues jsonb:='[]';cost numeric;current_price numeric;mn numeric;target numeric;floor_price numeric;target_price numeric;suggestion numeric;ref_ok boolean:=false;new_margin numeric;current_margin numeric;
begin
 s:=cip_pricing_private.source_item(p.company_id,p.sku,p.store_code);
 select * into policy from public.cip_mp_campaign_policies where company_id=p.company_id order by version desc limit 1;
 select * into cfg from public.cip_mp_agent_config where company_id=p.company_id;
 if policy.version is null then issues:=issues||'"policy_missing"'::jsonb;end if;
 if s->>'approved' is distinct from 'true' then issues:=issues||'"source_unapproved"'::jsonb;end if;
 if s->>'fresh' is distinct from 'true' then issues:=issues||'"source_stale"'::jsonb;end if;
 cost:=(s->>'cost')::numeric;current_price:=(s->>'price')::numeric;
 if cost is null or cost<=0 or current_price is null or current_price<=0 or coalesce((s->>'quantity')::numeric,0)<=0 then issues:=issues||'"source_incomplete"'::jsonb;end if;
 if upper(btrim(coalesce(s->>'unit',''))) is distinct from upper(btrim(p.our_unit)) then issues:=issues||'"unit_mismatch"'::jsonb;end if;
 if p.reference_id is not null then
 select * into ref from public.cip_mp_market_refs where id=p.reference_id and company_id=p.company_id and sku=p.sku;
 ref_ok:=ref.id is not null and ref.active and ref.equivalent and ref.availability='available' and ref.channel=p.channel and upper(btrim(ref.our_unit))=upper(btrim(p.our_unit)) and ref.observed_on between (now() at time zone 'America/Sao_Paulo')::date-cfg.reference_days and (now() at time zone 'America/Sao_Paulo')::date;
 if not ref_ok then issues:=issues||'"reference_invalid"'::jsonb;end if;
 end if;
 if p.strategy='competitive' and not ref_ok then issues:=issues||'"reference_required"'::jsonb;end if;
 mn:=(policy.rules->>'minimum_margin_pct')::numeric;target:=(policy.rules->>'target_margin_pct')::numeric;
 if mn is not null and p.expense_pct+target>=100 then issues:=issues||'"invalid_expenses"'::jsonb;
 elsif cost>0 and mn is not null then
 floor_price:=ceil((cost+p.fixed_cost)/(1-(p.expense_pct+mn)/100)*100)/100;
 target_price:=ceil((cost+p.fixed_cost)/(1-(p.expense_pct+target)/100)*100)/100;
 suggestion:=case when p.strategy='protect_margin' then greatest(current_price,target_price) when p.strategy='competitive' and ref_ok then greatest(floor_price,least(target_price,ref.normalized_price)) else target_price end;
 if p.strategy='competitive' and ref_ok and ref.normalized_price<floor_price then issues:=issues||'"competitor_below_floor"'::jsonb;end if;
 if p.new_price<floor_price then issues:=issues||'"below_floor"'::jsonb;end if;
 if current_price>0 and abs((p.new_price/current_price-1)*100)>(policy.rules->>'max_change_pct')::numeric then issues:=issues||'"outside_authority"'::jsonb;end if;
 current_margin:=(current_price*(1-p.expense_pct/100)-cost-p.fixed_cost)/nullif(current_price,0)*100;
 new_margin:=(p.new_price*(1-p.expense_pct/100)-cost-p.fixed_cost)/p.new_price*100;
 end if;
 if policy.version is not null and p.end_at-p.start_at>make_interval(days=>(policy.rules->>'campaign_days_max')::integer) then issues:=issues||'"duration_exceeds_policy"'::jsonb;end if;
 if p.policy_version is not null and p.policy_version is distinct from policy.version then issues:=issues||'"policy_changed"'::jsonb;end if;
 if p.source_cost is not null and (abs(p.source_cost-coalesce(cost,-1))>0.01 or abs(p.previous_price-coalesce(current_price,-1))>0.01) then issues:=issues||'"source_changed"'::jsonb;end if;
 return jsonb_build_object('checked_at',now(),'source',s,'policy_version',policy.version,'floor',floor_price,'target_price',target_price,'suggested_price',round(suggestion,2),'current_margin_pct',current_margin,'new_margin_pct',new_margin,'reference_price',case when ref_ok then ref.normalized_price end,'reference_valid',ref_ok,'issues',issues,'mode','assisted','rule_version','mp-desk-2026-10-27.1');
end;$$;
revoke all on function cip_pricing_private.assess(public.cip_mp_price_plans) from public,anon,authenticated,service_role;
create function cip_pricing_private.command(c text,action text,d jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();p public.cip_mp_price_plans;cfg public.cip_mp_agent_config;result_analysis jsonb;s jsonb;pid uuid;rid uuid;next_state text;start_time timestamptz;end_time timestamptz;checks jsonb;
begin
 if actor is null or not cip_pricing_private.writer(c) then raise exception 'pricing_writer_required';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>14000 then raise exception 'invalid_input';end if;
 if action='reference' then
 if jsonb_typeof(d->'pack_price') is distinct from 'number' or jsonb_typeof(d->'shipping') is distinct from 'number' or jsonb_typeof(d->'equivalent_units') is distinct from 'number' or jsonb_typeof(d->'equivalent') is distinct from 'boolean' or (d->>'observed_on')::date>(now() at time zone 'America/Sao_Paulo')::date then raise exception 'invalid_reference';end if;
 insert into public.cip_mp_market_refs(company_id,sku,competitor,our_unit,pack_price,shipping,equivalent_units,channel,conditions,source_url,observed_on,equivalent,availability,created_by)
 values(c,btrim(d->>'sku'),btrim(d->>'competitor'),btrim(d->>'our_unit'),(d->>'pack_price')::numeric,(d->>'shipping')::numeric,(d->>'equivalent_units')::numeric,d->>'channel',btrim(d->>'conditions'),btrim(d->>'source_url'),(d->>'observed_on')::date,(d->>'equivalent')::boolean,d->>'availability',actor) returning id into rid;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,actor,'reference_created',jsonb_build_object('reference_id',rid));return jsonb_build_object('id',rid);
 elsif action='void_reference' then
 if length(btrim(coalesce(d->>'note',''))) not between 10 and 1000 then raise exception 'note_required';end if;
 update public.cip_mp_market_refs set active=false where id=(d->>'id')::uuid and company_id=c and active and (created_by=actor or cip_pricing_private.director(c)) returning id into rid;
 if rid is null then raise exception 'reference_not_authorized';end if;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,actor,'reference_voided',jsonb_build_object('reference_id',rid,'note',d->>'note'));return jsonb_build_object('id',rid);
 elsif action='config' then
 if not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 select * into cfg from public.cip_mp_agent_config where company_id=c for update;
 if cfg.version is distinct from (d->>'version')::integer then raise exception 'version_changed';end if;
 if jsonb_typeof(d->'enabled') is distinct from 'boolean' then raise exception 'invalid_config';end if;
 update public.cip_mp_agent_config set enabled=(d->>'enabled')::boolean,interval_minutes=(d->>'interval_minutes')::integer,strategy=d->>'strategy',reference_days=(d->>'reference_days')::integer,version=version+1,updated_by=actor,updated_at=now() where company_id=c;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,actor,'agent_config_changed',jsonb_build_object('before',to_jsonb(cfg),'after',d));return jsonb_build_object('saved',true);
 elsif action='draft' then
 if jsonb_typeof(d->'expense_pct') is distinct from 'number' or jsonb_typeof(d->'fixed_cost') is distinct from 'number' or jsonb_typeof(d->'new_price') is distinct from 'number' then raise exception 'invalid_numbers';end if;
 if (d->>'start_local')!~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' or (d->>'end_local')!~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then raise exception 'invalid_schedule';end if;
 start_time:=(d->>'start_local')::timestamp at time zone 'America/Sao_Paulo';end_time:=(d->>'end_local')::timestamp at time zone 'America/Sao_Paulo';
 if start_time<now()-interval '5 minutes' or start_time>now()+interval '90 days' then raise exception 'invalid_schedule';end if;
 if d->>'strategy' not in ('protect_margin','target_margin','competitive') then raise exception 'invalid_strategy';end if;
 s:=cip_pricing_private.source_item(c,btrim(d->>'sku'),btrim(d->>'store_code'));
 insert into public.cip_mp_price_plans(company_id,sku,description,store_code,our_unit,destination,channel,price_table,owner_name,start_at,end_at,reference_id,expense_pct,fixed_cost,new_price,reason,strategy,created_by)
 values(c,btrim(d->>'sku'),coalesce(nullif(s->>'description',''),btrim(d->>'sku')),btrim(d->>'store_code'),btrim(d->>'our_unit'),d->>'destination',d->>'channel',btrim(d->>'price_table'),btrim(d->>'owner_name'),start_time,end_time,nullif(d->>'reference_id','')::uuid,(d->>'expense_pct')::numeric,(d->>'fixed_cost')::numeric,(d->>'new_price')::numeric,btrim(d->>'reason'),d->>'strategy',actor) returning * into p;
 result_analysis:=cip_pricing_private.assess(p);
 update public.cip_mp_price_plans set analysis=result_analysis,policy_version=(result_analysis->>'policy_version')::integer,source_at=(s->>'captured_at')::timestamptz,source_cost=(s->>'cost')::numeric,previous_price=(s->>'price')::numeric where id=p.id;
 insert into public.cip_mp_desk_events(company_id,plan_id,actor,kind,detail) values(c,p.id,actor,'draft_created',jsonb_build_object('scope',jsonb_build_object('store',p.store_code,'destination',p.destination,'table',p.price_table,'channel',p.channel),'mode','assisted'));return jsonb_build_object('id',p.id,'state','draft','analysis',result_analysis);
 end if;
 select * into p from public.cip_mp_price_plans where id=(d->>'id')::uuid and company_id=c for update;
 if not found or p.version is distinct from (d->>'version')::integer then raise exception 'version_changed';end if;
 if length(btrim(coalesce(d->>'note',''))) not between 10 and 2000 then raise exception 'note_required';end if;
 if action='approve' then
 if not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 select * into cfg from public.cip_mp_agent_config where company_id=c;if not cfg.enabled then raise exception 'agent_paused';end if;
 if p.state<>'draft' or p.end_at<=now() then raise exception 'invalid_transition';end if;
 checks:=d->'checks';if checks->'destination_verified' is distinct from 'true'::jsonb or checks->'expenses_verified' is distinct from 'true'::jsonb or checks->'stock_verified' is distinct from 'true'::jsonb then raise exception 'checks_required';end if;
 result_analysis:=cip_pricing_private.assess(p);if jsonb_array_length(result_analysis->'issues')>0 then raise exception 'plan_blocked';end if;
 perform pg_advisory_xact_lock(hashtextextended(concat_ws('|',c,p.sku,p.store_code,p.destination,p.channel,upper(p.price_table)),0));
 if exists(select 1 from public.cip_mp_price_plans x where x.id<>p.id and x.company_id=c and x.sku=p.sku and x.store_code=p.store_code and x.destination=p.destination and x.channel=p.channel and upper(x.price_table)=upper(p.price_table) and x.state in ('scheduled','ready','reported_applied') and tstzrange(x.start_at,x.end_at,'[)')&&tstzrange(p.start_at,p.end_at,'[)')) then raise exception 'overlapping_schedule';end if;
 next_state:=case when p.start_at<=now() then 'ready' else 'scheduled' end;
 update public.cip_mp_price_plans set state=next_state,analysis=result_analysis,policy_version=(result_analysis->>'policy_version')::integer,source_at=(result_analysis->'source'->>'captured_at')::timestamptz,source_cost=(result_analysis->'source'->>'cost')::numeric,previous_price=(result_analysis->'source'->>'price')::numeric,approved_by=actor,approved_at=now(),approval_note=d->>'note',version=version+1,updated_at=now() where id=p.id;
 elsif action='cancel' then
 if p.state not in ('draft','scheduled','ready','blocked') or not(cip_pricing_private.director(c) or p.state='draft' and p.created_by=actor) then raise exception 'invalid_transition';end if;
 next_state:='cancelled';update public.cip_mp_price_plans set state=next_state,version=version+1,updated_at=now() where id=p.id;
 elsif action='report_applied' then
 if not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 if p.state<>'ready' or p.start_at>now() or p.end_at<=now() then raise exception 'invalid_transition';end if;
 if jsonb_typeof(d->'observed_price') is distinct from 'number' or (d->>'observed_price')::numeric<>p.new_price or length(btrim(d->>'note'))<20 then raise exception 'application_evidence_required';end if;
 next_state:='reported_applied';update public.cip_mp_price_plans set state=next_state,applied_by=actor,reported_at=now(),application_evidence=d->>'note',version=version+1,updated_at=now() where id=p.id;
 else raise exception 'invalid_action';end if;
 insert into public.cip_mp_desk_events(company_id,plan_id,actor,kind,detail) values(c,p.id,actor,action,jsonb_build_object('previous_state',p.state,'next_state',next_state,'note',d->>'note','checks',checks,'erp_executed',false));
 return jsonb_build_object('id',p.id,'state',next_state,'erp_executed',false);
end;$$;
revoke all on function cip_pricing_private.command(text,text,jsonb) from public,anon;
grant execute on function cip_pricing_private.command(text,text,jsonb) to authenticated;
create function public.cip_mp_desk_command(p_company text,p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select cip_pricing_private.command(p_company,p_action,p_data);$$;
revoke all on function public.cip_mp_desk_command(text,text,jsonb) from public,anon;
grant execute on function public.cip_mp_desk_command(text,text,jsonb) to authenticated;

create function cip_pricing_private.desk(c text,q text,store text,channel_filter text,skip integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s public.cip_erp_snapshots;cfg public.cip_mp_agent_config;items jsonb;refs jsonb;plans jsonb;events jsonb;policy jsonb;source_label text;source_at timestamptz;filtered integer;states jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if q is null or length(q)>200 or store is null or length(store)>80 or skip is null or skip<0 or skip>200000 or channel_filter is null or channel_filter not in ('loja','b2b','ecommerce','marketplace') then raise exception 'invalid_filter';end if;
 select * into cfg from public.cip_mp_agent_config where company_id=c;
 select jsonb_build_object('version',version,'rules',rules) into policy from public.cip_mp_campaign_policies where company_id=c order by version desc limit 1;
 select * into s from public.cip_erp_snapshots where company_id=c and status='approved' order by captured_at desc,created_at desc,id limit 1;
 if s.id is not null then
 source_label:='erp_approved';source_at:=s.captured_at;
 with inv as(select x->>'sku' sku,x->>'store_id' store_code,sum((x->>'quantity')::numeric) quantity,sum((x->>'stock_value')::numeric) value from jsonb_array_elements(s.payload->'data'->'inventory')x group by 1,2),
 pr as(select x->>'sku' sku,x->>'store_id' store_code,case when count(*)=1 then max((x->>'current_price')::numeric) end price from jsonb_array_elements(s.payload->'data'->'prices')x group by 1,2),
 prod as(select x->>'sku' sku,x->>'description' description,x->>'unit' unit from jsonb_array_elements(s.payload->'data'->'products')x),
 filtered_rows as(select i.sku,i.store_code,p.description,p.unit,i.quantity,case when i.quantity>0 then i.value/i.quantity end cost,pr.price from inv i left join prod p using(sku) left join pr using(sku,store_code) where i.quantity>0 and (store='' or i.store_code=store) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(q)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',i.sku,p.description)))=0))
 select (select count(*) from filtered_rows),coalesce((select jsonb_agg(to_jsonb(x)) from(select * from filtered_rows order by sku,store_code limit 20 offset skip)x),'[]') into filtered,items;
 else
 source_label:='stock_reference';
 if c='shopping_prohospital' then
 select (b.as_of::timestamp at time zone 'America/Sao_Paulo') into source_at from public.cip_shopping_stock_batches b where b.company_id=c and b.status='reference_unreconciled' order by b.as_of desc,b.loaded_at desc,b.source_hash limit 1;
 with filtered_rows as(select a.sku,a.store_code,a.description,a.unit,a.quantity,a.unit_cost cost,a.sale_price price from public.cip_shopping_stock_rows a where a.company_id=c and a.source_hash=(select b.source_hash from public.cip_shopping_stock_batches b where b.company_id=c and b.status='reference_unreconciled' order by b.as_of desc,b.loaded_at desc,b.source_hash limit 1) and a.quantity>0 and (store='' or a.store_code=store) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(q)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',a.sku,a.description,a.brand)))=0))
 select (select count(*) from filtered_rows),coalesce((select jsonb_agg(to_jsonb(x)) from(select * from filtered_rows order by sku,store_code limit 20 offset skip)x),'[]') into filtered,items;
 else
 select (b.as_of::timestamp at time zone 'America/Sao_Paulo') into source_at from public.cip_stock_intelligence_batches b where b.company_id=c and b.status='active' order by b.as_of desc,b.created_at desc,b.id limit 1;
 with filtered_rows as(select a.sku,a.store_code,max(a.description) description,max(a.unit) unit,sum(a.quantity) quantity,case when sum(a.quantity)>0 then sum(a.declared_cost)/sum(a.quantity) end cost,null::numeric price from public.cip_stock_intelligence_rows a where a.company_id=c and a.batch_id=(select b.id from public.cip_stock_intelligence_batches b where b.company_id=c and b.status='active' order by b.as_of desc,b.created_at desc,b.id limit 1) and a.quantity>0 and (store='' or a.store_code=store) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(q)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',a.sku,a.description,a.brand)))=0) group by a.sku,a.store_code)
 select (select count(*) from filtered_rows),coalesce((select jsonb_agg(to_jsonb(x)) from(select * from filtered_rows order by sku,store_code limit 20 offset skip)x),'[]') into filtered,items;
 end if;
 end if;
 -- Choose a comparable available reference per visible SKU; every value retains its source record.
 select coalesce(jsonb_agg(item||jsonb_build_object('best_reference',(select to_jsonb(r) from public.cip_mp_market_refs r where r.company_id=c and r.sku=item->>'sku' and upper(btrim(r.our_unit))=upper(btrim(item->>'unit')) and r.channel=channel_filter and r.active and r.equivalent and r.availability='available' and r.observed_on between (now() at time zone 'America/Sao_Paulo')::date-cfg.reference_days and (now() at time zone 'America/Sao_Paulo')::date order by r.normalized_price,r.observed_on desc,r.id limit 1))),'[]') into items from jsonb_array_elements(items)item;
 select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('can_void',x.created_by=auth.uid() or cip_pricing_private.director(c))),'[]') into refs from(select * from public.cip_mp_market_refs where company_id=c and (q='' or sku ilike '%'||q||'%' or competitor ilike '%'||q||'%') order by created_at desc,id limit 100)x;
 select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('can_cancel',cip_pricing_private.director(c) or x.state='draft' and x.created_by=auth.uid())),'[]') into plans from(select * from public.cip_mp_price_plans where company_id=c and (q='' or sku ilike '%'||q||'%' or description ilike '%'||q||'%') and (store='' or store_code=store) order by created_at desc,id limit 50)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into events from(select plan_id,kind,detail,created_at from public.cip_mp_desk_events where company_id=c order by created_at desc,id desc limit 20)x;
 select coalesce(jsonb_object_agg(state,n),'{}') into states from(select state,count(*) n from public.cip_mp_price_plans where company_id=c group by state)x;
 return jsonb_build_object('schema',1,'company',c,'checked_at',now(),'source',source_label,'source_at',source_at,'source_fresh',s.id is not null and s.metadata->>'scope'='company_all' and s.captured_at>=now()-interval '36 hours' and s.captured_at<=now()+interval '5 minutes','items',items,'total',filtered,'offset',skip,'limit',20,'references',refs,'plans',plans,'states',states,'events',events,'policy',policy,'config',to_jsonb(cfg),'can_write',cip_pricing_private.writer(c),'can_review',cip_pricing_private.director(c),'execution_mode','assisted');
end;$$;
revoke all on function cip_pricing_private.desk(text,text,text,text,integer) from public,anon;
grant execute on function cip_pricing_private.desk(text,text,text,text,integer) to authenticated;
create function public.cip_mp_desk_get(p_company text,p_query text default '',p_store text default '',p_channel text default 'loja',p_offset integer default 0) returns jsonb language sql stable security invoker set search_path='' as $$select cip_pricing_private.desk(p_company,p_query,p_store,p_channel,p_offset);$$;
revoke all on function public.cip_mp_desk_get(text,text,text,text,integer) from public,anon;
grant execute on function public.cip_mp_desk_get(text,text,text,text,integer) to authenticated;

create function cip_pricing_private.tick() returns void language plpgsql security definer set search_path='' as $$
declare cfg public.cip_mp_agent_config;p public.cip_mp_price_plans;a jsonb;due boolean;next_state text;
begin
 for cfg in select * from public.cip_mp_agent_config order by company_id for update skip locked loop
 begin
 due:=cfg.enabled and (cfg.last_analysis_at is null or cfg.last_analysis_at<=now()-make_interval(mins=>cfg.interval_minutes));
 for p in select * from public.cip_mp_price_plans where company_id=cfg.company_id and (state in ('scheduled','ready','reported_applied') or state='draft' and due) order by start_at,id for update skip locked loop
 next_state:=p.state;a:=p.analysis;
 if p.state<>'draft' and p.end_at<=now() then next_state:='ended';
 elsif cfg.enabled and p.state in ('scheduled','ready') and p.start_at<=now() or due and p.state='draft' then
 a:=cip_pricing_private.assess(p);
 if p.state in ('scheduled','ready') then next_state:=case when jsonb_array_length(a->'issues')>0 then 'blocked' else 'ready' end;end if;
 end if;
 if a is distinct from p.analysis or next_state<>p.state then update public.cip_mp_price_plans set analysis=a,state=next_state,version=version+case when next_state<>p.state then 1 else 0 end,updated_at=now() where id=p.id;end if;
 if next_state<>p.state then insert into public.cip_mp_desk_events(company_id,plan_id,kind,detail) values(p.company_id,p.id,'agent_state',jsonb_build_object('previous',p.state,'next',next_state,'issues',a->'issues','erp_executed',false));end if;
 end loop;
 if due then update public.cip_mp_agent_config set last_analysis_at=now() where company_id=cfg.company_id;end if;
 exception when others then insert into public.cip_mp_desk_events(company_id,kind,detail) values(cfg.company_id,'agent_error',jsonb_build_object('code',sqlstate,'message','Falha na reavaliação; atualizar e conferir antes de aplicar.'));
 end;
 end loop;
end;$$;
revoke all on function cip_pricing_private.tick() from public,anon,authenticated,service_role;
insert into public.cip_mp_agent_config(company_id) values('shopping_prohospital'),('distribuidora_prohospital');
select cron.schedule('cip-marca-passo-desk','*/5 * * * *','select cip_pricing_private.tick();');
comment on table public.cip_mp_price_plans is 'Supervised price-change plans with precise destination, table, channel, store and validity. A ready ticket or operator report never represents an ERP API write or ERP reconciliation. Ending validity creates a review need; does not restore a price automatically.';
comment on table public.cip_mp_market_refs is 'Immutable human-recorded market evidence. Normalization maps the complete competitor offer, including declared freight, into equivalent units of our product. Equality and availability require human validation.';
commit;
