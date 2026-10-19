import {classify,validAIKey} from './ai.mjs';

// Safe error codes only: never return provider text, request headers or keys.
export async function providerFailure(response){
 let code='';try{code=(await response.json())?.error?.code??'';}catch{}
 if(code==='insufficient_quota')return 'ai_billing_required';
 if(response.status===401)return 'ai_key_invalid';
 if(response.status===403)return 'ai_permission_denied';
 if(response.status===404)return 'ai_model_unavailable';
 if(response.status===429)return 'ai_rate_limited';
 return 'ai_provider_unavailable';
}

function silenceWav(){
 const data=new Uint8Array(44+16000*2),view=new DataView(data.buffer);
 const ascii=(offset,text)=>{for(let i=0;i<text.length;i++)data[offset+i]=text.charCodeAt(i);};
 ascii(0,'RIFF');view.setUint32(4,data.length-8,true);ascii(8,'WAVE');ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,data.length-44,true);
 return new Blob([data],{type:'audio/wav'});
}

// A short synthetic silent file checks endpoint access, not Portuguese accuracy.
// Called only on explicit paid-API activation/recheck in the authenticated panel.
export async function checkAIReadiness({key,fetcher=fetch}){
 if(!validAIKey(key))return {text_ready:false,voice_ready:false,error:'ai_key_invalid'};
 const wrapped=async(url,options)=>{const r=await fetcher(url,options);if(!r.ok)throw Error(await providerFailure(r));return r;};
 try{await classify('Ajuda',{key,fetcher:wrapped});}catch(e){return {text_ready:false,voice_ready:false,error:safeCode(e)};}
 try{
  const form=new FormData();form.set('model','gpt-4o-mini-transcribe-2025-12-15');form.set('language','pt');form.set('response_format','json');form.set('file',silenceWav(),'teste-acesso.wav');
  const r=await wrapped('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:AbortSignal.timeout(35000)});
  const result=await r.json();if(typeof result.text!=='string')throw Error('ai_provider_unavailable');
  return {text_ready:true,voice_ready:true,error:null};
 }catch(e){return {text_ready:true,voice_ready:false,error:safeCode(e)};}
}
function safeCode(e){return ['ai_key_invalid','ai_billing_required','ai_permission_denied','ai_model_unavailable','ai_rate_limited','ai_provider_unavailable'].includes(e?.message)?e.message:'ai_provider_unavailable';}
export function aiState(cfg){return !validAIKey(cfg.ai_key)?'missing_key':cfg.ai_enabled===true?'enabled':'disabled';}
