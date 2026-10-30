import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(new URL('../../../packages/operations/package.json',import.meta.url));
const {PGlite}=require('@electric-sql/pglite');
const src=fs.readFileSync(new URL('../src/lib/management.ts',import.meta.url),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};new Function('exports',js)(mod.exports);
const {profitSummary,managementActions,csvContent}=mod.exports;
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const org=id(1),store=id(2),product=id(3),sale=id(4),foreign=id(5);
const migration=fs.readFileSync(new URL('../supabase/migrations/20261030210141_srp_management_stock_and_costs.sql',import.meta.url),'utf8');
async function database(){const db=new PGlite();await db.exec(`
create role anon;create role authenticated;create schema auth;create schema private;
create function auth.uid() returns uuid language sql as $$select '${id(99)}'::uuid$$;
create function private.ops_super() returns boolean language sql as $$select coalesce(current_setting('test.super',true),'false')='true'$$;
create function public.ops_account_request_guard() returns void language plpgsql as $$begin if current_setting('test.password',true)='required' then raise exception 'password_change_required';end if;end$$;
create function public.srp_runtime_access(uuid) returns boolean language sql as $$select coalesce(current_setting('test.access',true),'true')='true'$$;
create function public.srp_role_allowed(uuid,text[]) returns boolean language sql as $$select $1='${org}'::uuid and coalesce(current_setting('test.role',true),'owner')=any($2)$$;
create table srp_stores(id uuid primary key,organization_id uuid);
create table srp_products(id uuid primary key,organization_id uuid,name text,variant text,unit text,active boolean,fulfillment text,sale_price numeric,cost_price numeric);
create table srp_inventory(organization_id uuid,store_id uuid,product_id uuid,quantity numeric,minimum_quantity numeric,updated_at timestamptz,primary key(store_id,product_id));
create table srp_sales(id uuid primary key,organization_id uuid,store_id uuid,status text,subtotal numeric,discount numeric,total numeric,created_at timestamptz);
create table srp_sale_items(id uuid default gen_random_uuid(),organization_id uuid,sale_id uuid,product_id uuid,quantity numeric,unit_price numeric,total numeric);
create table srp_sale_payments(organization_id uuid,sale_id uuid,method text,amount numeric);
create table srp_expenses(id uuid default gen_random_uuid(),organization_id uuid,store_id uuid,description text,category text,amount numeric,created_by uuid,created_at timestamptz default now());
create table srp_inventory_movements(id uuid default gen_random_uuid(),organization_id uuid,store_id uuid,product_id uuid,movement_type text,quantity numeric,reason text,created_by uuid);
create table srp_operation_events(organization_id uuid,store_id uuid,user_id uuid,event_name text,entity_type text,entity_id uuid,metadata jsonb);
insert into srp_stores values('${store}','${org}'),('${foreign}','${foreign}');
insert into srp_products values('${product}','${org}','Pão','','UN',true,'pronta_entrega',10,4),('${id(6)}','${org}','Revisar','','PACOTE',false,'confirmar',20,0);
insert into srp_inventory values('${org}','${store}','${product}',5,5,now());
insert into srp_sales values('${sale}','${org}','${store}','completed',20,2,18,now()),('${id(7)}','${org}','${store}','completed',10,0,10,now()-interval '40 days'),('${id(8)}','${org}','${store}','canceled',100,0,100,now());
-- Existing item intentionally has no historical snapshot.
insert into srp_sale_items(organization_id,sale_id,product_id,quantity,unit_price,total) values('${org}','${sale}','${product}',1,10,10);
`);await db.exec(migration);await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261030210959_srp_purchase_all_released_products.sql',import.meta.url),'utf8'));return db;}
const report=async db=>(await db.query(`select srp_management_report('${org}','${store}',30) r`)).rows[0].r;
test('profit is marked incomplete when historical costs are missing; current costs do not invent profit',()=>{
 const r=profitSummary({revenue:100,known_revenue:30,known_cost:12,expenses:5,missing_cost_lines:1});assert.equal(r.complete,false);assert.equal(r.knownGross,18);
 assert.equal(profitSummary({revenue:100,known_revenue:100,known_cost:40,expenses:5,missing_cost_lines:0}).afterExpenses,55);
});
test('next actions reflect stock, costs, catalog and falling sales; CSV neutralizes formulas and preserves units',()=>{
 const a=managementActions({lowStock:2,unknownCosts:3,inactive:4,sales:1,revenue:10,previousRevenue:20});assert.ok(a.some(x=>x.screen==='purchases'));assert.ok(a.some(x=>/caíram/.test(x.text)));
 const csv=csvContent(['Produto','Unidade'],[['=WEBSERVICE("x")','PACOTE'],['Pão; especial','UN']]);assert.ok(csv.includes("'=WEBSERVICE"));assert.ok(csv.includes('PACOTE'));assert.ok(csv.includes('"Pão; especial"'));
});
test('report isolates store, period and canceled sales, allocates discount and keeps missing historical costs',async()=>{
 const db=await database();try{
  await db.exec(`insert into srp_sale_items(organization_id,sale_id,product_id,quantity,unit_price,total,unit_cost_snapshot) values('${org}','${sale}','${product}',1,10,10,999);`);
  let r=await report(db);assert.equal(r.summary.revenue,18);assert.equal(r.summary.previous_revenue,10);assert.equal(r.summary.missing_cost_lines,1);assert.equal(r.summary.known_cost,4);assert.equal(r.summary.known_revenue,9);assert.equal(r.daily.length,30);
  assert.equal(r.products.find(x=>x.id===product).revenue,18);
  await db.exec(`select srp_set_product_cost('${org}','${product}',7,12,'Atualização de fornecedor');`);
  r=await report(db);assert.equal(r.summary.known_cost,4);assert.equal(r.summary.missing_cost_lines,1);assert.equal(r.products.find(x=>x.id===product).cost_price,7);
 }finally{await db.close();}
});
test('purchase replenishes to target at minimum, removes inactive products, and audited stock adjustment uses delta',async()=>{
 const db=await database();try{
  let r=await report(db);assert.equal(r.stock.find(x=>x.id===product).suggested,45);assert.equal(r.stock.find(x=>x.id===id(6)).suggested,0);
  await db.exec(`select srp_set_stock('${org}','${store}','${product}',50,5,50,'Contagem inicial solicitada');`);
  r=await report(db);assert.equal(r.stock.find(x=>x.id===product).suggested,0);assert.equal(Number((await db.query('select quantity from srp_inventory_movements')).rows[0].quantity),45);
  await assert.rejects(db.query(`select srp_set_stock('${org}','${foreign}','${product}',50,5,50,'Tentativa em outra loja')`),/inválid/);
  await assert.rejects(db.query(`select srp_set_stock('${org}','${store}','${product}',50,8,5,'Alvo inválido')`),/Confira/);
 }finally{await db.close();}
});
test('permissions reject other tenants, cashier financial access, blocked runtime and pending password',async()=>{
 const db=await database();try{
  await assert.rejects(db.query(`select srp_management_report('${foreign}','${foreign}',30)`),/Acesso/);
  await db.exec(`select set_config('test.role','cashier',false)`);await assert.rejects(report(db),/Acesso/);
  await assert.rejects(db.query(`select srp_set_product_cost('${org}','${product}',2,10,'Não autorizado')`),/permissão/);
  await db.exec(`select set_config('test.role','owner',false);select set_config('test.access','false',false)`);await assert.rejects(report(db),/Acesso/);
  await db.exec(`select set_config('test.access','true',false);select set_config('test.password','required',false)`);await assert.rejects(report(db),/password_change_required/);
 }finally{await db.close();}
});
test('expenses are scoped, validated and audited; unsafe roles cannot register expenses',async()=>{
 const db=await database();try{
  await db.exec(`select srp_register_expense('${org}','${store}','Energia do mês','Energia',25);`);assert.equal((await report(db)).summary.expenses,25);
  assert.equal((await db.query("select count(*)::int n from srp_operation_events where event_name='expense_registered'")).rows[0].n,1);
  await assert.rejects(db.query(`select srp_register_expense('${org}','${foreign}','Energia','Energia',25)`),/inválida/);
  await assert.rejects(db.query(`select srp_register_expense('${org}','${store}','Energia','Energia',-1)`),/inválida/);
  await db.exec(`select set_config('test.role','stockist',false)`);await assert.rejects(db.query(`select srp_register_expense('${org}','${store}','Energia','Energia',25)`),/permissão/);
 }finally{await db.close();}
});
test('purchase demand uses the stronger weekly history with 15 percent safety, and explicit zero cost is valid',async()=>{
 const db=await database();try{
  await db.exec(`insert into srp_sale_items(organization_id,sale_id,product_id,quantity,unit_price,total) values('${org}','${sale}','${product}',100,10,1000);`);
  let r=await report(db);assert.equal(r.stock.find(x=>x.id===product).target,117);assert.equal(r.stock.find(x=>x.id===product).suggested,112);
  await db.exec(`update srp_products set active=true,fulfillment='encomenda' where id='${id(6)}'`);
  r=await report(db);assert.equal(r.stock.find(x=>x.id===id(6)).suggested,50);
  await db.exec(`select srp_set_product_cost('${org}','${product}',0,10,'Produto com custo zero confirmado');insert into srp_sale_items(id,organization_id,sale_id,product_id,quantity,unit_price,total) values('${id(88)}','${org}','${sale}','${product}',1,10,10);`);
  assert.equal(Number((await db.query(`select unit_cost_snapshot from srp_sale_items where id='${id(88)}'`)).rows[0].unit_cost_snapshot),0);
  r=await report(db);assert.equal(r.products.find(x=>x.id===product).cost_known,true);
 }finally{await db.close();}
});
