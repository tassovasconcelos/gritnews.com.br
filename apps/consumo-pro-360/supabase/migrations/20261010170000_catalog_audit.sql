-- Auditoria de cadastros sensíveis e separação da manutenção de depósitos.
-- Eventos de manutenção podem ter ator nulo quando executados pelo serviço, com origin_role registrado.
alter table public.cp_audit_events alter column actor_id drop not null;
drop policy if exists cp_warehouse_insert on public.cp_warehouses;
create policy cp_warehouse_insert on public.cp_warehouses for insert to authenticated
with check(private.cp_has_role(company_id,array['group_admin']));
drop policy if exists cp_warehouse_update on public.cp_warehouses;
create policy cp_warehouse_update on public.cp_warehouses for update to authenticated
using(private.cp_has_role(company_id,array['group_admin']))
with check(private.cp_has_role(company_id,array['group_admin']));

create or replace function private.cp_audit_catalog_mutation()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_org uuid; v_company uuid; v_payload jsonb; v_entity uuid;
begin
 v_entity:=new.id;
 if tg_table_name='cp_products' then
  v_org:=new.organization_id;
 elsif tg_table_name='cp_suppliers' then
  v_org:=new.organization_id;
 elsif tg_table_name='cp_warehouses' then
  v_company:=new.company_id;
 elsif tg_table_name='cp_quote_batches' then
  v_company:=new.company_id;
 else
  raise exception 'Tabela não autorizada para auditoria de catálogo: %',tg_table_name;
 end if;
 if v_org is null and v_company is not null then
  select c.organization_id into v_org from public.cp_companies c where c.id=v_company;
 end if;
 if v_org is null then raise exception 'Falha ao determinar organização da auditoria'; end if;
 if tg_op='INSERT' then
  v_payload:=jsonb_build_object('after',to_jsonb(new));
 else
  v_payload:=jsonb_build_object('before',to_jsonb(old),'after',to_jsonb(new));
 end if;
 v_payload:=v_payload||jsonb_build_object('db_role',current_user,'source','catalog_trigger');
 insert into public.cp_audit_events
 (organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(v_org,v_company,auth.uid(),tg_table_name,v_entity,lower(tg_op),v_payload);
 return new;
end $$;

drop trigger if exists cp_products_catalog_audit on public.cp_products;
create trigger cp_products_catalog_audit after insert or update on public.cp_products
 for each row execute function private.cp_audit_catalog_mutation();
drop trigger if exists cp_suppliers_catalog_audit on public.cp_suppliers;
create trigger cp_suppliers_catalog_audit after insert or update on public.cp_suppliers
 for each row execute function private.cp_audit_catalog_mutation();
drop trigger if exists cp_warehouses_catalog_audit on public.cp_warehouses;
create trigger cp_warehouses_catalog_audit after insert or update on public.cp_warehouses
 for each row execute function private.cp_audit_catalog_mutation();
drop trigger if exists cp_quote_batches_catalog_audit on public.cp_quote_batches;
create trigger cp_quote_batches_catalog_audit after insert or update on public.cp_quote_batches
 for each row execute function private.cp_audit_catalog_mutation();
revoke all on function private.cp_audit_catalog_mutation() from public,anon,authenticated;
