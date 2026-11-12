begin;
do $$declare d jsonb;q jsonb;k jsonb;it jsonb;begin
 perform set_config('request.jwt.claim.sub',(select owner_id::text from public.cip_faro_config where company_id='shopping_prohospital'),true);
 d:=public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'capital','all');
 q:=public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'quantity','all');
 k:=public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'cost','all');
 if d->'items'->0->>'sku'=q->'items'->0->>'sku' or d->'items'->0->>'sku'=k->'items'->0->>'sku' then raise exception 'sorts_did_not_change_first_result';end if;
 d:=public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'capital','with');
 if jsonb_array_length(d->'items')=0 then raise exception 'expected_live_evidence_fixture';end if;
 for it in select value from jsonb_array_elements(d->'items') loop
  if not exists(select 1 from jsonb_array_elements(d->'market_rows') x where x->>'company_id'='shopping_prohospital' and x->>'sku'=it->>'sku' and length(x->>'seller')>2 and x->>'url' like 'https://%' and (x->'offer'->'quality'->>'basic_eligible')::boolean) then raise exception 'filtered_item_without_delivered_scoped_evidence';end if;
 end loop;
 q:=public.cip_mp_desk_compare_get('shopping_prohospital','','','loja',0,'capital','without');
 if jsonb_array_length(q->'market_rows')<>0 then raise exception 'without_filter_contains_evidence';end if;
 if (d->>'total')::integer+(q->>'total')::integer<>(k->>'total')::integer then raise exception 'evidence_partition_mismatch';end if;
 if has_function_privilege('anon','public.cip_mp_desk_compare_get(text,text,text,text,integer,text,text)','execute') then raise exception 'anonymous_access';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.cip_market_board_get('shopping_prohospital','["139681"]'::jsonb);raise exception 'foreign_company_allowed';exception when raise_exception then if sqlerrm<>'authorized_company_required' then raise;end if;end;
end;$$;
select true as delivery_and_filter_tests_passed;
rollback;
