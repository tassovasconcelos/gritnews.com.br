\set ON_ERROR_STOP on

-- Disposable PostgreSQL database only. Match the v1 roles and policy contract.
create role anon;
create role authenticated;
create role service_role bypassrls;

create table public.cip_ops_usage_events (id bigint primary key);
create table public.cip_ops_billing_snapshots (
 id bigint generated always as identity primary key,
 company_id text not null,
 provider text not null,
 observed_at timestamptz not null,
 source text not null,
 period_month date not null,
 month_spend_usd numeric(16,4),
 reference_label text not null
);
alter table public.cip_ops_billing_snapshots enable row level security;
grant select on public.cip_ops_billing_snapshots to authenticated;
create policy company_read on public.cip_ops_billing_snapshots to authenticated
 using (company_id = current_setting('cip.test_company',true));

\ir central-consumo-faturamento-v2.sql

set role service_role;
insert into public.cip_ops_billing_snapshots
 (company_id,provider,observed_at,source,period_month,month_spend_usd,reference_label)
values
 ('shopping_prohospital','openai','2026-11-25 10:00Z','provider_api','2026-11-01',5,'report 1'),
 ('shopping_prohospital','openai','2026-11-26 10:00Z','provider_api','2026-11-01',10,'report 2'),
 ('shopping_prohospital','openai','2026-11-26 10:00Z','provider_api','2026-11-01',10,'retry'),
 ('shopping_prohospital','openai','2026-11-27 10:00Z','invoice','2026-11-01',12,'invoice'),
 ('shopping_prohospital','openai','2026-11-27 10:00Z','manual','2026-11-01',99,'manual'),
 ('distribuidora_prohospital','openai','2026-11-27 10:00Z','provider_api','2026-11-01',22,'other tenant')
on conflict (company_id,provider,source,observed_at,period_month) do nothing;
reset role;

set role authenticated;
set cip.test_company = 'shopping_prohospital';
do $$
begin
 if (select count(*) from public.cip_ops_billing_snapshots) <> 4 then
   raise exception 'Expected four eligible rows after deduplication';
 end if;
 if (select array_agg(month_spend_usd order by source) from public.cip_ops_verified_monthly_spend)
    is distinct from array[12,10]::numeric[] then
   raise exception 'Expected the invoice and latest provider report, excluding manual and other tenant';
 end if;
end $$;

set cip.test_company = 'distribuidora_prohospital';
do $$
begin
 if (select array_agg(month_spend_usd) from public.cip_ops_verified_monthly_spend)
    is distinct from array[22]::numeric[] then
   raise exception 'Unexpected data for Distribuidora';
 end if;
end $$;

set cip.test_company = 'no_membership';
do $$
begin
 if exists (select 1 from public.cip_ops_verified_monthly_spend) then
   raise exception 'Unexpected data without company membership';
 end if;
end $$;
reset role;

do $$
begin
 if has_table_privilege('anon','public.cip_ops_verified_monthly_spend','SELECT') then
   raise exception 'Anonymous access granted';
 end if;
end $$;
