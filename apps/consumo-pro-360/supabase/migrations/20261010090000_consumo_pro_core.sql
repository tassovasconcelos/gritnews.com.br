-- CONSUMO PRO 360 | GRIT Soluções e Negócios
-- Instalar SOMENTE em projeto Supabase NOVO e dedicado. Não executar nos projetos GRIT existentes.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.cp_organizations (
 id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now()
);
create table public.cp_companies (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.cp_organizations(id),
 name text not null, tax_id text, active boolean not null default true,
 unique(id,organization_id)
);
create table public.cp_departments (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.cp_companies(id),
 name text not null, budget_monthly numeric(14,2), finance_threshold numeric(14,2) not null default 500,
 active boolean not null default true, unique(company_id,name)
);
create table public.cp_memberships (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.cp_organizations(id),
 user_id uuid not null references auth.users(id), company_id uuid references public.cp_companies(id),
 department_id uuid references public.cp_departments(id),
 role text not null check(role in ('grit_superadmin','group_admin','director','controller','finance','buyer','warehouse','manager','requester')),
 active boolean not null default true, created_at timestamptz not null default now(),
 unique(user_id,organization_id,company_id,department_id,role)
);
create table public.cp_products (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.cp_organizations(id),
 sku text not null, name text not null, category text not null default 'Outros',
 brand text, unit text not null default 'UN', package_factor numeric(14,4) not null default 1 check(package_factor>0),
 min_stock numeric(14,3) not null default 0 check(min_stock>=0),
 active boolean not null default true, created_at timestamptz not null default now(),
 unique(organization_id,sku)
);
create table public.cp_warehouses (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.cp_companies(id),
 name text not null, active boolean not null default true, unique(company_id,name)
);
create table public.cp_stock (
 company_id uuid not null references public.cp_companies(id),
 warehouse_id uuid not null references public.cp_warehouses(id),
 product_id uuid not null references public.cp_products(id),
 physical numeric(14,3) not null default 0 check(physical>=0),
 reserved numeric(14,3) not null default 0 check(reserved>=0 and reserved<=physical),
 updated_at timestamptz not null default now(),
 primary key(warehouse_id,product_id)
);
create table public.cp_product_costs (
 company_id uuid not null references public.cp_companies(id),
 product_id uuid not null references public.cp_products(id),
 avg_cost numeric(14,4) not null default 0 check(avg_cost>=0),
 updated_at timestamptz not null default now(),
 primary key(company_id,product_id)
);
create table public.cp_request_counters (
 company_id uuid not null references public.cp_companies(id), year int not null, last_number int not null,
 primary key(company_id,year)
);
create table public.cp_requests (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.cp_companies(id),
 department_id uuid not null references public.cp_departments(id),
 code text not null, created_by uuid not null references auth.users(id),
 status text not null default 'submitted' check(status in ('submitted','pending_finance','approved','reserved','delivered','rejected')),
 reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 delivered_at timestamptz, receiver text, unique(company_id,code)
);
create table public.cp_request_lines (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.cp_requests(id),
 product_id uuid not null references public.cp_products(id), quantity numeric(14,3) not null check(quantity>0),
 unique(request_id,product_id)
);
create table public.cp_suppliers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.cp_organizations(id),
 name text not null, tax_id text, email text, phone text, categories text[], active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.cp_invoices (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.cp_companies(id),
 supplier_id uuid references public.cp_suppliers(id), supplier_name text not null,
 supplier_tax_id text, access_key text, number text, series text, issued_at timestamptz,
 source_format text not null check(source_format in ('xml','pdf','image','manual')),
 document_path text, status text not null default 'review' check(status in ('review','booked')),
 received_at timestamptz, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 check(access_key is null or access_key ~ '^[0-9]{44}$')
);
create unique index cp_invoice_access_unique on public.cp_invoices(company_id,access_key) where access_key is not null;
create unique index cp_invoice_fallback_unique on public.cp_invoices(company_id,supplier_tax_id,series,number)
 where access_key is null and supplier_tax_id is not null and number is not null;
