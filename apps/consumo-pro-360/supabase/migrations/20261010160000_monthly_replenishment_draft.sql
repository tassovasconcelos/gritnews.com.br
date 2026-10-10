-- GRIT NEXO | Rascunho mensal, sem pedido financeiro ou e-mail automático.
alter table public.cp_quote_batches
 add column if not exists source text not null default 'manual'
 check(source in ('manual','consumption_suggestion')),
 add column if not exists cycle_month date,
 add column if not exists estimation_window_days int;
create unique index if not exists cp_quote_monthly_unique
 on public.cp_quote_batches(company_id,cycle_month)
 where source='consumption_suggestion';

create or replace function public.cp_generate_replenishment_draft(p_company uuid,p_cycle date default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_org uuid; v_id uuid; v_cycle date; v_count integer;
begin
 if auth.uid() is null or not private.cp_has_role(p_company,array['buyer','group_admin'])
 then raise exception 'Somente Compras pode gerar a sugestão mensal'; end if;
 select organization_id into v_org from public.cp_companies where id=p_company and active;
 if v_org is null then raise exception 'Empresa inativa'; end if;
 v_cycle:=date_trunc('month',coalesce(p_cycle,(now() at time zone 'America/Fortaleza')::date))::date;
 if v_cycle>(date_trunc('month',(now() at time zone 'America/Fortaleza')::date)+interval '2 month')::date
 then raise exception 'Ciclo futuro fora do horizonte permitido'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_company::text||v_cycle::text,0));
 select id into v_id from public.cp_quote_batches
 where company_id=p_company and cycle_month=v_cycle and source='consumption_suggestion';
 if v_id is not null then return v_id; end if;

 insert into public.cp_quote_batches(company_id,title,created_by,source,cycle_month,estimation_window_days)
 values(p_company,'Reposição sugerida · '||to_char(v_cycle,'MM/YYYY'),auth.uid(),
 'consumption_suggestion',v_cycle,90)
 returning id into v_id;

 with consumption as (
  select product_id,sum(-quantity_change) as qty_90
  from public.cp_stock_events
  where company_id=p_company and event_type='delivery'
  and quantity_change<0 and occurred_at>=now()-interval '90 days'
  group by product_id
 ), available as (
  select product_id,sum(physical-reserved) as qty_available
  from public.cp_stock where company_id=p_company group by product_id
 ), demand as (
  select p.id as product_id,
   ceil(greatest(0,coalesce(c.qty_90,0)/3 + p.min_stock-coalesce(a.qty_available,0))) as suggested_qty
  from public.cp_products p
  left join consumption c on c.product_id=p.id
  left join available a on a.product_id=p.id
  where p.organization_id=v_org and p.active
 )
 insert into public.cp_quote_lines(batch_id,product_id,quantity)
 select v_id,product_id,suggested_qty from demand where suggested_qty>0;

 get diagnostics v_count=row_count;
 if v_count=0 then raise exception 'Sem demanda de reposição calculável a partir de estoque mínimo e consumo de 90 dias'; end if;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,p_company,auth.uid(),'quote',v_id,'replenishment_suggested',
 jsonb_build_object('cycle_month',v_cycle,'window_days',90,'items',v_count,
 'formula','max(0, consumo_90d/3 + estoque_minimo - estoque_disponivel) arredondado para cima',
 'send_status','not_sent'));
 return v_id;
end $$;
revoke execute on function public.cp_generate_replenishment_draft(uuid,date) from public,anon;
grant execute on function public.cp_generate_replenishment_draft(uuid,date) to authenticated;
