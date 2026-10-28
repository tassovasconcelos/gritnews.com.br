begin;
CREATE OR REPLACE FUNCTION cip_pricing_private.desk_ordered(c text, q text, store text, channel_filter text, skip integer, v_order text, v_evidence text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s public.cip_erp_snapshots;cfg public.cip_mp_agent_config;items jsonb;refs jsonb;plans jsonb;events jsonb;policy jsonb;source_label text;source_at timestamptz;filtered integer;states jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if v_evidence is null or v_evidence not in ('all','with','without') then raise exception 'invalid_evidence_filter';end if;
 if v_order is null or v_order not in ('capital','quantity','cost','sku') then raise exception 'invalid_order';end if;
 if q is null or length(q)>200 or store is null or length(store)>80 or skip is null or skip<0 or skip>200000 or channel_filter is null or channel_filter not in ('loja','b2b','ecommerce','marketplace') then raise exception 'invalid_filter';end if;
 select * into cfg from public.cip_mp_agent_config where company_id=c;
 select jsonb_build_object('version',version,'rules',rules) into policy from public.cip_mp_campaign_policies where company_id=c order by version desc limit 1;
 select * into s from public.cip_erp_snapshots where company_id=c and status='approved' order by captured_at desc,created_at desc,id limit 1;
 if s.id is not null then
 source_label:='erp_approved';source_at:=s.captured_at;
 with inv as(select x->>'sku' sku,x->>'store_id' store_code,sum((x->>'quantity')::numeric) quantity,sum((x->>'stock_value')::numeric) value from jsonb_array_elements(s.payload->'data'->'inventory')x group by 1,2),
 pr as(select x->>'sku' sku,x->>'store_id' store_code,case when count(*)=1 then max((x->>'current_price')::numeric) end price from jsonb_array_elements(s.payload->'data'->'prices')x group by 1,2),
 prod as(select x->>'sku' sku,x->>'description' description,x->>'unit' unit from jsonb_array_elements(s.payload->'data'->'products')x),
 filtered_rows as(select i.sku,i.store_code,p.description,p.unit,i.quantity,case when i.quantity>0 then i.value/i.quantity end cost,pr.price from inv i left join prod p using(sku) left join pr using(sku,store_code) where i.quantity>0 and (store='' or i.store_code=store) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(q)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',i.sku,p.description)))=0))
,evidence_rows as(select f.* from filtered_rows f where v_evidence='all' or (v_evidence='with')=exists(select 1 from public.cip_market_offers mo join public.cip_market_runs mr on mr.id=mo.run_id and mr.company_id=mo.company_id where mo.company_id=c and mo.sku=f.sku and mo.state in('candidate','linked') and mo.created_at>=now()-interval '7 days' and cip_market_private.evidence_ready(mr.our,mr.criteria,mo.offer,mo.url,mo.seller)))
 select (select count(*) from evidence_rows),coalesce((select jsonb_agg(to_jsonb(x)) from(select * from evidence_rows order by case when v_order='capital' then quantity*cost end desc nulls last,case when v_order='quantity' then quantity end desc nulls last,case when v_order='cost' then cost end desc nulls last,sku,store_code limit 20 offset skip)x),'[]') into filtered,items;
 else
 source_label:='stock_reference';
 if c='shopping_prohospital' then
 select (b.as_of::timestamp at time zone 'America/Sao_Paulo') into source_at from public.cip_shopping_stock_batches b where b.company_id=c and b.status='reference_unreconciled' order by b.as_of desc,b.loaded_at desc,b.source_hash limit 1;
 with filtered_rows as(select a.sku,a.store_code,a.description,a.unit,a.quantity,a.unit_cost cost,a.sale_price price from public.cip_shopping_stock_rows a where a.company_id=c and a.source_hash=(select b.source_hash from public.cip_shopping_stock_batches b where b.company_id=c and b.status='reference_unreconciled' order by b.as_of desc,b.loaded_at desc,b.source_hash limit 1) and a.quantity>0 and (store='' or a.store_code=store) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(q)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',a.sku,a.description,a.brand)))=0))
,evidence_rows as(select f.* from filtered_rows f where v_evidence='all' or (v_evidence='with')=exists(select 1 from public.cip_market_offers mo join public.cip_market_runs mr on mr.id=mo.run_id and mr.company_id=mo.company_id where mo.company_id=c and mo.sku=f.sku and mo.state in('candidate','linked') and mo.created_at>=now()-interval '7 days' and cip_market_private.evidence_ready(mr.our,mr.criteria,mo.offer,mo.url,mo.seller)))
 select (select count(*) from evidence_rows),coalesce((select jsonb_agg(to_jsonb(x)) from(select * from evidence_rows order by case when v_order='capital' then quantity*cost end desc nulls last,case when v_order='quantity' then quantity end desc nulls last,case when v_order='cost' then cost end desc nulls last,sku,store_code limit 20 offset skip)x),'[]') into filtered,items;
 else
 select (b.as_of::timestamp at time zone 'America/Sao_Paulo') into source_at from public.cip_stock_intelligence_batches b where b.company_id=c and b.status='active' order by b.as_of desc,b.created_at desc,b.id limit 1;
 with filtered_rows as(select a.sku,a.store_code,max(a.description) description,max(a.unit) unit,sum(a.quantity) quantity,case when sum(a.quantity)>0 then sum(a.declared_cost)/sum(a.quantity) end cost,null::numeric price from public.cip_stock_intelligence_rows a where a.company_id=c and a.batch_id=(select b.id from public.cip_stock_intelligence_batches b where b.company_id=c and b.status='active' order by b.as_of desc,b.created_at desc,b.id limit 1) and a.quantity>0 and (store='' or a.store_code=store) and not exists(select 1 from unnest(regexp_split_to_array(lower(btrim(q)),'\s+')) t where t<>'' and position(t in lower(concat_ws(' ',a.sku,a.description,a.brand)))=0) group by a.sku,a.store_code)
,evidence_rows as(select f.* from filtered_rows f where v_evidence='all' or (v_evidence='with')=exists(select 1 from public.cip_market_offers mo join public.cip_market_runs mr on mr.id=mo.run_id and mr.company_id=mo.company_id where mo.company_id=c and mo.sku=f.sku and mo.state in('candidate','linked') and mo.created_at>=now()-interval '7 days' and cip_market_private.evidence_ready(mr.our,mr.criteria,mo.offer,mo.url,mo.seller)))
 select (select count(*) from evidence_rows),coalesce((select jsonb_agg(to_jsonb(x)) from(select * from evidence_rows order by case when v_order='capital' then quantity*cost end desc nulls last,case when v_order='quantity' then quantity end desc nulls last,case when v_order='cost' then cost end desc nulls last,sku,store_code limit 20 offset skip)x),'[]') into filtered,items;
 end if;
 end if;
 -- Choose a comparable available reference per visible SKU; every value retains its source record.
 select coalesce(jsonb_agg(item||jsonb_build_object('best_reference',(select to_jsonb(r) from public.cip_mp_market_refs r where r.company_id=c and r.sku=item->>'sku' and upper(btrim(r.our_unit))=upper(btrim(item->>'unit')) and r.channel=channel_filter and r.active and r.equivalent and r.availability='available' and r.observed_on between (now() at time zone 'America/Sao_Paulo')::date-cfg.reference_days and (now() at time zone 'America/Sao_Paulo')::date order by r.normalized_price,r.observed_on desc,r.id limit 1))),'[]') into items from jsonb_array_elements(items)item;
 select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('can_void',x.created_by=auth.uid() or cip_pricing_private.director(c))),'[]') into refs from(select * from public.cip_mp_market_refs where company_id=c and (q='' or sku ilike '%'||q||'%' or competitor ilike '%'||q||'%') order by created_at desc,id limit 100)x;
 select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('can_cancel',cip_pricing_private.director(c) or x.state='draft' and x.created_by=auth.uid())),'[]') into plans from(select * from public.cip_mp_price_plans where company_id=c and (q='' or sku ilike '%'||q||'%' or description ilike '%'||q||'%') and (store='' or store_code=store) order by created_at desc,id limit 50)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into events from(select plan_id,kind,detail,created_at from public.cip_mp_desk_events where company_id=c order by created_at desc,id desc limit 20)x;
 select coalesce(jsonb_object_agg(state,n),'{}') into states from(select state,count(*) n from public.cip_mp_price_plans where company_id=c group by state)x;
 return jsonb_build_object('schema',1,'company',c,'checked_at',now(),'source',source_label,'source_at',source_at,'source_fresh',s.id is not null and s.metadata->>'scope'='company_all' and s.captured_at>=now()-interval '36 hours' and s.captured_at<=now()+interval '5 minutes','items',items,'total',filtered,'offset',skip,'limit',20,'references',refs,'plans',plans,'states',states,'events',events,'policy',policy,'config',to_jsonb(cfg),'can_write',cip_pricing_private.writer(c),'can_review',cip_pricing_private.director(c),'execution_mode','assisted');
