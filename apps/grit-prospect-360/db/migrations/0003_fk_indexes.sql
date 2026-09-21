-- GRIT Prospect 360 performance indexes: DEDICATED project ONLY.
-- Aligned to five covering-FK findings from Supabase Performance Advisor.
-- Does not modify existing GRIT/Meu Cuidador projects or rows.
BEGIN;
CREATE INDEX IF NOT EXISTS memberships_user_idx
  ON public.memberships (user_id);
CREATE INDEX IF NOT EXISTS company_import_batches_actor_idx
  ON public.company_import_batches (created_by);
CREATE INDEX IF NOT EXISTS company_import_items_org_batch_idx
  ON public.company_import_items (organization_id, batch_id);
CREATE INDEX IF NOT EXISTS company_import_items_org_company_idx
  ON public.company_import_items (organization_id, company_id);
CREATE INDEX IF NOT EXISTS audit_events_org_time_idx
  ON public.audit_events (organization_id, occurred_at DESC);
COMMIT;
