-- SMOKE TESTS: run ONLY against dedicated staging/new database.
-- All data is in a single transaction rolled back at the end.
begin;
do $smoke$
declare
 v_org uuid; v_company uuid; v_department uuid; v_product uuid; v_warehouse uuid;
 v_req uuid; v_repeat uuid; v_invoice uuid; v_status text; v_physical numeric; v_reserved numeric;
 v_admin uuid:='aaa00000-0000-4000-8000-000000000001';
 v_requester uuid:='aaa00000-0000-4000-8000-000000000002';
 v_manager uuid:='aaa00000-0000-4000-8000-000000000003';
 v_finance uuid:='aaa00000-0000-4000-8000-000000000004';
 v_warehouse_user uuid:='aaa00000-0000-4000-8000-000000000005';
 v_key uuid:='abc00000-0000-4000-8000-000000000001';
begin
 select o.id,c.id,d.id into strict v_org,v_company,v_department
 from public.cp_organizations o join public.cp_companies c on c.organization_id=o.id
 join public.cp_departments d on d.company_id=c.id
 where o.name='Grupo Prohospital' and c.name='Prohospital' and d.name='Administrativo';
 insert into auth.users(id,email,aud,role,created_at,updated_at) values
 (v_admin,'qa-admin@invalid.example','authenticated','authenticated',now(),now()),
 (v_requester,'qa-requester@invalid.example','authenticated','authenticated',now(),now()),
 (v_manager,'qa-manager@invalid.example','authenticated','authenticated',now(),now()),
 (v_finance,'qa-finance@invalid.example','authenticated','authenticated',now(),now()),
 (v_warehouse_user,'qa-warehouse@invalid.example','authenticated','authenticated',now(),now());
 insert into public.cp_memberships(organization_id,user_id,company_id,department_id,role)
 values (v_org,v_admin,null,null,'group_admin'),
 (v_org,v_requester,v_company,v_department,'requester'),
 (v_org,v_manager,v_company,v_department,'manager'),
 (v_org,v_finance,v_company,null,'finance'),
 (v_org,v_warehouse_user,v_company,null,'warehouse');
 insert into public.cp_products(organization_id,sku,name,unit,min_stock)
 values(v_org,'QA-A4-TEST','Resma A4 QA','RESMA',3) returning id into v_product;
 insert into public.cp_warehouses(company_id,name)
 values(v_company,'QA Almoxarifado temporário') returning id into v_warehouse;
 perform pg_catalog.set_config('request.jwt.claim.sub',v_admin::text,true);
 perform public.cp_open_stock(v_company,v_warehouse,v_product,10,25,'QA: lançamento fictício reversível');
 perform pg_catalog.set_config('request.jwt.claim.sub',v_requester::text,true);
 v_req:=public.cp_submit_request_once(v_company,v_department,
 jsonb_build_array(jsonb_build_object('product_id',v_product,'quantity',2)),v_key);
 v_repeat:=public.cp_submit_request_once(v_company,v_department,
 jsonb_build_array(jsonb_build_object('product_id',v_product,'quantity',2)),v_key);
 if v_req is null or v_req<>v_repeat then raise exception 'FAIL: idempotência de solicitação'; end if;
 if (select count(*) from public.cp_requests where id=v_req)<>1 then raise exception 'FAIL: requisição duplicada'; end if;
 -- Same applicant may never approve.
 begin
  perform public.cp_approve_request(v_req,true,null);
  raise exception 'FAIL: autoaprovação gerencial permitida';
 exception when others then
  if sqlerrm='FAIL: autoaprovação gerencial permitida' then raise; end if;
 end;
 perform pg_catalog.set_config('request.jwt.claim.sub',v_manager::text,true);
 v_status:=public.cp_approve_request(v_req,true,null);
 if v_status<>'pending_finance' then raise exception 'FAIL: deveria requerer financeiro, status %',v_status; end if;
 perform pg_catalog.set_config('request.jwt.claim.sub',v_finance::text,true);
 v_status:=public.cp_finance_decision(v_req,true,'Teste financeiro');
 if v_status<>'approved' then raise exception 'FAIL: aprovação financeira'; end if;
 perform pg_catalog.set_config('request.jwt.claim.sub',v_warehouse_user::text,true);
 perform public.cp_reserve_request(v_req,v_warehouse);
 select physical,reserved into strict v_physical,v_reserved from public.cp_stock
 where warehouse_id=v_warehouse and product_id=v_product;
 if v_physical<>10 or v_reserved<>2 then raise exception 'FAIL: reserva física %, %',v_physical,v_reserved; end if;
 perform public.cp_deliver_request(v_req,'Recebedor QA');
 select physical,reserved into strict v_physical,v_reserved from public.cp_stock
 where warehouse_id=v_warehouse and product_id=v_product;
 if v_physical<>8 or v_reserved<>0 then raise exception 'FAIL: baixa física %, %',v_physical,v_reserved; end if;
 if not exists(select 1 from public.cp_stock_events where request_id=v_req
 and event_type='delivery' and quantity_change=-2 and unit_cost=25)
 then raise exception 'FAIL: evento de consumo/custo'; end if;
 begin
  perform public.cp_deliver_request(v_req,'Duplicado');
  raise exception 'FAIL: entrega duplicada permitida';
 exception when others then
  if sqlerrm='FAIL: entrega duplicada permitida' then raise; end if;
 end;
 v_invoice:=public.cp_import_invoice(v_company,'Fornecedor QA','00000000000000',
 '12345678901234567890123456789012345678901234','10','1',now(),'xml',
 jsonb_build_array(jsonb_build_object('description','Resma A4 QA','unit','RESMA','quantity',3,
 'unit_price',21,'product_id',v_product,'conversion_factor',1)));
 if v_invoice is null then raise exception 'FAIL: não importou XML de teste'; end if;
 begin
  perform public.cp_import_invoice(v_company,'Fornecedor QA','00000000000000',
  '12345678901234567890123456789012345678901234','10','1',now(),'xml',
  jsonb_build_array(jsonb_build_object('description','Resma A4 QA','unit','RESMA','quantity',3,
  'unit_price',21,'product_id',v_product,'conversion_factor',1)));
  raise exception 'FAIL: NF duplicada permitida';
 exception when others then
  if sqlerrm='FAIL: NF duplicada permitida' then raise; end if;
 end;
 -- Even a PDF/manual upload lacking XML key cannot clone an existing NF.
 begin
  perform public.cp_import_invoice(v_company,'Fornecedor QA','00000000000000',
   null,'10','1',now(),'pdf',
   jsonb_build_array(jsonb_build_object('description','Resma A4 QA','unit','RESMA',
   'quantity',3,'unit_price',21)));
  raise exception 'FAIL: XML/PDF duplicate permitted';
 exception when others then
  if sqlerrm='FAIL: XML/PDF duplicate permitted' then raise; end if;
 end;
 -- No membership may use company/sector functions even if knows UUIDs.
 perform pg_catalog.set_config('request.jwt.claim.sub','abc00000-0000-4000-8000-000000000099',true);
 if private.cp_company_access(v_company) or private.cp_department_access(v_department)
 then raise exception 'FAIL: escopo externo permitido'; end if;
 begin
  perform public.cp_submit_request_once(v_company,v_department,
  jsonb_build_array(jsonb_build_object('product_id',v_product,'quantity',1)),
  'abc00000-0000-4000-8000-000000000002'::uuid);
  raise exception 'FAIL: solicitante externo permitido';
 exception when others then
  if sqlerrm='FAIL: solicitante externo permitido' then raise; end if;
 end;
 raise notice 'PASS: 10 -> 2 -> 8, aprovações, auditoria, NF duplicada, isolamento e idempotência';
end $smoke$;
rollback;
select 'PASS (QA transaction rolled back, no fictitious operational data retained)' as result;