create table public.cp_invoice_lines (
 id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.cp_invoices(id),
 product_id uuid references public.cp_products(id), external_code text, description text not null,
 brand text, unit text not null default 'UN', quantity numeric(14,3) not null check(quantity>0),
 unit_price numeric(14,4) not null check(unit_price>=0),
 conversion_factor numeric(14,4) not null default 1 check(conversion_factor>0),
 line_total numeric(14,2) generated always as (round(quantity*unit_price,2)) stored
);
create table public.cp_stock_events (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.cp_companies(id),
 warehouse_id uuid not null references public.cp_warehouses(id),
 product_id uuid not null references public.cp_products(id),
 department_id uuid references public.cp_departments(id),
 request_id uuid references public.cp_requests(id), invoice_id uuid references public.cp_invoices(id),
 event_type text not null check(event_type in ('opening','receipt','delivery','adjustment')),
 quantity_change numeric(14,3) not null check(quantity_change<>0),
 unit_cost numeric(14,4) not null default 0,
 actor_id uuid not null references auth.users(id), reason text,
 occurred_at timestamptz not null default now()
);
create table public.cp_audit_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.cp_organizations(id),
 company_id uuid references public.cp_companies(id),
 actor_id uuid not null references auth.users(id), entity text not null, entity_id uuid not null,
 action text not null, detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table public.cp_quote_batches (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.cp_companies(id),
 title text not null, status text not null default 'draft' check(status in ('draft','ready','closed')),
 deadline date, created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.cp_quote_lines (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.cp_quote_batches(id),
 product_id uuid not null references public.cp_products(id), quantity numeric(14,3) not null check(quantity>0),
 unique(batch_id,product_id)
);
create table public.cp_supplier_quotes (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.cp_quote_batches(id),
 supplier_id uuid not null references public.cp_suppliers(id),
 product_id uuid not null references public.cp_products(id), quantity numeric(14,3) not null check(quantity>0),
 unit_price numeric(14,4) not null check(unit_price>=0),
 freight numeric(14,2) not null default 0 check(freight>=0),
 extra_tax numeric(14,2) not null default 0 check(extra_tax>=0),
 delivery_days int check(delivery_days>=0),
 status text not null default 'draft' check(status in ('draft','received','disqualified')),
 created_at timestamptz not null default now(),
 unique(batch_id,supplier_id,product_id)
);

-- Direitos internos: autorização não deriva de user_metadata editável.
create or replace function private.cp_is_member(p_org uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.cp_memberships m where m.user_id=auth.uid() and m.organization_id=p_org and m.active
 );
$$;
create or replace function private.cp_company_access(p_company uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.cp_companies c join public.cp_memberships m on m.organization_id=c.organization_id
  where c.id=p_company and m.user_id=auth.uid() and m.active and (m.company_id is null or m.company_id=c.id)
 );
$$;
create or replace function private.cp_department_access(p_department uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.cp_departments d join public.cp_companies c on c.id=d.company_id
   join public.cp_memberships m on m.organization_id=c.organization_id
  where d.id=p_department and m.user_id=auth.uid() and m.active
    and (m.company_id is null or m.company_id=d.company_id)
    and (m.department_id is null or m.department_id=d.id)
 );
$$;
create or replace function private.cp_has_role(p_company uuid,p_roles text[]) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.cp_companies c join public.cp_memberships m on m.organization_id=c.organization_id
  where c.id=p_company and m.user_id=auth.uid() and m.active
   and (m.company_id is null or m.company_id=c.id)
   and m.role=any(p_roles)
 );
$$;
create or replace function private.cp_has_org_role(p_org uuid,p_roles text[]) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.cp_memberships m where m.organization_id=p_org
   and m.user_id=auth.uid() and m.active and m.role=any(p_roles)
   and m.company_id is null
 );
$$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- Todos os dados transacionais privados: deny-by-default para escrita não autorizada.
do $$
declare t text;
begin
 foreach t in array array['cp_organizations','cp_companies','cp_departments','cp_memberships',
 'cp_products','cp_warehouses','cp_stock','cp_product_costs','cp_request_counters',
 'cp_requests','cp_request_lines','cp_suppliers','cp_invoices','cp_invoice_lines',
 'cp_stock_events','cp_audit_events','cp_quote_batches','cp_quote_lines','cp_supplier_quotes']
 loop execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;

create policy cp_org_read on public.cp_organizations for select to authenticated using (private.cp_is_member(id));
create policy cp_company_read on public.cp_companies for select to authenticated using (private.cp_company_access(id));
create policy cp_dept_read on public.cp_departments for select to authenticated using (private.cp_department_access(id));
create policy cp_membership_read on public.cp_memberships for select to authenticated
 using (user_id=auth.uid() or private.cp_has_org_role(organization_id,array['group_admin','grit_superadmin']));
