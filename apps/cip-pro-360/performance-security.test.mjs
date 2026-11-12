import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifiedBenefits,scorecard,PILLARS} from './performance-engine.mjs';
const event={id:'e',company_id:'shopping_prohospital',created_by:'author',source_key:'ERP:ORDER:1',attribution_pct:100,gross_value:100,incremental_cost:0,reversals:0};
const approvals=(reviewer='finance')=>[{event_id:'e',company_id:event.company_id,review_role:'controladoria',reviewer_id:reviewer,decision:'aprovado'},{event_id:'e',company_id:event.company_id,review_role:'diretoria',reviewer_id:'board',decision:'aprovado'}];
test('author cannot validate own benefit',()=>assert.equal(verifiedBenefits([event],approvals('author')).approved,0));
test('approvals from another company cannot validate benefit',()=>assert.equal(verifiedBenefits([event],approvals().map(a=>({...a,company_id:'other'}))).approved,0));
test('duplicated economic origin fails closed regardless of spelling',()=>{
 const copy={...event,id:'e2',source_key:' erp:order:1 '};
 const result=verifiedBenefits([event,copy],[...approvals(),...approvals().map(a=>({...a,event_id:'e2'}))]);
 assert.equal(result.netValidated,0);
});
test('mixed company score fails closed',()=>{
 const rows=PILLARS.map((p,i)=>({metric_code:p.code,baseline:0,target:100,actual:100,company_id:i?'a':'b',period_start:'2026-11-01',period_end:'2026-11-30'}));
 assert.equal(scorecard(rows).complete,false);
});
test('duplicate KPI never depends on response ordering',()=>{
 const rows=PILLARS.map(p=>({metric_code:p.code,baseline:0,target:100,actual:100}));
 assert.equal(scorecard([...rows,{...rows[0],actual:0}]).complete,false);
});
test('attribution discounts gross gain before all costs and reversals',()=>{
 const result=verifiedBenefits([{...event,attribution_pct:50,gross_value:1000,incremental_cost:200,reversals:100}],approvals());
 assert.equal(result.netValidated,200);
 assert.equal(verifiedBenefits([{...event,attribution_pct:null}],approvals()).approved,0);
});
test('missing identity and missing source cannot produce validated benefit',()=>{
 assert.equal(verifiedBenefits([{...event,created_by:null}],approvals()).approved,0);
 assert.equal(verifiedBenefits([{...event,source_key:''}],approvals()).approved,0);
});
