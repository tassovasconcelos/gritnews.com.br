-- GRIT 100x2: fotografia operacional agregada, sem dados pessoais.
-- Período oficial: 26/08/2026 a 24/09/2026 (America/Sao_Paulo).
with settings as (
  select
    '2026-08-26 00:00:00-03'::timestamptz campaign_start,
    '2026-09-25 00:00:00-03'::timestamptz campaign_end,
    least(30,greatest(1,(current_date-date '2026-08-26')+1))::numeric elapsed_days
),
products(product) as (values ('meu-espetinho'::text),('sr-padeiro'::text)),
consented as (
  select l.product,count(distinct l.id)::numeric total
  from public.leads l
  join public.lead_channel_consents c on c.lead_id=l.id
  cross join settings s
  where l.created_at>=s.campaign_start and l.created_at<s.campaign_end
    and l.do_not_contact is not true and c.status='granted'
    and (c.expires_at is null or c.expires_at>now())
  group by l.product
),
trials as (
  select 'meu-espetinho'::text product,count(*)::numeric total
  from public.subscriptions x cross join settings s
  where x.created_at>=s.campaign_start and x.created_at<s.campaign_end
    and x.status in ('trial','trialing')
  union all
  select 'sr-padeiro',count(*)::numeric
  from public.srp_access_control x cross join settings s
  where x.trial_starts_at>=s.campaign_start and x.trial_starts_at<s.campaign_end
),
paid as (
  select 'meu-espetinho'::text product,count(*)::numeric total
  from public.subscriptions x cross join settings s
  where x.created_at>=s.campaign_start and x.created_at<s.campaign_end
    and x.status in ('active','paid')
  union all
  -- Sr. Padeiro ainda não possui confirmação de cobrança ligada ao produto.
  select 'sr-padeiro',0::numeric
),
activation as (
  select 'meu-espetinho'::text product,count(distinct tenant_id)::numeric total
  from public.marketing_conversion_events x cross join settings s
  where x.occurred_at>=s.campaign_start and x.occurred_at<s.campaign_end
    and x.event_kind in ('activation','first_value','first_sale')
  union all
  select 'sr-padeiro',count(distinct organization_id)::numeric
  from public.srp_operation_events x cross join settings s
  where x.created_at>=s.campaign_start and x.created_at<s.campaign_end
    and x.event_name='first_sale'
),
queue as (
  select l.product,
    count(*) filter(where q.status in ('queued','pending'))::numeric queued,
    count(*) filter(where q.status='failed')::numeric failed,
    count(*) filter(where q.status='consent_required')::numeric consent_blocked
  from public.lead_outreach_queue q join public.leads l on l.id=q.lead_id
  group by l.product
),
funnel as (
  select p.product,s.elapsed_days,
    coalesce(c.total,0) consented_leads,
    coalesce(t.total,0) trials,
    coalesce(a.total,0) first_value,
    coalesce(pd.total,0) paid,
    coalesce(q.queued,0) queued,
    coalesce(q.failed,0) failed,
    coalesce(q.consent_blocked,0) consent_blocked
  from products p cross join settings s
  left join consented c using(product)
  left join trials t using(product)
  left join activation a using(product)
  left join paid pd using(product)
  left join queue q using(product)
)
select jsonb_build_object(
  'generated_at',now(),
  'campaign',jsonb_build_object('starts_on','2026-08-26','ends_on','2026-09-24','day',max(elapsed_days)),
  'products',jsonb_agg(jsonb_build_object(
    'product',product,
    'actual',jsonb_build_object(
      'qualified_visits',null,
      'consented_leads',consented_leads,
      'trials',trials,
      'first_value',first_value,
      'paid',paid
    ),
    'target_to_date',jsonb_build_object(
      'qualified_visits',169*elapsed_days,
      'consented_leads',26*elapsed_days,
      'trials',11*elapsed_days,
      'paid',round(3.34*elapsed_days,2)
    ),
    'gap',jsonb_build_object(
      'consented_leads',consented_leads-(26*elapsed_days),
      'trials',trials-(11*elapsed_days),
      'paid',paid-round(3.34*elapsed_days,2)
    ),
    'projection_30d',jsonb_build_object(
      'consented_leads',round(consented_leads/elapsed_days*30,1),
      'trials',round(trials/elapsed_days*30,1),
      'paid',round(paid/elapsed_days*30,1)
    ),
    'outreach',jsonb_build_object('queued',queued,'failed',failed,'blocked_without_consent',consent_blocked),
    'decision',case
      when paid<3 then 'maintain_no_scale'
      when trials>0 and paid/trials<0.15 then 'recommend_pause'
      else 'cac_required_before_scale'
    end,
    'measurement_notes',case when product='sr-padeiro'
      then jsonb_build_array('qualified_visits_unavailable','paid_billing_not_connected')
      else jsonb_build_array('qualified_visits_unavailable')
    end
  ) order by product)
) as grit_100x2_snapshot
from funnel;
