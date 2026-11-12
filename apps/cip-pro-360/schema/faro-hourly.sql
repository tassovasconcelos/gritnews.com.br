-- Faro hourly portfolio and worker queue. All external collection remains advisory.
begin;
create table public.cip_faro_config(
 company_id text primary key references public.cip_companies(id),enabled boolean not null default false,owner_id uuid references auth.users(id),
 products_per_hour integer not null default 24 check(products_per_hour between 2 and 24),hot_count integer not null default 4 check(hot_count between 0 and 8),daily_limit integer not null default 576 check(daily_limit between 2 and 576),gap_pct numeric not null default 5 check(gap_pct between 2 and 100),
 domains jsonb not null default '["mercadolivre.com.br","magazineluiza.com.br","amazon.com.br","cirurgicastore.com.br","medjet.com.br","cirurgicapaulista.com.br","cfernandes.com.br"]',
 last_source_hash text,last_slot timestamptz,last_sync_at timestamptz,last_dispatch_at timestamptz,failure_streak integer not null default 0,circuit_until timestamptz,version integer not null default 1,updated_at timestamptz not null default now(),check(hot_count<products_per_hour)
);
create table public.cip_faro_portfolio(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),sku text not null,active boolean not null default true,
 source_at date not null,source_hash text not null,our jsonb not null,identity jsonb not null,overrides jsonb not null default '{}',stock_value numeric not null,priority integer not null default 0,pinned boolean not null default false,
 last_queued_at timestamptz,last_attempt_at timestamptz,last_completed_at timestamptz,last_evidence_at timestamptz,updated_at timestamptz not null default now(),unique(company_id,sku),unique(id,company_id)
);
create index cip_faro_portfolio_rotation on public.cip_faro_portfolio(company_id,active,last_queued_at,stock_value desc);
create table public.cip_faro_jobs(
 id uuid primary key default gen_random_uuid(),company_id text not null,portfolio_id uuid not null,slot timestamptz not null,priority integer not null default 0,
 state text not null default 'queued' check(state in ('queued','claimed','completed','failed','skipped')),run_id uuid references public.cip_market_runs(id),lease uuid,claimed_at timestamptz,finished_at timestamptz,error_code text,
 reserved_calls integer not null default 0 check(reserved_calls between 0 and 2),result jsonb not null default '{}',created_at timestamptz not null default now(),
 foreign key(portfolio_id,company_id) references public.cip_faro_portfolio(id,company_id),unique(portfolio_id,slot)
);
create index cip_faro_jobs_queue on public.cip_faro_jobs(company_id,state,slot,priority desc);
create index cip_faro_jobs_day on public.cip_faro_jobs(company_id,claimed_at);
create index cip_faro_jobs_run on public.cip_faro_jobs(run_id);
alter table public.cip_market_runs add column auto_job_id uuid unique references public.cip_faro_jobs(id);
create table public.cip_faro_signals(
 id uuid primary key default gen_random_uuid(),company_id text not null,portfolio_id uuid not null,sku text not null,offer_id uuid not null references public.cip_market_offers(id),
 kind text not null check(kind in ('evidence','price_gap','price_drop')),url text not null,seller text not null,fingerprint text not null,details jsonb not null,
 state text not null default 'open' check(state in ('open','acknowledged','superseded')),first_seen_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),updated_at timestamptz not null default now(),ack_by uuid references auth.users(id),ack_note text,
 foreign key(portfolio_id,company_id) references public.cip_faro_portfolio(id,company_id),unique(company_id,sku,kind,url,seller)
);
create index cip_faro_signals_scope on public.cip_faro_signals(company_id,state,updated_at desc);
create index cip_faro_signals_portfolio on public.cip_faro_signals(portfolio_id,company_id);
create index cip_faro_signals_offer on public.cip_faro_signals(offer_id);
create index cip_faro_signals_actor on public.cip_faro_signals(ack_by);
create index cip_faro_config_actor on public.cip_faro_config(owner_id);
create table cip_market_private.worker(id integer primary key check(id=1),secret_id uuid not null);
alter table cip_market_private.worker enable row level security;
revoke all on cip_market_private.worker from public,anon,authenticated;
insert into cip_market_private.worker values(1,vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'cip_faro_hourly_worker','CIP Faro scheduler-only authentication'));
insert into public.cip_faro_config(company_id,owner_id) select c.id,(select p.user_id from public.cip_profiles p join auth.users u on u.id=p.user_id where p.active and p.role='superadm' and lower(u.email)='gritsolucoes@gmail.com' limit 1) from public.cip_companies c where c.id in ('shopping_prohospital','distribuidora_prohospital');
do $$declare t text;begin foreach t in array array['cip_faro_config','cip_faro_portfolio','cip_faro_jobs','cip_faro_signals'] loop
 execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);execute format('grant all on public.%I to service_role',t);execute format('create policy company_read on public.%I for select to authenticated using(public.cip_can_access(company_id))',t);
