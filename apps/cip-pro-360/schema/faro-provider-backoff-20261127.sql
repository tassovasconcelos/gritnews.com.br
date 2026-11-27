-- CIP360 Faro provider protection: differentiate quota exhaustion from transient throttling.
-- Preserves all existing permissions, claims, source handling and saving logic.
-- No proxy/IP circumvention. Backoff reduces repetitive calls when the account is blocked.
CREATE OR REPLACE FUNCTION cip_market_private.faro_finish(jid uuid, token uuid, offers jsonb, meta jsonb, failed boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j public.cip_faro_jobs;cfg public.cip_faro_config;p public.cip_faro_portfolio;o public.cip_market_offers;previous public.cip_market_offers;k text;finger text;details jsonb;n numeric;oldn numeric;own numeric;pack numeric;signals integer:=0;finish_result jsonb;code text;domain text;u text;observed jsonb;proof jsonb;entry jsonb;
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
 -- Only server-assigned discovery jobs can extend the run source set.
 if j.discovery and not failed then
 observed:=meta->'observed_domains';proof:=meta->'sources';
 if jsonb_typeof(observed) is distinct from 'array' or jsonb_array_length(observed)>40 or jsonb_typeof(proof) is distinct from 'array' or jsonb_array_length(proof)>100 then raise exception 'invalid_discovery_sources';end if;
 for domain in select jsonb_array_elements_text(observed) loop
 if length(domain)>180 or domain !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' or domain~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$' then raise exception 'invalid_discovery_sources';end if;
 end loop;
 for u in select jsonb_array_elements_text(proof) loop
 if length(u)>2000 or u !~ '^https://[a-z0-9.-]+/' or not exists(select 1 from jsonb_array_elements_text(observed)d where split_part(u,'/',3)=d or split_part(u,'/',3) like '%.'||d) then raise exception 'invalid_discovery_sources';end if;
 end loop;
 for entry in select value from jsonb_array_elements(offers) loop
 if not exists(select 1 from jsonb_array_elements_text(proof)x where x=entry->>'url') then raise exception 'discovery_evidence_required';end if;
 end loop;
 update public.cip_market_runs set domains=observed where id=j.run_id;
 end if;
 finish_result:=cip_market_private.finish(j.run_id,offers,meta||jsonb_build_object('origin','faro_hourly','advisory',true,'discovery',j.discovery),failed);
 update public.cip_faro_jobs set state=case when failed then 'failed' else 'completed' end,finished_at=now(),error_code=case when failed then left(meta->>'error',80) end,result=meta||jsonb_build_object('offers',finish_result->'offers') where id=jid;
 if failed then
 update public.cip_faro_config set failure_streak=failure_streak+1,circuit_until=case
  when meta->>'error'='provider_quota_exhausted' then now()+interval '24 hours'
  when meta->>'error'='provider_429_unclassified' then now()+interval '12 hours'
  when meta->>'error'='provider_rate_limit' then
   now()+greatest(
     interval '1 hour',
     make_interval(secs=>least(43200,coalesce((meta->>'retry_after_seconds')::integer,0))),
     make_interval(hours=>least(12,greatest(1,(failure_streak+1)/8)))
   )
  when meta->>'error'='provider_capacity_unavailable' then now()+interval '1 hour'
  when failure_streak+1>=3 then now()+interval '1 hour'
  else circuit_until end where company_id=j.company_id;
 return jsonb_build_object('state','failed');
 end if;
 update public.cip_faro_config set failure_streak=0,circuit_until=null where company_id=j.company_id;
 update public.cip_faro_portfolio set last_completed_at=now(),last_evidence_at=case when jsonb_array_length(offers)>0 then now() else last_evidence_at end where id=p.id;
 pack:=nullif((p.identity||p.overrides)->>'our_pack_units','')::numeric;own:=nullif(p.our->>'price','')::numeric;
 for o in select * from public.cip_market_offers where run_id=j.run_id loop
 if (cip_market_private.quality(p.our,p.identity||p.overrides,o.offer,o.url,o.seller)->>'basic_eligible')::boolean is not true then continue;end if;
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
end;$function$

