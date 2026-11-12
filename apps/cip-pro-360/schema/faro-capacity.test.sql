-- Append to migration body; rollback transaction. No cron dispatch and no external requests.
do $$declare c text:='shopping_prohospital';actor uuid;base timestamptz:=((now() at time zone 'America/Sao_Paulo')::date+300)::timestamp at time zone 'America/Sao_Paulo';i integer;dayn integer;n integer;unique_n integer;total_n integer;ids uuid[];claims jsonb;before_reserved integer;
begin
 select owner_id into actor from public.cip_faro_config where company_id=c;perform set_config('request.jwt.claim.sub',actor::text,true);
 update public.cip_faro_config set enabled=false where company_id<>c;
 update public.cip_faro_config set enabled=true,circuit_until=null,products_per_hour=48,daily_limit=1152,daily_unique_target=1000 where company_id=c;
 update public.cip_faro_portfolio set active=false where company_id=c;
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value,special_enabled,special_note)
 select c,'__CAPACITY_'||g.idx,current_date,repeat('6',64),jsonb_build_object('sku','__CAPACITY_'||g.idx,'store_code','1','description','Luva Medix','unit','UN','price',10,'curve',case when g.idx<=866 then 'A' else 'B' end),'{"brand":"Medix","our_pack_units":1}',10000-g.idx,g.idx between 5 and 14,'Teste de cobertura e redundância' from generate_series(1,5421)g(idx);
 for dayn in 0..5 loop
 for i in 0..23 loop
 n:=cip_market_private.capacity_slot(c,base+make_interval(days=>dayn,hours=>i));if n>48 then raise exception 'hourly_overflow';end if;
 if cip_market_private.capacity_slot(c,base+make_interval(days=>dayn,hours=>i))<>0 then raise exception 'duplicate_slot';end if;
 end loop;
 select count(distinct portfolio_id),count(*) into unique_n,total_n from public.cip_faro_jobs where company_id=c and slot>=base+make_interval(days=>dayn) and slot<base+make_interval(days=>dayn+1);
 if unique_n<>1000 or total_n>1152 then raise exception 'daily_target_failed day % unique % jobs %',dayn,unique_n,total_n;end if;
 end loop;
 select count(distinct portfolio_id) into n from public.cip_faro_jobs where company_id=c and slot>=base and slot<base+interval '6 days';if n<>5421 then raise exception 'weekly_coverage_failed %',n;end if;
 select array_agg(id) into ids from(select id from public.cip_faro_portfolio where company_id=c and active order by sku limit 4)x;
 update public.cip_faro_jobs set state='skipped',finished_at=now() where company_id=c and state in('queued','claimed') and slot<base;
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot) select c,id,date_trunc('hour',now()) from unnest(ids)id;
 select coalesce(sum(reserved_calls),0) into before_reserved from public.cip_faro_jobs where company_id=c and claimed_at>=(now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo';
 claims:=cip_market_private.faro_claim();if jsonb_array_length(claims)<>4 then raise exception 'four_claims_expected';end if;
 if exists(select 1 from jsonb_array_elements(claims)x where x->>'web_calls'<>'1' or x->>'output_tokens'<>'1600') then raise exception 'call_budget_not_one';end if;
 if (select sum(reserved_calls) from public.cip_faro_jobs where company_id=c and claimed_at>=(now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo')<>before_reserved+4 then raise exception 'reservation_changed';end if;
 if has_function_privilege('anon','cip_market_private.capacity_slot(text,timestamptz)','execute') or has_function_privilege('authenticated','cip_market_private.capacity_slot(text,timestamptz)','execute') then raise exception 'queue_exposed';end if;
end;$$;
select true as capacity_tests_passed;
rollback;
