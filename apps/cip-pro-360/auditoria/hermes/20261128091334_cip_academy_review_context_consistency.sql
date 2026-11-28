CREATE OR REPLACE FUNCTION public.cip_academy_flow_refresh()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE t timestamptz:=clock_timestamp(); n integer; archived integer;
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended('cip_academy_flow_refresh',0)) THEN RETURN jsonb_build_object('skipped','locked'); END IF;
 WITH current_material AS (
 SELECT m.*,
 (m.status='approved' AND m.review_due>=current_date AND (m.ingestion_status='not_required' OR(m.ingestion_status='ready' AND m.approved_extraction_id IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM public.cip_academy_materials r WHERE r.company_id=m.company_id AND r.supersedes_id=m.id AND r.status='approved' AND r.review_due>=current_date)) usable
 FROM public.cip_academy_materials m
 ), current_skill AS (
 SELECT s.*,
 (s.status='approved' AND s.review_due>=current_date AND NOT EXISTS(SELECT 1 FROM public.cip_academy_skills r WHERE r.company_id=s.company_id AND r.supersedes_id=s.id AND r.status='approved' AND r.review_due>=current_date)
 AND NOT EXISTS(SELECT 1 FROM unnest(s.source_ids) ids(id) WHERE NOT EXISTS(SELECT 1 FROM current_material m WHERE m.id=ids.id AND m.company_id=s.company_id AND m.usable))
 AND coalesce((SELECT e.source_valid AND e.scenario_passed AND e.limits_passed AND e.created_at>=coalesce((SELECT max(m.reviewed_at) FROM current_material m WHERE m.id=any(s.source_ids) AND m.company_id=s.company_id),'-infinity'::timestamptz) FROM public.cip_academy_evaluations e WHERE e.company_id=s.company_id AND e.skill_id=s.id ORDER BY e.created_at DESC,e.id DESC LIMIT 1),false)) usable
 FROM public.cip_academy_skills s
 ), incoming AS (
 SELECT m.company_id,'material'::text source_kind,m.id::text source_ref,m.agent_id,m.title,
 CASE WHEN m.status='retired' THEN 'retired' WHEN m.usable THEN 'done' WHEN m.ingestion_status IN ('failed','manual_required') THEN 'blocked' WHEN m.status='approved' AND m.review_due<current_date THEN 'review' WHEN m.status='approved' THEN 'blocked' ELSE 'review' END state,
 CASE WHEN m.ingestion_status IN ('failed','manual_required') THEN 1 WHEN m.usable OR m.status='retired' THEN 4 ELSE 2 END priority,
 jsonb_build_object('source_status',m.status,'ingestion_status',m.ingestion_status,'review_due',m.review_due,'usable',m.usable,'next','Conferir fonte, extração e validade; aprovação somente na biblioteca.') detail,m.created_at source_at FROM current_material m
 UNION ALL
 SELECT s.company_id,'skill',s.id::text,s.agent_id,s.title,
 CASE WHEN s.status='retired' THEN 'retired' WHEN s.usable THEN 'done' WHEN s.status='approved' THEN 'blocked' ELSE 'review' END,
 CASE WHEN s.usable OR s.status='retired' THEN 4 WHEN s.status='approved' THEN 1 ELSE 2 END,
 jsonb_build_object('source_status',s.status,'review_due',s.review_due,'usable',s.usable,'source_count',cardinality(s.source_ids),'next','Executar cenário de teste, conferir fontes e limites; não autoaprovar.'),s.created_at FROM current_skill s
 UNION ALL
 SELECT m.company_id,'mission',m.id::text,m.lead_agent,m.title,
 CASE WHEN m.state='dismissed' THEN 'retired' WHEN m.state='measured' AND m.review_state='approved' THEN 'done' WHEN m.state='measured' AND m.review_state='rejected' THEN 'rejected' WHEN m.state='measured' THEN 'review' ELSE 'action' END,
 CASE WHEN m.state IN ('dismissed','measured') AND m.review_state<>'pending' THEN 4 WHEN m.due_date<current_date THEN 1 ELSE 2 END,
 jsonb_build_object('mission_state',m.state,'review_state',m.review_state,'due_date',m.due_date,'owner_assigned',m.owner_name IS NOT NULL,'collaborators',m.collaborators,'next','Atribuir responsável, medir resultado e registrar aprendizado com evidência.'),m.created_at FROM public.cip_agent_missions m
 UNION ALL
 SELECT i.company_id,'incident',i.id::text,CASE i.check_code WHEN 'stock' THEN 'estoque' WHEN 'faro' THEN 'radar' WHEN 'billing' THEN 'financeiro' WHEN 'procfit_source' THEN 'analista' WHEN 'erp' THEN 'analista' WHEN 'queue' THEN 'radar' ELSE 'doquita' END,
 'Guardian · '||i.check_code,
 CASE WHEN i.resolved_at IS NOT NULL THEN 'done' ELSE 'blocked' END,
 CASE WHEN i.resolved_at IS NOT NULL THEN 4 WHEN i.severity='critical' THEN 1 ELSE 2 END,
 jsonb_build_object('severity',i.severity,'check_code',i.check_code,'resolved_at',i.resolved_at,'next','Tratar no Guardian e aguardar verificação de normalização.'),i.opened_at FROM public.cip_guardian_incidents i
 UNION ALL
 SELECT c.company_id,'hermes_context',c.cycle_id::text||':'||c.agent_id,c.agent_id,'Hermes · '||c.role_name,
 CASE WHEN p.id IS NOT NULL THEN 'submitted' WHEN NOT cfg.enabled THEN 'paused' WHEN c.updated_at<t-interval '25 minutes' THEN 'blocked' ELSE 'waiting_runtime' END,
 CASE WHEN p.id IS NOT NULL THEN 4 ELSE 3 END,
 jsonb_build_object('cycle_id',c.cycle_id,'context_at',c.updated_at,'source_stale',c.evidence->'stale','proposal_id',p.id,'next','Consulta externa depende de executor homologado, autorização e orçamento; não disparada por esta fila.'),(c.evidence->>'cycle_at')::timestamptz
 FROM public.cip_agent_learning_context c JOIN public.cip_agent_controls cfg ON cfg.company_id=c.company_id LEFT JOIN public.cip_hermes_proposals p ON p.company_id=c.company_id AND p.agent_id=c.agent_id AND p.cycle_id=c.cycle_id
 UNION ALL
 SELECT p.company_id,'hermes_proposal',p.id::text,p.agent_id,'Candidato Hermes · '||p.agent_id,
 CASE WHEN rv.disposition='nao_adotar' THEN 'rejected' WHEN rv.disposition='encaminhado' AND m.usable THEN 'done' WHEN rv.disposition='encaminhado' AND m.status='draft' THEN 'submitted' ELSE 'review' END,
 CASE WHEN rv.disposition='nao_adotar' OR (rv.disposition='encaminhado' AND m.usable) THEN 4 ELSE 2 END,
 jsonb_build_object('cycle_id',p.cycle_id,'model_reported',p.model_reported,'evidence_refs',p.evidence_refs,'review_disposition',rv.disposition,'material_id',rv.material_id,'next',CASE WHEN rv.disposition='nao_adotar' THEN 'Proposta não adotada; histórico preservado.' WHEN rv.disposition='encaminhado' AND m.usable THEN 'Material vinculado aprovado na biblioteca; não equivale a habilidade aprovada.' WHEN rv.disposition='encaminhado' AND m.status='draft' THEN 'Acompanhar revisão do material vinculado; não é conhecimento homologado.' ELSE 'Revisar hipótese, evidências e limites; vincular a material em rascunho se adotado.' END),p.created_at FROM public.cip_hermes_proposals p
 LEFT JOIN public.cip_academy_flow_items fi ON fi.company_id=p.company_id AND fi.source_kind='hermes_proposal' AND fi.source_ref=p.id::text
 LEFT JOIN LATERAL(SELECT v.disposition,v.material_id FROM public.cip_academy_flow_reviews v WHERE v.item_id=fi.id AND v.company_id=p.company_id ORDER BY v.id DESC LIMIT 1)rv ON true
 LEFT JOIN current_material m ON m.company_id=p.company_id AND m.id=rv.material_id AND m.agent_id=p.agent_id
 )
 INSERT INTO public.cip_academy_flow_items(company_id,source_kind,source_ref,agent_id,title,state,priority,detail,source_at,opened_at,changed_at,last_seen_at)
 SELECT company_id,source_kind,source_ref,agent_id,title,state,priority,detail,source_at,t,t,t FROM incoming
 ON CONFLICT(company_id,source_kind,source_ref) DO UPDATE SET agent_id=excluded.agent_id,title=excluded.title,state=excluded.state,priority=excluded.priority,detail=excluded.detail,source_at=excluded.source_at,last_seen_at=t,changed_at=CASE WHEN cip_academy_flow_items.state IS DISTINCT FROM excluded.state THEN t ELSE cip_academy_flow_items.changed_at END;
 GET DIAGNOSTICS n=ROW_COUNT;
 UPDATE public.cip_academy_flow_items i SET state=CASE WHEN EXISTS(SELECT 1 FROM public.cip_hermes_proposals p WHERE p.company_id=i.company_id AND p.cycle_id::text||':'||p.agent_id=i.source_ref) THEN 'submitted' ELSE 'superseded' END,priority=4,changed_at=t,last_seen_at=t
 WHERE i.source_kind='hermes_context' AND i.state IN ('waiting_runtime','blocked','paused') AND NOT EXISTS(SELECT 1 FROM public.cip_agent_learning_context c WHERE c.company_id=i.company_id AND c.cycle_id::text||':'||c.agent_id=i.source_ref);
 GET DIAGNOSTICS archived=ROW_COUNT;
 RETURN jsonb_build_object('tracked',n,'previous_contexts_archived',archived);
END $function$;
CREATE OR REPLACE FUNCTION public.cip_agent_learning_refresh()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE t timestamptz:=clock_timestamp(); context_count integer; mission_count integer; curriculum_count integer; a record;
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
 and not exists(select 1 from unnest(s.source_ids) ids(id) where not exists(select 1 from public.cip_academy_materials m where m.id=ids.id and m.company_id=s.company_id and m.status='approved' and m.review_due>=current_date and (m.ingestion_status='not_required' or (m.ingestion_status='ready' and m.approved_extraction_id is not null)) and not exists(select 1 from public.cip_academy_materials n where n.company_id=m.company_id and n.supersedes_id=m.id and n.status='approved' and n.review_due>=current_date)))
 and (select e.source_valid and e.scenario_passed and e.limits_passed and e.created_at>=coalesce((select max(m.reviewed_at) from public.cip_academy_materials m where m.company_id=s.company_id and m.id=any(s.source_ids)),'-infinity'::timestamptz) from public.cip_academy_evaluations e where e.company_id=s.company_id and e.skill_id=s.id order by e.created_at desc,e.id desc limit 1)),
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
 FROM ranked r WHERE r.rn<=least(r.mission_limit, greatest(0,20-(select count(*)::integer from public.cip_agent_missions m where m.company_id=r.company_id and m.state in ('suggested','accepted','in_progress'))),greatest(0,r.mission_limit-(select count(*)::integer from public.cip_agent_missions m where m.company_id=r.company_id and m.cycle_id=r.cycle_id and (m.source_key like 'guardian:%' OR m.source_key like 'academy:review:%' OR m.source_key like 'hermes:pilot:%'))))
 ON CONFLICT(company_id,source_key) DO NOTHING;
 GET DIAGNOSTICS mission_count=ROW_COUNT;

 WITH candidates AS (
 SELECT cfg.company_id,cy.id cycle_id,cfg.mission_limit,1 priority,'academy:review:'||d.signature source_key,'escola' lead_agent,ARRAY['escola','doquita','analista'] collaborators,'Revisar habilidades da Academia com fontes e testes' title,'Existem habilidades em rascunho; nenhuma aprovação pode ser presumida.' diagnosis,
 jsonb_build_array(jsonb_build_object('agent','escola','task','Conferir fontes, validade, cenário e limites das habilidades em rascunho.'),jsonb_build_object('agent','analista','task','Validar o caso de teste e registrar evidência observável.'),jsonb_build_object('agent','doquita','task','Encaminhar para revisão autorizada; não aprovar automaticamente.')) steps,
 jsonb_build_object('draft_count',d.n,'draft_skill_ids',d.ids,'mode','academy_review') evidence
 FROM public.cip_agent_controls cfg
 JOIN LATERAL(SELECT id FROM public.cip_agent_cycles WHERE company_id=cfg.company_id ORDER BY created_at DESC,id LIMIT 1)cy ON true
 JOIN LATERAL(SELECT count(*) n,md5(string_agg(id::text,',' ORDER BY id)) signature,jsonb_agg(id ORDER BY id) ids FROM public.cip_academy_skills WHERE company_id=cfg.company_id AND status='draft')d ON d.n>0
 WHERE cfg.enabled AND NOT EXISTS(SELECT 1 FROM public.cip_agent_missions m WHERE m.company_id=cfg.company_id AND (m.source_key='academy:review:'||d.signature OR (m.source_key LIKE 'academy:review:%' AND m.state IN ('suggested','accepted','in_progress'))))
 UNION ALL
 SELECT cfg.company_id,ctx.cycle_id,cfg.mission_limit,2,'hermes:pilot:b2g:v1','comercial',ARRAY['b2g','analista','escola','doquita'],'Íris · piloto de pesquisa B2G com evidências','O ciclo de Íris indica necessidade de dados e não realizou busca de editais; piloto deve produzir fonte verificável e aprendizado revisado.',
 jsonb_build_array(jsonb_build_object('agent','b2g','task','Pesquisar editais em fonte oficial, identificar item, data, link e equivalência; não enviar proposta.'),jsonb_build_object('agent','analista','task','Validar disponibilidade e referências de origem; não confundir estimativa, homologação e entrega.'),jsonb_build_object('agent','escola','task','Registrar o aprendizado candidato e evidência para revisão.'),jsonb_build_object('agent','doquita','task','Aprovar escopo e orçamento do piloto antes de consultar o motor externo.')),
 jsonb_build_object('cycle_id',ctx.cycle_id,'agent_id','b2g','state',ctx.evidence->>'state','source_stale',ctx.evidence->'stale','mode','pilot_pending_runtime')
 FROM public.cip_agent_controls cfg JOIN public.cip_agent_learning_context ctx ON ctx.company_id=cfg.company_id AND ctx.agent_id='b2g'
 WHERE cfg.enabled AND cfg.company_id='distribuidora_prohospital' AND ctx.evidence->>'state'='needs_data'
 AND NOT EXISTS(SELECT 1 FROM public.cip_agent_missions m WHERE m.company_id=cfg.company_id AND m.source_key='hermes:pilot:b2g:v1')
 ), ranked AS (SELECT c.*,row_number() over(partition by company_id order by priority) rn FROM candidates c)
 INSERT INTO public.cip_agent_missions(company_id,cycle_id,source_key,lead_agent,collaborators,title,diagnosis,steps,evidence)
 SELECT r.company_id,r.cycle_id,r.source_key,r.lead_agent,r.collaborators,r.title,r.diagnosis,r.steps,r.evidence FROM ranked r
 WHERE r.rn<=least(greatest(0,20-(SELECT count(*)::integer FROM public.cip_agent_missions m WHERE m.company_id=r.company_id AND m.state IN ('suggested','accepted','in_progress'))),greatest(0,r.mission_limit-(SELECT count(*)::integer FROM public.cip_agent_missions m WHERE m.company_id=r.company_id AND m.cycle_id=r.cycle_id AND (m.source_key LIKE 'guardian:%' OR m.source_key LIKE 'academy:review:%' OR m.source_key LIKE 'hermes:pilot:%'))))
 ON CONFLICT(company_id,source_key) DO NOTHING;
 GET DIAGNOSTICS curriculum_count=ROW_COUNT;
 RETURN jsonb_build_object('contexts',context_count,'new_missions',mission_count+curriculum_count,'guardian_missions',mission_count,'learning_missions',curriculum_count,'engine','cip_rules_not_hermes');
