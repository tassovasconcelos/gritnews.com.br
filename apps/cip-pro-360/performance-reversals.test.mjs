import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifiedBenefits} from './performance-engine.mjs';
const original={id:'gain',event_kind:'benefit',company_id:'shopping_prohospital',period_start:'2026-11-01',period_end:'2026-11-30',created_by:'author',source_key:'QA:GAIN:1',gross_value:1000,attribution_pct:100,incremental_cost:100,reversals:0};
const reversal={...original,id:'reverse',event_kind:'reversal',reverses_event_id:'gain',source_key:'QA:REVERSAL:1',gross_value:0,attribution_pct:0,incremental_cost:0,reversals:200};
const signs=id=>['controladoria','diretoria'].map((review_role,i)=>({event_id:id,company_id:original.company_id,review_role,reviewer_id:'reviewer-'+i,decision:'aprovado'}));
test('pending reversal suspends the original validated gain',()=>{
 const result=verifiedBenefits([original,reversal],signs('gain'));
 assert.equal(result.netValidated,0);assert.equal(result.events[0].validation,'em_revisao');
});
test('two independent approvals deduct linked reversal exactly once',()=>{
 assert.equal(verifiedBenefits([original,reversal],[...signs('gain'),...signs('reverse')]).netValidated,700);
});
test('rejected reversal restores original gain without deleting history',()=>{
 const result=verifiedBenefits([original,reversal],[...signs('gain'),{...signs('reverse')[0],decision:'rejeitado'}]);
 assert.equal(result.netValidated,900);assert.equal(result.events.length,2);
});
test('cross-company, orphan and excessive reversals never validate',()=>{
 assert.equal(verifiedBenefits([reversal],signs('reverse')).netValidated,0);
 const invalid={...reversal,company_id:'other'};
 assert.equal(verifiedBenefits([original,invalid],[...signs('gain'),...signs('reverse')]).netValidated,0);
 assert.equal(verifiedBenefits([original,{...reversal,reversals:901}],[...signs('gain'),...signs('reverse')]).netValidated,0);
});
