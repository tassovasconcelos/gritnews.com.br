-- GRIT CONSUMO PRO 360: isolated research sandbox. No stock / budget / purchase transactions.
-- Studies and quotes are advisory records: not booking confirmation, invoice, or approved expense.
create table if not exists public.cp_lab_studies (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.cp_companies(id),
 created_by uuid not null references auth.users(id),
 title text not null check (char_length(btrim(title)) between 4 and 180),
 area text not null check (area in ('travel','consumption','procurement','operations')),
 hypothesis text not null default '',
 inputs jsonb not null default '{}'::jsonb check (jsonb_typeof(inputs)='object'),
 results jsonb not null default '{}'::jsonb check (jsonb_typeof(results)='object'),
 evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence)='array'),
 status text not null default 'draft' check (status in ('draft','review','validated','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists cp_lab_studies_company_recent on public.cp_lab_studies(company_id,created_at desc);

alter table public.cp_lab_studies enable row level security;
revoke all on public.cp_lab_studies from anon;
revoke all on public.cp_lab_studies from public;
grant select,insert,update on public.cp_lab_studies to authenticated;

create policy cp_lab_studies_read on public.cp_lab_studies
 for select to authenticated
 using (private.cp_has_role(company_id,
  ARRAY['group_admin','director','controller','finance','buyer','manager','grit_superadmin']::text[]));

create policy cp_lab_studies_insert on public.cp_lab_studies
 for insert to authenticated
 with check (created_by=(select auth.uid()) and status='draft' and
  private.cp_has_role(company_id,ARRAY['group_admin','director','controller','buyer','manager','grit_superadmin']::text[]));

create policy cp_lab_studies_update on public.cp_lab_studies
 for update to authenticated
 using ((created_by=(select auth.uid()) or private.cp_has_role(company_id,ARRAY['group_admin','director']::text[])) and
  private.cp_has_role(company_id,ARRAY['group_admin','director','controller','buyer','manager','grit_superadmin']::text[]))
 with check (
  (created_by=(select auth.uid()) or private.cp_has_role(company_id,ARRAY['group_admin','director']::text[])) and
  private.cp_has_role(company_id,ARRAY['group_admin','director','controller','buyer','manager','grit_superadmin']::text[])
 );

create table if not exists public.cp_travel_quotes (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.cp_companies(id),
 recorded_by uuid not null references auth.users(id),
 from_code text not null check (from_code ~ '^[A-Z]{3}$'),
 to_code text not null check (to_code ~ '^[A-Z]{3}$' and to_code<>from_code),
 travel_date date not null,
 mode text not null check (mode in ('air','bus')),
 provider text not null check (char_length(btrim(provider)) between 2 and 150),
 fare numeric(14,2) not null check (fare>0),
 baggage numeric(14,2) not null default 0 check (baggage>=0),
 fees numeric(14,2) not null default 0 check (fees>=0),
 duration_minutes integer check (duration_minutes>0 and duration_minutes<=2880),
 source_url text not null check (source_url ~* '^https://[^[:space:]]{4,1000}$'),
 observed_at timestamptz not null default now(),
 notes text not null default '' check (char_length(notes)<=1000),
 created_at timestamptz not null default now()
);
create index if not exists cp_travel_quotes_lookup
 on public.cp_travel_quotes(company_id,from_code,to_code,travel_date,observed_at desc);

alter table public.cp_travel_quotes enable row level security;
revoke all on public.cp_travel_quotes from anon;
revoke all on public.cp_travel_quotes from public;
grant select,insert on public.cp_travel_quotes to authenticated;

create policy cp_travel_quotes_read on public.cp_travel_quotes
 for select to authenticated
 using (private.cp_has_role(company_id,
 ARRAY['group_admin','director','controller','finance','buyer','manager','grit_superadmin']::text[]));

create policy cp_travel_quotes_insert on public.cp_travel_quotes
 for insert to authenticated
 with check (recorded_by=(select auth.uid()) and
  private.cp_has_role(company_id,ARRAY['group_admin','director','controller','buyer','manager','grit_superadmin']::text[]));

-- No delete API. Observations are immutable, append-only evidence.
-- All corporate expenses and ticket purchases remain subject to separate human approval.
