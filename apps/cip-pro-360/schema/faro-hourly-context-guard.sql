begin;
create or replace function cip_market_private.faro_finish(jid uuid,token uuid,offers jsonb,meta jsonb,failed boolean) returns jsonb language plpgsql security definer set search_path='' as $$
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

create or replace function cip_market_private.faro_command(c text,action text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
commit;
