-- Meu Espetinho — Foundation hardening
-- Versiona no GitHub as estruturas já consumidas pela aplicação atual.

create table if not exists public.customer_credit_accounts (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  enabled boolean not null default false,
  credit_limit numeric(12,2),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (credit_limit is null or credit_limit >= 0)
);

create table if not exists public.customer_credit_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  entry_type text not null check (entry_type in ('charge','payment','adjustment')),
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_activity_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists settlement_status text not null default 'open';

create unique index if not exists order_items_order_product_uidx
  on public.order_items(order_id, product_id)
  where product_id is not null;
create index if not exists customer_credit_entries_customer_idx on public.customer_credit_entries(tenant_id, customer_id, created_at desc);
create index if not exists order_activity_logs_order_idx on public.order_activity_logs(tenant_id, order_id, created_at);

alter table public.customer_credit_accounts enable row level security;
alter table public.customer_credit_entries enable row level security;
alter table public.order_activity_logs enable row level security;

drop policy if exists "tenant members manage customer credit accounts" on public.customer_credit_accounts;
create policy "tenant members manage customer credit accounts" on public.customer_credit_accounts
for all to authenticated
using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members manage customer credit entries" on public.customer_credit_entries;
create policy "tenant members manage customer credit entries" on public.customer_credit_entries
for all to authenticated
using ((select private.user_has_tenant_access(tenant_id)))
with check ((select private.user_has_tenant_access(tenant_id)));

drop policy if exists "tenant members read order activity" on public.order_activity_logs;
create policy "tenant members read order activity" on public.order_activity_logs
for select to authenticated
using ((select private.user_has_tenant_access(tenant_id)));

grant select, insert, update, delete on table public.customer_credit_accounts, public.customer_credit_entries to authenticated;
grant select on table public.order_activity_logs to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- Resolve o tenant do usuário explicitamente, evitando depender de um SELECT genérico no frontend.
create or replace function public.current_user_tenants()
returns table (
  id uuid,
  name text,
  subscription_status text,
  trial_ends_at timestamptz,
  setup_status text,
  is_owner boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select t.id, t.name, t.subscription_status, t.trial_ends_at,
         coalesce((to_jsonb(t)->>'setup_status'),'approved') as setup_status,
         (t.owner_user_id = auth.uid()) as is_owner
  from public.tenants t
  where t.owner_user_id = auth.uid()
     or exists (
       select 1 from public.tenant_users tu
       where tu.tenant_id = t.id
         and tu.user_id = auth.uid()
         and tu.active = true
     )
  order by (t.owner_user_id = auth.uid()) desc, t.created_at asc;
$$;

grant execute on function public.current_user_tenants() to authenticated;

-- Fechamento financeiro atômico: pedido e pagamento/fiado são persistidos na mesma transação.
create or replace function public.close_order_atomic(
  p_tenant_id uuid,
  p_order_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_method text,
  p_customer_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_label text;
begin
  if not private.user_has_tenant_access(p_tenant_id) then
    raise exception 'forbidden';
  end if;
  if p_user_id <> auth.uid() then
    raise exception 'invalid_user';
  end if;
  if p_amount < 0 then
    raise exception 'invalid_amount';
  end if;

  select label into v_label
  from public.orders
  where id = p_order_id and tenant_id = p_tenant_id and status = 'open'
  for update;

  if v_label is null then
    raise exception 'order_not_open';
  end if;

  update public.orders
     set status = 'closed',
         settlement_status = case when p_method = 'fiado' then 'credit' else 'paid' end,
         subtotal = p_amount,
         total = p_amount,
         closed_by = p_user_id,
         closed_at = now()
   where id = p_order_id and tenant_id = p_tenant_id;

  if p_method = 'fiado' then
    if p_customer_id is null then
      raise exception 'customer_required';
    end if;
    insert into public.customer_credit_entries
      (tenant_id, customer_id, order_id, entry_type, amount, description, created_by)
    values
      (p_tenant_id, p_customer_id, p_order_id, 'charge', p_amount, 'Venda fiada - ' || v_label, p_user_id);
  elsif p_amount > 0 then
    insert into public.payments_received
      (tenant_id, order_id, method, amount, created_by)
    values
      (p_tenant_id, p_order_id, p_method, p_amount, p_user_id);
  end if;

  insert into public.audit_logs(tenant_id, user_id, action, entity, entity_id, metadata)
  values (p_tenant_id, p_user_id, 'order_closed', 'order', p_order_id::text,
          jsonb_build_object('amount',p_amount,'method',p_method));

  return jsonb_build_object('ok',true,'order_id',p_order_id);
end;
$$;

grant execute on function public.close_order_atomic(uuid,uuid,uuid,numeric,text,uuid) to authenticated;