create policy cp_product_read on public.cp_products for select to authenticated using (private.cp_is_member(organization_id));
create policy cp_product_insert on public.cp_products for insert to authenticated
 with check(private.cp_has_org_role(organization_id,array['group_admin','controller']));
create policy cp_product_update on public.cp_products for update to authenticated
 using(private.cp_has_org_role(organization_id,array['group_admin','controller']))
 with check(private.cp_has_org_role(organization_id,array['group_admin','controller']));
create policy cp_warehouse_read on public.cp_warehouses for select to authenticated using(private.cp_company_access(company_id));
create policy cp_warehouse_insert on public.cp_warehouses for insert to authenticated with check(private.cp_has_role(company_id,array['group_admin','warehouse']));
create policy cp_warehouse_update on public.cp_warehouses for update to authenticated
 using(private.cp_has_role(company_id,array['group_admin','warehouse']))
 with check(private.cp_has_role(company_id,array['group_admin','warehouse']));
create policy cp_stock_read on public.cp_stock for select to authenticated using(private.cp_company_access(company_id));
create policy cp_cost_read on public.cp_product_costs for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','controller','finance','buyer']));
create policy cp_request_read on public.cp_requests for select to authenticated
 using(private.cp_department_access(department_id) or private.cp_has_role(company_id,array['group_admin','director','controller','finance','buyer','warehouse']));
create policy cp_request_line_read on public.cp_request_lines for select to authenticated
 using(exists(select 1 from public.cp_requests r where r.id=request_id
 and (private.cp_department_access(r.department_id) or private.cp_has_role(r.company_id,array['group_admin','director','controller','finance','buyer','warehouse']))));
create policy cp_supplier_read on public.cp_suppliers for select to authenticated
 using(private.cp_has_org_role(organization_id,array['group_admin','director','controller','finance','buyer','grit_superadmin'])
 or exists(select 1 from public.cp_companies c where c.organization_id=cp_suppliers.organization_id
 and private.cp_has_role(c.id,array['buyer','finance','controller'])));
create policy cp_supplier_insert on public.cp_suppliers for insert to authenticated
 with check(private.cp_has_org_role(organization_id,array['group_admin','buyer']));
create policy cp_supplier_update on public.cp_suppliers for update to authenticated
 using(private.cp_has_org_role(organization_id,array['group_admin','buyer']))
 with check(private.cp_has_org_role(organization_id,array['group_admin','buyer']));
create policy cp_invoice_read on public.cp_invoices for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','controller','finance','buyer','warehouse','director']));
create policy cp_invoice_line_read on public.cp_invoice_lines for select to authenticated
 using(exists(select 1 from public.cp_invoices i where i.id=invoice_id and
 private.cp_has_role(i.company_id,array['group_admin','controller','finance','buyer','warehouse','director'])));
create policy cp_event_read on public.cp_stock_events for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','controller','finance','buyer','warehouse','director']));
create policy cp_audit_read on public.cp_audit_events for select to authenticated
 using(private.cp_has_org_role(organization_id,array['group_admin','controller','director','grit_superadmin']));
create policy cp_quote_read on public.cp_quote_batches for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','director','controller','finance','buyer']));
create policy cp_quote_insert on public.cp_quote_batches for insert to authenticated
 with check(private.cp_has_role(company_id,array['group_admin','buyer']) and created_by=auth.uid());
create policy cp_quote_line_read on public.cp_quote_lines for select to authenticated
 using(exists(select 1 from public.cp_quote_batches b where b.id=batch_id
 and private.cp_has_role(b.company_id,array['group_admin','director','controller','finance','buyer'])));
create policy cp_supplier_quotes_read on public.cp_supplier_quotes for select to authenticated
 using(exists(select 1 from public.cp_quote_batches b where b.id=batch_id
 and private.cp_has_role(b.company_id,array['group_admin','director','controller','finance','buyer'])));
-- Memberships and company/department creation are privileged provisioning operations handled in secure admin environment.

