-- Explicit special registration and traceable candidate board. No research dispatch.
begin;
create function cip_market_private.evidence_ready(own jsonb,criteria jsonb,o jsonb,u text,seller text) returns boolean language sql immutable set search_path='' as $$
 select coalesce((cip_market_private.quality(own,criteria,o,u,seller)->>'basic_eligible')::boolean,false)
 and coalesce(length(btrim(o->>'quote'))>=5,false)
 and coalesce(u~'^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(/|$)',false)
 and coalesce(split_part(u,'/',3)!~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$',false)
 and coalesce(u!~*'^https://[^/]+/(marcas|busca|search|pesquisa|loja|categorias?|collections)(/|[?]|$)',false)
 and coalesce(u!~*'\.(pdf|csv|xlsx?|jpg|png)([?#]|$)',false)
 and coalesce(u!~*'[?&][^=&]*(token|secret|password|credential|signature|session)[^=&]*=',false);
$$;
revoke all on function cip_market_private.evidence_ready(jsonb,jsonb,jsonb,text,text) from public,anon,authenticated,service_role;
create function cip_market_private.special_batch(c text,skus jsonb,note text,mode text) returns jsonb language plpgsql security definer set search_path='' as $$
declare wanted text[];missing text;selected integer;added integer;
begin
 if auth.uid() is null or not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 if jsonb_typeof(skus) is distinct from 'array' or jsonb_array_length(skus) not between 1 and 10 or exists(select 1 from jsonb_array_elements(skus)x where jsonb_typeof(x)<>'string' or length(btrim(x#>>'{}')) not between 1 and 80) then raise exception 'special_skus_required';end if;
 if note is null or length(btrim(note)) not between 10 and 600 or mode is null or mode not in ('identity','expanded') then raise exception 'special_objective_required';end if;
 select array_agg(distinct btrim(x)) into wanted from jsonb_array_elements_text(skus)x;
 perform 1 from public.cip_faro_config where company_id=c for update;if not found then raise exception 'authorized_company_required';end if;
 select string_agg(x,', ') into missing from unnest(wanted)x where not exists(select 1 from public.cip_faro_portfolio p where p.company_id=c and p.sku=x and p.active);
 if missing is not null then raise exception 'special_sku_not_found' using detail=missing;end if;
 select count(*) into selected from public.cip_faro_portfolio where company_id=c and special_enabled;
 select count(*) into added from public.cip_faro_portfolio where company_id=c and active and sku=any(wanted) and not special_enabled;
 if selected+added>10 then raise exception 'special_limit';end if;
 update public.cip_faro_portfolio set special_enabled=true,special_note=btrim(note),special_mode=mode,special_version=special_version+1,special_updated_at=now() where company_id=c and active and sku=any(wanted) and not special_enabled;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,auth.uid(),'faro_special_batch',jsonb_build_object('skus',wanted,'added',added,'selected',selected+added,'note',btrim(note),'mode',mode,'erp_executed',false));
 return jsonb_build_object('ok',true,'added',added,'selected',selected+added);
end;$$;
revoke all on function cip_market_private.special_batch(text,jsonb,text,text) from public,anon;
grant execute on function cip_market_private.special_batch(text,jsonb,text,text) to authenticated;
create function public.cip_faro_special_batch(p_company text,p_skus jsonb,p_note text,p_mode text default 'identity') returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.special_batch(p_company,p_skus,p_note,p_mode);$$;
revoke all on function public.cip_faro_special_batch(text,jsonb,text,text) from public,anon;
grant execute on function public.cip_faro_special_batch(text,jsonb,text,text) to authenticated;
create function cip_market_private.board_read(c text,skus jsonb) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare wanted text[];rows jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if jsonb_typeof(skus) is distinct from 'array' or jsonb_array_length(skus)>20 or octet_length(skus::text)>5000 then raise exception 'invalid_filter';end if;
 select array_agg(x) into wanted from jsonb_array_elements_text(skus)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(
 select distinct on(o.sku) o.id,o.sku,o.seller,o.url,o.created_at,o.state,r.our,r.criteria,o.offer||jsonb_build_object('quality',cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)) offer
 from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id
 where o.company_id=c and o.sku=any(wanted) and o.state<>'rejected' and o.created_at>=now()-interval '7 days' and cip_market_private.evidence_ready(r.our,r.criteria,o.offer,o.url,o.seller)
 order by o.sku,o.created_at desc,o.id
 )x;
 return jsonb_build_object('rows',rows,'checked_at',now(),'candidate_only',true);
end;$$;
revoke all on function cip_market_private.board_read(text,jsonb) from public,anon;
grant execute on function cip_market_private.board_read(text,jsonb) to authenticated;
create function public.cip_market_board_get(p_company text,p_skus jsonb) returns jsonb language sql stable security invoker set search_path='' as $$select cip_market_private.board_read(p_company,p_skus);$$;
revoke all on function public.cip_market_board_get(text,jsonb) from public,anon;
grant execute on function public.cip_market_board_get(text,jsonb) to authenticated;
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
 select coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object('description',p.our->>'description','store',r.our->>'store_code','our',r.our,'criteria',r.criteria,'offer',o.offer||jsonb_build_object('quality',cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)),'collected_at',o.created_at,'seller',o.seller,'url',o.url)),'[]') into signals from(select * from public.cip_faro_signals where company_id=c and state='open' and (q='' or sku ilike '%'||q||'%') order by updated_at desc,id limit 20)s join public.cip_faro_portfolio p on p.id=s.portfolio_id and p.active and p.company_id=s.company_id join public.cip_market_offers o on o.id=s.offer_id and o.company_id=s.company_id join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id where cip_market_private.evidence_ready(r.our,r.criteria,o.offer,o.url,o.seller);
 select jsonb_build_object('active_skus',count(*),'covered_24h',count(*) filter(where last_completed_at>=now()-interval '24 hours'),'with_evidence_24h',count(*) filter(where last_evidence_at>=now()-interval '24 hours'),'never_attempted',count(*) filter(where last_attempt_at is null),'source_at',max(source_at),'source_stale',max(source_at)<(now() at time zone 'America/Sao_Paulo')::date-2,'filtered',count(*) filter(where q='' or sku ilike '%'||q||'%' or our->>'description' ilike '%'||q||'%')) into stats from public.cip_faro_portfolio where company_id=c and active;
 stats:=stats||jsonb_build_object('ai_ready',(select ai_enabled and ai_secret_id is not null from public.cip_bot_config where id=1),'claimed_today',(select count(*) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'reserved_web_calls_today',(select coalesce(sum(reserved_calls),0) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'completed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='completed' and claimed_at>=day_start),'failed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='failed' and claimed_at>=day_start),'queued',(select count(*) from public.cip_faro_jobs where company_id=c and state='queued'),'confirmed_web_calls_today',(select coalesce(sum(nullif(result->>'search_calls','')::integer),0) from public.cip_faro_jobs where company_id=c and claimed_at>=day_start),'open_signals',(select count(*) from public.cip_faro_signals where company_id=c and state='open'),'last_completed',(select max(finished_at) from public.cip_faro_jobs where company_id=c and state='completed'));
 select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object(
 'completed_24h',(select count(*) from public.cip_faro_jobs j where j.portfolio_id=p.id and j.company_id=c and j.state='completed' and j.finished_at>=now()-interval '24 hours'),
 'offers_24h',(select count(*) from public.cip_market_offers o where o.company_id=c and o.sku=p.sku and o.created_at>=now()-interval '24 hours'),
 'recent_offers',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select o.id,o.url,o.seller,o.created_at,o.state,o.offer||jsonb_build_object('quality',cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)) offer from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id where o.company_id=c and o.sku=p.sku and o.created_at>=now()-interval '7 days' and o.state<>'rejected' and cip_market_private.evidence_ready(r.our,r.criteria,o.offer,o.url,o.seller) order by o.created_at desc,o.id limit 3)x)
 ) order by p.special_updated_at,p.id),'[]') into special from public.cip_faro_portfolio p where p.company_id=c and p.special_enabled;
 select jsonb_build_object('daily_unique_target',cfg.daily_unique_target,'web_daily_limit',cfg.web_daily_limit,'special_revisit_hours',4,
 'unique_queued_today',(select count(distinct portfolio_id) from public.cip_faro_jobs where company_id=c and slot>=day_start and slot<day_start+interval '1 day'),
 'unique_completed_today',(select count(distinct portfolio_id) from public.cip_faro_jobs where company_id=c and state='completed' and finished_at>=day_start),
 'repeat_completed_today',(select count(*)-count(distinct portfolio_id) from public.cip_faro_jobs where company_id=c and state='completed' and finished_at>=day_start),
 'unique_completed_7d',(select count(distinct j.portfolio_id) from public.cip_faro_jobs j join public.cip_faro_portfolio p on p.id=j.portfolio_id and p.company_id=j.company_id and p.active where j.company_id=c and j.state='completed' and j.finished_at>=now()-interval '7 days'),
 'priced_candidates_24h',(select count(distinct o.sku) from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id where o.company_id=c and o.created_at>=now()-interval '24 hours' and o.state<>'rejected' and (cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)->>'basic_eligible')::boolean),
 'direct_completed_today',(select count(*) from public.cip_faro_jobs where company_id=c and state='completed' and finished_at>=day_start and result->>'collection'='direct_structured'),
 'without_any_offer',(select count(*) from public.cip_faro_portfolio p where p.company_id=c and p.active and not exists(select 1 from public.cip_market_offers o where o.company_id=c and o.sku=p.sku and o.created_at>=now()-interval '7 days' and o.state<>'rejected')),
 'estimated_min_days',ceil((stats->>'active_skus')::numeric/nullif(cfg.daily_unique_target,0)),
 'curve_a_skus',(select count(*) from public.cip_faro_portfolio where company_id=c and active and our->>'curve'='A')
 ) into capacity;
 return jsonb_build_object('capacity',capacity,'special',special,'config',to_jsonb(cfg),'stats',stats,'portfolio',portfolio,'jobs',jobs,'signals',signals,'offset',skip,'limit',20,'can_manage',cip_pricing_private.director(c),'can_review',cip_pricing_private.writer(c),'source_scope',case when c='shopping_prohospital' then 'declared_mix' else 'ABC_source_required' end,'next_slot',date_trunc('hour',now())+interval '1 hour');
