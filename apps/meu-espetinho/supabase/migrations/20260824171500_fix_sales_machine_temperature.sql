create or replace function public.grit_refresh_sales_machine()
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare scored integer := 0; created_opportunities integer := 0; lifecycle_actions integer := 0;
begin
  update public.leads l set
    score=public.grit_calculate_lead_score(l), score_updated_at=now(),
    temperature=case when public.grit_calculate_lead_score(l)>=70 then 'hot' when public.grit_calculate_lead_score(l)>=55 then 'qualified' when public.grit_calculate_lead_score(l)>=40 then 'nurture' else 'low' end,
    priority=case when public.grit_calculate_lead_score(l)>=70 then 'urgent' when public.grit_calculate_lead_score(l)>=55 then 'high' when public.grit_calculate_lead_score(l)>=40 then 'normal' else 'low' end,
    sales_stage=case when l.status='won' then 'customer' when l.status='lost' then 'lost' when l.status='proposal' then 'proposal' when l.status='trial' then 'trial' when public.grit_calculate_lead_score(l)>=55 then 'qualified' else 'lead' end,
    sla_due_at=case when l.status not in ('won','lost') and l.first_contact_at is null then coalesce(l.sla_due_at,l.created_at + case when public.grit_calculate_lead_score(l)>=70 then interval '15 minutes' else interval '2 hours' end) else l.sla_due_at end,
    routing_reason=concat_ws('; ',coalesce(l.product_key,l.product,'grit_ecosystem'),case when public.grit_calculate_lead_score(l)>=70 then 'alta intenção' when public.grit_calculate_lead_score(l)>=40 then 'nutrição' else 'educação' end)
  where l.status not in ('won','lost') or l.score_updated_at is null;
  get diagnostics scored = row_count;
  insert into public.opportunities(lead_id,product,title,stage,status,value,probability,next_action,next_action_at,expected_close_at,source,campaign)
  select l.id,coalesce(l.product_key,l.product,'grit_ecosystem'),concat('Oportunidade - ',coalesce(l.business_name,l.name,'Lead')),case when l.status='proposal' then 'proposal' when l.status='trial' then 'trial' else 'qualified' end,'open',coalesce(l.potential_value,0),case when l.score>=70 then 60 else 35 end,case when l.status='trial' then 'Acompanhar ativação do teste' else 'Realizar diagnóstico comercial' end,coalesce(l.next_action_at,l.sla_due_at,now()+interval '2 hours'),coalesce(l.expected_close_at,now()+interval '14 days'),l.source_platform,l.campaign
  from public.leads l where l.score>=55 and l.status not in ('won','lost') and not exists(select 1 from public.opportunities o where o.lead_id=l.id and o.status='open');
  get diagnostics created_opportunities = row_count;
  insert into public.sales_lifecycle_actions(tenant_id,action_type,channel,status,due_at,payload,dedupe_key)
  select t.id,case when t.subscription_status='past_due' then 'payment_recovery' when t.subscription_status='trialing' and t.trial_ends_at<=now()+interval '24 hours' then 'trial_expiring' else 'trial_activation' end,'email','blocked',case when t.subscription_status='trialing' then greatest(now(),t.trial_ends_at-interval '24 hours') else now() end,jsonb_build_object('tenant_name',t.name,'subscription_status',t.subscription_status,'requires_verified_recipient',true),concat(t.id,':',t.subscription_status,':',coalesce(t.trial_ends_at::date,current_date)) from public.tenants t where t.subscription_status in ('trialing','past_due') on conflict(dedupe_key) do nothing;
  get diagnostics lifecycle_actions = row_count;
  return jsonb_build_object('scored_leads',scored,'created_opportunities',created_opportunities,'lifecycle_actions',lifecycle_actions,'ran_at',now());
end $$;
