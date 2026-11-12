-- CONSUMO PRO 360: idempotency, audit separation, supplier rights, safe fiscal paths.
alter table public.cp_requests add column if not exists client_key uuid;
create unique index if not exists cp_request_idempotency on public.cp_requests(company_id,created_by,client_key) where client_key is not null;

create or replace function public.cp_submit_request_once(p_company uuid,p_department uuid,p_items jsonb,p_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_existing uuid; v_created uuid;
begin
 if auth.uid() is null or p_key is null then raise exception 'Identificação autenticada e chave da solicitação são obrigatórias'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||p_company::text||p_key::text,0));
 select id into v_existing from public.cp_requests
 where company_id=p_company and created_by=auth.uid() and client_key=p_key;
 if v_existing is not null then return v_existing; end if;
 v_created:=public.cp_submit_request(p_company,p_department,p_items);
 update public.cp_requests set client_key=p_key where id=v_created and created_by=auth.uid();
 return v_created;
end $$;
revoke all on function public.cp_submit_request(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.cp_submit_request_once(uuid,uuid,jsonb,uuid) from public,anon;
grant execute on function public.cp_submit_request_once(uuid,uuid,jsonb,uuid) to authenticated;

-- Permissão de fornecedores acessível ao comprador vinculado à empresa.
drop policy if exists cp_supplier_insert on public.cp_suppliers;
create policy cp_supplier_insert on public.cp_suppliers for insert to authenticated
with check (
 private.cp_has_org_role(organization_id,array['group_admin','buyer'])
 or exists(select 1 from public.cp_companies c where c.organization_id=cp_suppliers.organization_id
 and private.cp_has_role(c.id,array['buyer','group_admin']))
);
drop policy if exists cp_supplier_update on public.cp_suppliers;
create policy cp_supplier_update on public.cp_suppliers for update to authenticated
using (
 private.cp_has_org_role(organization_id,array['group_admin','buyer'])
 or exists(select 1 from public.cp_companies c where c.organization_id=cp_suppliers.organization_id
 and private.cp_has_role(c.id,array['buyer','group_admin']))
)
with check (
 private.cp_has_org_role(organization_id,array['group_admin','buyer'])
 or exists(select 1 from public.cp_companies c where c.organization_id=cp_suppliers.organization_id
 and private.cp_has_role(c.id,array['buyer','group_admin']))
);

-- Restringir visibilidade do estoque ao escopo autorizado, e auxiliares privados robustos.
create or replace function private.cp_company_access(p_company uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.cp_companies c join public.cp_memberships m
   on m.organization_id=c.organization_id
  where c.id=p_company and m.user_id=auth.uid() and m.active
   and (m.company_id is null or m.company_id=c.id)
 );
$$;

-- Fluxo de alçada financeira não pode ser aprovado pela pessoa que tomou a decisão gerencial.
create or replace function public.cp_finance_decision(p_request uuid,p_approve boolean,p_reason text default null)
returns text language plpgsql security definer set search_path='' as $$
declare r public.cp_requests%rowtype; v_org uuid; v_state text;
begin
 select * into r from public.cp_requests where id=p_request for update;
 if r.id is null or r.status<>'pending_finance' then raise exception 'Solicitação não aguarda financeiro'; end if;
 if auth.uid() is null or r.created_by=auth.uid() or
 not private.cp_has_role(r.company_id,array['finance','group_admin','director'])
 then raise exception 'Alçada financeira não autorizada'; end if;
 if exists(select 1 from public.cp_audit_events a where a.entity='request'
  and a.entity_id=r.id and a.action='manager_decision' and a.actor_id=auth.uid())
 then raise exception 'Segregação: decisão gerencial e financeira exigem pessoas diferentes'; end if;
 if not p_approve and nullif(pg_catalog.btrim(coalesce(p_reason,'')),'') is null then
  raise exception 'Motivo obrigatório'; end if;
 v_state:=case when p_approve then 'approved' else 'rejected' end;
 select organization_id into v_org from public.cp_companies where id=r.company_id;
 update public.cp_requests set status=v_state,reason=p_reason,updated_at=now() where id=r.id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,r.company_id,auth.uid(),'request',r.id,'finance_decision',
 jsonb_build_object('approved',p_approve,'reason',p_reason));
 return v_state;
