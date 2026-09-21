-- GRIT Prospect 360 social/company discovery — DEDICATED project only.
-- Corporate account references, NEVER LinkedIn member-profile data.
-- No platform scraping, tokens, unsolicited messages or automation executed here.
BEGIN;

CREATE TABLE public.social_prospect_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid,
  platform text NOT NULL CHECK (platform IN ('instagram','linkedin')),
  account_key text NOT NULL CHECK (
    length(account_key) BETWEEN 2 AND 100
    AND account_key ~ '^[a-z0-9][a-z0-9._-]*$'
  ),
  profile_url text NOT NULL CHECK (
    (platform = 'instagram' AND profile_url = 'https://www.instagram.com/' || account_key || '/')
    OR
    (platform = 'linkedin' AND profile_url = 'https://www.linkedin.com/company/' || account_key || '/')
  ),
  company_label text NOT NULL CHECK (length(trim(company_label)) BETWEEN 2 AND 200),
  source_kind text NOT NULL CHECK (
    (platform = 'instagram' AND source_kind IN
      ('manual_corporate_url','first_party_inbound','approved_meta_business_discovery'))
    OR
    (platform = 'linkedin' AND source_kind IN
      ('manual_corporate_url','first_party_inbound'))
  ),
  source_reference text,
  review_status text NOT NULL DEFAULT 'pending' CHECK
    (review_status IN ('pending','approved','rejected')),
  reviewer_user_id uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, platform, account_key),
  UNIQUE(organization_id,id),
  FOREIGN KEY (organization_id,company_id)
    REFERENCES public.companies(organization_id,id),
  CHECK ((review_status = 'pending' AND reviewer_user_id IS NULL AND reviewed_at IS NULL)
       OR (review_status <> 'pending' AND reviewer_user_id IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX social_candidates_org_review_idx
 ON public.social_prospect_candidates(organization_id,review_status,created_at DESC);
CREATE INDEX social_candidates_org_company_idx
 ON public.social_prospect_candidates(organization_id,company_id);
CREATE INDEX social_candidates_creator_idx
 ON public.social_prospect_candidates(created_by);
CREATE INDEX social_candidates_reviewer_idx
 ON public.social_prospect_candidates(reviewer_user_id);
ALTER TABLE public.social_prospect_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_candidates_read_members"
  ON public.social_prospect_candidates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.memberships m
    WHERE m.organization_id = social_prospect_candidates.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active));

-- Intake is server-side and pending review; no direct client creation or review.
REVOKE ALL ON TABLE public.social_prospect_candidates
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.social_prospect_candidates TO authenticated;
GRANT ALL ON TABLE public.social_prospect_candidates TO service_role;

-- This is a configuration ledger, not a provider OAuth/token store. Enabled=false
-- means no API request, webhook or outbound message may run.
CREATE TABLE public.social_channel_config (
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  platform text NOT NULL CHECK(platform IN ('instagram','linkedin')),
  integration_mode text NOT NULL DEFAULT 'manual_review'
    CHECK(integration_mode IN ('manual_review','approved_official_api')),
  inbound_enabled boolean NOT NULL DEFAULT false,
  discovery_enabled boolean NOT NULL DEFAULT false,
  outbound_enabled boolean NOT NULL DEFAULT false CHECK(outbound_enabled = false),
  approval_reference text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id,platform),
  CHECK(integration_mode <> 'approved_official_api' OR approval_reference IS NOT NULL),
  CHECK(NOT discovery_enabled OR
        (platform = 'instagram' AND integration_mode = 'approved_official_api'))
);
ALTER TABLE public.social_channel_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_channel_config_read_members"
  ON public.social_channel_config FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.memberships m
    WHERE m.organization_id = social_channel_config.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.active));
REVOKE ALL ON TABLE public.social_channel_config
  FROM PUBLIC,anon,authenticated;
GRANT SELECT ON TABLE public.social_channel_config TO authenticated;
GRANT ALL ON TABLE public.social_channel_config TO service_role;
COMMIT;
