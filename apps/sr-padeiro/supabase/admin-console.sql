-- Additive admin console. All privileged operations require an active Super Admin.
alter table public.srp_organizations add column if not exists contact_email text;
alter table public.srp_organizations add column if not exists slug text;
alter table public.srp_organizations add column if not exists environment text not null default 'production' check(environment in ('production','homologation'));
create unique index if not exists srp_org_slug_unique on public.srp_organizations(slug) where slug is not null;
alter table public.srp_members add column if not exists operator_names text[] not null default '{}';
alter table public.srp_products add column if not exists external_key text;
alter table public.srp_products add column if not exists fulfillment text not null default 'confirmar' check(fulfillment in ('confirmar','pronta_entrega','encomenda'));
alter table public.srp_products add column if not exists variant text not null default '';
alter table public.srp_products add column if not exists catalog_notes text not null default '';
create unique index if not exists srp_product_external_unique on public.srp_products(organization_id,external_key) where external_key is not null;

create or replace function private.srp_protect_organization_setup()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if (new.environment,new.slug,new.owner_user_id) is distinct from (old.environment,old.slug,old.owner_user_id)
    and coalesce((select auth.jwt()->>'role'),'')<>'service_role'
    and not exists(select 1 from public.admin_users where user_id=(select auth.uid()) and active and role='superadmin') then
    raise exception 'Somente o Super Admin pode alterar o provisionamento do cliente' using errcode='42501';
  end if;
  return new;
end; $$;
revoke all on function private.srp_protect_organization_setup() from public,anon,authenticated;
drop trigger if exists srp_protect_organization_setup on public.srp_organizations;
create trigger srp_protect_organization_setup before update on public.srp_organizations for each row execute function private.srp_protect_organization_setup();

