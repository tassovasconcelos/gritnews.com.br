-- Evita duplicidade entre DANFE/foto/manual e XML da mesma NF.
create unique index if not exists cp_invoice_issuer_document_unique on public.cp_invoices(company_id,supplier_tax_id,number,series) nulls not distinct where supplier_tax_id is not null and number is not null;
-- Evita repetir vínculos de usuários quando empresa/setor for nulo.
create unique index if not exists cp_membership_exact_unique on public.cp_memberships(user_id,organization_id,company_id,department_id,role) nulls not distinct;

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
 if nullif(pg_catalog.btrim(coalesce(p_tax_id,'')),'') is not null
 and nullif(pg_catalog.btrim(coalesce(p_number,'')),'') is not null
 and exists(select 1 from public.cp_invoices i where i.company_id=p_company
   and i.supplier_tax_id=p_tax_id and i.number=p_number
   and i.series is not distinct from p_series)
 then raise exception 'Nota já cadastrada pelo emitente, número e série; confira o documento existente'; end if;
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
