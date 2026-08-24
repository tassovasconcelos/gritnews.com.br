-- GRIT Growth Lead Engine
-- Shared, backward-compatible lead enrichment for Meu Espetinho + Sr. Padeiro.

alter table if exists public.leads add column if not exists product text;
alter table if exists public.leads add column if not exists campaign text;
alter table if exists public.leads add column if not exists score integer not null default 0;
alter table if exists public.leads add column if not exists owner_id uuid;
alter table if exists public.leads add column if not exists next_action_at timestamptz;
alter table if exists public.leads add column if not exists last_contact_at timestamptz;
alter table if exists public.leads add column if not exists lost_reason text;
alter table if exists public.leads add column if not exists updated_at timestamptz not null default now();

create index if not exists leads_product_status_idx on public.leads(product,status);
create index if not exists leads_next_action_idx on public.leads(next_action_at) where next_action_at is not null;
create index if not exists leads_score_idx on public.leads(score desc);

create or replace function public.grit_lead_score(p public.leads)
returns integer
language sql
stable
as $$
  select least(100, greatest(0,
    (case when nullif(trim(coalesce(p.whatsapp,'')),'') is not null then 25 else 0 end) +
    (case when nullif(trim(coalesce(p.email,'')),'') is not null then 15 else 0 end) +
    (case when nullif(trim(coalesce(p.business_name,'')),'') is not null then 15 else 0 end) +
    (case when nullif(trim(coalesce(p.city,'')),'') is not null then 10 else 0 end) +
    (case when nullif(trim(coalesce(p.campaign,'')),'') is not null then 10 else 0 end) +
    (case when p.status in ('contacted','qualified','trial','proposal','won') then 15 else 0 end) +
    (case when p.status in ('qualified','trial','proposal','won') then 10 else 0 end)
  ));
$$;

create or replace function public.grit_refresh_lead_score()
returns trigger
language plpgsql
as $$
begin
  new.score := public.grit_lead_score(new);
  new.updated_at := now();
  if new.status = 'new' and new.next_action_at is null then
    new.next_action_at := now() + interval '30 minutes';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_grit_refresh_lead_score on public.leads;
create trigger trg_grit_refresh_lead_score
before insert or update of whatsapp,email,business_name,city,campaign,status on public.leads
for each row execute function public.grit_refresh_lead_score();

-- Backfill only objective fields; no lead is marked qualified automatically.
update public.leads set score = public.grit_lead_score(leads), updated_at = coalesce(updated_at,now());

create or replace view public.grit_growth_queue as
select id, product, name, business_name, whatsapp, email, city, source, campaign, status, score,
       owner_id, next_action_at, last_contact_at, created_at, updated_at,
       case
         when status='new' and next_action_at < now() then 'sla_overdue'
         when status in ('new','contacted') and score >= 65 then 'high_priority'
         when status in ('qualified','trial','proposal') then 'conversion'
         else 'nurture'
       end as queue
from public.leads
where status not in ('won','lost')
order by
  case when next_action_at < now() then 0 else 1 end,
  score desc,
  created_at asc;

comment on view public.grit_growth_queue is 'Fila comercial objetiva GRIT; score nao promove lead automaticamente.';