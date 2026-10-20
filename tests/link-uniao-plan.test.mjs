import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialPlan,economics,validatePlan,cleanSave} from '../apps/link-uniao/supabase/functions/link-uniao-plan/domain.ts';
import fs from 'node:fs';
import vm from 'node:vm';
test('simulação usa margem, ajustes e piso zero, com percentual negociável',()=>{
 const f={baselineRevenue:100000,baselineCosts:60000,currentRevenue:130000,currentCosts:70000,adjustments:5000,percent:30};
 assert.deepEqual(economics(f),{baseline:40000,current:60000,incremental:15000,fee:4500});
 assert.equal(economics({...f,currentRevenue:50000}).fee,0);
 assert.equal(economics({...f,percent:20}).fee,3000);
});
test('propostas não inventam baseline ou aprovação e distribuem 15h',()=>{
 const d=initialPlan();validatePlan(d);
 assert.equal(d.agenda.reduce((s,a)=>s+a.hours,0),15);
 assert.ok(d.goals.every(x=>x.baseline===null&&x.actual===null));
 assert.deepEqual(d.approvals,{});
});
test('rejeita carga inconsistente, eventos duplicados e conclusão sem evidência',()=>{
 let d=initialPlan();d.weeklyHours=16;assert.throws(()=>validatePlan(d),/carga/);
 d=initialPlan();d.actions[0].status='concluído';assert.throws(()=>validatePlan(d),/evidência/);
 d=initialPlan();const event={id:'e1',ruleId:'r0',reference:'OS 001',beneficiary:'Equipe autorizada',date:'2026-10-01',evidence:'ERP OS001'};
 d.events=[event,{...event,id:'e2',reference:' os 001 '}];assert.throws(()=>validatePlan(d),/duplicado/);
});
test('não aceita aprovação forjada; mudança financeira exige nova aprovação',()=>{
 let prev=initialPlan(),next=structuredClone(prev);next.approvals={terms:{actor:'forjado'}};
 assert.deepEqual(cleanSave(next,prev).approvals,{});
 prev.approvals={terms:{actor:'GRIT'},audit:{actor:'auditor'}};
 next=structuredClone(prev);next.finance.percent=35;assert.deepEqual(cleanSave(next,prev).approvals,{});
 next=structuredClone(prev);next.goals[0].target=25;assert.deepEqual(cleanSave(next,prev).approvals,prev.approvals);
});
test('alterar evento ou regra invalida verificação; cliente não injeta recompensa',()=>{
 const prev=initialPlan();prev.events=[{id:'e1',ruleId:'r0',reference:'OS001',beneficiary:'Pessoa autorizada',date:'2026-09-01',evidence:'ERP OS001',verification:{actor:'GRIT',reward:30}}];
 let next=structuredClone(prev);next.events[0].verification.reward=9999;
 assert.equal(cleanSave(next,prev).events[0].verification.reward,30);
 next=structuredClone(prev);next.events[0].reference='OS002';assert.equal(cleanSave(next,prev).events[0].verification,null);
 next=structuredClone(prev);next.rules[0].reward=100;assert.equal(cleanSave(next,prev).events[0].verification,null);
});
test('scripts de publicação compilam e módulo é ligado ao ADM',()=>{
 const html=fs.readFileSync('apps/link-uniao/index.html','utf8');
 new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
 new vm.Script(fs.readFileSync('apps/link-uniao/plano.js','utf8'));
 assert.ok(html.includes('id="openPlan"'));
 assert.ok(html.includes('window.initGritPlan'));
});
