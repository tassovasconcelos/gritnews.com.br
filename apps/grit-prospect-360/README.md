# GRIT Prospect 360 — MVP foundation (isolated)

Status: development branch only. Dedicated database schema was applied, but application runtime is not connected or deployed; no outbound communications are authorized.

## First feature: company onboarding

The initial deliverable is an offline CSV parser and validator for Brazilian CNPJ company records. It normalizes CNPJ, legal name and optional trade name, city and state; checks CNPJ digits; flags duplicates within the import and optional duplicates against a provided existing-CNPJ set.

The preview is pure: no records are written. Its result must never be described as a completed import.

Run with Node.js >=22:

    node --test apps/grit-prospect-360/src/*.test.mjs
    node apps/grit-prospect-360/scripts/import-dry-run.mjs /secure/local/companies.csv

Never commit imported customer data, CSV files, secrets or environment files.

## Database

The isolated Supabase project `qspluchjhnnzgbbgmsro` (`grit-prospect-360`, `sa-east-1`) was created after cost confirmation. Migration `prospect_360_0001_initial` was successfully applied **only to this dedicated project**. Do NOT apply to the existing gritnews Supabase. Backup/restore and live cross-tenant RLS tests remain pending.

Migration `prospect_360_0002_import_rpc` was applied successfully ONLY to the dedicated project. It adds immutable company tenant/CNPJ identity, per-organization file-hash idempotency and an atomic service-role-only import function. A standalone authenticated HTTP API and service tests are implemented in code but NOT deployed, configured with secrets or live-tested against Supabase. Integration with the current GRIT CRM remains pending.

## Isolation and future integration

- No imports from or direct writes to legacy GRIT or Meu Cuidador databases.
- Access for the new organization must be provisioned through a trusted server operation; self-assignment of memberships is not available through client RLS.
- Only authorized B2B company data can be imported, with documented provenance and legal purpose.
- New migrations, CI and a pull request are required before a production release.


## Dedicated-project cost and authorization gate (2026-09-21)

The connected Supabase cost tool reports amount 10, monthly recurrence, for creating a project in organization \`myarkaitcapeafgbrfbi\`. The API response does not indicate its currency. The project was created with a provider confirmation ID after displaying the monthly cost; do not assume that existing subscription credits cover it.

The test harness in \`db/tests/0001_rls_isolation.sql\` is **staged, not executed**. It creates two disposable auth users and organizations in a transaction, validates operator/viewer/anonymous restrictions, and rolls back. Execute only against a NEW disposable project after applying the migration; never against GRIT shared production. Live backup/restore, organization isolation and permissions remain unverified.


## Company import API (development code only)

Run from monorepo after installing existing root dependencies with pnpm. API runtime uses the root @supabase/supabase-js dependency; no production process has been launched.

    node apps/grit-prospect-360/src/api-server.mjs

Environment (secure hosting config only): see .env.example. Startup refuses any Supabase URL other than the dedicated project's exact host. Keep the service_role key on the backend, never in VITE_ variables or client-side code. Ingress/reverse proxy, TLS, robust distributed rate limiting, backup/restore and end-to-end user onboarding are required before publishing.

POST /api/v1/company-imports/preview : { "organization_id": "<uuid>", "csv": "..." }
POST /api/v1/company-imports/apply   : { "organization_id": "<uuid>", "csv": "..." }

Both require Authorization: Bearer <user-access-token> and owner/admin/operator membership in the requested organization. Preview is read-only; apply calls the database RPC to atomically record a batch, company rows and audit event. Repeated file SHA within the same organization returns already_applied; duplicate CNPJs are skipped rather than overwritten. Only the service_role can execute the import RPC.

GET /health confirms HTTP process health only, and explicitly reports database_verified=false. It is not proof of Supabase connectivity or of successful import.

Status: Node test suite covers HTTP request handling and business service with fake Supabase. SQL function privileges and table counts were inspected read-only on the dedicated project; cross-tenant and real persistence E2E have NOT been completed. No new organization member has been provisioned. No real customer data has been imported.


## Browser interface (development only)

An isolated responsive, Portuguese company management interface is versioned at \`web/index.html\` and \`web/src/main.js\`, with a dedicated Vite config and CSS. It provides Supabase Auth login, organization selection (subject to RLS), company list and search with pagination, CSV preview, explicit confirmation before applying the import, and logout. No automatic contact or mail is sent.

Build using the already locked root workspace dependencies:

    pnpm install --frozen-lockfile
    pnpm exec vite build --config apps/grit-prospect-360/web/vite.config.mjs

Public browser environment values are listed in \`web/.env.example\` and MUST contain only the project's public anon key, never any service role key. Host and reverse proxy configuration remain pending. An empty organization list is an expected state until the first user and membership are provisioned. Do not claim a tested end-to-end login.

Dedicated CI exercises Node tests and builds the frontend artifact; both jobs passed on commit \`c79427cea12c96fd3550d945302d4b255c841fb0\`. The latest HEAD needs its own CI confirmation. Do not publish generated bundles until auth, cross-tenant tests, backups, legal purpose and vulnerability scanning are complete.
