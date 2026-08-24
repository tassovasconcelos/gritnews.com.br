create table if not exists public.lead_channel_integrations (
  id uuid primary key default gen_random_uuid(),
  product_key text,
  channel text not null check (channel in ('whatsapp','email')),
  provider text,
  enabled boolean not null default false,
  secret_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_key,channel)
);

alter table public.lead_channel_integrations enable row level security;

drop policy if exists lead_channel_integrations_admin_select on public.lead_channel_integrations;
create policy lead_channel_integrations_admin_select on public.lead_channel_integrations
for select to authenticated using (
  exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true)
);

drop policy if exists lead_channel_integrations_admin_write on public.lead_channel_integrations;
create policy lead_channel_integrations_admin_write on public.lead_channel_integrations
for all to authenticated using (
  exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true)
) with check (
  exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true)
);

create or replace function public.grit_process_lead_cadences()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  r record;
  next_step record;
  completed_count int := 0;
  queued_count int := 0;
  paused_count int := 0;
  next_time timestamptz;
  integration_enabled boolean;
  q_status text;
begin
  update public.lead_automation_enrollments e
     set status='stopped', stop_reason=case when l.do_not_contact then 'do_not_contact' else 'closed_opportunity' end
    from public.leads l
   where e.lead_id=l.id
     and e.status='active'
     and (coalesce(l.do_not_contact,false)=true or l.status in ('won','lost'));
  get diagnostics paused_count = row_count;

  update public.lead_outreach_queue q
     set status='cancelled', last_error='Cadência interrompida por opt-out ou encerramento'
    from public.lead_automation_enrollments e
   where q.enrollment_id=e.id and e.status='stopped' and q.status in ('queued','ready','manual_action');

  for r in
    select e.*, l.product_key, l.product
      from public.lead_automation_enrollments e
      join public.leads l on l.id=e.lead_id
     where e.status='active'
  loop
    select s.* into next_step
      from public.lead_cadence_steps s
     where s.cadence_id=r.cadence_id and s.step_order=r.current_step+1
     order by s.step_order limit 1;

    if not found then
      update public.lead_automation_enrollments set status='completed', next_step_at=null where id=r.id;
      completed_count := completed_count + 1;
      continue;
    end if;

    if exists(select 1 from public.lead_outreach_queue q where q.enrollment_id=r.id and q.cadence_step_id=next_step.id and q.status='sent') then
      update public.lead_automation_enrollments
         set current_step=next_step.step_order,
             last_step_at=coalesce((select sent_at from public.lead_outreach_queue q where q.enrollment_id=r.id and q.cadence_step_id=next_step.id and q.status='sent' order by sent_at desc nulls last limit 1),now()),
             next_step_at=now()
       where id=r.id;
      continue;
    end if;

    next_time := coalesce(r.next_step_at, case when r.current_step=0 then r.started_at else r.last_step_at + make_interval(hours=>next_step.delay_hours) end, now());

    if next_time <= now() and not exists(select 1 from public.lead_outreach_queue q where q.enrollment_id=r.id and q.cadence_step_id=next_step.id) then
      select coalesce(max(i.enabled),false) into integration_enabled
        from public.lead_channel_integrations i
       where i.channel=next_step.channel
         and (i.product_key is null or i.product_key=coalesce(r.product_key,r.product));

      q_status := case when next_step.channel in ('whatsapp','email') and integration_enabled then 'ready' else 'manual_action' end;

      insert into public.lead_outreach_queue(lead_id,enrollment_id,cadence_step_id,channel,template_key,scheduled_at,status,payload)
      values(r.lead_id,r.id,next_step.id,next_step.channel,next_step.template_key,next_time,q_status,
        jsonb_build_object('product_key',coalesce(r.product_key,r.product),'automation','cadence_v43'));

      update public.leads
         set next_action=coalesce(next_step.next_action_label,'Executar próxima ação comercial'),
             next_action_at=next_time,
             updated_at=now()
       where id=r.lead_id;
      queued_count := queued_count + 1;
    else
      update public.leads
         set next_action=coalesce(next_step.next_action_label,next_action),
             next_action_at=coalesce(next_action_at,next_time)
       where id=r.lead_id and (next_action is null or next_action_at is null);
    end if;
  end loop;

  return jsonb_build_object('queued',queued_count,'paused',paused_count,'completed',completed_count,'ran_at',now());
end;
$$;

revoke all on function public.grit_process_lead_cadences() from public, anon, authenticated;
grant execute on function public.grit_process_lead_cadences() to service_role;

do $$
declare jid bigint;
begin
  select jobid into jid from cron.job where jobname='grit-lead-cadence-15m' limit 1;
  if jid is not null then perform cron.unschedule(jid); end if;
  perform cron.schedule('grit-lead-cadence-15m','*/15 * * * *',$cron$select public.grit_process_lead_cadences();$cron$);
end $$;