end loop;end;$$;
-- Lease is worker-only even for authenticated table readers.
revoke select on public.cip_faro_jobs from authenticated;
grant select(id,company_id,portfolio_id,slot,priority,state,run_id,claimed_at,finished_at,error_code,reserved_calls,result,created_at) on public.cip_faro_jobs to authenticated;
create function cip_market_private.sponsor(c text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.cip_faro_config cfg join public.cip_profiles p on p.user_id=cfg.owner_id where cfg.company_id=c and p.active and (p.role='superadm' or p.role='diretoria' and exists(select 1 from public.cip_memberships m where m.user_id=p.user_id and m.company_id=c and m.active)));
$$;
revoke all on function cip_market_private.sponsor(text) from public,anon,authenticated;
create function cip_market_private.faro_sync(c text) returns void language plpgsql security definer set search_path='' as $$
declare source text;
begin
 -- Only the Shopping source presently contains an explicit ABC curve. Do not manufacture a sales ABC for the distributor.
 if c<>'shopping_prohospital' then return;end if;
 select source_hash into source from public.cip_shopping_stock_batches where company_id=c and status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1;
 if source is null then update public.cip_faro_portfolio set active=false where company_id=c;return;end if;
 if exists(select 1 from public.cip_faro_config where company_id=c and last_source_hash=source) then update public.cip_faro_config set last_sync_at=now() where company_id=c;return;end if;
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value,priority)
 select c,r.sku,r.as_of,source,jsonb_build_object('sku',r.sku,'store_code',r.store_code,'description',r.description,'unit',r.unit,'price',r.sale_price,'source_at',r.as_of,'scope','representative_store'),
 jsonb_strip_nulls(jsonb_build_object('brand',left(r.brand,100),'our_pack_units',case when upper(btrim(r.unit)) in ('UN','UND','UNID','UNIDADE') then 1 end)),totals.value,totals.priority
 from (select distinct on(sku) * from public.cip_shopping_stock_rows where company_id=c and source_hash=source and curve='A' and quantity>0 and length(sku) between 1 and 80 order by sku,declared_cost desc,store_code)r
 join (select sku,sum(declared_cost) value,max(priority) priority from public.cip_shopping_stock_rows where company_id=c and source_hash=source and curve='A' and quantity>0 group by sku)totals using(sku)
 on conflict(company_id,sku) do update set active=true,source_at=excluded.source_at,source_hash=excluded.source_hash,our=excluded.our,identity=excluded.identity,stock_value=excluded.stock_value,priority=excluded.priority,overrides=case when cip_faro_portfolio.our->>'unit' is distinct from excluded.our->>'unit' or cip_faro_portfolio.identity->>'brand' is distinct from excluded.identity->>'brand' or cip_faro_portfolio.our->>'description' is distinct from excluded.our->>'description' then '{}'::jsonb else cip_faro_portfolio.overrides end,updated_at=now();
 update public.cip_faro_portfolio p set active=false where p.company_id=c and not exists(select 1 from public.cip_shopping_stock_rows r where r.company_id=c and r.source_hash=source and r.sku=p.sku and r.curve='A' and r.quantity>0);
 update public.cip_faro_config set last_sync_at=now(),last_source_hash=source where company_id=c;
