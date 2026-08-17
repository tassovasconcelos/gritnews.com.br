-- Histórico privado dos e-mails de relacionamento enviados pelo Super Admin.
create table if not exists public.admin_customer_emails (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sent_by uuid not null references auth.users(id),
  recipient_email text not null,
  kind text not null check (kind in ('birthday','promotion','offer','custom')),
  subject text not null check (char_length(subject) between 1 and 120),
  message text not null check (char_length(message) between 1 and 3000),
  status text not null check (status in ('sent','failed')),
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists admin_customer_emails_tenant_created_idx
  on public.admin_customer_emails (tenant_id, created_at desc);
create index if not exists admin_customer_emails_sender_created_idx
  on public.admin_customer_emails (sent_by, created_at desc);

alter table public.admin_customer_emails enable row level security;
revoke all on table public.admin_customer_emails from public, anon, authenticated;
grant all on table public.admin_customer_emails to service_role;

