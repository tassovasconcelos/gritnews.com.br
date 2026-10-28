export const COMPRAS='https://dadosabertos.compras.gov.br';
export const PRICE_PAGE_SIZE=500;
export const STATES='AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export const textKey=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function parseOfficialJSON(raw){return JSON.parse(raw.replace(/("(?:\\.|[^"\\])*")|(-?\d{16,})(?=\s*[,}\]])/g,(m,s,n)=>s??JSON.stringify(n)));}
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateResearch(q){
 if(!['catalog','prices','result','item'].includes(q?.action))throw Error('invalid_action');
 if(q.action==='result'){if(!/^\d{1,30}$/.test(q.purchase??'')||!/^\d{1,35}$/.test(q.item??''))throw Error('invalid_id');return {action:'result',purchase:q.purchase,item:q.item};}
 if(q.action==='item'){if(!/^\d{1,30}$/.test(q.purchase??''))throw Error('invalid_id');return {action:'item',purchase:q.purchase};}
 const page=Number(q.page??1);if(!Number.isInteger(page)||page<1||page>500)throw Error('invalid_page');
 if(!/^\d{1,9}$/.test(String(q.code??'')))throw Error('invalid_code');
 if(q.action==='catalog')return {action:q.action,code:String(q.code),page};
 if(!['codigoPdm','codigoItemCatalogo'].includes(q.type)||!day(q.start)||!day(q.end)||q.start>q.end||q.end>new Date().toISOString().slice(0,10)||Date.parse(q.end)-Date.parse(q.start)>4383*86400000)throw Error('invalid_period');
 if(q.sphere&&!['F','E','M'].includes(q.sphere))throw Error('invalid_sphere');
 if(q.state&&!STATES.includes(q.state))throw Error('invalid_state');return {action:q.action,code:String(q.code),type:q.type,page,start:q.start,end:q.end,state:q.state||'',sphere:q.sphere||''};
}
export function officialURL(input){const q=validateResearch(input);let path,params;
 if(q.action==='catalog'){path='/modulo-material/4_consultarItemMaterial';params={pagina:q.page,tamanhoPagina:100,codigoPdm:q.code};}
 if(q.action==='prices'){path='/modulo-pesquisa-preco/1_consultarMaterial';params={pagina:q.page,tamanhoPagina:PRICE_PAGE_SIZE,tipo:q.type,codigo:q.code,dataCompraInicio:q.start,dataCompraFim:q.end,dataResultado:true,...(q.state?{estado:q.state}:{}),...(q.sphere?{esfera:q.sphere}:{})};}
 if(q.action==='result'){path='/modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id';params={tipo:'idCompra',codigo:q.purchase,idCompraItem:q.item};}
 if(q.action==='item'){path='/modulo-contratacoes/2.1_consultarItensContratacoes_PNCP_14133_Id';params={tipo:'idCompra',codigo:q.purchase};}
 return COMPRAS+path+'?'+new URLSearchParams(params);
}
export async function requestOfficial(q,{fetcher=fetch,signal}={}){const url=officialURL(q),r=await fetcher(url,{signal:signal??AbortSignal.timeout(18000),headers:{Accept:'application/json'},redirect:'error'});if(!r.ok)throw Error('official_unavailable');const body=await r.text();if(body.length>4000000)throw Error('source_limit');const d=parseOfficialJSON(body);if(!Array.isArray(d.resultado))throw Error('invalid_source');return {...d,source:url,collected_at:new Date().toISOString()};}
export function priceRecord(r,source){
 if(!r.idCompraItem||!/^\d{1,30}$/.test(String(r.idCompra))||!Number.isFinite(r.precoUnitario)||r.precoUnitario<=0||!day(String(r.dataResultado??'').slice(0,10)))return null;
 const brand=String(r.marca??'').trim(),rawPurchase=String(r.idCompra),item=String(r.idCompraItem),prefix=/^\d{22}$/.test(item)?item.slice(0,-5):'';
 const purchase=prefix&&prefix.replace(/^0+/,'')===rawPurchase.replace(/^0+/,'')?prefix:rawPurchase;
 return {id:String(r.idCompraItem)+'|'+String(r.niFornecedor),purchase,item,catalog:String(r.codigoItemCatalogo??''),description:String(r.descricaoItem??''),detail:String(r.descricaoDetalhadaItem??''),unit:String(r.siglaUnidadeFornecimento??r.nomeUnidadeFornecimento??''),capacity:r.capacidadeUnidadeFornecimento??null,measure:String(r.siglaUnidadeMedida??''),brand:brand||null,brand_quality:!brand?'missing':/^\d+$/.test(brand)?'review':'reported',supplier:String(r.nomeFornecedor??''),supplier_id:String(r.niFornecedor??''),state:String(r.estado??''),city:String(r.municipio??''),buyer:String(r.nomeOrgao??r.nomeUasg??''),date:String(r.dataResultado).slice(0,10),price:r.precoUnitario,quantity:r.quantidade,source,collected_at:new Date().toISOString(),procurement_object:String(r.objetoCompra??''),pregao:/\bpregao\b/.test(textKey(r.objetoCompra)),status:'reference',size:null,verification:null};
}
export function mergeResult(row,data){
 const matches=data.resultado.filter(r=>String(r.idCompraItem)===row.item&&String(r.niFornecedor)===row.supplier_id);
 const winner=matches.find(r=>r.situacaoCompraItemResultadoId===1&&!r.dataCancelamentoPncp&&r.tipoPessoa==='PJ'&&Math.abs(Number(r.valorUnitarioHomologado)-row.price)<0.00005&&Number(r.quantidadeHomologada)===row.quantity);
 if(!winner)return {...row,status:matches.length?'unconfirmed':'reference',verification:{source:data.source,checked_at:data.collected_at,matched:false}};
 const id=String(winner.numeroControlePNCPCompra??''),m=id.match(/^([A-Z0-9]{14})-1-(\d+)\/(\d{4})$/i);
 return {...row,status:'confirmed',size:({1:'ME',2:'EPP',3:'Demais',4:'Não se aplica',5:'Não informado'})[winner.porteFornecedorId]??null,result_date:String(winner.dataResultadoPncp??'').slice(0,10),pncp:id,url:m?`https://pncp.gov.br/app/editais/${m[1]}/${m[3]}/${Number(m[2])}`:null,verification:{source:data.source,checked_at:data.collected_at,matched:true},date_discrepancy:String(winner.dataResultadoPncp??'').slice(0,10)!==row.date};
}
export function mergeProcurementItem(row,data){
 const item=(data?.resultado||[]).find(r=>String(r.idCompraItem)===row.item&&String(r.idCompra)===row.purchase);
 if(!item)return {...row,item_identity:'pending',item_source:data?.source||null,item_checked_at:data?.collected_at||null};
 const awardAligned=String(item.codFornecedor??'')===row.supplier_id&&Number(item.valorUnitarioResultado)===Number(row.price)&&Number(item.quantidadeResultado)===Number(row.quantity);
 const procurementDescription=String(item.descricaoResumida||''),procurementDetail=String(item.descricaodetalhada||'');
 const hasOfficialDescription=!!(procurementDescription||procurementDetail).trim();
 return {...row,description:procurementDescription||row.description,detail:procurementDetail||row.detail,catalog_description:row.description,catalog_detail:row.detail,procurement_description:procurementDescription,procurement_detail:procurementDetail,procurement_item_number:item.numeroItemPncp??null,procurement_catalog:String(item.codItemCatalogo??''),procurement_pdm:String(item.codigoPdm??''),item_identity:hasOfficialDescription?'official_item':'pending',item_award_aligned:awardAligned,item_source:data?.source||null,item_checked_at:data?.collected_at||null,match_note:[row.match_note,`Item oficial nº ${item.numeroItemPncp??'não informado'}; modelo comercial e fabricante exclusivo não são confirmados apenas pelo catálogo/PDM.`,!hasOfficialDescription?'A fonte retornou o identificador, mas não trouxe descrição oficial utilizável.': '',awardAligned?'':'Divergência entre fornecedor, preço ou quantidade do item e o resultado homologado; conferir os documentos.'].filter(Boolean).join(' ')};
}
export function filterPrices(rows,{brand='',supplier='',state='',start='',end='',confirmed=false,pregao=false,technical='',unit='',minQuantity='',size=''}={}){const b=textKey(brand),s=textKey(supplier);return rows.filter(r=>(!size||r.size===size)&&(!unit||textKey(r.unit)===textKey(unit))&&(minQuantity===''||Number(r.quantity)>=Number(minQuantity))&&(!technical||technicalMatch(r,technical).matches)&&(!pregao||r.pregao)&&(!b||textKey(r.brand).includes(b))&&(!s||textKey(r.supplier+' '+r.supplier_id).includes(s))&&(!state||r.state===state)&&(!start||(r.result_date||r.date)>=start)&&(!end||(r.result_date||r.date)<=end)&&(!confirmed||r.status==='confirmed'));}

