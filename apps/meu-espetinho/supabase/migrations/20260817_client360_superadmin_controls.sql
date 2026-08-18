alter table public.tenants add column if not exists activation_waived_at timestamptz, add column if not exists activation_waived_by uuid, add column if not exists activation_waiver_reason text;

create or replace function public.admin_waive_tenant_activation(p_tenant_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin uuid:=auth.uid(); v_owner uuid; v_now timestamptz:=now();
begin
 if not exists(select 1 from public.admin_users where user_id=v_admin and active=true) then raise exception 'forbidden'; end if;
 select owner_user_id into v_owner from public.tenants where id=p_tenant_id for update;
 if not found then raise exception 'tenant_not_found'; end if;
 update public.tenants set activation_waived_at=v_now,activation_waived_by=v_admin,activation_waiver_reason=nullif(trim(coalesce(p_reason,'')),''),setup_status='pending_setup',setup_requested_at=coalesce(setup_requested_at,v_now) where id=p_tenant_id;
 insert into public.setup_requests(tenant_id,owner_user_id,status,requested_at,updated_at) values(p_tenant_id,v_owner,'pending',v_now,v_now) on conflict(tenant_id) do update set status='pending',updated_at=excluded.updated_at,requested_at=coalesce(public.setup_requests.requested_at,excluded.requested_at);
 insert into public.audit_logs(tenant_id,user_id,action,entity,entity_id,metadata) values(p_tenant_id,v_admin,'tenant_activation_waived','tenant',p_tenant_id::text,jsonb_build_object('source','super_admin','reason',nullif(trim(coalesce(p_reason,'')),'')));
 return jsonb_build_object('ok',true,'tenant_id',p_tenant_id,'activation_waived_at',v_now);
end;$$;

create or replace function public.admin_clear_tenant_courtesy(p_tenant_id uuid)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin uuid:=auth.uid();
begin
 if not exists(select 1 from public.admin_users where user_id=v_admin and active=true) then raise exception 'forbidden'; end if;
 update public.tenants set courtesy_type=null,courtesy_started_at=null,courtesy_ends_at=null,courtesy_granted_by=null where id=p_tenant_id;
 if not found then raise exception 'tenant_not_found'; end if;
 insert into public.audit_logs(tenant_id,user_id,action,entity,entity_id,metadata) values(p_tenant_id,v_admin,'tenant_courtesy_cleared','tenant',p_tenant_id::text,jsonb_build_object('source','super_admin'));
 return jsonb_build_object('ok',true,'tenant_id',p_tenant_id);
end;$$;

grant execute on function public.admin_waive_tenant_activation(uuid,text) to authenticated;
grant execute on function public.admin_clear_tenant_courtesy(uuid) to authenticated;