end;$$;
revoke all on function cip_market_private.faro_sync(text) from public,anon,authenticated;
create function cip_market_private.faro_hourly() returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.cip_faro_config;h timestamptz:=date_trunc('hour',now());day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');n integer;remaining integer;chosen uuid[];hot uuid[];total integer:=0;
begin
 perform pg_advisory_xact_lock(hashtextextended('cip-faro-hourly',0));
 for cfg in select * from public.cip_faro_config order by company_id for update loop
 if not cfg.enabled or not cip_market_private.sponsor(cfg.company_id) then continue;end if;
 perform cip_market_private.faro_sync(cfg.company_id);
 if cfg.last_slot is not distinct from h or cfg.circuit_until>now() then continue;end if;
 select greatest(0,cfg.daily_limit-count(*)) into remaining from public.cip_faro_jobs where company_id=cfg.company_id and slot>=day_start;
 n:=least(cfg.products_per_hour,remaining);chosen:='{}';hot:='{}';
 if n>0 then
 select coalesce(array_agg(id),'{}') into hot from(select id from public.cip_faro_portfolio where company_id=cfg.company_id and active order by pinned desc,stock_value desc,priority desc,sku limit least(cfg.hot_count,n))x;
 select hot||coalesce(array_agg(id),'{}') into chosen from(select id from public.cip_faro_portfolio where company_id=cfg.company_id and active and not(id=any(hot)) order by last_queued_at asc nulls first,stock_value desc,priority desc,sku limit greatest(0,n-cardinality(hot)))x;
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot,priority) select cfg.company_id,id,h,case when id=any(hot) then 100 else 50 end from unnest(chosen)id on conflict(portfolio_id,slot) do nothing;
 get diagnostics n=row_count;total:=total+n;
 update public.cip_faro_portfolio set last_queued_at=now() where id=any(chosen);
 end if;
 update public.cip_faro_config set last_slot=h where company_id=cfg.company_id;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(cfg.company_id,cfg.owner_id,'faro_hourly_queue',jsonb_build_object('slot',h,'queued',n,'hot_limit',cfg.hot_count,'source','declared_abc','erp_executed',false));
 end loop;return jsonb_build_object('slot',h,'queued',total);
end;$$;
revoke all on function cip_market_private.faro_hourly() from public,anon,authenticated;
grant execute on function cip_market_private.faro_hourly() to service_role;

create function cip_market_private.faro_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.cip_faro_config;j public.cip_faro_jobs;p public.cip_faro_portfolio;rid uuid;token uuid;used integer;claims jsonb:='[]';seen jsonb;day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');
begin
 perform pg_advisory_xact_lock(hashtextextended('cip-faro-worker',0));
 update public.cip_market_runs r set state='failed',finished_at=now(),meta=jsonb_build_object('error','worker_lease_expired','origin','faro_hourly') from public.cip_faro_jobs expired_job where r.auto_job_id=expired_job.id and expired_job.state='claimed' and expired_job.claimed_at<now()-interval '3 minutes' and r.state='running';
 update public.cip_faro_jobs set state='failed',finished_at=now(),error_code='worker_lease_expired' where state='claimed' and claimed_at<now()-interval '3 minutes';
 update public.cip_faro_jobs set state='skipped',finished_at=now(),error_code='missed_slot' where state='queued' and slot<now()-interval '2 hours';
 for cfg in select * from public.cip_faro_config where enabled order by company_id for update loop
 if not cip_market_private.sponsor(cfg.company_id) or cfg.circuit_until>now() then continue;end if;
 select count(*) into used from public.cip_faro_jobs where company_id=cfg.company_id and claimed_at>=day_start;
 for j in select * from public.cip_faro_jobs where company_id=cfg.company_id and state='queued' and slot<=now() order by slot,priority desc,id for update skip locked loop
 if jsonb_array_length(claims)>=2 or used>=cfg.daily_limit then exit;end if;
 select * into p from public.cip_faro_portfolio where id=j.portfolio_id and active;
 if p.id is null then update public.cip_faro_jobs set state='skipped',error_code='portfolio_inactive',finished_at=now() where id=j.id;continue;end if;
 token:=gen_random_uuid();
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode,auto_job_id) values(cfg.company_id,cfg.owner_id,p.sku,p.our->>'store_code',p.our,p.identity||p.overrides,cfg.domains,'identity',j.id) returning id into rid;
 update public.cip_faro_jobs set state='claimed',lease=token,run_id=rid,claimed_at=now(),reserved_calls=2 where id=j.id;
 update public.cip_faro_portfolio set last_attempt_at=now() where id=p.id;
 select coalesce(jsonb_agg(url),'[]') into seen from(select distinct url from public.cip_market_offers where company_id=cfg.company_id and sku=p.sku order by url limit 12)x;
 claims:=claims||jsonb_build_array(jsonb_build_object('job',j.id,'lease',token,'company',cfg.company_id,'sku',p.sku,'store',p.our->>'store_code','our',p.our,'criteria',p.identity||p.overrides,'domains',cfg.domains,'tracked_urls',seen));used:=used+1;
 end loop;end loop;
 return claims;
