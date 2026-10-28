import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validGtin,publicDomain,sourceUrl,validRadarRequest,productMatch,comparablePrice,quotedPrices} from './market-radar-engine.mjs';
import {researchRequest,parseResearch,requestResearch} from './market-radar/research.mjs';
import {createRadarHandler} from './market-radar/handler.mjs';
const criteria={brand:'Medix',model:'M100',type:'luva nitrílica',size:'',our_pack_units:100};
const context={our:{description:'Luva nitrílica Medix',unit:'CX100',price:999,cost:1234},criteria,domains:['medjet.com.br'],mode:'identity'};
const offer={title:'Luva nitrílica Medix M100',description:'Caixa com 100 unidades',brand:'Medix',model:'M100',type:'luva nitrílica',specification:'',size:null,gtin:null,url:'https://www.medjet.com.br/luva',seller:'Loja pública',quote:'Caixa com 100 unidades por R$ 39,90',price:39.9,shipping:null,pack_units:100,currency:'BRL',conditions:'Frete depende da praça',availability:'unknown',selling_mode:'b2c',source_date:null};
function response(offers=[offer],sources=[{url:offer.url}]){return {status:'completed',output:[{type:'web_search_call',status:'completed',action:{sources}},{type:'message',content:[{type:'output_text',text:JSON.stringify({offers,limitations:'Amostra indexada.'})}]}]};}
test('domains and evidence URLs reject credentials, private addresses, suffix deception and sensitive links',()=>{
 for(const d of ['localhost','127.0.0.1','192.168.1.1','a.internal','x.test','https://medjet.com.br','medjet.com.br/a','a@medjet.com.br'])assert.equal(publicDomain(d),null,d);
 for(const u of ['http://medjet.com.br/a','https://secret:pass@medjet.com.br/a','https://medjet.com.br:4433/a','https://medjet.com.br.evil.com/a','https://evilmedjet.com.br/a','https://medjet.com.br/login','https://medjet.com.br/a?token=secret'])assert.equal(sourceUrl(u,context.domains),null,u);
 assert.equal(sourceUrl(offer.url+'?utm_source=x&srsltid=y',context.domains),offer.url);
});
test('only valid GTINs are normalized and invalid or zero codes cannot create identity matches',()=>{
 assert.equal(validGtin('7894900011517'),'07894900011517');assert.equal(validGtin('7894900011518'),null);assert.equal(validGtin('00000000'),null);assert.equal(validGtin('789 4900011517'),null);
 const m=productMatch({...context.our,criteria:{...criteria,gtin:'7894900011517'}},{...offer,gtin:'7894900011517'});assert.equal(m.kind,'exact_gtin');assert.equal(m.certified,false);
});
test('matching separates identity, alternatives, clinical conflicts and accessories',()=>{
 assert.equal(productMatch({...context.our,criteria},offer).kind,'exact_brand_model');
 assert.equal(productMatch({...context.our,criteria},{...offer,brand:'Outra marca',model:'Outro'}).kind,'alternative');
 for(const [own,o] of [[{description:'Cateter uretral'},{title:'Cateter venoso central'}],[{description:'Bolsa colostomia'},{title:'Bolsa urostomia'}],[{description:'Luva nitrílica'},{title:'Luva de látex'}],[{description:'Cadeira de rodas'},{title:'Pedal para cadeira de rodas'}]])assert.equal(productMatch(own,o).kind,'incompatible');
 assert.equal(productMatch({description:'Cateter hidrofílico',criteria:{type:'cateter uretral'}},{title:'Cateter uretral lubrificado'}).pending.includes('Conferir coating'),true);
});
test('dimensions preserve conversion and block conflicting calibre without inventing packaging',()=>{
 const own={description:'Curativo',criteria:{size:'10 cm'}};
 assert.equal(productMatch(own,{title:'Curativo 100mm'}).conflicts.length,0);
 assert.equal(productMatch({description:'Cateter',criteria:{size:'12FR'}},{title:'Cateter 14CH'}).kind,'incompatible');
 assert.equal(productMatch({description:'Cateter uretral 12FR'},{title:'Cateter uretral 14FR'}).kind,'incompatible');
 assert.equal(productMatch(context.our,offer).pending.includes('Quantidade da nossa embalagem'),true);
});
test('normalization requires known freight, physical quantities and currency; missing is never zero',()=>{
 assert.equal(comparablePrice(offer,100),null);assert.equal(comparablePrice({...offer,shipping:10},50),24.95);
 assert.equal(comparablePrice({...offer,shipping:0},100),39.9);assert.equal(comparablePrice({...offer,shipping:0,currency:'unknown'},100),null);
 assert.equal(comparablePrice({...offer,shipping:0,pack_units:null},100),null);assert.deepEqual(quotedPrices('De R$ 1.234,56 por R$ 999,90'),[1234.56,999.9]);
});
test('web request is bounded, domain restricted and excludes internal economics and SKU',()=>{
 const p=researchRequest(context);assert.equal(p.store,false);assert.equal(p.max_tool_calls,6);assert.equal(p.tool_choice,'required');assert.equal(p.text.format.schema.properties.offers.maxItems,24);
 assert.deepEqual(p.tools[0].filters.allowed_domains,['medjet.com.br']);assert.doesNotMatch(p.input,/999|1234|cost|price/);assert.match(p.instructions,/não contornar captcha/);assert.match(p.instructions,/null, nunca zero/);
});
test('parser accepts only actually searched sources, removes duplicates and preserves incomplete pricing',()=>{
 const d=parseResearch(response([offer,offer,{...offer,url:'https://medjet.com.br/not-seen'}]),context);assert.equal(d.offers.length,1);assert.equal(d.meta.excluded,2);assert.equal(d.offers[0].shipping,null);assert.equal(d.offers[0].match.certified,false);
 assert.equal(parseResearch(response([{...offer,price:99.99}]),context).offers[0].price,null);
 assert.throws(()=>parseResearch({status:'completed',output:[]},context),/search_without_sources/);
 assert.throws(()=>parseResearch({...response(),status:'incomplete'},context),/search_not_completed/);
});
test('research sends only the official API request and does not leak provider errors or secrets',async()=>{
 let url,payload;const result=await requestResearch(context,{key:'unit-secret',fetcher:async(u,o)=>{url=u;payload=JSON.parse(o.body);return Response.json(response());}});assert.equal(result.offers.length,1);assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(payload.store,false);
 await assert.rejects(requestResearch(context,{key:'unit-secret',fetcher:async()=>Response.json({secret:'unit-secret'},{status:429})}),/provider_rate_limit/);
});
const request={company:'shopping_prohospital',sku:'TEST',store:'1',criteria,domains:['medjet.com.br'],mode:'identity',consent:true};
test('research input cannot omit consent, inject hidden economics, invent domains or malformed GTINs',()=>{
 assert.equal(validRadarRequest(request),true);
 for(const b of [{...request,consent:false},{...request,criteria:{cost:123}},{...request,domains:['127.0.0.1']},{...request,criteria:{gtin:'123'}},{...request,company:'foreign'}])assert.equal(validRadarRequest(b),false);
});
function fixture({authenticated=true,authorized=true,configured=true,claimError=null,revoked=false,saveError=false}={}){
 const calls=[];let checks=0;
 const client={auth:{getUser:async()=>({data:{user:authenticated?{id:'unit-actor'}:null}})},rpc:async(name,args)=>{calls.push({name,args});if(name==='cip_market_can_write')return {data:authorized&&(!revoked||++checks===1)};if(name==='cip_market_start')return claimError?{error:{message:claimError}}:{data:{id:'unit-run',our:context.our,criteria,domains:context.domains,mode:'identity'}};if(name==='cip_market_get')return {data:{offers:[]}};throw Error('unexpected_user_rpc');}};
 const db={rpc:async(name,args)=>{calls.push({name,args});if(name==='cip_bot_config_read')return {data:{ai_enabled:configured,ai_key:configured?'unit-secret':null}};if(name==='cip_market_finish')return saveError&&!args.p_failed?{error:{}}:{data:{id:'unit-run'}};throw Error('unexpected_admin_rpc');}};
 let researches=0;const handler=createRadarHandler({db,createClient:()=>client,url:'https://example.invalid',anonKey:'public',research:async(c)=>{researches++;assert.equal(c.our.description,context.our.description);return parseResearch(response(),c);}});
 return {calls,run:(b=request,headers={})=>handler(new Request('https://example.invalid',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(b)})),researches:()=>researches,handler};
}
test('authentication, company authorization, consent and configuration precede paid research',async()=>{
 for(const options of [{authenticated:false},{authorized:false},{configured:false}]){const f=fixture(options);assert.notEqual((await f.run()).status,200);assert.equal(f.researches(),0);}
 const f=fixture();assert.equal((await f.run({...request,consent:false})).status,400);assert.equal(f.calls.length,0);
 assert.equal((await f.run(request,{origin:'https://hostile.invalid'})).status,403);assert.equal(f.calls.length,0);
});
test('daily budget and source lookup denial prevent model calls; persistence failure never returns success',async()=>{
 for(const claimError of ['daily_limit','search_in_progress','source_product_required']){const f=fixture({claimError});assert.notEqual((await f.run()).status,200);assert.equal(f.researches(),0);}
 const f=fixture({saveError:true});assert.equal((await f.run()).status,503);assert.ok(f.calls.some(c=>c.name==='cip_market_finish'&&c.args.p_failed));
});
test('permission revoked during search blocks results and successful research persists its provenance',async()=>{
 const revoked=fixture({revoked:true});assert.equal((await revoked.run()).status,403);assert.equal(revoked.researches(),1);assert.ok(!revoked.calls.some(c=>c.name==='cip_market_finish'&&!c.args.p_failed));
 const f=fixture();assert.equal((await f.run()).status,200);const saved=f.calls.find(c=>c.name==='cip_market_finish');assert.equal(saved.args.p_meta.coverage,'sample');assert.equal(saved.args.p_offers[0].url,offer.url);
});
test('navigation, guarded review and optional assets integrate with the existing pricing desk',()=>{
 const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
 assert.match(read('./cip-auth.js'),/"radar-mercado"/);assert.match(read('./navigation-data.mjs'),/Radar B2B2C/);assert.match(read('./pricing-desk-ui.mjs'),/data-desk-market-pick/);
 const sql=read('./schema/market-radar.sql');assert.match(sql,/enable row level security/);assert.match(sql,/revoke all on function public.cip_market_finish[\s\S]*?authenticated/);assert.match(sql,/offer_changed/);assert.match(sql,/comparison_blocked/);assert.match(sql,/checks_required/);assert.match(sql,/pg_advisory_xact_lock/);
 const ui=read('./market-radar-ui.mjs');assert.match(ui,/Frete total conferido/);assert.match(ui,/replace_previous/);assert.match(ui,/role="status"/);assert.match(ui,/new Set/);assert.doesNotMatch(ui,/localStorage|service_role|ai_key/);
});

