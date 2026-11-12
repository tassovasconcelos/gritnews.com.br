// Local-only test service. No production credentials or tables are used.
import {fileURLToPath} from 'node:url';import path from 'node:path';
import {createServer} from 'vite';import react from '@vitejs/plugin-react';
import {retailFixture} from '../../../../packages/operations/tests/fixtures/srp-retail.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),client=fileURLToPath(new URL('./client.ts',import.meta.url));
const db=await retailFixture();await db.exec(`reset role;
alter table srp_stores add column created_at timestamptz default now();
alter table srp_organizations add column logo_url text,add column primary_color text default '#607f55',add column phone text;
update srp_organizations set name='Padaria de demonstração';
alter table srp_products add column barcode text;
update srp_products set name='Pão francês',unit='UN',sale_price=.8 where id='00000000-0000-4000-8000-000000000030';
insert into srp_products(id,organization_id,name,unit,sale_price,cost_price,barcode) values('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000010','Bolo de milho','UN',15,7,'12345');
insert into srp_inventory(organization_id,store_id,product_id,quantity) values('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000032',20);
grant select on all tables in schema public to authenticated;set role authenticated;
`);
const allowed=['srp_stores','srp_organizations','srp_products','srp_inventory','srp_sales','srp_cash_registers'];
const server=await createServer({root,configFile:false,plugins:[react(),{name:'retail-local-fixture',enforce:'pre',resolveId(source,importer){if(importer?.includes('sr-padeiro')&&['./lib/supabase','./supabase'].includes(source))return client;},configureServer(server){server.middlewares.use('/qa-api',async(req,res)=>{try{let raw='';for await(const chunk of req)raw+=chunk;if(raw.length>60000)throw Error('large');const b=JSON.parse(raw);let data;
 if(b.type==='rpc'){if(!['srp_counter','srp_retail'].includes(b.fn))throw Error('unsupported_fixture_rpc');const args=b.args;data=(await db.query(`select public.${b.fn}($1,$2,$3) result`,[args.p_action,args.p_org,args.p_payload])).rows[0].result;}
 else if(b.table==='operation_preferences')data=null;
 else {if(!allowed.includes(b.table))throw Error('unsupported_fixture_table');const values=[];const where=(b.filters||[]).map(([field,op,value])=>{if(!/^[a-z_]+$/.test(field)||!['=','>='].includes(op))throw Error('invalid_filter');values.push(value);return `"${field}" ${op} $${values.length}`;}).join(' and ');const rows=(await db.query(`select * from public.${b.table}${where?' where '+where:''}`,values)).rows;data=b.single?rows[0]||null:rows;}
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data,error:null}));
 }catch(e){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:null,error:{message:e.message,code:e.code}}));}});}}],server:{host:'127.0.0.1',port:5182,strictPort:true,fs:{allow:[path.resolve(root,'../..')]}}});
await server.listen();console.log('Retail local fixture: http://127.0.0.1:5182/scripts/retail-preview/index.html?section=pos');

