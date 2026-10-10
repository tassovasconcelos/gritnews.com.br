-- CONSUMO PRO 360 | Compras e equalizador v1.1 — ações auditadas e segregadas.
-- This migration is applied only to the dedicated project consumo-pro-360-grit.
alter table public.cp_supplier_quotes
  add column if not exists unit_factor numeric(14,4) not null default 1 check(unit_factor>0),
  add column if not exists discount_total numeric(14,2) not null default 0 check(discount_total>=0),
  add column if not exists brand text,
  add column if not exists payment_days integer check(payment_days>=0),
  add column if not exists technical_compliant boolean not null default true,
  add column if not exists notes text,
  add column if not exists received_at timestamptz;

create table if not exists public.cp_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.cp_companies(id),
  quote_batch_id uuid not null references public.cp_quote_batches(id),
  supplier_id uuid not null references public.cp_suppliers(id),
  requested_by uuid not null references auth.users(id),
  decided_by uuid references auth.users(id),
  status text not null default 'pending_finance'
    check(status in ('pending_finance','approved','rejected','cancelled')),
  subtotal numeric(14,2) not null check(subtotal>=0),
  freight numeric(14,2) not null default 0,
  extra_tax numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null check(grand_total>=0),
  decision_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique(quote_batch_id,supplier_id)
);
create table if not exists public.cp_purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.cp_purchase_orders(id),
  product_id uuid not null references public.cp_products(id),
  quantity_base numeric(14,3) not null check(quantity_base>0),
  unit_price_base numeric(14,4) not null check(unit_price_base>=0),
  brand text,
  unique(purchase_order_id,product_id)
);
create index if not exists cp_po_company_date_idx on public.cp_purchase_orders(company_id,created_at desc);
create index if not exists cp_po_supplier_idx on public.cp_purchase_orders(supplier_id);
create index if not exists cp_po_approved_by_idx on public.cp_purchase_orders(decided_by);
create index if not exists cp_po_requested_by_idx on public.cp_purchase_orders(requested_by);
create index if not exists cp_po_line_product_idx on public.cp_purchase_order_lines(product_id);
alter table public.cp_purchase_orders enable row level security;
alter table public.cp_purchase_order_lines enable row level security;
create policy cp_po_read on public.cp_purchase_orders for select to authenticated
using(private.cp_has_role(company_id,array['group_admin','director','controller','finance','buyer']));
create policy cp_po_lines_read on public.cp_purchase_order_lines for select to authenticated
using(exists(select 1 from public.cp_purchase_orders p where p.id=purchase_order_id
 and private.cp_has_role(p.company_id,array['group_admin','director','controller','finance','buyer'])));
grant select on public.cp_purchase_orders,public.cp_purchase_order_lines to authenticated;

create or replace function public.cp_quote_add_line(p_batch uuid,p_product uuid,p_qty numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare b public.cp_quote_batches%rowtype; v_org uuid; v_id uuid;
begin
 select * into b from public.cp_quote_batches where id=p_batch for update;
 if b.id is null or b.status <> 'draft' then raise exception 'Cotação não está em rascunho'; end if;
 if not private.cp_has_role(b.company_id,array['group_admin','buyer']) then raise exception 'Sem permissão de compras'; end if;
 if p_qty is null or p_qty<=0 or p_qty>1000000 then raise exception 'Quantidade inválida'; end if;
 select organization_id into v_org from public.cp_companies where id=b.company_id;
 if not exists(select 1 from public.cp_products where id=p_product and organization_id=v_org and active) then raise exception 'SKU fora do catálogo da organização'; end if;
 insert into public.cp_quote_lines(batch_id,product_id,quantity) values(p_batch,p_product,p_qty)
 on conflict(batch_id,product_id) do update set quantity=excluded.quantity
 returning id into v_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,b.company_id,auth.uid(),'quote',p_batch,'line_saved',jsonb_build_object('product_id',p_product,'quantity',p_qty));
 return v_id;
end $$;

