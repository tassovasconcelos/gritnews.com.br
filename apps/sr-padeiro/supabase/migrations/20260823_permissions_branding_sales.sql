-- Sr. Padeiro: perfis, identidade do cliente e venda atômica

alter table public.srp_members drop constraint if exists srp_members_role_check;
alter table public.srp_members add constraint srp_members_role_check check (role in ('owner','manager','cashier','stockist','viewer'));

alter table public.srp_organizations add column if not exists logo_url text;
alter table public.srp_organizations add column if not exists primary_color text default '#F47A20';
alter table public.srp_organizations add column if not exists phone text;

create or replace function public.srp_role_allowed(org_id uuid,allowed_roles text[])
returns boolean language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.srp_members m where m.organization_id=org_id and m.user_id=(select auth.uid()) and m.active and m.role=any(allowed_roles));
$$;
grant execute on function public.srp_role_allowed(uuid,text[]) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('srp-logos','srp-logos',true,2097152,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.srp_stock_out_on_sale_item()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_store uuid; v_user uuid; v_available numeric;
begin
  select s.store_id,s.seller_id into v_store,v_user from public.srp_sales s where s.id=new.sale_id;
  select i.quantity into v_available from public.srp_inventory i where i.organization_id=new.organization_id and i.store_id=v_store and i.product_id=new.product_id for update;
  if v_available is null then raise exception 'Estoque não configurado para o produto'; end if;
  if v_available < new.quantity then raise exception 'Estoque insuficiente'; end if;
  update public.srp_inventory i set quantity=i.quantity-new.quantity,updated_at=now() where i.organization_id=new.organization_id and i.store_id=v_store and i.product_id=new.product_id;
  insert into public.srp_inventory_movements(organization_id,store_id,product_id,movement_type,quantity,reference_id,reason,created_by)
  values(new.organization_id,v_store,new.product_id,'sale',-new.quantity,new.sale_id,'Baixa automática por venda',v_user);
  return new;
end;
$$;
revoke all on function public.srp_stock_out_on_sale_item() from public,anon,authenticated;

drop trigger if exists srp_sale_item_stock_out on public.srp_sale_items;
create trigger srp_sale_item_stock_out after insert on public.srp_sale_items for each row execute function public.srp_stock_out_on_sale_item();

create or replace function public.srp_complete_sale(p_organization_id uuid,p_store_id uuid,p_cash_register_id uuid,p_items jsonb,p_payment_method text,p_customer_id uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_sale_id uuid; v_total numeric(14,2):=0; v_subtotal numeric(14,2):=0; v_item jsonb; v_product record; v_qty numeric(14,3);
begin
  if not public.srp_runtime_access(p_organization_id) or not public.srp_role_allowed(p_organization_id,array['owner','manager','cashier']) then raise exception 'Usuário sem permissão para vender'; end if;
  if p_payment_method not in ('cash','pix','debit','credit','credit_book') then raise exception 'Forma de pagamento inválida'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Venda sem itens'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty:=(v_item->>'quantity')::numeric;
    if v_qty<=0 then raise exception 'Quantidade inválida'; end if;
    select id,sale_price into v_product from public.srp_products where id=(v_item->>'product_id')::uuid and organization_id=p_organization_id and active=true;
    if v_product.id is null then raise exception 'Produto inválido'; end if;
    v_subtotal:=v_subtotal+(v_product.sale_price*v_qty);
  end loop;
  v_total:=round(v_subtotal,2);
  insert into public.srp_sales(organization_id,store_id,cash_register_id,customer_id,seller_id,subtotal,discount,total,status)
  values(p_organization_id,p_store_id,p_cash_register_id,p_customer_id,(select auth.uid()),v_subtotal,0,v_total,'completed') returning id into v_sale_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty:=(v_item->>'quantity')::numeric;
    select id,sale_price into v_product from public.srp_products where id=(v_item->>'product_id')::uuid and organization_id=p_organization_id and active=true;
    insert into public.srp_sale_items(organization_id,sale_id,product_id,quantity,unit_price,total)
    values(p_organization_id,v_sale_id,v_product.id,v_qty,v_product.sale_price,round(v_product.sale_price*v_qty,2));
  end loop;
  insert into public.srp_sale_payments(organization_id,sale_id,method,amount) values(p_organization_id,v_sale_id,p_payment_method,v_total);
  insert into public.srp_operation_events(organization_id,store_id,user_id,event_name,entity_type,entity_id,metadata)
  values(p_organization_id,p_store_id,(select auth.uid()),'sale_completed','sale',v_sale_id,jsonb_build_object('total',v_total,'payment',p_payment_method,'items',jsonb_array_length(p_items)));
  return v_sale_id;
end;
$$;
grant execute on function public.srp_complete_sale(uuid,uuid,uuid,jsonb,text,uuid) to authenticated;
