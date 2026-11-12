-- Read-only post-deployment regression. Every session setting is rolled back.
begin;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$begin
 if has_function_privilege('anon','public.cip_operation_readiness()','execute') then raise exception 'anonymous_execute';end if;
 if has_function_privilege('service_role','public.cip_operation_readiness()','execute') then raise exception 'unnecessary_service_execute';end if;
 begin perform public.cip_operation_readiness();raise exception 'unauthorized_snapshot';exception when others then if sqlerrm<>'superadmin_required' then raise;end if;end;
end;$$;
select set_config('request.jwt.claim.sub',(select user_id::text from public.cip_profiles where active and role='superadm' limit 1),true);
set local role authenticated;
do $$declare d jsonb;begin
 d:=public.cip_operation_readiness();
 if (d->>'schema')::integer<>1 or jsonb_array_length(d->'companies')<>2 then raise exception 'invalid_snapshot';end if;
 if exists(select 1 from jsonb_object_keys(d) k where k in ('email','token','ai_key','telegram_id')) then raise exception 'private_payload';end if;
 if not(d?'checked_at' and d?'business_date' and d?'access' and d?'telegram' and d?'jobs') then raise exception 'missing_contract';end if;
end;$$;
reset role;
select 'PASS: readiness scope, output contract and explicit grants.' as verification;
rollback;
