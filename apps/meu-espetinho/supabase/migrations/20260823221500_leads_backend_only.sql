-- Public lead capture must pass through the validated Edge Function.
drop policy if exists public_create_leads on public.leads;
revoke insert on table public.leads from anon, authenticated;

grant all on table public.leads to service_role;
