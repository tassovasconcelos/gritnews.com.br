import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkAIReadiness,aiState} from './ai-readiness.mjs';
const key='sk-'+'x'.repeat(24);
const route={kind:'help',company:'current',query:'',question:'none'};
const textOK=()=>Response.json({choices:[{message:{content:JSON.stringify(route)}}]});
test('activation checks actual transcription endpoint with valid silent WAV and no private audio',async()=>{
 const calls=[];const r=await checkAIReadiness({key,fetcher:async(url,o)=>{calls.push(url);if(url.endsWith('/chat/completions'))return textOK();assert.equal(url,'https://api.openai.com/v1/audio/transcriptions');const file=o.body.get('file');assert.equal(file.type,'audio/wav');const bytes=new Uint8Array(await file.arrayBuffer());assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(new DataView(bytes.buffer).getUint32(40,true),32000);return Response.json({text:''});}});
 assert.deepEqual(r,{text_ready:true,voice_ready:true,error:null});assert.equal(calls.length,2);
});
test('text access alone never enables voice when transcription permission is denied',async()=>{const r=await checkAIReadiness({key,fetcher:async url=>url.endsWith('/chat/completions')?textOK():Response.json({error:{message:'secret must never be returned'}},{status:403})});assert.deepEqual(r,{text_ready:true,voice_ready:false,error:'ai_permission_denied'});});
test('billing and invalid key failures are distinct and never call audio',async()=>{for(const [status,code,expected] of [[429,'insufficient_quota','ai_billing_required'],[401,'invalid_api_key','ai_key_invalid'],[429,'rate_limit_exceeded','ai_rate_limited']]){let calls=0;const r=await checkAIReadiness({key,fetcher:async()=>{calls++;return Response.json({error:{code,message:key}},{status});}});assert.equal(r.error,expected);assert.equal(calls,1);assert.ok(!JSON.stringify(r).includes(key));}});
test('invalid key and network errors are controlled',async()=>{assert.equal((await checkAIReadiness({key:'bad'})).error,'ai_key_invalid');assert.equal((await checkAIReadiness({key,fetcher:async()=>{throw Error(key);}})).error,'ai_provider_unavailable');});
test('configuration state distinguishes missing key, disabled and enabled',()=>{assert.equal(aiState({ai_enabled:true}),'missing_key');assert.equal(aiState({ai_key:key,ai_enabled:false}),'disabled');assert.equal(aiState({ai_key:key,ai_enabled:true}),'enabled');});
