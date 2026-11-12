import {publicDomain,sourceUrl,productMatch,offerQuality,norm} from '../market-radar-engine.mjs';
export const DIRECT_HOSTS=['medjet.com.br','bisturi.com.br','cirurgicastore.com.br','cirurgicaliderbh.com.br','cirurgicapaulista.com.br','casadaacessibilidade.com.br'];
const agent='CIPFaroBot';
export function robotsAllowed(text,path){
 const groups=[];let names=[],rules=[];const save=()=>{if(names.length)groups.push({names,rules});names=[];rules=[];};
 for(const line of text.split(/\r?\n/)){const clean=line.split('#')[0].trim(),m=clean.match(/^([^:]+):\s*(.*)$/);if(!m)continue;const key=m[1].trim().toLowerCase(),value=m[2].trim();if(key==='user-agent'){if(rules.length)save();names.push(value.toLowerCase());}else if(names.length&&['allow','disallow','crawl-delay'].includes(key))rules.push({key,value});}save();
 const specific=groups.filter(g=>g.names.some(x=>x!=='*'&&agent.toLowerCase().includes(x)));const selected=specific.length?specific:groups.filter(g=>g.names.includes('*'));
 let winner={length:-1,allow:true};for(const g of selected)for(const r of g.rules){if(r.key==='crawl-delay'&&Number(r.value)>2)return false;if(!r.value||r.key==='crawl-delay')continue;const end=r.value.endsWith('$'),pattern=r.value.replace(/\$$/,'').split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');if(new RegExp('^'+pattern+(end?'$':'')).test(path)&&r.value.length>=winner.length)winner={length:r.value.length,allow:r.key==='allow'};}
 return winner.allow;
}
async function boundedText(response,max){const reader=response.body?.getReader();if(!reader)throw Error('body_missing');let n=0,text='';const decoder=new TextDecoder();while(true){const x=await reader.read();if(x.done)break;n+=x.value.byteLength;if(n>max){await reader.cancel();throw Error('body_limit');}text+=decoder.decode(x.value,{stream:true});}return text+decoder.decode();}
export function structuredOffer(html,job,source){
 const products=[];const visit=x=>{if(Array.isArray(x)){x.forEach(visit);return;}if(!x||typeof x!=='object')return;const types=Array.isArray(x['@type'])?x['@type']:[x['@type']];if(types.includes('Product'))products.push(x);if(x['@graph'])visit(x['@graph']);};
 for(const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(match[1]));}catch{}}
 if(products.length!==1)return null;const p=products[0],offers=Array.isArray(p.offers)?p.offers:[p.offers];if(offers.length!==1||!offers[0])return null;const o=offers[0];
 if(o['@type']!=='Offer'||o.priceCurrency!=='BRL'||!/^\d+(?:\.\d+)?$/.test(String(o.price))||!(Number(o.price)>0)||Number(o.price)>1e9||typeof p.name!=='string')return null;
 const offer={url:source.url,seller:source.seller,title:p.name.slice(0,200),description:String(p.description??'').replace(/<[^>]*>/g,' ').slice(0,800),brand:typeof p.brand==='string'?p.brand:p.brand?.name??null,model:typeof p.model==='string'?p.model:null,gtin:p.gtin13??p.gtin14??p.gtin12??p.gtin8??p.gtin??null,size:typeof p.size==='string'?p.size:null,price:Number(o.price),currency:'BRL',shipping:null,pack_units:null,availability:String(o.availability??'').endsWith('/InStock')?'available':String(o.availability??'').endsWith('/OutOfStock')?'unavailable':'unknown',selling_mode:'unknown',conditions:'Rechecagem de dados estruturados de anúncio aprovado. Embalagem, frete e condições comerciais requerem nova conferência.',quote:`Campos JSON-LD: price=${o.price}; priceCurrency=BRL; name=${p.name}`.slice(0,300),platform:new URL(source.url).hostname,source_date:null};
 const current=productMatch({...job.our,criteria:job.criteria},offer),baseline=productMatch({description:source.offer?.title,criteria:{brand:source.offer?.brand,model:source.offer?.model,size:source.offer?.size,gtin:source.offer?.gtin}},offer);
 if([current.kind,baseline.kind].some(x=>['alternative','incompatible'].includes(x)))return null;
 if(!['exact_gtin','exact_brand_model'].includes(current.kind)&&norm(p.name)!==norm(source.offer?.title))return null;
 offer.match=current;offer.match.pending.push('Revalidar embalagem e frete: a revisão anterior não confirma as condições atuais.');offer.quality=offerQuality({...job.our,criteria:job.criteria},offer);if(!offer.quality.basic_eligible)return null;return offer;
}
export function createDirectReader({fetcher=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 const robots=new Map(),lanes=new Map();
 async function collect(job){for(const source of (job.direct_sources??[]).slice(0,1)){
  let host,u;try{u=new URL(source.url);host=publicDomain(u.hostname);}catch{continue;}
  if(!DIRECT_HOSTS.includes(host)||!sourceUrl(source.url,job.domains)||!source.seller)continue;
  const started=Date.now();if(started-(lanes.get(host)??0)<300000)continue;lanes.set(host,started);
  const work=(async()=>{try{
   if(!robots.has(u.origin)||started-robots.get(u.origin).at>3600000)robots.set(u.origin,{at:started,promise:(async()=>{const r=await fetcher(u.origin+'/robots.txt',{headers:{'User-Agent':agent},redirect:'error',signal:AbortSignal.timeout(6000)});return r.status===200?boundedText(r,100000):null;})().catch(()=>null)});
   const rules=await robots.get(u.origin).promise;if(rules===null||!robotsAllowed(rules,u.pathname+u.search))return null;
   await pause(2000);
   const response=await fetcher(source.url,{headers:{'User-Agent':agent,Accept:'text/html'},redirect:'error',signal:AbortSignal.timeout(8000)});if(response.status!==200||!response.headers.get('content-type')?.includes('text/html'))return null;
   const html=await boundedText(response,1000000),offer=structuredOffer(html,job,source);if(!offer)return null;
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(html)))).map(x=>x.toString(16).padStart(2,'0')).join('');
   return {offers:[offer],meta:{sources:[source.url],observed_domains:[u.hostname],search_calls:0,model:'direct-jsonld-v1',collection:'direct_structured',coverage:'single_approved_offer',content_hash:hash,collected_at:new Date().toISOString(),usage:{input_tokens:0,output_tokens:0},limitations:'Anúncio previamente aprovado; preço estruturado rechecado. Sem varredura integral e sem confirmação de frete/embalagem atual.'}};
  }catch{return null;}})();const result=await work;if(result)return result;
 }return null;}
 return collect;
}
