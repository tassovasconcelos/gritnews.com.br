-- Budget management and human-entered accounting; explicit manual provenance.
create or replace function public.cip_ops_set_budget(
 p_company text,p_provider text,p_expected_version integer,
 p_monthly numeric,p_daily numeric,p_warning integer,p_critical integer,p_reason text
)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.cip_ops_provider_settings%rowtype;
begin
 if not public.cip_ops_can_view(p_company) then raise exception 'director_required'; end if;
 if p_expected_version is null or p_monthly is not null and (p_monthly<0 or p_monthly>100000000)
  or p_daily is not null and (p_daily<0 or p_daily>10000000)
  or p_warning not between 10 and 95 or p_critical not between 50 and 100
  or p_critical<=p_warning then raise exception 'invalid_budget';end if;
 if length(trim(coalesce(p_reason,'')))<12 or length(p_reason)>300 then raise exception 'justification_required';end if;
 select * into v from public.cip_ops_provider_settings
  where company_id=p_company and provider=p_provider for update;
 if not found then raise exception 'provider_not_found';end if;
 if v.version<>p_expected_version then raise exception 'budget_version_changed';end if;
 update public.cip_ops_provider_settings
 set monthly_budget_usd=p_monthly,daily_budget_usd=p_daily,warn_percent=p_warning,
     critical_percent=p_critical,notes=left('Política revisada: '||p_reason,500)
 where company_id=p_company and provider=p_provider;
 select * into v from public.cip_ops_provider_settings
 where company_id=p_company and provider=p_provider;
 return jsonb_build_object('provider',p_provider,'company',p_company,'version',v.version,
  'monthly_budget_usd',v.monthly_budget_usd,'daily_budget_usd',v.daily_budget_usd,
  'enforced_by_provider',false,'instrumentation_only',true);
end$$;
revoke all on function public.cip_ops_set_budget(text,text,integer,numeric,numeric,integer,integer,text) from public,anon;
grant execute on function public.cip_ops_set_budget(text,text,integer,numeric,numeric,integer,integer,text) to authenticated;

create policy cip_ops_billing_manual_insert on public.cip_ops_billing_snapshots
 for insert to authenticated with check (
 source='manual' and created_by=(select auth.uid())
 and public.cip_ops_can_view(company_id)
 and observed_at<=now()+interval '5 minutes'
 and observed_at>=now()-interval '180 days'
 and period_month=date_trunc('month',observed_at at time zone 'UTC')::date
);
grant insert(company_id,provider,observed_at,source,month_spend_usd,
 credit_balance_usd,provider_limit_usd,currency,period_month,reference_label,created_by)
 on public.cip_ops_billing_snapshots to authenticated;
-- Mandatory trigger prevents a browser client from claiming provider-verified reports.
create or replace function cip_ops_private.guard_billing_snapshot()
returns trigger language plpgsql set search_path='' as $$
begin
 if current_user='authenticated' then
   if new.source<>'manual' or new.created_by is distinct from auth.uid()
     then raise exception 'manual_only';end if;
 end if;
 if new.period_month is distinct from date_trunc('month',new.observed_at at time zone 'UTC')::date
 then raise exception 'invalid_period';end if;
 return new;
end$$;
drop trigger if exists cip_ops_billing_guard on public.cip_ops_billing_snapshots;
create trigger cip_ops_billing_guard before insert on public.cip_ops_billing_snapshots
for each row execute function cip_ops_private.guard_billing_snapshot();
revoke all on function cip_ops_private.guard_billing_snapshot() from public,anon,authenticated;

-- Two independent, lightweight, server-owned monitoring jobs. No model calls.
select cron.schedule('cip-ops-metering','*/10 * * * *',
 'select cip_ops_private.sync_faro_usage();');
select cron.schedule('cip-ops-alerts','*/10 * * * *',
 'select cip_ops_private.refresh_alerts();');
