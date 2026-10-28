-- Append after the new schema inside one transaction and ALWAYS ROLLBACK.
do $$
declare actor uuid;c text:='shopping_prohospital';item jsonb;r jsonb;rid uuid;oid uuid;ref uuid;checks jsonb;review jsonb;x integer;
begin
 select user_id into actor from public.cip_profiles where role='superadm' and active limit 1;
 if actor is null then raise exception 'test_admin_missing';end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 select a into item from jsonb_array_elements(public.cip_mp_desk_get(c,'','','marketplace',0)->'items')a where length(a->>'unit')>0 limit 1;
 if item is null then raise exception 'test_source_missing';end if;
 r:=public.cip_market_start(c,item->>'sku',item->>'store_code','{"brand":"Auditoria sintética"}','["medjet.com.br"]','identity');rid:=(r->>'id')::uuid;
 begin perform public.cip_market_start(c,item->>'sku',item->>'store_code','{}','["medjet.com.br"]','identity');raise exception 'duplicate_search_allowed';exception when raise_exception then if sqlerrm<>'search_in_progress' then raise;end if;end;
 perform public.cip_market_finish(rid,jsonb_build_array(jsonb_build_object('url','https://medjet.com.br/cip-audit-fixture','title','Oferta sintética de teste','seller','Auditoria sintética','platform','medjet.com.br','quote','Teste sintético R$ 100,00','price',100,'shipping',20,'pack_units',10,'currency','BRL','match',jsonb_build_object('kind','similar','conflicts','[]'::jsonb,'pending','[]'::jsonb,'score',50,'certified',false))),'{}',false);
 select id into oid from public.cip_market_offers where run_id=rid;
 begin perform public.cip_market_review(c,oid,1,'link','{"note":"Teste sem as conferências necessárias"}');raise exception 'unchecked_reference_allowed';exception when raise_exception then if sqlerrm<>'checks_required' then raise;end if;end;
 checks:='{"product":true,"packaging":true,"price":true,"shipping":true,"stock":true,"terms":true,"replace_previous":true}';
 review:=jsonb_build_object('note','Auditoria sintética, sem alteração real: produto e condições conferidos','price',100,'shipping',20,'equivalent_units',10,'channel','marketplace','checks',checks);
 r:=public.cip_market_review(c,oid,1,'link',review);ref:=(r->>'reference_id')::uuid;
 if ref is null or (select normalized_price from public.cip_mp_market_refs where id=ref)<>12 then raise exception 'reference_normalization';end if;
 if (select state from public.cip_market_offers where id=oid)<>'linked' then raise exception 'missing_depara';end if;
 begin perform public.cip_market_review(c,oid,1,'link',review);raise exception 'repeated_review_allowed';exception when raise_exception then if sqlerrm<>'offer_changed' then raise;end if;end;
 -- A later collection of the same offer replaces the linked reference, not its immutable evidence.
 r:=public.cip_market_start(c,item->>'sku',item->>'store_code','{}','["medjet.com.br"]','identity');rid:=(r->>'id')::uuid;
 perform public.cip_market_finish(rid,jsonb_build_array(jsonb_build_object('url','https://medjet.com.br/cip-audit-fixture','seller','Auditoria sintética','platform','medjet.com.br','currency','BRL','match',jsonb_build_object('kind','similar','conflicts','[]'::jsonb))),'{}',false);
 select id into oid from public.cip_market_offers where run_id=rid;
 perform public.cip_market_review(c,oid,1,'link',review);
 if (select active from public.cip_mp_market_refs where id=ref) then raise exception 'old_price_still_active';end if;
 r:=public.cip_market_start(c,item->>'sku',item->>'store_code','{}','["medjet.com.br"]','identity');rid:=(r->>'id')::uuid;
 perform public.cip_market_finish(rid,jsonb_build_array(jsonb_build_object('url','https://medjet.com.br/cip-audit-other','seller','Auditoria sintética','platform','medjet.com.br','currency','BRL','match',jsonb_build_object('kind','incompatible','conflicts',jsonb_build_array('Modelo diferente')))),'{}',false);
 select id into oid from public.cip_market_offers where run_id=rid;
 begin perform public.cip_market_review(c,oid,1,'link',review);raise exception 'conflict_promoted';exception when raise_exception then if sqlerrm<>'comparison_blocked' then raise;end if;end;
 perform public.cip_market_review(c,oid,1,'alternative',jsonb_build_object('note','Guardar alternativa sintética para análise de mix'));
 for x in 4..10 loop r:=public.cip_market_start(c,item->>'sku',item->>'store_code','{}','["medjet.com.br"]','identity');perform public.cip_market_finish((r->>'id')::uuid,'[]','{"error":"synthetic"}',true);end loop;
 begin perform public.cip_market_start(c,item->>'sku',item->>'store_code','{}','["medjet.com.br"]','identity');raise exception 'quota_exceeded';exception when raise_exception then if sqlerrm<>'daily_limit' then raise;end if;end;
 if has_function_privilege('authenticated','public.cip_market_finish(uuid,jsonb,jsonb,boolean)','execute') or has_table_privilege('authenticated','public.cip_market_offers','insert') or has_table_privilege('anon','public.cip_market_runs','select') then raise exception 'privilege_leak';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
 execute 'set local role authenticated';
 if (select count(*) from public.cip_market_offers)>0 then raise exception 'rls_leak';end if;
 begin perform public.cip_market_get(c,'');raise exception 'unscoped_read_allowed';exception when raise_exception then if sqlerrm<>'authorized_company_required' then raise;end if;end;
 execute 'reset role';
end;$$;
select true as passed;
rollback;
