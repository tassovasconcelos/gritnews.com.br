-- Prevent concurrent dispatcher runs from sending the same message twice.
alter table public.lead_outreach_queue
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_token uuid;

alter table public.lead_outreach_queue drop constraint if exists lead_outreach_queue_status_check;
alter table public.lead_outreach_queue add constraint lead_outreach_queue_status_check
  check (status in ('queued','ready','processing','sent','failed','cancelled','manual_action','consent_required','integration_required','rate_limited','blocked'));

-- Compliance is evaluated when an item enters the queue or its targeting changes.
-- Terminal/worker status transitions must not be rewritten back to `ready`.
drop trigger if exists grit_guard_outreach_queue_trigger on public.lead_outreach_queue;
create trigger grit_guard_outreach_queue_trigger
before insert or update of scheduled_at,channel,lead_id
on public.lead_outreach_queue for each row execute function public.grit_guard_outreach_queue();

create or replace function public.grit_claim_outreach_batch(p_limit integer, p_claim_token uuid)
returns setof public.lead_outreach_queue
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_claim_token is null then
    raise exception 'claim_token_required';
  end if;

  update public.lead_outreach_queue
     set status = case when attempts >= 5 then 'failed' else 'ready' end,
         last_error = case when attempts >= 5 then 'dispatch_attempt_limit_reached' else 'stale_dispatch_claim_released' end,
         claimed_at = null,
         claim_token = null
   where status = 'processing'
     and claimed_at < now() - interval '15 minutes';

  return query
  with candidates as (
    select q.id
      from public.lead_outreach_queue q
     where q.status = 'ready'
       and q.compliance_status = 'approved'
       and q.scheduled_at <= now()
       and coalesce(q.attempts, 0) < 5
     order by q.scheduled_at, q.id
     for update skip locked
     limit least(greatest(coalesce(p_limit, 20), 1), 50)
  )
  update public.lead_outreach_queue q
     set status = 'processing',
         claimed_at = now(),
         claim_token = p_claim_token,
         attempts = coalesce(q.attempts, 0) + 1
    from candidates c
   where q.id = c.id
  returning q.*;
end;
$$;

revoke all on function public.grit_claim_outreach_batch(integer, uuid) from public, anon, authenticated;
grant execute on function public.grit_claim_outreach_batch(integer, uuid) to service_role;

create index if not exists lead_outreach_queue_claim_idx
  on public.lead_outreach_queue(status, scheduled_at, claimed_at)
  where status in ('ready', 'processing');
