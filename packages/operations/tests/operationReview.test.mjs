import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('homologação: superadmin exclusivo, escopo, checklist, histórico e proteção de senha',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table auth.users(id uuid primary key);insert into auth.users values('${id(1)}'),('${id(2)}');
 create table public.admin_users(user_id uuid,active boolean,role text);insert into admin_users values('${id(1)}',true,'superadmin');
 create function private.ops_super() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admin_users where user_id=auth.uid() and active and role='superadmin')$$;
 create function public.ops_account_request_guard() returns void language plpgsql as $$begin if current_setting('test.password_block',true)='yes' then raise exception 'password_change_required';end if;end$$;
 create table public.tenants(id uuid);create table public.srp_organizations(id uuid);
 insert into tenants values('${id(10)}');insert into srp_organizations values('${id(11)}');
 create table public.operation_audit(app text,scope_id uuid,actor_id uuid,action text,details jsonb);
 grant usage on schema public,private,auth to authenticated;`);
 await db.exec(await readFile(new URL('../../../apps/meu-espetinho/supabase/migrations/20261030140605_superadmin_operation_review.sql',import.meta.url),'utf8'));
 const as=async n=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false)`);
 const call=async(app,scope,payload=null)=>(await db.query('select public.ops_operation_review($1,$2,$3) result',[app,id(scope),payload])).rows[0].result;
 await as(2);await assert.rejects(call('meu-espetinho',10),/superadmin_required/);
 await as(1);assert.equal((await call('sr-padeiro',11)).status,'pending');
 await assert.rejects(call('sr-padeiro',10),/scope_not_found/);
 await assert.rejects(call('meu-espetinho',10,{status:'approved',checks:{},notes:'Conferido'}),/incomplete_review/);
 await assert.rejects(call('meu-espetinho',10,{status:'pending',checks:{identity:'true'},notes:''}),/invalid_checks/);
 await assert.rejects(call('meu-espetinho',10,{status:'pending',checks:{injected:true},notes:''}),/invalid_checks/);
 const checks=Object.fromEntries(['identity','team','catalog','stock','sale','cash','receipt'].map(k=>[k,true]));
 const saved=await call('meu-espetinho',10,{status:'approved',checks,notes:'Fluxos conferidos no ambiente de teste'});
 assert.equal(saved.updated_by,id(1));assert.equal(saved.status,'approved');
 assert.equal((await call('sr-padeiro',11)).status,'pending');
 await call('meu-espetinho',10,{status:'needs_attention',checks:{sale:false},notes:'Reabrir treinamento'});
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from operation_audit')).rows[0].n,2);
 await as(1);await assert.rejects(db.query('select * from private.operation_reviews'),/permission denied/);
 await db.exec("select set_config('test.password_block','yes',false)");await assert.rejects(call('meu-espetinho',10),/password_change_required/);
 await db.exec("reset role;select set_config('test.password_block','no',false);update admin_users set active=false;");await as(1);await assert.rejects(call('sr-padeiro',11),/superadmin_required/);
 await db.exec('reset role;set role anon');await assert.rejects(call('sr-padeiro',11),/permission denied/);
 }finally{await db.close()}
});
