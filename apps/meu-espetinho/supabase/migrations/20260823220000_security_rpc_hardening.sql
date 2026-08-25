-- Remove anonymous access accidentally inherited by privileged RPCs.
-- Each function still keeps its intended authenticated/service_role grants.

revoke execute on function public.admin_clear_tenant_courtesy(uuid) from public, anon;
revoke execute on function public.admin_waive_tenant_activation(uuid, text) from public, anon;
revoke execute on function public.cancellation_eligibility(uuid) from public, anon;
revoke execute on function public.set_marketing_runtime_config(text, text, text, text, text, text, text, text, text) from public, anon;

grant execute on function public.admin_clear_tenant_courtesy(uuid) to authenticated, service_role;
grant execute on function public.admin_waive_tenant_activation(uuid, text) to authenticated, service_role;
grant execute on function public.cancellation_eligibility(uuid) to authenticated, service_role;
grant execute on function public.set_marketing_runtime_config(text, text, text, text, text, text, text, text, text) to authenticated, service_role;

-- Trigger helpers should resolve objects through a deterministic path.
alter function public.touch_marketing_campaign_updated_at()
  set search_path = public, pg_temp;
