-- ONLY on dedicated, disposable GRIT Prospect 360 Supabase test project.
-- Prerequisite: apply 0001_initial.sql in this same isolated TEST database.
-- Run manually as postgres/DB owner; expected end state: ROLLBACK (no records retained).
-- Never use this file in any shared GRIT, Meu Cuidador or production database.
BEGIN;

-- Controlled, transaction-scoped fake users; rolled back after all tests.
INSERT INTO auth.users (instance_id, id, aud, role, email, created_at, updated_at)
VALUES
 ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','prospect-a@example.invalid', now(),now()),
 ('00000000-0000-0000-0000-000000000000','22222222-2222-4222-8222-222222222222',
  'authenticated','authenticated','prospect-b@example.invalid', now(),now());

INSERT INTO public.organizations (id,name,slug) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Tenant A (TEST)','prospect-test-a'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Tenant B (TEST)','prospect-test-b');
INSERT INTO public.memberships (organization_id,user_id,role,active) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','operator',true),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','viewer',true);
INSERT INTO public.companies (id,organization_id,tax_id,legal_name) VALUES
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11222333000181','Empresa A (TEST)'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11444777000161','Empresa B (TEST)');

-- Operator A: visible own organization and own company, not B.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.companies) <> 1 THEN
   RAISE EXCEPTION 'FAIL: operator A must see exactly one company';
 END IF;
 IF (SELECT count(*) FROM public.companies WHERE organization_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> 0 THEN
   RAISE EXCEPTION 'FAIL: cross-tenant SELECT leakage';
 END IF;
 IF (SELECT count(*) FROM public.organizations) <> 1 THEN
   RAISE EXCEPTION 'FAIL: organization SELECT leakage';
 END IF;
END $$;
INSERT INTO public.companies (organization_id,tax_id,legal_name)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11222333000181','Company duplicate')
ON CONFLICT (organization_id,tax_id) DO NOTHING;
DO $$
DECLARE denied boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.companies (organization_id,tax_id,legal_name)
    VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11333222000194','Must deny cross tenant');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL: cross-tenant INSERT permitted'; END IF;
END $$;

-- Viewer B: only own records, cannot insert/update.
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$
DECLARE denied boolean := false;
BEGIN
 IF (SELECT count(*) FROM public.companies) <> 1 THEN
   RAISE EXCEPTION 'FAIL: viewer B must see exactly one company';
 END IF;
 BEGIN
   INSERT INTO public.companies (organization_id,tax_id,legal_name)
   VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11555444000180','Viewer cannot insert');
 EXCEPTION WHEN insufficient_privilege THEN denied := true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL: viewer INSERT permitted'; END IF;
END $$;

-- Anonymous: no API privileges even if RLS would otherwise fail closed.
RESET ROLE;
SET LOCAL ROLE anon;
DO $$
DECLARE denied boolean := false;
BEGIN
 BEGIN PERFORM count(*) FROM public.companies;
 EXCEPTION WHEN insufficient_privilege THEN denied := true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL: anon SELECT permitted'; END IF;
END $$;
RESET ROLE;

-- No fixture survives. Database changes must not be executed on production.
ROLLBACK;
