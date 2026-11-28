import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeLink,validFile,validMaterial,learningState,knowledgeContext,MAX_FILE} from './academy-engine.mjs';
const company='shopping_prohospital',now=new Date('2026-10-19T12:00:00Z');
const material={id:'m1',company_id:company,agent_id:'estoque',kind:'orientation',title:'Revisar cobertura',content:'Conferir saldo e data antes de recomendar transferência.',review_due:'2026-11-19',status:'approved'};
const skill={id:'s1',company_id:company,agent_id:'estoque',title:'Analisar cobertura',instructions:'Consultar o saldo com fonte e data, sem presumir disponibilidade.',limits:'Não efetivar transferências.',test_case:'SKU sem saldo disponível.',expected_result:'Sinalizar ausência de informação.',source_ids:['m1'],review_due:'2026-11-19',status:'approved'};
test('material validates scoped agent, summary, URL and uploads reject executable/oversized content',()=>{
 assert.equal(validMaterial(material),true);assert.equal(validMaterial({...material,agent_id:'b2g'}),false);
 assert.equal(validMaterial({...material,kind:'link',source_url:'javascript:alert(1)'}),false);
 for(const url of ['javascript:alert(1)','data:text/html,hi','http://example.com','https://user:pass@example.com'])assert.equal(safeLink(url),null);
 assert.equal(safeLink('https://example.com/doc'),'https://example.com/doc');
 assert.equal(validFile({name:'a.pdf',size:MAX_FILE}),true);assert.equal(validFile({name:'a.html',size:10}),false);assert.equal(validFile({name:'a.pdf',size:MAX_FILE+1}),false);
});
test('expired, draft, retired, missing and foreign-company evidence cannot inform approved skills',()=>{
 assert.equal(learningState([material],[skill],now).skills.length,1);
 for(const m of [{...material,status:'draft'},{...material,status:'retired'},{...material,review_due:'2026-01-01'},{...material,company_id:'distribuidora_prohospital'}])assert.equal(learningState([m],[skill],now).skills.length,0);
 assert.equal(learningState([],[skill],now).skills.length,0);
 assert.equal(learningState([material],[{...skill,review_due:'2026-01-01'}],now).skills.length,0);
});
test('approved replacement invalidates old evidence but draft replacement preserves existing skill',()=>{
 const replacement={...material,id:'m2',supersedes_id:'m1'};
 assert.equal(learningState([material,replacement],[skill],now).skills.length,0);
 assert.equal(learningState([material,{...replacement,status:'draft'}],[skill],now).skills.length,1);
 const next={...skill,id:'s2',supersedes_id:'s1'};
 assert.deepEqual(learningState([material],[skill,next],now).skills.map(s=>s.id),['s2']);
});
test('context is segregated by company and specialist, with traceable evidence and limits',()=>{
 const ctx=knowledgeContext({materials:[material],skills:[skill],company,agent:'estoque',query:'cobertura',now});
 assert.equal(ctx.skills.length,1);assert.equal(ctx.skills[0].sources[0].id,'m1');assert.match(ctx.policy,/não concede permissões/);
 assert.equal(knowledgeContext({materials:[material],skills:[skill],company:'distribuidora_prohospital',now}).skills.length,0);
 assert.equal(knowledgeContext({materials:[material],skills:[skill],company,agent:'comercial',now}).skills.length,0);
});
test('external sources require completed extraction and context uses the approved extraction only',()=>{
 const external={...material,ingestion_status:'ready',approved_extraction_id:'e1'};
 assert.equal(learningState([{...external,ingestion_status:'queued'}],[skill],now).skills.length,0);
 assert.equal(learningState([{...external,ingestion_status:'failed'}],[skill],now).skills.length,0);
 assert.equal(learningState([{...external,approved_extraction_id:null}],[skill],now).skills.length,0);
 const ctx=knowledgeContext({materials:[external],skills:[skill],company,now,extractions:[{id:'e1',material_id:'m1',complete:true,text_content:'Texto integral aprovado.'},{id:'e2',material_id:'m1',complete:true,text_content:'Texto não aprovado.'}]});
 assert.equal(ctx.skills[0].sources[0].content,'Texto integral aprovado.');
});

import {academyFrame} from './academy-ui.mjs';
test('explicit review history is conservative: latest passing evaluation must follow source review',()=>{
 const m={...material,reviewed_at:'2026-10-18T10:00:00Z'};
 const e={id:'e1',company_id:company,skill_id:'s1',source_valid:true,scenario_passed:true,limits_passed:true,created_at:'2026-10-18T12:00:00Z'};
 assert.equal(learningState([m],[skill],now,[]).skills.length,0);
 assert.equal(learningState([m],[skill],now,[e]).skills.length,1);
 assert.equal(learningState([{...m,reviewed_at:'2026-10-19T10:00:00Z'}],[skill],now,[e]).skills.length,0);
 assert.equal(learningState([m],[skill],now,[e,{...e,id:'e2',created_at:'2026-10-19T10:00:00Z',limits_passed:false}]).skills.length,0);
 assert.equal(knowledgeContext({materials:[m],skills:[skill],evaluations:[],company,now}).skills.length,0);
});
test('intelligence central exposes persistent origin and state filters while preserving the original academy',()=>{
 const html=academyFrame();
 assert.match(html,/data-tab="flow" aria-pressed="true"/);
 assert.match(html,/id="academyFlowKind"/);
 assert.match(html,/id="academyFlowState"/);
 assert.match(html,/value="hermes_proposal"/);
 assert.match(html,/value="superseded"/);
 assert.match(html,/data-tab="library"/);
 assert.match(html,/data-tab="skills"/);
});
