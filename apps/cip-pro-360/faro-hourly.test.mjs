import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createFaroWorker} from './market-faro/handler.mjs';import {researchRequest,parseResearch} from './market-radar/research.mjs';
const secret='unit-worker-secret-with-at-least-thirty-two-chars';
const job={job:'unit-job',lease:'unit-lease',company:'shopping_prohospital',sku:'SKU',store:'1',our:{description:'Luva nitrílica Medix',unit:'UN',price:99,cost:999},criteria:{brand:'Medix',our_pack_units:1},domains:['medjet.com.br'],tracked_urls:['https://medjet.com.br/luva']};
function fixture({enabled=true,jobs=[job],saveError=false,researchError=false}={}){const calls=[];let queries=0;
 const db={rpc:async(name,args)=>{calls.push({name,args});if(name==='cip_faro_worker_secret')return {data:secret};if(name==='cip_bot_config_read')return {data:{ai_enabled:enabled,ai_key:enabled?'unit-ai-key':null}};if(name==='cip_faro_directory_target')return {data:null};if(name==='cip_faro_claim')return {data:jobs};if(name==='cip_faro_finish')return saveError&&!args.p_failed?{error:{}}:{data:{state:args.p_failed?'failed':'completed'}};throw Error('unexpected');}};
 const worker=createFaroWorker({db,research:async(context,options)=>{queries++;assert.equal(context.monitoring,true);assert.deepEqual(options.limits,{calls:2,tokens:3200});assert.deepEqual(context.already_seen,[]);if(researchError)throw Error('provider_rate_limit');return {offers:[],meta:{search_calls:2,usage:{input_tokens:100,output_tokens:20}}};}});
 return {calls,queries:()=>queries,worker,run:(headers={})=>worker(new Request('https://example.invalid',{method:'POST',headers:{'X-CIP-Faro-Secret':secret,...headers},body:'{}'}))};
}
test('worker rejects missing credentials, hostile origin and wrong secrets before claiming work or model access',async()=>{
 const f=fixture();assert.equal((await f.worker(new Request('https://example.invalid',{method:'POST'}))).status,401);assert.equal(f.calls.length,0);
 assert.equal((await f.run({origin:'https://hostile.invalid'})).status,403);assert.equal(f.calls.length,0);
 assert.equal((await f.run({'X-CIP-Faro-Secret':'wrong'})).status,401);assert.equal(f.queries(),0);assert.equal(f.calls.length,1);
});
test('disabled intelligence never claims jobs and an empty queue never invokes the provider',async()=>{
 const disabled=fixture({enabled:false});assert.equal((await disabled.run()).status,409);assert.ok(!disabled.calls.some(c=>c.name==='cip_faro_claim'));
 const idle=fixture({jobs:[]});assert.equal((await idle.run()).status,200);assert.equal(idle.queries(),0);
});
test('worker uses bounded monitoring, persists with the exact lease and returns no internal secrets or economics',async()=>{
 const f=fixture();const r=await f.run();assert.equal(r.status,200);const body=await r.text();assert.doesNotMatch(body,/unit-lease|unit-ai-key|unit-worker|999|99/);assert.equal(f.queries(),1);const saved=f.calls.find(c=>c.name==='cip_faro_finish');assert.equal(saved.args.p_lease,job.lease);assert.equal(saved.args.p_failed,false);
});
test('invalid product identity cannot consume provider calls and failed research is recorded without automatic replay',async()=>{
 const bad=fixture({jobs:[{...job,criteria:{gtin:'123'}}]});await bad.run();assert.equal(bad.queries(),0);assert.equal(bad.calls.find(c=>c.name==='cip_faro_finish').args.p_meta.error,'identity_required');
 const rate=fixture({researchError:true});await rate.run();assert.equal(rate.queries(),1);assert.equal(rate.calls.find(c=>c.name==='cip_faro_finish').args.p_failed,true);
 const save=fixture({saveError:true});await save.run();assert.equal(save.queries(),1);assert.equal(save.calls.filter(c=>c.name==='cip_faro_finish').length,2);
});
test('automatic web requests recheck tracked evidence with at most two web calls and a separate output bound',()=>{
 const p=researchRequest({...job,monitoring:true},{calls:2,tokens:3200});assert.equal(p.max_tool_calls,2);assert.equal(p.max_output_tokens,3200);assert.match(p.instructions,/reconsulte também as URLs rastreadas/);assert.match(p.input,/tracked_urls/);assert.doesNotMatch(p.input,/999|99|cost|price/);assert.throws(()=>researchRequest(job,{calls:999}),/invalid_limits/);
});
test('provider usage is retained as metering information without turning reserved calls into actual billed cost',()=>{
 const d=parseResearch({status:'completed',usage:{input_tokens:42,output_tokens:17},output:[{type:'web_search_call',status:'completed',action:{sources:[]}},{type:'message',content:[{type:'output_text',text:'{"offers":[],"limitations":"Sem evidência nesta rodada"}'}]}]},job);assert.deepEqual(d.meta.usage,{input_tokens:42,output_tokens:17});assert.equal(d.meta.search_calls,1);
});
test('schema scopes all public tables, protects worker capabilities, queues once per hour and preserves manual budgets',()=>{
 const sql=fs.readFileSync(new URL('./schema/faro-hourly.sql',import.meta.url),'utf8');
 for(const t of ['cip_faro_config','cip_faro_portfolio','cip_faro_jobs','cip_faro_signals'])assert.match(sql,new RegExp('create table public.'+t));
 assert.match(sql,/enable row level security/);assert.match(sql,/revoke select on public.cip_faro_jobs from authenticated/);assert.match(sql,/to_jsonb\(j\)-'lease'/);assert.match(sql,/unique\(portfolio_id,slot\)/);assert.match(sql,/last_slot is not distinct from h/);assert.match(sql,/auto_job_id is null/);assert.match(sql,/last_queued_at asc nulls first/);assert.match(sql,/lease is distinct from token/);assert.match(sql,/circuit_until/);assert.match(sql,/same|conditions/);assert.match(sql,/pg_advisory_xact_lock/);assert.match(sql,/'0 \* \* \* \*'/);
 assert.doesNotMatch(sql,/insert into public.cip_mp_price_plans|insert into public.cip_mp_market_refs/);
});
test('interface distinguishes attempted and evidence coverage, states rotation capacity and preserves human review',()=>{
 const ui=fs.readFileSync(new URL('./faro-hourly-ui.mjs',import.meta.url),'utf8');assert.match(ui,/Pesquisados em 24 h/);assert.match(ui,/Com evidência em 24 h/);assert.match(ui,/Passagem estimada/);assert.match(ui,/custo|consumo|Consumo/);assert.match(ui,/conferência/);assert.match(ui,/clearInterval/);assert.doesNotMatch(ui,/localStorage|service_role|ai_key|worker_secret/);
});

