import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {configureBot} from './setup.mjs';
import {interpret,privateMessage,HELP} from './intents.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const origin='https://cip.gritnews.com.br',cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const configured=(token:string,secret:string)=>/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)&&/^[A-Za-z0-9_-]{32,256}$/.test(secret);
async function credentials(){const r=await db.rpc('cip_bot_config_read');if(r.error)throw Error('configuration_unavailable');return r.data??{token:Deno.env.get('CIP_TELEGRAM_BOT_TOKEN')??'',secret:Deno.env.get('CIP_TELEGRAM_WEBHOOK_SECRET')??'',username:null};}
function secretMatches(value:string,secret:string){if(value.length!==secret.length)return false;let difference=0;for(let i=0;i<value.length;i++)difference|=value.charCodeAt(i)^secret.charCodeAt(i);return difference===0;}
const hash=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function body(req:Request){const reader=req.body?.getReader();if(!reader)throw Error('body');const chunks:Uint8Array[]=[];let size=0;while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>32768){await reader.cancel();throw Error('size');}chunks.push(r.value);}const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(all));}
async function send(chat:string,text:string,token:string){
 const res=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:text.slice(0,3900),protect_content:true,link_preview_options:{is_disabled:true}}),signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error('delivery');const data=await res.json();if(!data.ok)throw Error('delivery');
}
const companies:Record<string,string>={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
function render(data:any,intent:any){
 const header=`Doquita · ${companies[data.company]??'CIP'}\nConsulta: ${new Date(data.generated_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília)\nFonte: cadastro CIP atual\n\n`;
 if(intent.kind==='knowledge')return header+(data.knowledge?.length?data.knowledge.map((m:any)=>`${m.title}\nLocalizador: ${m.locator??'Documento'}\nExtração: ${m.date}\n${m.content}`).join('\n\n'):'Nenhum trecho aprovado, extraído e vigente encontrado para essa busca. Tente /conhecimento seguido de um termo específico.')+'\n\nTrechos de referência, sem síntese gerada por IA. Confira a orientação completa na Escola: https://cip.gritnews.com.br/';
 if(intent.kind==='processes')return header+`${data.processes} mapas salvos. O desenho e a simulação estão em Processos vivos: https://cip.gritnews.com.br/`;
 const labels:Record<string,string>={queued:'Na fila',in_progress:'Em andamento pelo time',review:'Em revisão',done:'Concluídas pelo time',cancelled:'Canceladas'};
 return header+'Missões cadastradas (todos os períodos):\n'+Object.entries(labels).map(([k,v])=>`${v}: ${Number(data.missions?.[k]??0)}`).join('\n')+(intent.kind==='summary'?`\n\nMapas de processos: ${data.processes}\nMateriais aprovados dentro da revisão: ${data.materials}`:'')+'\n\nEstados registrados pelo time; não comprovam execução autônoma. Vendas e estoque: integração Procfit pendente. https://cip.gritnews.com.br/';
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 const webhook=req.headers.get('X-Telegram-Bot-Api-Secret-Token');
 if(webhook===null){
  if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'origin_not_allowed'});
  try{const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('authorization')??''}},auth:{persistSession:false}});const u=await client.auth.getUser();if(u.error||!u.data?.user)return reply(401,{error:'authentication_required'});
   const p=await db.from('cip_profiles').select('active,role').eq('user_id',u.data.user.id).single();if(!p.data?.active)return reply(403,{error:'cip_access_required'});
   const b=await body(req);
   if(b.action==='configure'){
    if(p.data.role!=='superadm')return reply(403,{error:'superadmin_required'});
    if(req.headers.get('origin')!==origin)return reply(403,{error:'origin_required'});
    try{const result=await configureBot({db,actor:u.data.user.id,token:typeof b.token==='string'?b.token.trim():null,exclusive:b.exclusive,projectUrl:url,randomSecret:()=>[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join('')});return reply(200,result);}
    catch(e){const allowed=['invalid_configuration','invalid_bot_token','invalid_bot_identity','configuration_busy','webhook_not_confirmed','configuration_not_saved'];const code=e instanceof Error&&allowed.includes(e.message)?e.message:'telegram_unavailable';return reply(400,{error:code});}
   }
   const cfg=await credentials();
   if(b.action==='status')return reply(200,{configured:configured(cfg.token,cfg.secret),pilot_allowed:p.data.role==='superadm',username:cfg.username??null});
   if(b.action==='pair'){
    if(!configured(cfg.token,cfg.secret))return reply(409,{error:'channel_not_configured'});
    if(p.data.role!=='superadm')return reply(403,{error:'pilot_superadmin_required'});
    const r=await db.rpc('cip_bot_pair_code',{p_user:u.data.user.id,p_company:b.company});return r.error?reply(409,{error:'pair_not_created'}):reply(200,r.data);
   }
   if(b.action==='revoke'){const r=await db.rpc('cip_bot_revoke',{p_user:u.data.user.id});return r.error?reply(503,{error:'revoke_not_confirmed'}):reply(200,{revoked:true});}
   return reply(400,{error:'unknown_action'});
  }catch{return reply(400,{error:'invalid_request'});}
 }
 let cfg:any;try{cfg=await credentials();}catch{return reply(503,{error:'configuration_unavailable'});}
 if(!configured(cfg.token,cfg.secret))return reply(503,{error:'channel_not_configured'});if(!secretMatches(webhook,cfg.secret))return reply(401,{error:'invalid_webhook_secret'});
 let message:any=null;
 try{
  message=privateMessage(await body(req));if(!message)return reply(200,{ignored:true});
  const claim=await db.rpc('cip_bot_claim',{p_update:message.update_id,p_telegram:message.user});if(claim.error)return reply(503,{error:'queue_unavailable'});
  if(['done','limited','exhausted'].includes(claim.data))return reply(200,{accepted:true});if(claim.data!=='claimed')return reply(503,{error:'retry_later'});
  const intent=interpret(message.text);let text='';
  if(intent.kind==='pair'){
   const r=await db.rpc('cip_bot_bind',{p_hash:await hash(intent.code),p_telegram:message.user,p_chat:message.chat});if(r.error)throw Error('pair');text=r.data?'Vínculo confirmado. Sou o Doquita. Envie /resumo para consultar o cadastro da empresa vinculada. Para trocar de empresa, gere outro código no CIP.':'Código inválido, expirado, utilizado ou conta não autorizada. Gere um novo código em Doquita no Telegram no CIP.';
  }else{
   const r=await db.rpc('cip_bot_read',{p_telegram:message.user,p_chat:message.chat,p_kind:intent.kind,p_query:intent.query??''});if(r.error)throw Error('read');
   if(!r.data?.authorized)text='Para consultar dados, entre no CIP e gere um código em Doquita no Telegram. Use apenas conversa privada com o seu bot.';
   else if(intent.kind==='revoke')text='Vínculo revogado. Novas consultas exigem outro código gerado no CIP.';
   else if(intent.kind==='blocked')text='O Doquita no Telegram oferece apenas consultas. Alterações e aprovações devem ocorrer no CIP com a alçada responsável.';
   else if(intent.kind==='erp_unavailable')text='A integração Procfit ainda está pendente. Não tenho dados reais de vendas, faturamento, margens ou saldo de produtos para responder. Posso consultar missões, mapas de processos e conhecimento aprovado.';
   else if(intent.kind==='help')text=HELP;
   else text=render(r.data,intent);
  }
  await send(message.chat,text,cfg.token);
  const done=await db.from('cip_bot_updates').update({state:'done',updated_at:new Date().toISOString()}).eq('update_id',message.update_id);if(done.error)throw Error('ack');
  return reply(200,{accepted:true});
 }catch{if(message)await db.from('cip_bot_updates').update({state:'failed',updated_at:new Date().toISOString()}).eq('update_id',message.update_id);return reply(503,{error:'request_unavailable'});}
});
