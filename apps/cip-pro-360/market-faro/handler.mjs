import {sourceUrl,validRadarRequest} from '../market-radar-engine.mjs';
import {requestResearch} from '../market-radar/research.mjs';
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length>200||b.length<32)return false;const encode=new TextEncoder(),[x,y]=await Promise.all([crypto.subtle.digest('SHA-256',encode.encode(a)),crypto.subtle.digest('SHA-256',encode.encode(b))]);let diff=0;const xx=new Uint8Array(x),yy=new Uint8Array(y);for(let i=0;i<xx.length;i++)diff|=xx[i]^yy[i];return diff===0;}
export function createFaroWorker({db,research=requestResearch}){return async req=>{
 if(req.method!=='POST')return reply(405,{error:'post_required'});if(req.headers.has('origin'))return reply(403,{error:'server_only'});
 const incoming=req.headers.get('x-cip-faro-secret');if(!incoming)return reply(401,{error:'worker_auth_required'});
 try{
 const secret=await db.rpc('cip_faro_worker_secret');if(secret.error||!await equal(incoming,secret.data))return reply(401,{error:'worker_auth_required'});
 const cfg=await db.rpc('cip_bot_config_read');if(cfg.error||cfg.data?.ai_enabled!==true||!cfg.data?.ai_key)return reply(409,{error:'ai_not_configured'});
 const claimed=await db.rpc('cip_faro_claim');if(claimed.error||!Array.isArray(claimed.data))return reply(503,{error:'queue_unavailable'});
 const results=await Promise.allSettled(claimed.data.slice(0,2).map(async job=>{
 try{
  if(!validRadarRequest({company:job.company,sku:job.sku,store:job.store,criteria:job.criteria,domains:job.domains,mode:'identity',consent:true}))throw Error('identity_required');
  const target=await db.rpc('cip_faro_directory_target',{p_job:job.job,p_lease:job.lease});if(target.error)throw Error('regional_source_unavailable');
  const region=target.data??null,domains=region?[region.domain]:job.domains;
  if(!validRadarRequest({company:job.company,sku:job.sku,store:job.store,criteria:job.criteria,domains,mode:'identity',consent:true}))throw Error('identity_required');
  const result=await research({our:job.our,criteria:job.criteria,domains,region:region?.region,mode:region?.region?.allow_alternatives?'alternatives':job.mode==='alternatives'?'alternatives':'identity',focus:job.focus??null,discovery:false,monitoring:true,tracked_urls:(job.tracked_urls??[]).filter(u=>sourceUrl(u,domains)),already_seen:[]},{key:cfg.data.ai_key,limits:{calls:2,tokens:3200}});
  const saved=await db.rpc('cip_faro_finish',{p_job:job.job,p_lease:job.lease,p_offers:result.offers,p_meta:{...result.meta,special_focus:job.focus??null,...(region?{directory_target:{id:region.id,domain:region.domain,region:region.region}}:{})},p_failed:false});
  if(saved.error)throw Error('research_not_saved');return {state:saved.data?.state??'completed',offers:result.offers.length};
 }catch(e){const error=['regional_source_unavailable','identity_required','search_not_completed','search_without_sources','invalid_search_output','provider_rate_limit','research_not_saved'].includes(e?.message)?e.message:'research_unavailable';
  const saved=await db.rpc('cip_faro_finish',{p_job:job.job,p_lease:job.lease,p_offers:[],p_meta:{error,special_focus:job.focus??null,origin:'faro_hourly',coverage:'sample'},p_failed:true});
  return {state:saved.error?'finish_unconfirmed':'failed',error};
 }
 }));
 return reply(200,{claimed:claimed.data.length,results:results.map(r=>r.status==='fulfilled'?r.value:{state:'failed'}),advisory:true});
 }catch{return reply(503,{error:'worker_unavailable'});}
};}
