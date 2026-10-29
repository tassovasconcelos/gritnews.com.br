import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { accountHandler, temporaryPassword, passwordHash } from '../../../apps/meu-espetinho/supabase/functions/ops-admin-accounts/handler.mjs';

const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const admin=id(1),member=id(2),other=id(3),scope=id(10),foreign=id(11),sid=id(20);
const fixedNow=new Date('2026-10-29T20:00:00Z');
const fixturePassword='Aa9!This-is-a-test-only-value';
const base={app:'sr-padeiro',scope_id:scope,reason:'Configuração de acesso de teste',identity_verified:true};
function mock({context={user_id:null,protected:false},requirement=null,fresh=true,lease=true,authError=false}={}){
 const dbWrites=[],authWrites=[],reqs=new Map();if(requirement)reqs.set(admin,requirement);
 const user={id:admin,email:'admin@example.invalid',app_metadata:{}};
 const server={auth:{getUser:async()=>({data:{user},error:null}),admin:{
  createUser:async value=>{authWrites.push(value);return {data:{user:{id:member}},error:authError?new Error('auth failed'):null};},
  getUserById:async()=>({data:{user:{app_metadata:{existing:'preserved'}}},error:null}),
  updateUserById:async(u,value)=>{authWrites.push(value);return {data:{user:{id:u}},error:authError?new Error('auth failed'):null};}
 }},rpc:async(name,args)=>({data:name==='ops_account_context'?context:name==='ops_account_session'?fresh:name==='ops_account_lease'?lease:null,error:null}),
 from(table){let op='select',value,filters={};const query={select(){return query;},eq(k,v){filters[k]=v;return query;},maybeSingle(){return Promise.resolve({data:table==='operation_password_requirements'?reqs.get(filters.user_id)||null:null,error:null});},
 insert(v){op='insert';value=v;return query;},upsert(v){op='upsert';value=v;return query;},update(v){op='update';value=v;return query;},
 then(resolve,reject){if(op!=='select'){dbWrites.push({table,op,value});if(table==='operation_password_requirements'){if(op==='upsert')reqs.set(value.user_id,value);if(op==='update')reqs.set(filters.user_id,{...reqs.get(filters.user_id),...value});}}return Promise.resolve({data:op==='update'?[{user_id:filters.user_id}]:null,error:null}).then(resolve,reject);}};return query;}};
 const handler=accountHandler(server,{now:()=>fixedNow,makePassword:()=>fixturePassword});
 const invoke=async(body,headers={Authorization:'Bearer test-token'})=>{const response=await handler(new Request('https://example.invalid/ops-admin-accounts',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}));return {status:response.status,body:await response.json()};};
 return {invoke,dbWrites,authWrites,reqs,server};
}
test('managed credentials: validation, existing identities, protected accounts and explicit reset confirmation',async()=>{
 for(const [config,body,status] of [
  [{},{...base,action:'create',email:'person@example.invalid',full_name:'Test User',role:'superadmin'},400],
  [{context:{user_id:member,protected:false}},{...base,action:'create',email:'person@example.invalid',full_name:'Test User',role:'cashier'},409],
  [{context:{user_id:member,protected:true,member_active:true}},{...base,action:'reset',user_id:member,global_reset_ack:true},403],
  [{},{...base,action:'reset',user_id:member},400],
  [{},{...base,action:'reset',user_id:member,global_reset_ack:true,identity_verified:false},400],
  [{lease:false},{...base,action:'create',email:'person@example.invalid',full_name:'Test User',role:'cashier'},409]
 ]){const m=mock(config);assert.equal((await m.invoke(body)).status,status);assert.equal(m.authWrites.length,0);}
 const m=mock();assert.equal((await m.invoke({action:'status'},{})).status,401);
});
test('managed credentials: creation returns the password once, stores only a digest, and binds a scoped non-admin profile',async()=>{
 const m=mock();const r=await m.invoke({...base,action:'create',email:'person@example.invalid',full_name:'Test User',role:'cashier'});
 assert.equal(r.status,200);assert.equal(r.body.temporary_password,fixturePassword);
 assert.equal(m.authWrites[0].app_metadata.ops_password_required,true);
 assert.equal(m.authWrites[0].user_metadata.business_name,undefined);
 assert.equal(m.reqs.get(member).temporary_hash,await passwordHash(fixturePassword));
 assert.equal(JSON.stringify(m.dbWrites).includes(fixturePassword),false);
 assert.equal((await m.invoke({action:'status'})).body.temporary_password,undefined);
});
test('managed credentials: password update failure leaves the account blocked and never returns a usable credential',async()=>{
 const m=mock({context:{user_id:member,email:'person@example.invalid',email_confirmed:true,member_active:true,protected:false},authError:true});
 const r=await m.invoke({...base,action:'reset',user_id:member,global_reset_ack:true});
 assert.equal(r.status,503);assert.equal(r.body.temporary_password,undefined);assert.equal(m.reqs.get(member).required,true);
});
test('managed credentials: expired credentials, old sessions, same password and short replacements cannot complete',async()=>{
 const requirement={user_id:admin,app:'sr-padeiro',scope_id:scope,reset_id:id(30),required:true,issued_at:'2026-10-29T19:00:00Z',expires_at:'2026-10-30T19:00:00Z',temporary_hash:await passwordHash(fixturePassword)};
 for(const [config,password,status] of [[{fresh:false},'New-personal-password1',403],[{requirement:{...requirement,expires_at:'2026-10-28T19:00:00Z'}},'New-personal-password1',409],[{},fixturePassword,400],[{},'short',400]]){
  const m=mock({requirement,...config});const r=await m.invoke({action:'complete',new_password:password});assert.equal(r.status,status);assert.equal(m.authWrites.length,0);
 }
 const m=mock({requirement});assert.equal((await m.invoke({action:'complete',new_password:'New-personal-password1'})).status,200);assert.equal(m.reqs.get(admin).required,false);assert.equal(m.reqs.get(admin).temporary_hash,null);
 assert.equal(JSON.stringify(m.dbWrites).includes('New-personal-password1'),false);
});
test('temporary passwords have independent cryptographic randomness',()=>{
 const values=Array.from({length:100},()=>temporaryPassword());assert.equal(new Set(values).size,100);assert.ok(values.every(v=>v.length>=32&&v.startsWith('Aa9!')));
});

