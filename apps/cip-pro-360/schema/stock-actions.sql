begin;
create table public.cip_stock_intelligence_batches(
 id text primary key check(id~'^[a-f0-9]{64}$'),company_id text not null references public.cip_companies(id) check(company_id in ('shopping_prohospital','distribuidora_prohospital')),
 as_of date not null,sources jsonb not null,summary jsonb not null,status text not null default 'loading' check(status in ('loading','active','retired')),created_at timestamptz not null default now(),unique(id,company_id)
);
create index cip_stock_intelligence_batch_company_idx on public.cip_stock_intelligence_batches(company_id,status,as_of desc,created_at desc);
create table public.cip_stock_intelligence_rows(
 batch_id text not null,company_id text not null,record_key text not null,store_code text not null,sku text not null,description text not null,brand text,unit text,
 quantity numeric(20,6),unit_cost numeric(20,6),declared_cost numeric(20,2),sale_price numeric(20,6),expiry date,alerts text[] not null,priority integer not null,data jsonb not null,
 primary key(batch_id,record_key),foreign key(batch_id,company_id) references public.cip_stock_intelligence_batches(id,company_id)
);
create index cip_stock_intelligence_row_company_idx on public.cip_stock_intelligence_rows(company_id,batch_id,priority desc,record_key);
create index cip_stock_intelligence_rows_batch_company_idx on public.cip_stock_intelligence_rows(batch_id,company_id);
create table public.cip_stock_actions(
 action_id text primary key check(action_id~'^[a-f0-9]{64}$'),batch_id text not null,company_id text not null,kind text not null check(kind in ('redistribuicao','campanha','preco','conferencia')),
 source_store text not null,target_store text,sku text not null,description text not null,quantity_limit numeric(20,6) not null check(quantity_limit>=0),priority integer not null,payload jsonb not null,
 state text not null default 'sugerida' check(state in ('sugerida','aprovada','em_acompanhamento','concluida','rejeitada')),version integer not null default 0,
 owner_name text,due_date date,approved_quantity numeric(20,6),approval jsonb,result jsonb,updated_at timestamptz not null default now(),
 foreign key(batch_id,company_id) references public.cip_stock_intelligence_batches(id,company_id),unique(action_id,company_id)
);
create index cip_stock_actions_company_queue_idx on public.cip_stock_actions(company_id,batch_id,state,priority desc,action_id);
create index cip_stock_actions_batch_idx on public.cip_stock_actions(batch_id,company_id);
create table public.cip_stock_action_events(
 id bigint generated always as identity primary key,action_id text not null,company_id text not null,actor uuid not null references auth.users(id),created_at timestamptz not null default now(),
 previous_state text not null,next_state text not null,note text not null,details jsonb not null,foreign key(action_id,company_id) references public.cip_stock_actions(action_id,company_id)
);
create index cip_stock_action_events_action_idx on public.cip_stock_action_events(action_id,company_id,created_at desc);
create index cip_stock_action_events_actor_idx on public.cip_stock_action_events(actor);
create index cip_stock_action_events_company_idx on public.cip_stock_action_events(company_id);
alter table public.cip_stock_intelligence_batches enable row level security;
alter table public.cip_stock_intelligence_rows enable row level security;
alter table public.cip_stock_actions enable row level security;
alter table public.cip_stock_action_events enable row level security;
revoke all on public.cip_stock_intelligence_batches,public.cip_stock_intelligence_rows,public.cip_stock_actions,public.cip_stock_action_events from public,anon,authenticated;
grant select on public.cip_stock_intelligence_batches,public.cip_stock_intelligence_rows,public.cip_stock_actions,public.cip_stock_action_events to authenticated;
grant all on public.cip_stock_intelligence_batches,public.cip_stock_intelligence_rows,public.cip_stock_actions,public.cip_stock_action_events to service_role;
grant usage,select on sequence public.cip_stock_action_events_id_seq to service_role;
create policy stock_intelligence_batch_read on public.cip_stock_intelligence_batches for select to authenticated using(public.cip_can_access(company_id) and status in ('active','retired'));
create policy stock_intelligence_row_read on public.cip_stock_intelligence_rows for select to authenticated using(public.cip_can_access(company_id) and exists(select 1 from public.cip_stock_intelligence_batches b where b.id=batch_id and b.status='active'));
create policy stock_actions_read on public.cip_stock_actions for select to authenticated using(public.cip_can_access(company_id) and exists(select 1 from public.cip_stock_intelligence_batches b where b.id=batch_id and b.status in ('active','retired')));
create policy stock_action_events_read on public.cip_stock_action_events for select to authenticated using(public.cip_can_access(company_id));
create function public.cip_stock_intelligence_get(p_company text,p_tab text default 'actions',p_query text default '',p_store text default '',p_kind text default '',p_state text default '',p_alert text default '',p_offset integer default 0,p_limit integer default 20) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare b public.cip_stock_intelligence_batches;items jsonb;states jsonb;filtered bigint;filtered_cost numeric;units jsonb;results jsonb;
begin
 if p_company is null or p_company not in ('shopping_prohospital','distribuidora_prohospital') or p_tab is null or p_tab not in ('actions','metrics') or p_query is null or length(p_query)>200 or p_store is null or p_store!~'^[0-9]{0,8}$' or p_kind is null or p_kind not in ('','redistribuicao','campanha','preco','conferencia') or p_state is null or p_state not in ('','sugerida','aprovada','em_acompanhamento','concluida','rejeitada') or p_alert is null or length(p_alert)>80 or p_offset is null or p_offset<0 or p_offset>200000 or p_limit is null or p_limit not between 1 and 1000 then raise exception 'invalid_filter';end if;
 select * into b from public.cip_stock_intelligence_batches where company_id=p_company and status='active' order by as_of desc,created_at desc,id limit 1;
 if not found then return jsonb_build_object('available',false);end if;
 if p_tab='actions' then
  select count(*) into filtered from public.cip_stock_actions r where r.company_id=p_company and (r.batch_id=b.id or r.state in ('aprovada','em_acompanhamento') or p_state in ('concluida','rejeitada')) and (p_store='' or r.source_store=p_store or r.target_store=p_store) and (p_kind='' or r.kind=p_kind) and (p_state='' or r.state=p_state) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',r.sku,r.description,r.payload->>'brand',r.payload->>'lot')))=0);
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from(select * from public.cip_stock_actions r where r.company_id=p_company and (r.batch_id=b.id or r.state in ('aprovada','em_acompanhamento') or p_state in ('concluida','rejeitada')) and (p_store='' or r.source_store=p_store or r.target_store=p_store) and (p_kind='' or r.kind=p_kind) and (p_state='' or r.state=p_state) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',r.sku,r.description,r.payload->>'brand',r.payload->>'lot')))=0) order by priority desc,action_id limit p_limit offset p_offset)x;
 else
  select count(*),sum(r.declared_cost) into filtered,filtered_cost from public.cip_stock_intelligence_rows r where r.company_id=p_company and r.batch_id=b.id and (p_store='' or r.store_code=p_store) and (p_alert='' or p_alert=any(r.alerts)) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',r.sku,r.description,r.brand,r.data->>'lot')))=0);
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from(select * from public.cip_stock_intelligence_rows r where r.company_id=p_company and r.batch_id=b.id and (p_store='' or r.store_code=p_store) and (p_alert='' or p_alert=any(r.alerts)) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',r.sku,r.description,r.brand,r.data->>'lot')))=0) order by priority desc,declared_cost desc nulls last,record_key limit p_limit offset p_offset)x;
 end if;
 select coalesce(jsonb_object_agg(state,n),'{}') into states from(select state,count(*) n from public.cip_stock_actions where company_id=p_company and (batch_id=b.id or state in ('aprovada','em_acompanhamento','concluida','rejeitada')) group by state)x;
 select coalesce(jsonb_agg(store_code order by store_code::integer),'[]') into units from(select distinct store_code from public.cip_stock_intelligence_rows where company_id=p_company and batch_id=b.id)x;
 select jsonb_build_object('completed',count(*),'reported_cash',sum((result->>'cash_received')::numeric),'reported_net_revenue',sum((result->>'net_revenue')::numeric),'reported_variable_cost',sum((result->>'variable_cost')::numeric)) into results from public.cip_stock_actions where company_id=p_company and state='concluida';
 return jsonb_build_object('available',true,'batch',to_jsonb(b),'items',items,'filtered_total',filtered,'filtered_cost',filtered_cost::text,'states',states,'units',units,'results',results,'tab',p_tab,'offset',p_offset,'limit',p_limit);
end;$$;
revoke all on function public.cip_stock_intelligence_get(text,text,text,text,text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.cip_stock_intelligence_get(text,text,text,text,text,text,text,integer,integer) to authenticated,service_role;
create function public.cip_stock_action_step(p_action text,p_version integer,p_to text,p_note text,p_owner text default '',p_due date default null,p_quantity numeric default 0,p_checks jsonb default '{}',p_result jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.cip_stock_actions;b public.cip_stock_intelligence_batches;actor_id uuid=auth.uid();previous text;key text;observed numeric;pricing jsonb;price_floor numeric;contribution numeric;
begin
 if actor_id is null or not exists(select 1 from public.cip_profiles where user_id=actor_id and active and role in ('superadm','diretoria')) then raise exception 'director_required';end if;
 select * into a from public.cip_stock_actions where action_id=p_action for update;
 if not found or not public.cip_can_access(a.company_id) then raise exception 'authorized_action_required';end if;
 select * into b from public.cip_stock_intelligence_batches where id=a.batch_id and status in ('active','retired');
 if not found or a.version is distinct from p_version then raise exception 'source_or_version_changed';end if;
 if p_to='aprovada' and a.kind<>'conferencia' and (b.status<>'active' or b.id is distinct from (select id from public.cip_stock_intelligence_batches where company_id=a.company_id and status='active' order by as_of desc,created_at desc,id limit 1) or (now() at time zone 'America/Fortaleza')::date-b.as_of>1) then raise exception 'refresh_stock_analysis';end if;
 if p_to='aprovada' and a.kind<>'conferencia' and a.company_id='shopping_prohospital' and b.summary->>'current_hash' is distinct from (select source_hash from public.cip_shopping_stock_batches where status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1) then raise exception 'refresh_stock_analysis';end if;
 if p_to is null or not (a.state='sugerida' and p_to in ('aprovada','rejeitada') or a.state='aprovada' and p_to in ('em_acompanhamento','rejeitada') or a.state='em_acompanhamento' and p_to in ('concluida','rejeitada')) then raise exception 'invalid_transition';end if;
 if p_note is null or length(btrim(p_note)) not between 10 and 3000 then raise exception 'note_required';end if;
 if p_to='aprovada' then
  if p_owner is null or length(btrim(p_owner)) not between 3 and 120 or p_due is null or p_due<(now() at time zone 'America/Fortaleza')::date or p_quantity is null or p_quantity<0 or p_quantity>a.quantity_limit or a.quantity_limit>0 and p_quantity<=0 then raise exception 'approval_fields_required';end if;
  if p_checks is null or jsonb_typeof(p_checks)<>'object' then raise exception 'checks_required';end if;
  foreach key in array (case when a.kind='conferencia' then array['saldo_atual','unidade_lote_validade','responsavel_prazo'] else array['saldo_atual','reservas','unidade_lote_validade','demanda_atual','margem_frete','responsavel_prazo'] end) loop if (p_checks->key) is distinct from 'true'::jsonb then raise exception 'checks_required';end if;end loop;
  if a.kind in ('campanha','preco') then
   if a.payload->>'expiry' is not null and ((a.payload->>'expiry')::date<(now() at time zone 'America/Fortaleza')::date or p_due>(a.payload->>'expiry')::date) then raise exception 'expired_candidate';end if;
   pricing=p_checks->'_pricing';if pricing is null or jsonb_typeof(pricing)<>'object' then raise exception 'pricing_required';end if;
   foreach key in array array['cost','current_price','price','expense_pct','fixed_cost','minimum_margin_pct','max_change_pct'] loop
    if jsonb_typeof(pricing->key) is distinct from 'number' or (pricing->>key)::numeric<0 or (pricing->>key)::numeric>1000000000000 then raise exception 'pricing_required';end if;
   end loop;
   if (pricing->>'cost')::numeric<=0 or (pricing->>'price')::numeric<=0 or (pricing->>'current_price')::numeric<=0 or (pricing->>'cost')::numeric<coalesce((a.payload->>'unit_cost')::numeric,0) or (pricing->>'expense_pct')::numeric+(pricing->>'minimum_margin_pct')::numeric>=100 or (pricing->>'max_change_pct')::numeric>100 then raise exception 'invalid_pricing_policy';end if;
   if coalesce((a.payload->>'sale_price')::numeric,0)>0 and (pricing->>'current_price')::numeric<>(a.payload->>'sale_price')::numeric then raise exception 'source_price_changed';end if;
   price_floor=ceil(((pricing->>'cost')::numeric+(pricing->>'fixed_cost')::numeric)/(1-((pricing->>'expense_pct')::numeric+(pricing->>'minimum_margin_pct')::numeric)/100)*100)/100;
   if (pricing->>'price')::numeric<price_floor or abs(((pricing->>'price')::numeric/(pricing->>'current_price')::numeric-1)*100)>(pricing->>'max_change_pct')::numeric then raise exception 'price_below_floor_or_outside_authority';end if;
   contribution=(pricing->>'price')::numeric*(1-(pricing->>'expense_pct')::numeric/100)-(pricing->>'cost')::numeric-(pricing->>'fixed_cost')::numeric;
   pricing=pricing||jsonb_build_object('floor',price_floor,'unit_contribution',contribution,'margin_pct',contribution/(pricing->>'price')::numeric*100,'basis','premissas declaradas pelo aprovador; nao e margem realizada');
  end if;
  update public.cip_stock_actions set owner_name=btrim(p_owner),due_date=p_due,approved_quantity=p_quantity,approval=jsonb_build_object('actor',actor_id,'at',now(),'checks',p_checks,'note',p_note,'scope','plano supervisionado; nao executa ERP','pricing_control',pricing) where action_id=a.action_id;
 end if;
 if p_to='concluida' then
  if p_result is null or jsonb_typeof(p_result)<>'object' or length(btrim(coalesce(p_result->>'evidence',''))) not between 10 and 2000 or jsonb_typeof(p_result->'quantity') is distinct from 'number' then raise exception 'result_evidence_required';end if;
  observed=(p_result->>'quantity')::numeric;if observed<0 or observed>coalesce(a.approved_quantity,0) then raise exception 'invalid_observed_quantity';end if;
  foreach key in array array['cash_received','net_revenue','variable_cost'] loop
   if p_result ? key then if jsonb_typeof(p_result->key) is distinct from 'number' or (p_result->>key)::numeric<0 or a.kind in ('redistribuicao','conferencia') then raise exception 'invalid_reported_financials';end if;end if;
  end loop;
  update public.cip_stock_actions set result=p_result||jsonb_build_object('reported_by',actor_id,'reported_at',now(),'basis','declaracao_manual_com_evidencia_nao_conciliada_ERP') where action_id=a.action_id;
 end if;
 previous=a.state;update public.cip_stock_actions set state=p_to,version=version+1,updated_at=now() where action_id=a.action_id;
 insert into public.cip_stock_action_events(action_id,company_id,actor,previous_state,next_state,note,details) values(a.action_id,a.company_id,actor_id,previous,p_to,btrim(p_note),jsonb_build_object('checks',case when p_to='aprovada' then p_checks else null end,'result',case when p_to='concluida' then p_result else null end,'version',p_version+1));
 return jsonb_build_object('state',p_to,'version',p_version+1,'executed_in_ERP',false);
end;$$;
revoke all on function public.cip_stock_action_step(text,integer,text,text,text,date,numeric,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.cip_stock_action_step(text,integer,text,text,text,date,numeric,jsonb,jsonb) to authenticated;
create function public.cip_bot_stock_intelligence(p_telegram text,p_chat text,p_company text,p_query text default '',p_store text default '') returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor_id uuid;
begin
 select user_id into actor_id from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and telegram_id=chat_id and active;
 if actor_id is null or not coalesce(p_company=any(public.cip_report_companies(actor_id)),false) then raise exception 'authorized_company_required';end if;
 return public.cip_stock_intelligence_get(p_company,'metrics',p_query,p_store,'','','',0,5);
end;$$;
revoke all on function public.cip_bot_stock_intelligence(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_stock_intelligence(text,text,text,text,text) to service_role;
comment on table public.cip_stock_actions is 'Automatically generated proposals, human attested approval and manual follow-up. No ERP execution, price changes or outbound campaigns. Stock movement is not cash release. Policy scenarios are unapproved until reviewed.';
commit;
