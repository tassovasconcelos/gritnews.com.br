export const COMPRAS='https://dadosabertos.compras.gov.br';
export const STATES='AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export const textKey=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function parseOfficialJSON(raw){return JSON.parse(raw.replace(/("(?:\\.|[^"\\])*")|(-?\d{16,})(?=\s*[,}\]])/g,(m,s,n)=>s??JSON.stringify(n)));}
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateResearch(q){
 if(!['catalog','prices','result'].includes(q?.action))throw Error('invalid_action');
 if(q.action==='result'){if(!/^\d{1,30}$/.test(q.purchase??'')||!/^\d{1,35}$/.test(q.item??''))throw Error('invalid_id');return {action:'result',purchase:q.purchase,item:q.item};}
 if(!/^\d{1,9}$/.test(String(q.code??'')))throw Error('invalid_code');
 const page=Number(q.page??1);if(!Number.isInteger(page)||page<1||page>500)throw Error('invalid_page');
 if(q.action==='catalog')return {action:q.action,code:String(q.code),page};
 if(!['codigoPdm','codigoItemCatalogo'].includes(q.type)||!day(q.start)||!day(q.end)||q.start>q.end||q.end>new Date().toISOString().slice(0,10)||Date.parse(q.end)-Date.parse(q.start)>1096*86400000)throw Error('invalid_period');
 if(q.sphere&&!['F','E','M'].includes(q.sphere))throw Error('invalid_sphere');
 if(q.state&&!STATES.includes(q.state))throw Error('invalid_state');return {action:q.action,code:String(q.code),type:q.type,page,start:q.start,end:q.end,state:q.state||'',sphere:q.sphere||''};
}
export function officialURL(input){const q=validateResearch(input);let path,params;
 if(q.action==='catalog'){path='/modulo-material/4_consultarItemMaterial';params={pagina:q.page,tamanhoPagina:20,codigoPdm:q.code};}
 if(q.action==='prices'){path='/modulo-pesquisa-preco/1_consultarMaterial';params={pagina:q.page,tamanhoPagina:50,tipo:q.type,codigo:q.code,dataCompraInicio:q.start,dataCompraFim:q.end,dataResultado:true,...(q.state?{estado:q.state}:{}),...(q.sphere?{esfera:q.sphere}:{})};}
 if(q.action==='result'){path='/modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id';params={tipo:'idCompra',codigo:q.purchase,idCompraItem:q.item};}
 return COMPRAS+path+'?'+new URLSearchParams(params);
}
export async function requestOfficial(q,{fetcher=fetch,signal}={}){const url=officialURL(q),r=await fetcher(url,{signal:signal??AbortSignal.timeout(18000),headers:{Accept:'application/json'},redirect:'error'});if(!r.ok)throw Error('official_unavailable');const body=await r.text();if(body.length>4000000)throw Error('source_limit');const d=parseOfficialJSON(body);if(!Array.isArray(d.resultado))throw Error('invalid_source');return {...d,source:url,collected_at:new Date().toISOString()};}
export function priceRecord(r,source){
 if(!r.idCompraItem||!/^\d{1,30}$/.test(String(r.idCompra))||!Number.isFinite(r.precoUnitario)||r.precoUnitario<=0||!day(String(r.dataResultado??'').slice(0,10)))return null;
 const brand=String(r.marca??'').trim();
 return {id:String(r.idCompraItem)+'|'+String(r.niFornecedor),purchase:String(r.idCompra),item:String(r.idCompraItem),catalog:String(r.codigoItemCatalogo??''),description:String(r.descricaoItem??''),detail:String(r.descricaoDetalhadaItem??''),unit:String(r.siglaUnidadeFornecimento??r.nomeUnidadeFornecimento??''),capacity:r.capacidadeUnidadeFornecimento??null,measure:String(r.siglaUnidadeMedida??''),brand:brand||null,brand_quality:!brand?'missing':/^\d+$/.test(brand)?'review':'reported',supplier:String(r.nomeFornecedor??''),supplier_id:String(r.niFornecedor??''),state:String(r.estado??''),city:String(r.municipio??''),buyer:String(r.nomeOrgao??r.nomeUasg??''),date:String(r.dataResultado).slice(0,10),price:r.precoUnitario,quantity:r.quantidade,source,collected_at:new Date().toISOString(),procurement_object:String(r.objetoCompra??''),pregao:/\bpregao\b/.test(textKey(r.objetoCompra)),status:'reference',size:null,verification:null};
}
export function mergeResult(row,data){
 const matches=data.resultado.filter(r=>String(r.idCompraItem)===row.item&&String(r.niFornecedor)===row.supplier_id);
 const winner=matches.find(r=>r.situacaoCompraItemResultadoId===1&&!r.dataCancelamentoPncp&&r.tipoPessoa==='PJ'&&Math.abs(Number(r.valorUnitarioHomologado)-row.price)<0.00005&&Number(r.quantidadeHomologada)===row.quantity);
 if(!winner)return {...row,status:matches.length?'unconfirmed':'reference',verification:{source:data.source,checked_at:data.collected_at,matched:false}};
 const id=String(winner.numeroControlePNCPCompra??''),m=id.match(/^([A-Z0-9]{14})-1-(\d+)\/(\d{4})$/i);
 return {...row,status:'confirmed',size:({1:'ME',2:'EPP',3:'Demais',4:'Não se aplica',5:'Não informado'})[winner.porteFornecedorId]??null,result_date:String(winner.dataResultadoPncp??'').slice(0,10),pncp:id,url:m?`https://pncp.gov.br/app/editais/${m[1]}/${m[3]}/${Number(m[2])}`:null,verification:{source:data.source,checked_at:data.collected_at,matched:true},date_discrepancy:String(winner.dataResultadoPncp??'').slice(0,10)!==row.date};
}
export function filterPrices(rows,{brand='',supplier='',state='',start='',end='',confirmed=false,pregao=false}={}){const b=textKey(brand),s=textKey(supplier);return rows.filter(r=>(!pregao||r.pregao)&&(!b||textKey(r.brand).includes(b))&&(!s||textKey(r.supplier+' '+r.supplier_id).includes(s))&&(!state||r.state===state)&&(!start||(r.result_date||r.date)>=start)&&(!end||(r.result_date||r.date)<=end)&&(!confirmed||r.status==='confirmed'));}
export const comparisonKey=r=>JSON.stringify([r.catalog,textKey(r.unit),r.capacity??null,textKey(r.measure),textKey(r.brand)]);
export const comparableRecord=r=>r.status==='confirmed'&&r.brand_quality==='reported'&&!!r.unit&&!!r.catalog&&typeof r.capacity==='number'&&Number.isFinite(r.capacity)&&r.capacity>0;
export function priceHistory(rows,key){
 const clean=[...new Map(rows.filter(r=>comparisonKey(r)===key&&comparableRecord(r)).map(r=>[r.id,r])).values()];const months=new Map();
 for(const r of clean){const month=(r.result_date||r.date).slice(0,7);if(!months.has(month))months.set(month,[]);months.get(month).push(r.price);}
 return [...months].sort(([a],[b])=>a.localeCompare(b)).map(([month,values])=>{values.sort((a,b)=>a-b);const n=values.length;return {month,count:n,min:values[0],median:n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2,max:values[n-1]};});
}
