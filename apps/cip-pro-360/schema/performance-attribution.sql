-- Explicit attribution is required; there is no default attribution to CIP.
begin;
alter table public.cip_perf_financial_events
 add column cip_action_ref text not null check(length(btrim(cip_action_ref)) between 8 and 250),
 add column baseline_reference text not null check(length(btrim(baseline_reference)) between 12 and 2000),
 add column attribution_pct numeric(7,4) not null check(attribution_pct between 0 and 100 and attribution_pct::text<>'NaN');
comment on column public.cip_perf_financial_events.attribution_pct is
 'Explicit documented share of gross incremental benefit attributable to CIP. Deduct all incremental costs and reversals after attribution. No automatic financial certification.';
commit;