-- Endpoints de negócio atômicos, com autenticação, autorização e idempotência.
create or replace function public.cp_submit_request(p_company uuid,p_department uuid,p_items jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_req uuid; v_org uuid; v_y integer; v_num integer; v_item jsonb; v_product uuid; v_qty numeric;
begin
 if auth.uid() is null or not private.cp_department_access(p_department) then raise exception 'Acesso ao setor negado'; end if;
 select organization_id into v_org from public.cp_companies where id=p_company and active;
 if v_org is null or not exists(select 1 from public.cp_departments where id=p_department and company_id=p_company and active) then
   raise exception 'Empresa ou setor inválidos';
 end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>50 then
   raise exception 'Pedido deve conter entre 1 e 50 itens'; end if;
 v_y:=extract(year from (now() at time zone 'America/Fortaleza'))::int;
 insert into public.cp_request_counters(company_id,year,last_number) values (p_company,v_y,1)
 on conflict(company_id,year) do update set last_number=public.cp_request_counters.last_number+1
 returning last_number into v_num;
 insert into public.cp_requests(company_id,department_id,code,created_by)
 values(p_company,p_department,'CP-'||v_y||'-'||lpad(v_num::text,5,'0'),auth.uid()) returning id into v_req;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_product:=(v_item->>'product_id')::uuid; v_qty:=(v_item->>'quantity')::numeric;
  if v_qty<=0 or v_qty>100000 or not exists(select 1 from public.cp_products where id=v_product and organization_id=v_org and active) then
    raise exception 'Produto ou quantidade inválidos';
  end if;
  insert into public.cp_request_lines(request_id,product_id,quantity) values(v_req,v_product,v_qty);
 end loop;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action)
 values(v_org,p_company,auth.uid(),'request',v_req,'submitted');
 return v_req;
end $$;

create or replace function public.cp_approve_request(p_request uuid,p_approve boolean,p_reason text default null)
returns text language plpgsql security definer set search_path='' as $$
declare r public.cp_requests%rowtype; v_org uuid; v_total numeric; v_threshold numeric; v_state text;
begin
 select * into r from public.cp_requests where id=p_request for update;
 if r.id is null or r.status<>'submitted' then raise exception 'Solicitação indisponível para aprovação'; end if;
 if r.created_by=auth.uid() then raise exception 'Autoaprovação proibida'; end if;
 if not private.cp_has_role(r.company_id,array['manager','group_admin','director']) then raise exception 'Sem alçada gerencial'; end if;
 select c.organization_id,d.finance_threshold into v_org,v_threshold from public.cp_companies c
 join public.cp_departments d on d.company_id=c.id where c.id=r.company_id and d.id=r.department_id;
 if not p_approve and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Motivo de rejeição obrigatório'; end if;
 select coalesce(sum(rl.quantity*coalesce(pc.avg_cost,0)),0) into v_total from public.cp_request_lines rl
 left join public.cp_product_costs pc on pc.company_id=r.company_id and pc.product_id=rl.product_id where rl.request_id=r.id;
 v_state:=case when not p_approve then 'rejected' when v_total >= v_threshold then 'pending_finance' else 'approved' end;
 update public.cp_requests set status=v_state,reason=p_reason,updated_at=now() where id=r.id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,r.company_id,auth.uid(),'request',r.id,'manager_decision',
 jsonb_build_object('approved',p_approve,'reason',p_reason,'estimated_cost',v_total,'status',v_state));
 return v_state;
end $$;

create or replace function public.cp_finance_decision(p_request uuid,p_approve boolean,p_reason text default null)
returns text language plpgsql security definer set search_path='' as $$
declare r public.cp_requests%rowtype; v_org uuid; v_state text;
begin
 select * into r from public.cp_requests where id=p_request for update;
 if r.id is null or r.status<>'pending_finance' then raise exception 'Solicitação não aguarda financeiro'; end if;
 if r.created_by=auth.uid() or not private.cp_has_role(r.company_id,array['finance','group_admin','director']) then raise exception 'Alçada financeira não autorizada'; end if;
 if not p_approve and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Motivo de rejeição obrigatório'; end if;
 v_state:=case when p_approve then 'approved' else 'rejected' end;
 select organization_id into v_org from public.cp_companies where id=r.company_id;
 update public.cp_requests set status=v_state,reason=p_reason,updated_at=now() where id=r.id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,r.company_id,auth.uid(),'request',r.id,'finance_decision',jsonb_build_object('approved',p_approve,'reason',p_reason));
 return v_state;
end $$;

