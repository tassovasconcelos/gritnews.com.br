-- Special watch uses existing hourly/worker schedules and existing quota only.
begin;
alter table public.cip_faro_portfolio
 add column special_enabled boolean not null default false,
 add column special_note text not null default '' check(length(special_note)<=600),
 add column special_mode text not null default 'expanded' check(special_mode in ('identity','expanded')),
 add column special_version integer not null default 1,
 add column special_updated_at timestamptz;

create function cip_market_private.special_set(c text,pid uuid,v integer,enabled boolean,mode text,note text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.cip_faro_portfolio;
begin
 if auth.uid() is null or not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 if enabled is null or mode is null or mode not in ('identity','expanded') or note is null or length(btrim(note)) not between 10 and 600 then raise exception 'special_objective_required';end if;
 -- Serialize all selections for the company: concurrent writers cannot exceed ten.
 perform 1 from public.cip_faro_config where company_id=c for update;
 select * into p from public.cip_faro_portfolio where company_id=c and id=pid for update;
 if p.id is null or (enabled and not p.active) then raise exception 'portfolio_changed';end if;
 if p.special_version is distinct from v then raise exception 'special_changed';end if;
 if enabled and not p.special_enabled and (select count(*) from public.cip_faro_portfolio where company_id=c and special_enabled)>=10 then raise exception 'special_limit';end if;
 update public.cip_faro_portfolio set special_enabled=enabled,special_mode=mode,special_note=btrim(note),special_version=special_version+1,special_updated_at=now() where id=pid;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,auth.uid(),'faro_special',jsonb_build_object('id',pid,'sku',p.sku,'enabled',enabled,'mode',mode,'note',btrim(note),'previous_note',p.special_note,'previous_version',p.special_version,'erp_executed',false));
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function cip_market_private.special_set(text,uuid,integer,boolean,text,text) from public,anon;
grant execute on function cip_market_private.special_set(text,uuid,integer,boolean,text,text) to authenticated;
create function public.cip_faro_special_set(p_company text,p_id uuid,p_version integer,p_enabled boolean,p_mode text,p_note text) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.special_set(p_company,p_id,p_version,p_enabled,p_mode,p_note);$$;
revoke all on function public.cip_faro_special_set(text,uuid,integer,boolean,text,text) from public,anon;
grant execute on function public.cip_faro_special_set(text,uuid,integer,boolean,text,text) to authenticated;
CREATE OR REPLACE FUNCTION cip_market_private.faro_hourly()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg public.cip_faro_config;h timestamptz:=date_trunc('hour',now());day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');n integer;remaining integer;chosen uuid[];hot uuid[];special uuid[];total integer:=0;
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
 select coalesce(array_agg(id),'{}') into special from(select id from public.cip_faro_portfolio where company_id=cfg.company_id and active and special_enabled and not(id=any(hot)) order by last_queued_at asc nulls first,special_updated_at,id limit greatest(0,n-cardinality(hot)))x;
 select hot||special||coalesce(array_agg(id),'{}') into chosen from(select id from public.cip_faro_portfolio where company_id=cfg.company_id and active and not(id=any(hot||special)) order by last_queued_at asc nulls first,stock_value desc,priority desc,sku limit greatest(0,n-cardinality(hot)-cardinality(special)))x;
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot,priority) select cfg.company_id,p.id,h,case when p.special_enabled then 110 when p.id=any(hot) then 100 else 50 end from public.cip_faro_portfolio p where p.id=any(chosen) on conflict(portfolio_id,slot) do nothing;
 get diagnostics n=row_count;total:=total+n;
 update public.cip_faro_portfolio set last_queued_at=now() where id=any(chosen);
 end if;
 update public.cip_faro_config set last_slot=h where company_id=cfg.company_id;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(cfg.company_id,cfg.owner_id,'faro_hourly_queue',jsonb_build_object('slot',h,'queued',n,'hot_limit',cfg.hot_count,'source','declared_abc','erp_executed',false));
 end loop;return jsonb_build_object('slot',h,'queued',total);
end;$function$;
CREATE OR REPLACE FUNCTION cip_market_private.faro_claim()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg public.cip_faro_config;j public.cip_faro_jobs;p public.cip_faro_portfolio;rid uuid;token uuid;used integer;claims jsonb:='[]';seen jsonb;focus jsonb;phase text;research_mode text;feedback jsonb;day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');
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
 phase:=case when not p.special_enabled then 'monitor' when p.special_mode='identity' then 'identity' when mod(floor(extract(epoch from j.slot)/3600)::bigint,3)=0 then 'identity' when mod(floor(extract(epoch from j.slot)/3600)::bigint,3)=1 then 'deepen' else 'similar' end;
 research_mode:=case when phase='similar' then 'alternatives' else 'identity' end;
 select coalesce(jsonb_agg(jsonb_build_object('note',x.ack_note,'at',x.updated_at)),'[]') into feedback from(select ack_note,updated_at from public.cip_faro_signals where company_id=cfg.company_id and portfolio_id=p.id and state='acknowledged' order by updated_at desc limit 3)x;
 focus:=case when p.special_enabled then jsonb_build_object('objective',p.special_note,'version',p.special_version,'phase',phase,'feedback',feedback) else null end;
 token:=gen_random_uuid();
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode,auto_job_id) values(cfg.company_id,cfg.owner_id,p.sku,p.our->>'store_code',p.our,p.identity||p.overrides,cfg.domains,research_mode,j.id) returning id into rid;
 update public.cip_market_runs set meta=jsonb_build_object('special_focus',focus,'origin','faro_hourly') where id=rid;
 update public.cip_faro_jobs set state='claimed',lease=token,run_id=rid,claimed_at=now(),reserved_calls=2 where id=j.id;
 update public.cip_faro_portfolio set last_attempt_at=now() where id=p.id;
 select coalesce(jsonb_agg(url),'[]') into seen from(select url from public.cip_market_offers where company_id=cfg.company_id and sku=p.sku and state<>'rejected' group by url order by max(created_at) desc,url limit 12)x;
 claims:=claims||jsonb_build_array(jsonb_build_object('job',j.id,'lease',token,'company',cfg.company_id,'sku',p.sku,'store',p.our->>'store_code','our',p.our,'criteria',p.identity||p.overrides,'domains',cfg.domains,'tracked_urls',seen,'mode',research_mode,'focus',focus));used:=used+1;
 end loop;end loop;
 return claims;
end;$function$;
CREATE OR REPLACE FUNCTION cip_market_private.faro_read(c text, q text, skip integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg public.cip_faro_config;portfolio jsonb;jobs jsonb;signals jsonb;stats jsonb;special jsonb;day_start timestamptz:=((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');
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
 return jsonb_build_object('special',special,'config',to_jsonb(cfg),'stats',stats,'portfolio',portfolio,'jobs',jobs,'signals',signals,'offset',skip,'limit',20,'can_manage',cip_pricing_private.director(c),'can_review',cip_pricing_private.writer(c),'source_scope',case when c='shopping_prohospital' then 'declared_curve_A' else 'ABC_source_required' end,'next_slot',date_trunc('hour',now())+interval '1 hour');
end;$function$;
commit;