test('special focus carries a bounded research objective without sending internal prices or costs',()=>{
 const focus={objective:'Conferir embalagem e vendedores',phase:'similar',version:2,feedback:[{note:'Rever modelo'}]};
 const p=researchRequest({...job,mode:'alternatives',monitoring:true,focus},{calls:2,tokens:3200});
 assert.deepEqual(JSON.parse(p.input).focus,focus);assert.equal(JSON.parse(p.input).mode,'alternatives');
 assert.equal(p.max_tool_calls,2);assert.match(p.instructions,/nunca evidência atual de preço/);assert.doesNotMatch(p.input,/999|99|cost|price/);
});
test('special worker passes the phase and retains evidence context without additional research calls',async()=>{
 let observed;const calls=[];const focus={objective:'Conferir modelo e embalagem',phase:'similar',version:1};
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='cip_faro_worker_secret'?secret:name==='cip_bot_config_read'?{ai_enabled:true,ai_key:'unit-key'}:name==='cip_faro_claim'?[{...job,mode:'alternatives',focus}]:name==='cip_faro_finish'?{state:'completed'}:null};}};
 const worker=createFaroWorker({db,research:async(ctx,opt)=>{observed=ctx;assert.deepEqual(opt.limits,{calls:2,tokens:3200});return {offers:[],meta:{search_calls:1}};}});
 await worker(new Request('https://example.invalid',{method:'POST',headers:{'X-CIP-Faro-Secret':secret}}));
 assert.equal(observed.mode,'alternatives');assert.deepEqual(observed.focus,focus);assert.deepEqual(calls.find(x=>x.name==='cip_faro_finish').args.p_meta.special_focus,focus);
});
