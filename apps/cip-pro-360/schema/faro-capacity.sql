-- Native cron only. 1,000 distinct daily targets; priority revisits are separate.
begin;
alter table public.cip_faro_config drop constraint cip_faro_config_products_per_hour_check,drop constraint cip_faro_config_daily_limit_check,
 add constraint cip_faro_config_products_per_hour_check check(products_per_hour between 2 and 48),
 add constraint cip_faro_config_daily_limit_check check(daily_limit between 2 and 1152),
 add column daily_unique_target integer not null default 1000 check(daily_unique_target between 1 and 1000),
 add column web_daily_limit integer not null default 1152 check(web_daily_limit between 1 and 1152);
CREATE OR REPLACE FUNCTION cip_market_private.faro_sync(c text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare source text;
begin
 -- Only the Shopping source presently contains an explicit ABC curve. Do not manufacture a sales ABC for the distributor.
 if c<>'shopping_prohospital' then return;end if;
 select source_hash into source from public.cip_shopping_stock_batches where company_id=c and status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1;
 if source is null then update public.cip_faro_portfolio set active=false where company_id=c;return;end if;
 if exists(select 1 from public.cip_faro_config where company_id=c and last_source_hash=source) then update public.cip_faro_config set last_sync_at=now() where company_id=c;return;end if;
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value,priority)
 select c,r.sku,r.as_of,source,jsonb_build_object('sku',r.sku,'store_code',r.store_code,'description',r.description,'unit',r.unit,'price',r.sale_price,'source_at',r.as_of,'scope','representative_store','curve',r.curve),
 jsonb_strip_nulls(jsonb_build_object('brand',left(r.brand,100),'our_pack_units',case when upper(btrim(r.unit)) in ('UN','UND','UNID','UNIDADE') then 1 end)),totals.value,totals.priority
 from (select distinct on(sku) * from public.cip_shopping_stock_rows where company_id=c and source_hash=source and length(sku) between 1 and 80 order by sku,(quantity>0) desc,declared_cost desc,store_code)r
 join (select sku,sum(declared_cost) value,max(priority) priority from public.cip_shopping_stock_rows where company_id=c and source_hash=source group by sku)totals using(sku)
 on conflict(company_id,sku) do update set active=true,source_at=excluded.source_at,source_hash=excluded.source_hash,our=excluded.our,identity=excluded.identity,stock_value=excluded.stock_value,priority=excluded.priority,overrides=case when cip_faro_portfolio.our->>'unit' is distinct from excluded.our->>'unit' or cip_faro_portfolio.identity->>'brand' is distinct from excluded.identity->>'brand' or cip_faro_portfolio.our->>'description' is distinct from excluded.our->>'description' then '{}'::jsonb else cip_faro_portfolio.overrides end,updated_at=now();
 update public.cip_faro_portfolio p set active=false where p.company_id=c and not exists(select 1 from public.cip_shopping_stock_rows r where r.company_id=c and r.source_hash=source and r.sku=p.sku);
 update public.cip_faro_config set last_sync_at=now(),last_source_hash=source where company_id=c;
end;$function$;

