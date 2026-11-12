-- Deterministic source/identity qualification. Does not rewrite raw offers or prices.
begin;
create function cip_market_private.quality(own jsonb,criteria jsonb,o jsonb,source_url text,seller_name text) returns jsonb language plpgsql immutable set search_path='' as $$
declare a text:=translate(lower(concat_ws(' ',own->>'description',criteria->>'size',criteria->>'type',criteria->>'specification')),'áàâãäéèêíóôõúüç','aaaaaeeeiooouuc');b text:=translate(lower(concat_ws(' ',o->>'title',o->>'description',o->>'size',o->>'type',o->>'specification')),'áàâãäéèêíóôõúüç','aaaaaeeeiooouuc');seller text:=translate(lower(coalesce(seller_name,'')),'áàâãäéèêíóôõúüç','aaaaaeeeiooouuc');issues text[]:='{}';listing boolean;measure text[];other text[];amount numeric;other_amount numeric;family text;found_family boolean;found_amount boolean;ca text;cb text;sa text;sb text;
begin
 listing:=coalesce(source_url,'')~*'^https://lista\.' or coalesce(source_url,'')~*'^https://[^/]+/(busca|search|pesquisa|loja|collections|categorias?)(/|[?]|$)' or coalesce(source_url,'')~*'^https://[^/]+/?([?#].*)?$';
 if listing then issues:=array_append(issues,'Página de busca, coleção ou perfil; localizar anúncio individual.');end if;
 if seller='' or seller~'nao identificado|nao informado|diversos|varia|vendedores|lojistas' or seller in('magalu','magazine luiza','mercado livre','mercadolivre','amazon','shopee') then issues:=array_append(issues,'Identificar vendedor específico; plataforma não é vendedor.');end if;
 if lower(coalesce(o->>'conditions',''))~'403|captcha|snippet|trecho indexado|não foi possível abrir|nao foi possivel abrir|página bloqueada|pagina bloqueada' then issues:=array_append(issues,'Página integral não conferida.');end if;
 if o->'match'->>'kind' in('alternative','incompatible') or coalesce(jsonb_array_length(o->'match'->'conflicts'),0)>0 then issues:=array_append(issues,'Divergência ou alternativa de marca; não promover como equivalente.');end if;
 if nullif(criteria->>'brand','') is not null and nullif(o->>'brand','') is null then issues:=array_append(issues,'Marca não comprovada na oferta.');end if;
 if o->>'currency' is distinct from 'BRL' or coalesce(o->>'price','')!~'^[0-9]+([.][0-9]+)?$' then issues:=array_append(issues,'Preço público em reais não comprovado.');elsif (o->>'price')::numeric<=0 then issues:=array_append(issues,'Preço público em reais não comprovado.');end if;
 ca:=cip_market_private.specialty(a);cb:=cip_market_private.specialty(b);
 if ca<>'unclassified' and cb<>'unclassified' and ca<>cb then issues:=array_append(issues,'Categoria diferente.');end if;
 -- Normalize mass and volume; 100 g vs 60 g conflicts, 1 L vs 1000 mL agrees.
 for measure in select regexp_matches(a,'([0-9]+(?:[.,][0-9]+)?)[[:space:]]*(ml|kg|mg|g|l)\y','g') loop
 family:=case when measure[2] in('ml','l') then 'volume' else 'mass' end;
 amount:=replace(measure[1],',','.')::numeric*case when measure[2] in('kg','l') then 1000 when measure[2]='mg' then 0.001 else 1 end;found_family:=false;found_amount:=false;
 for other in select regexp_matches(b,'([0-9]+(?:[.,][0-9]+)?)[[:space:]]*(ml|kg|mg|g|l)\y','g') loop
 if (case when other[2] in('ml','l') then 'volume' else 'mass' end)=family then
 found_family:=true;other_amount:=replace(other[1],',','.')::numeric*case when other[2] in('kg','l') then 1000 when other[2]='mg' then 0.001 else 1 end;if other_amount=amount then found_amount:=true;end if;end if;
 end loop;
 if found_family and not found_amount then issues:=array_append(issues,'Conteúdo/massa/volume diferente da nossa referência.');end if;
 end loop;
 sa:=substring(a from '(urostomia|colostomia|ileostomia)');sb:=substring(b from '(urostomia|colostomia|ileostomia)');if sa is not null and sb is not null and sa<>sb then issues:=array_append(issues,'Tipo de estomia diferente.');end if;
 if ca='ostomy' and cb='ostomy' and ((a~'(uma|1)[[:space:]]+peça' and b~'(duas|2)[[:space:]]+peças?') or (b~'(uma|1)[[:space:]]+peça' and a~'(duas|2)[[:space:]]+peças?')) then issues:=array_append(issues,'Sistema de peças diferente.');end if;
 sa:=substring(a from '([0-9]{1,2}[- /]+[0-9]{1,2}[[:space:]]*mmhg)');sb:=substring(b from '([0-9]{1,2}[- /]+[0-9]{1,2}[[:space:]]*mmhg)');
 if sa is not null and sb is not null and regexp_replace(sa,'[^0-9]','','g')<>regexp_replace(sb,'[^0-9]','','g') then issues:=array_append(issues,'Compressão em mmHg diferente.');end if;
 if ca='cpap_masks' and cb='cpap_masks' and ((a~'oronasal|facial' and b~'nasal' and b!~'oronasal|facial') or (b~'oronasal|facial' and a~'nasal' and a!~'oronasal|facial')) then issues:=array_append(issues,'Interface de máscara diferente.');end if;
 if b~'^(almofada|cushion|clip|cotovelo|arnes|conector|filtro|traqueia)' and b~'cpap|bipap' and a!~'^(almofada|cushion|clip|cotovelo|arnes|conector|filtro|traqueia)' then issues:=array_append(issues,'Acessório não corresponde a equipamento ou máscara completa.');end if;
 return jsonb_build_object('basic_eligible',cardinality(issues)=0,'findings',to_jsonb(issues),'source_type',case when listing then 'listing' else 'individual_candidate' end,'rule_version','market-quality-20261027.1','certified',false);
