-- Append after schema in same transaction. No paid dispatch. Always roll back.
do $$declare c text:='shopping_prohospital';actor uuid;pid uuid;jid uuid;rid uuid;token uuid:=gen_random_uuid();did uuid;r jsonb;r2 jsonb;offers jsonb;v integer;
begin
 select owner_id into actor from public.cip_faro_config where company_id=c;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 insert into public.cip_market_directory_batches(company_id,source_hash,source_name,summary) values(c,repeat('9',64),'Synthetic directory','{}');
 insert into public.cip_market_directory(company_id,source_hash,source_row,source_key,name,address,state,city,region,geo_status,site_url,domain,monitor_enabled,segment,source_updated_text,dedup_key)
 values(c,repeat('9',64),1,'1','Synthetic medical','Synthetic address','CE','Fortaleza','Nordeste','parsed','https://a-directory-synthetic.com.br','a-directory-synthetic.com.br',true,'Review','synthetic','synthetic') returning id into did;
 r:=public.cip_market_directory_get(c,'Synthetic medical','CE','Fortaleza','Nordeste',0);
 if (r->>'total')::integer<>1 then raise exception 'directory_read';end if;
 perform public.cip_market_directory_review(c,did,1,'{"state":"SP","city":"São Paulo","source_url":"https://a-directory-synthetic.com.br/contato","note":"Synthetic corporate address check","monitor_enabled":true}');
 if (select state from public.cip_market_directory where id=did)<>'SP' then raise exception 'review_missing';end if;
 begin perform public.cip_market_directory_review(c,did,1,'{}');raise exception 'stale_review_allowed';exception when raise_exception then if sqlerrm<>'directory_changed' then raise;end if;end;
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value) values(c,'__DIRECTORY_TEST__',current_date,repeat('9',64),'{"sku":"__DIRECTORY_TEST__","store_code":"1","description":"Synthetic product","unit":"UN","price":100}','{"brand":"Test","our_pack_units":1}',1) returning id into pid;
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot,priority,state,lease,claimed_at,reserved_calls) values(c,pid,now(),50,'claimed',token,now(),2) returning id into jid;
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode,auto_job_id) select c,actor,sku,'1',our,identity,'["amazon.com.br"]','identity',jid from public.cip_faro_portfolio where id=pid returning id into rid;
 update public.cip_faro_jobs set run_id=rid where id=jid;
 begin perform public.cip_faro_directory_target(jid,gen_random_uuid());raise exception 'wrong_lease_allowed';exception when raise_exception then if sqlerrm<>'worker_lease_invalid' then raise;end if;end;
 r:=public.cip_faro_directory_target(jid,token);r2:=public.cip_faro_directory_target(jid,token);
 if r is distinct from r2 or r->>'domain'<>'a-directory-synthetic.com.br' or (select count(*) from public.cip_market_directory_targets where job_id=jid)<>1 then raise exception 'target_idempotence';end if;
 if (select domains from public.cip_market_runs where id=rid)<>'["a-directory-synthetic.com.br"]' then raise exception 'allowlist_not_atomic';end if;
 offers:='[{"url":"https://a-directory-synthetic.com.br/synthetic-item","seller":"Synthetic store","title":"Synthetic item","quote":"R$ 90,00","price":90,"shipping":null,"pack_units":1,"currency":"BRL","match":{"kind":"similar","score":50,"pending":["Frete"]}}]';
 perform cip_market_private.finish(rid,offers,'{"search_calls":1}',false);
 if (select t.offers from public.cip_market_directory_targets t where job_id=jid)<>1 or (select last_evidence_at from public.cip_market_directory where id=did) is null then raise exception 'evidence_not_recorded';end if;
 if has_function_privilege('authenticated','public.cip_faro_directory_target(uuid,uuid)','execute') or has_table_privilege('authenticated','public.cip_market_directory','update') then raise exception 'write_exposed';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.cip_market_directory_get(c);raise exception 'unscoped_read';exception when raise_exception then if sqlerrm<>'authorized_company_required' then raise;end if;end;
 execute 'set local role authenticated';
 if exists(select 1 from public.cip_market_directory) then raise exception 'rls_leak';end if;
 execute 'reset role';
end;$$;
select true as directory_tests_passed;
rollback;
