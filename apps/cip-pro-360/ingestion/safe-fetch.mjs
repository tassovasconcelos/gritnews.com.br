import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {ReadError,MAX_BYTES} from './extract.mjs';
export function publicIP(ip){
 if(isIP(ip)!==4)return false; // Fail closed for IPv6, including mapped/private forms.
 const [a,b]=ip.split('.').map(Number);
 return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);
}
export function sourceURL(value){
 let u;try{u=new URL(value);}catch{throw new ReadError('unsafe_url','Link inválido.');}
 if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!u.hostname.includes('.')||u.hostname.endsWith('.local')||u.hostname.endsWith('.internal')||isIP(u.hostname))throw new ReadError('unsafe_url','Use um endereço HTTPS público sem credenciais.');
 return u;
}
export function getPinned(url,address){return new Promise((resolve,reject)=>{
 const request=https.get(url,{headers:{'User-Agent':'CIP-Academy/1.0 (knowledge ingestion)','Accept':'text/html,application/pdf,text/plain,application/octet-stream','Accept-Encoding':'identity'},lookup:(_host,options,cb)=>options?.all?cb(null,[{address,family:4}]):cb(null,address,4),timeout:15000},res=>{
  if([301,302,303,307,308].includes(res.statusCode)){res.resume();resolve({redirect:res.headers.location});return;}
  if(res.statusCode!==200){res.resume();reject(new ReadError('http_error',`Fonte retornou HTTP ${res.statusCode}.`));return;}
  const parts=[];let size=0;if(Number(res.headers['content-length'])>MAX_BYTES){res.destroy();reject(new ReadError('size_limit','Fonte maior que 10 MB.'));return;}
  res.on('data',p=>{size+=p.length;if(size>MAX_BYTES){res.destroy(new ReadError('size_limit','Fonte maior que 10 MB.'));}else parts.push(p);});res.on('error',reject);res.on('end',()=>resolve({bytes:new Uint8Array(Buffer.concat(parts)),mime:String(res.headers['content-type']??''),url:url.href}));
 });request.on('error',reject);request.on('timeout',()=>request.destroy(new ReadError('timeout','Fonte excedeu o tempo de leitura.')));
 });}
export async function fetchSource(value,{resolve=host=>lookup(host,{all:true}),request=getPinned}={}){
 let url=sourceURL(value);
 for(let n=0;n<4;n++){
  const addresses=await resolve(url.hostname),v4=addresses.filter(a=>isIP(a.address)===4);if(!v4.length||addresses.some(a=>isIP(a.address)===4?!publicIP(a.address):!(/^[23][0-9a-f]{3}:/i.test(a.address)&&!/^2001:(db8|0:|2:)/i.test(a.address))))throw new ReadError('unsafe_url','Fonte resolve para rede privada ou endereço não permitido.');
  // Pin the vetted IP to the TLS request to avoid DNS rebinding; TLS still verifies the original hostname.
  const response=await request(url,v4[0].address);if(!response.redirect)return response;url=sourceURL(new URL(response.redirect,url).href);
 }throw new ReadError('redirect_limit','Redirecionamentos demais na fonte.');
}

// Edge Runtime does not implement Node ClientRequest.lookup. Native TCP + TLS pins
// the validated address while startTls verifies the certificate for the source host.
export function decodeChunked(bytes){
 const output=[];let pos=0,total=0;const decoder=new TextDecoder();
 while(pos<bytes.length){let end=pos;while(end+1<bytes.length&&!(bytes[end]===13&&bytes[end+1]===10))end++;if(end+1>=bytes.length)throw new ReadError('http_error','Resposta chunked incompleta.');
  const line=decoder.decode(bytes.slice(pos,end)).split(';')[0];if(!/^[0-9a-f]+$/i.test(line))throw new ReadError('http_error','Resposta chunked inválida.');const size=parseInt(line,16);pos=end+2;if(size===0)return concat(output,total);if(pos+size+2>bytes.length)throw new ReadError('http_error','Resposta chunked incompleta.');total+=size;if(total>MAX_BYTES)throw new ReadError('size_limit','Fonte maior que 10 MB.');output.push(bytes.slice(pos,pos+size));pos+=size;if(bytes[pos]!==13||bytes[pos+1]!==10)throw new ReadError('http_error','Resposta chunked inválida.');pos+=2;
 }throw new ReadError('http_error','Resposta chunked incompleta.');
}
function concat(parts,length){const bytes=new Uint8Array(length);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}return bytes;}
export async function getPinnedDeno(url,address){
 let socket;let timer;
 const operation=async()=>{
  socket=await Deno.connect({hostname:address,port:443});socket=await Deno.startTls(socket,{hostname:url.hostname});
  const request=new TextEncoder().encode(`GET ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.hostname}\r\nUser-Agent: CIP-Academy/1.0\r\nAccept: text/html,application/pdf,text/plain,*/*\r\nAccept-Encoding: identity\r\nConnection: close\r\n\r\n`);
  let written=0;while(written<request.length)written+=await socket.write(request.subarray(written));
  const parts=[];let size=0;while(true){const buffer=new Uint8Array(32768),n=await socket.read(buffer);if(n===null)break;size+=n;if(size>MAX_BYTES+65536)throw new ReadError('size_limit','Fonte maior que 10 MB.');parts.push(buffer.slice(0,n));}
  const raw=concat(parts,size);let boundary=-1;for(let i=0;i<raw.length-3;i++){if(raw[i]===13&&raw[i+1]===10&&raw[i+2]===13&&raw[i+3]===10){boundary=i;break;}}
  if(boundary<0||boundary>65536)throw new ReadError('http_error','Cabeçalho HTTP inválido.');
  const lines=new TextDecoder().decode(raw.slice(0,boundary)).split('\r\n');const status=Number(lines.shift()?.match(/^HTTP\/1\.[01] (\d{3})/)?.[1]);const headers={};for(const line of lines){const colon=line.indexOf(':');if(colon>0)headers[line.slice(0,colon).toLowerCase()]=line.slice(colon+1).trim();}
  if([301,302,303,307,308].includes(status)&&headers.location)return {redirect:headers.location};
  if(status!==200)throw new ReadError('http_error',`Fonte retornou HTTP ${status}.`);
  if(headers['content-encoding']&&headers['content-encoding']!=='identity')throw new ReadError('http_error','Fonte retornou compressão não solicitada.');
  let bytes=raw.slice(boundary+4);if(headers['transfer-encoding']){if(headers['transfer-encoding'].toLowerCase()!=='chunked')throw new ReadError('http_error','Codificação HTTP não suportada.');bytes=decodeChunked(bytes);}else if(headers['content-length']&&Number(headers['content-length'])!==bytes.length)throw new ReadError('http_error','Conteúdo HTTP incompleto.');
  if(bytes.length>MAX_BYTES)throw new ReadError('size_limit','Fonte maior que 10 MB.');return {bytes,mime:headers['content-type']??'',url:url.href};
 };
 try{return await Promise.race([operation(),new Promise((_,reject)=>{timer=setTimeout(()=>{try{socket?.close();}catch{}reject(new ReadError('timeout','Fonte excedeu o tempo de leitura.'));},20000);})]);}finally{clearTimeout(timer);try{socket?.close();}catch{}}
}
