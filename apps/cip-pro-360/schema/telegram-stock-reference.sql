begin;
create or replace function public.cip_bot_stock_reference(p_telegram text,p_chat text,p_company text,p_scope text default 'both',p_query text default '',p_store text default '',p_kind text default 'summary',p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid;b public.cip_stock_reference_batches;result jsonb='[]';totals jsonb;items jsonb;units jsonb;cnt bigint;cost numeric;potential numeric;
begin
 select user_id into actor from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and chat_id=telegram_id and active;
 if actor is null or not coalesce(p_company=any(public.cip_report_companies(actor)),false) then raise exception 'authorized_company_required';end if;
 if p_company<>'shopping_prohospital' then return jsonb_build_object('available',false,'reason','Ainda não há carga de estoque de referência desta empresa.');end if;
 if p_scope not in ('both','cd100_partial','stores_only_partial') or p_kind not in ('summary','product','quality','priorities','units') or p_offset is null or p_offset<0 or p_offset>20000 or p_query is null or length(p_query)>200 or p_store is null or p_store!~ '^[0-9]{0,8}$' then raise exception 'invalid_filter';end if;
 for b in select distinct on(scope) * from public.cip_stock_reference_batches where company_id=p_company and status='reference_unreconciled' and (p_scope='both' or scope=p_scope) order by scope,loaded_at desc,source_hash loop
  select count(*),sum(declared_cost),sum(declared_potential) into cnt,cost,potential from public.cip_stock_reference_rows where source_hash=b.source_hash and company_id=p_company;
  if cnt<>(b.summary->>'rows')::bigint or cost is distinct from (b.summary->>'declared_cost')::numeric or potential is distinct from (b.summary->>'declared_potential')::numeric then raise exception 'reference_integrity_failed';end if;
  select jsonb_build_object('rows',count(*),'skus',count(distinct sku),'stores',count(distinct store_code),'cost',coalesce(sum(declared_cost),0)::text,'potential',case when b.scope='cd100_partial' then null else coalesce(sum(declared_potential),0)::text end,'cost_review',count(*) filter(where cost_review),'zero_cost',count(*) filter(where unit_cost=0)) into totals
  from public.cip_stock_reference_rows r where r.source_hash=b.source_hash and r.company_id=p_company and (p_store='' or store_code=p_store)
  and (p_kind<>'quality' or cost_review or unit_cost=0 or sale_price<unit_cost)
  and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',sku,description,brand,product_group,subgroup)))=0);
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from (
  select sku,left(description,150) description,store_code,quantity::text,unit_cost::text,declared_cost::text,sale_price::text,declared_potential::text,source_days,last_sale,last_entry,cost_review,source_row from public.cip_stock_reference_rows r where r.source_hash=b.source_hash and r.company_id=p_company and (p_store='' or store_code=p_store)
  and (p_kind<>'quality' or cost_review or unit_cost=0 or sale_price<unit_cost)
  and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',sku,description,brand,product_group,subgroup)))=0)
  order by declared_cost desc,store_code,sku limit 5 offset p_offset) x;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into units from (select store_code,count(*) rows,sum(declared_cost)::text cost from public.cip_stock_reference_rows r where r.source_hash=b.source_hash and r.company_id=p_company and (p_store='' or store_code=p_store)
  and (p_kind<>'quality' or cost_review or unit_cost=0 or sale_price<unit_cost)
  and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(p_query)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',sku,description,brand,product_group,subgroup)))=0)
  group by store_code order by sum(declared_cost) desc,store_code limit 19) x;
  result=result||jsonb_build_array(jsonb_build_object('source',b.source_file,'hash',b.source_hash,'scope',b.scope,'reference_date',b.reference_date,'loaded_at',b.loaded_at,'status',b.status,'summary',totals,'items',items,'units',units,'offset',p_offset,'has_more',p_offset+5<(totals->>'rows')::bigint));
 end loop;
 return jsonb_build_object('available',jsonb_array_length(result)>0,'company',p_company,'sources',result,'query',p_query,'store',p_store,'kind',p_kind);
end;$$;
revoke all on function public.cip_bot_stock_reference(text,text,text,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.cip_bot_stock_reference(text,text,text,text,text,text,text,integer) to service_role;
create or replace function public.cip_bot_interaction_ready(p_bot_id text) returns void language sql security definer set search_path='' as $$ update public.cip_bot_config set interaction_version=4 where id=1 and bot_id=p_bot_id; $$;
commit;
