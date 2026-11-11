import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../apps/sr-padeiro/package.json',import.meta.url));
const ts=require('typescript');
const src=fs.readFileSync(new URL('../src/supportNavigation.ts',import.meta.url),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};new Function('exports',js)(mod.exports);
const {supportOperationUrl,operationSection,startOperationSupport,loadOperationClients}=mod.exports;
const id='00000000-0000-4000-8000-000000000010';

test('central: atalhos preservam cliente, plataforma e área, sem autorizar por URL',()=>{
 for(const [app,key,area,section] of [['meu-espetinho','support_tenant','purchases','shopping'],['sr-padeiro','support_org','stock','stock'],['meu-espetinho','support_tenant','team','users'],['sr-padeiro','support_org','settings','more']]){
  const url=new URL(supportOperationUrl(app,id,area));assert.equal(url.hostname,app==='meu-espetinho'?'meuespetinho.gritnews.com.br':'srpadeiro.gritnews.com.br');assert.equal(url.searchParams.get(key),id);assert.equal(url.searchParams.get('section'),section);
 }
 assert.equal(operationSection('meu-espetinho','settings'),'settings');assert.equal(operationSection('sr-padeiro','settings'),'more');assert.equal(operationSection('meu-espetinho','admin'),null);
 assert.throws(()=>supportOperationUrl('sr-padeiro','other-company'));assert.throws(()=>supportOperationUrl('unknown',id));
});

test('central: só retorna destino depois de suporte válido; registra finalidade e recusa falhas/expiração',async()=>{
 const calls=[];const client={rpc:async(...args)=>{calls.push(args);return {data:{expires_at:new Date(Date.now()+3600000).toISOString()}};}};
 const target=await startOperationSupport(client,'meu-espetinho',id,'products','Implantar cardápio');
 assert.equal(new URL(target).searchParams.get('section'),'products');assert.deepEqual(calls[0],['ops_start_support',{a:'meu-espetinho',s:id,reason:'Produtos e importação: Implantar cardápio'}]);
 await assert.rejects(startOperationSupport(client,'sr-padeiro',id,'home','a'),/invalid_reason/);assert.equal(calls.length,1);
 for(const r of [{error:{message:'forbidden'}},{data:{expires_at:'invalid'}},{data:{expires_at:new Date(0).toISOString()}},{}])await assert.rejects(startOperationSupport({rpc:async()=>r},'sr-padeiro',id,'home','Implantar'),/support_unavailable/);
});

function directoryClient(role='superadmin',failure=false){const reads=[];const auth={getUser:async()=>({data:{user:{id:'admin'}}})};return {reads,auth,from(table){reads.push(table);const q={select(){return q;},eq(){return q;},order(){return q;},ilike(...args){reads.push(args);return q;},maybeSingle:async()=>({data:{active:true,role}}),range:async(from,to)=>({error:failure?new Error('offline'):null,data:[{id,name:table==='tenants'?'Bar':'Padaria',setup_status:'suspended',environment:'homologation',from,to}]})};return q;}};}

test('central: consulta ambas as carteiras com paginação e rejeita perfil comum antes de ler empresas',async()=>{
 const client=directoryClient();const r=await loadOperationClients(client,'all','',0);assert.deepEqual(r.rows.map(x=>x.app),['meu-espetinho','sr-padeiro']);assert.equal(r.rows[0].status,'suspended');assert.equal(r.more,false);
 const common=directoryClient('manager');await assert.rejects(loadOperationClients(common,'all','',0),/forbidden/);assert.deepEqual(common.reads,['admin_users']);
 const filtered=directoryClient();await loadOperationClients(filtered,'sr-padeiro','Bar_%',1);assert.equal(filtered.reads.includes('tenants'),false);assert.deepEqual(filtered.reads.find(Array.isArray),['name','%Bar\\_\\%%']);
 await assert.rejects(loadOperationClients(directoryClient('superadmin',true),'all','',0),/offline/);
});

 test('suporte: abrir catálogo vazio não cadastra amostras nem altera o cliente',async()=>{
 const code=fs.readFileSync(new URL('../../../apps/meu-espetinho/src/cloudStore.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 let writes=0;const client={from(table){const q={select(){return q},eq(){return q},order(){return q},in(){return q},limit(){return q},single:async()=>({data:{name:'Cliente vazio'}}),then(resolve){return Promise.resolve({data:table==='tenants'?{name:'Cliente vazio'}:[],error:null}).then(resolve)},insert(){writes++;throw new Error('unexpected_write')}};return q;}};
 const m={exports:{}};new Function('exports','require',compiled)(m.exports,()=>({supabase:client}));
 const result=await m.exports.hydrateCloudState(id,{seed:false});assert.equal(writes,0);assert.deepEqual(result.products,[]);assert.equal(result.settings.businessName,'Cliente vazio');
 });