async function database(){
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create role authenticator;
 create schema auth;create schema private;create schema storage;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}',email_confirmed_at timestamptz,last_sign_in_at timestamptz);
 create table auth.sessions(id uuid primary key,user_id uuid,created_at timestamptz);
 create table public.admin_users(user_id uuid,active boolean,role text);
 create table public.profiles(id uuid primary key,full_name text);
 create table public.tenants(id uuid primary key,owner_user_id uuid);
 create table public.tenant_users(tenant_id uuid,user_id uuid,role text,active boolean,primary key(tenant_id,user_id));
 create table public.srp_organizations(id uuid primary key,owner_user_id uuid);
 create table public.srp_members(organization_id uuid,user_id uuid,role text,active boolean,primary key(organization_id,user_id));
 create table public.products(id uuid,tenant_id uuid,active boolean,stock_qty numeric);
 create table public.orders(tenant_id uuid,status text,total numeric,closed_at timestamptz);
 create table public.srp_products(organization_id uuid,active boolean,fulfillment text);
 create table public.srp_sales(organization_id uuid,status text,total numeric,created_at timestamptz);
 create table public.srp_inventory(organization_id uuid,quantity numeric,minimum_quantity numeric);
 create table public.operation_audit(app text,scope_id uuid,actor_id uuid,action text,details jsonb);
 create table storage.objects(id uuid);alter table storage.objects enable row level security;
 create function private.ops_super() returns boolean language sql security definer set search_path='' as $$select exists(select 1 from public.admin_users where user_id=auth.uid() and active and role='superadmin')$$;
 grant usage on schema public,auth,private,storage to authenticated,service_role;
 grant select on products to authenticated;alter table products enable row level security;
 create policy ordinary_products_read on products for select to authenticated using(true);
 insert into auth.users(id,email,email_confirmed_at) values('${admin}','admin@example.invalid',now()),('${member}','member@example.invalid',now()),('${other}','other@example.invalid',now());
 insert into admin_users values('${admin}',true,'superadmin');
 insert into tenants values('${scope}','${member}'),('${foreign}','${other}');
 insert into srp_organizations values('${scope}','${member}'),('${foreign}','${other}');
 insert into tenant_users values('${scope}','${member}','manager',true);
 insert into srp_members values('${scope}','${member}','manager',true);
 insert into products values('${id(50)}','${scope}',true,2);
 insert into orders values('${scope}','closed',40,now()),('${scope}','closed',20,now()-interval '40 days'),('${scope}','open',10,null);
 insert into auth.sessions values('${sid}','${member}',now()-interval '1 day'),('${id(21)}','${member}',now()+interval '1 minute');`);
 await db.exec(await readFile(new URL('../../../apps/meu-espetinho/supabase/migrations/20261029192746_managed_accounts_and_client_success.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../../../apps/meu-espetinho/supabase/migrations/20261029194351_managed_account_session_revocation.sql',import.meta.url),'utf8'));return db;
}
test('database: gate blocks existing sessions, direct tables and privileged RPC entry before a required password change',async()=>{
 const db=await database();try{
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${member}',false);select public.ops_account_request_guard();`);
  assert.equal((await db.query('select count(*)::int n from products')).rows[0].n,1);
  await db.exec(`reset role;insert into operation_password_requirements(user_id,app,scope_id,reset_id,issued_at,expires_at,created_by) values('${member}','sr-padeiro','${scope}','${id(30)}',now(),now()+interval '24 hours','${admin}');set role authenticated;`);
  await assert.rejects(db.query('select public.ops_account_request_guard()'),/password_change_required/);
  assert.equal((await db.query('select count(*)::int n from products')).rows[0].n,0);
  await assert.rejects(db.query('update operation_password_requirements set required=false'),/permission denied/);
  await assert.rejects(db.query(`select public.ops_account_context('${admin}','sr-padeiro','${scope}',null,'${member}')`),/permission denied/);
  await db.exec(`reset role;update operation_password_requirements set required=false;update auth.users set raw_app_meta_data='{"ops_password_required":true}' where id='${member}';set role authenticated;`);
  await assert.rejects(db.query('select public.ops_account_request_guard()'),/password_change_required/);
  await db.exec(`reset role;update auth.users set raw_app_meta_data='{}' where id='${member}';set role authenticated;`);
  await assert.rejects(db.query('select public.ops_account_request_guard()'),/password_change_required/);
  await db.exec(`select set_config('request.jwt.claims','{"session_id":"${id(21)}"}',false);select public.ops_account_request_guard();`);
  assert.equal((await db.query('select count(*)::int n from products')).rows[0].n,1);
 }finally{await db.close();}
});
test('database: account scope, administrator protection, server-only leases and fresh-session proof',async()=>{
 const db=await database();try{
  await db.exec('set role service_role');
  const context=(await db.query(`select public.ops_account_context('${admin}','sr-padeiro','${scope}',null,'${admin}') c`)).rows[0].c;assert.equal(context.protected,true);
  const foreignContext=(await db.query(`select public.ops_account_context('${admin}','sr-padeiro','${foreign}',null,'${member}') c`)).rows[0].c;assert.equal(foreignContext.member_active,false);
  await assert.rejects(db.query(`select public.ops_account_context('${member}','sr-padeiro','${scope}',null,'${other}')`),/forbidden/);
  assert.equal((await db.query(`select public.ops_account_session('${member}','${sid}',now()) ok`)).rows[0].ok,false);
  assert.equal((await db.query(`select public.ops_account_session('${member}','${id(21)}',now()) ok`)).rows[0].ok,true);
  assert.equal((await db.query(`select public.ops_account_session('${other}','${id(21)}',now()) ok`)).rows[0].ok,false);
  const lease=async(k,done=false)=>(await db.query('select public.ops_account_lease($1,$2,$3) ok',['member@example.invalid',k,done])).rows[0].ok;
  assert.equal(await lease(id(31)),true);assert.ok(!await lease(id(32)));assert.equal(await lease(id(32),true),false);assert.equal(await lease(id(31),true),true);assert.equal(await lease(id(32)),true);
 }finally{await db.close();}
});
test('database: support indicators use real periods and only a Super Admin can save client plans',async()=>{
 const db=await database();try{
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${member}',false);`);
  await assert.rejects(db.query(`select public.ops_client_success('meu-espetinho','${scope}')`),/forbidden/);
  await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false);`);
  const r=(await db.query(`select public.ops_client_success('meu-espetinho','${scope}') r`)).rows[0].r;
  assert.equal(r.revenue_30d,40);assert.equal(r.previous_revenue_30d,20);assert.equal(r.ticket_30d,40);assert.equal(r.open_orders,1);
  await db.query(`select public.ops_success_plan_save('meu-espetinho','${scope}',1000,'Treinar caixa','Responsável',current_date)`);
  const updated=(await db.query(`select public.ops_client_success('meu-espetinho','${scope}') r`)).rows[0].r;assert.equal(updated.plan.revenue_goal,1000);assert.equal(updated.plan.next_action,'Treinar caixa');
 }finally{await db.close();}
});
