import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validCouncilRequest,validateCouncil,councilSchema,measurement} from './agent-operations-engine.mjs';
import {generateCouncil} from './agent-council/ai.mjs';
import {createCouncilHandler} from './agent-council/handler.mjs';
const proposal={summary:'Conferir as fontes antes do piloto.',priorities:[{agent:'analista',diagnosis:'Posição desatualizada.',next_step:'Solicitar carga e conciliar totais.',measure:'Itens com fonte validada.',lesson:'Ausência de dado não é saldo zero.',dependencies:['estoque']}],questions:['Qual é o período da demanda?']};
const args={company:'shopping_prohospital',objective:'Melhorar giro com contribuição.',consent:true};
const request=(body=args,headers={})=>new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer synthetic',origin:'https://cip.gritnews.com.br',...headers},body:JSON.stringify(body)});
function fixture({auth=true,manage=true,claim=true,configured=true,wrongCompany=false,oldCycle=false,sourceError=false,knowledgeError=false,saveError=false,revokeAfterGeneration=false}={}){
 const calls=[];let managementChecks=0;const record={id:'cycle-test',company_id:wrongCompany?'distribuidora_prohospital':args.company,created_at:new Date(Date.now()-(oldCycle?9*3600000:0)).toISOString(),report:{facts:{stale:true},agents:[{agent_id:'analista'},{agent_id:'estoque'}],reviewed_cases:[]}};
 const client={auth:{getUser:async()=>({data:{user:auth?{id:'synthetic-user'}:null}})},rpc:async(n,p)=>{calls.push([n,p]);if(n==='cip_agent_can_manage'){managementChecks++;return {data:manage&&!(revokeAfterGeneration&&managementChecks>1)};}if(n==='cip_academy_search')return knowledgeError?{error:{}}:{data:[{material_id:'material-test',title:'Caso aprovado',locator:'p. 2',content:'Material aprovado com evidência.'}]};if(n==='cip_agent_skills')return {data:[]};throw Error(n);},from:n=>{assert.equal(n,'cip_agent_cycles');const q={select(){return q;},eq(k,v){calls.push(['scope',k,v]);return q;},order(){return q;},limit(){return q;},maybeSingle:async()=>sourceError?{error:{}}:{data:record}};return q;}};
 const db={rpc:async(n,p)=>{calls.push([n,p]);if(n==='cip_bot_config_read')return {data:{ai_enabled:configured,ai_key:'synthetic-key'}};if(n==='cip_agent_council_claim')return {data:claim};throw Error(n);},from:n=>{assert.equal(n,'cip_agent_councils');return {insert(data){calls.push(['save',data]);return {select(){return {single:async()=>saveError?{error:{}}:{data:{id:'council-test'}}};}};}};}};
 const handler=createCouncilHandler({db,createClient:()=>client,url:'https://synthetic.invalid',anonKey:'synthetic',generate:async(context,opts)=>{calls.push(['generate',context]);assert.equal(opts.key,'synthetic-key');return proposal;}});return {handler,calls};
}
test('council only accepts explicit consent, known company and a bounded objective',()=>{
 assert.ok(validCouncilRequest(args));for(const b of [{...args,company:'all'},{...args,consent:false},{...args,objective:'x'},{...args,objective:'x'.repeat(1001)}])assert.equal(validCouncilRequest(b),false);
});
test('model contract rejects foreign agents, missing fields and excessive prose',()=>{
 assert.ok(validateCouncil(proposal,['analista','estoque']));assert.equal(validateCouncil(proposal,['precos']),false);assert.equal(validateCouncil({...proposal,summary:'x'.repeat(1801)},['analista','estoque']),false);assert.equal(validateCouncil({...proposal,priorities:[]},['analista']),false);assert.deepEqual(councilSchema(['analista']).properties.priorities.items.properties.agent.enum,['analista']);
});
test('attainment is available only after measured and reviewed results and does not imply ROI',()=>{
 assert.equal(measurement({state:'in_progress'}),null);const m={state:'measured',review_state:'approved',observed:5,target:10};assert.equal(measurement(m).attainment_pct,50);assert.equal(measurement({...m,review_state:'pending'}),null);assert.equal(measurement({...m,observed:null}),null);assert.equal(measurement({...m,target:0}),null);
});
test('AI request is bounded, non-storing, structured and has no execution tools',async()=>{
 const p=await generateCouncil({agents:[{agent_id:'analista'},{agent_id:'estoque'}],company:args.company},{key:'synthetic',fetcher:async(url,opts)=>{assert.equal(url,'https://api.openai.com/v1/chat/completions');const body=JSON.parse(opts.body);assert.equal(body.store,false);assert.equal(body.tools,undefined);assert.equal(body.response_format.json_schema.strict,true);assert.ok(opts.signal);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(proposal)}}]});}});assert.deepEqual(p,proposal);
});
test('AI refusal, bad payload and incomplete response never become a council',async()=>{
 for(const choice of [{finish_reason:'length',message:{content:'{}'}},{finish_reason:'stop',message:{refusal:'no'}},{finish_reason:'stop',message:{content:'not json'}},{finish_reason:'stop',message:{content:'{}'}}])await assert.rejects(()=>generateCouncil({agents:[{agent_id:'analista'}]},{key:'synthetic',fetcher:async()=>Response.json({choices:[choice]})}));
});
test('authentication and company management precede any model or config access',async()=>{
 for(const options of [{auth:false},{manage:false}]){const {handler,calls}=fixture(options),r=await handler(request());assert.equal(r.status,options.auth===false?401:403);assert.ok(!calls.some(([n])=>n==='generate'||n==='cip_bot_config_read'));}
});
test('unknown company, consent and oversized streams are rejected before data lookup',async()=>{
 for(const b of [{...args,company:'all'},{...args,consent:false},{...args,objective:'x'.repeat(9000)}]){const {handler,calls}=fixture();assert.equal((await handler(request(b))).status,400);assert.equal(calls.length,0);}
});
test('wrong company, stale or unreadable cycle cannot be supplied to the model',async()=>{
 for(const options of [{wrongCompany:true},{oldCycle:true},{sourceError:true}]){const {handler,calls}=fixture(options);assert.equal((await handler(request())).status,409);assert.ok(!calls.some(([n])=>n==='generate'));}
});
test('disabled AI, quota and unavailable knowledge fail explicitly, without model invocation',async()=>{
 for(const [options,expected] of [[{configured:false},409],[{claim:false},429],[{knowledgeError:true},503]]){const {handler,calls}=fixture(options);assert.equal((await handler(request())).status,expected);assert.ok(!calls.some(([n])=>n==='generate'));}
});
test('valid council uses server-scoped data and saves with authenticated authorship',async()=>{
 const {handler,calls}=fixture();const r=await handler(request({...args,report:{company:'attacker',secret:'injected'}}));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const context=calls.find(([n])=>n==='generate')[1];assert.equal(context.company,args.company);assert.equal(context.report,undefined);assert.equal(context.knowledge[0].id,'material-test');const saved=calls.find(([n])=>n==='save')[1];assert.equal(saved.actor,'synthetic-user');assert.equal(saved.company_id,args.company);assert.equal(saved.cycle_id,'cycle-test');
});
test('failed persistence never reports council success',async()=>{const {handler}=fixture({saveError:true});assert.equal((await handler(request())).status,503);});
test('only expected methods and origin are accepted',async()=>{const {handler}=fixture();assert.equal((await handler(new Request('https://example.invalid',{method:'GET'}))).status,405);assert.equal((await handler(request(args,{origin:'https://attacker.invalid'}))).status,403);assert.equal((await handler(new Request('https://example.invalid',{method:'OPTIONS'}))).status,204);});
test('operations UI is accessible, escaped and keeps results and approval meaning explicit',()=>{
 const source=readFileSync(new URL('./agent-operations-ui.mjs',import.meta.url),'utf8');for(const text of ['aria-live="polite"','Definir próximo passo','data-operation-council','Aprendizado e limites','Aceitar missão não aprova'])assert.ok(source.includes(text),text);assert.ok(source.includes('esc(m.title)'));assert.ok(source.includes('c===getCompany()'));
});

test('permission revoked during inference prevents persistence and delivery',async()=>{const {handler,calls}=fixture({revokeAfterGeneration:true});assert.equal((await handler(request())).status,403);assert.ok(!calls.some(([n])=>n==='save'));});
