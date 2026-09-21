-- GRIT Prospect 360 / isolated Supabase project ONLY.
-- Never run in the shared gritnews or Meu Cuidador production databases.
-- Provision the first organization + membership with a trusted server role,
-- after the project owner, costs, backups and RLS test plan are approved.
BEGIN;

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 180),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.memberships (
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Non-recursive self-read for user membership. No client insert/update/delete:
-- provisioning must happen through an authorized server operation.
CREATE POLICY "memberships_read_self" ON public.memberships
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "organizations_read_members" ON public.organizations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = organizations.id
      AND m.user_id = (SELECT auth.uid()) AND m.active
  ));

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  tax_id varchar(14) NOT NULL CHECK (tax_id ~ '^[0-9]{14}$'),
  legal_name text NOT NULL CHECK (char_length(trim(legal_name)) BETWEEN 1 AND 240),
  trade_name text,
  city text,
  state varchar(2) CHECK (state IS NULL OR state ~ '^[A-Z]{2}$'),
  source_type text NOT NULL DEFAULT 'csv' CHECK (source_type IN ('csv','api','manual')),
  source_reference text,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tax_id),
  UNIQUE (organization_id, id)
);
CREATE INDEX companies_org_created_idx ON public.companies (organization_id, created_at DESC);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_read_members" ON public.companies
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = companies.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active
  ));
CREATE POLICY "companies_insert_operators" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = companies.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active
      AND m.role IN ('owner','admin','operator')
  ));
CREATE POLICY "companies_update_operators" ON public.companies
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = companies.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active
      AND m.role IN ('owner','admin','operator')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = companies.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active
      AND m.role IN ('owner','admin','operator')
  ));
-- No DELETE policy: organization-scoped deletion requires separate reviewed flow.

CREATE TABLE public.company_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  file_sha256 varchar(64) NOT NULL CHECK (file_sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'previewed'
    CHECK (status IN ('previewed','approved','applied','failed')),
  total_rows integer NOT NULL CHECK (total_rows BETWEEN 0 AND 5000),
  accepted_rows integer NOT NULL CHECK (accepted_rows BETWEEN 0 AND total_rows),
  skipped_rows integer NOT NULL CHECK (skipped_rows BETWEEN 0 AND total_rows),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CHECK (accepted_rows + skipped_rows = total_rows)
);
ALTER TABLE public.company_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_import_batches_read_members" ON public.company_import_batches
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = company_import_batches.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active
  ));
-- Creation and status transitions restricted to trusted API/service role
-- so client cannot forge an import history.

CREATE TABLE public.company_import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  source_line integer NOT NULL CHECK (source_line >= 2),
  outcome text NOT NULL CHECK (outcome IN ('accepted','skipped','applied')),
  reason_code text,
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, batch_id)
    REFERENCES public.company_import_batches (organization_id, id),
  FOREIGN KEY (organization_id, company_id)
    REFERENCES public.companies (organization_id, id),
  UNIQUE (batch_id, source_line),
  CHECK (outcome <> 'applied' OR company_id IS NOT NULL)
);
CREATE INDEX company_import_items_batch_idx ON public.company_import_items (batch_id);
ALTER TABLE public.company_import_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_import_items_read_members" ON public.company_import_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = company_import_items.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active
  ));

CREATE TABLE public.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id),
  actor_user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  event_type text NOT NULL,
  event_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
-- No client policies: audit_events is server-only, intentionally inaccessible
-- by anon/authenticated. Never store raw CSV rows or credentials in metadata.

COMMIT;
