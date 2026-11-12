begin;
CREATE OR REPLACE FUNCTION cip_market_private.directory_target(jid uuid, token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j public.cip_faro_jobs;d public.cip_market_directory;saved_target public.cip_market_directory_targets;p public.cip_faro_portfolio;category text;haystack text;digital_turn boolean;context jsonb;
begin
 select * into j from public.cip_faro_jobs where id=jid for update;
 if j.id is null or j.state<>'claimed' or j.lease is distinct from token or j.claimed_at<now()-interval '3 minutes' then raise exception 'worker_lease_invalid';end if;
 if j.priority>=100 then return null;end if; -- preserve recurrent priority monitoring
 if not exists(select 1 from public.cip_faro_config where company_id=j.company_id and enabled and (circuit_until is null or circuit_until<=now())) or not cip_market_private.sponsor(j.company_id) then raise exception 'automation_paused';end if;
 perform pg_advisory_xact_lock(hashtextextended('cip-directory-'||j.company_id,0));
 select * into saved_target from public.cip_market_directory_targets where job_id=jid;
 if found then return jsonb_build_object('id',saved_target.directory_id,'domain',saved_target.domain,'region',saved_target.region_context);end if;
 select * into p from public.cip_faro_portfolio where id=j.portfolio_id;
 category:=cip_market_private.specialty(p.our->>'description');
 haystack:=regexp_replace(lower(concat_ws(' ',p.our->>'description',p.identity->>'brand',p.overrides->>'brand')),'[^a-z0-9]','','g');
 select count(*)%3=0 into digital_turn from public.cip_market_directory_targets t join public.cip_faro_jobs other_job on other_job.id=t.job_id where t.company_id=j.company_id and other_job.slot=j.slot;
 select x.* into d from public.cip_market_directory x where x.company_id=j.company_id and x.monitor_enabled and not x.is_owned
 and (coalesce(x.source_location->>'kind','store')='store' or (digital_turn and (position(coalesce(x.source_location->>'brand_token','__none__') in haystack)>0 or coalesce(x.source_location->'categories','[]'::jsonb)?category)))
 and not exists(select 1 from public.cip_market_directory_targets t join public.cip_faro_jobs other_job on other_job.id=t.job_id where t.company_id=j.company_id and t.domain=x.domain and other_job.slot=j.slot)
 order by case when coalesce(x.source_location->>'kind','store')='store' then 2 when position(coalesce(x.source_location->>'brand_token','__none__') in haystack)>0 then 0 else 1 end,
 (select max(t.assigned_at) from public.cip_market_directory_targets t where t.company_id=j.company_id and t.domain=x.domain) asc nulls first,x.last_targeted_at asc nulls first,x.domain,x.state,x.city,x.id limit 1 for update of x skip locked;
 if d.id is null then return null;end if;
 context:=jsonb_build_object('store_name',d.name,'region',d.region,'state',d.state,'city',d.city,'location_status',d.geo_status,'source',case when coalesce(d.source_location->>'kind','store')='store' then 'supplier_directory' else 'brand_watch' end,'source_url',d.site_url,'source_row',d.source_row,'category',category,'notice','Localização cadastral não comprova preço de filial, entrega ou frete.')||case when coalesce(d.source_location->>'kind','store')='store' then jsonb_build_object('scope',jsonb_build_object('kind','store','source_url',d.site_url,'verification','directory_reference')) else jsonb_build_object('scope',jsonb_build_object('kind',d.source_location->>'kind','source_url',d.site_url,'brand',d.source_location->>'brand','seller_hint',d.source_location->>'seller_hint','verification',d.source_location->>'verification'),'allow_alternatives',position(coalesce(d.source_location->>'brand_token','__none__') in haystack)=0) end;
 insert into public.cip_market_directory_targets(job_id,company_id,directory_id,run_id,domain,region_context)
 values(j.id,j.company_id,d.id,j.run_id,d.domain,context) returning * into saved_target;
 -- The run allowlist and worker context change atomically. No additional job/call reservation.
 update public.cip_market_runs set domains=jsonb_build_array(d.domain),mode=case when coalesce((context->>'allow_alternatives')::boolean,false) then 'alternatives' else 'identity' end where id=j.run_id and state='running';
 update public.cip_market_directory set last_targeted_at=now() where id=d.id;
 return jsonb_build_object('id',d.id,'domain',d.domain,'region',saved_target.region_context);
end;$function$;

CREATE OR REPLACE FUNCTION cip_market_private.board_read(c text, skus jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare wanted text[];rows jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if jsonb_typeof(skus) is distinct from 'array' or jsonb_array_length(skus)>20 or octet_length(skus::text)>5000 then raise exception 'invalid_filter';end if;
 select array_agg(x) into wanted from jsonb_array_elements_text(skus)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(
 select distinct on(o.sku) o.id,o.company_id,o.sku,o.seller,o.url,o.created_at,o.state,r.our,r.criteria,o.offer||jsonb_build_object('quality',cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)) offer
 from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id
 where o.company_id=c and o.sku=any(wanted) and o.state in ('candidate','linked') and o.created_at>=now()-interval '7 days' and cip_market_private.evidence_ready(r.our,r.criteria,o.offer,o.url,o.seller)
 order by o.sku,o.created_at desc,o.id
 )x;
 return jsonb_build_object('rows',rows,'checked_at',now(),'candidate_only',true);
end;$function$;

CREATE OR REPLACE FUNCTION cip_pricing_private.desk_comparison(c text, q text, store text, channel_filter text, skip integer, v_order text, v_evidence text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d jsonb;items jsonb;b public.cip_shopping_stock_batches;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 d:=cip_pricing_private.desk_ordered(c,q,store,channel_filter,skip,v_order,v_evidence);
 if c='shopping_prohospital' and d->>'source'='stock_reference' then select * into b from public.cip_shopping_stock_batches where company_id=c and status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1;end if;
 select coalesce(jsonb_agg(x||jsonb_build_object('imported_price',case when d->>'source'='stock_reference' then x->'price' else null end,'own_price_verified',d->>'source'='erp_approved' and (d->>'source_fresh')::boolean and coalesce((x->>'price')::numeric>0,false),'price',case when d->>'source'='erp_approved' and (d->>'source_fresh')::boolean then x->'price' else 'null'::jsonb end,'price_role',case when d->>'source'='erp_approved' and (d->>'source_fresh')::boolean then 'approved_erp' else 'unverified_import' end,'price_provenance',jsonb_build_object('source',d->>'source','file',b.source_file,'sheet',b.source_sheet,'as_of',d->>'source_at','row',(select r.source_row from public.cip_shopping_stock_rows r where r.company_id=c and r.source_hash=b.source_hash and r.sku=x->>'sku' and r.store_code=x->>'store_code' order by r.source_row limit 1)))),'[]') into items from jsonb_array_elements(d->'items') x;
 return d||jsonb_build_object('market_rows',cip_market_private.board_read(c,(select coalesce(jsonb_agg(distinct x->>'sku'),'[]'::jsonb) from jsonb_array_elements(items)x))->'rows','items',items,'order',v_order,'evidence_filter',v_evidence,'price_semantics','own_requires_approved_current_source');
end;$function$;

notify pgrst,'reload schema';
commit;
