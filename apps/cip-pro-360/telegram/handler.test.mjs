import * as responseStyle from './response-style.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import * as reference from './stock-reference.mjs';
import * as readiness from './ai-readiness.mjs';
import * as erp from './erp-reports.mjs';
import * as executive from './executive-reports.mjs';
import * as setup from './setup.mjs';
import * as ai from './ai.mjs';
import * as conversation from './conversation.mjs';
import * as intents from './intents.mjs';
const src=stripTypeScriptTypes(readFileSync(new URL('./index.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''));
const company='shopping_prohospital',other='distribuidora_prohospital',secret='x'.repeat(32);
const ref={available:true,company,kind:'summary',sources:[{scope:'cd100_partial',source:'SYNTHETIC',reference_date:null,loaded_at:'2026-10-19T12:00:00Z',summary:{rows:1,skus:1,cost:'10.00',cost_review:0,zero_cost:0},items:[],units:[]}]};
async function invoke(text,{authorized=true,scope='all',rpcError=false,header=secret,audio=false,current=false,currentError=false,intelligence=false,lastKind=null,lastQuery=null,callback=null}={}){
 const messages=[],calls=[];let handler;
 const db={rpc:async(name,args)=>{calls.push({name,args});
  if(name==='cip_bot_config_read')return {data:{token:'123:'+ 'a'.repeat(24),secret,interaction_version:4,ai_enabled:audio,ai_key:audio?'sk-'+ 'a'.repeat(30):null}};
  if(name==='cip_bot_context')return {data:{authorized,companies:[company,other],all:scope==='all',company:scope,last_kind:lastKind,last_query:lastQuery}};
  if(name==='cip_bot_claim')return {data:'claimed'};
  if(name==='cip_bot_ai_claim')return {data:true};
  if(name==='cip_bot_choose_company')return {data:true};
  if(name==='cip_bot_erp_get')return {data:null};
  if(name==='cip_bot_stock_intelligence')return {data:intelligence&&args.p_company===other?{available:true,batch:{company_id:other,status:'active',as_of:'2026-10-19',sources:[{file:'SYNTHETIC',hash:'a'.repeat(64)}],summary:{metrics:1,skus:1,alerts:{vencido:0,validade_90d:1},actions:{campanha:1,conferencia:0},tax_cost_available:'7.50',tax_missing:0}},filtered_total:1,filtered_cost:'7.01',items:[]}:{available:false}};
  if(name==='cip_bot_shopping_stock')return currentError?{error:{}}:{data:current&&args.p_company===company?{available:true,source_kind:'shopping_position',company,scope:args.p_scope,query:args.p_query,store:args.p_store,batch:{source_hash:'a'.repeat(64),status:'reference_unreconciled',as_of:'2026-10-19',source_file:'SYNTHETIC.xlsx',summary:{last_sale_max:'2025-04-08'}},summary:{rows:1,skus:1,stores:1,declared_cost:'22.01',declared_accounting:'21.00',declared_potential:'50.00'},alerts:{protect_stock:1},items:[],units:[]}:{available:false}};
  if(name==='cip_bot_stock_reference')return rpcError?{error:{}}:{data:args.p_company===company?ref:{available:false}};
  return {data:true};},from:()=>({update:()=>({eq:async()=>({})})})};
 const dependencies={...responseStyle,...reference,...readiness,...erp,...executive,...setup,...ai,...conversation,...intents,transcribe:async()=>text,classify:async()=>({kind:'inventory',company:'current'}),Deno:{env:{get:()=> 'synthetic'},serve:fn=>handler=fn},createClient:()=>db,fetch:async(url,opts)=>{if(url.endsWith('/sendMessage'))messages.push(JSON.parse(opts.body));return new Response(JSON.stringify({ok:true}));}};
 Function(...Object.keys(dependencies),src)(...Object.values(dependencies));
 const message={chat:{id:123,type:'private'},from:{id:123,is_bot:false},...(audio?{voice:{file_id:'synthetic',duration:10,file_size:50}}:{text})};
 const response=await handler(new Request('https://synthetic.test',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':header},body:JSON.stringify(callback?{update_id:1,callback_query:{id:'callback',from:{id:123},message:{chat:{id:123,type:'private'}},data:callback}}:{update_id:1,message})}));
 return {response,messages,calls};
}
test('webhook inventory connects authorized ERP fallback to one executive answer',async()=>{
 const r=await invoke('/estoque');assert.equal(r.response.status,200);assert.equal(r.messages.length,1);assert.match(r.messages[0].text,/^Olá!.*\n\nCusto declarado/);assert.match(r.messages[0].text,/R\$ 10,00/);assert.match(r.messages[0].text,/Distribuidora Prohospital: sem base/);assert.ok(r.calls.some(c=>c.name==='cip_bot_stock_reference'));
});
test('direct combined reference request and audio keep same summary and memory',async()=>{
 for(const audio of [false,true]){const r=await invoke('Unifique estoque CD100 e lojas',{audio});assert.equal(r.response.status,200);assert.doesNotMatch(r.messages[0].text,/Composição e memória de cálculo/);assert.equal(r.messages[0].reply_markup.inline_keyboard[0][0].callback_data,'report_details');assert.equal(r.calls.filter(c=>c.name==='cip_bot_stock_reference')[0].args.p_scope,'both');}
});
test('invalid secret or revoked binding never reads financial sources',async()=>{
 for(const options of [{header:'invalid'},{authorized:false}]){const r=await invoke('/estoque',options);assert.ok(!r.calls.some(c=>c.name==='cip_bot_erp_get'||c.name==='cip_bot_stock_reference'));}
});
test('reference RPC failure never produces partial successful financial message',async()=>{
 const r=await invoke('/estoque',{rpcError:true});assert.equal(r.response.status,503);assert.equal(r.messages.length,0);
});
test('sales does not substitute provisional stock',async()=>{
 const r=await invoke('/vendas');assert.equal(r.response.status,200);assert.match(r.messages[0].text,/Não há informação validada/);assert.ok(!r.calls.some(c=>c.name==='cip_bot_stock_reference'));
});

test('current dated position wins for text and voice, never adds old Shopping references',async()=>{
 for(const audio of [false,true]){const r=await invoke('/marcapasso',{current:true,audio,scope:company});assert.equal(r.response.status,200);assert.match(r.messages[0].text,/^Olá!.*\n\nEstoque valorizado no filtro: R\$ 22,01/);assert.match(r.messages[0].text,/2025-04-08/);assert.ok(!r.calls.some(c=>c.name==='cip_bot_stock_reference'));}
});
test('failed current source does not silently answer from an older workbook',async()=>{
 const r=await invoke('/bases',{currentError:true});assert.equal(r.response.status,503);assert.equal(r.messages.length,0);assert.ok(!r.calls.some(c=>c.name==='cip_bot_stock_reference'));
});
test('B2B dated lots are returned directly and CD100 never includes the distributor warehouse',async()=>{
 const r=await invoke('/bases',{intelligence:true,scope:other});assert.equal(r.response.status,200);assert.match(r.messages[0].text,/^Olá!.*\n\nEstoque B2B no filtro.*R\$ 7,01/);assert.ok(!r.calls.some(c=>c.name==='cip_bot_stock_reference'));
 const cd=await invoke('/cd',{intelligence:true,scope:other});assert.equal(cd.response.status,200);assert.ok(!cd.calls.some(c=>c.name==='cip_bot_stock_intelligence'));assert.doesNotMatch(cd.messages[0].text,/R\$ 7,01/);
});


test('detail callback reauthorizes and rereads the exact previous CD product filters',async()=>{
 const lastQuery=JSON.stringify({query:'luva',store:'5',scope:'cd100_partial'});
 const r=await invoke('',{scope:company,current:true,callback:'report_details',lastKind:'stock_product',lastQuery});
 assert.equal(r.response.status,200);assert.match(r.messages[0].text,/Composição e memória de cálculo/);
 const call=r.calls.find(c=>c.name==='cip_bot_shopping_stock');assert.equal(call.args.p_query,'luva');assert.equal(call.args.p_store,'5');assert.equal(call.args.p_scope,'cd');
 assert.equal(r.messages.at(-1).reply_markup.inline_keyboard[0][0].callback_data,'report_summary');
});
test('expired follow-up and revoked binding never fetch a business source',async()=>{
 for(const opts of [{lastKind:null},{lastKind:'sql'},{authorized:false}]){
  const r=await invoke('',{callback:'report_details',...opts});assert.equal(r.response.status,200);assert.ok(!r.calls.some(c=>['cip_bot_shopping_stock','cip_bot_erp_get','cip_bot_stock_reference'].includes(c.name)));
 }
});
test('summary callback returns brief answer and does not spend an AI request',async()=>{
 const r=await invoke('',{scope:company,current:true,callback:'report_summary',lastKind:'inventory',lastQuery:JSON.stringify({query:'',store:'',scope:'both'})});
 assert.equal(r.response.status,200);assert.doesNotMatch(r.messages[0].text,/Composição e memória/);assert.ok(r.messages[0].text.length<900);assert.ok(!r.calls.some(c=>c.name==='cip_bot_ai_claim'));
});
