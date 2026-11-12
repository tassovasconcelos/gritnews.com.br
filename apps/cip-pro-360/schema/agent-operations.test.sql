-- Run only in a transaction and always roll back. No fixtures or approval survives.
update public.cip_stock_intelligence_batches set status='retired' where status='active';
insert into public.cip_stock_intelligence_batches(id,company_id,as_of,sources,summary,status) values(repeat('b',64),'shopping_prohospital',(now() at time zone 'America/Sao_Paulo')::date-2,'{}','{}','active'),(repeat('c',64),'distribuidora_prohospital',(now() at time zone 'America/Sao_Paulo')::date-2,'{}','{}','active');
select cip_agent_private.tick();
do $$declare n integer;begin
 if (select count(*) from public.cip_agent_cycles)<>2 then raise exception 'initial_cycles';end if;
 if exists(select 1 from public.cip_agent_cycles where jsonb_array_length(report->'agents')<>case company_id when 'shopping_prohospital' then 13 else 14 end) then raise exception 'company_agent_scope';end if;
 if (select count(*) from public.cip_agent_missions)<>2 then raise exception 'stale_refresh_missions';end if;
 perform cip_agent_private.tick();if (select count(*) from public.cip_agent_cycles)<>2 then raise exception 'scheduler_dedup';end if;
 -- Future/old sources fail closed. A fresh synthetic batch exercises actual candidate allocation.
 insert into public.cip_stock_intelligence_batches(id,company_id,as_of,sources,summary,status) values(repeat('d',64),'shopping_prohospital',(now() at time zone 'America/Sao_Paulo')::date,'{}','{"notice":"SYNTHETIC QA ROLLBACK"}','active');
 for n in 1..7 loop
 insert into public.cip_stock_actions(action_id,batch_id,company_id,kind,source_store,sku,description,quantity_limit,priority,payload)
 values(repeat('a',63)||n::text,repeat('d',64),'shopping_prohospital',(array['conferencia','preco','campanha','redistribuicao'])[1+(n%4)],'1','QA'||n,'SYNTHETIC QA ROLLBACK',10,999,'{}');
 end loop;
 update public.cip_agent_controls set last_run_at=now()-interval '7 hours' where company_id='shopping_prohospital';
 perform cip_agent_private.run_cycle('shopping_prohospital','scheduled');
 if (select count(*) from public.cip_agent_missions where source_action is not null)<>5 then raise exception 'mission_limit';end if;
 update public.cip_agent_controls set last_run_at=now()-interval '7 hours' where company_id='shopping_prohospital';
 perform cip_agent_private.run_cycle('shopping_prohospital','scheduled');
 if (select count(*) from public.cip_agent_missions where source_action is not null)<>7 then raise exception 'next_candidates_not_duplicates';end if;
 update public.cip_agent_controls set enabled=false,last_run_at=now()-interval '7 hours' where company_id='shopping_prohospital';
 if cip_agent_private.run_cycle('shopping_prohospital','manual')->>'skipped'<>'paused' then raise exception 'pause';end if;
 update public.cip_agent_controls set enabled=true where company_id='shopping_prohospital';
end;$$;
select set_config('request.jwt.claim.sub',(select user_id::text from public.cip_profiles where role='superadm' and active limit 1),true);
set local role authenticated;
do $$declare m public.cip_agent_missions;cfg public.cip_agent_controls;r jsonb;begin
 select * into m from public.cip_agent_missions where company_id='shopping_prohospital' and source_action is not null limit 1;
 begin perform public.cip_agent_command('distribuidora_prohospital','mission',jsonb_build_object('id',m.id,'version',m.version,'state','dismissed','note','QA wrong company must fail'));raise exception 'cross_company_accepted';exception when others then if sqlerrm<>'version_changed' then raise;end if;end;
 begin perform public.cip_agent_command(m.company_id,'mission',jsonb_build_object('id',m.id,'version',m.version,'state','accepted','note','QA missing goal must fail'));raise exception 'missing_goal_accepted';exception when others then if sqlerrm<>'goal_required' then raise;end if;end;
 perform public.cip_agent_command(m.company_id,'mission',jsonb_build_object('id',m.id,'version',m.version,'state','accepted','note','Synthetic QA target assigned','owner_name','QA owner','due_date',current_date+1,'metric','itens_conferidos','target',10));
 begin perform public.cip_agent_command(m.company_id,'mission',jsonb_build_object('id',m.id,'version',m.version,'state','dismissed','note','QA stale version must fail'));raise exception 'stale_version_accepted';exception when others then if sqlerrm<>'version_changed' then raise;end if;end;
 perform public.cip_agent_command(m.company_id,'mission',jsonb_build_object('id',m.id,'version',m.version+1,'state','in_progress','note','Synthetic QA followup started'));
 begin perform public.cip_agent_command(m.company_id,'mission',jsonb_build_object('id',m.id,'version',m.version+2,'state','measured','note','Synthetic QA evidence record','observed',-1,'lesson','Synthetic QA lesson for review.'));raise exception 'negative_result_accepted';exception when others then if sqlerrm<>'result_required' then raise;end if;end;
 perform public.cip_agent_command(m.company_id,'mission',jsonb_build_object('id',m.id,'version',m.version+2,'state','measured','note','Synthetic QA evidence record','observed',8,'lesson','Synthetic QA lesson for review.'));
 perform public.cip_agent_command(m.company_id,'mission',jsonb_build_object('id',m.id,'version',m.version+3,'state','review','review_state','approved','note','Synthetic QA reviewed against reference.'));
 if not exists(select 1 from public.cip_agent_missions where id=m.id and state='measured' and review_state='approved' and observed=8) then raise exception 'measurement_review';end if;
 if has_table_privilege(current_user,'public.cip_agent_missions','UPDATE') then raise exception 'direct_writes_granted';end if;
 if has_function_privilege(current_user,'cip_agent_private.run_cycle(text,text,uuid)','EXECUTE') then raise exception 'internal_runtime_exposed';end if;
 select * into cfg from public.cip_agent_controls where company_id=m.company_id;
 perform public.cip_agent_command(m.company_id,'configure',jsonb_build_object('version',cfg.version,'enabled',false,'objective','Synthetic QA objective for tests.','interval_minutes',360,'mission_limit',5));
 if (select enabled from public.cip_agent_controls where company_id=m.company_id) then raise exception 'configure_pause';end if;
end;$$;
-- Authenticated stranger sees zero rows and cannot command any tenant.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$begin
 if exists(select 1 from public.cip_agent_cycles) or exists(select 1 from public.cip_agent_missions) or exists(select 1 from public.cip_agent_controls) then raise exception 'rls_leak';end if;
 begin perform public.cip_agent_command('shopping_prohospital','run');raise exception 'stranger_command';exception when others then if sqlerrm<>'manager_required' then raise;end if;end;
end;$$;
reset role;
select jsonb_build_object('ok',true,'assertions','cadence, scope, stale gate, candidate limit, dedup, pause, transition, goal, evidence, measurement, version, RLS, private executor') as qa;
