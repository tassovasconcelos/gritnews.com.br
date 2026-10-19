import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {requestOfficial,validateResearch} from '../b2g-research.mjs';
import {requestMarketResearch,validateMarketQuery} from '../b2g-market-search.mjs';
import {requestWebResearch} from '../b2g-web-search.mjs';
import {validateWebQuery} from '../b2g-sources.mjs';
import {requestDiscovery,validateDiscovery} from '../b2g-discovery.mjs';
const origin='https://cip.gritnews.com.br',cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const cache=new Map<string,{at:number,value:unknown}>(),limits=new Map<string,{at:number,count:number}>();
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return reply(405,{error:'post_required'});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'origin_denied'});
 try{
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('authorization')??''}},auth:{persistSession:false}});
  const user=await db.auth.getUser();if(user.error||!user.data?.user)return reply(401,{error:'authentication_required'});
  const access=await db.rpc('cip_can_access',{p_company:'distribuidora_prohospital'});if(access.error||access.data!==true)return reply(403,{error:'distribuidora_access_required'});
  const now=Date.now(),id=user.data.user.id;let budget=limits.get(id);if(!budget||now-budget.at>60000){budget={at:now,count:0};limits.set(id,budget);}if(++budget.count>100)return reply(429,{error:'query_limit'});
  const reader=req.body?.getReader();if(!reader)return reply(400,{error:'body_required'});const chunks:Uint8Array[]=[];let size=0;while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>2048){await reader.cancel();return reply(413,{error:'request_limit'});}chunks.push(r.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}const raw=new TextDecoder().decode(bytes);const input=JSON.parse(raw),discovery=String(input?.action).startsWith('discover_'),q=input?.action==='discover_market'?validateMarketQuery(input):input?.action==='discover_web'?validateWebQuery(input):discovery?validateDiscovery(input):validateResearch(input),key=JSON.stringify(q),found=cache.get(key);
  if(found&&now-found.at<600000)return reply(200,found.value);
  let data;
  if(q.action==='discover_web'){
   const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
   const cfg=await admin.rpc('cip_bot_config_read');if(cfg.error||cfg.data?.ai_enabled!==true||!cfg.data?.ai_key)return reply(409,{error:'ai_not_configured'});
   const claim=await admin.rpc('cip_b2g_web_claim',{p_actor:id});if(claim.error||claim.data!==true)return reply(429,{error:'web_daily_limit'});
   data=await requestWebResearch(q,{key:cfg.data.ai_key});
  }else data=await (q.action==='discover_market'?requestMarketResearch(q):discovery?requestDiscovery(q):requestOfficial(q));if(cache.size>=8)cache.delete(cache.keys().next().value!);if(!discovery||!(data as any).failures?.length)cache.set(key,{at:now,value:data});if(limits.size>1000)for(const [k,v] of limits)if(now-v.at>60000)limits.delete(k);
  return reply(200,data);
 }catch(e){const code=e instanceof Error&&['invalid_query','invalid_sphere','invalid_action','invalid_id','invalid_code','invalid_page','invalid_period','invalid_state','ai_rate_limited','ai_key_invalid','web_search_unavailable','search_not_completed','search_without_sources','invalid_search_output'].includes(e.message)?e.message:'official_unavailable';return reply(code.startsWith('invalid_')?400:503,{error:code});}
});
