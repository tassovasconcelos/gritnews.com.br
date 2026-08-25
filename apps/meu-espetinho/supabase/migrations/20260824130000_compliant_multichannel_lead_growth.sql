-- GRIT compliant multichannel lead growth
-- Builds attribution, channel consent, inbound replies and guarded outreach.

alter table public.leads add column if not exists source_platform text;
alter table public.leads add column if not exists source_type text;
alter table public.leads add column if not exists source_form_id text;
alter table public.leads add column if not exists source_lead_id text;
alter table public.leads add column if not exists consent_version text;
alter table public.leads add column if not exists privacy_notice_url text;

alter table public.lead_channel_integrations drop constraint if exists lead_channel_integrations_channel_check;
alter table public.lead_channel_integrations add constraint lead_channel_integrations_channel_check
  check (channel in ('whatsapp','email','instagram','facebook'));

create table if not exists public.lead_channel_consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','email','instagram','facebook')),
  purpose text not null default 'sales_followup',
  status text not null default 'granted' check (status in ('granted','revoked','expired')),
  legal_basis text not null check (legal_basis in ('consent','legitimate_interest','requested_contact')),
  evidence jsonb not null default '{}'::jsonb,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lead_id, channel, purpose)
);

create table if not exists public.lead_inbound_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','email','instagram','facebook')),
  provider_message_id text,
  received_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique nulls not distinct (channel, provider_message_id)
);

alter table public.lead_outreach_queue add column if not exists compliance_status text not null default 'pending';
alter table public.lead_outreach_queue add column if not exists compliance_reason text;
alter table public.lead_outreach_queue add column if not exists legal_basis text;
alter table public.lead_outreach_queue add column if not exists consent_id uuid references public.lead_channel_consents(id);
alter table public.lead_outreach_queue add column if not exists expires_at timestamptz;
alter table public.lead_outreach_queue add column if not exists dedupe_key text;

create unique index if not exists lead_outreach_queue_dedupe_idx
  on public.lead_outreach_queue(dedupe_key) where dedupe_key is not null;
create index if not exists lead_channel_consents_active_idx
  on public.lead_channel_consents(lead_id,channel,purpose) where status='granted';
create index if not exists lead_inbound_messages_window_idx
  on public.lead_inbound_messages(lead_id,channel,received_at desc);
create index if not exists lead_source_performance_idx
  on public.leads(source_platform,source_type,product,status,created_at desc);

alter table public.lead_channel_consents enable row level security;
alter table public.lead_inbound_messages enable row level security;
revoke all on public.lead_channel_consents from anon, authenticated;
revoke all on public.lead_inbound_messages from anon, authenticated;
grant all on public.lead_channel_consents to service_role;
grant all on public.lead_inbound_messages to service_role;

create or replace function public.grit_lead_source_platform(
  p_source text, p_medium text, p_gclid text, p_fbclid text, p_landing_page text
) returns text language sql immutable set search_path=public,pg_temp as $$
  select case
    when nullif(p_gclid,'') is not null then 'google'
    when nullif(p_fbclid,'') is not null then 'meta'
    when lower(coalesce(p_source,'')) like '%instagram%' then 'instagram'
    when lower(coalesce(p_source,'')) in ('facebook','fb','meta') then 'facebook'
    when lower(coalesce(p_source,'')) like '%google%' then 'google'
    when lower(coalesce(p_medium,'')) in ('form','lead_form') then 'form'
    when nullif(p_landing_page,'') is not null then 'website'
    else 'direct'
  end
$$;

create or replace function public.grit_enrich_lead_origin()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  new.source_platform := coalesce(nullif(new.source_platform,''), public.grit_lead_source_platform(new.source,new.medium,new.gclid,new.fbclid,new.landing_page));
  new.source_type := coalesce(nullif(new.source_type,''), case when new.source_form_id is not null then 'lead_form' when new.landing_page is not null then 'website_form' else 'manual' end);
  new.first_touch_source := coalesce(new.first_touch_source,new.source_platform,new.source);
  new.first_touch_medium := coalesce(new.first_touch_medium,new.medium,new.source_type);
  new.first_touch_campaign := coalesce(new.first_touch_campaign,new.campaign);
  new.last_touch_source := coalesce(new.source_platform,new.source,new.last_touch_source);
  new.last_touch_medium := coalesce(new.medium,new.source_type,new.last_touch_medium);
  new.last_touch_campaign := coalesce(new.campaign,new.last_touch_campaign);
  return new;
end $$;

drop trigger if exists grit_enrich_lead_origin_trigger on public.leads;
create trigger grit_enrich_lead_origin_trigger before insert or update of source,medium,campaign,gclid,fbclid,landing_page,source_platform,source_type,source_form_id
on public.leads for each row execute function public.grit_enrich_lead_origin();

create or replace function public.grit_guard_outreach_queue()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
  l public.leads%rowtype;
  c public.lead_channel_consents%rowtype;
  integration_enabled boolean := false;
  recent_inbound boolean := false;
  sent_24h integer := 0;
  sent_7d integer := 0;
  local_hour integer;
