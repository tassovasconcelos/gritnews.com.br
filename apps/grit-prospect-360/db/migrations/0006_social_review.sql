-- GRIT Prospect 360: human-reviewed corporate social candidates.
-- Apply ONLY to dedicated Supabase project qspluchjhnnzgbbgmsro.
-- Review is not a message send or authorization to contact.
BEGIN;

ALTER TABLE public.social_prospect_candidates
  ADD COLUMN review_reason text,
  ADD CONSTRAINT social_review_reason_valid
    CHECK (review_reason IS NULL OR length(trim(review_reason)) BETWEEN 12 AND 500),
  ADD CONSTRAINT social_review_reason_required
    CHECK ((review_status = 'pending' AND review_reason IS NULL)
      OR (review_status <> 'pending' AND review_reason IS NOT NULL)),
  ADD CONSTRAINT approved_candidate_needs_company
    CHECK (review_status <> 'approved' OR company_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.review_social_candidate(
  p_organization_id uuid,
  p_actor_id uuid,
  p_candidate_id uuid,
  p_decision text,
  p_company_id uuid,
  p_reason text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_candidate public.social_prospect_candidates%ROWTYPE;
  v_reason text := trim(coalesce(p_reason,''));
BEGIN
  IF p_organization_id IS NULL OR p_actor_id IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM public.memberships
       WHERE organization_id = p_organization_id AND user_id = p_actor_id
         AND active AND role IN ('owner','admin')
     ) THEN
    RAISE EXCEPTION 'review_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF p_candidate_id IS NULL OR p_decision IS NULL
     OR p_decision NOT IN ('approved','rejected')
     OR length(v_reason) NOT BETWEEN 12 AND 500 THEN
    RAISE EXCEPTION 'invalid_review_payload' USING ERRCODE = '22023';
  END IF;

  -- No approval without an independently checked, same-tenant company.
  IF p_decision = 'approved' AND (
     p_company_id IS NULL OR NOT EXISTS (
       SELECT 1 FROM public.companies
       WHERE organization_id = p_organization_id AND id = p_company_id)
     ) THEN
    RAISE EXCEPTION 'approved_company_required' USING ERRCODE = '22023';
  END IF;
  IF p_decision = 'rejected' AND p_company_id IS NOT NULL THEN
    RAISE EXCEPTION 'rejection_must_not_link_company' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_candidate FROM public.social_prospect_candidates
    WHERE organization_id = p_organization_id AND id = p_candidate_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'candidate_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_candidate.review_status <> 'pending' THEN
    IF v_candidate.review_status = p_decision
      AND v_candidate.reviewer_user_id = p_actor_id
      AND v_candidate.company_id IS NOT DISTINCT FROM p_company_id
      AND v_candidate.review_reason = v_reason THEN
      RETURN jsonb_build_object(
        'status','already_reviewed','candidate_id',v_candidate.id,
        'review_status',v_candidate.review_status
      );
    END IF;
    RAISE EXCEPTION 'candidate_already_reviewed' USING ERRCODE = '23505';
  END IF;

  UPDATE public.social_prospect_candidates SET
    review_status = p_decision,
    company_id = CASE WHEN p_decision = 'approved' THEN p_company_id ELSE NULL END,
    review_reason = v_reason,
    reviewer_user_id = p_actor_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = v_candidate.id;

  INSERT INTO public.audit_events (
    organization_id,actor_user_id,entity_type,entity_id,event_type,event_metadata
  ) VALUES (
    p_organization_id,p_actor_id,'social_prospect_candidate',v_candidate.id,
    'social_candidate_reviewed',
    jsonb_build_object('decision',p_decision,'linked_company',p_company_id IS NOT NULL)
  );

  RETURN jsonb_build_object(
    'status','reviewed','candidate_id',v_candidate.id,
    'review_status',p_decision
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_social_candidate(uuid,uuid,uuid,text,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_social_candidate(uuid,uuid,uuid,text,uuid,text)
  TO service_role;
COMMIT;