end;$function$;
create function cip_pricing_private.desk_comparison(c text,q text,store text,channel_filter text,skip integer,v_order text,v_evidence text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare d jsonb;items jsonb;b public.cip_shopping_stock_batches;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 d:=cip_pricing_private.desk_ordered(c,q,store,channel_filter,skip,v_order,v_evidence);
 if c='shopping_prohospital' and d->>'source'='stock_reference' then select * into b from public.cip_shopping_stock_batches where company_id=c and status='reference_unreconciled' order by as_of desc,loaded_at desc,source_hash limit 1;end if;
 select coalesce(jsonb_agg(x||jsonb_build_object('imported_price',case when d->>'source'='stock_reference' then x->'price' else null end,'own_price_verified',d->>'source'='erp_approved' and (d->>'source_fresh')::boolean and coalesce((x->>'price')::numeric>0,false),'price',case when d->>'source'='erp_approved' and (d->>'source_fresh')::boolean then x->'price' else 'null'::jsonb end,'price_role',case when d->>'source'='erp_approved' and (d->>'source_fresh')::boolean then 'approved_erp' else 'unverified_import' end,'price_provenance',jsonb_build_object('source',d->>'source','file',b.source_file,'sheet',b.source_sheet,'as_of',d->>'source_at','row',(select r.source_row from public.cip_shopping_stock_rows r where r.company_id=c and r.source_hash=b.source_hash and r.sku=x->>'sku' and r.store_code=x->>'store_code' order by r.source_row limit 1)))),'[]') into items from jsonb_array_elements(d->'items') x;
 return d||jsonb_build_object('items',items,'order',v_order,'evidence_filter',v_evidence,'price_semantics','own_requires_approved_current_source');
end;$$;
revoke all on function cip_pricing_private.desk_ordered(text,text,text,text,integer,text,text),cip_pricing_private.desk_comparison(text,text,text,text,integer,text,text) from public,anon;
grant execute on function cip_pricing_private.desk_ordered(text,text,text,text,integer,text,text),cip_pricing_private.desk_comparison(text,text,text,text,integer,text,text) to authenticated;
create function public.cip_mp_desk_compare_get(p_company text,p_query text default '',p_store text default '',p_channel text default 'loja',p_offset integer default 0,p_order text default 'capital',p_evidence text default 'all') returns jsonb language sql stable security invoker set search_path='' as $$select cip_pricing_private.desk_comparison(p_company,p_query,p_store,p_channel,p_offset,p_order,p_evidence);$$;
revoke all on function public.cip_mp_desk_compare_get(text,text,text,text,integer,text,text) from public,anon;
grant execute on function public.cip_mp_desk_compare_get(text,text,text,text,integer,text,text) to authenticated;

CREATE OR REPLACE FUNCTION cip_market_private.evidence_ready(own jsonb, criteria jsonb, o jsonb, u text, seller text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 select coalesce((cip_market_private.quality(own,criteria,o,u,seller)->>'basic_eligible')::boolean,false)
 and coalesce(length(btrim(o->>'quote'))>=5,false)
 and coalesce(u~'^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(/|$)',false)
 and coalesce(split_part(u,'/',3)!~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$',false)
 and coalesce(u!~*'^https://[^/]+/(marcas|busca|search|pesquisa|loja|categorias?|collections)(/|[?]|$)',false)
 and coalesce(u!~*'\.(pdf|csv|xlsx?|jpg|png)([?#]|$)',false)
 and coalesce(u!~*'[?&][^=&]*(token|secret|password|credential|signature|session)[^=&]*=',false)
 and coalesce(lower(seller)!~'pronut|prohospital|anunciante individual|desconhecido|n[aã]o identificado|diversos vendedores|v[aá]rios vendedores',false)
$function$;
CREATE OR REPLACE FUNCTION cip_market_private.board_read(c text, skus jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare wanted text[];rows jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if jsonb_typeof(skus) is distinct from 'array' or jsonb_array_length(skus)>20 or octet_length(skus::text)>5000 then raise exception 'invalid_filter';end if;
 select array_agg(x) into wanted from jsonb_array_elements_text(skus)x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(
 select distinct on(o.sku) o.id,o.sku,o.seller,o.url,o.created_at,o.state,r.our,r.criteria,o.offer||jsonb_build_object('quality',cip_market_private.quality(r.our,r.criteria,o.offer,o.url,o.seller)) offer
 from public.cip_market_offers o join public.cip_market_runs r on r.id=o.run_id and r.company_id=o.company_id
 where o.company_id=c and o.sku=any(wanted) and o.state in ('candidate','linked') and o.created_at>=now()-interval '7 days' and cip_market_private.evidence_ready(r.our,r.criteria,o.offer,o.url,o.seller)
 order by o.sku,o.created_at desc,o.id
 )x;
 return jsonb_build_object('rows',rows,'checked_at',now(),'candidate_only',true);
end;$function$;
notify pgrst,'reload schema';
commit;
