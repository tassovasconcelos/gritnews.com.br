create or replace function public.cp_formalize_quote(p_batch uuid,p_reason text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare b public.cp_quote_batches%rowtype;v_snapshot jsonb;v_org uuid;
begin
 select * into b from public.cp_quote_batches where id=p_batch for update;
 if b.id is null or not private.cp_has_role(b.company_id,array['buyer','group_admin']) then raise exception 'Somente Compras pode formalizar a cotação'; end if;
 if b.formalized_at is not null then return b.formalization_snapshot; end if;
 if b.status<>'draft' then raise exception 'Cotação indisponível para formalização'; end if;
 if length(btrim(coalesce(p_reason,'')))<20 then raise exception 'Registre os critérios e a justificativa da escolha (mínimo 20 caracteres)'; end if;
 if not exists(select 1 from public.cp_quote_lines where batch_id=p_batch) then raise exception 'Inclua os materiais'; end if;
 if exists(select 1 from public.cp_quote_lines l where l.batch_id=p_batch and not exists(
  select 1 from public.cp_supplier_quotes q where q.batch_id=l.batch_id and q.product_id=l.product_id
   and q.status='received' and q.technical_compliant and q.quantity=l.quantity)) then raise exception 'Todos os materiais precisam de proposta conforme e quantidade atualizada'; end if;
 if exists(select 1 from public.cp_supplier_quotes where batch_id=p_batch and status='received'
  and (length(btrim(coalesce(notes,'')))<3 or delivery_days is null or payment_days is null)) then
  raise exception 'Complete a referência da proposta, prazo de entrega e pagamento de cada oferta recebida'; end if;
 if exists(select 1 from public.cp_supplier_quotes q left join public.cp_quote_lines l on l.batch_id=q.batch_id and l.product_id=q.product_id where q.batch_id=b.id and q.status='received' and (l.id is null or q.quantity<>l.quantity or q.unit_price::text in ('NaN','Infinity','-Infinity') or q.unit_factor::text in ('NaN','Infinity','-Infinity'))) then raise exception 'Revise propostas com quantidade desatualizada ou preço inválido'; end if;
 select jsonb_build_object('batch_id',b.id,'title',b.title,'company_id',b.company_id,'company_name',(select name from public.cp_companies where id=b.company_id),'formalized_by',auth.uid(),
  'formalized_at',now(),'criteria',btrim(p_reason),
  'lines',(select jsonb_agg(to_jsonb(l)||jsonb_build_object('product_name',p.name,'sku',p.sku,'base_unit',p.unit) order by l.product_id) from public.cp_quote_lines l join public.cp_products p on p.id=l.product_id where l.batch_id=b.id),
  'offers',(select jsonb_agg(to_jsonb(q)||jsonb_build_object('product_name',p.name,'supplier_name',v.name,'base_unit',p.unit) order by q.product_id,q.supplier_id) from public.cp_supplier_quotes q join public.cp_products p on p.id=q.product_id join public.cp_suppliers v on v.id=q.supplier_id where q.batch_id=b.id and q.status='received')) into v_snapshot;
 update public.cp_quote_batches set status='ready',formalized_at=now(),formalized_by=auth.uid(),formalization_reason=btrim(p_reason),formalization_snapshot=v_snapshot where id=b.id;
 select organization_id into v_org from public.cp_companies where id=b.company_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,b.company_id,auth.uid(),'quote',b.id,'formalized',v_snapshot);
 return v_snapshot;
end $$;
revoke all on function public.cp_formalize_quote(uuid,text) from public,anon;
grant execute on function public.cp_formalize_quote(uuid,text) to authenticated;

alter table public.cp_procfit_lines add constraint cp_procfit_finite_values check(quantity_base::text not in ('NaN','Infinity','-Infinity') and unit_cost_landed::text not in ('NaN','Infinity','-Infinity') and total_landed::text not in ('NaN','Infinity','-Infinity'));
