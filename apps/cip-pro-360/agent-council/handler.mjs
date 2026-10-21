import {validCouncilRequest,COUNCIL_MODEL} from '../agent-operations-engine.mjs';
import {generateCouncil} from './ai.mjs';
const origin='https://cip.gritnews.com.br',cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
async function readBody(req){const reader=req.body?.getReader();if(!reader)throw Error();let size=0,text='';const decoder=new TextDecoder();while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>8000){await reader.cancel();throw Error();}text+=decoder.decode(x.value,{stream:true});}return JSON.parse(text+decoder.decode());}
export function createCouncilHandler({db,createClient,url,anonKey,generate=generateCouncil}){return async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'origin_not_allowed'});
 try{
 const client=createClient(url,anonKey,{global:{headers:{Authorization:req.headers.get('authorization')??''}},auth:{persistSession:false}}),auth=await client.auth.getUser();if(auth.error||!auth.data?.user)return reply(401,{error:'authentication_required'});
 let b;try{b=await readBody(req);}catch{return reply(400,{error:'invalid_request'});}if(!validCouncilRequest(b))return reply(400,{error:'invalid_request'});
 const access=await client.rpc('cip_agent_can_manage',{p_company:b.company});if(access.error||access.data!==true)return reply(403,{error:'manager_required'});
 const source=await client.from('cip_agent_cycles').select('id,company_id,created_at,report').eq('company_id',b.company).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(source.error||!source.data||source.data.company_id!==b.company||Date.now()-Date.parse(source.data.created_at)>8*3600000)return reply(409,{error:'cycle_required'});
 const cfg=await db.rpc('cip_bot_config_read');if(cfg.error||cfg.data?.ai_enabled!==true||!cfg.data?.ai_key)return reply(409,{error:'ai_not_configured'});
 const claim=await db.rpc('cip_agent_council_claim',{p_actor:auth.data.user.id,p_company:b.company});if(claim.error||claim.data!==true)return reply(429,{error:'daily_limit'});
 const r=source.data.report;
 const knowledge=await client.rpc('cip_academy_search',{p_company:b.company,p_query:'',p_agent:null,p_limit:6});
 const skills=await client.rpc('cip_agent_skills',{p_company:b.company});
 if(knowledge.error||skills.error)return reply(503,{error:'knowledge_unavailable'});
 const context={analysis_at:new Date().toISOString(),skills:(skills.data??[]).map(s=>({...s,instructions:s.instructions.slice(0,3000),limits:s.limits.slice(0,1000)})),company:b.company,objective:b.objective,cycle_at:source.data.created_at,facts:r.facts,agents:r.agents,reviewed_cases:r.reviewed_cases,knowledge:(knowledge.data??[]).map(x=>({id:x.material_id,title:x.title,locator:x.locator,content:x.content.slice(0,1600)}))};
 const result=await generate(context,{key:cfg.data.ai_key});
 const stillAuthorized=await client.rpc('cip_agent_can_manage',{p_company:b.company});if(stillAuthorized.error||stillAuthorized.data!==true)return reply(403,{error:'manager_required'});
 const saved=await db.from('cip_agent_councils').insert({company_id:b.company,cycle_id:source.data.id,actor:auth.data.user.id,model:COUNCIL_MODEL,result}).select('id').single();if(saved.error)return reply(503,{error:'council_not_saved'});
 return reply(200,{id:saved.data.id,result,model:COUNCIL_MODEL,advisory:true});
 }catch{return reply(503,{error:'council_unavailable'});}
};}
