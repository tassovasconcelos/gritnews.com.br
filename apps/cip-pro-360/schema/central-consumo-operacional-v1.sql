-- CIP360 | Central de Consumo Operacional v1 | 27/11/2026
-- Monitoring is read-only. Real credits/billing require a connected provider billing API or verified invoice.
-- No API keys, payloads, prompts, response bodies or secrets are stored.
create schema if not exists cip_ops_private;
revoke all on schema cip_ops_private from public, anon, authenticated;

create or replace function public.cip_ops_can_view(p_company text)
returns boolean language sql stable set search_path='' as $$
 select exists(
  select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active
   and (p.role='superadm' or
       p.role='diretoria' and exists(
        select 1 from public.cip_memberships m where m.user_id=p.user_id
         and m.company_id=p_company and m.active))
 );
$$;
revoke all on function public.cip_ops_can_view(text) from public,anon;
grant execute on function public.cip_ops_can_view(text) to authenticated;

create table if not exists public.cip_ops_provider_settings(
 company_id text not null references public.cip_companies(id),
 provider text not null check(provider ~ '^[a-z][a-z0-9_]{1,38}$'),
 display_name text not null check(length(display_name) between 2 and 100),
 category text not null check(category in ('llm','search','market','infra','erp','communication','local')),
 readiness text not null default 'planned' check(readiness in
  ('planned','integrated','partial','manual','unverified')),
 monthly_budget_usd numeric(16,4) check(monthly_budget_usd is null or monthly_budget_usd>=0),
 daily_budget_usd numeric(16,4) check(daily_budget_usd is null or daily_budget_usd>=0),
 warn_percent integer not null default 80 check(warn_percent between 10 and 95),
 critical_percent integer not null default 95 check(critical_percent between 50 and 100),
 notes text not null default '' check(length(notes)<=500),
 version integer not null default 1,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),
 primary key(company_id,provider),
 check(critical_percent>warn_percent)
);
create index if not exists cip_ops_provider_category_idx on public.cip_ops_provider_settings(company_id,category);

-- Each recorded event is idempotent, scoped to one company and one underlying request/run.
-- Tokens and call counts may be unknown (NULL), especially for failed provider calls.
create table if not exists public.cip_ops_usage_events(
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id),
 provider text not null,
 agent text not null default 'unattributed',
 model text,
 service text not null default 'llm',
 source_kind text not null check(source_kind in ('market_run','agent_cycle','hermes','api_call','manual_import','provider_report')),
 source_ref text not null check(length(source_ref) between 1 and 180),
 occurred_at timestamptz not null,
 status text not null check(status in ('completed','failed','unknown','skipped')),
 input_tokens bigint check(input_tokens is null or input_tokens between 0 and 1000000000000),
 output_tokens bigint check(output_tokens is null or output_tokens between 0 and 1000000000000),
 cached_input_tokens bigint check(cached_input_tokens is null or cached_input_tokens between 0 and 1000000000000),
 search_calls integer check(search_calls is null or search_calls between 0 and 1000000),
 api_requests integer check(api_requests is null or api_requests between 0 and 1000000),
 cost_usd numeric(16,6) check(cost_usd is null or cost_usd>=0),
 cost_kind text not null default 'unavailable' check(cost_kind in ('unavailable','estimated','provider_billed')),
 failure_code text,
 recorded_at timestamptz not null default now(),
 unique(company_id,source_kind,source_ref),
 foreign key(company_id,provider) references public.cip_ops_provider_settings(company_id,provider),
 check((cost_usd is null and cost_kind='unavailable') or
       (cost_usd is not null and cost_kind in ('estimated','provider_billed')))
);
create index if not exists cip_ops_usage_company_date_idx on public.cip_ops_usage_events(company_id,occurred_at desc);
create index if not exists cip_ops_usage_provider_date_idx on public.cip_ops_usage_events(company_id,provider,occurred_at desc);

