alter table if exists public.billing_transactions
  add column if not exists provider text not null default 'mercadopago',
  add column if not exists currency text not null default 'BRL',
  add column if not exists checkout_url text,
  add column if not exists occurred_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists billing_transactions_provider_status_idx
  on public.billing_transactions(provider, status, created_at desc);

create index if not exists billing_transactions_external_reference_idx
  on public.billing_transactions(external_reference, created_at desc);

alter table if exists public.subscriptions
  add column if not exists checkout_url text,
  add column if not exists payer_email text,
  add column if not exists provider_status text;

comment on column public.billing_transactions.provider is
  'Payment provider that owns the external identifier and webhook lifecycle.';
