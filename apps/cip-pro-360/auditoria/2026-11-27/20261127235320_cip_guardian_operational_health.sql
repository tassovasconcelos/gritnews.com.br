SET LOCAL lock_timeout='3s';
CREATE TABLE public.cip_guardian_status (
 company_id text NOT NULL REFERENCES public.cip_companies(id),
 check_code text NOT NULL,
 severity text NOT NULL CHECK(severity IN ('ok','warning','critical','unknown','paused')),
 detail jsonb NOT NULL,
 checked_at timestamptz NOT NULL,
 changed_at timestamptz NOT NULL,
 PRIMARY KEY(company_id,check_code)
);
ALTER TABLE public.cip_guardian_status ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cip_guardian_status FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.cip_guardian_status TO authenticated;
CREATE POLICY guardian_company_read ON public.cip_guardian_status FOR SELECT TO authenticated USING (
 public.cip_can_access(company_id) AND EXISTS (SELECT 1 FROM public.cip_profiles p WHERE p.user_id=(SELECT auth.uid()) AND p.active AND p.role IN ('superadm','diretoria','gestor'))
);
CREATE FUNCTION public.cip_guardian_refresh() RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE n integer; t timestamptz:=clock_timestamp();
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended('cip_guardian_refresh',0)) THEN RETURN 0; END IF;
 WITH metrics AS (
 SELECT c.id company_id, f.enabled faro_enabled,f.circuit_until,f.daily_limit,f.failure_streak,
 (SELECT max(j.finished_at) FROM public.cip_faro_jobs j WHERE j.company_id=c.id AND j.state='completed') faro_last,
 (SELECT count(*) FROM public.cip_faro_jobs j WHERE j.company_id=c.id AND j.state='queued' AND j.slot<t-interval '1 hour') overdue,
 (SELECT count(*) FROM public.cip_faro_jobs j WHERE j.company_id=c.id AND j.state='failed' AND j.finished_at>=t-interval '24 hours') failures,
 (SELECT count(*) FROM public.cip_faro_jobs j WHERE j.company_id=c.id AND j.state='completed' AND j.finished_at>=t-interval '24 hours') completed,
 a.enabled agent_enabled,a.interval_minutes,a.last_run_at,
 (SELECT max(s.captured_at) FROM public.cip_erp_snapshots s WHERE s.company_id=c.id AND s.status='approved') erp_at,
 (SELECT max(b.as_of) FROM public.cip_stock_intelligence_batches b WHERE b.company_id=c.id AND b.status='active') stock_date,
 (SELECT count(*) FROM public.cip_stock_actions s WHERE s.company_id=c.id AND s.state='sugerida') stock_pending,
 (SELECT count(*) FROM public.cip_command_decisions d WHERE d.company_id=c.id) decisions,
 (SELECT count(*) FROM public.cip_tower_tasks d WHERE d.company_id=c.id) tasks,
 (SELECT count(*) FROM public.cip_perf_financial_approvals p WHERE p.company_id=c.id AND p.decision='aprovado') financial_approvals,
 (SELECT count(*) FROM public.cip_ops_usage_events u WHERE u.company_id=c.id AND u.occurred_at>=t-interval '24 hours' AND u.cost_usd IS NULL) unknown_cost,
 (SELECT max(b.observed_at) FROM public.cip_ops_billing_snapshots b WHERE b.company_id=c.id) billing_at
 FROM public.cip_companies c LEFT JOIN public.cip_faro_config f ON f.company_id=c.id LEFT JOIN public.cip_agent_controls a ON a.company_id=c.id
 ), checks AS (
 SELECT m.company_id,v.code,v.severity,v.detail FROM metrics m CROSS JOIN LATERAL (VALUES
 ('faro',CASE WHEN m.faro_enabled IS NULL THEN 'unknown' WHEN NOT m.faro_enabled THEN 'paused' WHEN m.circuit_until>t OR m.faro_last IS NULL OR m.faro_last<t-interval '24 hours' THEN 'critical' WHEN m.failures>m.completed THEN 'warning' ELSE 'ok' END,jsonb_build_object('last_completed',m.faro_last,'circuit_until',m.circuit_until,'daily_limit',m.daily_limit,'failed_24h',m.failures,'completed_24h',m.completed)),
 ('queue',CASE WHEN m.faro_enabled IS NULL THEN 'unknown' WHEN NOT m.faro_enabled THEN 'paused' WHEN m.overdue>0 THEN 'warning' ELSE 'ok' END,jsonb_build_object('queued_over_1h',m.overdue)),
 ('agents',CASE WHEN m.agent_enabled IS NULL THEN 'unknown' WHEN NOT m.agent_enabled THEN 'paused' WHEN m.last_run_at IS NULL OR m.last_run_at<t-make_interval(mins=>2*m.interval_minutes) THEN 'critical' ELSE 'ok' END,jsonb_build_object('last_run',m.last_run_at,'interval_minutes',m.interval_minutes,'note','Ciclo não comprova resultado')),
 ('erp',CASE WHEN m.erp_at IS NULL OR m.erp_at<t-interval '24 hours' THEN 'critical' ELSE 'ok' END,jsonb_build_object('last_approved_snapshot',m.erp_at)),
 ('stock',CASE WHEN m.stock_date IS NULL THEN 'unknown' WHEN m.stock_date<(t at time zone 'America/Fortaleza')::date-1 THEN 'critical' ELSE 'ok' END,jsonb_build_object('reference_date',m.stock_date,'suggested_actions',m.stock_pending)),
 ('execution',CASE WHEN m.stock_pending>0 AND m.decisions=0 AND m.tasks=0 THEN 'warning' ELSE 'unknown' END,jsonb_build_object('suggested_stock_actions',m.stock_pending,'decision_records',m.decisions,'tower_task_records',m.tasks,'note','Contagens não comprovam execução')),
 ('billing',CASE WHEN m.billing_at IS NULL OR m.billing_at<t-interval '7 days' OR m.unknown_cost>0 THEN 'warning' ELSE 'ok' END,jsonb_build_object('last_company_billing_snapshot',m.billing_at,'unknown_cost_events_24h',m.unknown_cost)),
 ('results',CASE WHEN m.financial_approvals=0 THEN 'warning' ELSE 'unknown' END,jsonb_build_object('financial_approval_records',m.financial_approvals,'note','Aprovações não equivalem a valor realizado'))
 ) AS v(code,severity,detail)
 UNION ALL SELECT c.id,'procfit_source',CASE WHEN s.received_at IS NULL OR s.received_at<t-make_interval(secs=>2*greatest(coalesce(s.interval_seconds,600),60)) OR s.status='source_error' THEN 'critical' WHEN s.status IN ('contract_pending','mapping_required') THEN 'warning' ELSE 'unknown' END,
 jsonb_build_object('status',s.status,'last_received',s.received_at,'note','Monitor da view de locações; não comprova vendas e estoque')
 FROM public.cip_companies c LEFT JOIN LATERAL (SELECT status,received_at,interval_seconds FROM public.cip_procfit_source_checks ORDER BY received_at DESC LIMIT 1) s ON true WHERE c.id='shopping_prohospital'
 )
 INSERT INTO public.cip_guardian_status(company_id,check_code,severity,detail,checked_at,changed_at)
 SELECT company_id,code,severity,detail,t,t FROM checks
 ON CONFLICT(company_id,check_code) DO UPDATE SET severity=excluded.severity,detail=excluded.detail,checked_at=excluded.checked_at,changed_at=CASE WHEN cip_guardian_status.severity IS DISTINCT FROM excluded.severity THEN excluded.checked_at ELSE cip_guardian_status.changed_at END;
 GET DIAGNOSTICS n=ROW_COUNT; RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.cip_guardian_refresh() FROM PUBLIC,anon,authenticated;
SELECT public.cip_guardian_refresh();
SELECT cron.schedule('cip-guardian-health','*/10 * * * *','SELECT public.cip_guardian_refresh();');

