-- Padroniza o pacote comercial do Sr. Padeiro com o Meu Espetinho:
-- implantação única de R$ 199 e recorrência mensal de R$ 89.
alter table public.srp_organizations
  add column if not exists activation_paid_at timestamptz;

alter table public.srp_subscriptions
  alter column plan_code set default 'sr_padeiro_89',
  alter column monthly_amount set default 89;

update public.srp_subscriptions
   set plan_code='sr_padeiro_89', monthly_amount=89, updated_at=now()
 where status='pending' and provider_subscription_id is null;

alter table public.srp_billing_transactions
  add column if not exists kind text not null default 'subscription',
  add column if not exists checkout_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.srp_billing_transactions
  drop constraint if exists srp_billing_transactions_kind_check;
alter table public.srp_billing_transactions
  add constraint srp_billing_transactions_kind_check
  check (kind in ('activation','subscription'));

create index if not exists srp_billing_kind_status_idx
  on public.srp_billing_transactions(kind,status,created_at desc);

drop policy if exists srp_billing_member_read on public.srp_billing_transactions;
create policy srp_billing_member_read on public.srp_billing_transactions
for select to authenticated using (
  exists(select 1 from public.srp_members m
    where m.organization_id=srp_billing_transactions.organization_id
      and m.user_id=(select auth.uid()) and m.active)
);
