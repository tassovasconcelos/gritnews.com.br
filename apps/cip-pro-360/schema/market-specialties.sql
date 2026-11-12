-- Add digital brand/storefront sources to existing rotation; preserve all capacity limits.
begin;
create function cip_market_private.specialty(v text) returns text language sql immutable set search_path='' as $$
select case
 when t~'mascara.*(cpap|bipap)|(cpap|bipap).*mascara' then 'cpap_masks'
 when t~'cpap|bipap' then 'cpap'
 when t~'ostomia|estomia|colostomia|ileostomia|urostomia|sur.?fit|stomahesive|brava|ceraplus' then 'ostomy'
 when t~'cama.*(hospital|motoriz|articul)' then 'beds'
 when t~'meia' then 'compression'
 when t~'luva' then 'gloves'
 when t~'mascara.*(descart|cirurg|tripla|pff|n95)' then 'masks'
 when t~'dieta|nutri(cao|son)|nutren|nutridrink|isosource|suplemento.*(aliment|nutri)' then 'diets'
 when t~'curativo|hidrocoloide|hidrofibra|alginato|aquacel|mepilex|comfeel|convamax' then 'wound'
 when t~'ortese|imobiliz|joelheira|tornozeleira|munhequeira|tipoia|colete|corretor.*postur' then 'orthoses'
 when t~'cadeira.*(roda|banho|transf)|andador|bengala|muleta|scooter|guincho' then 'mobility'
 when t~'seringa|agulha|equipo|cateter|compressa|avental|touca' then 'consumption' else 'unclassified' end
 from (select translate(lower(coalesce(v,'')),'áàâãäéèêíóôõúüç','aaaaaeeeiooouuc') t)x;
