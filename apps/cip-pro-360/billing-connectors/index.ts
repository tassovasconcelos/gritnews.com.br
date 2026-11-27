// CIP360 · private, read-only billing reconciliation runner.
// All provider endpoints are static. No public queries, secrets in logs, payload storage or account-level double counting.
import {readOpenAICosts,readAnthropicCosts,readDataForSeoBalance,readDeepSeekBalance,
 sanitizeProviderError,nextAllowed} from './providers.mjs';
const providers=['openai','anthropic','dataforseo','deepseek'];
const json=(status,data)=>new Response(JSON.stringify(data),{status,
 headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
function validSecret(candidate,expected){
 if(typeof expected!=='string'||expected.length<32||typeof candidate!=='string'||candidate.length!==expected.length)return false;
 let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^candidate.charCodeAt(i);
 return mismatch===0;
}
function environment(){
 return {
  shared:Deno.env.get('CIP_BILLING_SYNC_SECRET'),
  url:Deno.env.get('SUPABASE_URL'),
  serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  openai:Deno.env.get('CIP_OPENAI_ADMIN_KEY'),
  anthropic:Deno.env.get('CIP_ANTHROPIC_ADMIN_KEY'),
  dataforseoLogin:Deno.env.get('CIP_DATAFORSEO_LOGIN'),
  dataforseoPassword:Deno.env.get('CIP_DATAFORSEO_PASSWORD'),
  deepseek:Deno.env.get('CIP_DEEPSEEK_API_KEY')
 };
}
async function database(env,table,method,body,filter=''){
 const domain=new URL(env.url);
 if(domain.protocol!=='https:'||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(domain.origin))throw Error('database_config_invalid');
 const url=domain.origin+'/rest/v1/'+table+filter;
 const response=await fetch(url,{
  method,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(9000),
  headers:{apikey:env.serviceKey,authorization:'Bearer '+env.serviceKey,'content-type':'application/json',
   accept:'application/json',...(method==='POST'?{'Prefer':'return=minimal'}:{})},
  ...(method==='GET'?{}:{body:JSON.stringify(body)})
 });
 if(!response.ok)throw Error('database_unavailable');
 if(method==='GET')return await response.json();
 return null;
}
function configured(env,provider){
 if(provider==='openai')return !!env.openai;
 if(provider==='anthropic')return !!env.anthropic;
 if(provider==='dataforseo')return !!env.dataforseoLogin&&!!env.dataforseoPassword;
 if(provider==='deepseek')return !!env.deepseek;
 return false;
}
async function report(env,provider,now){
 switch(provider){
  case 'openai':return readOpenAICosts({apiKey:env.openai,now});
  case 'anthropic':return readAnthropicCosts({apiKey:env.anthropic,now});
  case 'dataforseo':return readDataForSeoBalance({login:env.dataforseoLogin,password:env.dataforseoPassword,now});
  case 'deepseek':return readDeepSeekBalance({apiKey:env.deepseek,now});
  default:throw Error('invalid_provider');
 }
}
async function updateStatus(env,provider,patch){
 return database(env,'cip_ops_global_provider_sync','PATCH',patch,
  '?provider=eq.'+encodeURIComponent(provider));
}
async function syncProvider(env,provider,now){
 const rows=await database(env,'cip_ops_global_provider_sync','GET',null,
  '?provider=eq.'+encodeURIComponent(provider)+'&select=provider,state,last_success_at,next_retry_at&limit=1');
 const current=rows?.[0]||null;
 if(!current)throw Error('provider_not_initialized');
 if(!configured(env,provider)){
  if(current.state!=='not_configured')await updateStatus(env,provider,{
   state:'not_configured',last_error_code:null,next_retry_at:null,updated_at:now.toISOString()});
  return {provider,status:'not_configured'};
 }
 if(current.next_retry_at && Date.parse(current.next_retry_at)>now.getTime())
  return {provider,status:'not_due'};
 try{
  const reportValue=await report(env,provider,now);
  if(reportValue.provider!==provider||reportValue.source!=='provider_api'||reportValue.period_month!==now.toISOString().slice(0,7)+'-01')
   throw Error('invalid_response');
  await database(env,'cip_ops_global_billing_snapshots','POST',{
   ...reportValue,account_ref:'primary',account_scope:'organization',observed_at:new Date().toISOString()
  });
  await updateStatus(env,provider,{state:'success',last_error_code:null,last_attempt_at:now.toISOString(),
   last_success_at:now.toISOString(),latest_report_at:reportValue.report_through,
   next_retry_at:nextAllowed(now,'success'),updated_at:now.toISOString()});
  return {provider,status:'success'};
 }catch(e){
  const code=sanitizeProviderError(e);
  await updateStatus(env,provider,{
   state:['unauthorized','rate_limited','provider_unavailable','invalid_response'].includes(code)?code:'failed',
   last_error_code:code,last_attempt_at:now.toISOString(),
   next_retry_at:nextAllowed(now,code,e?.retryAfterSeconds),
   updated_at:now.toISOString()
  });
  return {provider,status:code};
 }
}
Deno.serve(async req=>{
 if(req.method!=='POST')return json(405,{error:'method_not_allowed'});
 const env=environment();
 const supplied=req.headers.get('x-cip-billing-secret');
 if(!validSecret(supplied,env.shared))return json(401,{error:'unauthorized'});
 if(!env.url||!env.serviceKey)return json(503,{error:'service_unavailable'});
 const now=new Date();const out=[];
 try{
  for(const provider of providers)out.push(await syncProvider(env,provider,now));
  return json(200,{ok:true,checked_at:now.toISOString(),providers:out});
 }catch{
  return json(503,{ok:false,error:'billing_sync_unavailable'});
 }
});