create function cip_market_private.capacity_slot(c text,h timestamptz) returns integer language plpgsql security definer set search_path='' as $$
declare cfg public.cip_faro_config;day_start timestamptz:=(h at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo';day_end timestamptz:=day_start+interval '1 day';n integer;remaining integer;visited uuid[];chosen uuid[];hot uuid[];special uuid[];core uuid[];fresh integer;inserted integer;
begin
 select * into cfg from public.cip_faro_config where company_id=c for update;
 if cfg.company_id is null or not cfg.enabled or not cip_market_private.sponsor(c) or cfg.circuit_until>now() or cfg.last_slot is not distinct from h then return 0;end if;
 select least(greatest(0,cfg.daily_limit-count(*)),greatest(0,cfg.web_daily_limit-coalesce(sum(reserved_calls) filter(where claimed_at>=day_start and claimed_at<day_end),0)-count(*) filter(where state='queued'))) into remaining from public.cip_faro_jobs where company_id=c and slot>=day_start and slot<day_end;
 n:=least(cfg.products_per_hour,remaining);
 select coalesce(array_agg(distinct portfolio_id),'{}') into visited from public.cip_faro_jobs where company_id=c and slot>=day_start and slot<day_end;
 select coalesce(array_agg(id),'{}') into hot from(select id from public.cip_faro_portfolio where company_id=c and active order by (our->>'curve'='A') desc nulls last,pinned desc,stock_value desc,sku limit least(cfg.hot_count,n))x;
 select coalesce(array_agg(id),'{}') into special from(select id from public.cip_faro_portfolio where company_id=c and active and special_enabled and not(id=any(hot)) and (last_queued_at is null or last_queued_at<=h-interval '4 hours') order by last_queued_at nulls first,special_updated_at,id limit greatest(0,n-cardinality(hot)))x;
 chosen:=hot||special;
 select count(*) into fresh from unnest(chosen)x where not(x=any(visited));
 select coalesce(array_agg(id),'{}') into core from(select id from public.cip_faro_portfolio where company_id=c and active and not(id=any(visited||chosen)) order by last_queued_at asc nulls first,(our->>'curve'='A') desc nulls last,stock_value desc,sku limit least(greatest(0,n-cardinality(chosen)),greatest(0,cfg.daily_unique_target-cardinality(visited)-fresh)))x;
 chosen:=chosen||core;
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot,priority,discovery)
 select c,p.id,h,case when p.special_enabled then 110 when p.id=any(hot) then 100 else 50 end,
 case when p.special_enabled then p.special_mode='expanded' and mod(floor(extract(epoch from h)/3600)::bigint,3)=1 else p.id=core[cardinality(core)] and not(p.id=any(hot)) end
 from public.cip_faro_portfolio p where p.id=any(chosen) on conflict(portfolio_id,slot) do nothing;
 get diagnostics inserted=row_count;
 update public.cip_faro_portfolio set last_queued_at=h where id=any(chosen);
 update public.cip_faro_config set last_slot=h where company_id=c;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,cfg.owner_id,'faro_hourly_queue',jsonb_build_object('slot',h,'queued',inserted,'daily_unique_target',cfg.daily_unique_target,'hot_limit',cfg.hot_count,'special_revisit_hours',4,'web_calls_per_task',1,'source','declared_mix','erp_executed',false));
 return inserted;
end;$$;
revoke all on function cip_market_private.capacity_slot(text,timestamptz) from public,anon,authenticated,service_role;
create or replace function cip_market_private.faro_hourly() returns jsonb language plpgsql security definer set search_path='' as $$
declare c text;h timestamptz:=date_trunc('hour',now());total integer:=0;
begin
 perform pg_advisory_xact_lock(hashtextextended('cip-faro-hourly',0));
 for c in select company_id from public.cip_faro_config where enabled order by company_id loop
 if not cip_market_private.sponsor(c) then continue;end if;
 perform cip_market_private.faro_sync(c);total:=total+cip_market_private.capacity_slot(c,h);
 end loop;
 return jsonb_build_object('slot',h,'queued',total);
