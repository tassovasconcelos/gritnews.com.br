import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { simulateCeara } from '../supabase/functions/fiscal-nfce/simulator.mjs';
import { renderReceipt, defaultPreferences } from '../../../packages/operations/src/receipt.ts';

const tenant='10000000-0000-0000-0000-000000000001';
const other='10000000-0000-0000-0000-000000000002';
const owner='20000000-0000-0000-0000-000000000001';
const attendant='20000000-0000-0000-0000-000000000002';
const order='30000000-0000-0000-0000-000000000001';
test('migration: obligation, RLS, permissions, idempotency and uncertain recovery',async()=>{
 const db=new PGlite();
 try {
  // Minimal existing schema contract; test executes the unmodified fiscal migration.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
   create schema auth; create schema private;
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema public,private,auth to authenticated,service_role;
   create table auth.users(id uuid primary key);
   create table public.tenants(id uuid primary key,owner_user_id uuid);
   create table public.tenant_users(tenant_id uuid,user_id uuid,active boolean,role text);
   create table public.orders(id uuid primary key,tenant_id uuid,status text,total numeric,closed_at timestamptz,subtotal numeric,discount numeric default 0,customer_id uuid,label text default 'Mesa 1',settlement_status text,closed_by uuid);
   create table public.order_items(order_id uuid,tenant_id uuid,product_id uuid,product_name text,quantity numeric,unit_price numeric,total numeric);
   create table public.products(id uuid primary key,tenant_id uuid,stock_qty numeric);
   create table public.customer_credit_accounts(tenant_id uuid,customer_id uuid,enabled boolean);
   create table public.customer_credit_entries(tenant_id uuid,customer_id uuid,order_id uuid,entry_type text,amount numeric,description text,created_by uuid);
   create table public.payments_received(tenant_id uuid,order_id uuid,method text,amount numeric,created_by uuid);
   create table public.audit_logs(tenant_id uuid,user_id uuid,action text,entity text,entity_id text,metadata jsonb);
   insert into auth.users values('${owner}'),('${attendant}');
   insert into tenants values('${tenant}','${owner}'),('${other}','${attendant}');
   insert into tenant_users values('${tenant}','${attendant}',true,'attendant');
   insert into orders(id,tenant_id,status,total) values('${order}','${tenant}','open',20);
   insert into order_items values('${order}','${tenant}',null,'Carne',2,10,20);
   grant select on tenants to authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261029133731_fiscal_nfce_homologation.sql',import.meta.url),'utf8'));
  await db.exec(`create function private.user_has_tenant_access(t uuid) returns boolean language sql as $$ select private.fiscal_access(t) $$;`);
  await db.exec(await readFile(new URL('../supabase/migrations/20260817203200_inventory_movements_on_sale.sql',import.meta.url),'utf8'));
  await db.exec(`select set_config('request.jwt.claim.sub','${owner}',false);`);
  const close=()=>db.query('select private.close_order_atomic_internal($1,$2,$3,20,\'pix\',null) as result',[tenant,order,owner]);
  assert.equal((await close()).rows[0].result.ok,true);
  assert.equal((await close()).rows[0].result.already_closed,true);
  assert.equal((await db.query('select count(*)::int as n from payments_received')).rows[0].n,1);
  let d=(await db.query('select * from fiscal_documents')).rows[0];
  assert.equal(d.obligation_pending,true); assert.equal(d.snapshot.total,20);
  await assert.rejects(db.exec(`update order_items set quantity=3 where order_id='${order}';`),/sale_items_locked/);
  await assert.rejects(db.exec(`update orders set total=1 where id='${order}';`),/closed_sale_locked/);
  await assert.rejects(db.exec(`update orders set status='open' where id='${order}';`),/closed_sale_locked/);
  await db.exec(`update orders set status='closed' where id='${order}';`);
  assert.equal((await db.query('select count(*)::int as n from fiscal_documents')).rows[0].n,1);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`);
  await db.exec(`insert into fiscal_settings(tenant_id,cnpj,state_registration,legal_name) values('${tenant}','12345678000190','123','Empresa');`);
  await assert.rejects(db.exec(`update fiscal_documents set obligation_pending=false;`),/permission denied/);
  await assert.rejects(db.exec(`insert into fiscal_settings(tenant_id,cnpj,state_registration,legal_name) values('${other}','12345678000190','123','Outra');`),/row-level security/);
  const claim=async()=> (await db.query('select public.claim_fiscal_simulation($1,$2) as d',[tenant,order])).rows[0].d;
  d=await claim();const attempt=d.attempt_id;
  assert.equal((await claim()).attempt_id,attempt);
  await assert.rejects(db.query('select finish_fiscal_simulation($1,$2,$3,$4)',[d.id,attempt,'simulated','SIMULATED_100']),/permission denied/);
  await db.exec(`select set_config('request.jwt.claim.sub','${attendant}',false);`);
  assert.equal((await db.query('select count(*)::int as n from fiscal_documents')).rows[0].n,1);
  await assert.rejects(claim(),/forbidden/);
  assert.equal((await db.query(`update fiscal_settings set legal_name='Intruso' returning tenant_id`)).rows.length,0);
  await db.exec(`reset role; update tenant_users set active=false; set role authenticated;`);
  assert.equal((await db.query('select count(*)::int as n from fiscal_documents')).rows[0].n,0);
  await db.exec(`reset role; set role service_role;`);
  await db.query('select finish_fiscal_simulation($1,$2,$3,$4)',[d.id,attempt,'unknown','COMMUNICATION_UNKNOWN']);
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`);
  assert.equal((await claim()).attempt_id,attempt);
  const result=await simulateCeara(d);
  await db.exec('reset role; set role service_role;');
  await db.query('select finish_fiscal_simulation($1,$2,$3,$4)',[d.id,attempt,result.status,result.code]);
  await db.query('select finish_fiscal_simulation($1,$2,$3,$4)',[d.id,attempt,'unknown','COMMUNICATION_UNKNOWN']);
  const final=(await db.query('select * from fiscal_documents')).rows[0];
  assert.equal(final.status,'simulated');assert.equal(final.obligation_pending,true);
  assert.equal((await db.query("select count(*)::int as n from fiscal_events where event='simulation_simulated'")).rows[0].n,1);
  await db.exec('reset role; set role anon;');
  await assert.rejects(db.query('select * from fiscal_documents'),/permission denied/);
 } finally { await db.close(); }
});
test('simulator: success, rejection, timeout, repeated consultation and production block',async()=>{
 const d={attempt_id:'fixed',environment:'homologacao',snapshot:{total:20,items:[{name:'Carne'}]}};
 assert.deepEqual(await simulateCeara(d),await simulateCeara(d));
 assert.equal((await simulateCeara(d,'reject')).status,'rejected');
 await assert.rejects(simulateCeara(d,'timeout'),/communication_unknown/);
 await assert.rejects(simulateCeara({...d,environment:'producao'}),/production_blocked/);
 assert.equal((await simulateCeara({...d,snapshot:{items:[],total:0}})).status,'rejected');
});
test('thermal receipt identifies non-fiscal nature, totals, payment and escapes injected HTML',()=>{
 const html=renderReceipt({id:order,label:'<script>alert(1)</script>',date:'2026-10-29T12:00:00Z',payment:'PIX',total:20,
  items:[{name:'<img src=x onerror=alert(1)>',quantity:2,unitPrice:10}]},
  {...defaultPreferences,businessName:'Empresa & Cia',address:'Rua <1>',phone:'123'});
 assert.match(html,/RECIBO NÃO FISCAL/);assert.match(html,/Não substitui a NFC-e obrigatória/);
 assert.match(html,/20,00/);assert.match(html,/Pagamento: PIX/);
 assert.doesNotMatch(html,/<script|<img/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Empresa &amp; Cia/);
});
