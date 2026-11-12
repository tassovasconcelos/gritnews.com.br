-- Proconsumo: two operations, accountable releases, formal procurement, ERP read model.
-- Does not post invoices to stock or write back to Procfit.
alter table public.cp_companies
 add column operation_key text check(operation_key in ('distributor','retail')),
 add column requisition_approver_name text,
 add column requisition_approver_user_id uuid references auth.users(id),
 add column savings_target_percent numeric(6,2) check(savings_target_percent between 0 and 100);
create unique index cp_companies_operation_key_idx on public.cp_companies(organization_id,operation_key) where operation_key is not null;
create index cp_companies_approver_idx on public.cp_companies(requisition_approver_user_id);
alter table public.cp_departments add column external_code text;
create unique index cp_departments_external_idx on public.cp_departments(company_id,external_code) where external_code is not null;
alter table public.cp_products add column procfit_code text;
create unique index cp_products_procfit_idx on public.cp_products(organization_id,procfit_code) where procfit_code is not null;
alter table public.cp_suppliers add column procfit_code text;
create unique index cp_suppliers_procfit_idx on public.cp_suppliers(organization_id,procfit_code) where procfit_code is not null;
alter table public.cp_requests add column released_by uuid references auth.users(id), add column released_at timestamptz;
create index cp_requests_released_by_idx on public.cp_requests(released_by);

-- Reuse the current company/sector IDs; never recreate business history.
update public.cp_companies set name='Distribuidora Prohospital',operation_key='distributor',requisition_approver_name='Rainara'
 where name='Prohospital' and operation_key is null;
insert into public.cp_companies(organization_id,name,operation_key,requisition_approver_name)
 select organization_id,'Shopping Prohospital','retail','Holanda' from public.cp_companies where operation_key='distributor'
 on conflict(organization_id,operation_key) where operation_key is not null do nothing;

create function public.cp_configure_operation(p_company uuid,p_approver uuid,p_target numeric) returns void
language plpgsql security definer set search_path='' as $$
declare c public.cp_companies%rowtype;
begin
 select * into c from public.cp_companies where id=p_company for update;
 if not private.cp_has_role(p_company,array['group_admin']) then raise exception 'Somente a administração do Grupo pode vincular o responsável'; end if;
 if p_target is not null and (p_target<0 or p_target>100) then raise exception 'Meta deve estar entre 0 e 100'; end if;
 if p_approver is not null and not exists(select 1 from public.cp_memberships m
  where m.organization_id=c.organization_id and m.user_id=p_approver and m.active
   and (m.company_id is null or m.company_id=c.id) and m.department_id is null
   and m.role in ('manager','director','group_admin')) then
  raise exception 'Responsável precisa de uma conta ativa com alçada para todos os destinos desta operação';
 end if;
 update public.cp_companies set requisition_approver_user_id=p_approver,savings_target_percent=p_target where id=p_company;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(c.organization_id,c.id,auth.uid(),'operation',c.id,'approver_configured',jsonb_build_object('approver',p_approver,'savings_target_percent',p_target));
end $$;
revoke all on function public.cp_configure_operation(uuid,uuid,numeric) from public,anon;
grant execute on function public.cp_configure_operation(uuid,uuid,numeric) to authenticated;

create function private.cp_require_operation_release() returns trigger language plpgsql security definer set search_path='' as $$
declare c public.cp_companies%rowtype;
begin
 if old.status='submitted' and new.status in ('approved','pending_finance','rejected') then
  select * into c from public.cp_companies where id=new.company_id;
  if c.operation_key is not null then
   if c.requisition_approver_user_id is null then raise exception 'Vincule a conta de % antes de liberar requisições',c.requisition_approver_name; end if;
   if auth.uid() is distinct from c.requisition_approver_user_id then raise exception 'Liberação exclusiva do responsável desta operação: %',c.requisition_approver_name; end if;
   if auth.uid()=old.created_by then raise exception 'Autoaprovação proibida'; end if;
   new.released_by:=auth.uid();new.released_at:=now();
  end if;
 end if;
 return new;
