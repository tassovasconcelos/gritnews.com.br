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

Runtime ingestion, API authentication, provider connections and integration with the current GRIT CRM remain pending.

## Isolation and future integration

- No imports from or direct writes to legacy GRIT or Meu Cuidador databases.
- Access for the new organization must be provisioned through a trusted server operation; self-assignment of memberships is not available through client RLS.
- Only authorized B2B company data can be imported, with documented provenance and legal purpose.
- New migrations, CI and a pull request are required before a production release.


## Dedicated-project cost and authorization gate (2026-09-21)

The connected Supabase cost tool reports amount 10, monthly recurrence, for creating a project in organization \`myarkaitcapeafgbrfbi\`. The API response does not indicate its currency. The project was created with a provider confirmation ID after displaying the monthly cost; do not assume that existing subscription credits cover it.

The test harness in \`db/tests/0001_rls_isolation.sql\` is **staged, not executed**. It creates two disposable auth users and organizations in a transaction, validates operator/viewer/anonymous restrictions, and rolls back. Execute only against a NEW disposable project after applying the migration; never against GRIT shared production. Live backup/restore, organization isolation and permissions remain unverified.
