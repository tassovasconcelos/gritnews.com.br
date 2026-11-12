-- Append to migration body, rollback only. No paid search or external messaging.
do $$declare c text:='shopping_prohospital';actor uuid;skus jsonb;out jsonb;r uuid;good uuid;bad uuid;missing_quote uuid;before_n integer;
begin
 select owner_id into actor from public.cip_faro_config where company_id=c;perform set_config('request.jwt.claim.sub',actor::text,true);
 update public.cip_faro_portfolio set special_enabled=false where company_id=c;
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value)
 select c,'__CLARITY_'||lpad(g::text,2,'0'),current_date,repeat('5',64),jsonb_build_object('sku','__CLARITY_'||lpad(g::text,2,'0'),'store_code','1','description','Luva Medix','unit','UN','price',100),'{"brand":"Medix","our_pack_units":1}',1 from generate_series(1,11)g;
 begin perform public.cip_faro_special_batch(c,'["__CLARITY_01","__MISSING__"]','Conferir o produto exato e seu anúncio','identity');raise exception 'partial_batch_allowed';exception when raise_exception then if sqlerrm<>'special_sku_not_found' then raise;end if;end;
 if exists(select 1 from public.cip_faro_portfolio where company_id=c and special_enabled) then raise exception 'partial_write';end if;
 select jsonb_agg('__CLARITY_'||lpad(g::text,2,'0')) into skus from generate_series(1,10)g;
 out:=public.cip_faro_special_batch(c,skus,'Conferir o produto exato e seu anúncio','identity');if out->>'added'<>'10' or out->>'selected'<>'10' then raise exception 'ten_not_registered';end if;
 out:=public.cip_faro_special_batch(c,skus,'Não sobrescrever a orientação já registrada','expanded');if out->>'added'<>'0' then raise exception 'duplicate_added';end if;
 if exists(select 1 from public.cip_faro_portfolio where company_id=c and special_enabled and special_mode<>'identity') then raise exception 'duplicate_overwrote';end if;
 begin perform public.cip_faro_special_batch(c,'["__CLARITY_11"]','Exceder dez não deve ser permitido','identity');raise exception 'eleventh_allowed';exception when raise_exception then if sqlerrm<>'special_limit' then raise;end if;end;
 begin perform public.cip_faro_special_batch('distribuidora_prohospital',skus,'Outra empresa não pode usar estes SKUs','identity');raise exception 'cross_company';exception when raise_exception then if sqlerrm<>'special_sku_not_found' then raise;end if;end;
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode,state,finished_at) values(c,actor,'__CLARITY_01','1','{"sku":"__CLARITY_01","unit":"UN","price":100,"description":"Luva Medix"}','{"brand":"Medix","our_pack_units":1}','["loja-evidencia.com.br"]','identity','completed',now()) returning id into r;
 insert into public.cip_market_offers(run_id,company_id,sku,url,seller,offer,created_at) values(r,c,'__CLARITY_01','https://loja-evidencia.com.br/luva','Cirúrgica identificada','{"title":"Luva Medix","brand":"Medix","quote":"Luva Medix por R$ 80,00","price":80,"currency":"BRL","pack_units":1,"shipping":null,"match":{"kind":"similar","conflicts":[]}}',now()-interval '2 minutes') returning id into good;
 insert into public.cip_market_offers(run_id,company_id,sku,url,seller,offer) values(r,c,'__CLARITY_01','https://loja-evidencia.com.br/busca/luva','Vendedor não identificado','{"title":"Luva Medix","brand":"Medix","quote":"Luva Medix por R$ 10,00","price":10,"currency":"BRL","match":{"kind":"similar","conflicts":[]}}') returning id into bad;
 insert into public.cip_market_offers(run_id,company_id,sku,url,seller,offer) values(r,c,'__CLARITY_01','https://loja-evidencia.com.br/sem-trecho','Cirúrgica identificada','{"title":"Luva Medix","brand":"Medix","price":70,"currency":"BRL","match":{"kind":"similar","conflicts":[]}}') returning id into missing_quote;
 out:=public.cip_market_board_get(c,'["__CLARITY_01"]');if jsonb_array_length(out->'rows')<>1 or out->'rows'->0->>'id'<>good::text then raise exception 'incomplete_offer_leaked';end if;
 begin perform public.cip_market_review(c,missing_quote,1,'link','{"note":"Tentativa de uso de coleta sem evidência"}');raise exception 'missing_quote_promoted';exception when raise_exception then if sqlerrm<>'quality_blocked' then raise;end if;end;
 out:=public.cip_faro_get(c,'__CLARITY_01',0);if jsonb_array_length(out->'special')<>10 then raise exception 'special_read';end if;
 if has_function_privilege('anon','public.cip_faro_special_batch(text,jsonb,text,text)','execute') or has_function_privilege('anon','public.cip_market_board_get(text,jsonb)','execute') then raise exception 'anon_access';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.cip_faro_special_batch(c,skus,'Sem autorização não pode registrar','identity');raise exception 'unscoped_write';exception when raise_exception then if sqlerrm<>'director_required' then raise;end if;end;
 begin perform public.cip_market_board_get(c,skus);raise exception 'unscoped_read';exception when raise_exception then if sqlerrm<>'authorized_company_required' then raise;end if;end;
end;$$;
select true as desk_clarity_tests_passed;
rollback;
