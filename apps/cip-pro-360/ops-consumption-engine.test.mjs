import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metricTotals,budgetSignal,creditSignal,opsHealth,formatUSD,cleanCsv,groupByProvider} from './ops-consumption-engine.mjs';

const current='2026-11-27T17:00:00.000Z';
test('token usage remains separated from actual billing and unknown is never converted to zero',()=>{
 const rows=[{provider:'openai',events:35,failed_events:2,input_tokens:12423,output_tokens:831,search_calls:9,metered_events:14,costed_events:0,estimated_or_billed_cost_usd:null}];
 const t=metricTotals(rows);
 assert.equal(t.input,12423);assert.equal(t.output,831);assert.equal(t.searches,9);
 assert.equal(t.costed,0);assert.equal(formatUSD(null),'Não informado');
 assert.equal(groupByProvider(rows).get('openai').failed,2);
});
test('budget needs a known, current monthly provider report or explicitly manual credit',()=>{
 const setting={monthly_budget_usd:100,warn_percent:80,critical_percent:95};
 const now=new Date(current);
 assert.equal(budgetSignal(setting,null,now).kind,'unknown');
 assert.equal(budgetSignal({...setting,monthly_budget_usd:null},{month_spend_usd:90,period_month:'2026-11-01'},now).kind,'unconfigured');
 const manual={month_spend_usd:96,period_month:'2026-11-01',source:'manual'};
 const result=budgetSignal(setting,manual,now);
 assert.equal(result.kind,'critical');assert.match(result.label,/manual/i);
 assert.equal(budgetSignal(setting,{...manual,month_spend_usd:65},now).kind,'ok');
 assert.equal(budgetSignal(setting,{...manual,period_month:'2026-10-01'},now).kind,'unknown');
});
test('credits are labeled by origin and stale balances are never current',()=>{
 const now=new Date(current);
 assert.equal(creditSignal(null,now).kind,'unknown');
 assert.equal(creditSignal({source:'manual',credit_balance_usd:50,observed_at:'2026-11-27T15:00:00Z'},now).kind,'manual');
 assert.equal(creditSignal({source:'provider_api',credit_balance_usd:50,observed_at:'2026-11-27T15:00:00Z'},now).kind,'reported');
 assert.equal(creditSignal({source:'provider_api',credit_balance_usd:50,observed_at:'2026-11-20T15:00:00Z'},now).kind,'stale');
});
test('outage detection is independent of scheduled cron heartbeat',()=>{
 assert.equal(opsHealth({enabled:false},null,null).kind,'disabled');
 assert.equal(opsHealth({enabled:true,circuit_until:'2999-01-01T00:00:00Z'},null,current).kind,'critical');
 assert.equal(opsHealth({enabled:true,failure_streak:1864},null,current).kind,'critical');
 assert.equal(opsHealth({enabled:true,failure_streak:0},null,null).kind,'stale');
});
test('CSV export prevents spreadsheet formula injection and keeps sources plain',()=>{
 const csv=cleanCsv([['ref','value'],['=cmd|oops','+123'],['normal','x']]);
 assert.match(csv,/'=cmd\|oops/);assert.match(csv,/'\+123/);
});
