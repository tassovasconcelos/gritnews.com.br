-- Liga consentimento válido à cadência do produto sem duplicar matrículas.
create unique index if not exists lead_automation_enrollment_unique_idx
  on public.lead_automation_enrollments(lead_id,cadence_id);

create or replace function public.grit_enroll_consented_lead(p_lead_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_lead public.leads%rowtype;
  v_cadence_id uuid;
  v_enrollment_id uuid;
begin
  select * into v_lead from public.leads where id=p_lead_id;
  if v_lead.id is null then return; end if;

  if v_lead.do_not_contact is not true
     and v_lead.status not in ('won','lost')
     and exists(
       select 1 from public.lead_channel_consents c
       where c.lead_id=v_lead.id and c.status='granted'
         and (c.expires_at is null or c.expires_at>now())
     ) then
    select c.id into v_cadence_id
      from public.lead_cadences c
     where c.active and c.product_key=coalesce(v_lead.product_key,v_lead.product)
     order by c.created_at desc limit 1;

    if v_cadence_id is not null then
      insert into public.lead_automation_enrollments(
        lead_id,cadence_id,current_step,status,started_at,next_step_at
      ) values (v_lead.id,v_cadence_id,0,'active',now(),now())
      on conflict(lead_id,cadence_id) do nothing
      returning id into v_enrollment_id;

      if v_enrollment_id is null then
        select e.id into v_enrollment_id
          from public.lead_automation_enrollments e
         where e.lead_id=v_lead.id and e.cadence_id=v_cadence_id and e.status='active';
      end if;

      if v_enrollment_id is not null then
        insert into public.lead_outreach_queue(
          lead_id,enrollment_id,cadence_step_id,channel,template_key,payload,scheduled_at,status,dedupe_key
        )
        select v_lead.id,v_enrollment_id,s.id,s.channel,s.template_key,
          jsonb_build_object('product',coalesce(v_lead.product_key,v_lead.product),'source','consented_form'),
          now()+(s.delay_hours*interval '1 hour'),'queued',
          concat(v_lead.id,':',v_cadence_id,':',s.id)
        from public.lead_cadence_steps s
        where s.cadence_id=v_cadence_id
        order by s.step_order
        on conflict(dedupe_key) where dedupe_key is not null do nothing;
      end if;
    end if;
  end if;

  -- Nova concessão, revogação ou expiração revalida apenas itens não enviados.
  update public.lead_outreach_queue q
     set scheduled_at=q.scheduled_at
   where q.lead_id=v_lead.id
     and q.status in ('queued','ready','consent_required','integration_required','rate_limited','manual_action');
end;
$$;

revoke all on function public.grit_enroll_consented_lead(uuid) from public,anon,authenticated;
grant execute on function public.grit_enroll_consented_lead(uuid) to service_role;

create or replace function public.grit_consent_changed_enroll()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform public.grit_enroll_consented_lead(new.lead_id);
  return new;
end;
$$;
revoke all on function public.grit_consent_changed_enroll() from public,anon,authenticated;

drop trigger if exists grit_consent_changed_enroll_trigger on public.lead_channel_consents;
create trigger grit_consent_changed_enroll_trigger
after insert or update of status,expires_at on public.lead_channel_consents
for each row execute function public.grit_consent_changed_enroll();

-- Tarefas são internas: não representam contato e não exigem permissão de canal.
create or replace function public.grit_internal_task_queue_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.channel='task' and new.compliance_reason='channel_permission_missing' then
    new.status:='manual_action';
    new.compliance_status:='review';
    new.compliance_reason:='internal_task';
    new.legal_basis:=null;
    new.consent_id:=null;
  end if;
  return new;
end;
$$;
revoke all on function public.grit_internal_task_queue_guard() from public,anon,authenticated;

drop trigger if exists zz_grit_internal_task_queue_guard_trigger on public.lead_outreach_queue;
create trigger zz_grit_internal_task_queue_guard_trigger
before insert or update of scheduled_at,channel,lead_id on public.lead_outreach_queue
for each row execute function public.grit_internal_task_queue_guard();
