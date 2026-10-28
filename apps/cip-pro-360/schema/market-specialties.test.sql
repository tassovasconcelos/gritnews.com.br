-- Append to specialties + quality migration within a rollback transaction. No dispatch.
do $$declare c text:='shopping_prohospital';actor uuid;before_count integer;after_count integer;d uuid;owned uuid;p uuid;j uuid;r uuid;token uuid:=gen_random_uuid();target jsonb;q jsonb;offer jsonb;oid uuid;read_result jsonb;
begin
 select owner_id into actor from public.cip_faro_config where company_id=c;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 select (public.cip_market_directory_get(c)->>'total')::integer into before_count;
 insert into public.cip_market_directory_batches(company_id,source_hash,source_name,summary) values(c,repeat('8',64),'Synthetic brand references','{"kind":"digital"}');
 insert into public.cip_market_directory(company_id,source_hash,source_row,source_key,name,address,geo_status,site_url,domain,monitor_enabled,segment,source_updated_text,dedup_key,source_location)
 values(c,repeat('8',64),1,'test','Synthetic watch Dellamed','Digital reference','missing','https://a-watch-synthetic.com.br/produtos','a-watch-synthetic.com.br',true,'Marca','synthetic','synthetic', '{"kind":"manufacturer","brand":"Dellamed","brand_token":"dellamed","categories":["mobility"],"verification":"unverified"}') returning id into d;
 select (public.cip_market_directory_get(c)->>'total')::integer into after_count;
 if before_count<>after_count then raise exception 'digital_pages_inflated_store_count';end if;
 read_result:=public.cip_market_watch_get(c,'mobility','Synthetic watch');if jsonb_array_length(read_result->'rows')<>1 then raise exception 'watch_filter';end if;
 perform public.cip_market_watch_toggle(c,d,1,false,'Synthetic pause for test');perform public.cip_market_watch_toggle(c,d,2,true,'Synthetic resume for test');
 begin perform public.cip_market_watch_toggle(c,d,1,false,'Stale synthetic request');raise exception 'stale_change_allowed';exception when raise_exception then if sqlerrm<>'source_changed' then raise;end if;end;
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value) values(c,'__WATCH_TEST__',current_date,repeat('8',64),'{"sku":"__WATCH_TEST__","store_code":"1","description":"Cadeira de rodas Dellamed","unit":"UN","price":100}','{"brand":"Dellamed","our_pack_units":1}',1) returning id into p;
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot,priority,state,lease,claimed_at,reserved_calls) values(c,p,date_trunc('hour',now())+interval '300 days',50,'claimed',token,now(),2) returning id into j;
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode,auto_job_id) select c,actor,sku,'1',our,identity,'["medjet.com.br"]','identity',j from public.cip_faro_portfolio where id=p returning id into r;
 update public.cip_faro_jobs set run_id=r where id=j;
 target:=public.cip_faro_directory_target(j,token);
 if target->>'id'<>d::text or target->'region'->'scope'->>'brand'<>'Dellamed' or (target->'region'->>'allow_alternatives')::boolean then raise exception 'brand_assignment';end if;
 if (select reserved_calls from public.cip_faro_jobs where id=j)<>2 then raise exception 'budget_changed';end if;
 if public.cip_faro_directory_target(j,token) is distinct from target then raise exception 'duplicate_target_changed';end if;
 offer:='{"title":"Creme barreira 60 g","price":99,"currency":"BRL","brand":"Marca","match":{"kind":"similar","conflicts":[]}}';
 q:=cip_market_private.quality('{"description":"Creme barreira 100 g"}','{}',offer,'https://medjet.com.br/creme','Loja identificada');
 if (q->>'basic_eligible')::boolean then raise exception 'wrong_mass_qualified';end if;
 q:=cip_market_private.quality('{"description":"Dieta enteral 1000 ml"}','{}',jsonb_set(offer,'{title}','"Dieta enteral 1L"'),'https://medjet.com.br/dieta','Loja identificada');
 if not (q->>'basic_eligible')::boolean then raise exception 'volume_conversion_failed';end if;
 q:=cip_market_private.quality('{"description":"Creme barreira 60g"}','{}',offer,'https://lista.mercadolivre.com.br/creme','Vendedor não identificado');if (q->>'basic_eligible')::boolean then raise exception 'listing_qualified';end if;
 -- Older raw offers with stale match flags cannot bypass current server qualification.
 update public.cip_market_runs set our='{"description":"Creme barreira 100 g","unit":"UN","price":100}',criteria='{}' where id=r;
 insert into public.cip_market_offers(run_id,company_id,sku,url,seller,offer) values(r,c,'__WATCH_TEST__','https://a-watch-synthetic.com.br/creme','Loja identificada',offer) returning id into oid;
 begin perform public.cip_market_review(c,oid,1,'link','{"note":"Synthetic attempted promotion"}');raise exception 'bad_offer_promoted';exception when raise_exception then if sqlerrm<>'quality_blocked' then raise;end if;end;
 read_result:=public.cip_market_get(c,'__WATCH_TEST__');if (read_result->'offers'->0->'offer'->'quality'->>'basic_eligible')::boolean then raise exception 'read_missing_quality';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.cip_market_watch_get(c);raise exception 'unscoped_watch_read';exception when raise_exception then if sqlerrm<>'authorized_company_required' then raise;end if;end;
 if has_function_privilege('anon','public.cip_market_watch_toggle(text,uuid,integer,boolean,text)','execute') then raise exception 'anonymous_write';end if;
end;$$;
select true as watch_and_quality_tests_passed;
rollback;
