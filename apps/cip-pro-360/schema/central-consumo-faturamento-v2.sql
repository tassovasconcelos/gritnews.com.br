-- Apply after central-consumo-operacional-v1.sql. No production data is seeded.
begin;

create unique index cip_ops_billing_observation_key
 on public.cip_ops_billing_snapshots(company_id,provider,source,observed_at,period_month);

alter table public.cip_ops_usage_events
 add column reasoning_tokens bigint check (reasoning_tokens >= 0),
 add column latency_ms integer check (latency_ms >= 0);

grant insert on public.cip_ops_billing_snapshots to service_role;
grant select(company_id,provider,source,observed_at,period_month)
 on public.cip_ops_billing_snapshots to service_role;

create view public.cip_ops_verified_monthly_spend
 with (security_invoker=true,security_barrier=true) as
select distinct on (company_id,provider,period_month,source)
 company_id,provider,period_month,source,observed_at,month_spend_usd,reference_label
from public.cip_ops_billing_snapshots
where source in ('provider_api','invoice') and month_spend_usd is not null
order by company_id,provider,period_month,source,observed_at desc,id desc;

revoke all on public.cip_ops_verified_monthly_spend from public,anon;
grant select on public.cip_ops_verified_monthly_spend to authenticated;

comment on view public.cip_ops_verified_monthly_spend is
 'Provider usage cost and invoice totals are separate figures that can overlap. Never sum them together.';

commit;