end $$;
revoke all on function private.cp_require_operation_release() from public,anon,authenticated;
create trigger cp_operation_release before update of status on public.cp_requests for each row execute function private.cp_require_operation_release();

alter table public.cp_quote_batches add column formalized_at timestamptz,
 add column formalized_by uuid references auth.users(id),add column formalization_reason text,
 add column formalization_snapshot jsonb;
create index cp_quote_formalized_by_idx on public.cp_quote_batches(formalized_by);
create function public.cp_formalize_quote(p_batch uuid,p_reason text) returns jsonb
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
 select jsonb_build_object('batch_id',b.id,'title',b.title,'company_id',b.company_id,'formalized_by',auth.uid(),
  'formalized_at',now(),'criteria',btrim(p_reason),
  'lines',(select jsonb_agg(to_jsonb(l) order by l.product_id) from public.cp_quote_lines l where l.batch_id=b.id),
  'offers',(select jsonb_agg(to_jsonb(q) order by q.product_id,q.supplier_id) from public.cp_supplier_quotes q where q.batch_id=b.id and q.status='received')) into v_snapshot;
 update public.cp_quote_batches set status='ready',formalized_at=now(),formalized_by=auth.uid(),formalization_reason=btrim(p_reason),formalization_snapshot=v_snapshot where id=b.id;
 select organization_id into v_org from public.cp_companies where id=b.company_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,b.company_id,auth.uid(),'quote',b.id,'formalized',v_snapshot);
 return v_snapshot;
end $$;
revoke all on function public.cp_formalize_quote(uuid,text) from public,anon;
grant execute on function public.cp_formalize_quote(uuid,text) to authenticated;
create function private.cp_require_formal_quote() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.cp_quote_batches b where b.id=new.quote_batch_id and b.company_id=new.company_id and b.formalized_at is not null) then
  raise exception 'Compras deve formalizar o dossiê da cotação antes de propor o pedido'; end if;
 return new;
end $$;
revoke all on function private.cp_require_formal_quote() from public,anon,authenticated;
create trigger cp_purchase_formal_quote before insert on public.cp_purchase_orders for each row execute function private.cp_require_formal_quote();

create table public.cp_procfit_sync_runs(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.cp_companies(id),
 source_batch_id text not null,received_rows integer not null check(received_rows>=0),completed_at timestamptz not null default now()
);
create index cp_procfit_sync_company_idx on public.cp_procfit_sync_runs(company_id,completed_at desc);
alter table public.cp_procfit_sync_runs enable row level security;
create policy cp_procfit_sync_read on public.cp_procfit_sync_runs for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','director','controller','finance','buyer','grit_superadmin']));
grant select on public.cp_procfit_sync_runs to authenticated;

create table public.cp_procfit_lines(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.cp_companies(id),
 source_id text not null,line_id text not null,kind text not null check(kind in ('purchase','purchase_return','consumption','consumption_return')),
 occurred_on date not null,source_updated_at timestamptz not null,status text not null check(status in ('posted','cancelled')),
 cost_center_code text,cost_center_name text,department_id uuid references public.cp_departments(id),
 product_id uuid not null references public.cp_products(id),supplier_id uuid references public.cp_suppliers(id),
 document_number text,access_key text,quantity_base numeric(18,4) not null check(quantity_base>0),
 unit_cost_landed numeric(18,6) not null check(unit_cost_landed>=0),total_landed numeric(18,2) not null check(total_landed>=0),
 synchronized_at timestamptz not null default now(),unique(company_id,kind,source_id,line_id),
 check(abs(total_landed-round(quantity_base*unit_cost_landed,2))<=0.02)
);
create index cp_procfit_lines_period_idx on public.cp_procfit_lines(company_id,occurred_on,kind);
create index cp_procfit_lines_product_idx on public.cp_procfit_lines(product_id);
create index cp_procfit_lines_supplier_idx on public.cp_procfit_lines(supplier_id);
create index cp_procfit_lines_department_idx on public.cp_procfit_lines(department_id);
alter table public.cp_procfit_lines enable row level security;
create policy cp_procfit_lines_read on public.cp_procfit_lines for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','director','controller','finance','buyer','grit_superadmin']));
grant select on public.cp_procfit_lines to authenticated;

