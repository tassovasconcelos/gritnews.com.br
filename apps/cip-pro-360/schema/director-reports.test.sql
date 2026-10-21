begin;
-- Synthetic users and snapshots are rolled back; no Telegram or OpenAI request.
do $$
declare director uuid=gen_random_uuid();reader uuid=gen_random_uuid();code jsonb;result jsonb;draft uuid;approved uuid;
begin
 insert into auth.users(id,email) values(director,'cip-director-test@example.invalid'),(reader,'cip-reader-test@example.invalid');
 insert into public.cip_profiles(user_id,role,active) values(director,'diretoria',true),(reader,'leitura',true);
 insert into public.cip_memberships(user_id,company_id,role,active) values(director,'shopping_prohospital','diretoria',true),(reader,'shopping_prohospital','leitura',true);
 if public.cip_report_companies(director)<>array['shopping_prohospital']::text[] or cardinality(public.cip_report_companies(reader))<>0 then raise exception 'role_scope_failed';end if;
 begin perform public.cip_bot_pair_code(director,'distribuidora_prohospital');raise exception 'foreign_pair_allowed';exception when others then if SQLERRM='foreign_pair_allowed' then raise;end if;end;
 code=public.cip_bot_pair_code(director,'shopping_prohospital');
 if not public.cip_bot_bind(encode(extensions.digest(code->>'code','sha256'),'hex'),'999000000000001','999000000000001') then raise exception 'pair_failed';end if;
 if public.cip_bot_bind(encode(extensions.digest(code->>'code','sha256'),'hex'),'999000000000001','999000000000001') then raise exception 'replay_allowed';end if;
 if public.cip_bot_choose_company('999000000000001','999000000000001','distribuidora_prohospital') then raise exception 'foreign_choose_allowed';end if;
 result=public.cip_bot_report('999000000000001','999000000000001','summary','','distribuidora_prohospital');if (result->>'authorized')::boolean then raise exception 'foreign_report_allowed';end if;
 insert into public.cip_erp_snapshots(company_id,source_name,source_hash,captured_at,payload,metadata,summary,created_by) values('shopping_prohospital','ROLLBACK TEST',repeat('d',64),now(),'{}','{}','{}',director) returning id into draft;
 if public.cip_erp_get(director,'shopping_prohospital',draft) is not null then raise exception 'draft_visible';end if;
 insert into public.cip_erp_snapshots(company_id,source_name,source_hash,captured_at,payload,metadata,summary,created_by,status) values('shopping_prohospital','ROLLBACK TEST',repeat('e',64),now(),'{}','{}','{}',director,'approved') returning id into approved;
 if public.cip_erp_get(director,'shopping_prohospital',null)->>'id'<>approved::text then raise exception 'approved_unavailable';end if;
 begin perform public.cip_erp_get(director,'distribuidora_prohospital',null);raise exception 'foreign_erp_allowed';exception when others then if SQLERRM='foreign_erp_allowed' then raise;end if;end;
 begin perform public.cip_erp_approve(director,draft,0,0,'Synthetic rollback test reconciliation');raise exception 'director_approve_allowed';exception when others then if SQLERRM='director_approve_allowed' then raise;end if;end;
 update public.cip_memberships set active=false where user_id=director;
 if (public.cip_bot_context('999000000000001','999000000000001')->>'authorized')::boolean then raise exception 'removed_membership_authorized';end if;
 update public.cip_memberships set active=true where user_id=director;
 update public.cip_profiles set active=false where user_id=director;
 if (public.cip_bot_context('999000000000001','999000000000001')->>'authorized')::boolean then raise exception 'suspended_authorized';end if;
 if has_function_privilege('authenticated','public.cip_report_companies(uuid)','EXECUTE') or has_function_privilege('anon','public.cip_erp_get(uuid,text,uuid)','EXECUTE') then raise exception 'public_rpc_exposed';end if;
 if has_column_privilege('authenticated','public.cip_erp_snapshots','payload','SELECT') then raise exception 'raw_payload_exposed';end if;
end;$$;
select 'PASS: roles, company isolation, single-use pairing, drafts, approvals, membership removal, suspension and service-only grants' as result;
rollback;
