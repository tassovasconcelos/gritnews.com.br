-- GRIT Prospect 360: a candidate cannot be linked to a CNPJ before human review.
-- Dedicated Supabase project qspluchjhnnzgbbgmsro ONLY.
-- Existing candidate queue is empty at rollout; fail migration if not empty
-- rather than rewriting existing user decisions.
BEGIN;
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.social_prospect_candidates) THEN
   RAISE EXCEPTION 'social_candidates_not_empty_review_migration_before_apply';
 END IF;
END $$;
ALTER TABLE public.social_prospect_candidates
  ADD CONSTRAINT pending_candidate_must_not_link_company
  CHECK (review_status <> 'pending' OR company_id IS NULL),
  ADD CONSTRAINT rejected_candidate_must_not_link_company
  CHECK (review_status <> 'rejected' OR company_id IS NULL);
COMMIT;