end;$$;
CREATE OR REPLACE FUNCTION cip_market_private.faro_claim()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg public.cip_faro_config;j public.cip_faro_jobs;p public.cip_faro_portfolio;rid uuid;token uuid;used integer;claims jsonb:='[]';seen jsonb;focus jsonb;phase text;research_mode text;feedback jsonb;reserved integer;direct_sources jsonb;day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');
begin
 perform pg_advisory_xact_lock(hashtextextended('cip-faro-worker',0));
 update public.cip_market_runs r set state='failed',finished_at=now(),meta=jsonb_build_object('error','worker_lease_expired','origin','faro_hourly') from public.cip_faro_jobs expired_job where r.auto_job_id=expired_job.id and expired_job.state='claimed' and expired_job.claimed_at<now()-interval '3 minutes' and r.state='running';
 update public.cip_faro_jobs set state='failed',finished_at=now(),error_code='worker_lease_expired' where state='claimed' and claimed_at<now()-interval '3 minutes';
 update public.cip_faro_jobs set state='skipped',finished_at=now(),error_code='missed_slot' where state='queued' and slot<now()-interval '2 hours';
 for cfg in select * from public.cip_faro_config where enabled order by company_id for update loop
 if not cip_market_private.sponsor(cfg.company_id) or cfg.circuit_until>now() then continue;end if;
 select count(*),coalesce(sum(reserved_calls),0) into used,reserved from public.cip_faro_jobs where company_id=cfg.company_id and claimed_at>=day_start;
 for j in select * from public.cip_faro_jobs where company_id=cfg.company_id and state='queued' and slot<=now() order by slot,priority desc,id for update skip locked loop
 if jsonb_array_length(claims)>=4 or used>=cfg.daily_limit or reserved>=cfg.web_daily_limit then exit;end if;
 select * into p from public.cip_faro_portfolio where id=j.portfolio_id and active;
 if p.id is null then update public.cip_faro_jobs set state='skipped',error_code='portfolio_inactive',finished_at=now() where id=j.id;continue;end if;
 phase:=case when not p.special_enabled then 'monitor' when p.special_mode='identity' then 'identity' when mod(floor(extract(epoch from j.slot)/3600)::bigint,3)=0 then 'identity' when mod(floor(extract(epoch from j.slot)/3600)::bigint,3)=1 then 'deepen' else 'similar' end;
 research_mode:=case when phase='similar' then 'alternatives' else 'identity' end;
 select coalesce(jsonb_agg(jsonb_build_object('note',x.ack_note,'at',x.updated_at)),'[]') into feedback from(select ack_note,updated_at from public.cip_faro_signals where company_id=cfg.company_id and portfolio_id=p.id and state='acknowledged' order by updated_at desc limit 3)x;
 focus:=case when p.special_enabled then jsonb_build_object('objective',p.special_note,'version',p.special_version,'phase',phase,'feedback',feedback) else null end;
 token:=gen_random_uuid();
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode,auto_job_id) values(cfg.company_id,cfg.owner_id,p.sku,p.our->>'store_code',p.our,p.identity||p.overrides,cfg.domains,research_mode,j.id) returning id into rid;
 update public.cip_market_runs set meta=jsonb_build_object('special_focus',focus,'origin','faro_hourly') where id=rid;
 update public.cip_faro_jobs set state='claimed',lease=token,run_id=rid,claimed_at=now(),reserved_calls=1 where id=j.id;
 update public.cip_faro_portfolio set last_attempt_at=now() where id=p.id;
 select coalesce(jsonb_agg(url),'[]') into seen from(select url from public.cip_market_offers where company_id=cfg.company_id and sku=p.sku and state<>'rejected' group by url order by max(created_at) desc,url limit 12)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into direct_sources from(select distinct on(o.url) o.url,o.seller,o.offer from public.cip_market_offers o join public.cip_market_runs mr on mr.id=o.run_id and mr.company_id=o.company_id where o.company_id=cfg.company_id and o.sku=p.sku and o.state='linked' and o.reviewed_at>=now()-interval '7 days' and mr.our->>'unit'=p.our->>'unit' order by o.url,o.reviewed_at desc limit 3)x;
 claims:=claims||jsonb_build_array(jsonb_build_object('web_calls',1,'output_tokens',1600,'direct_sources',direct_sources,'job',j.id,'discovery',j.discovery,'lease',token,'company',cfg.company_id,'sku',p.sku,'store',p.our->>'store_code','our',p.our,'criteria',p.identity||p.overrides,'domains',cfg.domains,'tracked_urls',seen,'mode',research_mode,'focus',focus));used:=used+1;reserved:=reserved+1;
 end loop;end loop;
 return claims;
