-- Meu Espetinho — visão consolidada de assinantes para o Super Admin
create or replace function public.admin_customer_overview()
returns table (
  tenant_id uuid,
  tenant_name text,
  phone text,
  subscription_status text,
  setup_status text,
  plan_code text,
  provider_status text,
  orders_90d bigint,
  revenue_90d numeric,
  last_activity timestamptz,
  active_users bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(select 1 from public.admin_users where user_id=auth.uid() and active=true) then
    raise exception 'forbidden';
  end if;

  return query
  with order_stats as (
    select o.tenant_id,
           count(*) filter (where o.opened_at >= now()-interval '90 days') as orders_90d,
           coalesce(sum(o.total) filter (where o.opened_at >= now()-interval '90 days' and o.status='closed'),0)::numeric as revenue_90d,
           max(o.opened_at) as last_activity
      from public.orders o
     group by o.tenant_id
  ), user_stats as (
    select tu.tenant_id, count(*) filter (where tu.active=true) as member_users
      from public.tenant_users tu
     group by tu.tenant_id
  )
  select t.id,
         t.name,
         t.phone,
         t.subscription_status,
         coalesce(t.setup_status,'approved'),
         s.plan_code,
         coalesce(s.provider_status,s.status),
         coalesce(os.orders_90d,0),
         coalesce(os.revenue_90d,0),
         os.last_activity,
         1 + coalesce(us.member_users,0)
    from public.tenants t
    left join public.subscriptions s on s.tenant_id=t.id
    left join order_stats os on os.tenant_id=t.id
    left join user_stats us on us.tenant_id=t.id
   order by t.created_at desc;
end;
$$;

revoke all on function public.admin_customer_overview() from public;
grant execute on function public.admin_customer_overview() to authenticated;