create or replace function public.cp_quote_record_offer(
 p_batch uuid,p_supplier uuid,p_product uuid,p_price numeric,p_unit_factor numeric,
 p_freight numeric default 0,p_tax numeric default 0,p_discount numeric default 0,
 p_delivery integer default null,p_payment integer default null,p_brand text default null,
 p_compliant boolean default true,p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.cp_quote_batches%rowtype; v_org uuid; v_qty numeric; v_id uuid;
begin
 select * into b from public.cp_quote_batches where id=p_batch for update;
 if b.id is null or b.status not in ('draft','ready') then raise exception 'Campanha encerrada'; end if;
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

create or replace function public.cp_propose_purchase_order(p_batch uuid,p_supplier uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare b public.cp_quote_batches%rowtype; v_org uuid; v_count integer; v_coverage integer;
 v_sub numeric; v_freight numeric; v_tax numeric; v_discount numeric; v_total numeric; v_id uuid;
begin
 select * into b from public.cp_quote_batches where id=p_batch for update;
 if b.id is null or b.status='closed' then raise exception 'Cotação não aceita propostas'; end if;
 if not private.cp_has_role(b.company_id,array['buyer','group_admin'])) then raise exception 'Somente Compras pode propor pedido'; end if;
 select organization_id into v_org from public.cp_companies where id=b.company_id;
 if not exists(select 1 from public.cp_suppliers where id=p_supplier and organization_id=v_org and active) then
  raise exception 'Fornecedor não autorizado'; end if;
 select count(*) into v_count from public.cp_quote_lines where batch_id=p_batch;
 if v_count=0 then raise exception 'Cotação não possui materiais'; end if;
 select count(*) into v_coverage from public.cp_supplier_quotes q
 join public.cp_quote_lines l on l.batch_id=q.batch_id and l.product_id=q.product_id
 where q.batch_id=p_batch and q.supplier_id=p_supplier and q.status='received'
 and q.technical_compliant and q.quantity=l.quantity;
 if v_coverage<>v_count then raise exception 'Fornecedor não cobriu todos os itens tecnicamente conformes'; end if;
 if exists(select 1 from public.cp_purchase_orders where quote_batch_id=p_batch and supplier_id=p_supplier)
 then raise exception 'Pedido desse fornecedor já foi proposto'; end if;
 select round(sum(q.quantity*q.unit_price/q.unit_factor),2),
 round(sum(q.freight),2),round(sum(q.extra_tax),2),round(sum(q.discount_total),2)
 into v_sub,v_freight,v_tax,v_discount
 from public.cp_supplier_quotes q where q.batch_id=p_batch and q.supplier_id=p_supplier and q.status='received';
 v_total:=v_sub+v_freight+v_tax-v_discount;
 if v_total<0 then raise exception 'Total negativo'; end if;
 insert into public.cp_purchase_orders
 (company_id,quote_batch_id,supplier_id,requested_by,subtotal,freight,extra_tax,discount_total,grand_total)
 values(b.company_id,p_batch,p_supplier,auth.uid(),v_sub,v_freight,v_tax,v_discount,v_total)
 returning id into v_id;
 insert into public.cp_purchase_order_lines(purchase_order_id,product_id,quantity_base,unit_price_base,brand)
 select v_id,q.product_id,q.quantity,round(q.unit_price/q.unit_factor,4),q.brand
 from public.cp_supplier_quotes q where q.batch_id=p_batch and q.supplier_id=p_supplier and q.status='received';
 update public.cp_quote_batches set status='ready' where id=p_batch;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,b.company_id,auth.uid(),'purchase_order',v_id,'proposed',
 jsonb_build_object('supplier_id',p_supplier,'total',v_total,'status','pending_finance'));
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
 select organization_id into v_org from public.cp_companies where id=po.company_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,po.company_id,auth.uid(),'purchase_order',po.id,'finance_decision',
 jsonb_build_object('approved',p_approve,'reason',p_reason,'grand_total',po.grand_total));
 return v_state;
end $$;

revoke execute on function public.cp_quote_add_line(uuid,uuid,numeric) from public,anon;
revoke execute on function public.cp_quote_record_offer(uuid,uuid,uuid,numeric,numeric,numeric,numeric,numeric,integer,integer,text,boolean,text) from public,anon;
revoke execute on function public.cp_propose_purchase_order(uuid,uuid) from public,anon;
revoke execute on function public.cp_finance_purchase_order(uuid,boolean,text) from public,anon;
grant execute on function public.cp_quote_add_line(uuid,uuid,numeric) to authenticated;
grant execute on function public.cp_quote_record_offer(uuid,uuid,uuid,numeric,numeric,numeric,numeric,numeric,integer,integer,text,boolean,text) to authenticated;
grant execute on function public.cp_propose_purchase_order(uuid,uuid) to authenticated;
grant execute on function public.cp_finance_purchase_order(uuid,boolean,text) to authenticated;
