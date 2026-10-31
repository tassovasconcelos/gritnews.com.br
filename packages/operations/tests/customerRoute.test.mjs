import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {customerRoute,operationLinks,installedCustomerPath} from '../src/customerRoute.ts';
import {confirmationRedirect} from '../src/authLinks.ts';
import {preserveOperationSession} from '../src/scope.ts';
const migration=new URL('../../../apps/meu-espetinho/supabase/migrations/20261030114459_customer_named_access_routes.sql',import.meta.url);
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

test('named entry: strict slugs, no decoding or extra path segments, company survives login and installation',()=>{
 assert.deepEqual(customerRoute('/app/orlandinhobar'),{slug:'orlandinhobar',invalid:false});
 for(const path of ['/app/../admin','/app/a%2fb','/app/x/y','/app/%20','/app/UPPER','/app/a','/app/'+ 'x'.repeat(81)])assert.equal(customerRoute(path).invalid,true,path);
 assert.deepEqual(customerRoute('/app'),{slug:null,invalid:false});
 assert.equal(preserveOperationSession('',false,'/app/orlandinhobar'),true);
 assert.equal(installedCustomerPath('/app',true,'orlandinhobar'),'/app/orlandinhobar');
 assert.equal(installedCustomerPath('/app',false,'orlandinhobar'),'/app');
 assert.equal(installedCustomerPath('/app/deliciadepao',true,'orlandinhobar'),'/app/deliciadepao');
 assert.equal(installedCustomerPath('/app',true,'../admin'),'/app');
 const links=operationLinks('https://meuespetinho.gritnews.com.br',id(1),'orlandinhobar');
 assert.equal(links.access,'https://meuespetinho.gritnews.com.br/app/orlandinhobar');
 assert.equal(links.install,'https://meuespetinho.gritnews.com.br/instalar?cliente=orlandinhobar');
 assert.equal(confirmationRedirect('https://example.invalid','?operation_scope='+id(9)+'&next=https://evil.invalid&convite=secret','/app/orlandinhobar'),'https://example.invalid/app/orlandinhobar');
});

test('database: aliases, automatic unique links, active membership, anonymous and password guard',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.tenants(id uuid primary key,owner_user_id uuid,name text);
 create table public.srp_organizations(id uuid primary key,owner_user_id uuid,name text,slug text);
 create table public.tenant_users(tenant_id uuid,user_id uuid,role text,active boolean);
 create table public.srp_members(organization_id uuid,user_id uuid,role text,active boolean);
 create table public.admin_users(user_id uuid,active boolean,role text);
 create table public.operation_support_sessions(app text,scope_id uuid,admin_id uuid,revoked_at timestamptz,expires_at timestamptz);
 create function public.ops_account_request_guard() returns void language plpgsql as $$begin if current_setting('test.password_block',true)='yes' then raise exception 'password_change_required';end if;end$$;
 grant usage on schema public,private,auth to authenticated;
 insert into tenants values('ad825690-65b5-4a60-8c2a-6d4376132afc','${id(1)}','Orlandinho bar');
 insert into srp_organizations values('10378360-6534-4bf7-b6ae-85bfaaed0e01','${id(2)}','Padaria Delícias do Pão','delicias-do-pao');
 insert into tenant_users values('ad825690-65b5-4a60-8c2a-6d4376132afc','${id(3)}','cashier',true);
 insert into admin_users values('${id(4)}',true,'superadmin');`);
 const base=await readFile(new URL('../../../apps/meu-espetinho/supabase/migrations/20261029141711_shared_operations_settings_catalog_team.sql',import.meta.url),'utf8');
 await db.exec(base.slice(base.indexOf('create function private.ops_super'),base.indexOf('create function private.ops_catalog_access')));
 await db.exec(await readFile(migration,'utf8'));
 const as=async n=>{await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false);`)};
 const resolve=async(app,slug)=> (await db.query('select public.ops_customer_route($1,$2) result',[app,slug])).rows[0].result;
 await as(1);assert.equal((await resolve('meu-espetinho','orlandinhobar')).scope_id,'ad825690-65b5-4a60-8c2a-6d4376132afc');
 await assert.rejects(resolve('sr-padeiro','deliciadepao'),/scope_unavailable/);
 await assert.rejects(resolve('meu-espetinho','missing'),/scope_unavailable/);
 await as(2);assert.equal((await resolve('sr-padeiro','deliciadepao')).scope_id,(await resolve('sr-padeiro','delicias-do-pao')).scope_id);
 await as(3);assert.ok(await resolve('meu-espetinho','orlandinhobar'));
 await db.exec('reset role;update tenant_users set active=false;');await as(3);
 await assert.rejects(resolve('meu-espetinho','orlandinhobar'),/scope_unavailable/);
 await as(4);assert.ok(await resolve('sr-padeiro','deliciadepao'));
 await db.exec("select set_config('test.password_block','yes',false)");await assert.rejects(resolve('sr-padeiro','deliciadepao'),/password_change_required/);
 await db.exec("reset role;select set_config('test.password_block','no',false);set role anon;");
 await assert.rejects(resolve('sr-padeiro','deliciadepao'),/permission denied/);
 await db.exec(`reset role;insert into tenants values('${id(10)}','${id(1)}','Mesmo Nome'),('${id(11)}','${id(1)}','Mesmo Nome');`);
 const routes=(await db.query("select slug from private.operation_routes where scope_id in ($1,$2)",[id(10),id(11)])).rows;
 assert.equal(new Set(routes.map(x=>x.slug)).size,2);
 await as(1);await assert.rejects(db.query('select * from private.operation_routes'),/permission denied/);
 }finally{await db.close()}
});
