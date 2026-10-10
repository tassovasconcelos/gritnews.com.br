-- Setup corporativo inicial sem usuários, credenciais, CNPJ, orçamento ou estoque inventados.
-- Cadastro-base provisório; áreas devem ser validadas pelo Grupo antes do início operacional.
with org as (
 insert into public.cp_organizations(name) values ('Grupo Prohospital') returning id
), company as (
 insert into public.cp_companies(organization_id,name,active)
 select org.id,'Prohospital',true from org returning id
)
insert into public.cp_departments(company_id,name,budget_monthly,finance_threshold,active)
select company.id,sector.name,null,0,true
from company
cross join (values
 ('Administrativo'),('Comercial'),('Financeiro'),('Compras'),('Recursos Humanos'),
 ('Tecnologia da Informação'),('Marketing'),('Logística'),('Almoxarifado'),
 ('SAC'),('Diretoria')
) as sector(name);
