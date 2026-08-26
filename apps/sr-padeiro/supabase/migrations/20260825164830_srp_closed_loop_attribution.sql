-- Sr. Padeiro: atribuição de aquisição e marcos do funil de ativação.
alter table public.srp_organizations add column if not exists acquisition_source text;
alter table public.srp_organizations add column if not exists acquisition_medium text;
alter table public.srp_organizations add column if not exists acquisition_campaign text;
alter table public.srp_organizations add column if not exists acquisition_content text;
alter table public.srp_organizations add column if not exists acquisition_term text;
alter table public.srp_organizations add column if not exists acquisition_gclid text;
alter table public.srp_organizations add column if not exists acquisition_fbclid text;
alter table public.srp_organizations add column if not exists acquisition_landing_path text;
alter table public.srp_organizations add column if not exists acquisition_first_seen timestamptz;
alter table public.srp_organizations add column if not exists first_sale_at timestamptz;
create index if not exists srp_organizations_acquisition_idx on public.srp_organizations(acquisition_source,acquisition_campaign);
create unique index if not exists srp_operation_events_unique_milestone_idx on public.srp_operation_events(organization_id,event_name) where organization_id is not null and event_name in ('trial_started','onboarding_completed','first_sale');
create or replace function public.srp_track_first_sale_payment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare sale record;
begin
  select id,organization_id,store_id,seller_id,total into sale from public.srp_sales where id=new.sale_id and status='completed';
  if sale.id is null then return new; end if;
  update public.srp_organizations set first_sale_at=now() where id=sale.organization_id and first_sale_at is null;
  if found then
    insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata)
    values(sale.organization_id,sale.store_id,sale.seller_id,'first_sale','sale',sale.id,jsonb_build_object('total',sale.total))
    on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.srp_track_first_sale_payment() from public,anon,authenticated;
drop trigger if exists srp_payments_track_first_sale on public.srp_sale_payments;
create trigger srp_payments_track_first_sale after insert on public.srp_sale_payments for each row execute function public.srp_track_first_sale_payment();
