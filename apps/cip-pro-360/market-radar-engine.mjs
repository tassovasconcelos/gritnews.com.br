// Shared by the authenticated collector and UI. Scores order evidence; they do not certify equivalence.
export const MARKET_SOURCES=[
 {id:'ml',name:'Mercado Livre',domain:'mercadolivre.com.br',kind:'marketplace'},
 {id:'magalu',name:'Magalu',domain:'magazineluiza.com.br',kind:'marketplace'},
 {id:'amazon',name:'Amazon Brasil',domain:'amazon.com.br',kind:'marketplace'},
 {id:'store',name:'Cirúrgica Store',domain:'cirurgicastore.com.br',kind:'medical'},
 {id:'medjet',name:'Medjet',domain:'medjet.com.br',kind:'medical'},
 {id:'paulista',name:'Cirúrgica Paulista',domain:'cirurgicapaulista.com.br',kind:'medical'},
 {id:'fernandes',name:'Cirúrgica Fernandes',domain:'cfernandes.com.br',kind:'distributor'}
];
export const MATCH_LABELS={exact_gtin:'Mesmo GTIN · conferir oferta',exact_brand_model:'Marca e modelo correspondentes',similar:'Similaridade · conferir especificação',alternative:'Alternativa de marca · não usar como equivalente',incompatible:'Divergência · não comparar'};
export const REVIEW_LABELS={candidate:'Aguardando conferência',linked:'Referência enviada ao Marca-passo',alternative:'Alternativa para análise de mix',rejected:'Descartada'};
export const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const number=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
export function publicDomain(v){
 const d=String(v??'').trim().toLowerCase().replace(/^www\./,'');
 if(d.length>180||! /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(d)||/(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(d))return null;
 return d;
}
export function sourceUrl(v,domains){try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||u.port||u.href.length>1000||!domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)))return null;
 if(/\/(?:login|signin|sign-in|auth|checkout|cart|carrinho)(?:\/|$)/i.test(u.pathname)||[...u.searchParams.keys()].some(k=>/token|secret|password|credential|signature|session/i.test(k)))return null;
 u.hash='';for(const k of [...u.searchParams.keys()])if(/^(utm_|srsltid$|fbclid$|gclid$|ref$|tag$)/i.test(k))u.searchParams.delete(k);return u.href;
 }catch{return null;}}
