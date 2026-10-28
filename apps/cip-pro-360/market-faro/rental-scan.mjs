import {robotsAllowed} from './direct.mjs';
import {publicDomain,sourceUrl} from '../market-radar-engine.mjs';
const plain=html=>html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ').trim();
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function rentalEvidence(html){
 const text=plain(html),s=fold(text),medical='(?:equipamentos?|materiais?|hospitalares?|camas?|cadeiras?|andadores?|muletas?|oxigenio|cpap|bipap|concentradores?|respiradores?|suporte para soro)';
 const rx=new RegExp('(?:alugamos|locamos|aluguel(?: de)?|locacao(?: de)?)[^.!?]{0,90}'+medical+'|'+medical+'[^.!?]{0,60}(?:para locacao|para aluguel)','g');let m;
 while((m=rx.exec(s))){const context=s.slice(Math.max(0,m.index-65),m.index+m[0].length);if(/\bnao\b[^.!?]{0,65}(?:alug|loca)|\bsem\s+(?:locacao|aluguel)/.test(context))continue;return {state:'rental_advertised',quote:text.slice(Math.max(0,m.index-50),Math.min(text.length,m.index+m[0].length+160)).slice(0,500)};}
 return {state:'no_evidence_in_sample',quote:null};
}
export function rentalLinks(html,origin){const links=[];for(const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){let u;try{u=new URL(m[1].replace(/&amp;/g,'&'),origin);}catch{continue;}if(u.origin!==origin||!sourceUrl(u.href,[publicDomain(u.hostname)]))continue;if(/alug|loca[cç][aã]o|locacao/.test(fold(u.pathname+' '+plain(m[2]))))links.push(u.href);}return [...new Set(links)].slice(0,3);}
async function bounded(response,max){const reader=response.body?.getReader();if(!reader)throw Error('empty_body');const d=new TextDecoder();let n=0,s='';try{for(;;){const x=await reader.read();if(x.done)break;n+=x.value.byteLength;if(n>max)throw Error('body_limit');s+=d.decode(x.value,{stream:true});}return s+d.decode();}finally{await reader.cancel().catch(()=>{});}}
const publicIP=ip=>{if(ip.includes(':'))return /^(?:2|3)[0-9a-f]{3}:/i.test(ip)&&!/^2001:(?:db8|0):/i.test(ip);const a=ip.split('.').map(Number);return a.length===4&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&a[0]!==0&&a[0]!==10&&a[0]!==127&&a[0]<224&&!(a[0]===169&&a[1]===254)&&!(a[0]===172&&a[1]>=16&&a[1]<=31)&&!(a[0]===192&&a[1]===168)&&!(a[0]===100&&a[1]>=64&&a[1]<=127)&&!(a[0]===198&&[18,19].includes(a[1]));};
async function resolvePublic(host){if(typeof Deno==='undefined')return false;const r=await Promise.allSettled(['A','AAAA'].map(t=>Deno.resolveDns(host,t)));const ips=r.filter(x=>x.status==='fulfilled').flatMap(x=>x.value);return ips.length>0&&ips.every(publicIP);}
export function createRentalScanner({fetcher=fetch,pause=ms=>new Promise(r=>setTimeout(r,ms)),resolve=resolvePublic}={}){return async target=>{
 const at=new Date().toISOString(),base={domain:target.domain,collected_at:at,coverage:'homepage_and_one_rental_page',whole_site:false,price_validated:false,attempted_urls:[]};
 try{
 const host=publicDomain(target.domain);if(!host||host!==target.domain)return {...base,state:'source_invalid'};
 if(['instagram.com','facebook.com','linkedin.com','linktr.ee','google.com'].some(x=>host===x||host.endsWith('.'+x)))return {...base,state:'social_source_pending'};
 if(!await resolve(host))return {...base,state:'dns_pending'};
 const origin='https://'+host;
 const get=async(url,max)=>{await pause(2000);const r=await fetcher(url,{redirect:'error',headers:{'User-Agent':'CIPFaroBot',Accept:'text/html,text/plain'},signal:AbortSignal.timeout(6000)});base.attempted_urls.push(url);if(r.status!==200)throw Error([401,403,429].includes(r.status)?'access_blocked':'http_'+r.status);if(!/text\/(html|plain)/i.test(r.headers.get('content-type')??''))throw Error('unsupported_content');return bounded(r,max);};
 const rules=await get(origin+'/robots.txt',100000);if(!robotsAllowed(rules,'/'))return {...base,state:'robots_blocked'};
 const home=await get(origin+'/',600000);const evidence=rentalEvidence(home);if(evidence.state==='rental_advertised')return {...base,...evidence,evidence_url:origin+'/'};
 const links=rentalLinks(home,origin);if(!links.length)return {...base,...evidence,evidence_url:origin+'/'};
 const url=links[0],u=new URL(url);if(!robotsAllowed(rules,u.pathname+u.search))return {...base,state:'robots_blocked',candidate_urls:links};
 const page=await get(url,600000),found=rentalEvidence(page);return {...base,...found,evidence_url:url,candidate_urls:links};
 }catch(e){return {...base,state:/^(access_blocked|http_\d+|body_limit|empty_body|unsupported_content)$/.test(e?.message)?e.message:'collection_pending'};}
 };}
