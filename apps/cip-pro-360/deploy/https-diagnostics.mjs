// Non-mutating CIP endpoint diagnosis. No secrets, credentials, remote IPs or response bodies are logged.
import dns from 'node:dns/promises';
import https from 'node:https';
const host='cip.gritnews.com.br';
const sanitize=x=>String(x||'UNKNOWN').replace(/[^A-Z0-9_]/gi,'').slice(0,70)||'UNKNOWN';
async function run(){
 try{
  const addresses=await dns.lookup(host,{all:true});
  console.log('CIP_DNS='+(addresses.length?'RESOLVED':'EMPTY'));
 }catch(e){
  console.log('CIP_DNS_ERROR='+sanitize(e.code));
 }
 await new Promise(resolve=>{
  const req=https.get('https://'+host+'/?cip_preflight=1',{
   headers:{'Cache-Control':'no-store'},
   rejectUnauthorized:true,
   timeout:10000
  },res=>{
   console.log('CIP_HTTP_STATUS='+String(res.statusCode));
   if([301,302,303,307,308].includes(res.statusCode))
    console.log('CIP_REDIRECT_PRESENT=true');
   console.log('CIP_TLS_AUTHORIZED='+(res.socket?.authorized===true?'true':'false'));
   res.resume();res.on('end',resolve);res.on('error',()=>resolve());
  });
  req.on('timeout',()=>req.destroy(Object.assign(new Error('Timeout'),{code:'ETIMEDOUT'})));
  req.on('error',e=>{console.log('CIP_HTTPS_ERROR='+sanitize(e.code));resolve();});
 });
}
run().catch(e=>{console.log('CIP_DIAGNOSTIC_ERROR='+sanitize(e.code));});
