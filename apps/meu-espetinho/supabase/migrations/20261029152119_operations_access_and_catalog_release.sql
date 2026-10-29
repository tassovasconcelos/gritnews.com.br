-- Shared database. Apply after shared_operations_settings_catalog_team.
-- Never activate client data during deployment: grants and product release require explicit actions.
create or replace function private.ops_grant_access(a text,s uuid,mode text,amount integer,unit text,reason text,renew boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare start_at timestamptz:=now(); end_at timestamptz; previous_end timestamptz;
begin
 if not private.ops_super() then raise exception 'forbidden' using errcode='42501'; end if;
 if a is null or a not in ('meu-espetinho','sr-padeiro') or mode is null or mode not in ('trial','barter')
   or amount is null or unit is null or not ((unit='days' and amount between 1 and 366) or (unit='months' and amount between 1 and 12))
   or length(trim(coalesce(reason,''))) not between 5 and 500 or renew is null then raise exception 'invalid_access'; end if;
 if a='meu-espetinho' then
   select t.courtesy_ends_at into previous_end from public.tenants t where t.id=s for update;
 else
   perform 1 from public.srp_organizations o where o.id=s for update;
 end if;
 if not found then raise exception 'scope_not_found'; end if;
 if a='sr-padeiro' then
   select case when c.access_mode='barter' then c.barter_until else c.trial_ends_at end into previous_end
   from public.srp_access_control c where c.organization_id=s for update;
 end if;
 if renew then start_at:=greatest(now(),coalesce(previous_end,now())); end if;
 -- Calendar months retain leap years and the real duration of each month.
 end_at:=start_at+case when unit='months' then make_interval(months=>amount) else make_interval(days=>amount) end;
 if a='meu-espetinho' then
   update public.tenants set courtesy_type=case when mode='barter' then 'barter' else 'tasting' end,
     courtesy_started_at=start_at,courtesy_ends_at=end_at,courtesy_granted_by=auth.uid(),
     setup_status=case when setup_status='suspended' then setup_status else 'approved' end where id=s;
 else
   insert into public.srp_access_control(organization_id,access_mode,trial_starts_at,trial_ends_at,barter_until,manual_release,released_by,released_at,notes)
   values(s,mode,start_at,case when mode='trial' then end_at end,case when mode='barter' then end_at end,false,auth.uid(),now(),trim(reason))
   on conflict(organization_id) do update set access_mode=excluded.access_mode,trial_starts_at=excluded.trial_starts_at,
     trial_ends_at=excluded.trial_ends_at,barter_until=excluded.barter_until,manual_release=false,
     released_by=excluded.released_by,released_at=excluded.released_at,notes=excluded.notes,updated_at=now();
 end if;
 insert into public.operation_audit(app,scope_id,actor_id,action,details)
 values(a,s,auth.uid(),'access_granted',jsonb_build_object('mode',mode,'amount',amount,'unit',unit,'starts_at',start_at,'ends_at',end_at,'reason',trim(reason),'renew',renew));
 return jsonb_build_object('ok',true,'starts_at',start_at,'ends_at',end_at);
end $$;
create or replace function public.ops_grant_access(a text,s uuid,mode text,amount integer,unit text,reason text,renew boolean default false)
returns jsonb language sql security invoker set search_path='' as $$select private.ops_grant_access(a,s,mode,amount,unit,reason,renew)$$;

create or replace function private.ops_release_products(s uuid,ids uuid[])
returns integer language plpgsql security definer set search_path='' as $$
declare matched integer; changed integer;
begin
 if not (private.ops_super() or private.ops_access('sr-padeiro',s,true)) then raise exception 'forbidden' using errcode='42501'; end if;
 if ids is null or cardinality(ids) not between 1 and 500 or array_position(ids,null) is not null then raise exception 'invalid_products'; end if;
 perform 1 from public.srp_products p where p.organization_id=s and p.id=any(ids) for update;
 select count(*) into matched from public.srp_products p where p.organization_id=s and p.id=any(ids)
   and p.fulfillment in ('pronta_entrega','encomenda') and p.sale_price>0;
 if matched<>(select count(distinct x) from unnest(ids) x) then raise exception 'review_price_and_fulfillment'; end if;
 update public.srp_products set active=true where organization_id=s and id=any(ids) and not active;
 get diagnostics changed=row_count;
 insert into public.operation_audit(app,scope_id,actor_id,action,details)
 values('sr-padeiro',s,auth.uid(),'products_released',jsonb_build_object('product_ids',ids,'changed',changed));
 return changed;
end $$;
create or replace function public.ops_release_products(s uuid,ids uuid[])
returns integer language sql security invoker set search_path='' as $$select private.ops_release_products(s,ids)$$;

create or replace function private.ops_set_role(a text,s uuid,u uuid,member_role text)
returns void language plpgsql security definer set search_path='' as $$
declare canonical_owner uuid; changed integer;
begin
 if not private.ops_access(a,s,true) then raise exception 'forbidden' using errcode='42501'; end if;
 if u=auth.uid() or u is null or member_role is null then raise exception 'protected_user'; end if;
 if a='meu-espetinho' then
   if member_role not in ('manager','cashier','attendant') then raise exception 'invalid_role'; end if;
   select owner_user_id into canonical_owner from public.tenants where id=s;
   if u=canonical_owner then raise exception 'protected_owner'; end if;
   update public.tenant_users set role=member_role where tenant_id=s and user_id=u and role<>'owner';
 else
   if member_role not in ('manager','cashier','stockist','viewer') then raise exception 'invalid_role'; end if;
   select owner_user_id into canonical_owner from public.srp_organizations where id=s;
   if u=canonical_owner then raise exception 'protected_owner'; end if;
   update public.srp_members set role=member_role where organization_id=s and user_id=u and role<>'owner';
 end if;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'member_not_found_or_protected'; end if;
 insert into public.operation_audit(app,scope_id,actor_id,action,details)
 values(a,s,auth.uid(),'member_role_changed',jsonb_build_object('user_id',u,'role',member_role));
end $$;
create or replace function public.ops_set_role(a text,s uuid,u uuid,member_role text)
returns void language sql security invoker set search_path='' as $$select private.ops_set_role(a,s,u,member_role)$$;
revoke all on function private.ops_set_role(text,uuid,uuid,text),public.ops_set_role(text,uuid,uuid,text) from public,anon;
grant execute on function private.ops_set_role(text,uuid,uuid,text),public.ops_set_role(text,uuid,uuid,text) to authenticated;

revoke all on function private.ops_grant_access(text,uuid,text,integer,text,text,boolean), public.ops_grant_access(text,uuid,text,integer,text,text,boolean),private.ops_release_products(uuid,uuid[]),public.ops_release_products(uuid,uuid[]) from public,anon;
grant execute on function private.ops_grant_access(text,uuid,text,integer,text,text,boolean), public.ops_grant_access(text,uuid,text,integer,text,text,boolean),private.ops_release_products(uuid,uuid[]),public.ops_release_products(uuid,uuid[]) to authenticated;