-- Snapshots are cumulative MONTH-to-date values, NOT individual charges to be summed.
create table if not exists public.cip_ops_billing_snapshots(
 id uuid primary key default gen_random_uuid(),
 company_id text not null,
 provider text not null,
 observed_at timestamptz not null,
 source text not null check(source in ('provider_api','invoice','manual')),
 month_spend_usd numeric(16,4) check(month_spend_usd is null or month_spend_usd>=0),
 credit_balance_usd numeric(16,4) check(credit_balance_usd is null or credit_balance_usd>=0),
 provider_limit_usd numeric(16,4) check(provider_limit_usd is null or provider_limit_usd>=0),
 currency text not null default 'USD' check(currency='USD'),
 period_month date not null,
 reference_label text not null default '' check(length(reference_label)<=120),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(company_id,provider) references public.cip_ops_provider_settings(company_id,provider),
 check(month_spend_usd is not null or credit_balance_usd is not null or provider_limit_usd is not null)
);
create index if not exists cip_ops_billing_latest_idx on public.cip_ops_billing_snapshots(company_id,provider,observed_at desc);

create table if not exists public.cip_ops_alerts(
 id uuid primary key default gen_random_uuid(),
 company_id text not null,
 provider text not null,
 code text not null check(length(code) between 3 and 80),
 period_key text not null check(length(period_key) between 4 and 40),
 severity text not null check(severity in ('info','warning','critical')),
 message text not null check(length(message)<=350),
 opened_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 resolved_at timestamptz,
 unique(company_id,provider,code,period_key),
 foreign key(company_id,provider) references public.cip_ops_provider_settings(company_id,provider)
);
create index if not exists cip_ops_alerts_open_idx on public.cip_ops_alerts(company_id,last_seen_at desc) where resolved_at is null;

alter table public.cip_ops_provider_settings enable row level security;
alter table public.cip_ops_usage_events enable row level security;
alter table public.cip_ops_billing_snapshots enable row level security;
alter table public.cip_ops_alerts enable row level security;
revoke all on public.cip_ops_provider_settings,public.cip_ops_usage_events,
 public.cip_ops_billing_snapshots,public.cip_ops_alerts from public,anon,authenticated;
grant select on public.cip_ops_provider_settings,public.cip_ops_usage_events,
 public.cip_ops_billing_snapshots,public.cip_ops_alerts to authenticated;
grant update(monthly_budget_usd,daily_budget_usd,warn_percent,critical_percent,notes,updated_at,updated_by,version)
 on public.cip_ops_provider_settings to authenticated;

create policy cip_ops_provider_view on public.cip_ops_provider_settings
 for select to authenticated using(public.cip_ops_can_view(company_id));
create policy cip_ops_provider_budget_update on public.cip_ops_provider_settings
 for update to authenticated using(public.cip_ops_can_view(company_id))
 with check(public.cip_ops_can_view(company_id));
create policy cip_ops_usage_read on public.cip_ops_usage_events
 for select to authenticated using(public.cip_ops_can_view(company_id));
create policy cip_ops_billing_read on public.cip_ops_billing_snapshots
 for select to authenticated using(public.cip_ops_can_view(company_id));
create policy cip_ops_alert_read on public.cip_ops_alerts
 for select to authenticated using(public.cip_ops_can_view(company_id));
-- Service role is the sole writer of usage, billing from provider API and alerts.
-- Human managers may edit budgets but not usage/cost measurements.

create or replace function cip_ops_private.guard_budget()
returns trigger language plpgsql set search_path='' as $$
begin
 if old.company_id is distinct from new.company_id
    or old.provider is distinct from new.provider
    or old.category is distinct from new.category
    or old.readiness is distinct from new.readiness
    or old.display_name is distinct from new.display_name
 then raise exception 'immutable_provider_reference';end if;
 if not public.cip_ops_can_view(old.company_id) then raise exception 'director_required';end if;
 if new.version is distinct from old.version then raise exception 'version_is_server_managed';end if;
 new.version:=old.version+1;
 new.updated_by:=auth.uid();
 new.updated_at:=now();
 return new;
end$$;
drop trigger if exists cip_ops_budget_guard on public.cip_ops_provider_settings;
create trigger cip_ops_budget_guard before update on public.cip_ops_provider_settings
for each row execute function cip_ops_private.guard_budget();
revoke all on function cip_ops_private.guard_budget() from public,anon,authenticated;

create table if not exists public.cip_ops_budget_audit(
 id bigint generated always as identity primary key,
 company_id text not null references public.cip_companies(id),
 provider text not null,
 actor uuid references auth.users(id),
 previous_budget numeric(16,4),
 new_budget numeric(16,4),
 previous_daily_budget numeric(16,4),
 new_daily_budget numeric(16,4),
 occurred_at timestamptz not null default now()
);
alter table public.cip_ops_budget_audit enable row level security;
revoke all on public.cip_ops_budget_audit from public,anon,authenticated;
grant select on public.cip_ops_budget_audit to authenticated;
create policy cip_ops_audit_read on public.cip_ops_budget_audit for select to authenticated
 using(public.cip_ops_can_view(company_id));
