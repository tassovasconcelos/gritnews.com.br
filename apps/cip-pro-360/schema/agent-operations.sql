-- CIP agents v1: autonomous analysis, supervised business action, measured learning.
begin;
create schema if not exists cip_agent_private;
revoke all on schema cip_agent_private from public,anon;
grant usage on schema cip_agent_private to authenticated,service_role;
create table public.cip_agent_controls(
 company_id text primary key references public.cip_companies(id),enabled boolean not null default true,
 interval_minutes integer not null default 360 check(interval_minutes between 60 and 1440),
 mission_limit integer not null default 5 check(mission_limit between 1 and 10),
 objective text not null default 'Priorizar disponibilidade, giro e contribuição com evidência.' check(length(btrim(objective)) between 10 and 600),
 last_run_at timestamptz,updated_by uuid references auth.users(id),updated_at timestamptz not null default now(),version integer not null default 1
);
create table public.cip_agent_cycles(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),
 trigger_kind text not null check(trigger_kind in ('scheduled','manual')),actor uuid references auth.users(id),
 engine_version text not null default 'retail-operations-1',created_at timestamptz not null default now(),
 report jsonb not null,unique(id,company_id)
);
create index cip_agent_cycles_company_time on public.cip_agent_cycles(company_id,created_at desc);
create index cip_agent_cycles_actor on public.cip_agent_cycles(actor);
create table public.cip_agent_missions(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),
 cycle_id uuid not null,source_key text not null,source_action text,
 lead_agent text not null check(lead_agent in ('analista','estoque','precos','comercial','escola')),
 collaborators text[] not null,title text not null,diagnosis text not null,steps jsonb not null,evidence jsonb not null,
 metric text not null default 'itens_conferidos' check(metric in ('itens_conferidos','unidades_movimentadas','unidades_vendidas','contribuicao_informada')),
 baseline numeric not null default 0,target numeric check(target>0 and target<=1000000000000),observed numeric check(observed>=0 and observed<=1000000000000),
 state text not null default 'suggested' check(state in ('suggested','accepted','in_progress','measured','dismissed')),
 owner_name text,due_date date,result_note text,lesson text,review_state text not null default 'pending' check(review_state in ('pending','approved','rejected')),
 version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(company_id,source_key),foreign key(cycle_id,company_id) references public.cip_agent_cycles(id,company_id),
 foreign key(source_action,company_id) references public.cip_stock_actions(action_id,company_id)
);
create index cip_agent_missions_company_state on public.cip_agent_missions(company_id,state,created_at desc);
create index cip_agent_missions_cycle on public.cip_agent_missions(cycle_id,company_id);
create index cip_agent_missions_action on public.cip_agent_missions(source_action,company_id);
create table public.cip_agent_events(
 id bigint generated always as identity primary key,company_id text not null references public.cip_companies(id),
 mission_id uuid references public.cip_agent_missions(id),actor uuid references auth.users(id),
 event_type text not null,details jsonb not null,created_at timestamptz not null default now()
);
create index cip_agent_events_company_time on public.cip_agent_events(company_id,created_at desc);
create index cip_agent_events_mission on public.cip_agent_events(mission_id);
create index cip_agent_events_actor on public.cip_agent_events(actor);
-- All writes use checked, atomic functions. No direct client table mutation.
do $$ declare t text;begin
 foreach t in array array['cip_agent_controls','cip_agent_cycles','cip_agent_missions','cip_agent_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy company_read on public.%I for select to authenticated using(public.cip_can_access(company_id))',t);
 end loop;
end;$$;
grant usage,select on sequence public.cip_agent_events_id_seq to service_role;
create function cip_agent_private.manager(c text) returns boolean language sql stable security invoker set search_path='' as $$
 select public.cip_can_access(c) and exists(select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active and (p.role='superadm' or p.role in ('diretoria','gestor') and exists(select 1 from public.cip_memberships m where m.user_id=p.user_id and m.company_id=c and m.active and m.role in ('diretoria','gestor'))));
$$;
revoke all on function cip_agent_private.manager(text) from public,anon;
grant execute on function cip_agent_private.manager(text) to authenticated,service_role;

