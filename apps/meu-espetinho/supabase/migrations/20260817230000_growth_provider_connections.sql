-- Conexões reais do Growth Engine com provedores de mídia.
create table if not exists public.marketing_provider_connections (
  provider text primary key check (provider in ('google_ads','meta_ads')),
  status text not null default 'disconnected' check (status in ('disconnected','connected','error')),
  account_id text,
  account_name text,
  last_sync_at timestamptz,
  last_error text,
  connected_by uuid references auth.users(id),
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.marketing_provider_connections enable row level security;
drop policy if exists marketing_provider_connections_admin_all on public.marketing_provider_connections;
create policy marketing_provider_connections_admin_all on public.marketing_provider_connections
for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true))
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

alter table public.marketing_campaigns add column if not exists external_adset_id text;
alter table public.marketing_campaigns add column if not exists external_budget_resource text;
alter table public.marketing_campaigns add column if not exists provider_sync_enabled boolean not null default false;
create index if not exists idx_marketing_campaigns_external on public.marketing_campaigns(platform,external_campaign_id) where external_campaign_id is not null;

alter table public.marketing_campaign_metrics add column if not exists provider_conversions numeric(12,2) not null default 0;
alter table public.marketing_campaign_metrics add column if not exists provider_conversion_value numeric(12,2) not null default 0;
alter table public.marketing_campaign_metrics add column if not exists synced_at timestamptz;
