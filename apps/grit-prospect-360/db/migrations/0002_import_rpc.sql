-- GRIT Prospect 360: atomic import into dedicated Supabase project ONLY.
-- Existing GRIT News / Meu Cuidador projects must NOT receive this migration.
BEGIN;

ALTER TABLE public.company_import_batches
  ADD CONSTRAINT company_import_batches_org_file_unique
  UNIQUE (organization_id, file_sha256);

-- The tenant and CNPJ are immutable. Updates to descriptive fields remain permitted.
CREATE OR REPLACE FUNCTION public.prevent_company_identity_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.tax_id IS DISTINCT FROM OLD.tax_id THEN
    RAISE EXCEPTION 'company_identity_immutable' USING ERRCODE = '23514';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER company_identity_guard
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.prevent_company_identity_change();
REVOKE ALL ON FUNCTION public.prevent_company_identity_change() FROM PUBLIC, anon, authenticated;

-- This function is deliberately SECURITY INVOKER and callable only by service_role.
-- HTTP must verify the Supabase user JWT before calling it with the trusted actor ID.
CREATE OR REPLACE FUNCTION public.apply_company_import(
  p_organization_id uuid,
  p_actor_id uuid,
  p_file_sha256 text,
  p_total_rows integer,
  p_accepted jsonb,
  p_skipped jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_batch public.company_import_batches%ROWTYPE;
  v_item jsonb;
  v_line integer;
  v_cnpj text;
  v_name text;
  v_state text;
  v_reason text;
  v_company_id uuid;
  v_applied integer := 0;
  v_skipped integer := 0;
  v_row_count integer;
BEGIN
  IF p_organization_id IS NULL OR p_actor_id IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM public.memberships
       WHERE organization_id = p_organization_id AND user_id = p_actor_id
         AND active AND role IN ('owner','admin','operator')
     ) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  IF p_file_sha256 IS NULL OR p_file_sha256 !~ '^[a-f0-9]{64}$'
     OR p_total_rows IS NULL OR p_total_rows < 0 OR p_total_rows > 5000
     OR p_accepted IS NULL OR jsonb_typeof(p_accepted) <> 'array'
     OR p_skipped IS NULL OR jsonb_typeof(p_skipped) <> 'array' THEN
    RAISE EXCEPTION 'invalid_import_payload' USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(p_accepted) + jsonb_array_length(p_skipped) <> p_total_rows THEN
    RAISE EXCEPTION 'import_count_mismatch' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.company_import_batches (
    organization_id, created_by, file_sha256,
    status, total_rows, accepted_rows, skipped_rows
  ) VALUES (
    p_organization_id, p_actor_id, p_file_sha256,
    'previewed', p_total_rows, jsonb_array_length(p_accepted), jsonb_array_length(p_skipped)
  )
  ON CONFLICT (organization_id, file_sha256) DO NOTHING;

  SELECT * INTO STRICT v_batch
  FROM public.company_import_batches
  WHERE organization_id = p_organization_id AND file_sha256 = p_file_sha256
  FOR UPDATE;

  IF v_batch.status = 'applied' THEN
    RETURN jsonb_build_object(
      'batch_id', v_batch.id, 'status', 'already_applied',
      'total_rows', v_batch.total_rows, 'applied_count', v_batch.accepted_rows,
      'skipped_count', v_batch.skipped_rows
    );
  END IF;

  IF v_batch.status <> 'previewed' OR v_batch.total_rows <> p_total_rows
     OR v_batch.created_by <> p_actor_id THEN
    RAISE EXCEPTION 'import_batch_conflict' USING ERRCODE = '23505';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_accepted) LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'invalid_import_item' USING ERRCODE = '22023';
    END IF;
    v_line := (v_item ->> 'source_line')::integer;
    v_cnpj := v_item ->> 'tax_id';
    v_name := trim(v_item ->> 'legal_name');
    v_state := NULLIF(v_item ->> 'state', '');
    IF v_line IS NULL OR v_line < 2 OR v_line > p_total_rows + 1
       OR v_cnpj IS NULL OR v_cnpj !~ '^[0-9]{14}$'
       OR v_name IS NULL OR length(v_name) < 1 OR length(v_name) > 240
       OR (v_state IS NOT NULL AND v_state !~ '^[A-Z]{2}$') THEN
      RAISE EXCEPTION 'invalid_import_company' USING ERRCODE = '22023';
    END IF;
    v_company_id := NULL;
    INSERT INTO public.companies (
      organization_id, tax_id, legal_name, trade_name, city, state,
      source_type, source_reference
    ) VALUES (
      p_organization_id, v_cnpj, v_name,
      NULLIF(v_item ->> 'trade_name', ''),
      NULLIF(v_item ->> 'city', ''), v_state, 'csv', p_file_sha256
    )
    ON CONFLICT (organization_id, tax_id) DO NOTHING
    RETURNING id INTO v_company_id;

    IF v_company_id IS NOT NULL THEN
      v_applied := v_applied + 1;
      v_reason := NULL;
    ELSE
      SELECT id INTO STRICT v_company_id
      FROM public.companies
      WHERE organization_id = p_organization_id AND tax_id = v_cnpj;
      v_skipped := v_skipped + 1;
      v_reason := 'already_exists';
    END IF;

    INSERT INTO public.company_import_items (
      organization_id, batch_id, source_line, outcome, reason_code, company_id
    ) VALUES (
      p_organization_id, v_batch.id, v_line,
      CASE WHEN v_reason IS NULL THEN 'applied' ELSE 'skipped' END,
      v_reason, v_company_id
    );
  END LOOP;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_skipped) LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'invalid_skipped_item' USING ERRCODE = '22023';
    END IF;
    v_line := (v_item ->> 'line')::integer;
    v_reason := v_item ->> 'reason';
    IF v_line IS NULL OR v_line < 2 OR v_line > p_total_rows + 1
       OR v_reason IS NULL OR length(v_reason) NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION 'invalid_skipped_item' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.company_import_items (
      organization_id, batch_id, source_line, outcome, reason_code
    ) VALUES (p_organization_id, v_batch.id, v_line, 'skipped', v_reason);
    v_skipped := v_skipped + 1;
  END LOOP;

  SELECT count(*) INTO v_row_count
  FROM public.company_import_items WHERE batch_id = v_batch.id;
  IF v_row_count <> p_total_rows OR v_applied + v_skipped <> p_total_rows THEN
    RAISE EXCEPTION 'import_item_count_mismatch' USING ERRCODE = '22023';
  END IF;

  UPDATE public.company_import_batches SET
    status = 'applied', accepted_rows = v_applied, skipped_rows = v_skipped
  WHERE id = v_batch.id;

  INSERT INTO public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id,
    event_type, event_metadata
  ) VALUES (
    p_organization_id, p_actor_id, 'company_import_batch', v_batch.id,
    'company_import_applied',
    jsonb_build_object('total_rows',p_total_rows,'applied_count',v_applied,'skipped_count',v_skipped)
  );

  RETURN jsonb_build_object(
    'batch_id', v_batch.id, 'status', 'applied',
    'total_rows', p_total_rows, 'applied_count', v_applied,
    'skipped_count', v_skipped
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_company_import(uuid, uuid, text, integer, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_company_import(uuid, uuid, text, integer, jsonb, jsonb)
  TO service_role;

COMMIT;
