import {DIRECT_HOSTS,robotsAllowed,structuredOffer} from './direct.mjs';
import {norm,sourceUrl,publicDomain} from '../market-radar-engine.mjs';
// Only approved public storefronts; never marketplace crawls or arbitrary discovered hosts.
export const DISCOVERY_HOSTS=[...DIRECT_HOSTS,'loja.ortofor.com.br'];
export function discoverPages(xml,origin,job){
 const domain=publicDomain(new URL(origin).hostname),tokens=norm([job.criteria?.brand,job.criteria?.model,job.our?.description].join(' ')).split(' ').filter(t=>t.length>=3);
 const pages=[];for(const m of xml.matchAll(/<loc\b[^>]*>\s*(?:<!\[CDATA\[)?([^<]+?)(?:\]\]>)?\s*<\/loc>/gi)){
  const raw=m[1].replace(/&amp;/g,'&').trim();let u;try{u=new URL(raw);}catch{continue;}
  if(u.origin!==origin||!sourceUrl(raw,[domain])||/\.(?:xml|gz|pdf|jpg|png)$/.test(u.pathname)||/\/(?:busca|search|loja|categorias?|login|carrinho)(?:\/|$)/i.test(u.pathname))continue;
  const path=norm(decodeURIComponent(u.pathname)),score=tokens.reduce((n,t)=>n+(path.includes(t)?1:0),0);if(score)pages.push({url:u.href,score});if(pages.length>=500)break;
 }
 return [...new Map(pages.map(p=>[p.url,p])).values()].sort((a,b)=>b.score-a.score||a.url.localeCompare(b.url)).slice(0,40);
}
export function observationChanges(previous,current){
 if(!previous)return {kind:'first_observation',fields:[]};
 if(previous.url!==current.url||previous.variant!==current.variant||previous.mode!==current.mode)return {kind:'different_identity',fields:[]};
 const fields=['price','currency','availability','pack_units','shipping','conditions'].filter(k=>JSON.stringify(previous[k]??null)!==JSON.stringify(current[k]??null));
 return {kind:fields.length?'changed':'unchanged',fields,comparable:!!previous.conditions_verified&&!!current.conditions_verified};
}
async function text(response,max=500000){const reader=response.body?.getReader();if(!reader)throw Error('empty_body');let size=0,out='';const decoder=new TextDecoder();try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>max)throw Error('body_limit');out+=decoder.decode(r.value,{stream:true});}return out+decoder.decode();}finally{await reader.cancel().catch(()=>{});}}
export function createPageDiscovery({fetcher=fetch,pause=ms=>new Promise(r=>setTimeout(r,ms)),clock=()=>Date.now()}={}){
 const lanes=new Map();
 return async(job,region)=>{
  const domain=region?.domain,trace={version:1,mode:'sale',scope:'bounded_sitemap_sample',pages_discovered:0,pages_attempted:0,products_collected:0,variants_confirmed:0,complete_catalog:false,attempts:[],collected_at:new Date(clock()).toISOString()};
  if(!DISCOVERY_HOSTS.includes(domain))return {offers:[],trace:{...trace,state:'host_not_enabled'}};
  const origin='https://'+domain,started=clock();if(lanes.has(domain)&&started-lanes.get(domain)<300000)return {offers:[],trace:{...trace,state:'host_cooldown'}};lanes.set(domain,started);
  const get=async(url,max)=>{await pause(2000);const r=await fetcher(url,{headers:{'User-Agent':'CIPFaroBot',Accept:'text/html,application/xml,text/plain'},redirect:'error',signal:AbortSignal.timeout(6000)});if(r.status!==200)throw Error('http_'+r.status);return text(r,max);};
  try{
   const robots=await get(origin+'/robots.txt',100000);if(!robotsAllowed(robots,'/sitemap.xml'))return {offers:[],trace:{...trace,state:'robots_blocked'}};
   let sitemap=await get(origin+'/sitemap.xml',500000);if(/<sitemapindex\b/i.test(sitemap)){const children=[...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(x=>x[1].trim()).filter(x=>{try{return new URL(x).origin===origin&&sourceUrl(x,[domain])&&/\.xml$/.test(new URL(x).pathname);}catch{return false;}}).slice(0,40);if(!children.length)return {offers:[],trace:{...trace,state:'sitemap_index_pending'}};const index=[...String(job.sku??'')].reduce((n,c)=>n+c.charCodeAt(0),0)%children.length;const child=children[index];if(!robotsAllowed(robots,new URL(child).pathname))return {offers:[],trace:{...trace,state:'sitemap_robots_blocked'}};trace.sitemap=child;sitemap=await get(child,500000);}const pages=discoverPages(sitemap,origin,job);trace.pages_discovered=pages.length;trace.candidate_urls=pages.map(x=>x.url);if(!pages.length)return {offers:[],trace:{...trace,state:'no_matching_product_page'}};
   const selected=pages[0];if(!robotsAllowed(robots,new URL(selected.url).pathname))return {offers:[],trace:{...trace,state:'product_robots_blocked'}};
   trace.pages_attempted=1;const html=await get(selected.url,1000000);
   // Lease-bound structured parser requires matching EAN or brand/model; no inferred variant price.
   const source={url:selected.url,seller:region.region?.store_name??domain,offer:{title:job.our.description,brand:job.criteria?.brand,model:job.criteria?.model,gtin:job.criteria?.gtin}};
   if(/\b(?:alugu[eé]l|loca[cç][aã]o|mensalidade|cau[cç][aã]o)\b/i.test(html.replace(/<[^>]*>/g,' '))){trace.rental_candidate={url:selected.url,company:source.seller,price_validated:false};return {offers:[],trace:{...trace,state:'rental_separate_review'}};}
   const offer=structuredOffer(html,job,source);trace.attempts.push({url:selected.url,state:offer?'product_candidate':'identity_or_variant_pending'});
   if(!offer)return {offers:[],trace:{...trace,state:'identity_or_variant_pending'}};
   offer.conditions='Coleta estruturada de página descoberta; confirmar variante, pagamento, embalagem e frete.';trace.products_collected=1;
   trace.content_hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(html)))).map(x=>x.toString(16).padStart(2,'0')).join('');
   return {offers:[offer],trace:{...trace,state:'candidate_collected'}};
  }catch(e){return {offers:[],trace:{...trace,state:'collection_incomplete',error:/^(http_\d+|body_limit|empty_body)$/.test(e.message)?e.message:'network_or_parse_error'}};}
 };
}
