-- Execute after schema inside a transaction, followed by rollback. No fixture survives.
-- Create one synthetic, approved source and policy only for transactional testing.
insert into public.cip_erp_snapshots(company_id,source_name,source_hash,captured_at,payload,metadata,summary,status,created_by)
select 'shopping_prohospital','SYNTHETIC QA · ROLLBACK',repeat('e',64),now(),'{"data":{"products":[{"sku":"QA-MP","description":"Synthetic item","unit":"UN"}],"inventory":[{"sku":"QA-MP","store_id":"QA1","quantity":"10","stock_value":"500"}],"prices":[{"sku":"QA-MP","store_id":"QA1","current_price":"100"}]} }','{"scope":"company_all"}','{}','approved',user_id from public.cip_profiles where active and role='superadm' limit 1;
insert into public.cip_mp_campaign_policies(company_id,version,rules,created_by) select 'shopping_prohospital',coalesce((select max(version) from public.cip_mp_campaign_policies where company_id='shopping_prohospital'),0)+1,'{"minimum_margin_pct":20,"target_margin_pct":30,"max_change_pct":50,"campaign_days_max":30,"supplier_funding_per_unit":0,"bonus_tiers":[]}',user_id from public.cip_profiles where active and role='superadm' limit 1;
select set_config('request.jwt.claim.sub',(select user_id::text from public.cip_profiles where role='superadm' and active limit 1),true);
set local role authenticated;
do $$declare r jsonb;p jsonb;d jsonb;id uuid;rid uuid;version integer;begin
 r:=public.cip_mp_desk_command('shopping_prohospital','reference',jsonb_build_object('sku','QA-MP','competitor','Synthetic QA market','our_unit','UN','pack_price',180,'shipping',0,'equivalent_units',2,'channel','loja','conditions','Synthetic equivalent offer, test only.','source_url','https://example.org/qa','observed_on',(now() at time zone 'America/Sao_Paulo')::date,'equivalent',true,'availability','available'));rid:=(r->>'id')::uuid;
 if (select normalized_price from public.cip_mp_market_refs r where r.id=rid)<>90 then raise exception 'normalization';end if;
 d:=jsonb_build_object('sku','QA-MP','store_code','QA1','our_unit','UN','destination','procfit','channel','loja','price_table','QA-VAREJO','owner_name','Synthetic QA operator','start_local',to_char((now() at time zone 'America/Sao_Paulo')+interval '1 hour','YYYY-MM-DD"T"HH24:MI'),'end_local',to_char((now() at time zone 'America/Sao_Paulo')+interval '2 hours','YYYY-MM-DD"T"HH24:MI'),'reference_id',rid,'expense_pct',10,'fixed_cost',0,'new_price',90,'reason','Synthetic QA price test, rollback only.','strategy','competitive');
 p:=public.cip_mp_desk_command('shopping_prohospital','draft',d);id:=(p->>'id')::uuid;
 if jsonb_array_length(p->'analysis'->'issues')<>0 then raise exception 'unexpected_blockers: %',p->'analysis';end if;
 if abs((p->'analysis'->>'floor')::numeric-71.43)>0.001 then raise exception 'floor_math';end if;
 begin perform public.cip_mp_desk_command('distribuidora_prohospital','approve',jsonb_build_object('id',id,'version',1,'note','Synthetic QA wrong company.'));raise exception 'cross_company_approved';exception when others then if sqlerrm<>'version_changed' then raise;end if;end;
 begin perform public.cip_mp_desk_command('shopping_prohospital','approve',jsonb_build_object('id',id,'version',1,'note','Synthetic QA no confirmations.'));raise exception 'unchecked_approved';exception when others then if sqlerrm<>'checks_required' then raise;end if;end;
 p:=public.cip_mp_desk_command('shopping_prohospital','approve',jsonb_build_object('id',id,'version',1,'note','Synthetic QA checked destination and economics.','checks','{"destination_verified":true,"expenses_verified":true,"stock_verified":true}'::jsonb));
 if p->>'state'<>'scheduled' then raise exception 'schedule_state';end if;
 begin perform public.cip_mp_desk_command('shopping_prohospital','cancel',jsonb_build_object('id',id,'version',1,'note','Synthetic QA stale version.'));raise exception 'stale_version_accepted';exception when others then if sqlerrm<>'version_changed' then raise;end if;end;
 p:=public.cip_mp_desk_command('shopping_prohospital','draft',d||'{"price_table":"qa-varejo"}');
 begin perform public.cip_mp_desk_command('shopping_prohospital','approve',jsonb_build_object('id',p->>'id','version',1,'note','Synthetic QA overlap must fail.','checks','{"destination_verified":true,"expenses_verified":true,"stock_verified":true}'::jsonb));raise exception 'overlap_accepted';exception when others then if sqlerrm<>'overlapping_schedule' then raise;end if;end;
 -- Numeric text/non-finite values cannot enter the economic calculations.
 begin perform public.cip_mp_desk_command('shopping_prohospital','draft',d||'{"new_price":"NaN"}');raise exception 'nan_accepted';exception when others then if sqlerrm<>'invalid_numbers' then raise;end if;end;
 p:=public.cip_mp_desk_command('shopping_prohospital','draft',d||'{"new_price":60}');
 if not(p->'analysis'->'issues'?'below_floor') then raise exception 'floor_not_blocked';end if;
 begin perform public.cip_mp_desk_command('shopping_prohospital','approve',jsonb_build_object('id',p->>'id','version',1,'note','Synthetic QA below floor must fail.','checks','{"destination_verified":true,"expenses_verified":true,"stock_verified":true}'::jsonb));raise exception 'floor_approved';exception when others then if sqlerrm<>'plan_blocked' then raise;end if;end;
 p:=public.cip_mp_desk_command('shopping_prohospital','draft',d||'{"our_unit":"CX"}');if not(p->'analysis'->'issues'?'unit_mismatch') then raise exception 'unit_not_blocked';end if;
 if has_table_privilege(current_user,'public.cip_mp_price_plans','UPDATE') then raise exception 'direct_write_granted';end if;
 if has_function_privilege(current_user,'cip_pricing_private.tick()','execute') then raise exception 'scheduler_exposed';end if;
 if (public.cip_mp_desk_get('shopping_prohospital','QA-MP','QA1','loja',0)->'items'->0->'best_reference'->>'id')::uuid<>rid then raise exception 'board_reference';end if;
