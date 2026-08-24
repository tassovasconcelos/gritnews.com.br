-- GRIT Commercial CRM — applied and verified on Supabase project pcrwtoddavpvkaxwtstc
-- Central source of truth for all GRIT products.

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  channel text,
  direction text check (direction is null or direction in ('inbound','outbound','system')),
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists lead_events_lead_created_idx on public.lead_events(lead_id, created_at desc);
create index if not exists lead_events_type_created_idx on public.lead_events(event_type, created_at desc);
alter table public.lead_events enable row level security;

drop policy if exists "grit admins manage lead events" on public.lead_events;
create policy "grit admins manage lead events" on public.lead_events
for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.active=true))
with check (exists (select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.active=true));

grant select, insert, update, delete on public.lead_events to authenticated;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  product text not null,
  title text not null,
  stage text not null default 'QUALIFIED' check (stage in ('QUALIFIED','DEMO_SCHEDULED','TRIAL','PROPOSAL','WON','LOST','NURTURE')),
  status text not null default 'open' check (status in ('open','won','lost','nurture')),
  value numeric(14,2),
  probability integer not null default 10 check (probability between 0 and 100),
  owner_user_id uuid,
  next_action text,
  next_action_at timestamptz,
  expected_close_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  source text,
  campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_lead_idx on public.opportunities(lead_id);
create index if not exists opportunities_product_stage_idx on public.opportunities(product, stage);
create index if not exists opportunities_next_action_idx on public.opportunities(next_action_at) where status='open';
alter table public.opportunities enable row level security;

drop policy if exists "grit admins manage opportunities" on public.opportunities;
create policy "grit admins manage opportunities" on public.opportunities
for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.active=true))
with check (exists (select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.active=true));

grant select, insert, update, delete on public.opportunities to authenticated;