// Search aids rank candidates; none certifies technical equivalence or CATMAT mapping.
const normalizeTechnical=s=>textKey(s).replace(/\bnitrilic[ao]\b/g,'nitrilica').replace(/\btam(?:anho)?\.?\s*[:=-]?\s*(?:medio|media)\b/g,'tamanho m').replace(/\btam(?:anho)?\.?\s*[:=-]?\s*pequen[oa]\b/g,'tamanho p').replace(/\btam(?:anho)?\.?\s*[:=-]?\s*grande\b/g,'tamanho g').replace(/\bluvas\b/g,'luva').replace(/\bmililitros?\b/g,'ml').replace(/\bmilimetros?\b/g,'mm').replace(/\bcentimetros?\b/g,'cm').replace(/\bnao[ -]+esteril\b/g,'naoesteril').replace(/\bsem[ -]+latex\b/g,'semlatex').replace(/(\d),(\d)/g,'$1.$2').replace(/(\d+)\.0+\b/g,'$1').replace(/(\d)\s*(ml|mm|cm|kg|mg|litros?|unidades?)\b/g,'$1 $2').replace(/[^a-z0-9.]+/g,' ').replace(/\s+/g,' ').trim();
export function technicalMatch(row,query){
 const normalized=normalizeTechnical(query),phrases=[...normalized.matchAll(/\b\d+(?:\.\d+)?\s+(?:ml|mm|cm|kg|mg|l|g)\b|\b(?:sem|com) po\b|\btamanho [a-z0-9]+\b/g)].map(m=>m[0]);
 const tokens=[...new Set([...normalized.split(' ').filter(Boolean),...phrases])],hay=' '+normalizeTechnical([row.description,row.detail].join(' '))+' ';
 const missing=tokens.filter(t=>!hay.includes(' '+t+' '));return {matches:missing.length===0,missing,matched:tokens.length-missing.length,total:tokens.length};
}
const familyAliases={'cad':'cadeira','rodas':'roda','luvas':'luva','seringas':'seringa','agulhas':'agulha','curativos':'curativo','ataduras':'atadura','sondas':'sonda','cateteres':'cateter','mascaras':'mascara','bolsas':'bolsa','colostomia':'estomia','ileostomia':'estomia','ostomia':'estomia'};
const familyTerms=s=>normalizeTechnical(s).replace(/\bsistema p(?:ara)? estomia\b/g,'bolsa estomia').split(' ').filter(w=>w.length>2&&!/^\d/.test(w)&&!['com','sem','para','uso','tipo','tam','tamanho','esteril','descartavel','unidade','unidades','marca','modelo'].includes(w)).map(w=>familyAliases[w]||w);
export function rankFamilies(catalog,query){
 const terms=familyTerms(query),code=String(query).trim();if(!terms.length&&!/^\d+$/.test(code))return [];
 const anchored=catalog.filter(r=>familyTerms(r.name).includes(terms[0]));if(anchored.length&&!/^\d+$/.test(code))catalog=anchored;
 const frequency=new Map(terms.map(t=>[t,catalog.filter(r=>familyTerms(r.name).includes(t)).length]));
 return catalog.map(r=>{const words=familyTerms(r.name),found=terms.filter(t=>words.includes(t)),matched=found.length,exact=String(r.code)===code;return {...r,matched,score:exact?1000:matched?found.reduce((sum,t)=>sum+20+8*Math.log((catalog.length+1)/((frequency.get(t)||0)+1)),0)+(matched===terms.length?10:0)+(words[0]===terms[0]?6:0)+(r.group===65?5:0)+(r.active?10:0)-Math.max(0,words.length-matched)*0.5:0,search_match:exact?'Código oficial exato':matched===terms.length?'Termos da família encontrados':'Família candidata · conferir especificação'};}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||Number(b.active)-Number(a.active)||Number(b.group===65)-Number(a.group===65)).slice(0,40);
}
export function comparisonSummary(rows,key){
 const comparable=[...new Map(rows.filter(r=>comparisonKey(r)===key&&comparableRecord(r)).map(r=>[r.id,r])).values()].sort((a,b)=>(b.result_date||b.date).localeCompare(a.result_date||a.date));
 if(!comparable.length)return null;const prices=comparable.map(r=>r.price).sort((a,b)=>a-b),n=prices.length;
 return {count:n,latest:comparable[0],min:prices[0],median:n%2?prices[(n-1)/2]:(prices[n/2-1]+prices[n/2])/2,max:prices[n-1],suppliers:new Set(comparable.map(r=>r.supplier_id)).size,states:new Set(comparable.map(r=>r.state).filter(Boolean)).size};
}
export function researchCSVCell(value){const s=String(value??'');return '"'+(/^(\s*[=+@-]|[\t\r\n])/.test(s)?"'":'')+s.replaceAll('"','""')+'"';}
export const comparisonKey=r=>JSON.stringify([r.catalog,textKey(r.unit),r.capacity??null,textKey(r.measure),textKey(r.brand)]);
export const comparableRecord=r=>r.status==='confirmed'&&r.brand_quality==='reported'&&!!r.unit&&!!r.catalog&&typeof r.capacity==='number'&&Number.isFinite(r.capacity)&&r.capacity>0;
export function priceHistory(rows,key){
 const clean=[...new Map(rows.filter(r=>comparisonKey(r)===key&&comparableRecord(r)).map(r=>[r.id,r])).values()];const months=new Map();
 for(const r of clean){const month=(r.result_date||r.date).slice(0,7);if(!months.has(month))months.set(month,[]);months.get(month).push(r.price);}
 return [...months].sort(([a],[b])=>a.localeCompare(b)).map(([month,values])=>{values.sort((a,b)=>a-b);const n=values.length;return {month,count:n,min:values[0],median:n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2,max:values[n-1]};});
}