test('evidence comparison distinguishes delivered difference, markup on cost and gross margin',async()=>{
 const {evidenceScenario}=await import('./market-radar-engine.mjs');
 const own={sku:'1',unit:'UN',cost:50,price:100,source_fresh:false};
 const r={sku:'1',state:'candidate',url:'https://loja.com.br/luva',seller:'Loja Cirúrgica',our:{unit:'UN'},criteria:{our_pack_units:1},offer:{quote:'Luva Medix por R$ 160,00',price:160,pack_units:2,shipping:20,currency:'BRL',quality:{basic_eligible:true},match:{kind:'similar'}}};
 const s=evidenceScenario(own,r,75);assert.equal(s.candidate,80);assert.equal(s.delivered,90);assert.equal(s.ourMarkup,100);assert.equal(s.candidateMarkup,60);assert.ok(Math.abs(s.gapPct-11.111111111111116)<1e-8);assert.equal(s.targetMarkup,50);assert.equal(s.targetFactor,1.5);assert.ok(Math.abs(s.targetGrossMargin-100/3)<1e-8);assert.ok(s.pending.some(x=>x.includes('conciliada')));
 const missing=evidenceScenario({...own,cost:0},{...r,offer:{...r.offer,shipping:null}});assert.equal(missing.gapPct,null);assert.equal(missing.candidateMarkup,null);assert.equal(missing.candidate,80);
 for(const bad of [{...r,offer:{...r.offer,quality:{basic_eligible:false}}},{...r,offer:{...r.offer,match:{kind:'alternative'}}},{...r,our:{unit:'CX'}}])assert.equal(evidenceScenario(own,bad).candidate,null);
});
test('Faro product opening resolves numeric SKU/store, does not select a partial match and exposes missing base',async()=>{
 const {resolveEvidenceProduct}=await import('./market-radar-engine.mjs');
 const db={rpc:async()=>({data:{items:[{sku:123,store_code:10,cost:5,price:9,unit:'UN'},{sku:'1234',store_code:'10'}],source_at:'2026-10-19',source_fresh:false}})};
 const exact=await resolveEvidenceProduct(db,'shopping_prohospital','123','10');assert.equal(exact.item.cost,5);assert.equal(exact.item.source_at,'2026-10-19');
 assert.equal((await resolveEvidenceProduct(db,'shopping_prohospital','123','11')).item,null);
 await assert.rejects(resolveEvidenceProduct({rpc:async()=>({error:{}})},'shopping_prohospital','123','10'),/product_lookup_failed/);
});

