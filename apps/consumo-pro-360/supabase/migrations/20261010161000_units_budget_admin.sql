-- Corporate unit directory and controlled departmental budget edit.
create table if not exists public.cp_units (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.cp_companies(id),
 name text not null,
 unit_code text,
 city text,
 state text,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(company_id,name)
);
create index if not exists cp_units_company_idx on public.cp_units(company_id);
alter table public.cp_units enable row level security;
create policy cp_units_read on public.cp_units for select to authenticated using(private.cp_company_access(company_id));
grant select on public.cp_units to authenticated;

create or replace function public.cp_admin_unit(p_company uuid,p_name text,p_code text default null,p_city text default null,p_state text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_org uuid;
begin
 if not private.cp_has_role(p_company,array['group_admin','grit_superadmin']) then raise exception 'Sem permissão para administrar unidades'; end if;
 if length(btrim(coalesce(p_name,'')))<2 then raise exception 'Nome de unidade inválido'; end if;
 if p_state is not null and (length(p_state)<>2 or p_state!~'^[A-Za-z]{2}$') then raise exception 'UF inválida'; end if;
 insert into public.cp_units(company_id,name,unit_code,city,state)
 values(p_company,btrim(p_name),nullif(btrim(p_code),''),nullif(btrim(p_city),''),
  upper(nullif(btrim(p_state),''))) returning id into v_id;
 select organization_id into v_org from public.cp_companies where id=p_company;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,p_company,auth.uid(),'unit',v_id,'created',jsonb_build_object('name',p_name,'city',p_city,'state',p_state));
 return v_id;
end $$;
revoke all on function public.cp_admin_unit(uuid,text,text,text,text) from public,anon;
grant execute on function public.cp_admin_unit(uuid,text,text,text,text) to authenticated;

create or replace function public.cp_update_department_budget(p_department uuid,p_budget numeric,p_threshold numeric)
returns text language plpgsql security definer set search_path='' as $$
declare v_company uuid; v_org uuid; v_prior jsonb;
begin
 select company_id, to_jsonb(d) into v_company,v_prior from public.cp_departments d where id=p_department for update;
 if v_company is null or not private.cp_has_role(v_company,array['group_admin','finance']) then
  raise exception 'Somente o financeiro e o administrador do Grupo podem atualizar o orçamento'; end if;
 if p_budget is not null and p_budget<0 or p_threshold is null or p_threshold<0 then raise exception 'Orçamento/alçada inválidos'; end if;
 update public.cp_departments set budget_monthly=p_budget,finance_threshold=p_threshold where id=p_department;
 select organization_id into v_org from public.cp_companies where id=v_company;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,v_company,auth.uid(),'department',p_department,'budget_updated',
 jsonb_build_object('before',jsonb_build_object('monthly',v_prior->'budget_monthly','threshold',v_prior->'finance_threshold'),
 'after',jsonb_build_object('monthly',p_budget,'threshold',p_threshold)));
 return 'updated';
end $$;
revoke all on function public.cp_update_department_budget(uuid,numeric,numeric) from public,anon;
grant execute on function public.cp_update_department_budget(uuid,numeric,numeric) to authenticated;
