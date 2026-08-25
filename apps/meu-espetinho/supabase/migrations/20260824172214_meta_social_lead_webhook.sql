-- Supports fast, idempotent lookup of organic Meta leads without exposing data.
create index if not exists leads_social_identity_idx
  on public.leads(source_platform, source_lead_id, created_at desc)
  where source_platform in ('instagram', 'facebook') and source_lead_id is not null;

create index if not exists leads_social_keyword_campaign_idx
  on public.leads(campaign, product_key, status, created_at desc)
  where campaign = 'organic-social-keywords';