end $$;

-- Path check of private storage avoids unsafe casts for other bucket paths.
drop policy if exists cp_documents_read on storage.objects;
create policy cp_documents_read on storage.objects for select to authenticated
using(bucket_id='consumo-pro-fiscal' and
 case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then private.cp_has_role(split_part(name,'/',1)::uuid,
  array['warehouse','buyer','finance','controller','group_admin','director'])
 else false end);
drop policy if exists cp_documents_upload on storage.objects;
create policy cp_documents_upload on storage.objects for insert to authenticated
with check(bucket_id='consumo-pro-fiscal' and
 case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then private.cp_has_role(split_part(name,'/',1)::uuid,
  array['warehouse','buyer','group_admin'])
 else false end);

-- Índices pelos escopos multiempresa e tempo: melhorar consultas/reconciliacao.
create index if not exists cp_company_org_idx on public.cp_companies(organization_id);
create index if not exists cp_dept_company_idx on public.cp_departments(company_id);
create index if not exists cp_member_access_idx on public.cp_memberships(user_id,organization_id,company_id,department_id) where active=true;
create index if not exists cp_member_org_idx on public.cp_memberships(organization_id);
create index if not exists cp_member_company_idx on public.cp_memberships(company_id);
create index if not exists cp_member_department_idx on public.cp_memberships(department_id);
create index if not exists cp_products_org_idx on public.cp_products(organization_id);
create index if not exists cp_warehouse_company_idx on public.cp_warehouses(company_id);
create index if not exists cp_stock_company_idx on public.cp_stock(company_id);
create index if not exists cp_stock_product_idx on public.cp_stock(product_id);
create index if not exists cp_request_company_date_idx on public.cp_requests(company_id,created_at desc);
create index if not exists cp_request_department_idx on public.cp_requests(department_id);
create index if not exists cp_request_creator_idx on public.cp_requests(created_by);
create index if not exists cp_request_lines_product_idx on public.cp_request_lines(product_id);
create index if not exists cp_invoices_company_date_idx on public.cp_invoices(company_id,issued_at desc);
create index if not exists cp_invoices_supplier_idx on public.cp_invoices(supplier_id);
create index if not exists cp_invoices_actor_idx on public.cp_invoices(created_by);
create index if not exists cp_invoice_lines_invoice_idx on public.cp_invoice_lines(invoice_id);
create index if not exists cp_invoice_lines_product_idx on public.cp_invoice_lines(product_id);
create index if not exists cp_stock_events_company_date_idx on public.cp_stock_events(company_id,occurred_at desc);
create index if not exists cp_stock_events_department_idx on public.cp_stock_events(department_id);
create index if not exists cp_stock_events_actor_idx on public.cp_stock_events(actor_id);
create index if not exists cp_stock_events_product_idx on public.cp_stock_events(product_id);
create index if not exists cp_stock_events_request_idx on public.cp_stock_events(request_id);
create index if not exists cp_stock_events_invoice_idx on public.cp_stock_events(invoice_id);
create index if not exists cp_stock_events_warehouse_idx on public.cp_stock_events(warehouse_id);
create index if not exists cp_audit_org_date_idx on public.cp_audit_events(organization_id,created_at desc);
create index if not exists cp_audit_company_date_idx on public.cp_audit_events(company_id,created_at desc);
create index if not exists cp_audit_actor_idx on public.cp_audit_events(actor_id);
create index if not exists cp_quote_batches_company_idx on public.cp_quote_batches(company_id);
create index if not exists cp_quote_batches_creator_idx on public.cp_quote_batches(created_by);
create index if not exists cp_quote_lines_product_idx on public.cp_quote_lines(product_id);
create index if not exists cp_supplier_quotes_supplier_idx on public.cp_supplier_quotes(supplier_id);
create index if not exists cp_supplier_quotes_product_idx on public.cp_supplier_quotes(product_id);
create index if not exists cp_supplier_org_idx on public.cp_suppliers(organization_id);