create or replace function public.cp_reserve_request(p_request uuid,p_warehouse uuid)
returns text language plpgsql security definer set search_path='' as $$
declare r public.cp_requests%rowtype; l record; s public.cp_stock%rowtype; v_org uuid;
begin
 select * into r from public.cp_requests where id=p_request for update;
 if r.id is null or r.status<>'approved' then raise exception 'Pedido não aprovado'; end if;
 if not private.cp_has_role(r.company_id,array['warehouse','group_admin']) then raise exception 'Sem permissão de almoxarifado'; end if;
 if not exists(select 1 from public.cp_warehouses where id=p_warehouse and company_id=r.company_id and active) then
  raise exception 'Depósito não pertence à empresa'; end if;
 for l in select product_id,quantity from public.cp_request_lines where request_id=r.id order by product_id loop
  select * into s from public.cp_stock where warehouse_id=p_warehouse and product_id=l.product_id for update;
  if s.warehouse_id is null or s.physical-s.reserved < l.quantity then raise exception 'Estoque disponível insuficiente para %',l.product_id; end if;
  update public.cp_stock set reserved=reserved+l.quantity,updated_at=now() where warehouse_id=p_warehouse and product_id=l.product_id;
 end loop;
 update public.cp_requests set status='reserved',updated_at=now(),reason=p_warehouse::text where id=r.id;
 select organization_id into v_org from public.cp_companies where id=r.company_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,r.company_id,auth.uid(),'request',r.id,'reserved',jsonb_build_object('warehouse_id',p_warehouse));
 return 'reserved';
end $$;

create or replace function public.cp_deliver_request(p_request uuid,p_receiver text)
returns text language plpgsql security definer set search_path='' as $$
declare r public.cp_requests%rowtype; l record; v_warehouse uuid; v_org uuid; v_cost numeric;
begin
 select * into r from public.cp_requests where id=p_request for update;
 if r.id is null or r.status<>'reserved' then raise exception 'Pedido não reservado ou já entregue'; end if;
 if not private.cp_has_role(r.company_id,array['warehouse','group_admin']) then raise exception 'Sem permissão para entregar'; end if;
 if nullif(trim(coalesce(p_receiver,'')),'') is null then raise exception 'Identifique o recebedor'; end if;
 v_warehouse:=r.reason::uuid;
 select organization_id into v_org from public.cp_companies where id=r.company_id;
 for l in select product_id,quantity from public.cp_request_lines where request_id=r.id order by product_id loop
  update public.cp_stock set physical=physical-l.quantity,reserved=reserved-l.quantity,updated_at=now()
   where warehouse_id=v_warehouse and product_id=l.product_id and reserved>=l.quantity and physical>=l.quantity;
  if not found then raise exception 'Inconsistência de saldo para %',l.product_id; end if;
  select avg_cost into v_cost from public.cp_product_costs where company_id=r.company_id and product_id=l.product_id;
  insert into public.cp_stock_events(company_id,warehouse_id,product_id,department_id,request_id,event_type,quantity_change,unit_cost,actor_id)
  values(r.company_id,v_warehouse,l.product_id,r.department_id,r.id,'delivery',-l.quantity,coalesce(v_cost,0),auth.uid());
 end loop;
 update public.cp_requests set status='delivered',receiver=trim(p_receiver),delivered_at=now(),updated_at=now() where id=r.id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,r.company_id,auth.uid(),'request',r.id,'delivered',jsonb_build_object('receiver',p_receiver));
 return 'delivered';
end $$;

