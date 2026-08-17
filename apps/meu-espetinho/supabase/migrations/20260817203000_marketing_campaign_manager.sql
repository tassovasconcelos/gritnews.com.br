-- Gestor interno de campanhas do Meu Espetinho.
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null check (platform in ('meta','google_search','google_display','youtube','instagram','facebook','other')),
  objective text not null default 'subscriptions',
  funnel_stage text not null default 'acquisition' check (funnel_stage in ('awareness','acquisition','trial','remarketing','subscription')),
  status text not null default 'planned' check (status in ('idea','planned','ready','active','paused','finished')),
  daily_budget numeric(12,2) not null default 0 check (daily_budget >= 0),
  start_date date,
  end_date date,
  audience text,
  creative_angle text,
  offer text,
  landing_path text not null default '/',
  utm_campaign text,
  utm_content text,
  primary_kpi text not null default 'subscription_started',
  target_cpa numeric(12,2),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_campaigns enable row level security;

drop policy if exists marketing_campaigns_admin_select on public.marketing_campaigns;
create policy marketing_campaigns_admin_select on public.marketing_campaigns
for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

drop policy if exists marketing_campaigns_admin_insert on public.marketing_campaigns;
create policy marketing_campaigns_admin_insert on public.marketing_campaigns
for insert to authenticated
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

drop policy if exists marketing_campaigns_admin_update on public.marketing_campaigns;
create policy marketing_campaigns_admin_update on public.marketing_campaigns
for update to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true))
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

drop policy if exists marketing_campaigns_admin_delete on public.marketing_campaigns;
create policy marketing_campaigns_admin_delete on public.marketing_campaigns
for delete to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

create or replace function public.touch_marketing_campaign_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists trg_marketing_campaign_updated_at on public.marketing_campaigns;
create trigger trg_marketing_campaign_updated_at before update on public.marketing_campaigns
for each row execute function public.touch_marketing_campaign_updated_at();

create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status);
create index if not exists idx_marketing_campaigns_platform on public.marketing_campaigns(platform);
create index if not exists idx_marketing_campaigns_start_date on public.marketing_campaigns(start_date);

insert into public.marketing_campaigns(name,platform,objective,funnel_stage,status,daily_budget,audience,creative_angle,offer,landing_path,utm_campaign,utm_content,primary_kpi,target_cpa,notes)
select * from (values
 ('Controle sem caderninho','meta','subscriptions','acquisition','planned',30.00,'Donos de espetinhos, churrasquinhos, bares pequenos e food trucks','Dor operacional: menos papel, menos bagunça, mais controle','Teste grátis por 3 dias','/cadastro','controle_sem_caderninho','video_demo_01','start_trial',25.00,'Campanha de aquisição para Facebook e Instagram. Otimizar somente após volume mínimo de conversões.'),
 ('Venda mais com operação simples','google_search','subscriptions','acquisition','planned',30.00,'Pessoas pesquisando sistema para espetinho, comanda digital, controle de fiado e PDV para bar','Intenção direta de busca: organização, caixa, comanda e lucro','Teste grátis por 3 dias','/cadastro','google_intencao_sistema','search_v1','start_trial',30.00,'Começar com correspondência de frase/exata e termos comerciais de alta intenção.'),
 ('Teste para assinatura','meta','subscriptions','remarketing','planned',20.00,'Visitantes, cadastrados e usuários que iniciaram teste mas ainda não assinaram','Prova do valor: continue com seus dados, clientes e operação organizados','Assine por R$ 89/mês','/app','remarketing_teste_assinatura','retarget_01','subscription_started',89.00,'Excluir assinantes ativos. Priorizar usuários próximos do fim do teste e visitantes de pricing.')
) as seed(name,platform,objective,funnel_stage,status,daily_budget,audience,creative_angle,offer,landing_path,utm_campaign,utm_content,primary_kpi,target_cpa,notes)
where not exists(select 1 from public.marketing_campaigns);