-- This internal routine is callable only by the scheduler or the checked wrapper.
create function cip_agent_private.run_cycle(c text,kind text,actor_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cfg public.cip_agent_controls;b public.cip_stock_intelligence_batches;rid uuid;stale boolean;facts jsonb;counts jsonb;knowledge jsonb;cases jsonb;dossiers jsonb;agent_id text;entry jsonb;state_label text;detail text;metric_label text;action_row record;created_count integer:=0;written integer;mid uuid;age integer;cycle_report jsonb;slots integer;
begin
 select * into cfg from public.cip_agent_controls where company_id=c for update;
 if not found then raise exception 'unknown_company';end if;
 if not cfg.enabled then return jsonb_build_object('skipped','paused');end if;
 if cfg.last_run_at>now()-make_interval(mins=>case when kind='scheduled' then cfg.interval_minutes else 5 end) then return jsonb_build_object('skipped','recent_cycle');end if;
 if kind not in ('scheduled','manual') then raise exception 'invalid_trigger';end if;
 select * into b from public.cip_stock_intelligence_batches where company_id=c and status='active' order by as_of desc,created_at desc,id limit 1;
 age:=(now() at time zone 'America/Sao_Paulo')::date-b.as_of;
 stale:=b.id is null or age>1 or age<0;
 select coalesce(jsonb_object_agg(x.kind,x.n),'{}') into counts from(select a.kind,count(*) n from public.cip_stock_actions a where a.company_id=c and a.batch_id=b.id and a.state='sugerida' group by a.kind)x;
 -- Only approved, current, non-superseded knowledge enters the cycle.
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into knowledge from(
 select m.id,m.agent_id,m.title,left(m.content,1800) as excerpt,m.review_due,m.approved_extraction_id from public.cip_academy_materials m
 where m.company_id=c and m.status='approved' and m.review_due>=current_date
 and (m.kind='orientation' or m.ingestion_status='ready')
 and not exists(select 1 from public.cip_academy_materials r where r.company_id=c and r.supersedes_id=m.id and r.status='approved' and r.review_due>=current_date)
 order by m.reviewed_at desc,m.id limit 14)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into cases from(
 select id,lead_agent,title,metric,baseline,target,observed,lesson,updated_at from public.cip_agent_missions
 where company_id=c and state='measured' and review_state='approved' order by updated_at desc,id limit 10)x;
 select jsonb_build_object('company',c,'batch_id',b.id,'as_of',b.as_of,'age_days',age,'stale',stale,'summary',b.summary,'pending_by_kind',counts,
 'quotes_open',(select count(*) from public.cip_quotes where company_id=c and status in ('rascunho','enviada','negociacao')),
 'demands_open',(select count(*) from public.cip_demands where company_id=c and status in ('registrado','em_busca')),
 'missions_open',(select count(*) from public.cip_agent_missions where company_id=c and state in ('suggested','accepted','in_progress')),
 'approved_knowledge',jsonb_array_length(knowledge),'reviewed_cases',jsonb_array_length(cases)) into facts;
 dossiers:='[]';
 foreach agent_id in array array['doquita','analista','estoque','compras','precos','comercial','financeiro','estrategico','marketing','radar','escola','logistica','experiencia_cliente','b2g'] loop
 if agent_id='b2g' and c<>'distribuidora_prohospital' then continue;end if;
 state_label:='analyzed';
 case agent_id
 when 'doquita' then detail:='Consolidar prioridades, reunir especialistas e cobrar evidência antes de decidir.';metric_label:='Missões medidas com evidência e revisão';
 when 'analista' then detail:=case when stale then 'Prioridade: atualizar e conciliar a posição de estoque; não liberar decisão comercial com carga antiga.' else 'Conferir lacunas, unidade, reservas e período da demanda antes de usar cobertura.' end;metric_label:='Pendências de dados conferidas';
 when 'estoque' then detail:=coalesce(counts->>'redistribuicao','0')||' propostas de redistribuição e '||coalesce(counts->>'campanha','0')||' de campanha aguardam validação na origem.';metric_label:='Unidades verificadas e movimentadas, sem equiparar a caixa';
 when 'compras' then detail:='Validar demanda atual, estoque reservado, prazo e pedidos abertos antes de repor. Cenário de risco não comprova ruptura.';metric_label:='Pedidos justificados com demanda confirmada';state_label:='needs_data';
 when 'precos' then detail:=coalesce(counts->>'preco','0')||' revisões de preço propostas. Conferir custos, tributos, frete, piso de contribuição e alçada no Marca-passo.';metric_label:='Contribuição do piloto medida após custos';
 when 'comercial' then detail:=(facts->>'quotes_open')||' cotações abertas e '||(facts->>'demands_open')||' procuras em acompanhamento no CIP; priorizar retorno pelo time.';metric_label:='Procuras e cotações com próximo passo confirmado';
 when 'financeiro' then detail:='Posição de estoque a custo é capital imobilizado. Economia, receita incremental e caixa liberado exigem conciliação; não somar potenciais de missões.';metric_label:='Contribuição e caixa conciliados';
 when 'estrategico' then detail:='Diretriz vigente: '||cfg.objective||' Conferir responsáveis, metas, prazo e bloqueios.';metric_label:='Missões no prazo com resultado revisado';
 when 'marketing' then detail:=coalesce(counts->>'campanha','0')||' candidatas de campanha. Definir público, estoque elegível, período e controle; envio e lançamento dependem do time.';metric_label:='Conversão e contribuição incremental do piloto';
 when 'radar' then detail:='A análise deste ciclo não coletou concorrentes. Consultar Radar e registrar fonte, data e equivalência antes de usar preço externo.';metric_label:='Referências equivalentes e atuais';state_label:='needs_data';
 when 'escola' then detail:=jsonb_array_length(knowledge)||' materiais aprovados e atuais; '||jsonb_array_length(cases)||' casos medidos revisados disponíveis como contexto. Ensinar com caso, evidência e contraponto.';metric_label:='Casos medidos e revisados, sem treino automático de modelo';
 when 'logistica' then detail:=coalesce(counts->>'redistribuicao','0')||' propostas de redistribuição; validar custo de transporte, lote e aceite do destino antes de movimentar.';metric_label:='Prazo e custo por transferência confirmada';
 when 'experiencia_cliente' then detail:=(facts->>'demands_open')||' procuras abertas. Garantir responsável e retorno pelo time; o ciclo não contatou clientes.';metric_label:='Procuras com retorno e causa documentados';
 when 'b2g' then detail:='Íris mantém pesquisa sob demanda no Radar B2G. Este ciclo não consultou novos editais; não estima propostas nem ganhos.';metric_label:='Oportunidades com equivalência e edital revisados';state_label:='needs_data';
 end case;
 dossiers:=dossiers||jsonb_build_array(jsonb_build_object('agent_id',agent_id,'state',state_label,'analysis',detail,'metric',metric_label,'source','CIP · posição e registros internos','stale',stale));
 end loop;
 cycle_report:=jsonb_build_object('facts',facts,'agents',dossiers,'knowledge',knowledge,'reviewed_cases',cases,'objective',cfg.objective,'created_missions',0,'mode','rules_and_evidence','notice','Análise automática por regras versionadas. Cenários não são resultados realizados. Sem execução no ERP, mensagens ou alteração de preços.');
 insert into public.cip_agent_cycles(company_id,trigger_kind,actor,report) values(c,kind,actor_id,cycle_report) returning id into rid;
 if stale then
 insert into public.cip_agent_missions(company_id,cycle_id,source_key,lead_agent,collaborators,title,diagnosis,steps,evidence)
 values(c,rid,'refresh:'||coalesce(b.id,'missing'),'analista',array['estoque','compras','precos','doquita'],'Atualizar e conciliar a base antes das ações comerciais',
 'A posição está ausente, futura ou tem mais de um dia. O squad precisa de saldo, reservas, unidade e demanda atualizados.',
 '[{"agent":"analista","task":"Conferir data, fonte e totais da nova posição."},{"agent":"estoque","task":"Conciliar saldo, unidade, reservas e lote."},{"agent":"doquita","task":"Reexecutar análise após atualização e validar prioridades."}]',facts)
 on conflict(company_id,source_key) do nothing;get diagnostics written=row_count;created_count:=created_count+written;
 else
 slots:=greatest(0,20-(select count(*)::integer from public.cip_agent_missions where company_id=c and state in ('suggested','accepted','in_progress')));
 for action_row in select x.* from(select a.*,row_number() over(partition by a.kind order by a.priority desc,a.action_id) as kind_rank from public.cip_stock_actions a where a.company_id=c and a.batch_id=b.id and a.state='sugerida' and not exists(select 1 from public.cip_agent_missions m where m.company_id=c and m.source_action=a.action_id))x order by x.kind_rank,x.priority desc,x.action_id limit least(cfg.mission_limit,slots) loop
 insert into public.cip_agent_missions(company_id,cycle_id,source_key,source_action,lead_agent,collaborators,title,diagnosis,steps,evidence)
 values(c,rid,'stock:'||action_row.action_id,action_row.action_id,case when action_row.kind='conferencia' then 'analista' when action_row.kind='preco' then 'precos' else 'estoque' end,
 array['analista','estoque','precos','financeiro','comercial','logistica','doquita'],
 left(initcap(action_row.kind)||' · '||action_row.sku||' · unidade '||action_row.source_store,160),
 'Proposta gerada da posição: '||action_row.description||'. Validar fonte e premissas antes de adotar a ação.',
 jsonb_build_array(jsonb_build_object('agent','analista','task','Validar posição, unidade e período; registrar lacunas.'),jsonb_build_object('agent','estoque','task','Conferir saldo livre, reservas, lotes e validade.'),jsonb_build_object('agent','precos','task','Validar contribuição, tributos, frete e regra aprovada no Marca-passo.'),jsonb_build_object('agent','comercial','task','Preparar ação com responsável, público e meta; aguardar validação.'),jsonb_build_object('agent','financeiro','task','Medir resultado sem duplicar caixa, receita ou economia.'),jsonb_build_object('agent','doquita','task','Encaminhar validação ao gestor e cobrar evidência do resultado.')),
 jsonb_build_object('batch_id',b.id,'as_of',b.as_of,'action_id',action_row.action_id,'action_version',action_row.version,'quantity_limit',action_row.quantity_limit,'payload',action_row.payload))
 on conflict(company_id,source_key) do nothing;get diagnostics written=row_count;created_count:=created_count+written;
 end loop;
 end if;
 -- Closing the learning loop is itself a tracked mission, never automatic self-certification.
 if exists(select 1 from public.cip_agent_missions where company_id=c and state='measured' and review_state='pending') then
 insert into public.cip_agent_missions(company_id,cycle_id,source_key,lead_agent,collaborators,title,diagnosis,steps,evidence)
 values(c,rid,'learning:'||(now() at time zone 'America/Sao_Paulo')::date,'escola',array['doquita','analista'],'Revisar os casos medidos e transformar experiência em orientação',
 'Há resultados informados aguardando revisão. Conferir evidência, causalidade e limites antes de usar o caso.',
 '[{"agent":"escola","task":"Conferir resultado, referência e limites com o gestor."},{"agent":"doquita","task":"Usar apenas casos aprovados como contexto de decisões futuras."}]',jsonb_build_object('basis','resultados informados pelo time; não conciliados automaticamente')) on conflict(company_id,source_key) do nothing;
 get diagnostics written=row_count;created_count:=created_count+written;
 end if;
 update public.cip_agent_cycles set report=cycle_report||jsonb_build_object('created_missions',created_count) where id=rid;
 update public.cip_agent_controls set last_run_at=now() where company_id=c;
 insert into public.cip_agent_events(company_id,actor,event_type,details) values(c,actor_id,'cycle_completed',jsonb_build_object('cycle_id',rid,'created_missions',created_count,'trigger',kind));
 return jsonb_build_object('cycle_id',rid,'created_missions',created_count,'stale',stale);
end;$$;
revoke all on function cip_agent_private.run_cycle(text,text,uuid) from public,anon,authenticated,service_role;

create function cip_agent_private.command(p_company text,p_command text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid();cfg public.cip_agent_controls;m public.cip_agent_missions;next_state text;changed uuid;
begin
 if actor_id is null or not cip_agent_private.manager(p_company) then raise exception 'manager_required';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>14000 then raise exception 'invalid_command';end if;
 select * into cfg from public.cip_agent_controls where company_id=p_company for update;if not found then raise exception 'unknown_company';end if;
 if p_command='run' then return cip_agent_private.run_cycle(p_company,'manual',actor_id);end if;
 if p_command='configure' then
 if (p_data->>'version')::integer is distinct from cfg.version then raise exception 'version_changed';end if;
 if jsonb_typeof(p_data->'enabled') is distinct from 'boolean' or length(btrim(coalesce(p_data->>'objective',''))) not between 10 and 600 or jsonb_typeof(p_data->'interval_minutes') is distinct from 'number' or jsonb_typeof(p_data->'mission_limit') is distinct from 'number' or (p_data->>'interval_minutes')::integer not between 60 and 1440 or (p_data->>'mission_limit')::integer not between 1 and 10 then raise exception 'invalid_controls';end if;
 update public.cip_agent_controls set enabled=(p_data->>'enabled')::boolean,objective=btrim(p_data->>'objective'),interval_minutes=(p_data->>'interval_minutes')::integer,mission_limit=(p_data->>'mission_limit')::integer,updated_by=actor_id,updated_at=now(),version=version+1 where company_id=p_company;
 insert into public.cip_agent_events(company_id,actor,event_type,details) values(p_company,actor_id,'controls_changed',jsonb_build_object('before',to_jsonb(cfg),'after',p_data));
 return jsonb_build_object('saved',true);
 end if;
 if p_command<>'mission' then raise exception 'invalid_command';end if;
 select * into m from public.cip_agent_missions where id=(p_data->>'id')::uuid and company_id=p_company for update;
 if not found or m.version is distinct from (p_data->>'version')::integer then raise exception 'version_changed';end if;
 next_state:=p_data->>'state';
 if next_state='review' then
 if m.state<>'measured' or m.review_state<>'pending' or p_data->>'review_state' is null or p_data->>'review_state' not in ('approved','rejected') then raise exception 'invalid_transition';end if;
 if length(btrim(coalesce(p_data->>'note',''))) not between 20 and 2000 then raise exception 'evidence_required';end if;
 update public.cip_agent_missions set review_state=p_data->>'review_state',version=version+1,updated_at=now() where id=m.id;
 else
 if next_state is null or not(m.state='suggested' and next_state in ('accepted','dismissed') or m.state='accepted' and next_state in ('in_progress','dismissed') or m.state='in_progress' and next_state in ('measured','dismissed')) then raise exception 'invalid_transition';end if;
 if length(btrim(coalesce(p_data->>'note',''))) not between 10 and 2000 then raise exception 'evidence_required';end if;
 if next_state='accepted' then
 if length(btrim(coalesce(p_data->>'owner_name',''))) not between 3 and 120 or (p_data->>'due_date')::date is null or (p_data->>'due_date')::date<(now() at time zone 'America/Sao_Paulo')::date or p_data->>'metric' is null or p_data->>'metric' not in ('itens_conferidos','unidades_movimentadas','unidades_vendidas','contribuicao_informada') or jsonb_typeof(p_data->'target') is distinct from 'number' or (p_data->>'target')::numeric<=0 then raise exception 'goal_required';end if;
 update public.cip_agent_missions set owner_name=btrim(p_data->>'owner_name'),due_date=(p_data->>'due_date')::date,metric=p_data->>'metric',target=(p_data->>'target')::numeric where id=m.id;
 end if;
 if next_state='measured' then
 if jsonb_typeof(p_data->'observed') is distinct from 'number' or (p_data->>'observed')::numeric<0 or length(btrim(coalesce(p_data->>'lesson',''))) not between 20 and 2000 then raise exception 'result_required';end if;
 update public.cip_agent_missions set observed=(p_data->>'observed')::numeric,result_note=btrim(p_data->>'note'),lesson=btrim(p_data->>'lesson') where id=m.id;
 end if;
 update public.cip_agent_missions set state=next_state,version=version+1,updated_at=now() where id=m.id;
 end if;
 insert into public.cip_agent_events(company_id,mission_id,actor,event_type,details) values(p_company,m.id,actor_id,'mission_'||next_state,jsonb_build_object('before_state',m.state,'before_version',m.version,'input',p_data,'scope','supervisao interna; nao aprova nem executa acao de estoque ou ERP'));
 return jsonb_build_object('saved',true,'mission_id',m.id);
end;$$;
revoke all on function cip_agent_private.command(text,text,jsonb) from public,anon;
grant execute on function cip_agent_private.command(text,text,jsonb) to authenticated;
create function public.cip_agent_command(p_company text,p_command text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select cip_agent_private.command(p_company,p_command,p_data);$$;
revoke all on function public.cip_agent_command(text,text,jsonb) from public,anon;
grant execute on function public.cip_agent_command(text,text,jsonb) to authenticated;

create function public.cip_agent_can_manage(p_company text) returns boolean language sql stable security invoker set search_path='' as $$select cip_agent_private.manager(p_company);$$;
revoke all on function public.cip_agent_can_manage(text) from public,anon;
grant execute on function public.cip_agent_can_manage(text) to authenticated;
create table public.cip_agent_councils(
 id uuid primary key default gen_random_uuid(),company_id text not null,cycle_id uuid not null,actor uuid not null references auth.users(id),
 created_at timestamptz not null default now(),model text not null,result jsonb not null,
 foreign key(cycle_id,company_id) references public.cip_agent_cycles(id,company_id)
);
create index cip_agent_councils_company_time on public.cip_agent_councils(company_id,created_at desc);
create index cip_agent_councils_cycle on public.cip_agent_councils(cycle_id,company_id);
create index cip_agent_councils_actor on public.cip_agent_councils(actor,created_at desc);
alter table public.cip_agent_councils enable row level security;
revoke all on public.cip_agent_councils from public,anon,authenticated;
grant select on public.cip_agent_councils to authenticated;
grant all on public.cip_agent_councils to service_role;
create policy company_read on public.cip_agent_councils for select to authenticated using(public.cip_can_access(company_id));
-- Atomic quota before model invocation; failed calls also consume a slot.
create table cip_agent_private.council_usage(actor uuid not null references auth.users(id),used_at timestamptz not null default now());
create index on cip_agent_private.council_usage(actor,used_at desc);
revoke all on cip_agent_private.council_usage from public,anon,authenticated;
create function public.cip_agent_council_claim(p_actor uuid,p_company text) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('cip-council:'||p_actor::text,0));
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role in ('superadm','diretoria','gestor'))
 or not exists(select 1 from public.cip_profiles p where p.user_id=p_actor and (p.role='superadm' or exists(select 1 from public.cip_memberships m where m.user_id=p_actor and m.company_id=p_company and m.active and m.role in ('diretoria','gestor')))) then return false;end if;
 if (select count(*) from cip_agent_private.council_usage where actor=p_actor and used_at>now()-interval '1 day')>=12 then return false;end if;
 insert into cip_agent_private.council_usage(actor) values(p_actor);return true;
end;$$;
revoke all on function public.cip_agent_council_claim(uuid,text) from public,anon,authenticated;
grant all on cip_agent_private.council_usage to service_role;
grant execute on function public.cip_agent_council_claim(uuid,text) to service_role;

create function public.cip_agent_skills(p_company text) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(
 select s.id,s.agent_id,s.title,s.instructions,s.limits,s.source_ids from public.cip_academy_skills s
 where s.company_id=p_company and public.cip_can_access(p_company) and s.status='approved' and s.review_due>=current_date
 and not exists(select 1 from public.cip_academy_skills r where r.company_id=s.company_id and r.supersedes_id=s.id and r.status='approved' and r.review_due>=current_date)
 and not exists(select 1 from unnest(s.source_ids) ids(id) where not exists(select 1 from public.cip_academy_materials m where m.id=ids.id and m.company_id=s.company_id and m.status='approved' and m.review_due>=current_date and not exists(select 1 from public.cip_academy_materials r where r.company_id=m.company_id and r.supersedes_id=m.id and r.status='approved' and r.review_due>=current_date)))
 and (select e.source_valid and e.scenario_passed and e.limits_passed from public.cip_academy_evaluations e where e.company_id=s.company_id and e.skill_id=s.id order by e.created_at desc,e.id desc limit 1)
 order by s.reviewed_at desc,s.id limit 14)x;
$$;
revoke all on function public.cip_agent_skills(text) from public,anon;
grant execute on function public.cip_agent_skills(text) to authenticated;

-- Scheduler has no inbound HTTP endpoint and never calls a paid model.
create function cip_agent_private.tick() returns void language plpgsql security definer set search_path='' as $$
declare c record;
begin
 for c in select company_id from public.cip_agent_controls where enabled and (last_run_at is null or last_run_at<=now()-make_interval(mins=>interval_minutes)) loop
 begin perform cip_agent_private.run_cycle(c.company_id,'scheduled',null);
 exception when others then
 insert into public.cip_agent_events(company_id,event_type,details) values(c.company_id,'cycle_failed',jsonb_build_object('code',sqlstate,'message','Falha no ciclo; revisar operação. Nenhuma ação externa executada.'));
 end;
 end loop;
end;$$;
revoke all on function cip_agent_private.tick() from public,anon,authenticated,service_role;
insert into public.cip_agent_controls(company_id) values('shopping_prohospital'),('distribuidora_prohospital');
-- Every hour checks the per-company interval, initially six hours; no business writes or messages.
select cron.schedule('cip-agent-operations','17 * * * *','select cip_agent_private.tick();');
comment on table public.cip_agent_cycles is 'Actual versioned rule-engine executions. No LLM inference unless separately requested; no ERP mutation or outbound contact.';
comment on table public.cip_agent_missions is 'Persistent coordinated work proposals, human owned goals and attested measurements. Acceptance never approves a source stock action. Reviewed cases are contextual knowledge, not model weight training.';
commit;