test('opening a Faro product reveals evidence, supports interactive markup simulation and opens the pricing desk',async()=>{
 const {mountMarketRadar}=await import('./market-radar-ui.mjs');
 const previous={document:globalThis.document,window:globalThis.window};const nodes=new Map(),listeners={},dispose=[],navigations=[];
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,focusCount:0,scrollCount:0,focus(){this.focusCount++;},scrollIntoView(){this.scrollCount++;},replaceChildren(){this.innerHTML='';},reset(){},elements:{query:{value:''},store:{value:''},our_pack_units:{value:''}}});return nodes.get(selector);};
 const root={isConnected:true,innerHTML:'',querySelector:s=>s==='[data-faro-hourly]'?null:node(s),addEventListener:(k,f)=>listeners[k]=f,removeEventListener:()=>{},contains:()=>true};
 globalThis.document={querySelector:()=>({})};globalThis.window={matchMedia:()=>({matches:true}),navigate:x=>navigations.push(x)};
 node('[data-market-company]').value='shopping_prohospital';node('[data-market-scenario-price]').value='80';node('[data-market-scenario-price]').dataset={offer:'offer-one'};
 const offer={id:'offer-one',sku:'123',seller:'Loja exemplo',state:'candidate',version:1,url:'https://loja.com.br/luva',created_at:'2026-10-28',our:{sku:'123',description:'Luva',store_code:'10',unit:'UN',price:100,source_at:'2026-10-19'},criteria:{our_pack_units:1},offer:{title:'Luva',quote:'Luva por R$ 160,00',seller:'Loja exemplo',platform:'loja.com.br',price:160,shipping:20,pack_units:2,currency:'BRL',quality:{basic_eligible:true,findings:[]},match:{kind:'similar',score:75,conflicts:[],pending:[],reasons:[]}}};
 const db={rpc:async name=>name==='cip_mp_desk_get'?{data:{items:[{sku:123,store_code:10,unit:'UN',description:'Luva',cost:50,price:100}],source_at:'2026-10-19',source_fresh:false}}:{data:{offers:[offer],runs:[],can_write:true}}};
 try{
 mountMarketRadar(root,{db,companies:['shopping_prohospital'],onDispose:f=>dispose.push(f),pick:{company:'shopping_prohospital',sku:'123',store:'10'}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(node('[data-market-evidence]').focusCount>0);assert.ok(node('[data-market-evidence]').scrollCount>0);assert.match(node('[data-market-offers]').innerHTML,/Nosso custo observado/);assert.match(node('[data-market-offers]').innerHTML,/Markup ao preço concorrente/);
 const click=dataset=>listeners.click({target:{closest:()=>({dataset,hasAttribute:()=>false})}});
 click({marketSimulate:'offer-one'});assert.equal(node('[data-market-editor]').hidden,false);assert.match(node('[data-market-editor]').innerHTML,/Simular preço e markup/);
 node('[data-market-scenario-price]').value='75';listeners.input({target:{matches:()=>true}});assert.match(node('[data-market-scenario-output]').innerHTML,/50%/);assert.match(node('[data-market-scenario-output]').innerHTML,/1.5000/);
 click({marketScenarioDesk:'offer-one'});assert.deepEqual(window.cipPricingPick,{company:'shopping_prohospital',sku:'123',store:10});assert.deepEqual(navigations,['precos']);
 dispose.forEach(f=>f());const before=node('[data-market-evidence]').focusCount;mountMarketRadar(root,{db:{rpc:async(name,args)=>name==='cip_mp_desk_get'?{data:{items:[]}}:db.rpc(name,args)},companies:['shopping_prohospital'],onDispose:f=>dispose.push(f),pick:{company:'shopping_prohospital',sku:'123',store:'10'}});await new Promise(resolve=>setImmediate(resolve));assert.ok(node('[data-market-evidence]').focusCount>before);assert.match(node('[data-market-status]').textContent,/não localizado/);assert.match(node('[data-market-offers]').innerHTML,/Custo positivo da loja não disponível/);
 }finally{dispose.forEach(f=>f());root.isConnected=false;globalThis.document=previous.document;globalThis.window=previous.window;}
});
