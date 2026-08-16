create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text unique not null,
  logo_url text,
  address text,
  phone text,
  primary_color text default '#f97316',
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '3 days'),
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing','pending','active','past_due','paused','cancelled','expired')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_users (
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'attendant' check (role in ('owner','manager','cashier','attendant')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  label text not null,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  total numeric(12,2) not null check (total >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.payments_received (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null check (method in ('cash','pix','credit_card','debit_card','other')),
  amount numeric(12,2) not null check (amount > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  opening_amount numeric(12,2) not null default 0 check (opening_amount >= 0),
  closing_amount numeric(12,2) check (closing_amount is null or closing_amount >= 0),
  status text not null default 'open' check (status in ('open','closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  type text not null check (type in ('sale','supply','withdrawal','expense')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  plan_code text not null default 'essential',
  provider text not null default 'mercadopago',
  provider_subscription_id text,
  status text not null default 'trialing' check (status in ('trialing','pending','active','past_due','paused','cancelled','expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  device_key text not null,
  platform text,
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, device_key)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tenants_owner_user_id_idx on public.tenants(owner_user_id);
create index if not exists tenant_users_user_id_idx on public.tenant_users(user_id);
create index if not exists categories_tenant_id_idx on public.categories(tenant_id);
create index if not exists products_tenant_id_idx on public.products(tenant_id);
create index if not exists customers_tenant_id_idx on public.customers(tenant_id);
create index if not exists orders_tenant_id_idx on public.orders(tenant_id);
create index if not exists orders_status_idx on public.orders(tenant_id, status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists payments_received_order_id_idx on public.payments_received(order_id);
create index if not exists cash_registers_tenant_id_idx on public.cash_registers(tenant_id);
create index if not exists cash_movements_register_id_idx on public.cash_movements(cash_register_id);
create index if not exists devices_tenant_id_idx on public.devices(tenant_id);
create index if not exists audit_logs_tenant_id_created_at_idx on public.audit_logs(tenant_id, created_at desc);

create or replace function private.user_has_tenant_access(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.tenant_id = target_tenant
      and tu.user_id = (select auth.uid())
      and tu.active = true
  ) or exists (
    select 1
    from public.tenants t
    where t.id = target_tenant
      and t.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function private.user_has_tenant_access(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.user_has_tenant_access(uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments_received enable row level security;
alter table public.cash_registers enable row level security;
alter table public.cash_movements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.devices enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "users manage own profile" on public.profiles;
create policy "users manage own profile" on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "authenticated users create own tenant" on public.tenants;
create policy "authenticated users create own tenant" on public.tenants
for insert to authenticated
with check (owner_user_id = (select auth.uid()));

drop policy if exists "tenant members can read tenant" on public.tenants;
create policy "tenant members can read tenant" on public.tenants
for select to authenticated
using (owner_user_id = (select auth.uid()) or (select private.user_has_tenant_access(id)));

drop policy if exists "tenant owner can update tenant" on public.tenants;
create policy "tenant owner can update tenant" on public.tenants
for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

drop policy if exists "tenant owner can delete tenant" on public.tenants;
create policy "tenant owner can delete tenant" on public.tenants
for delete to authenticated
using (owner_user_id = (select auth.uid()));

drop policy if exists "tenant users can read memberships" on public.tenant_users;
create policy "tenant users can read memberships" on public.tenant_users
for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.tenants t
  where t.id = tenant_id and t.owner_user_id = (select auth.uid())
));

drop policy if exists "tenant owner manages memberships" on public.tenant_users;
create policy "tenant owner manages memberships" on public.tenant_users
for all to authenticated
using (exists (
  select 1 from public.tenants t
  where t.id = tenant_id and t.owner_user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.tenants t
  where t.id = tenant_id and t.owner_user_id = (select auth.uid())
));

drop policy if exists "tenant members manage products" on public.products;
create policy "tenant members manage products" on public.products
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage categories" on public.categories;
create policy "tenant members manage categories" on public.categories
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage customers" on public.customers;
create policy "tenant members manage customers" on public.customers
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage orders" on public.orders;
create policy "tenant members manage orders" on public.orders
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage order items" on public.order_items;
create policy "tenant members manage order items" on public.order_items
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage received payments" on public.payments_received;
create policy "tenant members manage received payments" on public.payments_received
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage cash registers" on public.cash_registers;
create policy "tenant members manage cash registers" on public.cash_registers
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage cash movements" on public.cash_movements;
create policy "tenant members manage cash movements" on public.cash_movements
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members can read subscriptions" on public.subscriptions;
create policy "tenant members can read subscriptions" on public.subscriptions
for select to authenticated using ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage devices" on public.devices;
create policy "tenant members manage devices" on public.devices
for all to authenticated using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members can read audit logs" on public.audit_logs;
create policy "tenant members can read audit logs" on public.audit_logs
for select to authenticated using ((select private.user_has_tenant_access(tenant_id)));

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.tenants,
  public.profiles,
  public.tenant_users,
  public.categories,
  public.products,
  public.customers,
  public.orders,
  public.order_items,
  public.payments_received,
  public.cash_registers,
  public.cash_movements,
  public.devices
to authenticated;

grant select on table public.subscriptions, public.audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;
