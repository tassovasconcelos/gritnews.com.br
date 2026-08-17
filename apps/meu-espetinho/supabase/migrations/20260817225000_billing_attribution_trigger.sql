-- A fonte de verdade da conversão passa a ser a transação confirmada no billing.
create or replace function private.reconcile_billing_marketing_conversion()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_campaign uuid; v_utm text; v_source text; v_event_key text; v_inserted uuid; v_kind text;
begin
  if coalesce(new.status,'') not in ('approved','authorized','active') then return new; end if;
  if new.kind not in ('activation','subscription') then return new; end if;
  if tg_op='UPDATE' and coalesce(old.status,'') in ('approved','authorized','active') then return new; end if;
  v_kind:=new.kind;
  v_event_key:=v_kind||':'||coalesce(nullif(new.provider_id,''),new.id::text);
  select acquisition_campaign,acquisition_source into v_utm,v_source from public.tenants where id=new.tenant_id;
  select id into v_campaign from public.marketing_campaigns where lower(coalesce(utm_campaign,''))=lower(coalesce(v_utm,'')) and coalesce(v_utm,'')<>'' order by created_at desc limit 1;
  insert into public.marketing_conversion_events(tenant_id,campaign_id,event_key,event_kind,amount,provider_id,attributed_source,attributed_campaign,occurred_at)
  values(new.tenant_id,v_campaign,v_event_key,v_kind,new.amount,new.provider_id,v_source,v_utm,coalesce(new.updated_at,new.created_at,now()))
  on conflict(event_key) do nothing returning id into v_inserted;
  if v_inserted is not null and v_campaign is not null then
    insert into public.marketing_campaign_metrics(campaign_id,metric_date,subscriptions,revenue,source)
    values(v_campaign,current_date,case when v_kind='subscription' then 1 else 0 end,new.amount,'billing')
    on conflict(campaign_id,metric_date,source) do update set subscriptions=public.marketing_campaign_metrics.subscriptions+excluded.subscriptions,revenue=public.marketing_campaign_metrics.revenue+excluded.revenue;
  end if;
  return new;
end;$$;
revoke all on function private.reconcile_billing_marketing_conversion() from public,anon,authenticated;
drop trigger if exists trg_billing_marketing_attribution on public.billing_transactions;
create trigger trg_billing_marketing_attribution after insert or update of status on public.billing_transactions for each row execute function private.reconcile_billing_marketing_conversion();
