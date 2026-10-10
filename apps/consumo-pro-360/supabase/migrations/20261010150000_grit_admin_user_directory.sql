-- CONSUMO PRO 360 — Registry of employee accounts and GRIT superadmin identity.
-- No password or Auth record created here. First access must verify ownership of mailbox in Supabase Auth.
create table if not exists public.cp_user_directory (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.cp_organizations(id),
 email text not null check(email=lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
 full_name text,
 phone text,
 position_title text,
 company_id uuid references public.cp_companies(id),
 department_id uuid references public.cp_departments(id),
 requested_role text not null check(requested_role in
  ('grit_superadmin','group_admin','director','controller','finance','buyer','warehouse','manager','requester')),
 auth_user_id uuid references auth.users(id),
 status text not null default 'pending' check(status in ('pending','invited','active','suspended')),
 invitation_sent_at timestamptz,
 activated_at timestamptz,
 suspended_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,email),
 unique(organization_id,auth_user_id),
 constraint cp_directory_dept_company check(department_id is null or company_id is not null)
);
create index if not exists cp_directory_org_status_idx on public.cp_user_directory(organization_id,status);
create index if not exists cp_directory_company_idx on public.cp_user_directory(company_id);
create index if not exists cp_directory_department_idx on public.cp_user_directory(department_id);

alter table public.cp_user_directory enable row level security;
create policy cp_directory_admin_read on public.cp_user_directory for select to authenticated
 using(private.cp_has_org_role(organization_id,array['group_admin','grit_superadmin']));
grant select on public.cp_user_directory to authenticated;

-- Do not create an Auth identity or credentials in SQL, only pre-register the official contact.
insert into public.cp_user_directory(organization_id,email,full_name,position_title,requested_role,status)
select o.id,'gritsolucoes@gmail.com','GRIT Soluções e Negócios',
 'Governança técnica da plataforma','grit_superadmin','pending'
from public.cp_organizations o where o.name='Grupo Prohospital'
on conflict(organization_id,email) do nothing;

-- Enable GRIT tech admin to manage organizational structure/catalog,
-- while keeping financial and warehouse approval functions out of this profile.
drop policy if exists cp_product_insert on public.cp_products;
create policy cp_product_insert on public.cp_products for insert to authenticated
 with check(private.cp_has_org_role(organization_id,array['group_admin','controller','grit_superadmin']));
drop policy if exists cp_product_update on public.cp_products;
create policy cp_product_update on public.cp_products for update to authenticated
 using(private.cp_has_org_role(organization_id,array['group_admin','controller','grit_superadmin']))
 with check(private.cp_has_org_role(organization_id,array['group_admin','controller','grit_superadmin']));
drop policy if exists cp_warehouse_insert on public.cp_warehouses;
create policy cp_warehouse_insert on public.cp_warehouses for insert to authenticated
 with check(private.cp_has_role(company_id,array['group_admin','warehouse','grit_superadmin']));
drop policy if exists cp_warehouse_update on public.cp_warehouses;
create policy cp_warehouse_update on public.cp_warehouses for update to authenticated
 using(private.cp_has_role(company_id,array['group_admin','warehouse','grit_superadmin']))
 with check(private.cp_has_role(company_id,array['group_admin','warehouse','grit_superadmin']));

create or replace function public.cp_admin_company(p_org uuid,p_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not private.cp_has_org_role(p_org,array['group_admin','grit_superadmin']) then raise exception 'Sem permissão de administração'; end if;
 if length(btrim(coalesce(p_name,'')))<2 then raise exception 'Nome inválido'; end if;
 insert into public.cp_companies(organization_id,name) values(p_org,btrim(p_name)) returning id into v_id;
 insert into public.cp_audit_events(organization_id,actor_id,entity,entity_id,action)
 values(p_org,auth.uid(),'company',v_id,'created');
 return v_id;
end $$;
create or replace function public.cp_admin_department(p_company uuid,p_name text,p_budget numeric default null,p_threshold numeric default 500)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_org uuid;
begin
 if not private.cp_has_role(p_company,array['group_admin','grit_superadmin']) then raise exception 'Sem permissão de administração'; end if;
 if length(btrim(coalesce(p_name,'')))<2 or (p_budget is not null and p_budget<0)
  or p_threshold<0 then raise exception 'Parâmetros inválidos'; end if;
 insert into public.cp_departments(company_id,name,budget_monthly,finance_threshold)
 values(p_company,btrim(p_name),p_budget,p_threshold) returning id into v_id;
 select organization_id into v_org from public.cp_companies where id=p_company;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action)
 values(v_org,p_company,auth.uid(),'department',v_id,'created');
 return v_id;
end $$;
-- Default grants of existing functions remain authenticated; functions still verify role per call.
