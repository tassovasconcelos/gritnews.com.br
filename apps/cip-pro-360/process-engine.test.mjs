import {test} from 'node:test';import assert from 'node:assert/strict';
import {AGENTS} from './agents-data.mjs';import {CAPABILITIES,MATURITY} from './agent-capabilities.mjs';
import {validGraph,auditGraph,processTemplate,simulationChoices} from './process-engine.mjs';
const company='shopping_prohospital';
test('14 existing identities have advanced measurable development plans',()=>{assert.deepEqual(Object.keys(CAPABILITIES).sort(),AGENTS.map(a=>a.id).sort());assert.equal(MATURITY.length,5);for(const a of AGENTS){const c=CAPABILITIES[a.id];assert.ok(c.skills.length>=6);assert.ok(c.inputs.length&&c.outputs.length&&c.metric&&c.test&&c.limits);for(const id of c.handoffs)assert.ok(AGENTS.some(a=>a.id===id));}assert.equal(AGENTS.find(a=>a.id==='doquita').name,'Doquita');});
test('templates have reachable paths and interactive alternatives',()=>{for(const kind of ['growth','stock']){const g=processTemplate(kind);assert.ok(validGraph(g,company));assert.equal(auditGraph(g,company).filter(x=>x.level==='error').length,0);const d=g.nodes.find(n=>n.type==='decision');assert.equal(simulationChoices(g,d.id).length,2);assert.ok(auditGraph(g,company).some(x=>x.code==='owner'));}});
test('imports reject dangling edges, unsafe coordinates, duplicate IDs and wrong-company specialists',()=>{for(const mutate of [g=>g.edges.push({from:'missing',to:'n0'}),g=>g.nodes[0].x=NaN,g=>g.nodes[0].y=-1,g=>g.nodes[0].agent='b2g',g=>g.nodes.push({...g.nodes[0]}),g=>g.edges.push({...g.edges[0]})]){const g=processTemplate();mutate(g);assert.equal(validGraph(g,company),false);assert.equal(auditGraph(g,company)[0].code,'shape');}});
test('audit detects disconnected nodes, missing branch labels and no-exit loops',()=>{const g=processTemplate();g.edges=g.edges.filter(e=>e.from!=='n2');g.edges.push({from:'n2',to:'n1',label:''});const f=auditGraph(g,company);for(const code of ['unreachable','no_exit','branches','conditions','cycle'])assert.ok(f.some(x=>x.code===code),code);});
test('normal activities cannot silently fork and approvals are explicit',()=>{const g=processTemplate();g.edges.push({from:'n1',to:'n6',label:'Outro caminho'});assert.ok(auditGraph(g,company).some(x=>x.code==='single_exit'));});
test('a complete simple map passes local rules without claiming business certification',()=>{const g={schema:1,nodes:[{id:'na',type:'start',title:'Começar',agent:'doquita',x:0,y:0},{id:'nb',type:'approval',title:'Revisar',agent:'financeiro',x:300,y:0,owner:'Gestor',metric:'1 dia',evidence:'Planilha revisada'},{id:'nc',type:'end',title:'Terminar',agent:'doquita',x:600,y:0}],edges:[{from:'na',to:'nb'},{from:'nb',to:'nc'}]};assert.equal(auditGraph(g,company)[0].level,'ok');});


test('operational standards cover approval, rejection and incomplete evidence for both companies', async()=>{
 const {OPERATIONAL_PROCESSES,operationalTemplate}=await import('./process-engine.mjs');
 const {validateProposal,verifyProcessCases,pilotReadiness}=await import('./process-consultant.mjs');
 assert.equal(OPERATIONAL_PROCESSES.length,6);
 for(const p of OPERATIONAL_PROCESSES){for(const company of ['shopping_prohospital','distribuidora_prohospital']){
  const graph=operationalTemplate(p.key);
  assert.ok(validateProposal({...graph.consultation,graph},company),p.key);
  assert.equal(auditGraph(graph,company).filter(x=>x.level==='error').length,0,p.key);
  const cases=verifyProcessCases(graph,graph.consultation.tests);
  assert.equal(cases.covered,cases.total,p.key);assert.ok(cases.cases.every(x=>x.valid));
  assert.match(pilotReadiness(graph),/Pendente/);
  assert.equal(graph.consultation.observations.length,0);
 }}
});


test('activity qualification counts confirmed people, bounded times and declared execution separately',async()=>{
 const {processQualification,operationalTemplate}=await import('./process-engine.mjs');
 const g=operationalTemplate('pricing-cycle');const n=g.nodes.find(n=>n.type==='task');
 const initial=processQualification(g);assert.equal(initial.assigned,0);assert.equal(initial.timed,0);assert.equal(initial.completed,0);
 Object.assign(n,{owner:'Ana · Estoque',planned_minutes:'15',actual_minutes:'20',output:'Lista de SKUs conferida',execution_status:'done'});
 assert.ok(validGraph(g,company));const q=processQualification(g);assert.equal(q.assigned,1);assert.equal(q.timed,1);assert.equal(q.outputs,1);assert.equal(q.completed,1);assert.equal(q.plannedMinutes,15);
 for(const patch of [{planned_minutes:'-1'},{planned_minutes:'Infinity'},{actual_minutes:'525601'},{execution_status:'approved'},{output:'x'.repeat(501)}]){const copy=structuredClone(g);Object.assign(copy.nodes.find(x=>x.id===n.id),patch);assert.equal(validGraph(copy,company),false);}
 assert.equal(g.consultation.observations.length,0);
});