create or replace function private.srp_admin_console(p_action text,p_org_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid := (select auth.uid()); v_org uuid:=p_org_id; v_result jsonb;
  v_user uuid; v_category uuid; v_product uuid; v_store uuid; v_row jsonb;
  v_role text; v_unit text; v_key text; v_name text; v_mode text; v_price numeric;
  v_count int:=0; v_inserted int:=0; v_quantity numeric; v_before numeric; v_created boolean;
begin
  if v_actor is null or not exists(select 1 from public.admin_users where user_id=v_actor and active and role='superadmin') then
    raise exception 'Acesso exclusivo do Super Admin' using errcode='42501';
  end if;
  if p_action='list' then
    return coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc) from (
      select o.*,a.access_mode,a.trial_ends_at,a.barter_until,a.manual_release,
        (select count(*) from public.srp_products p where p.organization_id=o.id) as products_count,
        (select count(*) from public.srp_members m where m.organization_id=o.id and m.active) as members_count,
        (select coalesce(sum(s.total),0) from public.srp_sales s where s.organization_id=o.id and s.status='completed' and s.created_at>=now()-interval '30 days') as revenue_30d
      from public.srp_organizations o left join public.srp_access_control a on a.organization_id=o.id
    ) t),'[]'::jsonb);
  end if;
  if p_action='create' then
    v_name:=trim(p_payload->>'name');
    if coalesce(length(v_name),0)<2 or coalesce(p_payload->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Informe nome e identificador válidos'; end if;
    -- An explicit, caller-generated UUID makes retrying creation idempotent.
    v_org:=(p_payload->>'request_id')::uuid;
    if v_org is null then raise exception 'Identificador da solicitação obrigatório'; end if;
    if exists(select 1 from public.srp_organizations where id=v_org) then return jsonb_build_object('organization_id',v_org,'reused',true); end if;
    insert into public.srp_organizations(id,name,business_type,owner_user_id,contact_email,slug,environment,active)
      values(v_org,v_name,'padaria',v_actor,nullif(lower(trim(p_payload->>'email')),''),p_payload->>'slug','homologation',true);
    insert into public.srp_stores(organization_id,name) values(v_org,'Loja principal');
    update public.srp_access_control set trial_starts_at=now(),trial_ends_at=now()+interval '7 days',notes='Homologação administrativa; sem cobrança' where organization_id=v_org;
    v_result:=jsonb_build_object('organization_id',v_org);
  else
    if not exists(select 1 from public.srp_organizations where id=v_org) then raise exception 'Cliente não encontrado'; end if;
    perform 1 from public.srp_organizations where id=v_org for update;
    if p_action='support' then
      v_result:=jsonb_build_object('ok',true);
    elsif p_action='detail' then
      return jsonb_build_object(
        'organization',(select to_jsonb(o) from public.srp_organizations o where id=v_org),
        'access',(select to_jsonb(a) from public.srp_access_control a where organization_id=v_org),
        'stores',coalesce((select jsonb_agg(to_jsonb(s)) from public.srp_stores s where organization_id=v_org),'[]'::jsonb),
        'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'role',m.role,'active',m.active,'operator_names',m.operator_names,'email',u.email,'confirmed',u.email_confirmed_at is not null)) from public.srp_members m join auth.users u on u.id=m.user_id where m.organization_id=v_org),'[]'::jsonb),
        'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.name) from public.srp_products p where organization_id=v_org),'[]'::jsonb),
        'categories',coalesce((select jsonb_agg(to_jsonb(c) order by c.name) from public.srp_categories c where organization_id=v_org),'[]'::jsonb),
        'inventory',coalesce((select jsonb_agg(to_jsonb(i)) from public.srp_inventory i where organization_id=v_org),'[]'::jsonb),
        'cash',coalesce((select jsonb_agg(to_jsonb(c)) from (select * from public.srp_cash_registers where organization_id=v_org order by opened_at desc limit 20)c),'[]'::jsonb),
        'sales',coalesce((select jsonb_agg(to_jsonb(s)) from (select id,total,status,created_at,store_id from public.srp_sales where organization_id=v_org order by created_at desc limit 30)s),'[]'::jsonb),
        'events',coalesce((select jsonb_agg(to_jsonb(e)) from (select event_name,metadata,created_at from public.srp_operation_events where organization_id=v_org order by created_at desc limit 50)e),'[]'::jsonb)
      );
    elsif p_action='profile' then
      v_name:=trim(p_payload->>'name');
      if coalesce(length(v_name),0)<2 or coalesce(p_payload->>'primary_color','') !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Nome ou cor inválidos'; end if;
      if nullif(p_payload->>'logo_url','') is not null and p_payload->>'logo_url' !~ '^https://' then raise exception 'Logo deve usar HTTPS'; end if;
      update public.srp_organizations set name=v_name,phone=nullif(trim(p_payload->>'phone'),''),contact_email=nullif(lower(trim(p_payload->>'contact_email')),''),primary_color=p_payload->>'primary_color',logo_url=nullif(p_payload->>'logo_url','') where id=v_org;
    elsif p_action='access' then
      v_mode:=p_payload->>'mode';
      if v_mode not in ('trial','barter','suspended','cancelled','active') or length(trim(coalesce(p_payload->>'reason','')))<5 then raise exception 'Informe modalidade e motivo'; end if;
      if v_mode in ('trial','barter') and coalesce((p_payload->>'days')::int,0) not between 1 and 90 then raise exception 'Período deve ter entre 1 e 90 dias'; end if;
      insert into public.srp_access_control(organization_id,access_mode,trial_starts_at,trial_ends_at,barter_until,manual_release,released_by,released_at,notes)
      values(v_org,v_mode,now(),case when v_mode='trial' then now()+make_interval(days=>(p_payload->>'days')::int) end,case when v_mode='barter' then now()+make_interval(days=>(p_payload->>'days')::int) end,v_mode='active',v_actor,now(),p_payload->>'reason')
      on conflict(organization_id) do update set access_mode=excluded.access_mode,trial_starts_at=excluded.trial_starts_at,trial_ends_at=excluded.trial_ends_at,barter_until=excluded.barter_until,manual_release=excluded.manual_release,released_by=excluded.released_by,released_at=excluded.released_at,notes=excluded.notes,updated_at=now();
    elsif p_action='find_identity' then
      return jsonb_build_object('user_id',(select id from auth.users where lower(email)=lower(trim(p_payload->>'email')) limit 1));
    elsif p_action='member' then
      v_user:=(p_payload->>'user_id')::uuid; v_role:=p_payload->>'role';
      if v_role not in ('owner','manager','cashier','stockist','viewer') then raise exception 'Perfil inválido'; end if;
      if not exists(select 1 from auth.users where id=v_user) then raise exception 'Identidade não encontrada'; end if;
      -- Do not silently transfer technical ownership or remove the last owner.
      if exists(select 1 from public.srp_members where organization_id=v_org and user_id=v_user and role='owner' and active)
         and (v_role<>'owner' or not coalesce((p_payload->>'active')::boolean,true))
         and not exists(select 1 from public.srp_members where organization_id=v_org and user_id<>v_user and role='owner' and active) then raise exception 'Mantenha ao menos um proprietário ativo'; end if;
      insert into public.srp_members(organization_id,user_id,role,active,operator_names)
      values(v_org,v_user,v_role,coalesce((p_payload->>'active')::boolean,true),array(select jsonb_array_elements_text(coalesce(p_payload->'operator_names','[]'::jsonb))))
      on conflict(organization_id,user_id) do update set role=excluded.role,active=excluded.active,operator_names=excluded.operator_names;
    elsif p_action in ('product','import') then
      if p_action='import' and (jsonb_typeof(p_payload->'rows')<>'array' or jsonb_array_length(p_payload->'rows') not between 1 and 1000) then raise exception 'Importe entre 1 e 1000 produtos'; end if;
      for v_row in select value from jsonb_array_elements(case when p_action='product' then jsonb_build_array(p_payload) else p_payload->'rows' end) loop
        v_name:=trim(v_row->>'name'); v_price:=(v_row->>'sale_price')::numeric; v_unit:=v_row->>'unit';
        if coalesce(length(v_name),0)<2 or v_price is null or v_price<0 or v_price<>round(v_price,2) or v_unit not in ('UN','KG','G','L','ML','PACOTE','CAIXA') then raise exception 'Produto, preço ou unidade inválidos'; end if;
        if coalesce(v_row->>'fulfillment','confirmar') not in ('pronta_entrega','encomenda','confirmar') then raise exception 'Modalidade inválida'; end if;
        if coalesce((v_row->>'active')::boolean,false) and coalesce(v_row->>'fulfillment','confirmar')='confirmar' then raise exception 'Confirme a modalidade antes de ativar o produto'; end if;
        v_key:=nullif(trim(v_row->>'external_key'),'');
        if v_key is null then v_key:='manual-'||md5(lower(v_name)||'|'||coalesce(v_row->>'variant','')||'|'||v_unit||'|'||coalesce(v_row->>'category','')); end if;
        v_category:=null;
        if nullif(trim(v_row->>'category'),'') is not null then
          select id into v_category from public.srp_categories where organization_id=v_org and lower(name)=lower(trim(v_row->>'category')) limit 1;
          if v_category is null then insert into public.srp_categories(organization_id,name) values(v_org,trim(v_row->>'category')) returning id into v_category; end if;
        end if;
        v_product:=null;
        if p_action='product' and nullif(v_row->>'id','') is not null then
          select id into v_product from public.srp_products where organization_id=v_org and id=(v_row->>'id')::uuid;
          if v_product is null then raise exception 'Produto não pertence ao cliente'; end if;
        else
          select id into v_product from public.srp_products where organization_id=v_org and external_key=v_key;
        end if;
        if v_product is null then
          insert into public.srp_products(organization_id,name,category_id,unit,sale_price,cost_price,active,external_key,fulfillment,variant,catalog_notes,barcode)
          values(v_org,v_name,v_category,v_unit,v_price,nullif(v_row->>'cost_price','')::numeric,coalesce((v_row->>'active')::boolean,false),v_key,coalesce(v_row->>'fulfillment','confirmar'),coalesce(v_row->>'variant',''),coalesce(v_row->>'catalog_notes',''),nullif(v_row->>'barcode','')) returning id into v_product;
          v_inserted:=v_inserted+1;
        else
          update public.srp_products set name=v_name,category_id=v_category,unit=v_unit,sale_price=v_price,cost_price=nullif(v_row->>'cost_price','')::numeric,active=coalesce((v_row->>'active')::boolean,false),fulfillment=coalesce(v_row->>'fulfillment','confirmar'),variant=coalesce(v_row->>'variant',''),catalog_notes=coalesce(v_row->>'catalog_notes',''),barcode=nullif(v_row->>'barcode','') where id=v_product and organization_id=v_org;
        end if;
        v_count:=v_count+1;
      end loop;
      v_result:=jsonb_build_object('processed',v_count,'inserted',v_inserted,'updated',v_count-v_inserted);
    elsif p_action='inventory' then
      v_store:=(p_payload->>'store_id')::uuid; v_product:=(p_payload->>'product_id')::uuid; v_quantity:=(p_payload->>'quantity')::numeric;
      if v_quantity is null or v_quantity<0 or coalesce((p_payload->>'minimum_quantity')::numeric,-1)<0 or length(trim(coalesce(p_payload->>'reason','')))<5 then raise exception 'Informe saldo, mínimo e motivo válidos'; end if;
      if not exists(select 1 from public.srp_stores where id=v_store and organization_id=v_org) or not exists(select 1 from public.srp_products where id=v_product and organization_id=v_org) then raise exception 'Loja ou produto não pertence ao cliente'; end if;
      select quantity into v_before from public.srp_inventory where store_id=v_store and product_id=v_product for update;
      insert into public.srp_inventory(organization_id,store_id,product_id,quantity,minimum_quantity) values(v_org,v_store,v_product,v_quantity,(p_payload->>'minimum_quantity')::numeric)
      on conflict(store_id,product_id) do update set quantity=excluded.quantity,minimum_quantity=excluded.minimum_quantity,updated_at=now();
      if v_quantity<>coalesce(v_before,0) then
        insert into public.srp_inventory_movements(organization_id,store_id,product_id,movement_type,quantity,reason,created_by) values(v_org,v_store,v_product,'adjustment',v_quantity-coalesce(v_before,0),p_payload->>'reason',v_actor);
      end if;
    else raise exception 'Ação não suportada'; end if;
  end if;
  insert into public.srp_operation_events(organization_id,user_id,event_name,metadata)
    values(v_org,v_actor,'admin_'||p_action,jsonb_build_object('action',p_action,'result',v_result,'reason',p_payload->>'reason','target_user_id',case when p_action='member' then p_payload->>'user_id' end));
  return coalesce(v_result,'{"ok":true}'::jsonb);
end; $$;
revoke all on function private.srp_admin_console(text,uuid,jsonb) from public,anon;
grant execute on function private.srp_admin_console(text,uuid,jsonb) to authenticated;

create or replace function public.srp_admin_console(p_action text,p_org_id uuid default null,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$
  select private.srp_admin_console(p_action,p_org_id,p_payload);
$$;
revoke all on function public.srp_admin_console(text,uuid,jsonb) from public,anon;
grant execute on function public.srp_admin_console(text,uuid,jsonb) to authenticated;

create policy "srp logos superadmin insert" on storage.objects for insert to authenticated with check (
 bucket_id='srp-logos'
 and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.active and a.role='superadmin')
 and exists(select 1 from public.srp_organizations o where o.id::text=(storage.foldername(name))[1])
);
