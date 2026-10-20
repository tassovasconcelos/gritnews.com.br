# AUD-001 baseline and decision record — 2026-09-21

Repository: tassovasconcelos/gritnews.com.br
Default branch: main
Baseline commit: 650558184c889f3157d316bca571113682d40bab
Baseline tree: a332c4bed17fdbb4e1a8133efdddfc3cf60cd7a1
Development branch: feat/grit-prospect-360-mvp-foundation-20260921

Read-only metadata review:
- Existing monorepo uses pnpm-workspace apps/*, a Vite/React root and separate app packages. Root package lists React 19; apps/gritnews lists React 18. Do not import either UI in the domain-only MVP without validating compatibility.
- Existing gritnews Supabase project pcrwtoddavpvkaxwtstc has lead/CRM/outreach/email tables. RLS is enabled for sampled tables, but several email campaign tables have no RLS policies; privileged server functions and service role access must be reviewed before integration.
- Policies on leads and lead_activities rely on private.is_platform_admin(); outreach/opportunities rely on admin_users. These do not provide tenant isolation suitable for this new SaaS.
- Supabase security advisor reported 99 RLS-enabled tables with no policies, 1 security-definer view error, and warnings related to security-definer functions accessible by anon/authenticated roles. These are findings for the existing project, not proof of exposed records. See Supabase advisor for exact remediation.
- GRIT Control Center and Site Governance runs fail on Search Console authorization for the separate Moacir Rocha domain. The existing apps' availability checks passed in the inspected governance run.
- No production customer rows, secrets or credentials were exported. No existing database DDL/DML was run.

Scope decision:
Build the MVP as apps/grit-prospect-360 in an isolated development branch, with zero runtime imports from other apps. Plan a NEW Supabase project; DO NOT execute the staged SQL in the shared gritnews project. The dedicated Supabase project requires explicit organization selection and provider cost confirmation.

Outstanding gates:
1. Node tests + GitHub workflow pass on the feature branch.
2. Dependency vulnerability scanning and baseline branch-protection review.
3. Dedicated Supabase organization and potential cost approval; backups and restore test.
4. Authenticated and anonymous role testing of every new RLS policy, including cross-tenant denial.
5. Live import persistence, idempotent API, consent and source audit, and integration tests.
6. PR review and explicit release approval. No production deployment yet.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
