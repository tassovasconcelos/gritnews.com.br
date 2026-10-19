import {renderBrief,resultMenu,navigationMenu,rememberReport,restoreReport} from './response-style.mjs';
import {REFERENCE_KINDS,referenceArgs,renderReference} from './stock-reference.mjs';
import {checkAIReadiness,aiState} from './ai-readiness.mjs';
import {ERP_KINDS} from './erp-reports.mjs';
import {renderExecutive,renderShoppingPosition} from './executive-reports.mjs';
import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {configureBot,telegramApi,BOT_COMMANDS} from './setup.mjs';
import {classify,transcribe,validAIKey} from './ai.mjs';
import {parseUpdate,menu,moreMenu,companyMenu,companyIn,COMPANY_NAMES} from './conversation.mjs';
import {interpret,HELP} from './intents.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const origin='https://cip.gritnews.com.br',cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const configured=(token:string,secret:string)=>/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)&&/^[A-Za-z0-9_-]{32,256}$/.test(secret);
async function credentials(){const r=await db.rpc('cip_bot_config_read');if(r.error)throw Error('configuration_unavailable');return r.data??{token:Deno.env.get('CIP_TELEGRAM_BOT_TOKEN')??'',secret:Deno.env.get('CIP_TELEGRAM_WEBHOOK_SECRET')??'',username:null};}
async function ensureInteractive(cfg:any){
 if(!configured(cfg.token,cfg.secret)||cfg.interaction_version===4)return;
 try{await telegramApi(cfg.token,'setWebhook',{url:url+'/functions/v1/cip-telegram',secret_token:cfg.secret,allowed_updates:['message','callback_query'],max_connections:5});
 await telegramApi(cfg.token,'setMyCommands',{commands:BOT_COMMANDS});
 await db.rpc('cip_bot_interaction_ready',{p_bot_id:cfg.bot_id});}catch{}
}
function secretMatches(value:string,secret:string){if(value.length!==secret.length)return false;let difference=0;for(let i=0;i<value.length;i++)difference|=value.charCodeAt(i)^secret.charCodeAt(i);return difference===0;}
const hash=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function body(req:Request){const reader=req.body?.getReader();if(!reader)throw Error('body');const chunks:Uint8Array[]=[];let size=0;while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>32768){await reader.cancel();throw Error('size');}chunks.push(r.value);}const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(all));}
async function send(chat:string,text:string,token:string,keyboard:any=null){
 const chunks:string[]=[];let remaining=text;while(remaining.length>3800){let end=remaining.lastIndexOf('\n',3800);if(end<1000)end=3800;const code=remaining.charCodeAt(end-1);if(code>=0xd800&&code<=0xdbff)end--;chunks.push(remaining.slice(0,end));remaining=remaining.slice(end).replace(/^\n/,'');}chunks.push(remaining);
 for(let i=0;i<chunks.length;i++){
  const res=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:chunks[i],protect_content:true,...(keyboard&&i===chunks.length-1?{reply_markup:keyboard}:{}),link_preview_options:{is_disabled:true}}),signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw Error('delivery');const data=await res.json();if(!data.ok)throw Error('delivery');
 }
}
const companies:Record<string,string>={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
async function stockReference(user:string,chat:string,company:string,intent:any,text=''){
 if(company==='distribuidora_prohospital'){
  const scoped=referenceArgs(intent,text);if(scoped.p_scope!=='both')return {available:false};
  const intelligence=await db.rpc('cip_bot_stock_intelligence',{p_telegram:user,p_chat:chat,p_company:company,p_query:scoped.p_query,p_store:scoped.p_store});if(intelligence.error)throw Error('b2b_inventory_unavailable');if(intelligence.data?.available)return {...intelligence.data,company,source_kind:'inventory_intelligence'};
 }
 const args=referenceArgs(intent,text),current=await db.rpc('cip_bot_shopping_stock',{p_telegram:user,p_chat:chat,p_company:company,p_scope:args.p_scope==='cd100_partial'?'cd':args.p_scope==='stores_only_partial'?'stores':'all',p_query:args.p_query,p_store:args.p_store,p_alert:''});
 if(current.error)throw Error('shopping_position_unavailable');
 if(current.data?.available){let intelligence=null;if(intent.kind==='stock_priorities'){const r=await db.rpc('cip_bot_stock_intelligence',{p_telegram:user,p_chat:chat,p_company:company,p_query:args.p_query,p_store:args.p_store});if(r.error)throw Error('retail_intelligence_unavailable');if(r.data?.available)intelligence=r.data;}return {...current.data,intelligence,source_kind:'shopping_position'};}
 const legacy=await db.rpc('cip_bot_stock_reference',{p_telegram:user,p_chat:chat,p_company:company,...args});if(legacy.error)throw Error('stock_reference');return legacy.data;
}
function render(data:any,intent:any){
 const header=`${companies[data.company]??'CIP'} · cadastro atual\n\n`;
 if(intent.kind==='knowledge')return header+(data.knowledge?.length?data.knowledge.slice(0,2).map((m:any)=>`${m.title}\n${String(m.content).slice(0,220)}${String(m.content).length>220?'…':''}`).join('\n\n'):'Nenhum trecho aprovado, extraído e vigente encontrado para essa busca. Tente /conhecimento seguido de um termo específico.')+'\n\nTrechos aprovados. Orientação completa na Escola: https://cip.gritnews.com.br/';
 if(intent.kind==='processes')return header+`${data.processes} mapas salvos. O desenho e a simulação estão em Processos vivos: https://cip.gritnews.com.br/`;
 const labels:Record<string,string>={queued:'Na fila',in_progress:'Em andamento pelo time',review:'Em revisão',done:'Concluídas pelo time',cancelled:'Canceladas'};
 return header+'Missões cadastradas (todos os períodos):\n'+Object.entries(labels).map(([k,v])=>`${v}: ${Number(data.missions?.[k]??0)}`).join('\n')+(intent.kind==='summary'?`\n\nMapas de processos: ${data.processes}\nMateriais aprovados dentro da revisão: ${data.materials}`:'')+'\n\nEstados registrados pelo time. Detalhes no CIP: https://cip.gritnews.com.br/';
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 const dailySecret=req.headers.get('X-CIP-Stock-Daily-Secret');
 if(dailySecret!==null){
  let cfg:any;try{cfg=await credentials();}catch{return reply(503,{error:'configuration_unavailable'});}
  if(!configured(cfg.token,cfg.secret)||!secretMatches(dailySecret,cfg.secret))return reply(401,{error:'invalid_daily_secret'});
  const claims=await db.rpc('cip_bot_stock_daily_claim');if(claims.error)return reply(503,{error:'daily_queue_unavailable'});
  let sent=0,failed=0;for(const target of claims.data??[]){try{
   const state=await db.rpc('cip_bot_stock_subscribe',{p_telegram:target.telegram_id,p_chat:target.chat_id,p_enabled:null});if(state.error||state.data?.enabled!==true)throw Error('subscription_inactive');
   const reference=await stockReference(target.telegram_id,target.chat_id,'shopping_prohospital',{kind:'stock_priorities'});
   await send(target.chat_id,'Briefing diário da Shopping · referências disponíveis\nUse /rotina desativar para interromper.\n\n'+renderBrief([{company:'shopping_prohospital',reference}],'stock_priorities'),cfg.token,navigationMenu());
   await db.rpc('cip_bot_stock_daily_finish',{p_telegram:target.telegram_id,p_success:true});sent++;
  }catch{await db.rpc('cip_bot_stock_daily_finish',{p_telegram:target.telegram_id,p_success:false});failed++;}}
  return reply(200,{sent,failed});
 }
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
   if(b.action==='status'){if(p.data.role==='superadm')await ensureInteractive(cfg);return reply(200,{configured:configured(cfg.token,cfg.secret),pilot_allowed:['superadm','diretoria'].includes(p.data.role),admin_allowed:p.data.role==='superadm',username:cfg.username??null,ai_enabled:cfg.ai_enabled===true,ai_state:aiState(cfg)});}
   if(b.action==='configure_ai'){
    if(p.data.role!=='superadm'||req.headers.get('origin')!==origin)return reply(403,{error:'superadmin_required'});
    if(b.enabled===false){const r=await db.rpc('cip_bot_ai_save',{p_actor:u.data.user.id,p_key:null,p_enabled:false});return r.error?reply(503,{error:'ai_not_saved'}):reply(200,{ai_enabled:false});}
    if(!validAIKey(b.key)||b.consent!==true)return reply(400,{error:'ai_key_and_consent_required'});
    const readiness=await checkAIReadiness({key:b.key});if(!readiness.text_ready||!readiness.voice_ready)return reply(400,readiness);
    const r=await db.rpc('cip_bot_ai_save',{p_actor:u.data.user.id,p_key:b.key,p_enabled:true});return r.error?reply(503,{error:'ai_not_saved'}):reply(200,{ai_enabled:true});
   }
   if(b.action==='pair'){
    if(!configured(cfg.token,cfg.secret))return reply(409,{error:'channel_not_configured'});
    if(!['superadm','diretoria'].includes(p.data.role))return reply(403,{error:'director_access_required'});
    const r=await db.rpc('cip_bot_pair_code',{p_user:u.data.user.id,p_company:b.company});return r.error?reply(409,{error:'pair_not_created'}):reply(200,r.data);
   }
   if(b.action==='revoke'){const r=await db.rpc('cip_bot_revoke',{p_user:u.data.user.id});return r.error?reply(503,{error:'revoke_not_confirmed'}):reply(200,{revoked:true});}
   return reply(400,{error:'unknown_action'});
  }catch{return reply(400,{error:'invalid_request'});}
 }
 let cfg:any;try{cfg=await credentials();}catch{return reply(503,{error:'configuration_unavailable'});}
 if(!configured(cfg.token,cfg.secret))return reply(503,{error:'channel_not_configured'});if(!secretMatches(webhook,cfg.secret))return reply(401,{error:'invalid_webhook_secret'});
 await ensureInteractive(cfg);
 let message:any=null;
 try{
  message=parseUpdate(await body(req));if(!message)return reply(200,{ignored:true});
  const claim=await db.rpc('cip_bot_claim',{p_update:message.update_id,p_telegram:message.user});if(claim.error)return reply(503,{error:'queue_unavailable'});
  if(['done','limited','exhausted'].includes(claim.data))return reply(200,{accepted:true});if(claim.data!=='claimed')return reply(503,{error:'retry_later'});
  if(message.callback){try{await fetch(`https://api.telegram.org/bot${cfg.token}/answerCallbackQuery`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({callback_query_id:message.callback}),signal:AbortSignal.timeout(5000)});}catch{}}
  let intent:any=message.intent??interpret(message.text),text='',keyboard:any=null,detailed=false,reportAnswered=false;
  if(intent.kind==='pair'){
   const r=await db.rpc('cip_bot_bind',{p_hash:await hash(intent.code),p_telegram:message.user,p_chat:message.chat});if(r.error)throw Error('pair');text=r.data?'Vínculo confirmado, sem prazo de expiração. Sou o Doquita. Escolha a empresa para começar.':'Código inválido, expirado, utilizado ou conta não autorizada. O código de ativação dura 10 minutos; o vínculo concluído não expira.';if(r.data){const c=await db.rpc('cip_bot_context',{p_telegram:message.user,p_chat:message.chat});keyboard=companyMenu(c.data?.companies??[]);}
  }else{
   const getContext=()=>db.rpc('cip_bot_context',{p_telegram:message.user,p_chat:message.chat});
   let context=await getContext();if(context.error)throw Error('context');
   if(!context.data?.authorized)text='Entre no CIP e gere um código em Doquita no Telegram para vincular sua conta. Após ativado, o vínculo não tem prazo de expiração.';
   else{
    const allowed=context.data.companies;keyboard=navigationMenu();let aiError=false;
    const isAI=cfg.ai_enabled&&validAIKey(cfg.ai_key);
    let aiAllowed=false;
    if(isAI&&(message.audio||!message.intent&&intent.kind!=='report_followup'&&!message.text.startsWith('/')&&!REFERENCE_KINDS.includes(intent.kind)&&intent.kind!=='stock_routine')){const a=await db.rpc('cip_bot_ai_claim',{p_update:message.update_id,p_telegram:message.user,p_chat:message.chat});aiAllowed=!a.error&&a.data===true;}
    if(message.audio){
     if(!isAI)text=aiState(cfg)==='missing_key'?'Recebi seu áudio, mas ainda não há chave OpenAI API configurada. No CIP, abra Doquita no Telegram → Texto e voz com IA e cadastre a chave no campo protegido. Não envie a chave ao bot. Depois de ativar, reenvie o áudio.':'Recebi seu áudio, mas a IA está desativada. O superadm pode habilitar Texto e voz com IA no CIP. Depois de ativar, reenvie o áudio.';
     else if(!aiAllowed)text='O limite de 100 solicitações com IA por dia foi atingido. Use os botões ou os comandos de texto.';
     else try{message.text=await transcribe(message.audio,{botToken:cfg.token,key:cfg.ai_key});intent=interpret(message.text);}catch(e){text=e instanceof Error&&e.message==='audio_limit'?'Envie um áudio de até 3 minutos e 10 MB.':'Não consegui transcrever com segurança. Tente um áudio mais curto ou escreva seu pedido.';}
    }
    if(!text){
     const followup=intent.kind==='report_followup';
     if(followup){
      detailed=intent.detailed===true;const previous=restoreReport(context.data);
      if(previous){intent=previous.intent;message.text=previous.text;}
      else text='Faça uma consulta primeiro e depois toque em Detalhar última consulta. A referência da conversa dura 20 minutos e é limpa ao trocar de empresa.';
     }
     const directCompany=followup?null:message.intent?.company??companyIn(message.text);
     if(aiAllowed&&!followup&&!message.intent&&!REFERENCE_KINDS.includes(intent.kind)&&intent.kind!=='stock_routine'){try{const routed=await classify(message.text,{key:cfg.ai_key,context:{company:context.data.all?'all':context.data.company,last_kind:context.data.last_kind,last_query:context.data.last_query}});if(intent.kind!=='blocked'&&intent.kind!=='erp_unavailable')intent=routed;}catch{aiError=true;}}
     const chosen=directCompany??(intent.company&&intent.company!=='current'?intent.company:null);
     if(chosen){const change=await db.rpc('cip_bot_choose_company',{p_telegram:message.user,p_chat:message.chat,p_company:chosen});if(change.error)throw Error('scope');if(change.data!==true){text='Esta empresa não está autorizada para sua conta. Selecione uma das empresas disponíveis.';keyboard=companyMenu(allowed);}else{context=await getContext();if(!context.data?.authorized)throw Error('scope');}}
     const scope=context.data.all?'all':context.data.company;
     if(text){}
     else if(intent.kind==='choose_company'||chosen&&intent.kind==='help')text='Empresa selecionada: '+COMPANY_NAMES[scope]+'. O vínculo continua ativo. Escolha uma consulta abaixo.';
     else if(intent.kind==='companies'){text='Escolha o escopo das próximas consultas. Seu vínculo não expira.';keyboard=companyMenu(allowed);}
     else if(intent.kind==='revoke'){const r=await db.rpc('cip_bot_read',{p_telegram:message.user,p_chat:message.chat,p_kind:'revoke',p_query:''});if(r.error)throw Error('revoke');text='Vínculo revogado. Para voltar, gere outro código no CIP.';keyboard=null;}
     else if(intent.kind==='blocked')text='Este canal é somente leitura. Alterações e aprovações devem ser feitas no CIP com a alçada responsável.';
     else if(intent.kind==='erp_unavailable')text='Essa consulta transacional ainda não está habilitada. Posso consultar venda líquida do mês, custo de estoque e itens antigos somente quando houver uma base importada e aprovada em Procfit & relatórios. Use /vendas, /estoque ou /parados.';
     else if(intent.kind==='clarification')text=intent.question==='period'?'Os relatórios disponíveis representam o cadastro atual de todos os períodos; ainda não há filtro histórico. Deseja consultar esse resumo? Toque em Resumo abaixo.':'Me diga o que deseja consultar: resumo, missões, processos ou um tema da base de conhecimento. Você também pode escolher a empresa no menu.';
     else if(intent.kind==='stock_routine'){
      const r=await db.rpc('cip_bot_stock_subscribe',{p_telegram:message.user,p_chat:message.chat,p_enabled:intent.enabled??null});
      if(r.error)text='A rotina exige acesso ativo à Shopping Prohospital.';
      else{ text='Briefing diário da Shopping: '+(r.data.enabled?'ATIVADO':'DESATIVADO')+'. Envio a partir das 08h de Brasília (verificação a cada 10 minutos, até 19h59). Cada fonte permanece separada e não conciliada. A primeira ativação durante essa janela pode receber o briefing no próximo ciclo. Uma tentativa por dia; falha de entrega fica registrada e não gera repetição automática. Use /bases para consultar quando quiser. Escolha abaixo:';keyboard={inline_keyboard:[[{text:'Ativar briefing diário · Shopping',callback_data:'stock_daily_on'}],[{text:'Desativar briefing diário',callback_data:'stock_daily_off'}],[{text:'Menu',callback_data:'help'}]]};}
     }
     else if(REFERENCE_KINDS.includes(intent.kind)){
      if(intent.kind==='stock_product'&&!intent.query?.trim())text='Qual produto? Envie /produto seguido do SKU, descrição ou marca. Exemplo: /produto cadeira. Pode incluir loja 5.';
      else {const targets=scope==='all'?allowed:[scope],entries=[];for(const company of targets){const reference=await stockReference(message.user,message.chat,company,intent,message.text);entries.push({company,reference});}text=detailed?renderExecutive(entries,intent.kind):renderBrief(entries,intent.kind);reportAnswered=true;const saved=await db.rpc('cip_bot_remember',{p_telegram:message.user,p_chat:message.chat,p_kind:intent.kind,p_query:rememberReport(intent,message.text)});if(saved.error)throw Error('report_context');}
     }
     else if(ERP_KINDS.includes(intent.kind)){
      const targets=scope==='all'?allowed:[scope],entries=[];
      for(const company of targets){const r=await db.rpc('cip_bot_erp_get',{p_telegram:message.user,p_chat:message.chat,p_company:company});if(r.error)throw Error('erp_scope');let reference=null;if(!r.data&&['inventory','aged_stock','growth_actions'].includes(intent.kind)){const fallback={kind:({inventory:'stock_sources',aged_stock:'stock_stores',growth_actions:'stock_priorities'})[intent.kind]};reference=await stockReference(message.user,message.chat,company,fallback,message.text);}entries.push({company,snapshot:r.data,reference});}
      text=detailed?renderExecutive(entries,intent.kind):renderBrief(entries,intent.kind);reportAnswered=true;const saved=await db.rpc('cip_bot_remember',{p_telegram:message.user,p_chat:message.chat,p_kind:intent.kind,p_query:rememberReport(intent,message.text)});if(saved.error)throw Error('report_context');
     }
     else if(intent.kind==='menu_more'){text='Escolha outra consulta:';keyboard=moreMenu(allowed);}
     else if(intent.kind==='help'){text='O que você quer consultar? Escolha abaixo ou escreva sua pergunta. Vou responder com o essencial; use Detalhar última consulta para ver a composição e o cálculo.';keyboard=menu(allowed);}
     else if(intent.kind==='knowledge'&&(!intent.query||intent.query.length<3))text='Qual tema você quer pesquisar na Escola? Exemplo: /conhecimento reposição. A consulta usa somente fontes aprovadas e vigentes.';
     else if(intent.kind==='knowledge'&&scope==='all'){text='Para manter as fontes separadas, escolha uma empresa antes de pesquisar conhecimento.';keyboard=companyMenu(allowed);}
     else{
      const targets=scope==='all'?allowed:[scope],answers=[];
      for(const company of targets){const r=await db.rpc('cip_bot_report',{p_telegram:message.user,p_chat:message.chat,p_kind:intent.kind,p_query:intent.query??'',p_company:company});if(r.error||!r.data?.authorized)throw Error('report');answers.push(render(r.data,intent));}
      text=answers.join('\n\n────────────────\n\n');
      await db.rpc('cip_bot_remember',{p_telegram:message.user,p_chat:message.chat,p_kind:intent.kind,p_query:intent.query??''});
     }
     if(reportAnswered)keyboard=resultMenu(detailed);
     if(aiError)text+='\n\nA interpretação por IA está indisponível agora; usei as consultas básicas. Use /menu se precisar.';
     if(!['companies','choose_company','revoke',...REFERENCE_KINDS,...ERP_KINDS].includes(intent.kind))text='Escopo: '+COMPANY_NAMES[scope]+'\n\n'+text;
    }
   }
  }
  await send(message.chat,text,cfg.token,keyboard);
  const done=await db.from('cip_bot_updates').update({state:'done',updated_at:new Date().toISOString()}).eq('update_id',message.update_id);if(done.error)throw Error('ack');
  return reply(200,{accepted:true});
 }catch{if(message)await db.from('cip_bot_updates').update({state:'failed',updated_at:new Date().toISOString()}).eq('update_id',message.update_id);return reply(503,{error:'request_unavailable'});}
});
