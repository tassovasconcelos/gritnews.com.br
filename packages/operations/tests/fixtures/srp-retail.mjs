import {readFile} from 'node:fs/promises';
import {fixture,org,store,owner,cash} from './srp-counter.mjs';
export async function retailFixture(){
 const db=await fixture();await db.exec(`reset role;
 create table srp_customers(id uuid primary key default gen_random_uuid(),organization_id uuid not null references srp_organizations(id),name text not null,phone text,created_at timestamptz default now());
 alter table srp_cash_registers add column opened_by uuid,add column opened_at timestamptz default now(),add column opening_amount numeric default 0,add column counted_amount numeric,add column expected_amount numeric,add column closed_at timestamptz;
 update srp_cash_registers set opening_amount=20,opened_by='${owner}' where id='${cash}';
 `);
 await db.exec(await readFile(new URL('../../../../apps/sr-padeiro/supabase/retail-modules.sql',import.meta.url),'utf8'));
 await db.exec(`set role authenticated`);return db;
}
export async function retailCall(db,action,payload={},scope=org){return (await db.query('select public.srp_retail($1,$2,$3) r',[action,scope,{store_id:store,...payload}])).rows[0].r;}
