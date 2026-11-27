-- CIP360 · Provider Billing Connectors v1 · org accounts are NEVER duplicated into company spend.
-- Read-only provider ingestion through private service-role Edge Function; no secrets or raw payloads in DB.
create or replace function public.cip_ops_global_can_view()
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(
  select 1 from public.cip_profiles p
  where p.user_id=(select auth.uid()) and p.active and p.role='superadm'
 );
$$;
revoke all on function public.cip_ops_global_can_view() from public,anon;
grant execute on function public.cip_ops_global_can_view() to authenticated;

create table if not exists public.cip_ops_global_billing_snapshots(
 id uuid primary key default gen_random_uuid(),
 provider text not null check(provider in ('openai','anthropic','dataforseo','deepseek')),
 account_ref text not null default 'primary' check(length(account_ref) between 1 and 60),
 observed_at timestamptz not null default now(),
 period_month date not null,
 month_spend_usd numeric(18,6) check(month_spend_usd is null or month_spend_usd>=0),
 credit_balance numeric(18,6),
 credit_currency text check(credit_currency is null or credit_currency in ('USD','CNY')),
 credit_available boolean,
 cost_basis text not null check(cost_basis in ('api_reported_cost','api_reported_precredits','balance_only')),
 report_through timestamptz,
 source text not null default 'provider_api' check(source='provider_api'),
 account_scope text not null default 'organization' check(account_scope='organization'),
 created_at timestamptz not null default now(),
 check(month_spend_usd is not null or credit_balance is not null),
 check((credit_balance is null and credit_currency is null) or (credit_balance is not null and credit_currency is not null)),
 check((cost_basis='balance_only' and month_spend_usd is null)
       or (cost_basis in ('api_reported_cost','api_reported_precredits') and month_spend_usd is not null)),
 unique(provider,account_ref,observed_at)
);
create index if not exists cip_ops_global_billing_recent_idx
 on public.cip_ops_global_billing_snapshots(provider,account_ref,observed_at desc);
alter table public.cip_ops_global_billing_snapshots enable row level security;
revoke all on public.cip_ops_global_billing_snapshots from public,anon,authenticated;
grant select on public.cip_ops_global_billing_snapshots to authenticated;
create policy cip_ops_global_billing_read on public.cip_ops_global_billing_snapshots
 for select to authenticated using(public.cip_ops_global_can_view());

create table if not exists public.cip_ops_global_provider_sync(
 provider text primary key check(provider in ('openai','anthropic','dataforseo','deepseek')),
 account_ref text not null default 'primary',
 state text not null default 'not_configured'
  check(state in ('not_configured','success','rate_limited','unauthorized','failed','provider_unavailable','invalid_response')),
 last_attempt_at timestamptz,
 last_success_at timestamptz,
 next_retry_at timestamptz,
 last_error_code text check(last_error_code is null or length(last_error_code)<70),
 latest_report_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.cip_ops_global_provider_sync enable row level security;
revoke all on public.cip_ops_global_provider_sync from public,anon,authenticated;
grant select on public.cip_ops_global_provider_sync to authenticated;
create policy cip_ops_global_sync_read on public.cip_ops_global_provider_sync
 for select to authenticated using(public.cip_ops_global_can_view());

insert into public.cip_ops_global_provider_sync(provider,state)
values ('openai','not_configured'),('anthropic','not_configured'),
('dataforseo','not_configured'),('deepseek','not_configured')
on conflict(provider) do nothing;

create or replace view public.cip_ops_global_billing_current
 with (security_invoker=true,security_barrier=true)
as
select distinct on (s.provider,s.account_ref)
 s.provider,s.account_ref,s.account_scope,s.observed_at,s.period_month,
 s.month_spend_usd,s.credit_balance,s.credit_currency,
 s.credit_available,s.cost_basis,s.report_through,s.source
from public.cip_ops_global_billing_snapshots s
order by s.provider,s.account_ref,s.observed_at desc;
revoke all on public.cip_ops_global_billing_current from public,anon;
grant select on public.cip_ops_global_billing_current to authenticated;

-- Future validated attribution only. Does not distribute global totals to companies on its own.
create table if not exists public.cip_ops_billing_scope_map(
 id bigint generated always as identity primary key,
 provider text not null check(provider in ('openai','anthropic','dataforseo','deepseek')),
 account_ref text not null default 'primary',
 scope_type text not null check(scope_type in ('project','workspace','api_key')),
 external_scope_id text not null check(length(external_scope_id) between 3 and 150),
 company_id text not null references public.cip_companies(id),
 approved_at timestamptz not null default now(),
 approved_by uuid references auth.users(id),
 status text not null default 'pending' check(status in ('pending','approved','revoked')),
 unique(provider,account_ref,scope_type,external_scope_id)
);
alter table public.cip_ops_billing_scope_map enable row level security;
revoke all on public.cip_ops_billing_scope_map from public,anon,authenticated;
grant select on public.cip_ops_billing_scope_map to authenticated;
create policy cip_ops_billing_map_read on public.cip_ops_billing_scope_map
 for select to authenticated using(public.cip_ops_global_can_view());
-- This mapping requires independent approval and source-level cost grouping. No automatic attribution until then.

comment on table public.cip_ops_global_billing_snapshots is
 'Organization-scope reports. DO NOT add them to Shopping and Distribuidora separately. Cost may be pre-credit, partial or delayed, not final invoice.';
comment on table public.cip_ops_global_provider_sync is
 'Only sanitized status, no response body, token, login or API secret.';
comment on table public.cip_ops_billing_scope_map is
 'Approved per-project/workspace mappings for future attribution. No automatic equal split or duplicated company charges.';

-- Safeguards: company-facing API views must not include global provider reports.
-- Existing cip_ops_billing_current continues to represent only company-specific, attributable snapshots.
