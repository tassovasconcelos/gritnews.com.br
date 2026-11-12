begin;
do $$
declare actor uuid;item uuid;old_expiry timestamptz;new_expiry timestamptz;
begin
 select user_id into actor from public.cip_profiles where active and role='superadm' limit 1;
 if actor is null then raise exception 'test_requires_existing_superadmin';end if;
 old_expiry=now()+interval '30 minutes';
 insert into public.cip_user_invites(email,role,companies,token_hash,state,created_by,expires_at) values('extension-test@example.invalid','diretoria',array['shopping_prohospital'],encode(extensions.gen_random_bytes(32),'hex'),'ready',actor,old_expiry) returning id into item;
 new_expiry=public.cip_admin_extend_invite(actor,item);
 if new_expiry<>old_expiry+interval '1 hour' then raise exception 'active_extension_failed';end if;
 if not exists(select 1 from public.cip_access_events where action='invite_extended' and details->>'invitation'=item::text and details->>'expires_at' is not null) then raise exception 'audit_missing';end if;
 update public.cip_user_invites set expires_at=now()-interval '2 hours' where id=item;
 new_expiry=public.cip_admin_extend_invite(actor,item);
 if new_expiry<clock_timestamp()+interval '59 minutes' then raise exception 'expired_extension_failed';end if;
 begin perform public.cip_admin_extend_invite(gen_random_uuid(),item);raise exception 'unauthorized_allowed';exception when others then if SQLERRM='unauthorized_allowed' then raise;end if;end;
 update public.cip_user_invites set state='revoked' where id=item;
 begin perform public.cip_admin_extend_invite(actor,item);raise exception 'revoked_allowed';exception when others then if SQLERRM='revoked_allowed' then raise;end if;end;
 update public.cip_user_invites set state='accepted',accepted_by=actor where id=item;
 begin perform public.cip_admin_extend_invite(actor,item);raise exception 'accepted_allowed';exception when others then if SQLERRM='accepted_allowed' then raise;end if;end;
 if has_function_privilege('authenticated','public.cip_admin_extend_invite(uuid,uuid)','EXECUTE') or has_function_privilege('anon','public.cip_admin_extend_invite(uuid,uuid)','EXECUTE') then raise exception 'rpc_exposed';end if;
end;$$;
select 'PASS: active/expired extension, superadmin gate, audit, revoked/accepted denial and service-only RPC' as result;
rollback;
