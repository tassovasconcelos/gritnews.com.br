import {generateProposal,validBrief} from './ai.mjs';
const origin='https://cip.gritnews.com.br';
const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
async function body(req){const reader=req.body?.getReader();if(!reader)throw Error();let size=0;const chunks=[];while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>60000){await reader.cancel();throw Error();}chunks.push(r.value);}const data=new Uint8Array(size);let at=0;for(const c of chunks){data.set(c,at);at+=c.length;}return JSON.parse(new TextDecoder().decode(data));}
export function createProcessHandler({db,createClient,url,anonKey,generate=generateProposal}){return async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'origin_not_allowed'});
 try{
  const client=createClient(url,anonKey,{global:{headers:{Authorization:req.headers.get('authorization')??''}},auth:{persistSession:false}}),auth=await client.auth.getUser();if(auth.error||!auth.data?.user)return reply(401,{error:'authentication_required'});
  let b;try{b=await body(req);}catch{return reply(400,{error:'invalid_brief'});}if(!validBrief(b))return reply(400,{error:'invalid_brief'});
  const access=await client.rpc('cip_can_access',{p_company:b.company,p_write:true});if(access.error||access.data!==true)return reply(403,{error:'company_write_required'});
  const cfg=await db.rpc('cip_bot_config_read');if(cfg.error||cfg.data?.ai_enabled!==true||!cfg.data?.ai_key)return reply(409,{error:'ai_not_configured'});
  const rate=await db.rpc('cip_process_ai_claim',{p_actor:auth.data.user.id});if(rate.error||rate.data!==true)return reply(429,{error:'daily_limit'});
  const proposal=await generate(b,{key:cfg.data.ai_key});return reply(200,{proposal,provider:'openai',model:'gpt-4.1-mini-2025-04-14',generated_at:new Date().toISOString()});
 }catch(e){const code=e instanceof Error&&['invalid_proposal','proposal_not_completed'].includes(e.message)?e.message:'assistant_unavailable';return reply(503,{error:code});}
};}
