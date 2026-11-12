-- Run after the migration body in a single rollback transaction; no network/dispatch.
do $$declare c text:='shopping_prohospital';actor uuid;ids uuid[]:='{}';pid uuid;v jsonb;claims jsonb;before_calls integer;n integer;expected text;obj jsonb;
begin
 select owner_id into actor from public.cip_faro_config where company_id=c;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 update public.cip_faro_config set enabled=false where company_id<>c;
 update public.cip_faro_config set enabled=true,last_slot=null,circuit_until=null where company_id=c;
 update public.cip_faro_portfolio set active=false,special_enabled=false where company_id=c;
 -- Keep all effects uncommitted and prevent fixture claim from touching real jobs.
 update public.cip_faro_jobs set state='skipped' where company_id=c and state in ('queued','claimed');
 for n in 1..25 loop
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value)
 values(c,'__SPECIAL_TEST_'||n,current_date,repeat('7',64),jsonb_build_object('sku','__SPECIAL_TEST_'||n,'store_code','1','description','Luva Medix','unit','UN','price',100),'{"brand":"Medix","our_pack_units":1}',1000-n) returning id into pid;
 ids:=array_append(ids,pid);
 if n between 5 and 14 then perform public.cip_faro_special_set(c,pid,1,true,'expanded','Conferir produto e embalagem na praça de compra');end if;
 end loop;
 begin perform public.cip_faro_special_set(c,ids[15],1,true,'expanded','Décimo primeiro item não permitido');raise exception 'eleventh_allowed';exception when raise_exception then if sqlerrm<>'special_limit' then raise;end if;end;
 begin perform public.cip_faro_special_set(c,ids[5],1,false,'identity','Revisão com versão vencida');raise exception 'stale_allowed';exception when raise_exception then if sqlerrm<>'special_changed' then raise;end if;end;
 begin perform public.cip_faro_special_set('distribuidora_prohospital',ids[5],2,false,'identity','Empresa diferente não permitida');raise exception 'cross_company_allowed';exception when raise_exception then if sqlerrm<>'portfolio_changed' then raise;end if;end;
 v:=cip_market_private.faro_hourly();
 if (v->>'queued')::integer<>24 then raise exception 'hourly_not_24: %',v;end if;
 if (select count(*) from public.cip_faro_jobs where portfolio_id=any(ids) and priority=110)<>10 then raise exception 'special_allocation_failed';end if;
 v:=cip_market_private.faro_hourly();if (v->>'queued')::integer<>0 then raise exception 'duplicate_hour';end if;
 claims:=cip_market_private.faro_claim();
 if jsonb_array_length(claims)<>2 then raise exception 'claim_not_two';end if;
 for obj in select value from jsonb_array_elements(claims) loop
 if obj->'focus'->>'objective' is null or obj->'focus'->>'phase' not in ('identity','deepen','similar') then raise exception 'missing_focus';end if;
 if (select reserved_calls from public.cip_faro_jobs where id=(obj->>'job')::uuid)<>2 then raise exception 'quota_changed';end if;
 if public.cip_faro_directory_target((obj->>'job')::uuid,(obj->>'lease')::uuid) is not null then raise exception 'special_restricted_to_regional_domain';end if;
 if (select mode from public.cip_market_runs where auto_job_id=(obj->>'job')::uuid) is distinct from obj->>'mode' then raise exception 'mode_mismatch';end if;
 end loop;
 v:=public.cip_faro_get(c,'',0);if jsonb_array_length(v->'special')<>10 then raise exception 'selection_not_visible';end if;
 perform public.cip_faro_special_set(c,ids[5],2,false,'identity','Retirar produto sem apagar o histórico');
 perform public.cip_faro_special_set(c,ids[15],1,true,'identity','Incluir vaga liberada com busca exata');
 if (select count(*) from public.cip_faro_portfolio where company_id=c and special_enabled)<>10 then raise exception 'replace_failed';end if;
 if has_function_privilege('anon','public.cip_faro_special_set(text,uuid,integer,boolean,text,text)','execute') then raise exception 'anon_allowed';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.cip_faro_special_set(c,ids[5],3,true,'identity','Acesso sem autorização bloqueado');raise exception 'unauthorized_allowed';exception when raise_exception then if sqlerrm<>'director_required' then raise;end if;end;
end;$$;
select true as special_tests_passed;
rollback;
