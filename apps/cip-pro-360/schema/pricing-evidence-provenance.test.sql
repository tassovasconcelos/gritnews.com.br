-- Append to migration body without COMMIT; all checks roll back.
do $$declare d jsonb;r jsonb;first_value numeric;maximum numeric;begin
 perform set_config('request.jwt.claim.sub',(select owner_id::text from public.cip_faro_config where company_id='shopping_prohospital'),true);
 d:=public.cip_mp_desk_compare_get('shopping_prohospital','10007','1','loja',0,'capital');r:=d->'items'->0;
 if r->>'sku'<>'10007' or r->>'price' is not null or r->>'own_price_verified'<>'false' or (r->>'imported_price')::numeric<>291.83 then raise exception 'screenshot_origin_not_separated';end if;
 if r->'price_provenance'->>'file' is null or r->'price_provenance'->>'row' is null then raise exception 'source_trace_missing';end if;
 d:=public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'capital');r:=d->'items'->0;first_value:=(r->>'quantity')::numeric*(r->>'cost')::numeric;
 select max(a.quantity*a.unit_cost) into maximum from public.cip_shopping_stock_rows a where company_id='shopping_prohospital' and quantity>0 and source_hash=(select source_hash from public.cip_shopping_stock_batches where company_id='shopping_prohospital' and status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1);
 if first_value is distinct from maximum then raise exception 'priority_only_on_page';end if;
 d:=public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'capital','with');
 if exists(select 1 from jsonb_array_elements(d->'items') it where not exists(select 1 from public.cip_market_offers mo join public.cip_market_runs mr on mr.id=mo.run_id and mr.company_id=mo.company_id where mo.company_id='shopping_prohospital' and mo.sku=it->>'sku' and mo.state in('candidate','linked') and mo.created_at>=now()-interval '7 days' and cip_market_private.evidence_ready(mr.our,mr.criteria,mo.offer,mo.url,mo.seller))) then raise exception 'evidence_filter_not_applied';end if;
 begin perform public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'invalid');raise exception 'invalid_order_allowed';exception when raise_exception then if sqlerrm<>'invalid_order' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.cip_mp_desk_compare_get('shopping_prohospital');raise exception 'unscoped';exception when raise_exception then if sqlerrm<>'authorized_company_required' then raise;end if;end;
 if has_function_privilege('anon','public.cip_mp_desk_compare_get(text,text,text,text,integer,text,text)','execute') then raise exception 'anon_allowed';end if;
 end;$$;select true desk_provenance_tests_passed;rollback;
