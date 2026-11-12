-- Bloqueios de concorrência e alterações de propostas após fase de adjudicação.
create unique index if not exists cp_po_single_approved_supplier on public.cp_purchase_orders(quote_batch_id) where status='approved';
create or replace function public.cp_quote_record_offer(
 p_batch uuid,p_supplier uuid,p_product uuid,p_price numeric,p_unit_factor numeric,
 p_freight numeric default 0,p_tax numeric default 0,p_discount numeric default 0,
 p_delivery integer default null,p_payment integer default null,p_brand text default null,
 p_compliant boolean default true,p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.cp_quote_batches%rowtype; v_org uuid; v_qty numeric; v_id uuid;
begin
 select * into b from public.cp_quote_batches where id=p_batch for update;
 if b.id is null or b.status <> 'draft' then raise exception 'Proposta encerrada para alterações após abertura de PO'; end if;
 if not private.cp_has_role(b.company_id,array['group_admin','buyer']) then raise exception 'Sem permissão de compras'; end if;
 if p_price is null or p_price<0 or p_unit_factor is null or p_unit_factor<=0
  or p_freight<0 or p_tax<0 or p_discount<0 or p_delivery<0 or p_payment<0
 then raise exception 'Preço, conversão ou condição inválidos'; end if;
 select organization_id into v_org from public.cp_companies where id=b.company_id;
 if not exists(select 1 from public.cp_suppliers where id=p_supplier and organization_id=v_org and active) then
  raise exception 'Fornecedor não pertence à organização'; end if;
 select quantity into v_qty from public.cp_quote_lines where batch_id=p_batch and product_id=p_product;
 if v_qty is null then raise exception 'Produto não está na campanha'; end if;
 if p_discount>round(v_qty*(p_price/p_unit_factor)+p_freight+p_tax,2)
 then raise exception 'Desconto excede custo da linha'; end if;
 insert into public.cp_supplier_quotes
 (batch_id,supplier_id,product_id,quantity,unit_price,unit_factor,freight,extra_tax,discount_total,delivery_days,payment_days,
  brand,technical_compliant,notes,status,received_at)
 values(p_batch,p_supplier,p_product,v_qty,p_price,p_unit_factor,p_freight,p_tax,p_discount,p_delivery,p_payment,
  p_brand,p_compliant,p_notes,'received',now())
 on conflict(batch_id,supplier_id,product_id) do update set
 quantity=excluded.quantity,unit_price=excluded.unit_price,unit_factor=excluded.unit_factor,
 freight=excluded.freight,extra_tax=excluded.extra_tax,discount_total=excluded.discount_total,
 delivery_days=excluded.delivery_days,payment_days=excluded.payment_days,brand=excluded.brand,
 technical_compliant=excluded.technical_compliant,notes=excluded.notes,status='received',received_at=now()
 returning id into v_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,b.company_id,auth.uid(),'supplier_quote',v_id,'offer_recorded',
 jsonb_build_object('supplier_id',p_supplier,'product_id',p_product,'quoted_price',p_price,
 'unit_factor',p_unit_factor,'freight',p_freight,'extra_tax',p_tax,'discount',p_discount,
 'delivery_days',p_delivery,'payment_days',p_payment,'compliant',p_compliant));
 return v_id;
end $$;
create or replace function public.cp_finance_purchase_order(p_order uuid,p_approve boolean,p_reason text default null)
returns text language plpgsql security definer set search_path='' as $$
declare po public.cp_purchase_orders%rowtype; v_org uuid; v_state text;
begin
 select * into po from public.cp_purchase_orders where id=p_order for update;
 if po.id is null or po.status<>'pending_finance' then raise exception 'Pedido já decidido ou inexistente'; end if;
 if auth.uid() is null or po.requested_by=auth.uid()
 or not private.cp_has_role(po.company_id,array['finance','director','group_admin'])
 then raise exception 'Segregação ou alçada financeira inválida'; end if;
 if not p_approve and nullif(pg_catalog.btrim(coalesce(p_reason,'')),'') is null then
 raise exception 'Motivo de rejeição obrigatório'; end if;
 v_state:=case when p_approve then 'approved' else 'rejected' end;
 update public.cp_purchase_orders
 set status=v_state,decided_by=auth.uid(),decided_at=now(),decision_reason=p_reason where id=p_order;
 if p_approve then
   update public.cp_quote_batches set status='closed' where id=po.quote_batch_id;
 end if;
 select organization_id into v_org from public.cp_companies where id=po.company_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,po.company_id,auth.uid(),'purchase_order',po.id,'finance_decision',
 jsonb_build_object('approved',p_approve,'reason',p_reason,'grand_total',po.grand_total));
 return v_state;
end $$;