end;$function$;
CREATE OR REPLACE FUNCTION cip_market_private.faro_read(c text, q text, skip integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg public.cip_faro_config;portfolio jsonb;jobs jsonb;signals jsonb;stats jsonb;special jsonb;capacity jsonb;day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if q is null or length(q)>180 or skip is null or skip<0 or skip>100000 then raise exception 'invalid_filter';end if;
 select * into cfg from public.cip_faro_config where company_id=c;
 select coalesce(jsonb_agg(to_jsonb(p)),'[]') into portfolio from(select * from public.cip_faro_portfolio where company_id=c and active and (q='' or sku ilike '%'||q||'%' or our->>'description' ilike '%'||q||'%') order by pinned desc,stock_value desc,sku limit 20 offset skip)p;
 select coalesce(jsonb_agg((to_jsonb(j)-'lease')||jsonb_build_object('sku',p.sku)),'[]') into jobs from(select * from public.cip_faro_jobs where company_id=c order by created_at desc,id limit 24)j join public.cip_faro_portfolio p on p.id=j.portfolio_id and p.company_id=j.company_id;
 select coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object('description',p.our->>'description','store',p.our->>'store_code')),'[]') into signals from(select * from public.cip_faro_signals where company_id=c and state='open' and (q='' or sku ilike '%'||q||'%') order by updated_at desc,id limit 20)s join public.cip_faro_portfolio p on p.id=s.portfolio_id and p.active and p.company_id=s.company_id;
 select jsonb_build_object('active_skus',count(*),'covered_24h',count(*) filter(where last_completed_at>=now()-interval '24 hours'),'with_evidence_24h',count(*) filter(where last_evidence_at>=now()-interval '24 hours'),'never_attempted',count(*) filter(where last_attempt_at is null),'source_at',max(source_at),'source_stale',max(source_at)<(now() at time zone 'America/Sao_Paulo')::date-2,'filtered',count(*) filter(where q='' or sku ilike '%'||q||'%' or our->>'description' ilike '%'||q||'%')) into stats from public.cip_faro_portfolio where company_id=c and active;
 stats:=stats||jsonb_build_object('ai_ready',(select ai_enabled and ai_secret_id is not null from public.cip_bot_config where id=1),'claimed_today',(select count(*) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'reserved_web_calls_today',(select coalesce(sum(reserved_calls),0) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'completed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='completed' and claimed_at>=day_start),'failed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='failed' and claimed_at>=day_start),'queued',(select count(*) from public.cip_faro_jobs where company_id=c and state='queued'),'confirmed_web_calls_today',(select coalesce(sum(nullif(result->>'search_calls','')::integer),0) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'open_signals',(select count(*) from public.cip_faro_signals where company_id=c and state='open'),'last_completed',(select max(finished_at) from public.cip_faro_jobs where company_id=c and state='completed'));
 select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object(
 'completed_24h',(select count(*) from public.cip_faro_jobs j where j.portfolio_id=p.id and j.company_id=c and j.state='completed' and j.finished_at>=now()-interval '24 hours'),
 'offers_24h',(select count(*) from public.cip_market_offers o where o.company_id=c and o.sku=p.sku and o.created_at>=now()-interval '24 hours'),
 'recent_offers',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select o.id,o.url,o.seller,o.created_at,o.state,o.offer||jsonb_build_object('quality',cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)) offer from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id where o.company_id=c and o.sku=p.sku order by o.created_at desc,o.id limit 3)x)
 ) order by p.special_updated_at,p.id),'[]') into special from public.cip_faro_portfolio p where p.company_id=c and p.special_enabled;
 select jsonb_build_object('daily_unique_target',cfg.daily_unique_target,'web_daily_limit',cfg.web_daily_limit,'special_revisit_hours',4,
 'unique_queued_today',(select count(distinct portfolio_id) from public.cip_faro_jobs where company_id=c and slot>=day_start and slot<day_start+interval '1 day'),
 'unique_completed_today',(select count(distinct portfolio_id) from public.cip_faro_jobs where company_id=c and state='completed' and finished_at>=day_start),
 'repeat_completed_today',(select count(*)-count(distinct portfolio_id) from public.cip_faro_jobs where company_id=c and state='completed' and finished_at>=day_start),
 'unique_completed_7d',(select count(distinct j.portfolio_id) from public.cip_faro_jobs j join public.cip_faro_portfolio p on p.id=j.portfolio_id and p.company_id=j.company_id and p.active where j.company_id=c and j.state='completed' and j.finished_at>=now()-interval '7 days'),
 'priced_candidates_24h',(select count(distinct o.sku) from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id where o.company_id=c and o.created_at>=now()-interval '24 hours' and o.state<>'rejected' and (cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)->>'basic_eligible')::boolean),
 'direct_completed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='completed' and finished_at>=day_start and result->>'collection'='direct_structured'),
 'without_any_offer',(select count(*) from public.cip_faro_portfolio p where p.company_id=c and p.active and not exists(select 1 from public.cip_market_offers o where o.company_id=c and o.sku=p.sku and o.state<>'rejected')),
 'estimated_min_days',ceil((stats->>'active_skus')::numeric/nullif(cfg.daily_unique_target,0)),
 'curve_a_skus',(select count(*) from public.cip_faro_portfolio where company_id=c and active and our->>'curve'='A')
 ) into capacity;
 return jsonb_build_object('capacity',capacity,'special',special,'config',to_jsonb(cfg),'stats',stats,'portfolio',portfolio,'jobs',jobs,'signals',signals,'offset',skip,'limit',20,'can_manage',cip_pricing_private.director(c),'can_review',cip_pricing_private.writer(c),'source_scope',case when c='shopping_prohospital' then 'declared_mix' else 'ABC_source_required' end,'next_slot',date_trunc('hour',now())+interval '1 hour');
end;$function$;
CREATE OR REPLACE FUNCTION cip_market_private.faro_command(c text, action text, d jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end;$function$;

update public.cip_faro_config set products_per_hour=48,daily_limit=1152,last_source_hash=null,version=version+1,updated_at=now() where company_id='shopping_prohospital';
select cip_market_private.faro_sync('shopping_prohospital');
commit;