create or replace function cip_ops_private.audit_budget()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.monthly_budget_usd is distinct from new.monthly_budget_usd or
    old.daily_budget_usd is distinct from new.daily_budget_usd then
  insert into public.cip_ops_budget_audit(company_id,provider,actor,previous_budget,new_budget,previous_daily_budget,new_daily_budget)
  values(new.company_id,new.provider,auth.uid(),old.monthly_budget_usd,new.monthly_budget_usd,old.daily_budget_usd,new.daily_budget_usd);
 end if;
 return new;
end$$;
revoke all on function cip_ops_private.audit_budget() from public,anon,authenticated;
drop trigger if exists cip_ops_budget_audit_trg on public.cip_ops_provider_settings;
create trigger cip_ops_budget_audit_trg after update on public.cip_ops_provider_settings
for each row execute function cip_ops_private.audit_budget();

-- Read-only inventory: a provider is 'planned' until its credential, connection and accounting are actually verified.
insert into public.cip_ops_provider_settings(company_id,provider,display_name,category,readiness,notes)
select co.id,v.provider,v.display,v.category,v.readiness,v.notes
from public.cip_companies co cross join (values
 ('openai','OpenAI API','llm','integrated','Faro: modelos e web_search; custo faturado ainda não reconciliado'),
 ('anthropic','Anthropic Claude','llm','planned','Uso exige chave e permissão de relatórios, não instalada'),
 ('google_gemini','Google Gemini','llm','planned','Uso por metadados e cobrança Google quando conectado'),
 ('deepseek','DeepSeek','llm','planned','Pendente de conexão e auditoria'),
 ('hermes_local','Hermes / modelo local','local','unverified','Execução local não comprovada; aferir CPU, GPU e energia'),
 ('brave_search','Brave Search','search','planned','Conector e conta não confirmados'),
 ('dataforseo','DataForSEO','search','planned','Conta e saldo não verificados'),
 ('mercado_livre','Mercado Livre','market','planned','API oficial a homologar'),
 ('coleta_direta','Fontes e feeds diretos','market','partial','Leitor JSON-LD disponível; fontes aprovadas ainda não vinculadas'),
 ('supabase','Supabase','infra','integrated','Banco, cron e Edge Functions usados; fatura não ligada'),
 ('hostinger','Hostinger','infra','integrated','Publicação do CIP confirmada; faturamento não ligado'),
 ('vps_kvm','VPS / KVM','infra','unverified','Custos e disponibilidade da VM ainda não conciliados'),
 ('procfit','Procfit / ERP','erp','partial','Catálogo conectado parcialmente; uso faturado desconhecido'),
 ('telegram','Telegram / alertas','communication','partial','Verificar operação, capacidade e tarifas')
) as v(provider,display,category,readiness,notes)
where co.id in ('shopping_prohospital','distribuidora_prohospital')
on conflict(company_id,provider) do nothing;

-- A private, server-owned importer of existing, REAL Faro runs.
-- Never invent tokens for a failed request without a usage object.
create or replace function cip_ops_private.sync_faro_usage()
returns integer language plpgsql security definer set search_path='' as $$
declare inserted_count integer;
begin
 insert into public.cip_ops_usage_events(company_id,provider,agent,model,service,source_kind,source_ref,
 occurred_at,status,input_tokens,output_tokens,search_calls,api_requests,cost_usd,cost_kind,failure_code)
 select r.company_id,'openai','faro',nullif(r.meta->>'model',''),'radar','market_run',r.id::text,
 coalesce(r.finished_at,r.created_at),
 case when r.state='completed' then 'completed' when r.state='failed' then 'failed' else 'unknown' end,
 case when jsonb_typeof(r.meta->'usage'->'input_tokens')='number'
   then (r.meta->'usage'->>'input_tokens')::bigint else null end,
 case when jsonb_typeof(r.meta->'usage'->'output_tokens')='number'
   then (r.meta->'usage'->>'output_tokens')::bigint else null end,
 case when jsonb_typeof(r.meta->'search_calls')='number'
   then (r.meta->>'search_calls')::integer else null end,
 case when r.auto_job_id is not null then 1 else null end,
 null,'unavailable',left(r.meta->>'error',80)
 from public.cip_market_runs r
 where r.company_id in ('shopping_prohospital','distribuidora_prohospital')
   and r.state in ('completed','failed')
   and (r.meta->'usage' is not null or r.meta->>'error' is not null)
   and r.created_at>=now()-interval '120 days'
 on conflict(company_id,source_kind,source_ref) do nothing;
 get diagnostics inserted_count=row_count;
 return inserted_count;
