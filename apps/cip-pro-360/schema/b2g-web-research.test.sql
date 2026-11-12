-- Run against a configured CIP database. All test writes are rolled back.
begin;
do $$declare actor uuid; foreign_actor uuid; n integer;begin
 select user_id into actor from public.cip_profiles where active and role='superadm' limit 1;
 select id into foreign_actor from auth.users where id<>actor limit 1;
 if actor is null or foreign_actor is null then raise exception 'test_actors_missing';end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 perform set_config('cip.test.foreign_actor',foreign_actor::text,true);
 delete from public.cip_b2g_web_usage where actor_id=actor and day=(now() at time zone 'America/Sao_Paulo')::date;
 for n in 1..20 loop if not public.cip_b2g_web_claim(actor) then raise exception 'quota_early';end if;end loop;
 if public.cip_b2g_web_claim(actor) then raise exception 'quota_exceeded';end if;
 if has_function_privilege('authenticated','public.cip_b2g_web_claim(uuid)','execute') or has_table_privilege('anon','public.cip_b2g_search_feedback','select') then raise exception 'privilege_leak';end if;
end $$;
set local role authenticated;
select public.cip_b2g_feedback_save('{"product":"rls-test","brand":"","state":"SP"}','https://www.transparencia.sp.gov.br/teste','relevant');
do $$declare n integer;begin
 select count(*) into n from public.cip_b2g_feedback_list('{"product":"rls-test","brand":"","state":"SP"}');if n<>1 then raise exception 'own_feedback_missing';end if;
 begin
  insert into public.cip_b2g_search_feedback(actor_id,query_key,source_hash,terms,source_url,verdict)
  values(current_setting('cip.test.foreign_actor')::uuid,'forged','forged','{}','https://pncp.gov.br/test','relevant');
  raise exception 'foreign_insert_allowed';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$begin perform set_config('request.jwt.claim.sub',current_setting('cip.test.foreign_actor'),true);end $$;
set local role authenticated;
do $$declare n integer;begin
 select count(*) into n from public.cip_b2g_feedback_list('{"product":"rls-test","brand":"","state":"SP"}');if n<>0 then raise exception 'foreign_feedback_leak';end if;
end $$;
reset role;
rollback;
