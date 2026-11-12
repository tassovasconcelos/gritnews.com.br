-- Integration assertions. All temporary ERP fixtures are rolled back.
-- Run through an administrative SQL session; never remove BEGIN/ROLLBACK.
begin;
set local request.jwt.claims='{"sub":"1d38f383-a259-49f3-ac32-f1023227147e","role":"service_role"}';
do $$
declare code text:='test-'||gen_random_uuid()::text;r jsonb;rows jsonb;
begin
 perform set_config('proconsumo.test_code',code,true);
 r:=jsonb_build_object('source_id',code,'line_id','1','kind','purchase','occurred_on','2026-11-01',
  'source_updated_at','2026-11-01T12:00:00Z','status','posted','product_code',code,'product_name','Temporary assertion fixture',
  'base_unit','UN','supplier_code',code,'supplier_name','Temporary supplier fixture','quantity_base',10,
  'unit_cost_landed',3,'total_landed',30,'currency','BRL','cost_center_code',code);
 rows:=jsonb_build_array(r,
  r||jsonb_build_object('line_id','2','occurred_on','2026-11-02','unit_cost_landed',2,'total_landed',20),
  r||jsonb_build_object('kind','consumption','cost_center_code',code,'quantity_base',4,'unit_cost_landed',2,'total_landed',8),
  r||jsonb_build_object('kind','consumption_return','cost_center_code',code,'quantity_base',1,'unit_cost_landed',2,'total_landed',2),
  r||jsonb_build_object('kind','purchase_return','quantity_base',1,'unit_cost_landed',2,'total_landed',2));
 perform public.cp_ingest_procfit_batch('distributor',code,rows);
 perform public.cp_ingest_procfit_batch('distributor',code,rows);
 if (select count(*) from public.cp_procfit_lines where source_id=code)<>5 then raise exception 'Repeated import duplicated facts';end if;
 perform public.cp_ingest_procfit_batch('distributor',code,jsonb_build_array(r||jsonb_build_object('source_updated_at','2026-10-01T12:00:00Z','total_landed',10,'unit_cost_landed',1)));
 if (select total_landed from public.cp_procfit_lines where source_id=code and kind='purchase' and line_id='1')<>30 then raise exception 'Older import overwrote a newer fact';end if;
 begin
  perform public.cp_ingest_procfit_batch('distributor',code,jsonb_build_array(r-'currency'));
  raise exception 'Missing currency accepted';
 exception when raise_exception then
  if sqlerrm='Missing currency accepted' then raise;end if;
  if sqlerrm not like 'Linha incompleta%' then raise;end if;
 end;
end $$;
set local request.jwt.claims='{"sub":"1d38f383-a259-49f3-ac32-f1023227147e","role":"authenticated"}';
do $$
declare c public.cp_companies%rowtype;code text:=current_setting('proconsumo.test_code');p uuid;v uuid;b uuid;snapshot jsonb;po uuid;request_id uuid;
begin
 select * into c from public.cp_companies where operation_key='distributor';
 select id into p from public.cp_products where organization_id=c.organization_id and procfit_code=code;
 select id into v from public.cp_suppliers where organization_id=c.organization_id and procfit_code=code;
 insert into public.cp_requests(company_id,department_id,code,created_by)
 values(c.id,(select id from public.cp_departments where company_id=c.id limit 1),code,auth.uid()) returning id into request_id;
 begin
  update public.cp_requests set status='approved' where id=request_id;
  raise exception 'Unlinked operation released a request';
 exception when raise_exception then
  if sqlerrm='Unlinked operation released a request' or sqlerrm not like 'Vincule a conta%' then raise;end if;
 end;
 -- Buyer scope exists only inside this transaction and is rolled back below.
 insert into public.cp_memberships(organization_id,user_id,company_id,role) values(c.organization_id,auth.uid(),c.id,'buyer');
 insert into public.cp_quote_batches(company_id,title,created_by) values(c.id,'Temporary procurement assertion',auth.uid()) returning id into b;
 perform public.cp_quote_add_line(b,p,10);
 perform public.cp_quote_record_offer(b,v,p,2,1,0,0,0,7,30,null,true,'Reference: temporary assertion fixture');
 begin
  perform public.cp_propose_purchase_order(b,v);
  raise exception 'PO without formalization accepted';
 exception when raise_exception then
  if sqlerrm='PO without formalization accepted' or sqlerrm not like 'Compras deve formalizar%' then raise;end if;
 end;
 snapshot:=public.cp_formalize_quote(b,'Fornecedor único em teste controlado; validação de preço, prazo e conformidade.');
 if snapshot->'offers'->0->>'product_name' is null or snapshot->'offers'->0->>'supplier_name' is null then raise exception 'Dossier did not preserve names';end if;
 po:=public.cp_propose_purchase_order(b,v);
 if (select status from public.cp_purchase_orders where id=po)<>'pending_finance' then raise exception 'Formalization bypassed financial approval';end if;
 begin
  perform public.cp_quote_record_offer(b,v,p,1,1,0,0,0,7,30,null,true,'Changed after formalization');
  raise exception 'Formal offer changed';
 exception when raise_exception then
  if sqlerrm='Formal offer changed' or sqlerrm not like 'Proposta encerrada%' then raise;end if;
 end;
end $$;
set local role authenticated;
do $$
declare report jsonb;code text:=current_setting('proconsumo.test_code');
begin
 select public.cp_procfit_dashboard(id,'2026-11-01','2026-11-12',code) into report from public.cp_companies where operation_key='distributor';
 if (report->>'consumed')::numeric<>6 then raise exception 'Consumption/returns not netted correctly';end if;
 if (report->>'purchased')::numeric<>48 then raise exception 'Purchase returns not netted';end if;
 if (report->>'baseline_total')::numeric<>30 or (report->>'comparable_total')::numeric<>20 then raise exception 'Price baseline/quantity comparison incorrect';end if;
 if jsonb_array_length(report->'products')<>1 then raise exception 'ABC lost the product';end if;
 select public.cp_procfit_dashboard(id,'2026-11-01','2026-11-12',code) into report from public.cp_companies where operation_key='retail';
 if (report->>'lines')::int<>0 then raise exception 'Distributor facts leaked into retail';end if;
 if has_function_privilege('authenticated','public.cp_ingest_procfit_batch(text,text,jsonb)','execute') then raise exception 'Browser can import ERP facts';end if;
end $$;
set local role anon;
do $$ begin
 if has_function_privilege('anon','public.cp_procfit_dashboard(uuid,date,date,text)','execute') then raise exception 'Anonymous access to dashboard';end if;
end $$;
rollback;
