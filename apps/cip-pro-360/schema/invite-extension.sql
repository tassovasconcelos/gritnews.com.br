begin;
create or replace function public.cip_admin_extend_invite(p_actor uuid,p_invite uuid) returns timestamptz language plpgsql security invoker set search_path='' as $$
declare item public.cip_user_invites;expiry timestamptz;
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'superadmin_required';end if;
 select * into item from public.cip_user_invites where id=p_invite for update;
 if not found or item.state<>'ready' or item.accepted_by is not null then raise exception 'invitation_not_extendable';end if;
 expiry=greatest(item.expires_at,clock_timestamp())+interval '1 hour';
 update public.cip_user_invites set expires_at=expiry where id=p_invite;
 insert into public.cip_access_events(actor_id,action,details) values(p_actor,'invite_extended',jsonb_build_object('invitation',p_invite,'previous_expires_at',item.expires_at,'expires_at',expiry));
 return expiry;
end;$$;
revoke all on function public.cip_admin_extend_invite(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cip_admin_extend_invite(uuid,uuid) to service_role;
commit;
