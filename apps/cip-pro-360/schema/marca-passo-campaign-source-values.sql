begin;
create or replace function public.cip_mp_campaign_source_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare source_payload jsonb; source_quantity numeric; source_stock_cost numeric; source_price numeric; price_rows integer;
begin
 if new.source_snapshot_at is null or new.source_snapshot_at>now()+interval '5 minutes' or new.source_snapshot_at<now()-interval '36 hours' then raise exception 'campaign_source_stale'; end if;
 select s.payload into source_payload from public.cip_erp_snapshots s where s.company_id=new.company_id and s.status='approved' and s.captured_at=new.source_snapshot_at and s.metadata->>'scope'='company_all';
 if source_payload is null then raise exception 'campaign_source_unverified'; end if;
 if exists(select 1 from public.cip_erp_snapshots s where s.company_id=new.company_id and s.status='approved' and s.captured_at>new.source_snapshot_at) then raise exception 'campaign_source_superseded'; end if;
 select coalesce(sum((r->>'quantity')::numeric),0),coalesce(sum((r->>'stock_value')::numeric),0) into source_quantity,source_stock_cost
 from jsonb_array_elements(source_payload->'data'->'inventory') r where r->>'sku'=new.sku and r->>'store_id'=new.store_code;
 if source_quantity<=0 or abs(source_quantity-(new.inputs->>'available_units')::numeric)>0.0001 or abs(source_stock_cost/source_quantity-(new.inputs->>'cost')::numeric)>0.01 then raise exception 'campaign_source_values_changed'; end if;
 select count(*),max((r->>'current_price')::numeric) into price_rows,source_price
 from jsonb_array_elements(source_payload->'data'->'prices') r where r->>'sku'=new.sku and r->>'store_id'=new.store_code;
 if price_rows<>1 or source_price is null or abs(source_price-(new.inputs->>'current_price')::numeric)>0.01 then raise exception 'campaign_source_values_changed'; end if;
 return new;
end;$$;
comment on function public.cip_mp_campaign_source_guard() is 'Requires an exact, current, human-approved, complete company snapshot and server-verifies SKU, store, cost, current price and stock quantity.';
commit;
