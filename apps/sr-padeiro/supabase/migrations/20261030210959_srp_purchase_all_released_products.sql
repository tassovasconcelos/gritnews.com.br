-- Include released order products in reviewed purchase suggestions. Never activate catalog rows.
create or replace function public.srp_stock_management(o uuid, st uuid) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 perform public.ops_account_request_guard();
 if not(public.srp_runtime_access(o) and public.srp_role_allowed(o,array['owner','manager','stockist'])) and not private.ops_super() then raise exception 'Acesso de gestão necessário' using errcode='42501'; end if;
 if st is null or not exists(select 1 from public.srp_stores where id=st and organization_id=o) then raise exception 'Loja inválida'; end if;
 with sold as (
 select i.product_id,coalesce(sum(i.quantity) filter(where s.created_at>=now()-interval '7 days'),0) sold7,sum(i.quantity) sold28
 from public.srp_sale_items i join public.srp_sales s on s.id=i.sale_id and s.organization_id=i.organization_id
 where s.organization_id=o and s.store_id=st and s.status='completed' and s.created_at>=now()-interval '28 days' group by i.product_id
 ), stock_rows as (
 select p.id,p.name,p.variant,p.unit,p.active,p.fulfillment,p.sale_price,p.cost_price,(p.cost_reviewed or p.cost_price>0) cost_known,
 i.product_id is not null stock_configured,coalesce(i.quantity,0) quantity,coalesce(i.minimum_quantity,5) minimum_quantity,coalesce(i.target_quantity,50) target_quantity,
 coalesce(s.sold7,0) sold7,coalesce(s.sold28,0) sold28,
 greatest(coalesce(i.target_quantity,50),coalesce(i.minimum_quantity,5),ceil(greatest(coalesce(s.sold7,0),coalesce(s.sold28,0)/4)*1.15)) target
 from public.srp_products p left join public.srp_inventory i on i.organization_id=p.organization_id and i.product_id=p.id and i.store_id=st left join sold s on s.product_id=p.id
 where p.organization_id=o
 ) select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('suggested',case when active and fulfillment<>'confirmar' then greatest(0,target-quantity) else 0 end) order by name,variant),'[]') into result from stock_rows r;
 return result;
end $$;
revoke all on function public.srp_stock_management(uuid,uuid) from public,anon;
grant execute on function public.srp_stock_management(uuid,uuid) to authenticated;

