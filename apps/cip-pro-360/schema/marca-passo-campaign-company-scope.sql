begin;
create or replace function public.cip_mp_campaign_source_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.source_snapshot_at is null or new.source_snapshot_at>now()+interval '5 minutes' or new.source_snapshot_at<now()-interval '36 hours' then raise exception 'campaign_source_stale'; end if;
 if not exists(select 1 from public.cip_erp_snapshots s where s.company_id=new.company_id and s.status='approved' and s.captured_at=new.source_snapshot_at and s.metadata->>'scope'='company_all') then raise exception 'campaign_source_unverified'; end if;
 if exists(select 1 from public.cip_erp_snapshots s where s.company_id=new.company_id and s.status='approved' and s.captured_at>new.source_snapshot_at) then raise exception 'campaign_source_superseded'; end if;
 return new;
end;$$;
comment on function public.cip_mp_campaign_source_guard() is 'Requires an exact, current, human-approved, complete company Procfit snapshot for every sell-out proposal.';
commit;
