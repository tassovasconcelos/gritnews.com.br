SET LOCAL lock_timeout='3s';
CREATE TABLE public.cip_academy_flow_items(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id text NOT NULL REFERENCES public.cip_companies(id),
 source_kind text NOT NULL CHECK(source_kind IN ('material','skill','mission','incident','hermes_context','hermes_proposal')),
 source_ref text NOT NULL,agent_id text NOT NULL,title text NOT NULL,
 state text NOT NULL CHECK(state IN ('review','action','blocked','done','retired','rejected','waiting_runtime','submitted','superseded','paused')),
 priority smallint NOT NULL CHECK(priority BETWEEN 1 AND 4),
 detail jsonb NOT NULL DEFAULT '{}'::jsonb,source_at timestamptz,opened_at timestamptz NOT NULL DEFAULT now(),changed_at timestamptz NOT NULL DEFAULT now(),last_seen_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(company_id,source_kind,source_ref),UNIQUE(id,company_id)
);
CREATE INDEX cip_academy_flow_company_state ON public.cip_academy_flow_items(company_id,state,priority,opened_at);
CREATE TABLE public.cip_academy_flow_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,item_id uuid NOT NULL,company_id text NOT NULL,previous_state text,new_state text NOT NULL,occurred_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(item_id,company_id) REFERENCES public.cip_academy_flow_items(id,company_id)
);
CREATE INDEX cip_academy_flow_events_item ON public.cip_academy_flow_events(item_id,company_id,occurred_at DESC);
CREATE INDEX cip_academy_flow_events_company ON public.cip_academy_flow_events(company_id,occurred_at DESC);
CREATE TABLE public.cip_academy_flow_reviews(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,item_id uuid NOT NULL,company_id text NOT NULL,
 actor_id uuid NOT NULL DEFAULT auth.uid(),
 disposition text NOT NULL CHECK(disposition IN ('em_revisao','encaminhado','nao_adotar')),
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 20 AND 2000),
 material_id uuid,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(item_id,company_id) REFERENCES public.cip_academy_flow_items(id,company_id),
 FOREIGN KEY(company_id,material_id) REFERENCES public.cip_academy_materials(company_id,id),
 CHECK((disposition='encaminhado')=(material_id IS NOT NULL))
);
CREATE INDEX cip_academy_flow_reviews_item ON public.cip_academy_flow_reviews(item_id,company_id,created_at DESC);
CREATE INDEX cip_academy_flow_reviews_material ON public.cip_academy_flow_reviews(company_id,material_id);
ALTER TABLE public.cip_academy_flow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cip_academy_flow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cip_academy_flow_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cip_academy_flow_items,public.cip_academy_flow_events,public.cip_academy_flow_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.cip_academy_flow_items,public.cip_academy_flow_events,public.cip_academy_flow_reviews TO authenticated;
GRANT INSERT(item_id,company_id,disposition,note,material_id) ON public.cip_academy_flow_reviews TO authenticated;
CREATE POLICY cip_flow_item_read ON public.cip_academy_flow_items FOR SELECT TO authenticated USING(public.cip_can_access(company_id) AND EXISTS(SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','gestor','diretoria')));
CREATE POLICY cip_flow_event_read ON public.cip_academy_flow_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.cip_academy_flow_items i WHERE i.id=item_id AND i.company_id=cip_academy_flow_events.company_id));
CREATE POLICY cip_flow_review_read ON public.cip_academy_flow_reviews FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.cip_academy_flow_items i WHERE i.id=item_id AND i.company_id=cip_academy_flow_reviews.company_id));
CREATE POLICY cip_flow_review_add ON public.cip_academy_flow_reviews FOR INSERT TO authenticated WITH CHECK(
 actor_id=(SELECT auth.uid()) AND public.cip_academy_reviewer(company_id)
 AND EXISTS(SELECT 1 FROM public.cip_academy_flow_items i WHERE i.id=item_id AND i.company_id=cip_academy_flow_reviews.company_id
 AND (cip_academy_flow_reviews.disposition<>'encaminhado' OR (i.source_kind='hermes_proposal' AND EXISTS(SELECT 1 FROM public.cip_academy_materials m WHERE m.company_id=i.company_id AND m.id=cip_academy_flow_reviews.material_id AND m.agent_id=i.agent_id AND m.status='draft'))))
);
CREATE FUNCTION public.cip_academy_flow_track() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
BEGIN
 IF TG_OP='INSERT' THEN
 INSERT INTO public.cip_academy_flow_events(item_id,company_id,previous_state,new_state) VALUES(NEW.id,NEW.company_id,NULL,NEW.state);
 ELSIF OLD.state IS DISTINCT FROM NEW.state THEN
 INSERT INTO public.cip_academy_flow_events(item_id,company_id,previous_state,new_state) VALUES(NEW.id,NEW.company_id,OLD.state,NEW.state);
 END IF;
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION public.cip_academy_flow_track() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER cip_academy_flow_track AFTER INSERT OR UPDATE OF state ON public.cip_academy_flow_items FOR EACH ROW EXECUTE FUNCTION public.cip_academy_flow_track();
CREATE FUNCTION public.cip_academy_flow_refresh() RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
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
 SELECT p.company_id,'hermes_proposal',p.id::text,p.agent_id,'Candidato Hermes · '||p.agent_id,'review',2,
 jsonb_build_object('cycle_id',p.cycle_id,'model_reported',p.model_reported,'evidence_refs',p.evidence_refs,'next','Revisar hipótese, evidências e limites; vincular a material em rascunho se adotado.'),p.created_at FROM public.cip_hermes_proposals p
 )
 INSERT INTO public.cip_academy_flow_items(company_id,source_kind,source_ref,agent_id,title,state,priority,detail,source_at,opened_at,changed_at,last_seen_at)
 SELECT company_id,source_kind,source_ref,agent_id,title,state,priority,detail,source_at,t,t,t FROM incoming
 ON CONFLICT(company_id,source_kind,source_ref) DO UPDATE SET agent_id=excluded.agent_id,title=excluded.title,state=excluded.state,priority=excluded.priority,detail=excluded.detail,source_at=excluded.source_at,last_seen_at=t,changed_at=CASE WHEN cip_academy_flow_items.state IS DISTINCT FROM excluded.state THEN t ELSE cip_academy_flow_items.changed_at END;
 GET DIAGNOSTICS n=ROW_COUNT;
 UPDATE public.cip_academy_flow_items i SET state=CASE WHEN EXISTS(SELECT 1 FROM public.cip_hermes_proposals p WHERE p.company_id=i.company_id AND p.cycle_id::text||':'||p.agent_id=i.source_ref) THEN 'submitted' ELSE 'superseded' END,priority=4,changed_at=t,last_seen_at=t
 WHERE i.source_kind='hermes_context' AND i.state IN ('waiting_runtime','blocked','paused') AND NOT EXISTS(SELECT 1 FROM public.cip_agent_learning_context c WHERE c.company_id=i.company_id AND c.cycle_id::text||':'||c.agent_id=i.source_ref);
 GET DIAGNOSTICS archived=ROW_COUNT;
 RETURN jsonb_build_object('tracked',n,'previous_contexts_archived',archived);
END $fn$;
REVOKE ALL ON FUNCTION public.cip_academy_flow_refresh() FROM PUBLIC,anon,authenticated;
SELECT public.cip_academy_flow_refresh();
SELECT cron.schedule('cip-academy-flow','8,18,28,38,48,58 * * * *','SELECT public.cip_academy_flow_refresh();');
