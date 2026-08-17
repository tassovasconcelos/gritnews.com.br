-- Cliente 360: acesso real, inatividade e administração segura da equipe.
drop function if exists public.admin_customer_overview();
create function public.admin_customer_overview()
returns table(
  tenant_id uuid,tenant_name text,phone text,subscription_status text,setup_status text,
  plan_code text,provider_status text,orders_90d bigint,revenue_90d numeric,
  last_activity timestamptz,active_users bigint,courtesy_type text,
  courtesy_started_at timestamptz,courtesy_ends_at timestamptz,
  products_count bigint,customers_count bigint,open_orders bigint,
  credit_balance numeric,low_stock_products bigint,last_access_at timestamptz,inactive_days integer
)
language plpgsql security definer set search_path=public,auth as $$
begin
  if not exists(select 1 from public.admin_users where user_id=auth.uid() and active=true) then
    raise exception 'forbidden';
  end if;
  return query
  with order_stats as (
    select o.tenant_id,count(*) filter(where o.opened_at>=now()-interval '90 days') orders_90d,
      coalesce(sum(o.total) filter(where o.opened_at>=now()-interval '90 days' and o.status='closed'),0)::numeric revenue_90d,
      max(o.opened_at) last_activity,count(*) filter(where o.status='open') open_orders
    from public.orders o group by o.tenant_id
  ), user_stats as (
    select tu.tenant_id,count(*) filter(where tu.active=true) member_users
    from public.tenant_users tu group by tu.tenant_id
  ), access_stats as (
    select x.tenant_id,max(au.last_sign_in_at) last_access_at
    from (
      select t.id tenant_id,t.owner_user_id user_id from public.tenants t
      union all
      select tu.tenant_id,tu.user_id from public.tenant_users tu where tu.active=true
    ) x left join auth.users au on au.id=x.user_id group by x.tenant_id
  ), product_stats as (
    select p.tenant_id,count(*) filter(where p.active=true) products_count,
      count(*) filter(where p.active=true and p.stock_qty<=8) low_stock_products
    from public.products p group by p.tenant_id
  ), customer_stats as (
    select c.tenant_id,count(*) customers_count from public.customers c group by c.tenant_id
  ), credit_stats as (
    select cb.tenant_id,coalesce(sum(greatest(cb.balance,0)),0)::numeric credit_balance
    from public.customer_credit_balances cb group by cb.tenant_id
  )
  select t.id,t.name,t.phone,t.subscription_status,coalesce(t.setup_status,'approved'),
    s.plan_code,coalesce(s.provider_status,s.status),coalesce(os.orders_90d,0),
    coalesce(os.revenue_90d,0),os.last_activity,1+coalesce(us.member_users,0),
    t.courtesy_type,t.courtesy_started_at,t.courtesy_ends_at,
    coalesce(ps.products_count,0),coalesce(cs.customers_count,0),coalesce(os.open_orders,0),
    coalesce(cr.credit_balance,0),coalesce(ps.low_stock_products,0),a.last_access_at,
    greatest(0,floor(extract(epoch from (now()-coalesce(a.last_access_at,t.created_at)))/86400)::integer)
  from public.tenants t
  left join public.subscriptions s on s.tenant_id=t.id
  left join order_stats os on os.tenant_id=t.id left join user_stats us on us.tenant_id=t.id
  left join access_stats a on a.tenant_id=t.id left join product_stats ps on ps.tenant_id=t.id
  left join customer_stats cs on cs.tenant_id=t.id left join credit_stats cr on cr.tenant_id=t.id
  order by t.created_at desc;
end;
$$;
revoke all on function public.admin_customer_overview() from public,anon;
grant execute on function public.admin_customer_overview() to authenticated,service_role;

create or replace function public.manage_tenant_user_status(p_tenant_id uuid,p_user_id uuid,p_active boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_role text; v_owner uuid;
begin
  select owner_user_id into v_owner from public.tenants where id=p_tenant_id;
  if v_owner is null then raise exception 'tenant_not_found'; end if;
  if p_user_id=v_owner then raise exception 'owner_cannot_be_disabled'; end if;
  select role into v_role from public.tenant_users where tenant_id=p_tenant_id and user_id=auth.uid() and active=true;
  if auth.uid()<>v_owner and coalesce(v_role,'')<>'manager'
     and not exists(select 1 from public.admin_users where user_id=auth.uid() and active=true)
     and not exists(select 1 from public.support_access_grants where admin_user_id=auth.uid() and tenant_id=p_tenant_id and revoked_at is null and expires_at>now()) then
    raise exception 'forbidden';
  end if;
  update public.tenant_users set active=p_active where tenant_id=p_tenant_id and user_id=p_user_id;
  if not found then raise exception 'member_not_found'; end if;
  return jsonb_build_object('ok',true,'active',p_active);
end;
$$;
revoke all on function public.manage_tenant_user_status(uuid,uuid,boolean) from public,anon;
grant execute on function public.manage_tenant_user_status(uuid,uuid,boolean) to authenticated,service_role;
