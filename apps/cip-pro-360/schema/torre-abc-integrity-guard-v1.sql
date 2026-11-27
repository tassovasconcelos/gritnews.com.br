-- Integrity guard: never accept a ready batch before the expected 6514 rows/courves are loaded.
create or replace function public.cip_abc_batch_state_guard()
returns trigger language plpgsql security invoker set search_path='' as $$
declare n integer; a integer; b integer; c integer;
begin
 if old.company_id<>new.company_id or old.imported_by<>new.imported_by or old.source_sha256<>new.source_sha256 or old.expected_rows<>new.expected_rows then
  raise exception 'batch_immutable_fields';
 end if;
 if old.status<>'importing' then raise exception 'batch_finalized_immutable';end if;
 if new.status='ready' then
  select count(*), count(*) filter (where curve='A'), count(*) filter(where curve='B'), count(*) filter(where curve='C')
   into n,a,b,c from public.cip_abc_products where company_id=new.company_id and import_id=old.id;
  if n<>new.expected_rows then raise exception 'incomplete_batch';end if;
  if new.expected_rows=6514 and (a<>3545 or b<>1803 or c<>1166) then raise exception 'abc_curves_incorrect';end if;
  new.completed_at=now();
 elsif new.status='cancelled' then new.completed_at=now();
 else
  if new.completed_at is distinct from old.completed_at then raise exception 'completed_at_not_editable';end if;
 end if;
 return new;
end;$$;
revoke all on function public.cip_abc_batch_state_guard() from public,anon;
drop trigger if exists cip_abc_ready_guard on public.cip_abc_import_batches;
create trigger cip_abc_ready_guard before update on public.cip_abc_import_batches
 for each row execute function public.cip_abc_batch_state_guard();

alter table public.cip_tower_tasks
 add constraint cip_tower_completion_evidence
 check(status<>'concluida' or length(trim(coalesce(evidence_note,'')))>=10);

drop policy if exists "tower_scenario_insert_authorized" on public.cip_tower_price_scenarios;
create policy "tower_scenario_insert_authorized" on public.cip_tower_price_scenarios
 for insert to authenticated with check(
 created_by=(select auth.uid())
 and public.cip_can_access(company_id,true)
 and (source_abc_import_id is null or exists(
  select 1 from public.cip_abc_import_batches b
  where b.id=source_abc_import_id and b.company_id=cip_tower_price_scenarios.company_id and b.status='ready'))
);
