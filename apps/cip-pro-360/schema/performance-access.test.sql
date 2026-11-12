-- Real PostgreSQL/RLS tests. All fixtures and audit rows are rolled back.
begin;
do $$
declare a uuid:=gen_random_uuid(); d uuid:=gen_random_uuid(); g uuid:=gen_random_uuid();
 f uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); e uuid:=gen_random_uuid();
begin
 insert into auth.users(id) values(a),(d),(g),(f),(b),(o);
 insert into public.cip_profiles(user_id,role,active) values
 (a,'superadm',true),(d,'diretoria',true),(g,'gestor',true),(f,'diretoria',true),(b,'diretoria',true),(o,'leitura',true)
 on conflict(user_id) do update set role=excluded.role,active=true;
 insert into public.cip_memberships(user_id,company_id,role,active) values
 (d,'shopping_prohospital','diretoria',true),(g,'shopping_prohospital','gestor',true),
 (f,'shopping_prohospital','diretoria',true),(b,'shopping_prohospital','diretoria',true);
 insert into public.cip_perf_reviewers(user_id,company_id,review_role) values
 (a,'shopping_prohospital','controladoria'),(f,'shopping_prohospital','controladoria'),(b,'shopping_prohospital','diretoria');
 perform set_config('request.jwt.claim.sub',a::text,true);
 execute 'set local role authenticated';
 if not public.cip_perf_can_submit('shopping_prohospital') or public.cip_perf_can_read('unrelated_company') then raise exception 'superadm scope'; end if;
 insert into public.cip_perf_financial_events(id,company_id,source_key,period_start,period_end,benefit_type,description,gross_value,evidence,cip_action_ref,baseline_reference,attribution_pct)
 values(e,'shopping_prohospital','QA:PERF:ORIGIN','2026-11-01','2026-11-30','margem_incremental','Fixture transacional, nunca realizado',100,'Fixture de teste revertido','QA:ACTION:1','Baseline de fixture revertida',100);
 begin
 insert into public.cip_perf_financial_events(company_id,source_key,period_start,period_end,benefit_type,description,gross_value,evidence,cip_action_ref,baseline_reference,attribution_pct)
 values('distribuidora_prohospital',' qa:perf:origin ','2026-11-01','2026-11-30','despesa_reduzida','Duplicidade deve falhar',100,'Fixture de teste revertido','QA:ACTION:1','Baseline de fixture revertida',100);
 raise exception 'canonical origin accepted';
 exception when unique_violation then null; end;
 begin
 insert into public.cip_perf_financial_approvals(event_id,company_id,review_role,decision,evidence_note)
 values(e,'shopping_prohospital','controladoria','aprovado','Autoaprovacao deve falhar');
 raise exception 'self approval accepted'; exception when insufficient_privilege then null; end;
 begin
 insert into public.cip_perf_kpi_records(company_id,metric_code,period_start,period_end,baseline,target,actual,source_kind,evidence)
 values('shopping_prohospital','crescimento_vendas','2026-11-01','2026-11-30',0,10,5,'erp_conciliado','Fonte nao pode ser autodeclarada');
 raise exception 'certification spoof accepted'; exception when insufficient_privilege then null; end;
 begin
 insert into public.cip_perf_reviewers(user_id,company_id,review_role) values(a,'distribuidora_prohospital','diretoria');
 raise exception 'self assignment accepted'; exception when insufficient_privilege then null; end;
 execute 'reset role';
 if not exists(select 1 from public.cip_audit where record_id=e::text and actor_id=a) then raise exception 'missing audit'; end if;
 perform set_config('request.jwt.claim.sub',d::text,true);
 execute 'set local role authenticated';
 if not public.cip_perf_can_submit('shopping_prohospital') or public.cip_perf_can_read('distribuidora_prohospital') then raise exception 'director scope'; end if;
 insert into public.cip_perf_kpi_records(company_id,metric_code,period_start,period_end,baseline,target,actual,evidence)
 values('shopping_prohospital','crescimento_vendas','2026-11-01','2026-11-30',0,10,5,'Fixture de teste revertido');
 begin
 insert into public.cip_perf_kpi_records(company_id,metric_code,period_start,period_end,baseline,target,actual,evidence)
 values('distribuidora_prohospital','crescimento_vendas','2026-11-01','2026-11-30',0,10,5,'Fixture de teste revertido');
 raise exception 'cross company insert accepted'; exception when insufficient_privilege then null; end;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',g::text,true);
 execute 'set local role authenticated';
 if not public.cip_perf_can_read('shopping_prohospital') or public.cip_perf_can_submit('shopping_prohospital') then raise exception 'manager rights'; end if;
 begin
 insert into public.cip_perf_financial_events(company_id,source_key,period_start,period_end,benefit_type,description,gross_value,evidence,cip_action_ref,baseline_reference,attribution_pct)
 values('shopping_prohospital','QA:GESTOR:FAIL','2026-11-01','2026-11-30','despesa_reduzida','Gestor nao pode lancar',100,'Fixture de teste revertido','QA:ACTION:1','Baseline de fixture revertida',100);
 raise exception 'manager insert accepted'; exception when insufficient_privilege then null; end;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',f::text,true);
 execute 'set local role authenticated';
 insert into public.cip_perf_financial_approvals(event_id,company_id,review_role,decision,evidence_note)
 values(e,'shopping_prohospital','controladoria','aprovado','Parecer de fixture revertido');
 begin
 insert into public.cip_perf_financial_approvals(event_id,company_id,review_role,decision,evidence_note)
 values(e,'shopping_prohospital','diretoria','aprovado','Mesma pessoa deve falhar');
 raise exception 'same person approved twice'; exception when insufficient_privilege or unique_violation then null; end;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',b::text,true);
 execute 'set local role authenticated';
 insert into public.cip_perf_financial_approvals(event_id,company_id,review_role,decision,evidence_note)
 values(e,'shopping_prohospital','diretoria','aprovado','Parecer de fixture revertido');
 if (select count(*) from public.cip_perf_financial_approvals where event_id=e)<>2 then raise exception 'independent reviews missing'; end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',o::text,true);
 execute 'set local role authenticated';
 if exists(select 1 from public.cip_perf_financial_events) then raise exception 'unauthorized rows visible'; end if;
 execute 'reset role';
 execute 'set local role anon';
 begin perform count(*) from public.cip_perf_financial_events;
 raise exception 'anon read allowed'; exception when insufficient_privilege then null; end;
 execute 'reset role';
end $$;
rollback;
select 'Performance RLS assertions passed; all fixtures rolled back' as result;