-- Endpoint exclusively for the server bridge. No browser can import ERP facts.
create function public.cp_ingest_procfit_batch(p_operation text,p_batch_id text,p_rows jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.cp_companies%rowtype;r jsonb;v_product uuid;v_supplier uuid;v_department uuid;v_count integer:=0;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Integração exclusiva do servidor'; end if;
 if p_operation not in ('distributor','retail') or length(coalesce(p_batch_id,''))<1 or jsonb_typeof(p_rows) is distinct from 'array'
  or jsonb_array_length(p_rows)>500 then raise exception 'Lote inválido'; end if;
 -- Organization is supplied by deployment configuration, not by ERP row input.
 select * into c from public.cp_companies where operation_key=p_operation and active;
 if c.id is null or (select count(*) from public.cp_companies where operation_key=p_operation and active)<>1 then
  raise exception 'Mapeamento único da operação não configurado'; end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  if nullif(btrim(r->>'source_id'),'') is null or nullif(btrim(r->>'line_id'),'') is null
   or nullif(btrim(r->>'product_code'),'') is null or nullif(btrim(r->>'product_name'),'') is null
   or nullif(btrim(r->>'base_unit'),'') is null or (r->>'currency') is distinct from 'BRL'
   or nullif(r->>'source_updated_at','') is null or nullif(r->>'occurred_on','') is null
   or nullif(r->>'quantity_base','') is null or nullif(r->>'unit_cost_landed','') is null or nullif(r->>'total_landed','') is null
   or (r->>'kind' in ('consumption','consumption_return') and nullif(btrim(r->>'cost_center_code'),'') is null)
   or (r->>'kind' in ('purchase','purchase_return') and (nullif(btrim(r->>'supplier_code'),'') is null or nullif(btrim(r->>'supplier_name'),'') is null)) then
   raise exception 'Linha incompleta: unidade, moeda BRL, datas, valores e origem/destino são obrigatórios'; end if;
  if exists(select 1 from public.cp_procfit_lines f where f.company_id=c.id and f.kind=r->>'kind' and f.source_id=r->>'source_id' and f.line_id=r->>'line_id' and f.source_updated_at>(r->>'source_updated_at')::timestamptz) then continue; end if;
  insert into public.cp_products(organization_id,sku,name,unit,procfit_code)
   values(c.organization_id,'PF-'||(r->>'product_code'),r->>'product_name',r->>'base_unit',r->>'product_code')
   on conflict(organization_id,procfit_code) where procfit_code is not null do update set name=excluded.name
   returning id into v_product;
  if exists(select 1 from public.cp_products where id=v_product and unit<>r->>'base_unit') then
   raise exception 'Unidade base mudou: exige revisão do cadastro antes de importar'; end if;
  v_supplier:=null;
  if nullif(btrim(r->>'supplier_code'),'') is not null then
   insert into public.cp_suppliers(organization_id,name,procfit_code,tax_id)
    values(c.organization_id,r->>'supplier_name',r->>'supplier_code',nullif(r->>'supplier_tax_id',''))
    on conflict(organization_id,procfit_code) where procfit_code is not null do update set name=excluded.name,tax_id=excluded.tax_id
    returning id into v_supplier;
  end if;
  select id into v_department from public.cp_departments where company_id=c.id and external_code=r->>'cost_center_code' and active;
  insert into public.cp_procfit_lines(company_id,source_id,line_id,kind,occurred_on,source_updated_at,status,cost_center_code,cost_center_name,
   department_id,product_id,supplier_id,document_number,access_key,quantity_base,unit_cost_landed,total_landed)
  values(c.id,r->>'source_id',r->>'line_id',r->>'kind',(r->>'occurred_on')::date,(r->>'source_updated_at')::timestamptz,
   r->>'status',nullif(r->>'cost_center_code',''),nullif(r->>'cost_center_name',''),v_department,v_product,v_supplier,
   nullif(r->>'document_number',''),nullif(r->>'access_key',''),(r->>'quantity_base')::numeric,(r->>'unit_cost_landed')::numeric,(r->>'total_landed')::numeric)
  on conflict(company_id,kind,source_id,line_id) do update set occurred_on=excluded.occurred_on,source_updated_at=excluded.source_updated_at,
   status=excluded.status,cost_center_code=excluded.cost_center_code,cost_center_name=excluded.cost_center_name,department_id=excluded.department_id,
   product_id=excluded.product_id,supplier_id=excluded.supplier_id,document_number=excluded.document_number,access_key=excluded.access_key,
   quantity_base=excluded.quantity_base,unit_cost_landed=excluded.unit_cost_landed,total_landed=excluded.total_landed,synchronized_at=now()
  where excluded.source_updated_at>=public.cp_procfit_lines.source_updated_at;
  v_count:=v_count+1;
 end loop;
 insert into public.cp_procfit_sync_runs(company_id,source_batch_id,received_rows) values(c.id,p_batch_id,v_count);
 return jsonb_build_object('received',v_count,'company_id',c.id);
end $$;
revoke all on function public.cp_ingest_procfit_batch(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.cp_ingest_procfit_batch(text,text,jsonb) to service_role;

create function public.cp_procfit_dashboard(p_company uuid,p_start date,p_end date,p_center text default null) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare v_result jsonb;
begin
 if p_start is null or p_end is null or p_end<p_start or p_end-p_start>730 then raise exception 'Selecione um período válido de até dois anos'; end if;
 if not private.cp_has_role(p_company,array['group_admin','director','controller','finance','buyer','grit_superadmin']) then raise exception 'Sem permissão para analisar esta operação'; end if;
 with facts as (
  select f.*,p.name product_name,p.unit,p.sku,s.name supplier_name,
   case when f.kind in ('consumption_return','purchase_return') then -1 else 1 end sign
  from public.cp_procfit_lines f join public.cp_products p on p.id=f.product_id left join public.cp_suppliers s on s.id=f.supplier_id
  where f.company_id=p_company and f.status='posted' and f.occurred_on between p_start and p_end
   and (p_center is null or f.cost_center_code=p_center)
 ),product_totals as (
  select product_id,product_name,unit,sum(sign*quantity_base) quantity,sum(sign*total_landed) total from facts
  where kind in ('consumption','consumption_return') group by product_id,product_name,unit
 ),abc as (
  select *,coalesce(sum(greatest(total,0)) over(order by total desc,product_id rows between unbounded preceding and 1 preceding),0) prior_total,
   sum(greatest(total,0)) over() overall from product_totals
 ),centers as (
  select coalesce(cost_center_code,'__unallocated__') code,max(coalesce(cost_center_name,cost_center_code,'Não identificado')) name,
   sum(sign*total_landed) total from facts where kind in ('consumption','consumption_return') group by cost_center_code
 ),months as (
  select to_char(occurred_on,'YYYY-MM') period_month,
   sum(sign*total_landed) filter(where kind in ('consumption','consumption_return')) consumed,
   sum(sign*total_landed) filter(where kind in ('purchase','purchase_return')) purchased from facts group by to_char(occurred_on,'YYYY-MM')
 ),purchases as (
  select f.*, (select sum(prev.total_landed)/nullif(sum(prev.quantity_base),0) from public.cp_procfit_lines prev where prev.company_id=f.company_id
   and prev.product_id=f.product_id and prev.kind='purchase' and prev.status='posted'
   and prev.occurred_on=(select max(prior.occurred_on) from public.cp_procfit_lines prior where prior.company_id=f.company_id
    and prior.product_id=f.product_id and prior.kind='purchase' and prior.status='posted' and prior.occurred_on<f.occurred_on)) previous_price
  from facts f where kind='purchase'
 )
 select jsonb_build_object(
  'consumed',coalesce((select sum(sign*total_landed) from facts where kind in ('consumption','consumption_return')),0),
  'purchased',coalesce((select sum(sign*total_landed) from facts where kind in ('purchase','purchase_return')),0),
  'lines',(select count(*) from facts),'unmapped',(select count(*) from facts where kind in ('consumption','consumption_return') and department_id is null),
  'last_sync',(select max(completed_at) from public.cp_procfit_sync_runs where company_id=p_company),
  'baseline_total',(select sum(previous_price*quantity_base) from purchases where previous_price>0),
  'comparable_total',(select sum(total_landed) from purchases where previous_price>0),
  'available_centers',coalesce((select jsonb_agg(to_jsonb(q) order by name) from (select distinct cost_center_code code,coalesce(cost_center_name,cost_center_code) name from public.cp_procfit_lines where company_id=p_company and occurred_on between p_start and p_end and cost_center_code is not null and status='posted') q),'[]'::jsonb),
  'target',(select savings_target_percent from public.cp_companies where id=p_company),
  'products',coalesce((select jsonb_agg(jsonb_build_object('id',product_id,'name',product_name,'unit',unit,'quantity',quantity,'total',total,
   'share',case when overall>0 then round(greatest(total,0)/overall*100,2) else 0 end,
   'class',case when overall<=0 then '—' when prior_total/overall<0.8 then 'A' when prior_total/overall<0.95 then 'B' else 'C' end) order by total desc,product_id) from abc),'[]'::jsonb),
  'centers',coalesce((select jsonb_agg(to_jsonb(centers) order by total desc,code) from centers),'[]'::jsonb),
  'months',coalesce((select jsonb_agg(to_jsonb(months) order by period_month) from months),'[]'::jsonb),
  'purchases',coalesce((select jsonb_agg(to_jsonb(q) order by occurred_on desc,source_id desc,line_id desc) from
   (select source_id,line_id,document_number,access_key,occurred_on,product_name,unit,supplier_name,quantity_base,unit_cost_landed,total_landed,previous_price,
    case when previous_price>0 then round((unit_cost_landed/previous_price-1)*100,2) else null end variation_percent
    from purchases order by occurred_on desc,source_id desc,line_id desc limit 100) q),'[]'::jsonb),
  'details',coalesce((select jsonb_agg(to_jsonb(q) order by occurred_on desc,source_id,line_id) from
   (select occurred_on,source_id,line_id,product_name,unit,cost_center_code,cost_center_name,sign*quantity_base quantity,sign*total_landed total,kind
    from facts where kind in ('consumption','consumption_return') order by occurred_on desc,source_id,line_id limit 250) q),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;
revoke all on function public.cp_procfit_dashboard(uuid,date,date,text) from public,anon;
grant execute on function public.cp_procfit_dashboard(uuid,date,date,text) to authenticated;

create function public.cp_map_cost_center(p_department uuid,p_code text) returns void
language plpgsql security definer set search_path='' as $$
declare d public.cp_departments%rowtype;v_org uuid;
begin
 select * into d from public.cp_departments where id=p_department for update;
 if not private.cp_has_role(d.company_id,array['group_admin','grit_superadmin']) then raise exception 'Sem permissão para mapear o destino'; end if;
 update public.cp_departments set external_code=nullif(btrim(p_code),'') where id=d.id;
 select organization_id into v_org from public.cp_companies where id=d.company_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,d.company_id,auth.uid(),'department',d.id,'procfit_mapping',jsonb_build_object('external_code',nullif(btrim(p_code),'')));
 update public.cp_procfit_lines set department_id=d.id where company_id=d.company_id and cost_center_code=nullif(btrim(p_code),'');
 update public.cp_procfit_lines set department_id=null where department_id=d.id and cost_center_code is distinct from nullif(btrim(p_code),'');
end $$;
revoke all on function public.cp_map_cost_center(uuid,text) from public,anon;
grant execute on function public.cp_map_cost_center(uuid,text) to authenticated;