create or replace function public.cp_import_invoice(p_company uuid,p_supplier_name text,p_tax_id text,
 p_access_key text,p_number text,p_series text,p_issued_at timestamptz,p_format text,p_lines jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_org uuid; l jsonb;
begin
 if not private.cp_has_role(p_company,array['warehouse','buyer','group_admin']) then raise exception 'Sem permissão para receber nota'; end if;
 if p_format not in ('xml','pdf','image','manual') or nullif(trim(coalesce(p_supplier_name,'')),'') is null then raise exception 'Fornecedor ou formato inválido'; end if;
 if p_access_key is not null and p_access_key !~ '^[0-9]{44}$' then raise exception 'Chave NF inválida'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>300 then
   raise exception 'Informe de 1 a 300 itens para conferência'; end if;
 select organization_id into v_org from public.cp_companies where id=p_company;
 if p_access_key is not null and exists(select 1 from public.cp_invoices where company_id=p_company and access_key=p_access_key) then
   raise exception 'Nota já importada; consulte a nota existente'; end if;
 insert into public.cp_invoices(company_id,supplier_name,supplier_tax_id,access_key,number,series,issued_at,source_format,created_by)
 values(p_company,trim(p_supplier_name),p_tax_id,p_access_key,p_number,p_series,p_issued_at,p_format,auth.uid())
 returning id into v_id;
 for l in select value from jsonb_array_elements(p_lines) loop
  insert into public.cp_invoice_lines(invoice_id,product_id,external_code,description,brand,unit,quantity,unit_price,conversion_factor)
  values(v_id,nullif(l->>'product_id','')::uuid,l->>'external_code',l->>'description',l->>'brand',
   coalesce(nullif(l->>'unit',''),'UN'),(l->>'quantity')::numeric,(l->>'unit_price')::numeric,
   coalesce(nullif(l->>'conversion_factor','')::numeric,1));
 end loop;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action)
 values(v_org,p_company,auth.uid(),'invoice',v_id,'imported_for_review');
 return v_id;
end $$;

create or replace function public.cp_book_invoice(p_invoice uuid,p_warehouse uuid)
returns text language plpgsql security definer set search_path='' as $$
declare i public.cp_invoices%rowtype; l record; v_org uuid; v_physical numeric; v_price numeric; v_qty numeric;
begin
 select * into i from public.cp_invoices where id=p_invoice for update;
 if i.id is null or i.status<>'review' then raise exception 'Nota já recebida ou não localizada'; end if;
 if not private.cp_has_role(i.company_id,array['warehouse','group_admin']) then raise exception 'Sem permissão de recebimento'; end if;
 if not exists(select 1 from public.cp_warehouses where id=p_warehouse and company_id=i.company_id and active) then raise exception 'Depósito inválido'; end if;
 if exists(select 1 from public.cp_invoice_lines where invoice_id=i.id and product_id is null) then
   raise exception 'Associe TODOS os itens ao catálogo antes de confirmar'; end if;
 select organization_id into v_org from public.cp_companies where id=i.company_id;
 for l in select il.*,p.organization_id as product_org from public.cp_invoice_lines il
 join public.cp_products p on p.id=il.product_id where il.invoice_id=i.id order by il.product_id loop
  if l.product_org<>v_org then raise exception 'Produto pertence a outra organização'; end if;
  v_qty:=l.quantity*l.conversion_factor;
  -- Serializar custo médio por empresa/SKU, independentemente do depósito.
  insert into public.cp_product_costs(company_id,product_id,avg_cost) values(i.company_id,l.product_id,0)
   on conflict(company_id,product_id) do nothing;
  select avg_cost into v_price from public.cp_product_costs
    where company_id=i.company_id and product_id=l.product_id for update;
  select coalesce(sum(physical),0) into v_physical from public.cp_stock
    where company_id=i.company_id and product_id=l.product_id;
  insert into public.cp_stock(company_id,warehouse_id,product_id,physical)
    values(i.company_id,p_warehouse,l.product_id,0) on conflict(warehouse_id,product_id) do nothing;
  update public.cp_product_costs set avg_cost=case when v_physical+v_qty>0
   then round(((v_physical*v_price)+(v_qty*(l.unit_price/l.conversion_factor)))/(v_physical+v_qty),4) else 0 end,
   updated_at=now() where company_id=i.company_id and product_id=l.product_id;
  update public.cp_stock set physical=physical+v_qty,updated_at=now() where warehouse_id=p_warehouse and product_id=l.product_id;
  insert into public.cp_stock_events(company_id,warehouse_id,product_id,invoice_id,event_type,quantity_change,unit_cost,actor_id)
   values(i.company_id,p_warehouse,l.product_id,i.id,'receipt',v_qty,l.unit_price/l.conversion_factor,auth.uid());
 end loop;
 update public.cp_invoices set status='booked',received_at=now() where id=i.id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action)
 values(v_org,i.company_id,auth.uid(),'invoice',i.id,'booked');
 return 'booked';
end $$;

