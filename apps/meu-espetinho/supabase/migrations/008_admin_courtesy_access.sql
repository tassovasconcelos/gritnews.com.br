-- Meu Espetinho — acesso administrativo temporário para degustação e permuta
alter table public.tenants
  add column if not exists courtesy_type text,
  add column if not exists courtesy_started_at timestamptz,
  add column if not exists courtesy_ends_at timestamptz,
  add column if not exists courtesy_granted_by uuid references auth.users(id);

alter table public.tenants drop constraint if exists tenants_courtesy_type_check;
alter table public.tenants add constraint tenants_courtesy_type_check
  check (courtesy_type is null or courtesy_type in ('tasting','barter'));

create table if not exists public.tenant_courtesy_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  courtesy_type text not null check (courtesy_type in ('tasting','barter')),
  days_granted integer not null check (days_granted in (15,30,60,90)),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  granted_by uuid not null references auth.users(id),
  renewed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tenant_courtesy_grants enable row level security;
revoke all on table public.tenant_courtesy_grants from public, anon, authenticated;

create or replace function public.admin_grant_tenant_courtesy(
  p_tenant_id uuid,
  p_courtesy_type text,
  p_days integer,
  p_renew boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_start timestamptz;
  v_end timestamptz;
begin
  if not exists(select 1 from public.admin_users where user_id=v_admin and active=true) then
    raise exception 'forbidden';
  end if;
  if p_courtesy_type not in ('tasting','barter') then raise exception 'invalid_courtesy_type'; end if;
  if p_days not in (15,30,60,90) then raise exception 'invalid_days'; end if;

  select case when p_renew and courtesy_ends_at > now() then courtesy_ends_at else now() end
    into v_start from public.tenants where id=p_tenant_id for update;
  if not found then raise exception 'tenant_not_found'; end if;
  v_end := v_start + make_interval(days => p_days);

  update public.tenants set
    courtesy_type=p_courtesy_type,
    courtesy_started_at=case when p_renew and courtesy_started_at is not null then courtesy_started_at else now() end,
    courtesy_ends_at=v_end,
    courtesy_granted_by=v_admin,
    setup_status='approved'
  where id=p_tenant_id;

  insert into public.tenant_courtesy_grants(tenant_id,courtesy_type,days_granted,starts_at,ends_at,granted_by,renewed)
  values(p_tenant_id,p_courtesy_type,p_days,v_start,v_end,v_admin,p_renew);
  insert into public.audit_logs(tenant_id,user_id,action,entity,entity_id,metadata)
  values(p_tenant_id,v_admin,case when p_renew then 'tenant_courtesy_renewed' else 'tenant_courtesy_granted' end,'tenant',p_tenant_id::text,jsonb_build_object('source','super_admin','courtesy_type',p_courtesy_type,'days',p_days,'ends_at',v_end));
  return jsonb_build_object('ok',true,'tenant_id',p_tenant_id,'courtesy_type',p_courtesy_type,'ends_at',v_end,'renewed',p_renew);
end;
$$;

revoke all on function public.admin_grant_tenant_courtesy(uuid,text,integer,boolean) from public;
grant execute on function public.admin_grant_tenant_courtesy(uuid,text,integer,boolean) to authenticated;

drop function if exists public.current_user_tenants();
create function public.current_user_tenants()
returns table(id uuid,name text,subscription_status text,trial_ends_at timestamptz,setup_status text,is_owner boolean,courtesy_type text,courtesy_ends_at timestamptz)
language sql stable security invoker set search_path=public as $$
  select t.id,t.name,t.subscription_status,t.trial_ends_at,coalesce(t.setup_status,'approved'),t.owner_user_id=auth.uid(),t.courtesy_type,t.courtesy_ends_at
  from public.tenants t
  where t.owner_user_id=auth.uid() or exists(select 1 from public.tenant_users tu where tu.tenant_id=t.id and tu.user_id=auth.uid() and tu.active=true)
  order by (t.owner_user_id=auth.uid()) desc,t.created_at asc;
$$;
grant execute on function public.current_user_tenants() to authenticated;

drop function if exists public.admin_customer_overview();
create function public.admin_customer_overview()
returns table(tenant_id uuid,tenant_name text,phone text,subscription_status text,setup_status text,plan_code text,provider_status text,orders_90d bigint,revenue_90d numeric,last_activity timestamptz,active_users bigint,courtesy_type text,courtesy_started_at timestamptz,courtesy_ends_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.admin_users where user_id=auth.uid() and active=true) then raise exception 'forbidden'; end if;
  return query
  with order_stats as (select o.tenant_id,count(*) filter(where o.opened_at>=now()-interval '90 days') orders_90d,coalesce(sum(o.total) filter(where o.opened_at>=now()-interval '90 days' and o.status='closed'),0)::numeric revenue_90d,max(o.opened_at) last_activity from public.orders o group by o.tenant_id),
  user_stats as (select tu.tenant_id,count(*) filter(where tu.active=true) member_users from public.tenant_users tu group by tu.tenant_id)
  select t.id,t.name,t.phone,t.subscription_status,coalesce(t.setup_status,'approved'),s.plan_code,coalesce(s.provider_status,s.status),coalesce(os.orders_90d,0),coalesce(os.revenue_90d,0),os.last_activity,1+coalesce(us.member_users,0),t.courtesy_type,t.courtesy_started_at,t.courtesy_ends_at
  from public.tenants t left join public.subscriptions s on s.tenant_id=t.id left join order_stats os on os.tenant_id=t.id left join user_stats us on us.tenant_id=t.id order by t.created_at desc;
end;
$$;
revoke all on function public.admin_customer_overview() from public;
grant execute on function public.admin_customer_overview() to authenticated;

create or replace function private.user_has_tenant_access(target_tenant uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.tenants t
    where t.id=target_tenant and coalesce(t.setup_status,'approved')<>'suspended'
      and (t.subscription_status='active' or t.trial_ends_at>now() or (t.courtesy_type is not null and t.courtesy_ends_at>now()))
      and (t.owner_user_id=(select auth.uid()) or exists(select 1 from public.tenant_users tu where tu.tenant_id=t.id and tu.user_id=(select auth.uid()) and tu.active=true))
  );
$$;
revoke all on function private.user_has_tenant_access(uuid) from public;
grant execute on function private.user_has_tenant_access(uuid) to authenticated;

