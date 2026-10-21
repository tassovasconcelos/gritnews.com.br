-- Preserve all existing access rules and records.
create index if not exists cp_branding_updated_by_idx on public.cp_branding(updated_by);
create index if not exists cp_lab_studies_created_by_idx on public.cp_lab_studies(created_by);
create index if not exists cp_product_costs_product_id_idx on public.cp_product_costs(product_id);
create index if not exists cp_travel_quotes_recorded_by_idx on public.cp_travel_quotes(recorded_by);
create index if not exists cp_user_directory_auth_user_id_idx on public.cp_user_directory(auth_user_id);
alter policy cp_membership_read on public.cp_memberships using (
 user_id = (select auth.uid()) or private.cp_has_org_role(organization_id,array['group_admin'::text,'grit_superadmin'::text])
);
alter policy cp_quote_insert on public.cp_quote_batches with check (
 private.cp_has_role(company_id,array['group_admin'::text,'buyer'::text]) and created_by=(select auth.uid())
);
