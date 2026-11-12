-- CIP PRO 360° · Performance Tasso & CIP · V1
-- Planejamento de metas, produtividade e benefícios incrementais SEM bonificação automática.
-- Registros manuais são provisórios; benefícios só contam após dois pareceres independentes.

create table if not exists public.cip_perf_catalog (
 code text primary key,
 pillar text not null,
 label text not null,
 unit text not null check (unit in ('BRL','PCT','HOURS','MINUTES','COUNT','TURNS','PER_HOUR')),
 direction text not null check(direction in ('up','down')),
 weight integer not null default 0 check(weight between 0 and 100),
 is_core boolean not null default false,
 description text not null
);
insert into public.cip_perf_catalog(code,pillar,label,unit,direction,weight,is_core,description) values
 ('crescimento_vendas','vendas','Vendas líquidas comparáveis','BRL','up',20,true,'Receita líquida no mesmo escopo, sem atribuir faturamento total ao CIP.'),
 ('margem_contribuicao','margem','Margem de contribuição','BRL','up',15,true,'Margem de contribuição consolidada e conciliada, não apenas faturamento.'),
 ('giro_estoque','estoque','Giro de estoque','TURNS','up',15,true,'Giro com estoque médio e CMV do mesmo período, filial e empresa.'),
 ('recuperacao_caderninho','caderninho','Margem de vendas recuperadas','BRL','up',10,true,'Margem líquida das oportunidades rastreadas pelo Caderninho, evitando somar vendas duplicadas.'),
 ('radar_acoes','radar','Ações competitivas efetivas','COUNT','up',5,true,'Ações concluídas e comprovadas, não somente pesquisas/concorrentes cadastrados.'),
 ('engajamento_equipe','engajamento','Equipe ativa no CIP (%)','PCT','up',5,true,'Usuários elegíveis ativos com tarefas relevantes e acompanhamento.'),
 ('horas_liquidas','produtividade','Horas de trabalho líquidas poupadas','HOURS','up',15,true,'Tempo liberado após supervisão, retrabalho e atividades adicionais.'),
 ('efetividade_agentes','agentes','Ações coordenadas efetivas (%)','PCT','up',15,true,'Ações com resultado validável sobre ações efetivamente executadas.'),
 ('tempo_decisao','produtividade','Tempo médio para decisão','MINUTES','down',0,false,'Minutos entre alerta confirmado e decisão registrada.'),
 ('tempo_processos','produtividade','Tempo médio de processo','MINUTES','down',0,false,'Minutos por execução de processo comparável.'),
 ('automacao','agentes','Automação de tarefas elegíveis (%)','PCT','up',0,false,'Tarefas realmente automáticas sobre tarefas elegíveis.'),
 ('produtividade_pessoa','produtividade','Entregas por hora produtiva','PER_HOUR','up',0,false,'Volume concluído por hora produtiva equivalente.'),
 ('retrabalho','produtividade','Ocorrências de retrabalho (%)','PCT','down',0,false,'Ocorrências com correção sobre operações concluídas.'),
 ('economia_pessoal','produtividade','Despesa de pessoal efetivamente evitada','BRL','up',0,false,'Exclusivamente despesa comprovada ou contratação evitada, não FTE teórico.'),
 ('capital_estoque','estoque','Capital aplicado em estoque','BRL','down',0,false,'Saldo contábil de estoque; redução de principal não é lucro remunerável.')
on conflict(code) do nothing;

create or replace function public.cip_perf_can_read(p_company text)
returns boolean language sql stable security invoker set search_path='' as $$
 select public.cip_can_access(p_company,false) and exists(
  select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active
  and p.role in ('superadm','diretoria','gestor'));
$$;
create or replace function public.cip_perf_can_submit(p_company text)
returns boolean language sql stable security invoker set search_path='' as $$
 select public.cip_can_access(p_company,true) and exists(
  select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active
  and p.role in ('superadm','diretoria'));
$$;
revoke all on function public.cip_perf_can_read(text) from public,anon;
revoke all on function public.cip_perf_can_submit(text) from public,anon;
grant execute on function public.cip_perf_can_read(text),public.cip_perf_can_submit(text) to authenticated;

