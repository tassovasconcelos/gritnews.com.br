import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readOpenAICosts,readAnthropicCosts,readDataForSeoBalance,readDeepSeekBalance,
 safeGet,sanitizeProviderError,nextAllowed,providerError} from './providers.mjs';
const now=new Date('2026-11-27T17:00:00.000Z');
test('OpenAI organization costs sum pages in USD exactly once and do not infer credits',async()=>{
 let calls=0;
 const x=await readOpenAICosts({apiKey:'secret-do-not-print',now,fetcher:async(url,opts)=>{
  const parsed=new URL(url);assert.equal(parsed.hostname,'api.openai.com');
  assert.equal(opts.headers.Authorization,'Bearer secret-do-not-print');
  assert.equal(parsed.searchParams.get('start_time'),String(Date.parse('2026-11-01T00:00:00Z')/1000));
  if(calls++===0)return Response.json({data:[{results:[{amount:{currency:'usd',value:0.30}},{amount:{currency:'usd',value:0.10}}]}],has_more:true,next_page:'next_one'});
  assert.equal(parsed.searchParams.get('page'),'next_one');
  return Response.json({data:[{results:[{amount:{currency:'usd',value:1.20}}]}],has_more:false});
 }});
 assert.equal(calls,2);assert.equal(x.month_spend_usd,1.6);
 assert.equal(x.credit_balance,null);assert.equal(x.period_month,'2026-11-01');
 assert.equal(x.cost_basis,'api_reported_cost');
});
test('Anthropic Analytics costs use cents not dollars and require beta credentials',async()=>{
 const r=await readAnthropicCosts({apiKey:'admin-private',now,fetcher:async(url,opts)=>{
  const p=new URL(url);assert.equal(p.pathname,'/v1/organizations/analytics/cost');
  assert.equal(opts.headers['x-api-key'],'admin-private');
  assert.equal(opts.headers['anthropic-beta'],'analytics-usage-cost-2026-08-24');
  return Response.json({data:[{cost:{amount:'41280.000000',currency:'USD'}},{cost:{amount:'125.000000',currency:'USD'}}],has_more:false,data_refreshed_at:'2026-11-27T12:00:00Z'});
 }});
 assert.equal(r.month_spend_usd,414.05);assert.equal(r.cost_basis,'api_reported_precredits');
 assert.equal(r.report_through,'2026-11-27T12:00:00Z');
});
test('Anthropic refuses zero billing when provider report has no fresh rows',async()=>{
 await assert.rejects(readAnthropicCosts({apiKey:'admin',now,fetcher:async()=>Response.json({data:[],has_more:false,data_refreshed_at:null})}),/report_not_yet_available/);
});
test('DataForSEO reports signed USD balance, not a fabricated monthly spend',async()=>{
 const r=await readDataForSeoBalance({login:'billing@example.invalid',password:'do-not-log',now,
  fetcher:async(url,opts)=>{
    assert.equal(url,'https://api.dataforseo.com/v3/appendix/user_data');
    assert.ok(opts.headers.Authorization.startsWith('Basic '));
    return Response.json({status_code:20000,tasks:[{result:[{money:{total:120,balance:-5.25}}]}]});
  }});
 assert.equal(r.credit_balance,-5.25);assert.equal(r.credit_currency,'USD');
 assert.equal(r.month_spend_usd,null);assert.equal(r.credit_available,false);
});
test('DeepSeek selects USD if available, otherwise preserves CNY without conversion',async()=>{
 const data={is_available:true,balance_infos:[{currency:'CNY',total_balance:'8.10'},{currency:'USD',total_balance:'3.45'}]};
 const r=await readDeepSeekBalance({apiKey:'secret',now,fetcher:async()=>Response.json(data)});
 assert.equal(r.credit_balance,3.45);assert.equal(r.credit_currency,'USD');assert.equal(r.cost_basis,'balance_only');
 const other=await readDeepSeekBalance({apiKey:'secret',now,fetcher:async()=>Response.json({is_available:false,balance_infos:[data.balance_infos[0]]})});
 assert.equal(other.credit_balance,8.1);assert.equal(other.credit_currency,'CNY');assert.equal(other.credit_available,false);
});
test('provider failures are sanitized and Retry-After is bounded',async()=>{
 assert.deepEqual(providerError(429,new Headers({'retry-after':'3600'})),{code:'rate_limited',retryAfterSeconds:3600});
 assert.equal(providerError(403,new Headers()).code,'unauthorized');
 assert.equal(sanitizeProviderError(new Error('secret-key=abc123')),'failed');
 await assert.rejects(safeGet('http://api.openai.com/v1/organization/costs',{},async()=>Response.json({})),/unsafe_endpoint/);
 await assert.rejects(safeGet('https://127.0.0.1/private',{},async()=>Response.json({})),/unsafe_endpoint/);
 const err=await safeGet('https://api.openai.com/v1/organization/costs',{},async()=>Response.json({error:{message:'private-token'}},{status:429})).catch(e=>e);
 assert.equal(err.message,'rate_limited');assert.equal(err.message.includes('private-token'),false);
 const future=nextAllowed(now,'rate_limited',3600);assert.ok(Date.parse(future)-now.getTime()>=7200000);
});
