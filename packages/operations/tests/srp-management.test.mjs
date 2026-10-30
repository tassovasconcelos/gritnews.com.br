import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const owner=id(1),staff=id(2),other=id(3),admin=id(4),scope=id(10),foreign=id(11),store=id(20),product=id(30);
async function fixture({legacy=false}={}){
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now());
 create table profiles(id uuid primary key,full_name text);
 create table srp_organizations(id uuid primary key,owner_user_id uuid,name text,environment text default 'homologation',primary_color text);
 create table srp_members(organization_id uuid,user_id uuid,role text,active boolean);
 create table srp_stores(id uuid primary key,organization_id uuid,name text,active boolean default true);
 create table srp_products(id uuid primary key,organization_id uuid,name text,variant text default '',unit text default 'UN',cost_price numeric,sale_price numeric,active boolean default true,fulfillment text default 'pronta_entrega');
 create table srp_inventory(organization_id uuid,store_id uuid,product_id uuid,quantity numeric,minimum_quantity numeric,updated_at timestamptz default now(),primary key(organization_id,store_id,product_id));
 create table srp_inventory_movements(id uuid default gen_random_uuid(),organization_id uuid,store_id uuid,product_id uuid,movement_type text,quantity numeric,reference_id uuid,reason text,created_by uuid,created_at timestamptz default now());
 create table srp_sales(id uuid primary key,organization_id uuid,store_id uuid,seller_id uuid,total numeric,status text default 'completed',created_at timestamptz default now());
 create table srp_sale_items(id uuid primary key default gen_random_uuid(),organization_id uuid,sale_id uuid,product_id uuid,quantity numeric,total numeric);
 create table srp_sale_payments(organization_id uuid,sale_id uuid,method text,amount numeric);
 create table srp_expenses(organization_id uuid,store_id uuid,description text,category text,amount numeric,created_by uuid,created_at timestamptz default now());
 create table srp_operation_events(organization_id uuid,store_id uuid,user_id uuid,event_name text,entity_type text,entity_id uuid,metadata jsonb,created_at timestamptz default now());
 create table operation_audit(app text,scope_id uuid,actor_id uuid,action text);
 create table srp_subscriptions(organization_id uuid,status text,provider text,monthly_amount numeric,current_period_end timestamptz);
 create table srp_billing_transactions(organization_id uuid,kind text,provider text,status text,amount numeric,created_at timestamptz default now());
 create function private.ops_super() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
 create function private.ops_access(a text,s uuid,manage boolean) returns boolean language sql stable security definer as $$select exists(select 1 from public.srp_members where organization_id=s and user_id=auth.uid() and active and role in ('owner','manager'))$$;
 create function private.ops_catalog_access(a text,s uuid) returns boolean language sql stable security definer as $$select exists(select 1 from public.srp_members where organization_id=s and user_id=auth.uid() and active and role in ('owner','manager','stockist'))$$;
 grant usage on schema public,private,auth to authenticated;
 insert into auth.users(id) values('${owner}'),('${staff}'),('${other}'),('${admin}');
 insert into srp_organizations(id,owner_user_id,name) values('${scope}','${owner}','Padaria teste'),('${foreign}','${other}','Outra');
 insert into srp_members values('${scope}','${owner}','owner',true),('${scope}','${staff}','stockist',true),('${foreign}','${other}','owner',true);
 insert into srp_stores(id,organization_id,name) values('${store}','${scope}','Principal'),('${id(21)}','${foreign}','Outra');
 insert into srp_products(id,organization_id,name,cost_price,sale_price) values('${product}','${scope}','Pão',2,5),('${id(31)}','${foreign}','Outro',1,2);`);
 if(legacy)await db.exec(`insert into srp_sales(id,organization_id,store_id,seller_id,total) values('${id(70)}','${scope}','${store}','${owner}',5);insert into srp_sale_items(organization_id,sale_id,product_id,quantity,total) values('${scope}','${id(70)}','${product}',1,5);`);
 await db.exec(await readFile(new URL('../../../apps/sr-padeiro/supabase/migrations/20261030110922_srp_management_purchases_commercial.sql',import.meta.url),'utf8'));return db;
}
async function as(db,u){await db.exec(`reset role;select set_config('request.jwt.claim.sub','${u}',false);set role authenticated;`);}
async function call(db,action,payload={},org=scope){return (await db.query('select public.srp_management($1,$2,$3::jsonb) as result',[action,org,JSON.stringify(payload)])).rows[0].result;}
test('compras e contagem: saldo atômico, custo opcional, repetição idempotente e isolamento',async()=>{
 const db=await fixture();try{
  const args={store_id:store,product_id:product,quantity:10,unit_cost:3,supplier:'Fornecedor teste',request_id:id(100),update_cost:true};
  await as(db,other);await assert.rejects(call(db,'purchase',args),/forbidden/);
  await as(db,staff);await call(db,'purchase',args);assert.equal((await call(db,'purchase',args)).reused,true);
  await assert.rejects(call(db,'purchase',{...args,request_id:id(101),product_id:id(31)}),/invalid_product/);
  await assert.rejects(call(db,'purchase',{...args,request_id:id(102),supplier:''}),/check constraint/);
  await assert.rejects(call(db,'expense',{...args,amount:20,description:'Despesa'}),/forbidden/);
  await call(db,'adjust',{store_id:store,product_id:product,quantity:7,minimum:2,reason:'Contagem de abertura',request_id:id(103)});
  const data=await call(db,'stock');assert.equal(Number(data.inventory[0].quantity),7);assert.equal(data.purchases.length,1);assert.equal(data.movements.length,2);
  await db.exec('reset role');assert.equal((await db.query(`select cost_price from srp_products where id='${product}'`)).rows[0].cost_price, '3');
 }finally{await db.close();}
});
test('resultados: custo histórico, cancelamentos excluídos e compras sem dupla dedução',async()=>{
 const db=await fixture();try{
  await db.exec(`insert into srp_sales(id,organization_id,store_id,seller_id,total) values('${id(40)}','${scope}','${store}','${owner}',20);
   insert into srp_sale_items(organization_id,sale_id,product_id,quantity,total) values('${scope}','${id(40)}','${product}',4,20);
   insert into srp_sale_payments values('${scope}','${id(40)}','pix',20);
   update srp_products set cost_price=10 where id='${product}';`);
  await assert.rejects(db.exec("update srp_sale_items set cost_price_snapshot=99"),/historical_cost_is_immutable/);
  await as(db,owner);await call(db,'expense',{store_id:store,request_id:id(104),amount:3,description:'Energia operacional'});
  await call(db,'purchase',{store_id:store,product_id:product,quantity:5,unit_cost:10,supplier:'Fornecedor',request_id:id(105)});
  const result=await call(db,'report',{days:30});assert.equal(Number(result.cogs),8);assert.equal(Number(result.result),9);assert.equal(Number(result.purchases),50);
  await db.exec(`reset role;update srp_sales set status='cancelled' where id='${id(40)}';`);await as(db,owner);assert.equal((await call(db,'report')).count,0);
  await as(db,staff);await assert.rejects(call(db,'report'),/forbidden/);
  await as(db,owner);await assert.rejects(call(db,'report',{days:30,store_id:id(21)}),/invalid_store/);
 }finally{await db.close();}
});
test('implantação: somente superadmin muda cobrança e produção exige preparação real',async()=>{
 const db=await fixture();try{
  const form={allowed_providers:[],preferred_provider:'manual',onboarding_stage:'ready',notes:'Permuta',reason:'Contrato de teste anual'};
  await as(db,owner);await assert.rejects(call(db,'save_commercial',form),/superadmin_required/);
  await as(db,admin);await call(db,'save_commercial',form);await assert.rejects(call(db,'launch',{reason:'Iniciar operação real'}),/onboarding_not_ready/);
  await call(db,'purchase',{store_id:store,product_id:product,quantity:1,unit_cost:2,supplier:'Fornecedor',request_id:id(106)});
  await call(db,'launch',{reason:'Treinamento e conferência concluídos'});
  const result=await call(db,'commercial');assert.equal(result.settings.onboarding_stage,'live');assert.deepEqual(result.settings.allowed_providers,[]);assert.equal(result.transactions.length,0);
  await db.exec('reset role');assert.equal((await db.query(`select environment from srp_organizations where id='${scope}'`)).rows[0].environment,'production');
 }finally{await db.close();}
});

test('histórico anterior à migração não recebe custo inventado e leitura respeita RLS',async()=>{const db=await fixture({legacy:true});try{await as(db,owner);const report=await call(db,'report');assert.equal(report.result,null);assert.equal(report.missing_costs,1);await call(db,'purchase',{store_id:store,product_id:product,quantity:1,unit_cost:1,supplier:'Fornecedor',request_id:id(120)});await as(db,other);assert.equal((await db.query('select * from srp_purchases')).rows.length,0);await db.exec('reset role;set role anon');await assert.rejects(call(db,'stock'),/permission denied/);}finally{await db.close();}});