create table if not exists public.cip_perf_kpi_records(
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id),
 metric_code text not null references public.cip_perf_catalog(code),
 period_start date not null,
 period_end date not null,
 baseline numeric(18,4) not null,
 target numeric(18,4) not null,
 actual numeric(18,4) not null,
 source_kind text not null default 'manual' check(source_kind in ('manual','erp_parcial','erp_conciliado','instrumentado')),
 evidence text not null default '',
 notes text not null default '',
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint cip_perf_kpi_valid_dates check(period_end>=period_start),
 constraint cip_perf_kpi_unique unique(company_id,metric_code,period_start,period_end)
);
create index if not exists cip_perf_kpi_range_idx on public.cip_perf_kpi_records(company_id,period_end desc);
alter table public.cip_perf_kpi_records enable row level security;
create policy "perf_kpi_read" on public.cip_perf_kpi_records for select to authenticated using(public.cip_perf_can_read(company_id));
create policy "perf_kpi_insert" on public.cip_perf_kpi_records for insert to authenticated with check(created_by=(select auth.uid()) and public.cip_perf_can_submit(company_id));
create policy "perf_kpi_update_own" on public.cip_perf_kpi_records for update to authenticated
 using(created_by=(select auth.uid()) and public.cip_perf_can_submit(company_id))
 with check(created_by=(select auth.uid()) and public.cip_perf_can_submit(company_id));
grant select,insert on public.cip_perf_kpi_records to authenticated;
grant update(baseline,target,actual,source_kind,evidence,notes,updated_at) on public.cip_perf_kpi_records to authenticated;

create table if not exists public.cip_perf_process_samples(
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id),
 process_key text not null check(length(trim(process_key)) between 3 and 100),
 process_name text not null check(length(trim(process_name)) between 3 and 160),
 period_start date not null,
 period_end date not null,
 baseline_minutes numeric(12,3) not null check(baseline_minutes>=0),
 current_minutes numeric(12,3) not null check(current_minutes>=0),
 monthly_executions integer not null check(monthly_executions>=0),
 supervision_hours numeric(12,3) not null default 0 check(supervision_hours>=0),
 rework_hours numeric(12,3) not null default 0 check(rework_hours>=0),
 monthly_productive_hours numeric(12,3) not null default 160 check(monthly_productive_hours>0),
 estimated_hour_cost numeric(12,2) check(estimated_hour_cost>=0),
 source_kind text not null default 'manual' check(source_kind in ('manual','erp_parcial','erp_conciliado','instrumentado')),
 evidence text not null default '',
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 constraint cip_perf_process_dates check(period_end>=period_start),
 constraint cip_perf_process_uniq unique(company_id,process_key,period_start,period_end)
);
alter table public.cip_perf_process_samples enable row level security;
create policy "perf_process_read" on public.cip_perf_process_samples for select to authenticated using(public.cip_perf_can_read(company_id));
create policy "perf_process_insert" on public.cip_perf_process_samples for insert to authenticated
 with check(created_by=(select auth.uid()) and public.cip_perf_can_submit(company_id));
grant select,insert on public.cip_perf_process_samples to authenticated;

create table if not exists public.cip_perf_agent_samples(
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id),
 agent_key text not null check(length(trim(agent_key)) between 2 and 100),
 period_start date not null,
 period_end date not null,
 analyses integer not null default 0 check(analyses>=0),
 actions_recommended integer not null default 0 check(actions_recommended>=0),
 actions_executed integer not null default 0 check(actions_executed>=0 and actions_executed<=actions_recommended),
 actions_effective integer not null default 0 check(actions_effective>=0 and actions_effective<=actions_executed),
 tasks_eligible integer not null default 0 check(tasks_eligible>=0),
 tasks_automatic integer not null default 0 check(tasks_automatic>=0 and tasks_automatic<=tasks_eligible),
 before_decision_minutes numeric(12,3) check(before_decision_minutes>=0),
 after_decision_minutes numeric(12,3) check(after_decision_minutes>=0),
 evidence text not null default '',
 source_kind text not null default 'manual' check(source_kind in ('manual','instrumentado')),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 constraint cip_perf_agent_dates check(period_end>=period_start),
 constraint cip_perf_agent_uniq unique(company_id,agent_key,period_start,period_end)
);
alter table public.cip_perf_agent_samples enable row level security;
create policy "perf_agent_read" on public.cip_perf_agent_samples for select to authenticated using(public.cip_perf_can_read(company_id));
create policy "perf_agent_insert" on public.cip_perf_agent_samples for insert to authenticated
 with check(created_by=(select auth.uid()) and public.cip_perf_can_submit(company_id));
grant select,insert on public.cip_perf_agent_samples to authenticated;

