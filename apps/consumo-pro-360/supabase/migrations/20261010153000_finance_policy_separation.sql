-- Separation of corporate financial policy from technical GRIT administration.
create or replace function public.cp_admin_department(
 p_company uuid,p_name text,p_budget numeric default null,p_threshold numeric default 500
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_org uuid; v_corporate boolean;
begin
 if not private.cp_has_role(p_company,array['group_admin','grit_superadmin']) then
  raise exception 'Sem permissão administrativa'; end if;
 v_corporate:=private.cp_has_role(p_company,array['group_admin']);
 if length(btrim(coalesce(p_name,'')))<2 or (p_budget is not null and p_budget<0) or p_threshold is null or p_threshold<0 then
  raise exception 'Parâmetros de setor inválidos'; end if;
 if not v_corporate and (p_budget is not null or p_threshold<>0) then
  raise exception 'Definição financeira de orçamento ou alçada é exclusiva do Grupo'; end if;
 insert into public.cp_departments(company_id,name,budget_monthly,finance_threshold)
 values(p_company,btrim(p_name),p_budget,p_threshold) returning id into v_id;
 select organization_id into v_org from public.cp_companies where id=p_company;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,p_company,auth.uid(),'department',v_id,'created',
 jsonb_build_object('finance_threshold',p_threshold,'budget',p_budget,'corporate_approver',v_corporate));
 return v_id;
end $$;
-- Intentionally keep the AUTHENTICATED EXECUTE grant; function verifies group/GRIT scope and financial separation.
