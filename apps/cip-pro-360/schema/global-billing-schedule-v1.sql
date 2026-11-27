-- CIP360 Global billing poll schedule
-- Dormant until Vault secret cip_ops_billing_sync_secret
-- and Edge environment CIP_BILLING_SYNC_SECRET contain the same high-entropy value.
-- No secrets are embedded in cron.job SQL or committed to GitHub.
create or replace function cip_ops_private.billing_sync_tick()
returns text language plpgsql security definer set search_path='' as $$
declare v_secret text;
declare v_request bigint;
begin
 select decrypted_secret into v_secret
 from vault.decrypted_secrets where name='cip_ops_billing_sync_secret' limit 1;
 if v_secret is null or length(v_secret)<32 then return 'not_configured';end if;
 select net.http_post(
  url:='https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-ops-billing-sync',
  body:='{}'::jsonb,
  headers:=jsonb_build_object('content-type','application/json','x-cip-billing-secret',v_secret),
  timeout_milliseconds:=10000
 ) into v_request;
 return case when v_request is null then 'not_queued' else 'queued' end;
exception when others then
 return 'sync_dispatch_unavailable';
end$$;
revoke all on function cip_ops_private.billing_sync_tick() from public,anon,authenticated;
select cron.schedule('cip-ops-global-billing','0 */6 * * *',
 'select cip_ops_private.billing_sync_tick();');
