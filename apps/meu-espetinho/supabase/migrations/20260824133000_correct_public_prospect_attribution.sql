create or replace function public.grit_enrich_lead_origin()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  new.source_platform := coalesce(nullif(new.source_platform,''), public.grit_lead_source_platform(new.source,new.medium,new.gclid,new.fbclid,new.landing_page));
  new.source_type := coalesce(nullif(new.source_type,''), case
    when lower(coalesce(new.source,'')) in ('outbound_public','public_google_business') then 'public_business_listing'
    when new.source_form_id is not null then 'lead_form'
    when new.landing_page is not null then 'website_form'
    else 'manual'
  end);
  new.first_touch_source := coalesce(new.first_touch_source,new.source_platform,new.source);
  new.first_touch_medium := coalesce(new.first_touch_medium,new.medium,new.source_type);
  new.first_touch_campaign := coalesce(new.first_touch_campaign,new.campaign);
  new.last_touch_source := coalesce(new.source_platform,new.source,new.last_touch_source);
  new.last_touch_medium := coalesce(new.medium,new.source_type,new.last_touch_medium);
  new.last_touch_campaign := coalesce(new.campaign,new.last_touch_campaign);
  return new;
end $$;

update public.leads set source_type='public_business_listing'
where lower(coalesce(source,'')) in ('outbound_public','public_google_business');