end;$function$;
CREATE OR REPLACE FUNCTION cip_market_private.review(c text, oid uuid, v integer, action text, d jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o public.cip_market_offers;r public.cip_market_runs;ref jsonb;required text;refdata jsonb;retired uuid[];unit text;kind text;note text;
begin
 if auth.uid() is null or not cip_pricing_private.writer(c) then raise exception 'writer_required';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>8000 then raise exception 'invalid_review';end if;
 select * into o from public.cip_market_offers where company_id=c and id=oid for update;
 if o.id is null or o.version<>v or o.state<>'candidate' then raise exception 'offer_changed';end if;
 select * into r from public.cip_market_runs where id=o.run_id and company_id=c;
 note:=btrim(d->>'note');if note is null or length(note) not between 10 and 1000 then raise exception 'review_note_required';end if;
 if action not in ('link','alternative','reject') or action is null then raise exception 'invalid_action';end if;
 if action='link' then
 if cip_market_private.evidence_ready(r.our,r.criteria,o.offer,o.url,o.seller) is not true then raise exception 'quality_blocked';end if;
 kind:=o.offer->'match'->>'kind';unit:=r.our->>'unit';
 if kind is null or kind in ('incompatible','alternative') or coalesce(jsonb_array_length(o.offer->'match'->'conflicts'),0)>0 or o.offer->>'currency' is distinct from 'BRL' then raise exception 'comparison_blocked';end if;
 if o.created_at<now()-interval '7 days' then raise exception 'stale_offer';end if;
 foreach required in array array['product','packaging','price','shipping','stock','terms','replace_previous'] loop if d->'checks'->required is distinct from 'true'::jsonb then raise exception 'checks_required';end if;end loop;
 if o.seller='Vendedor não identificado' or unit is null or length(unit) not between 1 and 80 then raise exception 'identity_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('cip-market-ref:'||c||':'||o.sku,0));
 if exists(select 1 from public.cip_market_offers newer where newer.company_id=c and newer.sku=o.sku and newer.url=o.url and newer.seller=o.seller and newer.state='linked' and newer.created_at>o.created_at) then raise exception 'newer_offer_reviewed';end if;
 refdata:=jsonb_build_object('sku',o.sku,'our_unit',unit,'competitor',left(o.seller||' · '||(o.offer->>'platform'),120),'pack_price',d->'price','shipping',d->'shipping','equivalent_units',d->'equivalent_units','channel',d->>'channel','conditions',left(note||' | Radar '||r.id::text||' | '||coalesce(o.offer->>'conditions',''),600),'source_url',o.url,'observed_on',(now() at time zone 'America/Sao_Paulo')::date,'equivalent',true,'availability','available');
 -- The existing checked command validates numbers, date, channel, actor and company.
 ref:=cip_pricing_private.command(c,'reference',refdata);
 with old as(select distinct x.reference_id from public.cip_market_offers x join public.cip_mp_market_refs f on f.id=x.reference_id and f.company_id=x.company_id where x.company_id=c and x.sku=o.sku and x.url=o.url and x.seller=o.seller and f.active and f.channel=d->>'channel' and f.our_unit=unit)
 update public.cip_mp_market_refs set active=false where id in(select reference_id from old);
 update public.cip_market_offers set state='linked',reference_id=(ref->>'id')::uuid,review=d,reviewed_by=auth.uid(),reviewed_at=now(),version=version+1 where id=o.id;
 else update public.cip_market_offers set state=case when action='reject' then 'rejected' else 'alternative' end,review=d,reviewed_by=auth.uid(),reviewed_at=now(),version=version+1 where id=o.id;
 end if;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,auth.uid(),'market_review',jsonb_build_object('offer_id',o.id,'run_id',r.id,'action',action,'review',d,'reference_id',ref->>'id','erp_executed',false));
 return jsonb_build_object('id',o.id,'reference_id',ref->>'id','erp_executed',false);
end;$function$;
notify pgrst,'reload schema';
commit;
