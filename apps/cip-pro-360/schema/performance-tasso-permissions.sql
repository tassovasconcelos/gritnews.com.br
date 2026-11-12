-- CIP performance permission hardening: prevent inherited PUBLIC/anon privileges.
revoke all on table public.cip_perf_catalog,public.cip_perf_kpi_records,public.cip_perf_process_samples,
 public.cip_perf_agent_samples,public.cip_perf_financial_events,public.cip_perf_reviewers,
 public.cip_perf_financial_approvals from public,anon,authenticated;
grant select on table public.cip_perf_catalog to authenticated;
grant select,insert on table public.cip_perf_kpi_records to authenticated;
grant update(baseline,target,actual,source_kind,evidence,notes,updated_at) on table public.cip_perf_kpi_records to authenticated;
grant select,insert on table public.cip_perf_process_samples,public.cip_perf_agent_samples,public.cip_perf_financial_events to authenticated;
grant select on table public.cip_perf_reviewers to authenticated;
grant select,insert on table public.cip_perf_financial_approvals to authenticated;