END $function$;
CREATE OR REPLACE FUNCTION public.cip_agent_skills(p_company text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(
 select s.id,s.agent_id,s.title,s.instructions,s.limits,s.source_ids from public.cip_academy_skills s
 where s.company_id=p_company and public.cip_can_access(p_company) and s.status='approved' and s.review_due>=current_date
 and not exists(select 1 from public.cip_academy_skills r where r.company_id=s.company_id and r.supersedes_id=s.id and r.status='approved' and r.review_due>=current_date)
 and not exists(select 1 from unnest(s.source_ids) ids(id) where not exists(select 1 from public.cip_academy_materials m where m.id=ids.id and m.company_id=s.company_id and m.status='approved' and m.review_due>=current_date and (m.ingestion_status='not_required' or (m.ingestion_status='ready' and m.approved_extraction_id is not null)) and not exists(select 1 from public.cip_academy_materials r where r.company_id=m.company_id and r.supersedes_id=m.id and r.status='approved' and r.review_due>=current_date)))
 and (select e.source_valid and e.scenario_passed and e.limits_passed and e.created_at>=coalesce((select max(m.reviewed_at) from public.cip_academy_materials m where m.company_id=s.company_id and m.id=any(s.source_ids)),'-infinity'::timestamptz) from public.cip_academy_evaluations e where e.company_id=s.company_id and e.skill_id=s.id order by e.created_at desc,e.id desc limit 1)
 order by s.reviewed_at desc,s.id limit 14)x;
$function$;
SELECT public.cip_agent_learning_refresh();
SELECT public.cip_academy_flow_refresh();