begin
  select * into l from public.leads where id=new.lead_id;
  new.dedupe_key := coalesce(new.dedupe_key, concat_ws(':',new.lead_id,new.channel,new.cadence_step_id,coalesce(new.template_key,'')));
  new.expires_at := coalesce(new.expires_at,new.scheduled_at + interval '7 days');

  if l.id is null or l.do_not_contact or l.status in ('won','lost') then
    new.status:='blocked'; new.compliance_status:='blocked'; new.compliance_reason:='lead_not_contactable'; return new;
  end if;
  if (new.channel='email' and nullif(l.email,'') is null) or (new.channel='whatsapp' and nullif(l.whatsapp,'') is null) then
    new.status:='blocked'; new.compliance_status:='blocked'; new.compliance_reason:='missing_channel_address'; return new;
  end if;

  select * into c from public.lead_channel_consents
   where lead_id=l.id and channel=new.channel and purpose in ('sales_followup','marketing')
     and status='granted' and (expires_at is null or expires_at>now())
   order by (purpose='sales_followup') desc,granted_at desc limit 1;
  if c.id is null then
    new.status:='consent_required'; new.compliance_status:='blocked'; new.compliance_reason:='channel_permission_missing'; return new;
  end if;

  if new.channel in ('instagram','facebook') then
    select exists(select 1 from public.lead_inbound_messages where lead_id=l.id and channel=new.channel and received_at>=now()-interval '24 hours') into recent_inbound;
    if not recent_inbound then
      new.status:='manual_action'; new.compliance_status:='review'; new.compliance_reason:='meta_messaging_window_closed'; return new;
    end if;
  end if;

  select count(*) into sent_24h from public.lead_outreach_queue where lead_id=l.id and sent_at>=now()-interval '24 hours' and status='sent';
  select count(*) into sent_7d from public.lead_outreach_queue where lead_id=l.id and sent_at>=now()-interval '7 days' and status='sent';
  if sent_24h>=1 or sent_7d>=3 then
    new.status:='rate_limited'; new.compliance_status:='blocked'; new.compliance_reason:='frequency_cap'; return new;
  end if;

  local_hour := extract(hour from new.scheduled_at at time zone 'America/Sao_Paulo');
  if local_hour < 9 then new.scheduled_at := date_trunc('day',new.scheduled_at at time zone 'America/Sao_Paulo') + interval '9 hours'; end if;
  if local_hour >= 19 then new.scheduled_at := date_trunc('day',(new.scheduled_at at time zone 'America/Sao_Paulo') + interval '1 day') + interval '9 hours'; end if;

  select coalesce(bool_or(enabled),false) into integration_enabled from public.lead_channel_integrations
   where channel=new.channel and (product_key is null or product_key=coalesce(l.product_key,l.product));
  new.consent_id:=c.id; new.legal_basis:=c.legal_basis; new.compliance_status:='approved'; new.compliance_reason:='permission_verified';
  new.status:=case when integration_enabled then 'ready' else 'integration_required' end;
  return new;
end $$;

drop trigger if exists grit_guard_outreach_queue_trigger on public.lead_outreach_queue;
create trigger grit_guard_outreach_queue_trigger before insert or update of status,scheduled_at,channel,lead_id
on public.lead_outreach_queue for each row execute function public.grit_guard_outreach_queue();

create or replace function public.grit_pause_cadence_on_reply()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.lead_automation_enrollments set status='stopped',stop_reason='lead_replied' where lead_id=new.lead_id and status='active';
  update public.lead_outreach_queue set status='cancelled',last_error='Lead respondeu; atendimento humano necessário' where lead_id=new.lead_id and status in ('queued','ready','manual_action','integration_required','rate_limited');
  update public.leads set status=case when status='new' then 'contacted' else status end,last_touch_at=new.received_at,next_action='Responder lead',next_action_at=now(),updated_at=now() where id=new.lead_id;
  insert into public.lead_events(lead_id,event_type,channel,direction,summary,metadata) values(new.lead_id,'reply_received',new.channel,'inbound','Resposta recebida; automação pausada',jsonb_build_object('inbound_message_id',new.id));
  return new;
end $$;

drop trigger if exists grit_pause_cadence_on_reply_trigger on public.lead_inbound_messages;
create trigger grit_pause_cadence_on_reply_trigger after insert on public.lead_inbound_messages
for each row execute function public.grit_pause_cadence_on_reply();

insert into public.lead_channel_integrations(product_key,channel,provider,enabled)
select null,v.channel,v.provider,false from (values ('instagram','meta'),('facebook','meta')) v(channel,provider)
where not exists(select 1 from public.lead_channel_integrations i where i.product_key is null and i.channel=v.channel);

update public.leads set source_platform=public.grit_lead_source_platform(source,medium,gclid,fbclid,landing_page),
 source_type=case when landing_page is not null then 'website_form' else 'manual' end
where source_platform is null or source_type is null;

revoke all on function public.grit_guard_outreach_queue() from public,anon,authenticated;
revoke all on function public.grit_pause_cadence_on_reply() from public,anon,authenticated;
grant execute on function public.grit_guard_outreach_queue() to service_role;
grant execute on function public.grit_pause_cadence_on_reply() to service_role;
