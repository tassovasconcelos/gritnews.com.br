-- Database integration test. All business writes are rolled back.
begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.admin_users where active and role='superadmin' limit 1),true);
set local role authenticated;
do $$
declare v_org uuid:=gen_random_uuid();v_other uuid:=gen_random_uuid();v_result jsonb;v_detail jsonb;v_product uuid;v_store uuid;v_failed boolean;v_rows jsonb;
begin
  perform public.srp_admin_console('create',null,jsonb_build_object('request_id',v_org,'name','QA rollback console','slug','qa-'||v_org,'email','qa@example.invalid'));
  v_result:=public.srp_admin_console('create',null,jsonb_build_object('request_id',v_org,'name','QA rollback console','slug','qa-'||v_org));
  if not (v_result->>'reused')::boolean then raise exception 'Create retry was not idempotent'; end if;
  v_rows:='[{"name":"Pão teste","unit":"UN","sale_price":0.8,"category":"Pães","external_key":"qa-bread","fulfillment":"pronta_entrega","active":false},{"name":"Mini empada teste","unit":"CAIXA","sale_price":70,"category":"Encomendas","external_key":"qa-pie","fulfillment":"encomenda","catalog_notes":"100 unidades","active":false}]'::jsonb;
  v_result:=public.srp_admin_console('import',v_org,jsonb_build_object('rows',v_rows));
  if (v_result->>'inserted')::int<>2 then raise exception 'Initial import failed'; end if;
  v_result:=public.srp_admin_console('import',v_org,jsonb_build_object('rows',v_rows));
  if (v_result->>'inserted')::int<>0 or (v_result->>'updated')::int<>2 then raise exception 'Repeated import duplicated products'; end if;
  v_detail:=public.srp_admin_console('detail',v_org,'{}');
  if jsonb_array_length(v_detail->'products')<>2 or v_detail->'organization'->>'environment'<>'homologation' then raise exception 'Detail or environment invalid';end if;
  v_store:=(v_detail->'stores'->0->>'id')::uuid;v_product:=(v_detail->'products'->0->>'id')::uuid;
  perform public.srp_admin_console('inventory',v_org,jsonb_build_object('store_id',v_store,'product_id',v_product,'quantity',12,'minimum_quantity',2,'reason','Contagem QA rollback'));
  v_detail:=public.srp_admin_console('detail',v_org,'{}');
  if (v_detail->'inventory'->0->>'quantity')::numeric<>12 then raise exception 'Inventory not persisted';end if;
  v_failed:=false;
  begin perform public.srp_admin_console('inventory',v_org,jsonb_build_object('store_id',v_store,'product_id',v_product,'quantity',-1,'minimum_quantity',0,'reason','QA invalid'));exception when others then v_failed:=true;end;
  if not v_failed then raise exception 'Negative inventory accepted';end if;
  perform public.srp_admin_console('create',null,jsonb_build_object('request_id',v_other,'name','Other QA tenant','slug','qa-'||v_other));
  v_failed:=false;
  begin perform public.srp_admin_console('inventory',v_other,jsonb_build_object('store_id',v_store,'product_id',v_product,'quantity',1,'minimum_quantity',0,'reason','Cross tenant test'));exception when others then v_failed:=true;end;
  if not v_failed then raise exception 'Cross tenant stock reference accepted';end if;
  v_failed:=false;
  begin perform public.srp_admin_console('import',v_org,'{"rows":[{"name":"Invalid","unit":"UN","sale_price":-1}]}');exception when others then v_failed:=true;end;
  if not v_failed then raise exception 'Negative price accepted';end if;
  perform public.srp_admin_console('access',v_org,'{"mode":"suspended","reason":"QA suspension rollback"}');
  v_detail:=public.srp_admin_console('detail',v_org,'{}');
  if v_detail->'access'->>'access_mode'<>'suspended' then raise exception 'Suspension failed';end if;
  if jsonb_array_length(v_detail->'events')<5 then raise exception 'Audit events missing';end if;
  perform set_config('srp.qa_result','PASS: create retry, detail, import twice, stock adjustment, negative stock, cross-tenant references, negative price, access suspension, audit',true);
end $$;
select current_setting('srp.qa_result') as test_result;
rollback;

begin;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$declare denied boolean:=false;begin
  begin perform public.srp_admin_console('list',null,'{}');exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'Non-admin could call console';end if;
end $$;
select 'PASS: non-admin RPC denied' as test_result;
rollback;
