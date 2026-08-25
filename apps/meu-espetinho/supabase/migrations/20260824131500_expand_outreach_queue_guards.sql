alter table public.lead_outreach_queue drop constraint if exists lead_outreach_queue_channel_check;
alter table public.lead_outreach_queue add constraint lead_outreach_queue_channel_check
  check (channel in ('whatsapp','email','instagram','facebook','call','task'));

alter table public.lead_outreach_queue drop constraint if exists lead_outreach_queue_status_check;
alter table public.lead_outreach_queue add constraint lead_outreach_queue_status_check
  check (status in ('queued','ready','sent','failed','cancelled','manual_action','consent_required','integration_required','rate_limited','blocked'));