end$$;
revoke all on function cip_ops_private.sync_faro_usage() from public,anon,authenticated;

-- Percentages are driven by VERIFIED provider billing snapshots, not forecast token math.
create or replace view public.cip_ops_billing_current with (security_invoker=true,security_barrier=true)
as
select distinct on(s.company_id,s.provider)
 s.company_id,s.provider,s.observed_at,s.period_month,s.month_spend_usd,s.credit_balance_usd,
 s.provider_limit_usd,s.source,s.reference_label
from public.cip_ops_billing_snapshots s
order by s.company_id,s.provider,s.observed_at desc;
revoke all on public.cip_ops_billing_current from public,anon;
grant select on public.cip_ops_billing_current to authenticated;

create or replace view public.cip_ops_daily_usage with (security_invoker=true,security_barrier=true)
as select company_id,provider,agent,coalesce(model,'não informado') model,
 (occurred_at at time zone 'America/Fortaleza')::date as day,
 count(*)::bigint events,
 count(*) filter(where status='completed')::bigint completed_events,
 count(*) filter(where status='failed')::bigint failed_events,
 count(input_tokens)::bigint metered_events,
 coalesce(sum(input_tokens),0)::numeric input_tokens,
 coalesce(sum(output_tokens),0)::numeric output_tokens,
 coalesce(sum(search_calls),0)::numeric search_calls,
 count(cost_usd)::bigint costed_events,
 sum(cost_usd) estimated_or_billed_cost_usd
from public.cip_ops_usage_events
group by company_id,provider,agent,coalesce(model,'não informado'),(occurred_at at time zone 'America/Fortaleza')::date;
revoke all on public.cip_ops_daily_usage from public,anon;
grant select on public.cip_ops_daily_usage to authenticated;

create or replace function cip_ops_private.refresh_alerts()
returns integer language plpgsql security definer set search_path='' as $$
declare alert_count integer:=0;
begin
 -- Reflect the true operational incident; the mere cron heartbeat is not evidence collection.
 insert into public.cip_ops_alerts(company_id,provider,code,period_key,severity,message)
 select c.company_id,'openai','faro_provider_degraded',to_char(now(),'YYYY-MM-DD'),'critical',
 'Radar Faro com '||c.failure_streak::text||' falhas consecutivas; evidências precisam de revalidação.'
 from public.cip_faro_config c where c.company_id='shopping_prohospital' and c.failure_streak>=3
 on conflict(company_id,provider,code,period_key) do update set last_seen_at=now(),
 message=excluded.message,resolved_at=null;
 get diagnostics alert_count=row_count;
 -- Never trigger budget warnings without trusted provider billing information.
 insert into public.cip_ops_alerts(company_id,provider,code,period_key,severity,message)
 select s.company_id,s.provider,'reported_budget_critical',to_char(s.period_month,'YYYY-MM'),
 'critical','Despesa informada pelo provedor atingiu o limite crítico da política financeira.'
 from public.cip_ops_billing_current s join public.cip_ops_provider_settings p
  on p.company_id=s.company_id and p.provider=s.provider
 where s.source='provider_api' and s.month_spend_usd is not null
   and s.period_month=date_trunc('month',current_date)::date
   and p.monthly_budget_usd>0
   and s.month_spend_usd>=p.monthly_budget_usd*p.critical_percent/100
 on conflict(company_id,provider,code,period_key) do update set last_seen_at=now(),resolved_at=null;
 return alert_count;
end$$;
revoke all on function cip_ops_private.refresh_alerts() from public,anon,authenticated;

comment on table public.cip_ops_usage_events is 'Operational metering only. Provider billed costs and credits require independent source reconciliation.';
comment on table public.cip_ops_billing_snapshots is 'Snapshot is month-to-date or credit balance, not transaction ledger. Never sum monthly snapshots as charges.';
