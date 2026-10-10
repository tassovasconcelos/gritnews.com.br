-- Extensões do fluxo de NF e governança. Aplicar após 20261010090000.
create or replace function public.cp_map_invoice_line(p_line uuid,p_product uuid,p_conversion numeric)
returns text language plpgsql security definer set search_path='' as $$
declare v_line public.cp_invoice_lines%rowtype; v_invoice public.cp_invoices%rowtype; v_org uuid;
begin
 select * into v_line from public.cp_invoice_lines where id=p_line for update;
 select * into v_invoice from public.cp_invoices where id=v_line.invoice_id for update;
 if v_invoice.id is null or v_invoice.status<>'review' then raise exception 'Nota não editável'; end if;
 if not private.cp_has_role(v_invoice.company_id,array['warehouse','buyer','group_admin']) then raise exception 'Sem permissão'; end if;
 if p_conversion<=0 or p_conversion>100000 then raise exception 'Fator de conversão inválido'; end if;
 select organization_id into v_org from public.cp_companies where id=v_invoice.company_id;
 if not exists(select 1 from public.cp_products where id=p_product and organization_id=v_org and active) then raise exception 'Produto inválido'; end if;
 update public.cp_invoice_lines set product_id=p_product,conversion_factor=p_conversion where id=p_line;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,v_invoice.company_id,auth.uid(),'invoice_line',p_line,'mapped',
 jsonb_build_object('product_id',p_product,'conversion',p_conversion));
 return 'mapped';
end $$;
create or replace function public.cp_attach_invoice(p_invoice uuid,p_path text)
returns text language plpgsql security definer set search_path='' as $$
declare i public.cp_invoices%rowtype; v_org uuid;
begin
 select * into i from public.cp_invoices where id=p_invoice for update;
 if i.id is null or i.status<>'review' then raise exception 'Nota não editável'; end if;
 if not private.cp_has_role(i.company_id,array['warehouse','buyer','group_admin']) then raise exception 'Sem permissão'; end if;
 if p_path not like i.company_id::text||'/'||i.id::text||'/%' or length(p_path)>400 then
  raise exception 'Caminho de anexo inválido'; end if;
 if not exists(select 1 from storage.objects where bucket_id='consumo-pro-fiscal' and name=p_path) then raise exception 'Anexo não localizado'; end if;
 update public.cp_invoices set document_path=p_path where id=p_invoice;
 select organization_id into v_org from public.cp_companies where id=i.company_id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,i.company_id,auth.uid(),'invoice',i.id,'document_attached',jsonb_build_object('path',p_path));
 return 'attached';
end $$;
create or replace function public.cp_admin_company(p_org uuid,p_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not private.cp_has_org_role(p_org,array['group_admin']) then raise exception 'Sem permissão de administração'; end if;
 if length(trim(coalesce(p_name,'')))<2 then raise exception 'Nome inválido'; end if;
 insert into public.cp_companies(organization_id,name) values(p_org,trim(p_name)) returning id into v_id;
 insert into public.cp_audit_events(organization_id,actor_id,entity,entity_id,action)
 values(p_org,auth.uid(),'company',v_id,'created');
 return v_id;
end $$;
create or replace function public.cp_admin_department(p_company uuid,p_name text,p_budget numeric default null,p_threshold numeric default 500)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_org uuid;
begin
 if not private.cp_has_role(p_company,array['group_admin']) then raise exception 'Sem permissão de administração'; end if;
 if length(trim(coalesce(p_name,'')))<2 or (p_budget is not null and p_budget<0)
  or p_threshold<0 then raise exception 'Parâmetros inválidos'; end if;
 insert into public.cp_departments(company_id,name,budget_monthly,finance_threshold)
 values(p_company,trim(p_name),p_budget,p_threshold) returning id into v_id;
 select organization_id into v_org from public.cp_companies where id=p_company;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action)
 values(v_org,p_company,auth.uid(),'department',v_id,'created');
 return v_id;
end $$;
create or replace function public.cp_approve_request(p_request uuid,p_approve boolean,p_reason text default null)
returns text language plpgsql security definer set search_path='' as $$
declare r public.cp_requests%rowtype; v_org uuid; v_total numeric; v_threshold numeric; v_state text;
 v_budget numeric; v_spent numeric; v_unknown integer;
begin
 select * into r from public.cp_requests where id=p_request for update;
 if r.id is null or r.status<>'submitted' then raise exception 'Solicitação indisponível para aprovação'; end if;
 if r.created_by=auth.uid() then raise exception 'Autoaprovação proibida'; end if;
 if not (
  private.cp_has_role(r.company_id,array['group_admin','director']) or
  (private.cp_has_role(r.company_id,array['manager']) and exists(
   select 1 from public.cp_memberships m join public.cp_companies c on c.organization_id=m.organization_id
   where c.id=r.company_id and m.user_id=auth.uid() and m.active and m.role='manager'
    and (m.company_id is null or m.company_id=r.company_id)
    and (m.department_id is null or m.department_id=r.department_id)
  ))
 ) then raise exception 'Gestor sem alçada para este setor'; end if;
 select c.organization_id,d.finance_threshold,d.budget_monthly into v_org,v_threshold,v_budget
 from public.cp_companies c join public.cp_departments d on d.company_id=c.id
 where c.id=r.company_id and d.id=r.department_id;
 if not p_approve and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Motivo obrigatório'; end if;
 select coalesce(sum(rl.quantity*coalesce(pc.avg_cost,0)),0),
 count(*) filter (where pc.avg_cost is null or pc.avg_cost<=0) into v_total,v_unknown
 from public.cp_request_lines rl left join public.cp_product_costs pc
 on pc.company_id=r.company_id and pc.product_id=rl.product_id where rl.request_id=r.id;
 select coalesce(sum(abs(e.quantity_change)*e.unit_cost),0) into v_spent
 from public.cp_stock_events e where e.company_id=r.company_id and e.department_id=r.department_id
 and e.event_type='delivery' and (e.occurred_at at time zone 'America/Fortaleza')::date >=
 date_trunc('month',now() at time zone 'America/Fortaleza')::date;
 v_state:=case when not p_approve then 'rejected'
 when v_unknown>0 or v_total>=v_threshold
 or (v_budget is not null and v_spent+v_total>v_budget) then 'pending_finance'
 else 'approved' end;
 update public.cp_requests set status=v_state,reason=p_reason,updated_at=now() where id=r.id;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,r.company_id,auth.uid(),'request',r.id,'manager_decision',
 jsonb_build_object('approved',p_approve,'reason',p_reason,'estimated_cost',v_total,'state',v_state));
 return v_state;
end $$;
revoke execute on function public.cp_map_invoice_line(uuid,uuid,numeric) from public,anon;
revoke execute on function public.cp_attach_invoice(uuid,text) from public,anon;
revoke execute on function public.cp_admin_company(uuid,text) from public,anon;
revoke execute on function public.cp_admin_department(uuid,text,numeric,numeric) from public,anon;
grant execute on function public.cp_map_invoice_line(uuid,uuid,numeric) to authenticated;
grant execute on function public.cp_attach_invoice(uuid,text) to authenticated;
grant execute on function public.cp_admin_company(uuid,text) to authenticated;
grant execute on function public.cp_admin_department(uuid,text,numeric,numeric) to authenticated;
