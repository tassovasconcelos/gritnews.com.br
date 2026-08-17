-- Meu Espetinho — Super Admin: controle seguro de acesso do assinante
create or replace function public.admin_set_tenant_access(
  p_tenant_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_allowed boolean;
begin
  select exists(
    select 1 from public.admin_users
    where user_id = v_admin and active = true
  ) into v_allowed;

  if not v_allowed then
    raise exception 'forbidden';
  end if;

  if p_action = 'suspend' then
    update public.tenants
       set setup_status = 'suspended'
     where id = p_tenant_id;
  elsif p_action = 'reactivate' then
    update public.tenants
       set setup_status = 'approved'
     where id = p_tenant_id;
  else
    raise exception 'invalid_action';
  end if;

  if not found then
    raise exception 'tenant_not_found';
  end if;

  insert into public.audit_logs(tenant_id, user_id, action, entity, entity_id, metadata)
  values (
    p_tenant_id,
    v_admin,
    case when p_action='suspend' then 'tenant_suspended' else 'tenant_reactivated' end,
    'tenant',
    p_tenant_id::text,
    jsonb_build_object('source','super_admin')
  );

  return jsonb_build_object('ok', true, 'tenant_id', p_tenant_id, 'action', p_action);
end;
$$;

revoke all on function public.admin_set_tenant_access(uuid,text) from public;
grant execute on function public.admin_set_tenant_access(uuid,text) to authenticated;
