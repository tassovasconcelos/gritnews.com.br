-- Additive hardening scoped exclusively to Performance. Apply transactionally.
begin;
create or replace function public.cip_perf_can_read(p_company text)
returns boolean language sql stable security invoker set search_path='' as $$
 select p_company in ('shopping_prohospital','distribuidora_prohospital')
 and public.cip_can_access(p_company,false) and exists(
 select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active
 and p.role in ('superadm','diretoria','gestor'));
$$;
create or replace function public.cip_perf_can_submit(p_company text)
returns boolean language sql stable security invoker set search_path='' as $$
 select public.cip_perf_can_read(p_company) and exists(
 select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active
 and (p.role='superadm' or (p.role='diretoria' and exists(
 select 1 from public.cip_memberships m where m.user_id=p.user_id
 and m.company_id=p_company and m.active and m.role='diretoria'))));
$$;
revoke all on function public.cip_perf_can_read(text),public.cip_perf_can_submit(text) from public,anon;
grant execute on function public.cip_perf_can_read(text),public.cip_perf_can_submit(text) to authenticated;

-- Case/whitespace variants must not create a second economic origin.
create unique index cip_perf_financial_origin_canonical
 on public.cip_perf_financial_events(lower(btrim(source_key)));

-- A client cannot certify its own manual data as ERP-conciliated or instrumented.
create policy perf_kpi_manual_insert on public.cip_perf_kpi_records as restrictive
 for insert to authenticated with check(source_kind='manual' and length(btrim(evidence)) between 12 and 2000);
create policy perf_kpi_manual_update on public.cip_perf_kpi_records as restrictive
 for update to authenticated using(source_kind='manual')
 with check(source_kind='manual' and length(btrim(evidence)) between 12 and 2000);
create policy perf_process_manual_insert on public.cip_perf_process_samples as restrictive
 for insert to authenticated with check(source_kind='manual' and length(btrim(evidence)) between 12 and 2000);
create policy perf_agent_manual_insert on public.cip_perf_agent_samples as restrictive
 for insert to authenticated with check(source_kind='manual' and length(btrim(evidence)) between 12 and 2000);

-- NaN is a valid PostgreSQL numeric, but never a valid measurement.
alter table public.cip_perf_kpi_records add constraint perf_kpi_finite check(
 baseline::text not in ('NaN','Infinity','-Infinity') and target::text not in ('NaN','Infinity','-Infinity')
 and actual::text not in ('NaN','Infinity','-Infinity'));
alter table public.cip_perf_financial_events add constraint perf_financial_finite check(
 gross_value::text not in ('NaN','Infinity','-Infinity') and incremental_cost::text not in ('NaN','Infinity','-Infinity')
 and reversals::text not in ('NaN','Infinity','-Infinity'));
commit;
