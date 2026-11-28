SET LOCAL lock_timeout='3s';
CREATE TABLE public.cip_guardian_incidents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id text NOT NULL REFERENCES public.cip_companies(id),
 check_code text NOT NULL,
 severity text NOT NULL CHECK(severity IN ('critical','warning')),
 opened_at timestamptz NOT NULL,
 last_seen_at timestamptz NOT NULL,
 resolved_at timestamptz,
 detail jsonb NOT NULL,
 UNIQUE(id,company_id)
);
CREATE UNIQUE INDEX cip_guardian_incident_active ON public.cip_guardian_incidents(company_id,check_code) WHERE resolved_at IS NULL;
CREATE INDEX cip_guardian_incident_company_history ON public.cip_guardian_incidents(company_id,opened_at DESC);
CREATE TABLE public.cip_guardian_incident_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 incident_id uuid NOT NULL,
 company_id text NOT NULL,
 actor_id uuid NOT NULL DEFAULT auth.uid(),
 stage text NOT NULL CHECK(stage IN ('triagem','em_tratamento','aguardando_validacao')),
 owner_name text NOT NULL CHECK(length(btrim(owner_name)) BETWEEN 3 AND 120),
 due_at timestamptz NOT NULL,
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 10 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(incident_id,company_id) REFERENCES public.cip_guardian_incidents(id,company_id)
);
CREATE INDEX cip_guardian_event_incident ON public.cip_guardian_incident_events(incident_id,company_id,created_at DESC,id DESC);
CREATE INDEX cip_guardian_event_company ON public.cip_guardian_incident_events(company_id,created_at DESC);
ALTER TABLE public.cip_guardian_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cip_guardian_incident_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cip_guardian_incidents,public.cip_guardian_incident_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.cip_guardian_incidents,public.cip_guardian_incident_events TO authenticated;
GRANT INSERT(incident_id,company_id,stage,owner_name,due_at,note) ON public.cip_guardian_incident_events TO authenticated;
CREATE POLICY guardian_incident_read ON public.cip_guardian_incidents FOR SELECT TO authenticated USING(
 public.cip_can_access(company_id) AND EXISTS(SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','diretoria','gestor'))
);
CREATE POLICY guardian_event_read ON public.cip_guardian_incident_events FOR SELECT TO authenticated USING(
 public.cip_can_access(company_id) AND EXISTS(SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','diretoria','gestor'))
);
CREATE POLICY guardian_event_add ON public.cip_guardian_incident_events FOR INSERT TO authenticated WITH CHECK(
 actor_id=(SELECT auth.uid()) AND due_at>=now() AND due_at<=now()+interval '365 days'
 AND public.cip_can_access(company_id) AND EXISTS(SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','diretoria','gestor'))
 AND EXISTS(SELECT 1 FROM public.cip_guardian_incidents i WHERE i.id=incident_id AND i.company_id=cip_guardian_incident_events.company_id AND i.resolved_at IS NULL)
);
CREATE FUNCTION public.cip_guardian_incidents_sync() RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE affected integer; closed integer; t timestamptz:=clock_timestamp();
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended('cip_guardian_incidents_sync',0)) THEN RETURN 0; END IF;
 INSERT INTO public.cip_guardian_incidents(company_id,check_code,severity,opened_at,last_seen_at,detail)
 SELECT s.company_id,s.check_code,s.severity,t,s.checked_at,s.detail FROM public.cip_guardian_status s
 WHERE s.severity IN ('critical','warning') AND s.checked_at BETWEEN t-interval '25 minutes' AND t+interval '1 minute'
 ON CONFLICT(company_id,check_code) WHERE resolved_at IS NULL DO UPDATE SET severity=excluded.severity,last_seen_at=excluded.last_seen_at,detail=excluded.detail;
 GET DIAGNOSTICS affected=ROW_COUNT;
 UPDATE public.cip_guardian_incidents i SET resolved_at=t FROM public.cip_guardian_status s
 WHERE i.company_id=s.company_id AND i.check_code=s.check_code AND i.resolved_at IS NULL AND s.severity='ok'
 AND s.checked_at BETWEEN t-interval '25 minutes' AND t+interval '1 minute' AND s.checked_at>=i.last_seen_at;
 GET DIAGNOSTICS closed=ROW_COUNT;
 RETURN affected+closed;
END $fn$;
REVOKE ALL ON FUNCTION public.cip_guardian_incidents_sync() FROM PUBLIC,anon,authenticated;
SELECT public.cip_guardian_incidents_sync();
SELECT cron.schedule('cip-guardian-incidents','1,11,21,31,41,51 * * * *','SELECT public.cip_guardian_incidents_sync();');
