-- Immutable, independently reviewed reversals reopen the original reporting period.
begin;
alter table public.cip_perf_financial_events
 add column event_kind text not null default 'benefit' check(event_kind in ('benefit','reversal')),
 add column reverses_event_id uuid references public.cip_perf_financial_events(id) on delete restrict,
 add constraint perf_reversal_shape check(
 (event_kind='benefit' and reverses_event_id is null) or
 (event_kind='reversal' and reverses_event_id is not null and gross_value=0
 and incremental_cost=0 and attribution_pct=0 and reversals>0));
create index cip_perf_reverses_event_idx on public.cip_perf_financial_events(reverses_event_id);
create function public.cip_perf_check_reversal() returns trigger
language plpgsql security invoker set search_path='' as $$
declare original public.cip_perf_financial_events; reserved numeric;
begin
 if new.event_kind<>'reversal' then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.reverses_event_id::text,0));
 select * into original from public.cip_perf_financial_events where id=new.reverses_event_id;
 if not found or original.event_kind<>'benefit' or original.company_id<>new.company_id
 or original.period_start<>new.period_start or original.period_end<>new.period_end then
 raise exception 'Reversao exige beneficio original da mesma empresa e periodo' using errcode='23514'; end if;
 if (select count(distinct reviewer_id) from public.cip_perf_financial_approvals
 where event_id=original.id and decision='aprovado' and reviewer_id<>original.created_by)<>2
 or exists(select 1 from public.cip_perf_financial_approvals where event_id=original.id and decision='rejeitado') then
 raise exception 'Reversao exige beneficio original com dois pareceres independentes' using errcode='23514'; end if;
 select coalesce(sum(e.reversals),0) into reserved from public.cip_perf_financial_events e
 where e.reverses_event_id=original.id and not exists(
 select 1 from public.cip_perf_financial_approvals a where a.event_id=e.id and a.decision='rejeitado');
 if reserved+new.reversals>greatest(0,round(original.gross_value*original.attribution_pct/100-original.incremental_cost-original.reversals,2)) then
 raise exception 'Reversoes excedem o beneficio liquido original disponivel' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function public.cip_perf_check_reversal() from public,anon,authenticated;
create trigger cip_perf_reversal_guard before insert on public.cip_perf_financial_events
for each row execute function public.cip_perf_check_reversal();
commit;