end;$$;
revoke all on function cip_market_private.faro_claim() from public,anon,authenticated;
grant execute on function cip_market_private.faro_claim() to service_role;
create function public.cip_faro_claim() returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.faro_claim();$$;
revoke all on function public.cip_faro_claim() from public,anon,authenticated;
grant execute on function public.cip_faro_claim() to service_role;

create function cip_market_private.faro_finish(jid uuid,token uuid,offers jsonb,meta jsonb,failed boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.cip_faro_jobs;cfg public.cip_faro_config;p public.cip_faro_portfolio;o public.cip_market_offers;previous public.cip_market_offers;k text;finger text;details jsonb;n numeric;oldn numeric;own numeric;pack numeric;signals integer:=0;finish_result jsonb;code text;
begin
 select * into j from public.cip_faro_jobs where id=jid for update;
 if j.id is null or j.state<>'claimed' or j.lease is distinct from token or j.claimed_at<now()-interval '3 minutes' then raise exception 'worker_lease_invalid';end if;
 select * into cfg from public.cip_faro_config where company_id=j.company_id for update;
 select * into p from public.cip_faro_portfolio where id=j.portfolio_id;
 if not cfg.enabled or not p.active or not cip_market_private.sponsor(j.company_id) then
 update public.cip_market_runs set state='failed',finished_at=now(),meta='{"error":"automation_paused"}' where id=j.run_id;
 update public.cip_faro_jobs set state='skipped',error_code='automation_paused',finished_at=now() where id=jid;return '{"state":"skipped"}';
 end if;
 if exists(select 1 from public.cip_market_runs baseline where baseline.id=j.run_id and (baseline.our is distinct from p.our or baseline.criteria is distinct from (p.identity||p.overrides))) then
 update public.cip_market_runs set state='failed',finished_at=now(),meta='{"error":"portfolio_changed_during_search"}' where id=j.run_id;
 update public.cip_faro_jobs set state='skipped',error_code='portfolio_changed_during_search',finished_at=now() where id=jid;return '{"state":"skipped"}';
 end if;
 finish_result:=cip_market_private.finish(j.run_id,offers,meta||jsonb_build_object('origin','faro_hourly','advisory',true),failed);
 update public.cip_faro_jobs set state=case when failed then 'failed' else 'completed' end,finished_at=now(),error_code=case when failed then left(meta->>'error',80) end,result=meta||jsonb_build_object('offers',finish_result->'offers') where id=jid;
 if failed then
 update public.cip_faro_config set failure_streak=failure_streak+1,circuit_until=case when failure_streak+1>=3 then now()+interval '1 hour' else circuit_until end where company_id=j.company_id;
 return jsonb_build_object('state','failed');
 end if;
 update public.cip_faro_config set failure_streak=0,circuit_until=null where company_id=j.company_id;
 update public.cip_faro_portfolio set last_completed_at=now(),last_evidence_at=case when jsonb_array_length(offers)>0 then now() else last_evidence_at end where id=p.id;
 pack:=nullif((p.identity||p.overrides)->>'our_pack_units','')::numeric;own:=nullif(p.our->>'price','')::numeric;
 for o in select * from public.cip_market_offers where run_id=j.run_id loop
 if o.offer->'match'->>'kind' in ('incompatible','alternative') or o.offer->>'currency'<>'BRL' or nullif(o.offer->>'price','')::numeric is null then continue;end if;
 n:=null;if pack>0 and nullif(o.offer->>'pack_units','')::numeric>0 and o.offer->'shipping'<>'null'::jsonb then n:=((o.offer->>'price')::numeric+(o.offer->>'shipping')::numeric)*pack/(o.offer->>'pack_units')::numeric;end if;
 oldn:=null;
 select * into previous from public.cip_market_offers prev where prev.company_id=o.company_id and prev.sku=o.sku and prev.url=o.url and prev.seller=o.seller and prev.id<>o.id and prev.created_at<=o.created_at and prev.offer->>'currency'='BRL' and prev.offer->'pack_units'=o.offer->'pack_units' and prev.offer->'shipping'=o.offer->'shipping' and prev.offer->'conditions'=o.offer->'conditions' and prev.offer->'brand'=o.offer->'brand' and prev.offer->'model'=o.offer->'model' and prev.offer->'size'=o.offer->'size' and prev.offer->'match'->>'kind' not in ('incompatible','alternative') order by prev.created_at desc,prev.id limit 1;
 if n>0 and previous.id is not null and nullif(previous.offer->>'price','')::numeric>0 then oldn:=((previous.offer->>'price')::numeric+(previous.offer->>'shipping')::numeric)*pack/(previous.offer->>'pack_units')::numeric;end if;
 finger:=md5(jsonb_build_object('price',o.offer->'price','shipping',o.offer->'shipping','pack',o.offer->'pack_units','brand',o.offer->'brand','model',o.offer->'model','size',o.offer->'size','our_price',own,'our_pack',pack)::text);
 update public.cip_faro_signals set state='superseded',updated_at=now() where company_id=p.company_id and sku=p.sku and url=o.url and seller=o.seller and kind in ('price_gap','price_drop') and fingerprint<>finger and state='open';
 foreach k in array array['evidence','price_gap','price_drop'] loop
 if k='price_gap' and not coalesce(n>0 and own>0 and (own/n-1)*100>=cfg.gap_pct,false) then continue;end if;
 if k='price_drop' and not coalesce(oldn>0 and n>0 and (1-n/oldn)*100>=cfg.gap_pct,false) then continue;end if;
 details:=jsonb_build_object('sku',p.sku,'store',p.our->>'store_code','our_price',own,'candidate_price',o.offer->'price','normalized_candidate',n,'previous_normalized_candidate',oldn,'match',o.offer->'match','source_at',p.source_at,'seller',o.seller,'advisory',true,'review_required',true);
 insert into public.cip_faro_signals(company_id,portfolio_id,sku,offer_id,kind,url,seller,fingerprint,details) values(p.company_id,p.id,p.sku,o.id,k,o.url,o.seller,finger,details)
 on conflict(company_id,sku,kind,url,seller) do update set offer_id=excluded.offer_id,last_seen_at=now(),details=excluded.details,fingerprint=excluded.fingerprint,state=case when cip_faro_signals.fingerprint is distinct from excluded.fingerprint then 'open' else cip_faro_signals.state end,updated_at=case when cip_faro_signals.fingerprint is distinct from excluded.fingerprint then now() else cip_faro_signals.updated_at end;
 signals:=signals+1;
 end loop;
 end loop;
 return jsonb_build_object('state','completed','offers',finish_result->'offers','signals_checked',signals);
end;$$;
revoke all on function cip_market_private.faro_finish(uuid,uuid,jsonb,jsonb,boolean) from public,anon,authenticated;
grant execute on function cip_market_private.faro_finish(uuid,uuid,jsonb,jsonb,boolean) to service_role;
create function public.cip_faro_finish(p_job uuid,p_lease uuid,p_offers jsonb,p_meta jsonb,p_failed boolean default false) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.faro_finish(p_job,p_lease,p_offers,p_meta,p_failed);$$;
revoke all on function public.cip_faro_finish(uuid,uuid,jsonb,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.cip_faro_finish(uuid,uuid,jsonb,jsonb,boolean) to service_role;

create function cip_market_private.faro_secret() returns text language sql stable security definer set search_path='' as $$select s.decrypted_secret from cip_market_private.worker w join vault.decrypted_secrets s on s.id=w.secret_id where w.id=1;$$;
revoke all on function cip_market_private.faro_secret() from public,anon,authenticated;
grant execute on function cip_market_private.faro_secret() to service_role;
create function public.cip_faro_worker_secret() returns text language sql stable security invoker set search_path='' as $$select cip_market_private.faro_secret();$$;
revoke all on function public.cip_faro_worker_secret() from public,anon,authenticated;
grant execute on function public.cip_faro_worker_secret() to service_role;
create function cip_market_private.faro_dispatch() returns bigint language plpgsql security definer set search_path='' as $$
declare secret text;rid bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended('cip-faro-dispatch',0));
 if not exists(select 1 from public.cip_faro_jobs j join public.cip_faro_config c on c.company_id=j.company_id where c.enabled and (c.circuit_until is null or c.circuit_until<=now()) and j.state='queued' and j.slot>=now()-interval '2 hours' and cip_market_private.sponsor(c.company_id)) then return null;end if;
 if exists(select 1 from public.cip_faro_config where last_dispatch_at>now()-interval '2 minutes') then return null;end if;
 secret:=cip_market_private.faro_secret();if secret is null then return null;end if;
 rid:=net.http_post(url:='https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-market-faro',headers:=jsonb_build_object('Content-Type','application/json','X-CIP-Faro-Secret',secret),body:='{}'::jsonb,timeout_milliseconds:=90000);
 update public.cip_faro_config set last_dispatch_at=now() where enabled;return rid;
end;$$;
revoke all on function cip_market_private.faro_dispatch() from public,anon,authenticated;
grant execute on function cip_market_private.faro_dispatch() to service_role;
create function cip_market_private.faro_read(c text,q text,skip integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare cfg public.cip_faro_config;portfolio jsonb;jobs jsonb;signals jsonb;stats jsonb;day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if q is null or length(q)>180 or skip is null or skip<0 or skip>100000 then raise exception 'invalid_filter';end if;
 select * into cfg from public.cip_faro_config where company_id=c;
 select coalesce(jsonb_agg(to_jsonb(p)),'[]') into portfolio from(select * from public.cip_faro_portfolio where company_id=c and active and (q='' or sku ilike '%'||q||'%' or our->>'description' ilike '%'||q||'%') order by pinned desc,stock_value desc,sku limit 20 offset skip)p;
 select coalesce(jsonb_agg((to_jsonb(j)-'lease')||jsonb_build_object('sku',p.sku)),'[]') into jobs from(select * from public.cip_faro_jobs where company_id=c order by created_at desc,id limit 24)j join public.cip_faro_portfolio p on p.id=j.portfolio_id and p.company_id=j.company_id;
 select coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object('description',p.our->>'description','store',p.our->>'store_code')),'[]') into signals from(select * from public.cip_faro_signals where company_id=c and state='open' and (q='' or sku ilike '%'||q||'%') order by updated_at desc,id limit 20)s join public.cip_faro_portfolio p on p.id=s.portfolio_id and p.active and p.company_id=s.company_id;
 select jsonb_build_object('active_skus',count(*),'covered_24h',count(*) filter(where last_completed_at>=now()-interval '24 hours'),'with_evidence_24h',count(*) filter(where last_evidence_at>=now()-interval '24 hours'),'never_attempted',count(*) filter(where last_attempt_at is null),'source_at',max(source_at),'source_stale',max(source_at)<(now() at time zone 'America/Sao_Paulo')::date-2,'filtered',count(*) filter(where q='' or sku ilike '%'||q||'%' or our->>'description' ilike '%'||q||'%')) into stats from public.cip_faro_portfolio where company_id=c and active;
 stats:=stats||jsonb_build_object('ai_ready',(select ai_enabled and ai_secret_id is not null from public.cip_bot_config where id=1),'claimed_today',(select count(*) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'reserved_web_calls_today',(select coalesce(sum(reserved_calls),0) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'completed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='completed' and claimed_at>=day_start),'failed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='failed' and claimed_at>=day_start),'queued',(select count(*) from public.cip_faro_jobs where company_id=c and state='queued'),'confirmed_web_calls_today',(select coalesce(sum(nullif(result->>'search_calls','')::integer),0) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'open_signals',(select count(*) from public.cip_faro_signals where company_id=c and state='open'),'last_completed',(select max(finished_at) from public.cip_faro_jobs where company_id=c and state='completed'));
 return jsonb_build_object('config',to_jsonb(cfg),'stats',stats,'portfolio',portfolio,'jobs',jobs,'signals',signals,'offset',skip,'limit',20,'can_manage',cip_pricing_private.director(c),'can_review',cip_pricing_private.writer(c),'source_scope',case when c='shopping_prohospital' then 'declared_curve_A' else 'ABC_source_required' end,'next_slot',date_trunc('hour',now())+interval '1 hour');
end;$$;
revoke all on function cip_market_private.faro_read(text,text,integer) from public,anon;
grant execute on function cip_market_private.faro_read(text,text,integer) to authenticated;
create function public.cip_faro_get(p_company text,p_query text default '',p_offset integer default 0) returns jsonb language sql stable security invoker set search_path='' as $$select cip_market_private.faro_read(p_company,p_query,p_offset);$$;
revoke all on function public.cip_faro_get(text,text,integer) from public,anon;
grant execute on function public.cip_faro_get(text,text,integer) to authenticated;

create function cip_market_private.faro_command(c text,action text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.cip_faro_config;p public.cip_faro_portfolio;k text;domain text;n integer;s integer:=0;code text;
begin
 if auth.uid() is null or not cip_pricing_private.writer(c) then raise exception 'writer_required';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>5000 then raise exception 'invalid_settings';end if;
 if action='ack' then
 if length(btrim(d->>'note')) not between 10 and 1000 or d->>'note' is null then raise exception 'note_required';end if;
 update public.cip_faro_signals set state='acknowledged',ack_by=auth.uid(),ack_note=d->>'note' where company_id=c and id=(d->>'id')::uuid and state='open';
 if not found then raise exception 'signal_changed';end if;
 else
 if not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 if action='config' then
 select * into cfg from public.cip_faro_config where company_id=c for update;
 if cfg.version is distinct from (d->>'version')::integer then raise exception 'settings_changed';end if;
 if jsonb_typeof(d->'enabled') is distinct from 'boolean' or jsonb_typeof(d->'products_per_hour') is distinct from 'number' or jsonb_typeof(d->'hot_count') is distinct from 'number' or jsonb_typeof(d->'daily_limit') is distinct from 'number' or jsonb_typeof(d->'gap_pct') is distinct from 'number' then raise exception 'invalid_settings';end if;
 if (d->>'enabled')::boolean and c<>'shopping_prohospital' then raise exception 'abc_source_required';end if;
 if jsonb_typeof(d->'domains') is distinct from 'array' or jsonb_array_length(d->'domains') not between 1 and 8 then raise exception 'invalid_domains';end if;
 for domain in select jsonb_array_elements_text(d->'domains') loop if length(domain)>180 or domain !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' or domain~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$' then raise exception 'invalid_domains';end if;end loop;
 update public.cip_faro_config set enabled=(d->>'enabled')::boolean,owner_id=auth.uid(),products_per_hour=(d->>'products_per_hour')::integer,hot_count=(d->>'hot_count')::integer,daily_limit=(d->>'daily_limit')::integer,gap_pct=(d->>'gap_pct')::numeric,domains=d->'domains',version=version+1,updated_at=now() where company_id=c;
 if not(d->>'enabled')::boolean then update public.cip_faro_jobs set state='skipped',error_code='automation_paused',finished_at=now() where company_id=c and state='queued';end if;
 elsif action in ('pin','identity') then
 select * into p from public.cip_faro_portfolio where company_id=c and id=(d->>'id')::uuid and active for update;
 if p.id is null then raise exception 'portfolio_changed';end if;
 if action='pin' then if jsonb_typeof(d->'pinned') is distinct from 'boolean' then raise exception 'invalid_settings';end if;update public.cip_faro_portfolio set pinned=(d->>'pinned')::boolean where id=p.id;
 else
 if d->>'source_hash' is distinct from p.source_hash or (d->>'expected_updated_at')::timestamptz is distinct from p.updated_at then raise exception 'portfolio_changed';end if;
 if jsonb_typeof(d->'identity') is distinct from 'object' or octet_length((d->'identity')::text)>2000 then raise exception 'invalid_identity';end if;
 for k in select jsonb_object_keys(d->'identity') loop
 if k not in ('brand','model','gtin','type','size','specification','city','state','our_pack_units') then raise exception 'invalid_identity';end if;
 if k='our_pack_units' then if jsonb_typeof(d->'identity'->k) is distinct from 'number' or (d->'identity'->>k)::numeric not between 0.000001 and 1000000 then raise exception 'invalid_identity';end if;
 else if jsonb_typeof(d->'identity'->k) is distinct from 'string' or length(d->'identity'->>k)>(case when k='specification' then 400 else 100 end) then raise exception 'invalid_identity';end if;end if;
 end loop;
 code:=d->'identity'->>'gtin';
 if coalesce(code,'')<>'' then
 if code!~'^(\d{8}|\d{12,14})$' or code~'^0+$' then raise exception 'invalid_identity';end if;
 for n in 1..length(code)-1 loop s:=s+substring(code from n for 1)::integer*case when (length(code)-n)%2=1 then 3 else 1 end;end loop;
 if (10-s%10)%10<>right(code,1)::integer then raise exception 'invalid_identity';end if;
 end if;
 update public.cip_faro_portfolio set overrides=d->'identity',updated_at=now() where id=p.id;
 end if;
 else raise exception 'invalid_action';end if;
 end if;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,auth.uid(),'faro_'||action,d);
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function cip_market_private.faro_command(text,text,jsonb) from public,anon;
grant execute on function cip_market_private.faro_command(text,text,jsonb) to authenticated;
create function public.cip_faro_command(p_company text,p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.faro_command(p_company,p_action,p_data);$$;
revoke all on function public.cip_faro_command(text,text,jsonb) from public,anon;
grant execute on function public.cip_faro_command(text,text,jsonb) to authenticated;

-- Preserve independent manual quotas; automatic runs have their own bounded budget.
create or replace function cip_market_private.start(c text,k text,store text,criteria jsonb,domains jsonb,mode text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();desk jsonb;item jsonb;r public.cip_market_runs;d text;
begin
 if v_actor is null or not cip_pricing_private.writer(c) then raise exception 'writer_required';end if;
 if length(k) not between 1 and 80 or length(store) not between 1 and 80 or mode not in ('identity','alternatives') or jsonb_typeof(criteria) is distinct from 'object' or octet_length(criteria::text)>3000 or jsonb_typeof(domains) is distinct from 'array' or jsonb_array_length(domains) not between 1 and 8 then raise exception 'invalid_query';end if;
 for d in select jsonb_array_elements_text(domains) loop if length(d)>180 or d !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' or d~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$' then raise exception 'invalid_domains';end if;end loop;
 perform pg_advisory_xact_lock(hashtextextended('cip-market-budget',0));
 if exists(select 1 from public.cip_market_runs budget where budget.actor=v_actor and budget.auto_job_id is null and state='running' and created_at>now()-interval '2 minutes') then raise exception 'search_in_progress';end if;
 if (select count(*) from public.cip_market_runs budget where budget.actor=v_actor and budget.auto_job_id is null and created_at>=(now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo')>=10 or (select count(*) from public.cip_market_runs where company_id=c and auto_job_id is null and created_at>=(now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo')>=30 then raise exception 'daily_limit';end if;
 desk:=public.cip_mp_desk_get(c,k,store,'marketplace',0);
 select x into item from jsonb_array_elements(desk->'items')x where x->>'sku'=k and x->>'store_code'=store limit 1;
 if item is null then raise exception 'source_product_required';end if;
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode) values(c,v_actor,k,store,jsonb_build_object('sku',k,'store_code',store,'description',item->>'description','unit',item->>'unit','price',item->'price','source_at',desk->'source_at'),criteria,domains,mode) returning * into r;
 return to_jsonb(r);
end;$$;

select cip_market_private.faro_sync('shopping_prohospital');
select cron.schedule('cip-faro-hourly','0 * * * *','select cip_market_private.faro_hourly();');
select cron.schedule('cip-faro-worker','*/5 * * * *','select cip_market_private.faro_dispatch();');
commit;
