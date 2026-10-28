-- Preserve ABC scope across branches; no source price or stock edit.
begin;
CREATE OR REPLACE FUNCTION cip_market_private.faro_sync(c text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare source text;
begin
 -- Only the Shopping source presently contains an explicit ABC curve. Do not manufacture a sales ABC for the distributor.
 if c<>'shopping_prohospital' then return;end if;
 select source_hash into source from public.cip_shopping_stock_batches where company_id=c and status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1;
 if source is null then update public.cip_faro_portfolio set active=false where company_id=c;return;end if;
 if exists(select 1 from public.cip_faro_config where company_id=c and last_source_hash=source) then update public.cip_faro_config set last_sync_at=now() where company_id=c;return;end if;
 insert into public.cip_faro_portfolio(company_id,sku,source_at,source_hash,our,identity,stock_value,priority)
 select c,r.sku,r.as_of,source,jsonb_build_object('sku',r.sku,'store_code',r.store_code,'description',r.description,'unit',r.unit,'price',r.sale_price,'source_at',r.as_of,'scope','representative_store','curve',totals.curve),
 jsonb_strip_nulls(jsonb_build_object('brand',left(r.brand,100),'our_pack_units',case when upper(btrim(r.unit)) in ('UN','UND','UNID','UNIDADE') then 1 end)),totals.value,totals.priority
 from (select distinct on(sku) * from public.cip_shopping_stock_rows where company_id=c and source_hash=source and length(sku) between 1 and 80 order by sku,(quantity>0) desc,declared_cost desc,store_code)r
 join (select sku,sum(declared_cost) value,max(priority) priority,case when bool_or(curve='A' and quantity>0) then 'A' else min(curve) filter(where quantity>0 and curve in ('B','C')) end curve from public.cip_shopping_stock_rows where company_id=c and source_hash=source group by sku)totals using(sku)
 on conflict(company_id,sku) do update set active=true,source_at=excluded.source_at,source_hash=excluded.source_hash,our=excluded.our,identity=excluded.identity,stock_value=excluded.stock_value,priority=excluded.priority,overrides=case when cip_faro_portfolio.our->>'unit' is distinct from excluded.our->>'unit' or cip_faro_portfolio.identity->>'brand' is distinct from excluded.identity->>'brand' or cip_faro_portfolio.our->>'description' is distinct from excluded.our->>'description' then '{}'::jsonb else cip_faro_portfolio.overrides end,updated_at=now();
 update public.cip_faro_portfolio p set active=false where p.company_id=c and not exists(select 1 from public.cip_shopping_stock_rows r where r.company_id=c and r.source_hash=source and r.sku=p.sku);
 update public.cip_faro_config set last_sync_at=now(),last_source_hash=source where company_id=c;
end;$function$;

with classified as(
 select r.company_id,r.sku,case when bool_or(r.curve='A' and r.quantity>0) then 'A' else min(r.curve) filter(where r.quantity>0 and r.curve in ('B','C')) end curve
 from public.cip_shopping_stock_rows r join public.cip_faro_config cfg on cfg.company_id=r.company_id and cfg.last_source_hash=r.source_hash where r.company_id='shopping_prohospital' group by r.company_id,r.sku
)
update public.cip_faro_portfolio p set our=jsonb_set(p.our,'{curve}',coalesce(to_jsonb(x.curve),'null'::jsonb)),updated_at=now() from classified x where p.company_id=x.company_id and p.sku=x.sku and p.active and p.our->>'curve' is distinct from x.curve;
commit;
