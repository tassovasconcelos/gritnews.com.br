-- Append to the new schema in a transaction; ALWAYS ROLLBACK. No external dispatch.
do $$declare c text:='shopping_prohospital';actor uuid;r jsonb;claims jsonb;j jsonb;j2 jsonb;pid uuid;oid uuid;rid uuid;lease uuid;offers jsonb;v integer;n integer;hour_slot timestamptz:=date_trunc('hour',now());
begin
 select owner_id into actor from public.cip_faro_config where company_id=c;
 if actor is null then raise exception 'sponsor_missing';end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 update public.cip_faro_config set enabled=true where company_id=c;
 r:=cip_market_private.faro_hourly();
 if (r->>'queued')::integer<>24 then raise exception 'queue_size';end if;
 if (select count(*) from public.cip_faro_jobs where priority=100)<>4 then raise exception 'hot_size';end if;
 if (select count(*) from public.cip_faro_portfolio where active)<24 then raise exception 'portfolio_missing';end if;
 r:=cip_market_private.faro_hourly();if (r->>'queued')::integer<>0 then raise exception 'duplicate_hour';end if;
 -- Adjust only synthetic copied portfolio premises; originals are never updated.
 update public.cip_faro_portfolio set overrides='{"our_pack_units":1}',our=jsonb_set(our,'{price}','100');
 claims:=public.cip_faro_claim();if jsonb_array_length(claims)<>2 then raise exception 'claim_size';end if;
 j:=claims->0;j2:=claims->1;
 offers:=jsonb_build_array(jsonb_build_object('url','https://medjet.com.br/faro-test','seller','Auditoria sintética','platform','medjet.com.br','title','Oferta sintética','quote','R$ 40,00','price',40,'shipping',0,'pack_units',1,'currency','BRL','brand',null,'model',null,'size',null,'conditions','Mesmas condições sintéticas','match',jsonb_build_object('kind','similar','score',60,'conflicts','[]'::jsonb,'pending','[]'::jsonb)));
 r:=public.cip_faro_finish((j->>'job')::uuid,(j->>'lease')::uuid,offers,'{"search_calls":2}',false);
 if r->>'state'<>'completed' or (select count(*) from public.cip_faro_signals where state='open')<>2 then raise exception 'signals_missing';end if;
 if (select count(*) from public.cip_mp_market_refs where created_at>=now())>0 then raise exception 'automatic_reference_created';end if;
 begin perform public.cip_faro_finish((j->>'job')::uuid,(j->>'lease')::uuid,offers,'{}',false);raise exception 'replay_allowed';exception when raise_exception then if sqlerrm<>'worker_lease_invalid' then raise;end if;end;
 select portfolio_id into pid from public.cip_faro_jobs where id=(j->>'job')::uuid;
 update public.cip_faro_jobs set state='skipped' where state='queued';
 -- Same SKU, later observation with identical terms and a real numerical price drop.
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot) values(c,pid,hour_slot-interval '1 minute');
 claims:=public.cip_faro_claim();j:=claims->0;
 if j is null then raise exception 'followup_not_claimed';end if;
 update public.cip_market_offers set created_at=now()-interval '1 minute' where run_id=(select run_id from public.cip_faro_jobs where portfolio_id=pid and state='completed' limit 1);
 offers:=jsonb_set(offers,'{0,price}','30');offers:=jsonb_set(offers,'{0,quote}','"R$ 30,00"');
 r:=public.cip_faro_finish((j->>'job')::uuid,(j->>'lease')::uuid,offers,'{"search_calls":2}',false);
 if not exists(select 1 from public.cip_faro_signals where kind='price_drop' and (details->>'previous_normalized_candidate')::numeric=40) then raise exception 'drop_missing';end if;
 -- The service lease is mandatory even with an otherwise valid job id.
 begin perform public.cip_faro_finish((j2->>'job')::uuid,gen_random_uuid(),'[]','{}',false);raise exception 'wrong_lease_allowed';exception when raise_exception then if sqlerrm<>'worker_lease_invalid' then raise;end if;end;
 perform public.cip_faro_finish((j2->>'job')::uuid,(j2->>'lease')::uuid,'[]','{"error":"synthetic_failure"}',true);
 select version into v from public.cip_faro_config where company_id=c;
 perform public.cip_faro_command(c,'config',jsonb_build_object('version',v,'enabled',false,'products_per_hour',24,'hot_count',4,'daily_limit',576,'gap_pct',5,'domains',jsonb_build_array('medjet.com.br')));
 if exists(select 1 from public.cip_faro_jobs where state='queued') then raise exception 'pause_failed';end if;
 if (public.cip_faro_get(c,'',0)->'stats'->>'claimed_today')::integer<>3 then raise exception 'budget_count';end if;
 if has_function_privilege('authenticated','public.cip_faro_claim()','execute') or has_function_privilege('authenticated','public.cip_faro_worker_secret()','execute') or has_table_privilege('authenticated','public.cip_faro_config','update') then raise exception 'privilege_leak';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);execute 'set local role authenticated';
 if (select count(*) from public.cip_faro_portfolio)>0 then raise exception 'rls_leak';end if;
 begin perform public.cip_faro_get(c,'',0);raise exception 'foreign_read_allowed';exception when raise_exception then if sqlerrm<>'authorized_company_required' then raise;end if;end;
 execute 'reset role';
end;$$;
select true as passed;
rollback;
