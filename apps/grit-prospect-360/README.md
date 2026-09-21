# GRIT Prospect 360 — MVP foundation (isolated)

Status: development branch only. Not deployed, not connected to a database and not authorized to send outbound communications.

## First feature: company onboarding

The initial deliverable is an offline CSV parser and validator for Brazilian CNPJ company records. It normalizes CNPJ, legal name and optional trade name, city and state; checks CNPJ digits; flags duplicates within the import and optional duplicates against a provided existing-CNPJ set.

The preview is pure: no records are written. Its result must never be described as a completed import.

Run with Node.js >=22:

    node --test apps/grit-prospect-360/src/*.test.mjs
    node apps/grit-prospect-360/scripts/import-dry-run.mjs /secure/local/companies.csv

Never commit imported customer data, CSV files, secrets or environment files.

## Database

See db/migrations/0001_initial.sql for a proposed organization-isolated initial schema. Apply only in a **dedicated, newly created Supabase project**, after the organization, cost, backup/restore plan and permission tests have been confirmed. Do NOT apply to the existing gritnews Supabase.

Runtime ingestion, API authentication, provider connections and integration with the current GRIT CRM remain pending.

## Isolation and future integration

- No imports from or direct writes to legacy GRIT or Meu Cuidador databases.
- Access for the new organization must be provisioned through a trusted server operation; self-assignment of memberships is not available through client RLS.
- Only authorized B2B company data can be imported, with documented provenance and legal purpose.
- New migrations, CI and a pull request are required before a production release.
