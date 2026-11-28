CREATE TABLE public.cip_hermes_proposals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id text NOT NULL,
 agent_id text NOT NULL,
 cycle_id uuid NOT NULL,
 input_context_at timestamptz NOT NULL,
 diagnosis text NOT NULL CHECK(length(btrim(diagnosis)) BETWEEN 10 AND 1800),
 next_action text NOT NULL CHECK(length(btrim(next_action)) BETWEEN 10 AND 1800),
 learning_candidate text NOT NULL CHECK(length(btrim(learning_candidate)) BETWEEN 20 AND 1800),
 evidence_refs jsonb NOT NULL CHECK(jsonb_typeof(evidence_refs)='array' AND jsonb_array_length(evidence_refs) BETWEEN 1 AND 20),
 model_reported text NOT NULL CHECK(length(model_reported) BETWEEN 1 AND 180),
 created_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(company_id,agent_id) REFERENCES public.cip_agent_learning_context(company_id,agent_id),
 FOREIGN KEY(cycle_id,company_id) REFERENCES public.cip_agent_cycles(id,company_id),
 UNIQUE(company_id,agent_id,cycle_id)
);
CREATE INDEX cip_hermes_proposals_cycle ON public.cip_hermes_proposals(cycle_id,company_id);
ALTER TABLE public.cip_hermes_proposals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cip_hermes_proposals FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.cip_hermes_proposals TO authenticated;
GRANT INSERT(company_id,agent_id,cycle_id,input_context_at,diagnosis,next_action,learning_candidate,evidence_refs,model_reported) ON public.cip_hermes_proposals TO authenticated;
CREATE POLICY cip_hermes_proposal_read ON public.cip_hermes_proposals FOR SELECT TO authenticated USING(public.cip_can_access(company_id) AND EXISTS(SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','gestor','diretoria')));
CREATE POLICY cip_hermes_proposal_submit ON public.cip_hermes_proposals FOR INSERT TO authenticated WITH CHECK(
 created_by=(SELECT auth.uid()) AND public.cip_can_access(company_id) AND EXISTS(SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','gestor','diretoria'))
 AND EXISTS(SELECT 1 FROM public.cip_agent_learning_context c JOIN public.cip_agent_controls cfg ON cfg.company_id=c.company_id AND cfg.enabled WHERE c.company_id=cip_hermes_proposals.company_id AND c.agent_id=cip_hermes_proposals.agent_id AND c.cycle_id=cip_hermes_proposals.cycle_id AND c.updated_at>=now()-interval '25 minutes' AND cip_hermes_proposals.input_context_at BETWEEN now()-interval '25 minutes' AND c.updated_at)
);
