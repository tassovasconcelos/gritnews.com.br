-- Cobrança recorrente isolada do Sr. Padeiro.
create table if not exists public.srp_subscriptions (
  organization_id uuid primary key references public.srp_organizations(id) on delete cascade,
  plan_code text not null default 'sr_padeiro_99',
  provider text not null default 'mercadopago',
  provider_subscription_id text unique,
  status text not null default 'pending' check(status in ('pending','active','past_due','paused','cancelled')),
  provider_status text,
  monthly_amount numeric(12,2) not null default 99 check(monthly_amount>0),
  payer_email text,
  checkout_url text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.srp_billing_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.srp_organizations(id) on delete cascade,
  provider_id text not null unique,
  provider_subscription_id text,
  status text not null,
  amount numeric(12,2) not null check(amount>=0),
  currency text not null default 'BRL',
  external_reference text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists srp_subscriptions_status_idx on public.srp_subscriptions(status,updated_at desc);
create index if not exists srp_billing_org_created_idx on public.srp_billing_transactions(organization_id,created_at desc);

alter table public.srp_subscriptions enable row level security;
alter table public.srp_billing_transactions enable row level security;

drop policy if exists srp_subscriptions_member_read on public.srp_subscriptions;
create policy srp_subscriptions_member_read on public.srp_subscriptions
for select to authenticated using (
  exists(select 1 from public.srp_members m
    where m.organization_id=srp_subscriptions.organization_id
      and m.user_id=(select auth.uid()) and m.active)
);

create unique index if not exists srp_operation_events_subscription_started_idx
  on public.srp_operation_events(organization_id,event_name)
  where organization_id is not null and event_name='subscription_started';

create or replace function public.srp_reconcile_subscription_access()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='active' and old.status is distinct from 'active' then
    update public.srp_access_control
       set access_mode='active',manual_release=false,updated_at=now()
     where organization_id=new.organization_id;
    insert into public.srp_operation_events(organization_id,event_name,entity_type,entity_id,metadata)
    values(new.organization_id,'subscription_started','subscription',new.organization_id,
      jsonb_build_object('plan_code',new.plan_code,'amount',new.monthly_amount,'provider',new.provider))
    on conflict do nothing;
  elsif new.status='cancelled' and old.status is distinct from 'cancelled' then
    update public.srp_access_control
       set access_mode='cancelled',manual_release=false,updated_at=now()
     where organization_id=new.organization_id;
    insert into public.srp_operation_events(organization_id,event_name,entity_type,entity_id,metadata)
    values(new.organization_id,'subscription_cancelled','subscription',new.organization_id,
      jsonb_build_object('plan_code',new.plan_code,'provider',new.provider));
  end if;
  return new;
end;
$$;
revoke all on function public.srp_reconcile_subscription_access() from public,anon,authenticated;

drop trigger if exists srp_subscription_reconcile_access on public.srp_subscriptions;
create trigger srp_subscription_reconcile_access
after insert or update of status on public.srp_subscriptions
for each row execute function public.srp_reconcile_subscription_access();