end;$$;
reset role;
-- Simulate due time in fixtures without waiting or changing any system clock.
update public.cip_mp_price_plans set start_at=now()-interval '1 minute',end_at=now()+interval '1 hour' where state='scheduled' and sku='QA-MP';
select cip_pricing_private.tick();
do $$begin if not exists(select 1 from public.cip_mp_price_plans where sku='QA-MP' and state='ready') then raise exception 'due_not_ready';end if;end;$$;
set local role authenticated;
do $$declare p public.cip_mp_price_plans;begin
 select * into p from public.cip_mp_price_plans where sku='QA-MP' and state='ready' limit 1;
 begin perform public.cip_mp_desk_command(p.company_id,'report_applied',jsonb_build_object('id',p.id,'version',p.version,'observed_price',91,'note','Synthetic QA incorrect observed price.'));raise exception 'wrong_price_reported';exception when others then if sqlerrm<>'application_evidence_required' then raise;end if;end;
 perform public.cip_mp_desk_command(p.company_id,'report_applied',jsonb_build_object('id',p.id,'version',p.version,'observed_price',90,'note','Synthetic QA manual receipt and destination table checked.'));
end;$$;
reset role;
update public.cip_mp_price_plans set start_at=now()-interval '2 hours',end_at=now()-interval '1 hour' where sku='QA-MP' and state='reported_applied';
select cip_pricing_private.tick();
do $$begin if not exists(select 1 from public.cip_mp_price_plans where sku='QA-MP' and state='ended' and reported_at is not null) then raise exception 'end_not_recorded';end if;end;$$;
-- Another valid schedule is blocked when source economics changes before the due check.
update public.cip_mp_price_plans set state='scheduled',start_at=now()-interval '1 minute',end_at=now()+interval '1 hour' where sku='QA-MP' and state='draft';
update public.cip_erp_snapshots set payload=jsonb_set(payload,'{data,prices,0,current_price}','"110"') where source_hash=repeat('e',64);
select cip_pricing_private.tick();
do $$begin if not exists(select 1 from public.cip_mp_price_plans where sku='QA-MP' and state='blocked' and analysis->'issues'?'source_changed') then raise exception 'changed_source_not_blocked';end if;end;$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.cip_mp_price_plans) or exists(select 1 from public.cip_mp_market_refs) then raise exception 'rls_leak';end if;
 begin perform public.cip_mp_desk_get('shopping_prohospital');raise exception 'unauthorized_board';exception when others then if sqlerrm<>'authorized_company_required' then raise;end if;end;
 begin perform public.cip_mp_desk_command('shopping_prohospital','config','{}');raise exception 'unauthorized_command';exception when others then if sqlerrm<>'pricing_writer_required' then raise;end if;end;
end;$$;
reset role;
select jsonb_build_object('passed',true,'coverage','normalization, draft, financial floor, approval checks, scope, version, overlap, due queue, manual receipt, ending, source change, RLS, private executor') as qa;
