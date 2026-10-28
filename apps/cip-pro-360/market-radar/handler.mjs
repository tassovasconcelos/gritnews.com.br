import {validRadarRequest} from '../market-radar-engine.mjs';
import {requestResearch} from './research.mjs';
const origin='https://cip.gritnews.com.br',cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(s,d)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
async function body(req){const reader=req.body?.getReader();if(!reader)throw Error();const decoder=new TextDecoder();let raw='',size=0;while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>5000){await reader.cancel();throw Error();}raw+=decoder.decode(x.value,{stream:true});}return JSON.parse(raw+decoder.decode());}
export function createRadarHandler({db,createClient,url,anonKey,research=requestResearch}){return async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'origin_denied'});
 let run=null;try{
 const client=createClient(url,anonKey,{global:{headers:{Authorization:req.headers.get('authorization')??''}},auth:{persistSession:false}}),auth=await client.auth.getUser();if(auth.error||!auth.data?.user)return reply(401,{error:'authentication_required'});
 let b;try{b=await body(req);}catch{return reply(400,{error:'invalid_query'});}if(!validRadarRequest(b))return reply(400,{error:'invalid_query'});
 const access=await client.rpc('cip_market_can_write',{p_company:b.company});if(access.error||access.data!==true)return reply(403,{error:'writer_required'});
 const cfg=await db.rpc('cip_bot_config_read');if(cfg.error||cfg.data?.ai_enabled!==true||!cfg.data?.ai_key)return reply(409,{error:'ai_not_configured'});
 const claimed=await client.rpc('cip_market_start',{p_company:b.company,p_sku:b.sku,p_store:b.store,p_criteria:b.criteria,p_domains:b.domains,p_mode:b.mode});
 if(claimed.error||!claimed.data?.id){const code=claimed.error?.message;return reply(['daily_limit','search_in_progress'].includes(code)?429:409,{error:['daily_limit','search_in_progress','source_product_required'].includes(code)?code:'research_not_started'});}run=claimed.data;
 const past=await client.rpc('cip_market_get',{p_company:b.company,p_sku:b.sku});if(past.error)throw Error('history_unavailable');
 const context={our:run.our,criteria:run.criteria,domains:run.domains,mode:run.mode,already_seen:(past.data?.offers??[]).slice(0,50).map(x=>x.url)};
 const result=await research(context,{key:cfg.data.ai_key});
 const still=await client.rpc('cip_market_can_write',{p_company:b.company});if(still.error||still.data!==true)throw Error('writer_required');
 const saved=await db.rpc('cip_market_finish',{p_run:run.id,p_offers:result.offers,p_meta:result.meta,p_failed:false});if(saved.error)throw Error('research_not_saved');
 return reply(200,{id:run.id,offers:result.offers.length,meta:result.meta,advisory:true});
 }catch(e){const safe=['search_not_completed','search_without_sources','invalid_search_output','ai_not_configured','provider_rate_limit','writer_required','research_not_saved'].includes(e?.message)?e.message:'research_unavailable';
 if(run)await db.rpc('cip_market_finish',{p_run:run.id,p_offers:[],p_meta:{error:safe,coverage:'sample'},p_failed:true}).catch(()=>{});
 return reply(safe==='writer_required'?403:503,{error:safe});}
};}
