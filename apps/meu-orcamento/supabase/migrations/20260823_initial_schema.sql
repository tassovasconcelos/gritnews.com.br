create extension if not exists pgcrypto;

create table if not exists public.morc_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  logo_url text,
  primary_color text default '#145EDB',
  phone text,
  email text,
  document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.morc_members (
  organization_id uuid not null references public.morc_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','seller','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table if not exists public.morc_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.morc_organizations(id) on delete cascade,
  name text not null,
  company_name text,
  document text,
  email text,
  phone text,
  city text,
  state text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.morc_catalog_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.morc_organizations(id) on delete cascade,
  type text not null default 'service' check (type in ('product','service')),
  name text not null,
  description text,
  unit text not null default 'un',
  sale_price numeric(14,2) not null default 0 check (sale_price >= 0),
  cost_price numeric(14,2) check (cost_price is null or cost_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.morc_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.morc_organizations(id) on delete cascade,
  customer_id uuid references public.morc_customers(id) on delete set null,
  quote_number bigint not null,
  status text not null default 'draft' check (status in ('draft','sent','viewed','negotiation','approved','lost','expired')),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0 check (discount >= 0),
  freight numeric(14,2) not null default 0 check (freight >= 0),
  total numeric(14,2) not null default 0,
  valid_until date,
  terms text,
  notes text,
  public_token uuid not null default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz,
  lost_reason text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,quote_number),
  unique (public_token)
);

create table if not exists public.morc_quote_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.morc_organizations(id) on delete cascade,
  quote_id uuid not null references public.morc_quotes(id) on delete cascade,
  catalog_item_id uuid references public.morc_catalog_items(id) on delete set null,
  description text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null default 'un',
  unit_price numeric(14,2) not null check (unit_price >= 0),
  total numeric(14,2) not null check (total >= 0),
  sort_order integer not null default 0
);

create table if not exists public.morc_quote_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.morc_organizations(id) on delete cascade,
  quote_id uuid not null references public.morc_quotes(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.morc_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.morc_organizations(id) on delete cascade,
  quote_id uuid references public.morc_quotes(id) on delete cascade,
  customer_id uuid references public.morc_customers(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  completed_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists morc_quotes_org_status_idx on public.morc_quotes(organization_id,status,created_at desc);
create index if not exists morc_tasks_org_due_idx on public.morc_tasks(organization_id,due_at) where completed_at is null;
create index if not exists morc_customers_org_phone_idx on public.morc_customers(organization_id,phone);

create or replace function public.morc_has_access(org_id uuid)
returns boolean language sql stable security invoker set search_path='' as $$
  select exists(
    select 1 from public.morc_members m
    where m.organization_id=org_id and m.user_id=(select auth.uid()) and m.active
  ) or exists(
    select 1 from public.morc_organizations o
    where o.id=org_id and o.owner_user_id=(select auth.uid())
  );
$$;

grant execute on function public.morc_has_access(uuid) to authenticated;

create or replace function public.morc_next_quote_number(org_id uuid)
returns bigint language plpgsql security invoker set search_path='' as $$
declare v bigint;
begin
  if not public.morc_has_access(org_id) then raise exception 'Sem acesso à organização'; end if;
  perform pg_advisory_xact_lock(hashtextextended(org_id::text,0));
  select coalesce(max(quote_number),0)+1 into v from public.morc_quotes where organization_id=org_id;
  return v;
end;
$$;

grant execute on function public.morc_next_quote_number(uuid) to authenticated;

create or replace function public.morc_recalculate_quote(p_quote_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare v_org uuid; v_sub numeric(14,2); v_discount numeric(14,2); v_freight numeric(14,2);
begin
  select organization_id,discount,freight into v_org,v_discount,v_freight from public.morc_quotes where id=p_quote_id and deleted_at is null;
  if v_org is null or not public.morc_has_access(v_org) then raise exception 'Orçamento inválido ou sem acesso'; end if;
  select coalesce(sum(total),0) into v_sub from public.morc_quote_items where quote_id=p_quote_id;
  update public.morc_quotes set subtotal=v_sub,total=greatest(v_sub-coalesce(v_discount,0)+coalesce(v_freight,0),0),updated_at=now() where id=p_quote_id;
end;
$$;

grant execute on function public.morc_recalculate_quote(uuid) to authenticated;

alter table public.morc_organizations enable row level security;
alter table public.morc_members enable row level security;
alter table public.morc_customers enable row level security;
alter table public.morc_catalog_items enable row level security;
alter table public.morc_quotes enable row level security;
alter table public.morc_quote_items enable row level security;
alter table public.morc_quote_events enable row level security;
alter table public.morc_tasks enable row level security;

create policy "morc organization access" on public.morc_organizations for select to authenticated using (public.morc_has_access(id));
create policy "morc members access" on public.morc_members for select to authenticated using (public.morc_has_access(organization_id));
create policy "morc customers access" on public.morc_customers for all to authenticated using (public.morc_has_access(organization_id)) with check (public.morc_has_access(organization_id));
create policy "morc catalog access" on public.morc_catalog_items for all to authenticated using (public.morc_has_access(organization_id)) with check (public.morc_has_access(organization_id));
create policy "morc quotes access" on public.morc_quotes for all to authenticated using (public.morc_has_access(organization_id)) with check (public.morc_has_access(organization_id));
create policy "morc quote items access" on public.morc_quote_items for all to authenticated using (public.morc_has_access(organization_id)) with check (public.morc_has_access(organization_id));
create policy "morc quote events read" on public.morc_quote_events for select to authenticated using (public.morc_has_access(organization_id));
create policy "morc quote events insert" on public.morc_quote_events for insert to authenticated with check (public.morc_has_access(organization_id));
create policy "morc tasks access" on public.morc_tasks for all to authenticated using (public.morc_has_access(organization_id)) with check (public.morc_has_access(organization_id));

grant select,insert,update,delete on public.morc_customers,public.morc_catalog_items,public.morc_quotes,public.morc_quote_items,public.morc_tasks to authenticated;
grant select on public.morc_organizations,public.morc_members,public.morc_quote_events to authenticated;
grant insert on public.morc_quote_events to authenticated;
