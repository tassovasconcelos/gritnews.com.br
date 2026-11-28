SET LOCAL lock_timeout='3s';
CREATE TABLE public.cip_agent_learning_context (
 company_id text NOT NULL REFERENCES public.cip_companies(id),
 agent_id text NOT NULL,
 cycle_id uuid NOT NULL,
 role_name text NOT NULL,
 next_action text NOT NULL,
 evidence jsonb NOT NULL,
 approved_skill_count integer NOT NULL CHECK(approved_skill_count>=0),
 reviewed_case_count integer NOT NULL CHECK(reviewed_case_count>=0),
 updated_at timestamptz NOT NULL,
 PRIMARY KEY(company_id,agent_id),
 FOREIGN KEY(cycle_id,company_id) REFERENCES public.cip_agent_cycles(id,company_id),
 CHECK(agent_id IN ('doquita','analista','estoque','compras','precos','comercial','financeiro','estrategico','marketing','radar','escola','logistica','experiencia_cliente','b2g')),
 CHECK(agent_id<>'b2g' OR company_id='distribuidora_prohospital')
);
CREATE INDEX cip_agent_learning_cycle_fk ON public.cip_agent_learning_context(cycle_id,company_id);
ALTER TABLE public.cip_agent_learning_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cip_agent_learning_context FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.cip_agent_learning_context TO authenticated;
CREATE POLICY cip_learning_read ON public.cip_agent_learning_context FOR SELECT TO authenticated USING(public.cip_can_access(company_id) AND EXISTS(SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','gestor','diretoria')));
CREATE FUNCTION public.cip_agent_learning_refresh() RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE t timestamptz:=clock_timestamp(); context_count integer; mission_count integer; a record;
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended('cip_agent_learning_refresh',0)) THEN RETURN jsonb_build_object('skipped','locked'); END IF;
 WITH cycles AS (
 SELECT DISTINCT ON (c.company_id) c.id,c.company_id,c.created_at,c.report FROM public.cip_agent_cycles c JOIN public.cip_agent_controls cfg ON cfg.company_id=c.company_id AND cfg.enabled ORDER BY c.company_id,c.created_at DESC,c.id
 ), roles(agent_id,role_name,next_action) AS (VALUES
 ('doquita','Doquita · coordenação','Priorizar incidentes, cobrar responsáveis e validar evidências antes de liberar decisões.'),
 ('analista','Atlas · dados','Conciliar ERP, data, unidade, reservas e totais; registrar lacunas.'),
 ('estoque','Giro · estoque','Conferir saldos atuais, lotes, validade e disponibilidade por unidade.'),
 ('compras','Nexo · compras','Validar demanda, pedidos abertos, prazo e orçamento; não emitir pedido sem autorização.'),
 ('precos','Prisma · preços','Normalizar EAN, embalagem, custo, tributos, frete e contribuição antes de recomendar preço.'),
 ('comercial','Elo · comercial','Conferir cotações e procuras registradas, definir retorno humano e oportunidade recuperável.'),
 ('financeiro','Cifra · financeiro','Conciliar custos e comprovação de resultados; separar potencial de realizado.'),
 ('estrategico','RufasIA · estratégia','Organizar prioridades, prazos, alçadas e evidências para diretoria.'),
 ('marketing','Faísca · marketing','Revisar elegibilidade de campanhas com estoque atual, margem e público; não publicar automaticamente.'),
 ('radar','Faro · concorrência','Validar fonte, cota e equivalência; preservar circuito e não repetir falhas indiscriminadamente.'),
 ('escola','Sofia · qualidade','Revisar habilidades em rascunho, fontes, testes, limites e casos medidos; não autoaprovar.'),
 ('logistica','Rumo · logística','Conciliar remessas, lote, aceite e custo com ERP/ROTA PRO antes de movimentar.'),
 ('experiencia_cliente','Lia · experiência','Conferir procuras e retornos, registrar causa e responsável sem expor dados pessoais.'),
 ('b2g','Íris · B2G','Pesquisar PNCP e edital oficial, validar item e equivalência antes de encaminhar proposta.')
 )
 INSERT INTO public.cip_agent_learning_context(company_id,agent_id,cycle_id,role_name,next_action,evidence,approved_skill_count,reviewed_case_count,updated_at)
 SELECT c.company_id,r.agent_id,c.id,r.role_name,r.next_action,
 jsonb_build_object('cycle_at',c.created_at,'state',x->>'state','stale',x->'stale','draft_skills',(select count(*) from public.cip_academy_skills s where s.company_id=c.company_id and s.agent_id=r.agent_id and s.status='draft'),'guardian',(select coalesce(jsonb_agg(jsonb_build_object('code',g.check_code,'severity',g.severity,'checked_at',g.checked_at)),'[]') from public.cip_guardian_status g where g.company_id=c.company_id and g.checked_at between t-interval '25 minutes' and t+interval '1 minute'),'lesson_policy','Apenas casos aprovados; não é treino do modelo'),
 (select count(*) from public.cip_academy_skills s where s.company_id=c.company_id and s.agent_id=r.agent_id and s.status='approved' and s.review_due>=current_date
 and not exists(select 1 from public.cip_academy_skills n where n.company_id=s.company_id and n.supersedes_id=s.id and n.status='approved' and n.review_due>=current_date)
 and not exists(select 1 from unnest(s.source_ids) ids(id) where not exists(select 1 from public.cip_academy_materials m where m.id=ids.id and m.company_id=s.company_id and m.status='approved' and m.review_due>=current_date and not exists(select 1 from public.cip_academy_materials n where n.company_id=m.company_id and n.supersedes_id=m.id and n.status='approved' and n.review_due>=current_date)))
 and (select e.source_valid and e.scenario_passed and e.limits_passed from public.cip_academy_evaluations e where e.company_id=s.company_id and e.skill_id=s.id order by e.created_at desc,e.id desc limit 1)),
 (select count(*) from public.cip_agent_missions m where m.company_id=c.company_id and (m.lead_agent=r.agent_id or r.agent_id=any(m.collaborators)) and m.state='measured' and m.review_state='approved' and length(btrim(coalesce(m.lesson,'')))>=10),t
 FROM cycles c CROSS JOIN LATERAL jsonb_array_elements(case when jsonb_typeof(c.report->'agents')='array' then c.report->'agents' else '[]'::jsonb end)x JOIN roles r ON r.agent_id=x->>'agent_id'
 WHERE r.agent_id<>'b2g' OR c.company_id='distribuidora_prohospital'
 ON CONFLICT(company_id,agent_id) DO UPDATE SET cycle_id=excluded.cycle_id,role_name=excluded.role_name,next_action=excluded.next_action,evidence=excluded.evidence,approved_skill_count=excluded.approved_skill_count,reviewed_case_count=excluded.reviewed_case_count,updated_at=excluded.updated_at;
 GET DIAGNOSTICS context_count=ROW_COUNT;
 -- Do not reopen previously declined missions or compete with the existing stock-refresh mission.
 WITH candidates AS (
 SELECT i.*,c.id cycle_id,cfg.mission_limit,
 CASE i.check_code WHEN 'faro' THEN 'precos' WHEN 'queue' THEN 'analista' WHEN 'billing' THEN 'analista' WHEN 'execution' THEN 'comercial' WHEN 'results' THEN 'analista' WHEN 'procfit_source' THEN 'analista' ELSE 'analista' END lead,
 CASE i.check_code WHEN 'faro' THEN ARRAY['radar','precos','doquita'] WHEN 'queue' THEN ARRAY['radar','analista','doquita'] WHEN 'billing' THEN ARRAY['financeiro','doquita'] WHEN 'execution' THEN ARRAY['comercial','marketing','estrategico','doquita'] WHEN 'results' THEN ARRAY['financeiro','escola','doquita'] WHEN 'procfit_source' THEN ARRAY['analista','estoque','compras','logistica','doquita'] ELSE ARRAY['doquita'] END collaborators,
 CASE i.check_code WHEN 'faro' THEN 'Homologar fontes e recuperar Faro com segurança' WHEN 'queue' THEN 'Auditar fila atrasada sem reprocessamento indiscriminado' WHEN 'billing' THEN 'Conciliar custos e créditos dos provedores' WHEN 'execution' THEN 'Priorizar sugestões e atribuir responsáveis' WHEN 'results' THEN 'Definir evidência e revisão de resultados' WHEN 'procfit_source' THEN 'Validar origem Procfit e acesso da VM' ELSE 'Investigar diagnóstico Guardian' END title,
 CASE i.check_code WHEN 'faro' THEN 'Validar cota, fonte autorizada e equivalência; manter proteção ativa.' WHEN 'queue' THEN 'Inspecionar registros da fila; não forçar novas chamadas nem descartar histórico.' WHEN 'billing' THEN 'Solicitar relatórios oficiais e conciliar custos; não registrar desconhecido como zero.' WHEN 'execution' THEN 'Revisar ações válidas após atualização da base e propor responsável e prazo.' WHEN 'results' THEN 'Definir referência, indicador e comprovante; não declarar ganho sem revisão.' WHEN 'procfit_source' THEN 'Conferir serviço da VM, rede, credenciais de leitura e contrato da view com TI.' ELSE 'Validar fonte antes de agir.' END action
 FROM public.cip_guardian_incidents i JOIN public.cip_agent_controls cfg ON cfg.company_id=i.company_id AND cfg.enabled
 JOIN LATERAL(SELECT id FROM public.cip_agent_cycles WHERE company_id=i.company_id ORDER BY created_at DESC,id LIMIT 1)c ON true
 WHERE i.resolved_at IS NULL AND i.last_seen_at between t-interval '25 minutes' and t+interval '1 minute' AND i.check_code IN ('faro','queue','billing','execution','results','procfit_source') AND NOT EXISTS(SELECT 1 FROM public.cip_agent_missions m WHERE m.company_id=i.company_id AND m.source_key='guardian:'||i.id)
 ), ranked AS (
 SELECT c.*,row_number() over(partition by c.company_id order by case c.severity when 'critical' then 0 else 1 end,case c.check_code when 'procfit_source' then 0 when 'faro' then 1 when 'billing' then 2 when 'execution' then 3 when 'results' then 4 else 5 end,c.id) rn FROM candidates c
 )
 INSERT INTO public.cip_agent_missions(company_id,cycle_id,source_key,lead_agent,collaborators,title,diagnosis,steps,evidence)
 SELECT r.company_id,r.cycle_id,'guardian:'||r.id,r.lead,r.collaborators,r.title,'Incidente real Guardian: '||r.check_code||' · '||r.severity||'. Ação supervisionada, ainda não executada.',
 jsonb_build_array(jsonb_build_object('agent',r.collaborators[1],'task',r.action),jsonb_build_object('agent','doquita','task','Atribuir responsável humano, definir meta e prazo e conferir retorno.')),
 jsonb_build_object('incident_id',r.id,'check_code',r.check_code,'severity',r.severity,'checked_at',r.last_seen_at,'detail',r.detail,'mode','guardian_deterministic')
 FROM ranked r WHERE r.rn<=least(r.mission_limit, greatest(0,20-(select count(*)::integer from public.cip_agent_missions m where m.company_id=r.company_id and m.state in ('suggested','accepted','in_progress'))),greatest(0,r.mission_limit-(select count(*)::integer from public.cip_agent_missions m where m.company_id=r.company_id and m.cycle_id=r.cycle_id and m.source_key like 'guardian:%')))
 ON CONFLICT(company_id,source_key) DO NOTHING;
 GET DIAGNOSTICS mission_count=ROW_COUNT;
 RETURN jsonb_build_object('contexts',context_count,'new_missions',mission_count,'engine','cip_rules_not_hermes');
END $fn$;
REVOKE ALL ON FUNCTION public.cip_agent_learning_refresh() FROM PUBLIC,anon,authenticated;
SELECT public.cip_agent_learning_refresh();
SELECT cron.schedule('cip-agent-learning-context','7,17,27,37,47,57 * * * *','SELECT public.cip_agent_learning_refresh();');