$$;
revoke all on function cip_market_private.specialty(text) from public,anon,authenticated,service_role;
create or replace function cip_market_private.directory_target(jid uuid,token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
 context:=jsonb_build_object('store_name',d.name,'region',d.region,'state',d.state,'city',d.city,'location_status',d.geo_status,'source',case when coalesce(d.source_location->>'kind','store')='store' then 'supplier_directory' else 'brand_watch' end,'source_row',d.source_row,'category',category,'notice','Localização cadastral não comprova preço de filial, entrega ou frete.')||case when coalesce(d.source_location->>'kind','store')='store' then '{}'::jsonb else jsonb_build_object('scope',jsonb_build_object('kind',d.source_location->>'kind','source_url',d.site_url,'brand',d.source_location->>'brand','seller_hint',d.source_location->>'seller_hint','verification',d.source_location->>'verification'),'allow_alternatives',position(coalesce(d.source_location->>'brand_token','__none__') in haystack)=0) end;
 insert into public.cip_market_directory_targets(job_id,company_id,directory_id,run_id,domain,region_context)
 values(j.id,j.company_id,d.id,j.run_id,d.domain,context) returning * into saved_target;
 -- The run allowlist and worker context change atomically. No additional job/call reservation.
 update public.cip_market_runs set domains=jsonb_build_array(d.domain),mode=case when coalesce((context->>'allow_alternatives')::boolean,false) then 'alternatives' else 'identity' end where id=j.run_id and state='running';
 update public.cip_market_directory set last_targeted_at=now() where id=d.id;
 return jsonb_build_object('id',d.id,'domain',d.domain,'region',saved_target.region_context);
end;$$;
create or replace function cip_market_private.directory_get(c text,q text,uf text,city_filter text,region_filter text,skip integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare rows jsonb;total integer;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if q is null or length(q)>180 or uf is null or length(uf)>2 or city_filter is null or length(city_filter)>100 or region_filter is null or length(region_filter)>30 or skip is null or skip<0 or skip>100000 then raise exception 'invalid_filter';end if;
 select count(*) into total from public.cip_market_directory d where company_id=c and coalesce(source_location->>'kind','store')='store' and (q='' or concat_ws(' ',name,domain,segment) ilike '%'||q||'%') and (uf='' or coalesce(state,'?')=uf) and (city_filter='' or city ilike '%'||city_filter||'%') and (region_filter='' or region=region_filter);
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select d.*,
 (select jsonb_build_object('state',t.state,'assigned_at',t.assigned_at,'checked_at',t.checked_at,'offers',t.offers,'sku',m.sku,'run_id',t.run_id) from public.cip_market_directory_targets t join public.cip_market_runs m on m.id=t.run_id where t.directory_id=d.id order by t.assigned_at desc limit 1) latest,
 (select coalesce(jsonb_agg(e),'[]') from(select o.sku,o.url,o.seller,o.offer,o.created_at from public.cip_market_offers o join public.cip_market_directory_targets t on t.run_id=o.run_id where t.directory_id=d.id order by o.created_at desc limit 3)e) evidence
 from public.cip_market_directory d where company_id=c and coalesce(source_location->>'kind','store')='store' and (q='' or concat_ws(' ',name,domain,segment) ilike '%'||q||'%') and (uf='' or coalesce(state,'?')=uf) and (city_filter='' or city ilike '%'||city_filter||'%') and (region_filter='' or region=region_filter) order by state nulls last,city nulls last,name,id limit 20 offset skip)x;
 return jsonb_build_object('rows',rows,'total',total,'offset',skip,'can_review',cip_pricing_private.director(c),
 'summary',(select jsonb_build_object('records',count(*),'states',count(distinct state),'city_pairs',count(distinct (state,city)) filter(where city is not null),'monitor_rows',count(*) filter(where monitor_enabled),'domains',count(distinct domain) filter(where monitor_enabled),'owned',count(*) filter(where is_owned),'missing_city',count(*) filter(where city is null),'checked24',count(*) filter(where last_checked_at>=now()-interval '24 hours'),'evidence24',count(*) filter(where last_evidence_at>=now()-interval '24 hours')) from public.cip_market_directory where company_id=c and coalesce(source_location->>'kind','store')='store'),
 'states',(select coalesce(jsonb_agg(x),'[]') from(select state,count(*) records,count(*) filter(where city is null) city_pending from public.cip_market_directory where company_id=c and coalesce(source_location->>'kind','store')='store' group by state order by state)x),
 'source',(select jsonb_build_object('name',source_name,'summary',summary,'imported_at',imported_at) from public.cip_market_directory_batches where company_id=c and coalesce(summary->>'kind','store')='store' order by imported_at desc limit 1),
 'routine',(select jsonb_build_object('enabled',enabled,'hourly',products_per_hour,'hot',hot_count,'daily',daily_limit,'circuit_until',circuit_until) from public.cip_faro_config where company_id=c));
end;$$;
create function cip_market_private.watch_get(c text,cat text,q text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if cat is null or length(cat)>30 or q is null or length(q)>150 then raise exception 'invalid_filter';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from(select d.*,
 (select jsonb_build_object('sku',r.sku,'state',t.state,'offers',t.offers,'checked_at',t.checked_at,'assigned_at',t.assigned_at,'category',t.region_context->>'category') from public.cip_market_directory_targets t join public.cip_market_runs r on r.id=t.run_id where t.directory_id=d.id order by t.assigned_at desc limit 1) latest,
 (select coalesce(jsonb_agg(e),'[]') from(select o.sku,o.seller,o.url,o.offer,o.created_at from public.cip_market_offers o join public.cip_market_directory_targets t on t.run_id=o.run_id where t.directory_id=d.id order by o.created_at desc limit 3)e) evidence
 from public.cip_market_directory d where d.company_id=c and coalesce(d.source_location->>'kind','store')<>'store' and (cat='' or (d.source_location->'categories')?cat) and (q='' or concat_ws(' ',d.name,d.source_location->>'brand') ilike '%'||q||'%') order by d.source_location->>'brand',d.name,d.id limit 64)x;
 return jsonb_build_object('rows',result,'can_review',cip_pricing_private.director(c),'routine',(select jsonb_build_object('enabled',enabled,'hourly',products_per_hour,'daily',daily_limit,'hot',hot_count) from public.cip_faro_config where company_id=c));
end;$$;
revoke all on function cip_market_private.watch_get(text,text,text) from public,anon;
grant execute on function cip_market_private.watch_get(text,text,text) to authenticated;
create function public.cip_market_watch_get(p_company text,p_category text default '',p_query text default '') returns jsonb language sql stable security invoker set search_path='' as $$select cip_market_private.watch_get(p_company,p_category,p_query);$$;
revoke all on function public.cip_market_watch_get(text,text,text) from public,anon;
grant execute on function public.cip_market_watch_get(text,text,text) to authenticated;
create function cip_market_private.watch_toggle(c text,did uuid,v integer,active boolean,note text) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.cip_market_directory;
begin
 if auth.uid() is null or not public.cip_can_access(c) or not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 select * into d from public.cip_market_directory where company_id=c and id=did for update;
 if d.id is null or d.version is distinct from v or coalesce(d.source_location->>'kind','store')='store' then raise exception 'source_changed';end if;
 if active is null or coalesce(length(note),0) not between 10 and 1000 or (active and d.is_owned) then raise exception 'invalid_command';end if;
 update public.cip_market_directory set monitor_enabled=active,version=version+1 where id=d.id;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,auth.uid(),'brand_watch_toggle',jsonb_build_object('source_id',did,'active',active,'note',note,'version',v+1));
 return jsonb_build_object('saved',true,'erp_executed',false);
end;$$;
revoke all on function cip_market_private.watch_toggle(text,uuid,integer,boolean,text) from public,anon;
grant execute on function cip_market_private.watch_toggle(text,uuid,integer,boolean,text) to authenticated;
create function public.cip_market_watch_toggle(p_company text,p_id uuid,p_version integer,p_enabled boolean,p_note text) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.watch_toggle(p_company,p_id,p_version,p_enabled,p_note);$$;
revoke all on function public.cip_market_watch_toggle(text,uuid,integer,boolean,text) from public,anon;
grant execute on function public.cip_market_watch_toggle(text,uuid,integer,boolean,text) to authenticated;
commit;
