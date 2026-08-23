-- Sr. Padeiro V1 — base schema
-- Aplicar primeiro em ambiente de homologação e revisar RLS antes de produção.

create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','cashier')),
  primary key (organization_id,user_id)
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  barcode text,
  category_id uuid references categories(id) on delete set null,
  unit text not null default 'UN' check (unit in ('UN','KG','G','L','ML','PACOTE','CAIXA')),
  sale_price numeric(14,2) not null check (sale_price >= 0),
  cost_price numeric(14,2) check (cost_price is null or cost_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inventory (
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity numeric(14,3) not null default 0,
  minimum_quantity numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(),
  primary key(store_id,product_id)
);

create table if not exists cash_registers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  opened_by uuid not null references auth.users(id),
  opened_at timestamptz not null default now(),
  opening_amount numeric(14,2) not null default 0,
  closed_at timestamptz,
  counted_amount numeric(14,2),
  expected_amount numeric(14,2),
  status text not null default 'open' check (status in ('open','closed'))
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  cash_register_id uuid references cash_registers(id),
  customer_id uuid references customers(id),
  seller_id uuid not null references auth.users(id),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null check (total >= 0),
  status text not null default 'completed' check (status in ('completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  total numeric(14,2) not null check (total >= 0)
);

create table if not exists sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  method text not null check (method in ('cash','pix','debit','credit','credit_book')),
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  cash_register_id uuid references cash_registers(id),
  description text not null,
  category text,
  amount numeric(14,2) not null check (amount > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id),
  movement_type text not null check (movement_type in ('sale','purchase','adjustment','return')),
  quantity numeric(14,3) not null,
  reference_id uuid,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  sale_id uuid references sales(id),
  transaction_type text not null check (transaction_type in ('charge','payment','adjustment')),
  amount numeric(14,2) not null check (amount > 0),
  due_date date,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_products_org on products(organization_id);
create index if not exists idx_sales_org_created on sales(organization_id,created_at desc);
create index if not exists idx_inventory_org_product on inventory(product_id);
create index if not exists idx_credit_customer on credit_transactions(customer_id,created_at desc);

-- Helper usado pelas policies.
create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

alter table organizations enable row level security;
alter table stores enable row level security;
alter table organization_members enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table cash_registers enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;
alter table inventory_movements enable row level security;
alter table credit_transactions enable row level security;

create policy "members read organizations" on organizations for select using (public.is_org_member(id));
create policy "members stores" on stores for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members categories" on categories for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members products" on products for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members registers" on cash_registers for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members customers" on customers for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members sales" on sales for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members expenses" on expenses for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members inventory movements" on inventory_movements for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members credit" on credit_transactions for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

-- Observação: inventory, sale_items e sale_payments exigem policies relacionais
-- por store/sale antes da ativação em produção. Mantidos fora do enable RLS nesta
-- primeira fundação para não publicar policies incompletas inadvertidamente.
