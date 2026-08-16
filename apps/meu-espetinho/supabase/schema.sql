create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  address text,
  phone text,
  primary_color text default '#f97316',
  trial_started_at timestamptz default now(),
  trial_ends_at timestamptz default (now() + interval '3 days'),
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing','pending','active','past_due','paused','cancelled','expired')),
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.tenant_users (
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'attendant' check (role in ('owner','manager','cashier','attendant')),
  active boolean default true,
  created_at timestamptz default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  cost numeric(12,2),
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  label text not null,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  opened_at timestamptz default now(),
  closed_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity numeric(12,3) not null default 1,
  total numeric(12,2) not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.payments_received (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null check (method in ('cash','pix','credit_card','debit_card','other')),
  amount numeric(12,2) not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  opening_amount numeric(12,2) not null default 0,
  closing_amount numeric(12,2),
  status text not null default 'open' check (status in ('open','closed')),
  opened_at timestamptz default now(),
  closed_at timestamptz
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  type text not null check (type in ('sale','supply','withdrawal','expense')),
  amount numeric(12,2) not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  plan_code text not null default 'essential',
  provider text not null default 'mercadopago',
  provider_subscription_id text,
  status text not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  device_key text not null,
  platform text,
  app_version text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (tenant_id, device_key)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.tenants enable row level security;
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

create or replace function public.user_has_tenant_access(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = target_tenant
      and tu.user_id = auth.uid()
      and tu.active = true
  );
$$;

create policy "tenant members can read tenant" on public.tenants
for select using (public.user_has_tenant_access(id));

create policy "tenant members manage products" on public.products
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage categories" on public.categories
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage customers" on public.customers
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage orders" on public.orders
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage order items" on public.order_items
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage received payments" on public.payments_received
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage cash registers" on public.cash_registers
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage cash movements" on public.cash_movements
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members can read subscriptions" on public.subscriptions
for select using (public.user_has_tenant_access(tenant_id));

create policy "tenant members manage devices" on public.devices
for all using (public.user_has_tenant_access(tenant_id))
with check (public.user_has_tenant_access(tenant_id));

create policy "tenant members can read audit logs" on public.audit_logs
for select using (public.user_has_tenant_access(tenant_id));