end;$$;
revoke all on function cip_market_private.quality(jsonb,jsonb,jsonb,text,text) from public,anon,authenticated,service_role;
create or replace function cip_market_private.read(c text,k text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare runs jsonb;offers jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if k is null or length(k)>80 then raise exception 'invalid_query';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into runs from(select * from public.cip_market_runs where company_id=c and (k='' or sku=k) order by created_at desc,id limit 10)x;
 select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('criteria',r.criteria,'our',r.our,'mode',r.mode,'offer',x.offer||jsonb_build_object('quality',cip_market_private.quality(r.our,r.criteria,x.offer,x.url,x.seller)))),'[]') into offers from(select * from public.cip_market_offers where company_id=c and (k='' or sku=k) order by created_at desc,id limit 100)x join public.cip_market_runs r on r.id=x.run_id and r.company_id=x.company_id;
 return jsonb_build_object('runs',runs,'offers',offers,'can_write',cip_pricing_private.writer(c),'limit',100,'coverage','sample');
end;$$;
create or replace function cip_market_private.review(c text,oid uuid,v integer,action text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
 if (cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)->>'basic_eligible')::boolean is not true then raise exception 'quality_blocked';end if;
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
end;$$;
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
end;$$;

with checked as(select o.id,cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller) q from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id where o.company_id in('shopping_prohospital','distribuidora_prohospital'))
 ,withdrawn as(update public.cip_faro_signals s set state='superseded',details=s.details||jsonb_build_object('quality',checked.q,'quality_hold',true),updated_at=now() from checked where s.offer_id=checked.id and s.state='open' and (checked.q->>'basic_eligible')::boolean is not true returning s.company_id)
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) select company_id,null,'market_quality_audit',jsonb_build_object('signals_withdrawn',count(*),'rule_version','market-quality-20261027.1','raw_offers_changed',false,'prices_changed',false) from withdrawn group by company_id;
commit;
