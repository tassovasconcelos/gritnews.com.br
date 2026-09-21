-- FIRST OWNER BOOTSTRAP: dedicate to GRIT Prospect 360 only.
-- The service-role CLI must first verify the approved email and email_confirmed_at
-- with Supabase Auth Admin APIs. service_role cannot SELECT auth.users directly.
-- No seed user, password, synthetic data or email is created by this migration.
BEGIN;

CREATE OR REPLACE FUNCTION public.bootstrap_first_owner(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_org public.organizations%ROWTYPE;
  v_existing public.memberships%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'owner_user_required' USING ERRCODE = '22023';
  END IF;

  -- This RPC is strictly first-run only; never overwrites existing ownership.
  IF EXISTS (SELECT 1 FROM public.memberships) THEN
    SELECT m.* INTO v_existing FROM public.memberships m
      JOIN public.organizations o ON o.id = m.organization_id
      WHERE m.user_id = p_user_id AND m.active AND m.role = 'owner'
        AND o.slug = 'grit-solucoes-e-negocios';
    IF FOUND AND (SELECT count(*) FROM public.memberships) = 1 THEN
      RETURN jsonb_build_object(
        'status','already_activated','organization_id',v_existing.organization_id,
        'user_id',p_user_id
      );
    END IF;
    RAISE EXCEPTION 'first_owner_already_initialized' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (SELECT 1 FROM public.organizations
      WHERE slug <> 'grit-solucoes-e-negocios') THEN
    RAISE EXCEPTION 'unexpected_organization_exists' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.organizations (name,slug)
    VALUES ('GRIT Soluções e Negócios','grit-solucoes-e-negocios')
    ON CONFLICT (slug) DO NOTHING;

  SELECT * INTO STRICT v_org FROM public.organizations
    WHERE slug = 'grit-solucoes-e-negocios' FOR UPDATE;

  INSERT INTO public.memberships (organization_id,user_id,role,active)
    VALUES (v_org.id,p_user_id,'owner',true);

  INSERT INTO public.audit_events (
    organization_id,actor_user_id,entity_type,entity_id,event_type,event_metadata
  ) VALUES (
    v_org.id,p_user_id,'membership',p_user_id,'first_owner_activated',
    jsonb_build_object('method','verified_auth_admin_cli')
  );

  RETURN jsonb_build_object(
    'status','activated','organization_id',v_org.id,'user_id',p_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_owner(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_owner(uuid) TO service_role;

COMMIT;