create table if not exists public.cip_perf_financial_events(
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id),
 source_key text not null unique check(length(trim(source_key)) between 8 and 180),
 period_start date not null,
 period_end date not null,
 benefit_type text not null check(benefit_type in ('margem_incremental','despesa_reduzida','custo_financeiro_evitado','contratacao_evitada','outro_validavel')),
 description text not null check(length(trim(description))>=10),
 gross_value numeric(18,2) not null check(gross_value>=0),
 incremental_cost numeric(18,2) not null default 0 check(incremental_cost>=0),
 reversals numeric(18,2) not null default 0 check(reversals>=0),
 evidence text not null check(length(trim(evidence))>=12),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 constraint cip_perf_benefit_dates check(period_end>=period_start)
);
create index if not exists cip_perf_finance_company_date_idx on public.cip_perf_financial_events(company_id,period_end desc);
alter table public.cip_perf_financial_events enable row level security;
create policy "perf_financial_read" on public.cip_perf_financial_events for select to authenticated using(public.cip_perf_can_read(company_id));
create policy "perf_financial_submit" on public.cip_perf_financial_events for insert to authenticated
 with check(created_by=(select auth.uid()) and public.cip_perf_can_submit(company_id));
grant select,insert on public.cip_perf_financial_events to authenticated;

-- Os revisores devem ser designados independentemente pela governança do Grupo.
-- Não há GRANT de escrita a papéis do frontend nesta tabela.
create table if not exists public.cip_perf_reviewers(
 user_id uuid not null references auth.users(id) on delete cascade,
 company_id text not null references public.cip_companies(id),
 review_role text not null check(review_role in ('controladoria','diretoria')),
 active boolean not null default true,
 assigned_at timestamptz not null default now(),
 primary key(company_id,user_id)
);
alter table public.cip_perf_reviewers enable row level security;
create policy "perf_reviewer_self_read" on public.cip_perf_reviewers for select to authenticated
 using (user_id=(select auth.uid()));
grant select on public.cip_perf_reviewers to authenticated;

create table if not exists public.cip_perf_financial_approvals(
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.cip_perf_financial_events(id) on delete restrict,
 company_id text not null references public.cip_companies(id),
 reviewer_id uuid not null default auth.uid() references auth.users(id),
 review_role text not null check(review_role in ('controladoria','diretoria')),
 decision text not null check(decision in ('aprovado','rejeitado')),
 evidence_note text not null check(length(trim(evidence_note))>=10),
 created_at timestamptz not null default now(),
 constraint perf_fin_approval_role_once unique(event_id,review_role),
 constraint perf_fin_approval_person_once unique(event_id,reviewer_id)
);
alter table public.cip_perf_financial_approvals enable row level security;
create policy "perf_approval_read" on public.cip_perf_financial_approvals for select to authenticated using(public.cip_perf_can_read(company_id));
create policy "perf_approval_insert_independent" on public.cip_perf_financial_approvals for insert to authenticated
 with check(
 reviewer_id=(select auth.uid())
 and public.cip_perf_can_read(company_id)
 and exists(select 1 from public.cip_perf_reviewers r where r.user_id=(select auth.uid()) and r.company_id=cip_perf_financial_approvals.company_id and r.review_role=cip_perf_financial_approvals.review_role and r.active)
 and exists(select 1 from public.cip_perf_financial_events e where e.id=event_id and e.company_id=cip_perf_financial_approvals.company_id and e.created_by<>(select auth.uid()))
 );
grant select,insert on public.cip_perf_financial_approvals to authenticated;

alter table public.cip_perf_catalog enable row level security;
create policy "perf_catalog_staff_read" on public.cip_perf_catalog for select to authenticated
 using(exists(select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active and p.role in ('superadm','diretoria','gestor')));
grant select on public.cip_perf_catalog to authenticated;

-- Auditável, sem alteração ou deleção de eventos/medições operacionais após captura.
create trigger cip_perf_kpi_audit after insert or update on public.cip_perf_kpi_records
 for each row execute function public.cip_track_change();
create trigger cip_perf_process_audit after insert on public.cip_perf_process_samples
 for each row execute function public.cip_track_change();
create trigger cip_perf_agent_audit after insert on public.cip_perf_agent_samples
 for each row execute function public.cip_track_change();
create trigger cip_perf_financial_audit after insert on public.cip_perf_financial_events
 for each row execute function public.cip_track_change();
create trigger cip_perf_fin_approval_audit after insert on public.cip_perf_financial_approvals
 for each row execute function public.cip_track_change();
