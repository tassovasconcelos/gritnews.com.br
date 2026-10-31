import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const owner=id(1),cashier=id(2),stockist=id(3),other=id(4),admin=id(5),org=id(10),foreign=id(11),store=id(20),foreignStore=id(21),product=id(30),foreignProduct=id(31),cash=id(40);
async function fixture(){const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table auth.users(id uuid primary key);insert into auth.users values('${owner}'),('${cashier}'),('${stockist}'),('${other}'),('${admin}');
create table srp_organizations(id uuid primary key,name text);insert into srp_organizations values('${org}','Padaria'),('${foreign}','Outra');
create table srp_members(organization_id uuid,user_id uuid,role text,active boolean);insert into srp_members values('${org}','${owner}','owner',true),('${org}','${cashier}','cashier',true),('${org}','${stockist}','stockist',true),('${foreign}','${other}','owner',true);
create table operation_support_sessions(app text,scope_id uuid,admin_id uuid,expires_at timestamptz,revoked_at timestamptz);
create function private.ops_super() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
create function public.srp_runtime_access(uuid) returns boolean language sql stable as $$select coalesce(current_setting('test.access_blocked',true),'false')<>'true'$$;
create function public.srp_role_allowed(o uuid,roles text[]) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.srp_members where organization_id=o and user_id=auth.uid() and active and role=any(roles)) or (private.ops_super() and exists(select 1 from public.operation_support_sessions where scope_id=o and admin_id=auth.uid() and app='sr-padeiro' and expires_at>now() and revoked_at is null))$$;
create function public.ops_account_request_guard() returns void language plpgsql as $$begin if current_setting('test.password_blocked',true)='true' then raise exception 'password_change_required';end if;end$$;
create table srp_stores(id uuid primary key,organization_id uuid,name text,active boolean default true);insert into srp_stores values('${store}','${org}','Principal',true),('${foreignStore}','${foreign}','Outra',true);
create table srp_products(id uuid primary key,organization_id uuid,name text,variant text default '',fulfillment text default 'pronta_entrega',unit text default 'UN',sale_price numeric,cost_price numeric,active boolean default true);
insert into srp_products(id,organization_id,name,sale_price,cost_price) values('${product}','${org}','Pão',5,2),('${foreignProduct}','${foreign}','Outro',7,3);
create table srp_sales(id uuid primary key default gen_random_uuid(),organization_id uuid,store_id uuid,cash_register_id uuid,customer_id uuid,seller_id uuid,subtotal numeric,discount numeric,total numeric,status text,created_at timestamptz default now());
create table srp_sale_items(id uuid primary key default gen_random_uuid(),organization_id uuid,sale_id uuid,product_id uuid,quantity numeric check(quantity>0),unit_price numeric,total numeric);
create table srp_sale_payments(organization_id uuid,sale_id uuid,method text,amount numeric check(amount>0));
create table srp_operation_events(organization_id uuid,store_id uuid,user_id uuid,event_name text,entity_type text,entity_id uuid,metadata jsonb);
create table srp_inventory(organization_id uuid,store_id uuid,product_id uuid,quantity numeric,minimum_quantity numeric default 2,updated_at timestamptz);
create table srp_inventory_movements(organization_id uuid,store_id uuid,product_id uuid,movement_type text,quantity numeric,reference_id uuid,reason text,created_by uuid);
create table srp_cash_registers(id uuid primary key,organization_id uuid,store_id uuid,status text);insert into srp_cash_registers values('${cash}','${org}','${store}','open');
insert into srp_inventory(organization_id,store_id,product_id,quantity) values('${org}','${store}','${product}',10);
grant usage on schema public,private,auth to authenticated;grant all on srp_sales,srp_sale_items,srp_sale_payments to anon,authenticated;`);
const legacy=await readFile(new URL('../../../../apps/sr-padeiro/supabase/migrations/20260823_permissions_branding_sales.sql',import.meta.url),'utf8');await db.exec(legacy.slice(legacy.indexOf('create or replace function public.srp_stock_out_on_sale_item')));
await db.exec(await readFile(new URL('../../../../apps/sr-padeiro/supabase/migrations/20261031105941_srp_counter_orders_and_guided_management.sql',import.meta.url),'utf8'));await as(db,owner);return db;}
async function as(db,user){await db.exec(`reset role;select set_config('request.jwt.claim.sub','${user}',false);set role authenticated;`);}
async function call(db,action,payload={},scope=org){return(await db.query('select public.srp_counter($1,$2,$3) result',[action,scope,{store_id:store,...payload}])).rows[0].result;}
const draft=(n=100)=>({id:id(n),save_key:id(n+100),version:0,kind:'counter',customer_label:'Cliente teste',items:[{product_id:product,quantity:2}]});


export {fixture,as,call,draft,id,owner,cashier,stockist,other,admin,org,foreign,store,foreignStore,product,foreignProduct,cash};
