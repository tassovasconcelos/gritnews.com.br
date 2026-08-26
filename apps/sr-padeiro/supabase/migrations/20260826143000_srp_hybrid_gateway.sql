alter table public.srp_billing_transactions
  add column if not exists provider text not null default 'mercadopago';

create index if not exists srp_billing_transactions_provider_status_idx
  on public.srp_billing_transactions(provider, status, created_at desc);

comment on column public.srp_billing_transactions.provider is
  'Payment provider that owns the external identifier and webhook lifecycle.';