export function validGtin(v){const s=String(v??'').trim();if(!/^(?:\d{8}|\d{12,14})$/.test(s)||/^0+$/.test(s))return null;let total=0;for(let i=s.length-2,w=3;i>=0;i--,w=w===3?1:3)total+=Number(s[i])*w;return (10-total%10)%10===Number(s.at(-1))?s.padStart(14,'0'):null;}
export function validRadarRequest(b){
 if(!b||typeof b!=='object'||!['shopping_prohospital','distribuidora_prohospital'].includes(b.company)||b.consent!==true)return false;
 if(!['sku','store'].every(k=>typeof b[k]==='string'&&b[k].trim().length>0&&b[k].length<=80))return false;
 if(!b.criteria||Object.getPrototypeOf(b.criteria)!==Object.prototype&&Object.getPrototypeOf(b.criteria)!==null)return false;
 if(Object.keys(b.criteria).some(k=>!['brand','model','type','size','specification','city','state','gtin','our_pack_units'].includes(k)))return false;
 for(const k of ['brand','model','type','size','specification','city','state','gtin'])if(b.criteria[k]!=null&&(typeof b.criteria[k]!=='string'||b.criteria[k].length>(k==='specification'?400:100)))return false;
 if(b.criteria.gtin&&!validGtin(b.criteria.gtin)||b.criteria.state&&!'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').includes(b.criteria.state))return false;
 if(b.criteria.our_pack_units!=null&&(!(number(b.criteria.our_pack_units)>0)||b.criteria.our_pack_units>1e6))return false;
 return Array.isArray(b.domains)&&b.domains.length>=1&&b.domains.length<=8&&new Set(b.domains).size===b.domains.length&&b.domains.every(d=>publicDomain(d)===d)&&['identity','alternatives'].includes(b.mode);
}
function facts(text){const t=norm(text),set={};
 if(/\b(uretral|urinario|urinaria|urostomia)\b/.test(t))set.application='urinary';
 if(/\b(vascular|venoso|venosa|intravenoso)\b/.test(t))set.application='vascular';
 if(/\b(colostomia|ileostomia|intestinal)\b/.test(t))set.application='intestinal';
 if(/\b(nitrilica|nitrilico|nitrilo)\b/.test(t))set.material='nitrile';else if(/\blatex\b/.test(t))set.material='latex';else if(/\bvinil\b/.test(t))set.material='vinyl';
 if(/\bnao esteril\b/.test(t))set.sterile=false;else if(/\besteril\b/.test(t))set.sterile=true;
 if(/\bhidrofilic[ao]\b/.test(t))set.coating='hydrophilic';
 return set;
}
function dimensions(text){const result={};for(const m of String(text??'').toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*(mm|cm|fr|ch|ml|kg)\b/g)){const unit=m[2]==='cm'?'mm':m[2]==='ch'?'fr':m[2];(result[unit]??=new Set()).add(Number(m[1].replace(',','.'))*(m[2]==='cm'?10:1));}return result;}
export function productMatch(our,offer){
 const wanted=our.criteria??{},a=norm([our.description,wanted.type,wanted.specification].join(' ')),b=norm([offer.title,offer.description,offer.type,offer.specification].join(' '));
 const conflicts=[],pending=[],reasons=[];const af=facts(a),bf=facts(b);
 for(const k of Object.keys(af))if(bf[k]!==undefined&&af[k]!==bf[k])conflicts.push('Divergência de '+({application:'aplicação',material:'material',sterile:'esterilidade',coating:'revestimento'}[k]));else if(bf[k]===undefined)pending.push('Conferir '+k);
 const gtin=validGtin(wanted.gtin),other=validGtin(offer.gtin);if(gtin&&other&&gtin!==other)conflicts.push('GTIN diferente');
 const brand=norm(wanted.brand),ob=norm(offer.brand),model=norm(wanted.model).replace(/ /g,''),om=norm(offer.model).replace(/ /g,'');
 const differentBrand=!!(brand&&ob&&brand!==ob);if(differentBrand)reasons.push('Marca diferente: avaliar como alternativa');
 if(model&&om&&model!==om&&!differentBrand)conflicts.push('Modelo diferente');if(model&&!om)pending.push('Modelo não comprovado');if(brand&&!ob)pending.push('Marca não comprovada');
 if(/^(pedal|apoio de pe|peca|acessorio|braco p|roda para)\b/.test(norm(offer.title))&&!/^(pedal|apoio de pe|peca|acessorio|braco p|roda para)\b/.test(norm(our.description)))conflicts.push('Acessório não corresponde ao produto completo');
 const ds=dimensions([our.description,wanted.size,wanted.specification].join(' ')),os=dimensions([offer.size,offer.specification,offer.title,offer.description].join(' '));
 for(const [unit,values] of Object.entries(ds))if(!os[unit])pending.push('Medida '+unit+' não comprovada');else if([...values].some(v=>!os[unit].has(v)))conflicts.push('Medida '+unit+' diferente');
 const stop=new Set(['de','da','do','com','sem','para','em','un','unid','cx','caixa','kit','produto']);const words=[...new Set(a.split(' ').filter(w=>w.length>2&&!stop.has(w)))],hits=words.filter(w=>b.split(' ').includes(w)).length,similarity=words.length?hits/words.length:0;
 const brandModel=brand&&ob===brand&&model&&om===model;
 let kind=conflicts.length?'incompatible':differentBrand?'alternative':gtin&&other===gtin?'exact_gtin':brandModel?'exact_brand_model':'similar';
 if(!conflicts.length&&kind==='similar'&&similarity<0.15){conflicts.push('Descrição sem correspondência suficiente');kind='incompatible';}
 if(!wanted.our_pack_units)pending.push('Quantidade da nossa embalagem');if(!(number(offer.pack_units)>0))pending.push('Quantidade da embalagem concorrente');if(number(offer.shipping)===null)pending.push('Frete da praça');
 if(kind==='exact_gtin')reasons.push('GTIN válido correspondente');if(kind==='exact_brand_model')reasons.push('Marca e modelo informados correspondem');
 return {kind,score:kind==='incompatible'?0:kind==='exact_gtin'?100:kind==='exact_brand_model'?90:Math.min(differentBrand?65:79,Math.round(similarity*75)),conflicts,pending,reasons,certified:false};
}
export function comparablePrice(offer,ourPack){if(['incompatible','alternative'].includes(offer.match?.kind))return null;if(offer.currency!=='BRL'||!(number(offer.price)>0)||number(offer.shipping)===null||offer.shipping<0||!(number(offer.pack_units)>0)||!(number(ourPack)>0))return null;return (offer.price+offer.shipping)*ourPack/offer.pack_units;}
export function quotedPrices(text){return [...String(text??'').matchAll(/R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})(?!\d)/g)].map(m=>Number(m[1].replaceAll('.','').replace(',','.')));}
