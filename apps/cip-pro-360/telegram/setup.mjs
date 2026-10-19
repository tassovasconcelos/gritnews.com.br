export function validBotToken(value){return typeof value==='string'&&value.length<=200&&/^\d+:[A-Za-z0-9_-]{20,}$/.test(value);}
export function safeUsername(value){return typeof value==='string'&&/^[A-Za-z0-9_]{5,32}$/.test(value)?value:null;}
export async function telegramApi(token,method,payload,fetcher=fetch){
 // Fixed origin/method allowlist. Never propagate URL, token, body or provider error descriptions.
 if(!validBotToken(token)||!['getMe','setWebhook','getWebhookInfo','setMyCommands'].includes(method))throw Error('telegram_request_invalid');
 let response;try{response=await fetcher(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload??{}),signal:AbortSignal.timeout(12000)});}catch{throw Error('telegram_unavailable');}
 if(!response.ok)throw Error(response.status===401?'invalid_bot_token':'telegram_unavailable');
 let result;try{result=await response.json();}catch{throw Error('telegram_unavailable');}
 if(!result.ok)throw Error(result.error_code===401?'invalid_bot_token':'telegram_request_failed');return result.result;
}
export async function configureBot({db,actor,token,exclusive,projectUrl,fetcher=fetch,randomSecret}){
 if(!validBotToken(token)||exclusive!==true)throw Error('invalid_configuration');
 const me=await telegramApi(token,'getMe',{},fetcher),username=safeUsername(me?.username);
 if(!me?.is_bot||!Number.isSafeInteger(me.id)||!username)throw Error('invalid_bot_identity');
 const lease=await db.rpc('cip_bot_config_begin',{p_actor:actor});if(lease.error||!lease.data)throw Error('configuration_busy');
 try{
  const secret=randomSecret(),webhook=projectUrl+'/functions/v1/cip-telegram';
  const set=await telegramApi(token,'setWebhook',{url:webhook,secret_token:secret,allowed_updates:['message'],max_connections:5},fetcher);if(set!==true)throw Error('webhook_not_confirmed');
  const info=await telegramApi(token,'getWebhookInfo',{},fetcher);if(info?.url!==webhook)throw Error('webhook_not_confirmed');
  const save=await db.rpc('cip_bot_config_finish',{p_actor:actor,p_lease:lease.data,p_token:token,p_secret:secret,p_bot_id:String(me.id),p_username:username});if(save.error)throw Error('configuration_not_saved');
  let commands=true;try{await telegramApi(token,'setMyCommands',{commands:[{command:'resumo',description:'Resumo dos registros do CIP'},{command:'missoes',description:'Missões por estado'},{command:'processos',description:'Mapas cadastrados'},{command:'conhecimento',description:'Buscar conhecimento aprovado'},{command:'sair',description:'Revogar meu vínculo'}]},fetcher);}catch{commands=false;}
  return {configured:true,username,bot_url:'https://t.me/'+username,webhook_verified:true,commands_configured:commands};
 }finally{await db.rpc('cip_bot_config_release',{p_lease:lease.data});}
}