-- Primeiro saldo deve ser ato autorizado e auditável, sem edição direta de estoque.
create or replace function public.cp_open_stock(p_company uuid,p_warehouse uuid,p_product uuid,p_quantity numeric,p_unit_cost numeric,p_reason text)
returns text language plpgsql security definer set search_path='' as $$
declare v_org uuid;
begin
 if not private.cp_has_role(p_company,array['group_admin','controller']) then raise exception 'Sem alçada para inventário inicial'; end if;
 if p_quantity<=0 or p_unit_cost<0 or nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Quantidade, custo ou justificativa inválidos'; end if;
 select organization_id into v_org from public.cp_companies where id=p_company;
 if not exists(select 1 from public.cp_warehouses where id=p_warehouse and company_id=p_company)
 or not exists(select 1 from public.cp_products where id=p_product and organization_id=v_org) then raise exception 'Depósito ou SKU inválido'; end if;
 if exists(select 1 from public.cp_stock where warehouse_id=p_warehouse and product_id=p_product) then raise exception 'Saldo inicial já registrado; use processo de ajuste auditado'; end if;
 insert into public.cp_product_costs(company_id,product_id,avg_cost) values(p_company,p_product,0)
 on conflict(company_id,product_id) do nothing;
 -- Saldo inicial de outro depósito ajusta o custo ponderado consolidado da empresa.
 perform 1 from public.cp_product_costs where company_id=p_company and product_id=p_product for update;
 with prior as (select coalesce(sum(physical),0) qty from public.cp_stock where company_id=p_company and product_id=p_product)
 update public.cp_product_costs c set avg_cost=round((prior.qty*c.avg_cost+p_quantity*p_unit_cost)/(prior.qty+p_quantity),4),updated_at=now()
 from prior where c.company_id=p_company and c.product_id=p_product;
 insert into public.cp_stock(company_id,warehouse_id,product_id,physical) values(p_company,p_warehouse,p_product,p_quantity);
 insert into public.cp_stock_events(company_id,warehouse_id,product_id,event_type,quantity_change,unit_cost,actor_id,reason)
 values(p_company,p_warehouse,p_product,'opening',p_quantity,p_unit_cost,auth.uid(),p_reason);
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,p_company,auth.uid(),'stock',p_product,'opening',jsonb_build_object('quantity',p_quantity,'unit_cost',p_unit_cost,'reason',p_reason));
 return 'opening';
end $$;

-- Harden definer RPCs. No anon execution; all decisions inside transaction.
revoke execute on all functions in schema public from public,anon;
grant execute on function public.cp_submit_request(uuid,uuid,jsonb) to authenticated;
grant execute on function public.cp_approve_request(uuid,boolean,text) to authenticated;
grant execute on function public.cp_finance_decision(uuid,boolean,text) to authenticated;
grant execute on function public.cp_reserve_request(uuid,uuid) to authenticated;
grant execute on function public.cp_deliver_request(uuid,text) to authenticated;
grant execute on function public.cp_import_invoice(uuid,text,text,text,text,text,timestamptz,text,jsonb) to authenticated;
grant execute on function public.cp_book_invoice(uuid,uuid) to authenticated;
grant execute on function public.cp_open_stock(uuid,uuid,uuid,numeric,numeric,text) to authenticated;

-- Precisão de privilégios por tabela: sem mutações transacionais diretas.
grant select on public.cp_organizations,public.cp_companies,public.cp_departments,public.cp_memberships,
 public.cp_products,public.cp_warehouses,public.cp_stock,public.cp_product_costs,
 public.cp_requests,public.cp_request_lines,public.cp_suppliers,public.cp_invoices,
 public.cp_invoice_lines,public.cp_stock_events,public.cp_audit_events,
 public.cp_quote_batches,public.cp_quote_lines,public.cp_supplier_quotes to authenticated;
grant insert,update on public.cp_products,public.cp_warehouses,public.cp_suppliers to authenticated;
grant insert on public.cp_quote_batches to authenticated;
-- Suporte a anexos NF em bucket privado; path prefixado pelo UUID da empresa.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('consumo-pro-fiscal','consumo-pro-fiscal',false,10485760,array['application/xml','text/xml','application/pdf','image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
create policy cp_documents_read on storage.objects for select to authenticated
 using(bucket_id='consumo-pro-fiscal' and private.cp_has_role((split_part(name,'/',1))::uuid,
 array['warehouse','buyer','finance','controller','group_admin','director']));
create policy cp_documents_upload on storage.objects for insert to authenticated
 with check(bucket_id='consumo-pro-fiscal' and private.cp_has_role((split_part(name,'/',1))::uuid,
 array['warehouse','buyer','group_admin']));
