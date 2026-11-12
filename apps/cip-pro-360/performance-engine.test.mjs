import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PILLARS,pillarProgress,scorecard,productivity,agentsSummary,verifiedBenefits,bonusSimulation} from './performance-engine.mjs';
test('eight core pillars sum to 100 points and exclude baseline-only result',()=>{
 assert.equal(PILLARS.reduce((s,p)=>s+p.weight,0),100);
 const baseline=PILLARS.map(p=>({metric_code:p.code,baseline:10,target:20,actual:10}));
 const s=scorecard(baseline);
 assert.equal(s.complete,true);assert.equal(s.totalPoints,0);
});
test('incremental achievement only scores lift above baseline, capped at 120%',()=>{
 const p=PILLARS[0];
 assert.equal(pillarProgress({baseline:3000000,target:3300000,actual:3150000},p),.5);
 assert.equal(pillarProgress({baseline:3000000,target:3300000,actual:3600000},p),1.2);
 assert.equal(pillarProgress({baseline:3000000,target:3300000,actual:2900000},p),0);
});
test('decreasing time indicators use the right direction, invalid targets do not earn points',()=>{
 const p={code:'tempo_decisao',direction:'down',unit:'MINUTES'};
 assert.equal(pillarProgress({baseline:90,target:40,actual:65},p),.5);
 assert.equal(pillarProgress({baseline:40,target:60,actual:65},p),null);
});
test('incomplete coverage never becomes an official full score',()=>{
 const s=scorecard([{metric_code:'crescimento_vendas',baseline:100,target:120,actual:115}]);
 assert.equal(s.coverageWeight,20);assert.equal(s.complete,false);assert.equal(s.totalPoints,null);
});
test('net saved hours exclude supervision and rework and do not imply payroll reduction',()=>{
 const r=productivity([{baseline_minutes:20,current_minutes:8,monthly_executions:300,supervision_hours:12,rework_hours:3,monthly_productive_hours:160,estimated_hour_cost:25}]);
 assert.equal(r.grossHours,60);assert.equal(r.netHours,45);assert.equal(r.fteEquivalent,45/160);
 assert.equal(r.indicativeLaborValue,1125);assert.equal(r.financialSavingValidated,false);
});
test('higher process duration is retained as negative productivity, not a fabricated gain',()=>{
 const r=productivity([{baseline_minutes:4,current_minutes:9,monthly_executions:120,supervision_hours:0,rework_hours:0,monthly_productive_hours:160}]);
 assert.equal(r.netHours,-10);
});
test('agent effectiveness and automation use actual denominators',()=>{
 const r=agentsSummary([{analyses:40,actions_recommended:30,actions_executed:20,actions_effective:8,tasks_eligible:100,tasks_automatic:60,before_decision_minutes:30,after_decision_minutes:10}]);
 assert.equal(r.efficacyPct,40);assert.equal(r.automationPct,60);
 assert.equal(r.decisionBeforeMinutes,30);assert.equal(r.decisionAfterMinutes,10);
 assert.equal(agentsSummary([]).efficacyPct,null);
});
test('financial gains are not approved without independent finance and board signoffs',()=>{
 const events=[{id:'e1',gross_value:30000,incremental_cost:5000,reversals:2000}];
 const a=[{event_id:'e1',review_role:'controladoria',decision:'aprovado',reviewer_id:'F'}];
 assert.equal(verifiedBenefits(events,a).netValidated,0);
 assert.equal(verifiedBenefits(events,[...a,{event_id:'e1',review_role:'diretoria',decision:'aprovado',reviewer_id:'F'}]).approved,0);
 const result=verifiedBenefits(events,[...a,{event_id:'e1',review_role:'diretoria',decision:'aprovado',reviewer_id:'D'}]);
 assert.equal(result.approved,1);assert.equal(result.netValidated,23000);
});
test('duplicated or rejected approvals never validate a financial event',()=>{
 const events=[{id:'e',gross_value:1000,incremental_cost:100,reversals:0}];
 const a=[{event_id:'e',review_role:'controladoria',decision:'aprovado',reviewer_id:'F'},{event_id:'e',review_role:'diretoria',decision:'rejeitado',reviewer_id:'D'}];
 assert.equal(verifiedBenefits(events,a).netValidated,0);
 assert.equal(verifiedBenefits(events,a).rejected,1);
});
test('bonus is illustrative and requires complete score and validated benefits',()=>{
 const s=scorecard(PILLARS.map(p=>({metric_code:p.code,baseline:0,target:100,actual:100})));
 const b=bonusSimulation(s,{netValidated:225000});
 assert.equal(b.amount,13500);assert.equal(b.notPayable,true);
 assert.equal(bonusSimulation(scorecard([]),{netValidated:100000}).available,false);
});
