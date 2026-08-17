-- Closed-loop attribution: preserva origem do cadastro e reconcilia receita confirmada pelo Mercado Pago.
alter table public.tenants
  add column if not exists acquisition_source text,
  add column if not exists acquisition_medium text,
  add column if not exists acquisition_campaign text,
  add column if not exists acquisition_content text,
  add column if not exists acquisition_term text,
  add column if not exists acquisition_gclid text,
  add column if not exists acquisition_fbclid text,
  add column if not exists acquisition_landing_path text,
  add column if not exists acquisition_first_seen timestamptz;

create table if not exists public.marketing_conversion_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  event_key text not null unique,
  event_kind text not null check(event_kind in ('activation','subscription')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'BRL',
  provider_id text,
  attributed_source text,
  attributed_campaign text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.marketing_conversion_events enable row level security;
revoke all on table public.marketing_conversion_events from public,anon,authenticated;
create policy marketing_conversion_events_admin_select on public.marketing_conversion_events for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_tenant uuid; v_business text; v_slug text; v_first_seen timestamptz;
begin
  insert into public.profiles(id,full_name,phone)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone')
  on conflict(id) do nothing;
  v_business:=nullif(trim(coalesce(new.raw_user_meta_data->>'business_name','')),'');
  if v_business is not null then
    v_slug:=trim(both '-' from lower(regexp_replace(v_business,'[^a-zA-Z0-9]+','-','g')))||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,6);
    begin v_first_seen := nullif(new.raw_user_meta_data->>'attribution_first_seen','')::timestamptz; exception when others then v_first_seen:=null; end;
    insert into public.tenants(owner_user_id,name,slug,phone,acquisition_source,acquisition_medium,acquisition_campaign,acquisition_content,acquisition_term,acquisition_gclid,acquisition_fbclid,acquisition_landing_path,acquisition_first_seen)
    values(new.id,v_business,v_slug,new.raw_user_meta_data->>'phone',nullif(new.raw_user_meta_data->>'utm_source',''),nullif(new.raw_user_meta_data->>'utm_medium',''),nullif(new.raw_user_meta_data->>'utm_campaign',''),nullif(new.raw_user_meta_data->>'utm_content',''),nullif(new.raw_user_meta_data->>'utm_term',''),nullif(new.raw_user_meta_data->>'gclid',''),nullif(new.raw_user_meta_data->>'fbclid',''),nullif(new.raw_user_meta_data->>'landing_path',''),v_first_seen)
    returning id into v_tenant;
    insert into public.tenant_users(tenant_id,user_id,role) values(v_tenant,new.id,'owner') on conflict do nothing;
    insert into public.subscriptions(tenant_id,plan_code,status) values(v_tenant,'meu_espetinho_89','trialing') on conflict(tenant_id) do nothing;
  end if;
  return new;
end;$$;

create or replace function public.record_marketing_conversion(p_tenant_id uuid,p_event_key text,p_event_kind text,p_amount numeric,p_provider_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_campaign uuid; v_utm text; v_source text; v_inserted uuid;
begin
  if current_user not in ('postgres','service_role','supabase_admin') and auth.role()<>'service_role' then raise exception 'forbidden'; end if;
  select acquisition_campaign,acquisition_source into v_utm,v_source from public.tenants where id=p_tenant_id;
  if not found then raise exception 'tenant_not_found'; end if;
  select id into v_campaign from public.marketing_campaigns where lower(coalesce(utm_campaign,''))=lower(coalesce(v_utm,'')) and coalesce(v_utm,'')<>'' order by created_at desc limit 1;
  insert into public.marketing_conversion_events(tenant_id,campaign_id,event_key,event_kind,amount,provider_id,attributed_source,attributed_campaign)
  values(p_tenant_id,v_campaign,p_event_key,p_event_kind,p_amount,p_provider_id,v_source,v_utm)
  on conflict(event_key) do nothing returning id into v_inserted;
  if v_inserted is null then return jsonb_build_object('ok',true,'duplicate',true); end if;
  if v_campaign is not null then
    insert into public.marketing_campaign_metrics(campaign_id,metric_date,subscriptions,revenue,source)
    values(v_campaign,current_date,case when p_event_kind='subscription' then 1 else 0 end,p_amount,'billing')
    on conflict(campaign_id,metric_date,source) do update set
      subscriptions=public.marketing_campaign_metrics.subscriptions + excluded.subscriptions,
      revenue=public.marketing_campaign_metrics.revenue + excluded.revenue;
  end if;
  return jsonb_build_object('ok',true,'campaign_id',v_campaign,'attributed',v_campaign is not null);
end;$$;
revoke all on function public.record_marketing_conversion(uuid,text,text,numeric,text) from public,anon,authenticated;
grant execute on function public.record_marketing_conversion(uuid,text,text,numeric,text) to service_role;
