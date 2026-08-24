-- Sr. Padeiro: trial, permuta, liberação manual e monitoramento

create table if not exists public.srp_access_control (
  organization_id uuid primary key references public.srp_organizations(id) on delete cascade,
  access_mode text not null default 'trial' check (access_mode in ('trial','active','barter','suspended','cancelled')),
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  barter_until timestamptz,
  manual_release boolean not null default false,
  released_by uuid references auth.users(id),
  released_at timestamptz,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.srp_operation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.srp_organizations(id) on delete cascade,
  store_id uuid references public.srp_stores(id) on delete cascade,
  user_id uuid references auth.users(id),
  event_name text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists srp_access_mode_idx on public.srp_access_control(access_mode);
create index if not exists srp_operation_events_org_created_idx on public.srp_operation_events(organization_id,created_at desc);
create index if not exists srp_operation_events_event_created_idx on public.srp_operation_events(event_name,created_at desc);

alter table public.srp_access_control enable row level security;
alter table public.srp_operation_events enable row level security;

create or replace function public.srp_create_default_access()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.srp_access_control (organization_id,access_mode,trial_starts_at,trial_ends_at,manual_release)
  values (new.id,'trial',now(),now()+interval '7 days',false)
  on conflict (organization_id) do nothing;
  return new;
end;
$$;
revoke all on function public.srp_create_default_access() from public,anon,authenticated;

drop trigger if exists srp_org_default_access on public.srp_organizations;
create trigger srp_org_default_access after insert on public.srp_organizations for each row execute function public.srp_create_default_access();

create or replace function public.srp_runtime_access(org_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce(exists(
    select 1 from public.srp_access_control a
    where a.organization_id=org_id and (
      a.access_mode='active'
      or (a.access_mode='barter' and (a.barter_until is null or a.barter_until>now()))
      or (a.access_mode='trial' and a.trial_ends_at>now())
      or a.manual_release=true
    )
  ),false)
  or exists(select 1 from public.admin_users au where au.user_id=(select auth.uid()) and au.active and au.role='superadmin');
$$;
grant execute on function public.srp_runtime_access(uuid) to authenticated;

-- Policies específicas de srp_access_control / srp_operation_events são aplicadas
-- no projeto gritnews e devem sempre preservar acesso total ao superadmin e
-- isolamento por organization_id para os demais usuários.
