// CIP360 · read-only adapters for official billing APIs.
// Safe fixed endpoints only; no user URLs, account payloads or provider secrets are persisted.
const HOUR=3600000;
const MAX_RESPONSE=1_000_000;
function finiteMoney(v,{negative=false}={}){
 if(v===null||v===undefined||v==='')throw Error('invalid_response');
 const n=Number(v);
 if(!Number.isFinite(n)||Math.abs(n)>1e11||(!negative&&n<0))throw Error('invalid_response');
 return n;
}
function currencyUSD(currency){if(String(currency).toUpperCase()!=='USD')throw Error('invalid_response');}
function monthRange(now=new Date()){
 const d=new Date(now);
 if(!Number.isFinite(d.getTime()))throw Error('invalid_window');
 const from=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1));
 return {from:from.toISOString(),to:d.toISOString(),month:from.toISOString().slice(0,10),
   fromEpoch:Math.floor(from.getTime()/1000),toEpoch:Math.floor(d.getTime()/1000)};
}
export function providerError(status,headers){
 const retryHeader=headers?.get?.('retry-after');
 const secs=retryHeader==null?null:Number(retryHeader);
 return {code:status===401||status===403?'unauthorized':status===429?'rate_limited':status>=500?'provider_unavailable':'failed',
   retryAfterSeconds:Number.isFinite(secs)&&secs>=0?Math.min(86400,Math.ceil(secs)):null};
}
async function readJsonResponse(response){
 const length=Number(response.headers?.get?.('content-length'));
 if(length>MAX_RESPONSE)throw Error('invalid_response');
 let raw='';
 if(response.body?.getReader){
  const reader=response.body.getReader(),dec=new TextDecoder();let bytes=0;
  try{
   for(;;){const c=await reader.read();if(c.done)break;bytes+=c.value.byteLength;
    if(bytes>MAX_RESPONSE){await reader.cancel();throw Error('invalid_response');}
    raw+=dec.decode(c.value,{stream:true});
   }
   raw+=dec.decode();
  }finally{reader.releaseLock();}
 }else raw=await response.text();
 if(raw.length>MAX_RESPONSE)throw Error('invalid_response');
 try{return JSON.parse(raw);}catch{throw Error('invalid_response');}
}
export async function safeGet(url,headers,fetcher=fetch){
 const parsed=new URL(url);
 const allowed=new Set(['api.openai.com','api.anthropic.com','api.dataforseo.com','api.deepseek.com']);
 if(parsed.protocol!=='https:'||!allowed.has(parsed.hostname)||parsed.username||parsed.password)throw Error('unsafe_endpoint');
 let r;
 try{r=await fetcher(url,{method:'GET',headers:{Accept:'application/json',...headers},
   redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});}
 catch{throw Error('provider_unavailable');}
 if(!r.ok){
  const e=providerError(r.status,r.headers),err=new Error(e.code);
  err.retryAfterSeconds=e.retryAfterSeconds;throw err;
 }
 return await readJsonResponse(r);
}
function assertRows(data){if(!Array.isArray(data))throw Error('invalid_response');return data;}
export async function readOpenAICosts({apiKey,now=new Date(),fetcher=fetch}){
 const win=monthRange(now);let total=0,cursor=null,pages=0;
 if(!apiKey)throw Error('not_configured');
 do{
  const u=new URL('https://api.openai.com/v1/organization/costs');
  u.searchParams.set('start_time',String(win.fromEpoch));u.searchParams.set('end_time',String(win.toEpoch));
  u.searchParams.set('limit','100');
  if(cursor)u.searchParams.set('page',cursor);
  const json=await safeGet(u.toString(),{Authorization:'Bearer '+apiKey},fetcher);
  for(const bucket of assertRows(json.data)){
   for(const row of assertRows(bucket.results)){
    currencyUSD(row.amount?.currency);
    total+=finiteMoney(row.amount?.value);
   }
  }
  cursor=json.has_more===true?json.next_page:null;
  if(json.has_more===true&&(!cursor||typeof cursor!=='string'))throw Error('invalid_response');
  if(++pages>20)throw Error('report_too_large');
 }while(cursor);
 if(!Number.isFinite(total))throw Error('invalid_response');
 return {provider:'openai',period_month:win.month,month_spend_usd:Number(total.toFixed(6)),
  credit_balance:null,credit_currency:null,credit_available:null,
  cost_basis:'api_reported_cost',report_through:win.to,source:'provider_api'};
}
export async function readAnthropicCosts({apiKey,now=new Date(),fetcher=fetch}){
 if(!apiKey)throw Error('not_configured');
 const win=monthRange(now);let totalCents=0,cursor=null,pages=0,sawData=false,asof=null;
 do{
  const u=new URL('https://api.anthropic.com/v1/organizations/analytics/cost');
  u.searchParams.set('starting_at',win.from);
  u.searchParams.set('ending_at',win.to);
  u.searchParams.set('limit','1000');
  if(cursor)u.searchParams.set('page',cursor);
  const json=await safeGet(u.toString(),{
   'x-api-key':apiKey,'anthropic-version':'2026-10-21',
   'anthropic-beta':'analytics-usage-cost-2026-08-24'},fetcher);
  for(const row of assertRows(json.data)){
   currencyUSD(row.cost?.currency);
   totalCents+=finiteMoney(row.cost?.amount);sawData=true;
  }
  asof=typeof json.data_refreshed_at==='string'?json.data_refreshed_at:asof;
  cursor=json.has_more===true?json.next_page:null;
  if(json.has_more===true&&(!cursor||typeof cursor!=='string'))throw Error('invalid_response');
  if(++pages>20)throw Error('report_too_large');
 }while(cursor);
 if(!sawData)throw Error('report_not_yet_available');
 return {provider:'anthropic',period_month:win.month,month_spend_usd:Number((totalCents/100).toFixed(6)),
  credit_balance:null,credit_currency:null,credit_available:null,
  cost_basis:'api_reported_precredits',report_through:asof??win.to,source:'provider_api'};
}
export async function readDataForSeoBalance({login,password,now=new Date(),fetcher=fetch}){
 if(!login||!password)throw Error('not_configured');
 const token=btoa(login+':'+password);
 const json=await safeGet('https://api.dataforseo.com/v3/appendix/user_data',{Authorization:'Basic '+token},fetcher);
 if(Number(json.status_code)!==20000)throw Error('invalid_response');
 const detail=json.tasks?.[0]?.result?.[0];
 const balance=finiteMoney(detail?.money?.balance,{negative:true});
 return {provider:'dataforseo',period_month:monthRange(now).month,month_spend_usd:null,
  credit_balance:balance,credit_currency:'USD',credit_available:balance>0,
  cost_basis:'balance_only',report_through:null,source:'provider_api'};
}
export async function readDeepSeekBalance({apiKey,now=new Date(),fetcher=fetch}){
 if(!apiKey)throw Error('not_configured');
 const json=await safeGet('https://api.deepseek.com/user/balance',{Authorization:'Bearer '+apiKey},fetcher);
 const rows=assertRows(json.balance_infos);
 const picked=rows.find(x=>x.currency==='USD')??rows.find(x=>x.currency==='CNY');
 if(!picked)throw Error('invalid_response');
 const balance=finiteMoney(picked.total_balance,{negative:true});
 return {provider:'deepseek',period_month:monthRange(now).month,month_spend_usd:null,
  credit_balance:balance,credit_currency:picked.currency,
  credit_available:typeof json.is_available==='boolean'?json.is_available:null,
  cost_basis:'balance_only',report_through:null,source:'provider_api'};
}
export function sanitizeProviderError(e){
 const known=new Set(['unauthorized','rate_limited','provider_unavailable','failed','invalid_response',
  'report_too_large','report_not_yet_available','not_configured','unsafe_endpoint']);
 return known.has(e?.message)?e.message:'failed';
}
export function nextAllowed(now,code,retryAfterSeconds=null){
 const base={success:6,not_configured:24,unauthorized:24,rate_limited:2,
   provider_unavailable:1,failed:3,invalid_response:6,report_too_large:12,report_not_yet_available:4};
 const h=base[code]??3;
 return new Date(new Date(now).getTime()+Math.max(h*HOUR,
   Number.isFinite(retryAfterSeconds)?Math.min(86400,retryAfterSeconds)*1000:0)).toISOString();
}
