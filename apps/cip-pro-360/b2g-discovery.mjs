import {vocabularyCorrespondence,vocabularyFamilyQueries,vocabularyKey} from './b2g-vocabulary.mjs';
import {COMPRAS,STATES,textKey,parseOfficialJSON} from './b2g-research.mjs';
const PNCP='https://pncp.gov.br/api/consulta/v1';
const CEARA='https://api-dados-abertos.cearatransparente.ce.gov.br/transparencia/contratos/contratos';
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateDiscovery(q){
 if(q?.action==='discover_ce_contract'){if(!/^\d{1,10}$/.test(q.id??''))throw Error('invalid_query');return {action:q.action,id:q.id};}
 if(q?.action==='discover_enrich'){
  if(!Array.isArray(q.items)||!q.items.length||q.items.length>8||!/^\d{14}$/.test(q.supplier??''))throw Error('invalid_query');
  if(q.items.some(r=>!/^\d{1,30}$/.test(r.purchase??'')||!/^\d{1,35}$/.test(r.item??'')))throw Error('invalid_query');
  return {action:q.action,supplier:q.supplier,product:String(q.product||'').slice(0,150),items:q.items.map(r=>({purchase:r.purchase,item:r.item}))};
 }
 if(!['discover_supplier','discover_contracts','discover_ceara'].includes(q?.action))throw Error('invalid_action');
 const page=Number(q.page??1);if(!Number.isInteger(page)||page<1||page>50)throw Error('invalid_page');
 if(!date(q.start)||!date(q.end)||q.start>q.end||q.end>new Date().toISOString().slice(0,10)||Date.parse(q.end)-Date.parse(q.start)>365*86400000)throw Error('invalid_period');
 if(q.state&&!STATES.includes(q.state))throw Error('invalid_state');
 if(q.sphere&&!['F','E','M'].includes(q.sphere))throw Error('invalid_sphere');
 if(q.action==='discover_supplier'&&!/^\d{14}$/.test(q.supplier??''))throw Error('invalid_query');
 if(q.organ&&!/^\d{14}$/.test(q.organ))throw Error('invalid_query');
 return {action:q.action,page,start:q.start,end:q.end,state:q.state||'',sphere:q.sphere||'',supplier:q.supplier||'',organ:q.organ||''};
}
const responseCache=new Map();
let nextRequest=0;
async function get(url,fetcher){
 const cached=responseCache.get(url);if(fetcher===fetch&&cached&&Date.now()-cached.at<600000)return cached.data;
 if(fetcher===fetch){const delay=Math.max(0,nextRequest-Date.now());nextRequest=Math.max(nextRequest,Date.now())+900;if(delay)await new Promise(resolve=>setTimeout(resolve,delay));}
 const r=await fetcher(url,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
 if(r.status===204)return {data:[],totalRegistros:0,totalPaginas:0};if(r.status===429)throw Error('source_rate_limit');if(!r.ok)throw Error('official_unavailable');
 const reader=r.body.getReader(),chunks=[];let size=0;while(true){const d=await reader.read();if(d.done)break;size+=d.value.byteLength;if(size>4000000){await reader.cancel();throw Error('source_limit');}chunks.push(d.value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const data=parseOfficialJSON(new TextDecoder().decode(bytes));data._collected_at=new Date().toISOString();if(fetcher===fetch){if(responseCache.size>=80)responseCache.delete(responseCache.keys().next().value);responseCache.set(url,{at:Date.now(),data});}return data;
}
const url=(path,params)=>COMPRAS+path+'?'+new URLSearchParams(params);
export function discoveryURL(input){const q=validateDiscovery(input);
 if(q.action==='discover_ce_contract')return CEARA+'/'+q.id;
 if(q.action==='discover_ceara'){const brazil=s=>s.split('-').reverse().join('/');return CEARA+'?'+new URLSearchParams({page:q.page,data_assinatura_inicio:brazil(q.start),data_assinatura_fim:brazil(q.end)});}
 if(q.action==='discover_supplier')return url('/modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133',{pagina:q.page,tamanhoPagina:500,niFornecedor:q.supplier,dataResultadoPncpInicial:q.start,dataResultadoPncpFinal:q.end,...(q.organ?{orgaoEntidadeCnpj:q.organ}:{})});
 if(q.action==='discover_contracts')return PNCP+'/contratos?'+new URLSearchParams({dataInicial:q.start.replaceAll('-',''),dataFinal:q.end.replaceAll('-',''),pagina:q.page,tamanhoPagina:500,...(q.organ?{cnpjOrgao:q.organ}:{})});
 throw Error('invalid_action');
}
export const discoveryKey=s=>textKey(s).replace(/proc[\s-]*irur[\s-]*gica/g,'procirurgica').replace(/\bfawler\b/g,'fowler').replace(/\bcamas\b/g,'cama').replace(/\bcateteres\b/g,'cateter').replace(/\b(ch|fr)\s*0*(\d+)\b/g,'$2 french').replace(/\b(\d+)\s*(fr|ch)\b/g,'$1 french').replace(/\bhidrofilic[ao]s?\b/g,'hidrofilico').replace(/\b(?:hospitalares|hospitalar)\b/g,'hospitalar').replace(/[^a-z0-9]+/g,' ').trim();
export const brandKey=s=>discoveryKey(s).replace(/\s+/g,'');
export function familySearchQueries(product){
 const key=discoveryKey(product),urinary=/\b(?:uretral|urinario|vesical|hidrofilico|nelaton|tiemann|comfortcath)\b/.test(key),other=/\b(?:periferico|central|venoso|intravenoso|hemodinamica|nasal|arterial|angioplastia|epidural)\b/.test(key);
 if(!/\bcateter\b/.test(key)||other)return vocabularyFamilyQueries(product);
 return urinary?[...new Set([...vocabularyFamilyQueries(product),'sonda trato urinario','sonda uretral'])]:[product,'sonda trato urinario','sonda uretral'];
}
export function productCorrespondence(row,product=''){
 const hay=' '+discoveryKey([row.description,row.detail,row.object,row.process,row.contract].join(' '))+' ';
 const terms=discoveryKey(product).replace(/\bbolsas\b/g,'bolsa').split(' ').filter(t=>t&&!['de','da','do','das','dos','para','p'].includes(t));
 const normalizedHay=hay.replace(/\bbolsas\b/g,'bolsa'),key=discoveryKey(product);
 const dimensions=[...vocabularyKey(product).matchAll(/\b\d+(?:\.\d+)? (?:mm|cm|ml|kg|mg|g|v|french)\b/g)].map(m=>m[0]),dimensionHay=' '+vocabularyKey([row.description,row.detail,row.object].join(' '))+' ';
 if(dimensions.some(t=>!dimensionHay.includes(' '+t+' ')))return {matches:false,candidate:false,expanded:false,note:null};
 const requirements=[...key.matchAll(/\b(?:sem|com) (?:latex|po|filtro)\b|\bnao esteril\b/g)].map(m=>m[0]);
 if(requirements.some(t=>!normalizedHay.includes(' '+t+' '))||terms.includes('esteril')&&!terms.includes('nao')&&/\bnao[ -]?esteril\b/.test(normalizedHay))return {matches:false,candidate:false,expanded:false,note:null};
 if(terms.some(t=>['hidrofilico','intermitente'].includes(t))&&/\b(?:foley|demora|balonete)\b/.test(normalizedHay))return {matches:false,candidate:false,expanded:false,note:null};
 if(terms.includes('hidrofilico')&&/\b(?:nao hidrofilico|sem (?:revestimento )?hidrofilico)\b/.test(normalizedHay))return {matches:false,candidate:false,expanded:false,note:null};
 const urinaryCatheter=terms.includes('cateter')&&/\b(?:sonda|cateter)\b/.test(normalizedHay)&&/\buretral\b/.test(normalizedHay)&&!/\b(?:periferico|central|venoso|intravenoso|hemodinamica|nasal|arterial|angioplastia|epidural)\b/.test(discoveryKey(product));
 const missing=terms.filter(t=>!normalizedHay.includes(' '+t+' ')&&!(t==='cateter'&&urinaryCatheter));
 if(urinaryCatheter){const pending=missing.length===1&&missing[0]==='hidrofilico'&&!/\b(?:nao hidrofilico|sem revestimento hidrofilico)\b/.test(normalizedHay);return {matches:missing.length===0,candidate:pending,technical_pending:pending?['Revestimento hidrofílico não comprovado nesta fonte']:[],expanded:true,note:pending?'Produto relacionado: sonda uretral da marca pesquisada. A fonte não comprova revestimento hidrofílico; lubrificação não comprova hidrofilia. Conferir ficha técnica e anexos.':'Correspondência ampliada: cateter descrito na fonte como sonda uretral. Conferir indicação, calibre, comprimento, ponta e revestimento; não certifica equivalência técnica.'};}
 const semantic=vocabularyCorrespondence(row,product);if(semantic)return semantic;
 const accessory=/^(?:adjuvante|placa|clipe?|fixador|pasta|cinto)\b/.test(discoveryKey(row.description));
 if(terms.includes('bolsa')&&accessory&&!terms.some(t=>/^(?:adjuvante|placa|clipe?|fixador|pasta|cinto)$/.test(t)))return {matches:false,expanded:false,note:null};
 const intestinalTerm=terms.find(t=>['colostomia','ileostomia'].includes(t)),urinaryTerm=terms.includes('urostomia'),opposite=intestinalTerm==='colostomia'?'ileostomia':'colostomia';
 const intestinalExpanded=!!intestinalTerm&&!normalizedHay.includes(' '+intestinalTerm+' ')&&/\bestomia\b/.test(normalizedHay)&&/\bintestinal\b/.test(normalizedHay)&&!/(?:aplicacao\s+)?urinaria|urostomia/.test(normalizedHay)&&!normalizedHay.includes(' '+opposite+' ');
 const urinaryExpanded=urinaryTerm&&!normalizedHay.includes(' urostomia ')&&/\bestomia\b/.test(normalizedHay)&&/\burinaria\b/.test(normalizedHay)&&!/\b(?:intestinal|colostomia|ileostomia)\b/.test(normalizedHay),expanded=intestinalExpanded||urinaryExpanded;
 return {matches:terms.every(t=>normalizedHay.includes(' '+t+' ')||(t===intestinalTerm&&intestinalExpanded)||(t==='urostomia'&&urinaryExpanded)),expanded,note:expanded?'Correspondência ampliada: sistema para estomia de aplicação '+(urinaryExpanded?'urinária':'intestinal')+'. Confirmar indicação, modelo, medidas e apresentação; não certifica equivalência técnica.':null};
}
export function discoveryMatch(row,{product='',brand='',state='',sphere='',supplier='',allowRelated=false}={}){
 if(supplier&&row.supplier_id!==supplier||state&&row.state!==state||sphere&&row.sphere!==sphere||brand&&!brandKey(row.brand).includes(brandKey(brand)))return false;const match=productCorrespondence(row,product);return match.matches||allowRelated&&match.candidate===true;
}
export function mergeMarketBatches(previous,next){
 if(!previous)return next;const coverage=new Map(previous.coverage.map(c=>[String(c.code),c]));for(const c of next.coverage){const old=coverage.get(String(c.code));coverage.set(String(c.code),{...c,received:(old?.received||0)+c.received,pages:(old?.pages||0)+c.pages});}
 const rows=[...new Map([...previous.rows,...next.rows].map(r=>[r.id,r])).values()];return {...next,rows,coverage:[...coverage.values()],received:[...coverage.values()].reduce((n,c)=>n+c.received,0),sources:[...new Map([...previous.sources,...next.sources].map(s=>[s.url,s])).values()],failures:next.failures,confirmed:rows.filter(r=>r.status==='award').length,partial:next.next_cursor.length>0||next.partial};
}
export function cearaRecord(r,source,collected_at){if(r.confidential===true||r.confidential==='true')return null;return {id:'ceara|'+r.isn_sic,status:'contract',description:r.descricao_objeto||'',object:r.descricao_justificativa||'',buyer:'Governo do Ceará · unidade '+(r.cod_gestora||''),state:'CE',sphere:'E',city:'',supplier:r.descricao_nome_credor||'',supplier_id:r.plain_cpf_cnpj_financiador||String(r.cpf_cnpj_financiador||'').replace(/\D/g,''),brand:null,price:null,quantity:null,total:Number(r.valor_contrato),date:r.data_assinatura?.slice(0,10),publication:r.data_publicacao_portal?.slice(0,10),source,collected_at,url:CEARA+'/'+r.isn_sic,contract:r.num_contrato,kind:r.descricao_tipo,process:r.num_spu,purchase_process:r.num_spu_licitacao,contract_status:r.descricao_situacao,publication_doe:r.data_publicacao_doe?.slice(0,10),evidence:[source]};}
export function supplierCandidates(data){return data.resultado.filter(r=>r.tipoPessoa==='PJ'&&r.situacaoCompraItemResultadoId===1&&!r.dataCancelamentoPncp).map(r=>({purchase:String(r.idCompra),item:String(r.idCompraItem),date:String(r.dataResultadoPncp??'').slice(0,10),state:r.unidadeOrgaoUfSigla})).sort((a,b)=>b.date.localeCompare(a.date));}
export function contractRecord(r,source,collected_at){return {id:r.numeroControlePNCP,status:'contract',description:r.objetoContrato||'',object:r.objetoContrato||'',buyer:r.orgaoEntidade?.razaoSocial||'',state:r.unidadeOrgao?.ufSigla||'',sphere:r.orgaoEntidade?.esferaId||'',city:r.unidadeOrgao?.municipioNome||'',supplier:r.nomeRazaoSocialFornecedor||'',supplier_id:r.niFornecedor||'',brand:null,price:null,quantity:null,total:r.valorGlobal,date:r.dataAssinatura,publication:r.dataPublicacaoPncp,source,collected_at,url:`https://pncp.gov.br/app/contratos/${r.orgaoEntidade?.cnpj}/${r.anoContrato}/${r.sequencialContrato}`,purchase_id:r.numeroControlePncpCompra,contract:r.numeroContratoEmpenho,kind:r.tipoContrato?.nome,process:r.processo};}
async function enrich(q,ids,fetcher){
 const evidence=[],captures=[];const read=async(path,params)=>{const source=url(path,params),d=await get(source,fetcher);if(!Array.isArray(d.resultado))throw Error('invalid_source');evidence.push(source);captures.push(d._collected_at||new Date().toISOString());return d.resultado;};
 const params={tipo:'idCompra',codigo:ids.purchase,idCompraItem:ids.item};
 const items=await read('/modulo-contratacoes/2.1_consultarItensContratacoes_PNCP_14133_Id',{tipo:'idCompra',codigo:ids.purchase}),item=items.find(r=>String(r.idCompraItem)===ids.item);
 if(!item)return null;
 if(!discoveryMatch({description:item.descricaoResumida,detail:item.descricaodetalhada},{product:q.product}))return {skip:true};
 const results=await read('/modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id',params);
 const win=results.find(r=>String(r.idCompraItem)===ids.item&&r.niFornecedor===q.supplier&&r.tipoPessoa==='PJ'&&r.situacaoCompraItemResultadoId===1&&!r.dataCancelamentoPncp);if(!win)return null;
 if(!(win.valorUnitarioHomologado>0)||!(win.quantidadeHomologada>0)||!Number.isFinite(win.valorTotalHomologado)||Math.abs(win.valorUnitarioHomologado*win.quantidadeHomologada-win.valorTotalHomologado)>0.01)return null;
 if(item.codFornecedor!==q.supplier||Number(item.valorUnitarioResultado)!==Number(win.valorUnitarioHomologado)||Number(item.quantidadeResultado)!==Number(win.quantidadeHomologada))return null;
 const id=String(win.numeroControlePNCPCompra||''),m=id.match(/^(\d{14})-1-(\d+)\/(\d{4})$/);if(!m)return null;
 const metadata=await read('/modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id',{tipo:'idCompra',codigo:ids.purchase});
 const meta=metadata.find(r=>String(r.idCompra)===ids.purchase)||{};
 let brand=null,brandSource=null,brandError=false;
 if(/^\d{1,9}$/.test(String(item.codItemCatalogo))){try{
  const date=String(win.dataResultadoPncp).slice(0,10),prices=await read('/modulo-pesquisa-preco/1_consultarMaterial',{pagina:1,tamanhoPagina:500,tipo:'codigoItemCatalogo',codigo:item.codItemCatalogo,idCompra:ids.purchase,dataCompraInicio:date,dataCompraFim:date,dataResultado:true});
  const price=prices.find(r=>String(r.idCompraItem)===ids.item&&r.niFornecedor===q.supplier&&Number(r.precoUnitario)===Number(win.valorUnitarioHomologado)&&Number(r.quantidade)===Number(win.quantidadeHomologada));brand=price?.marca||null;brandSource=brand?evidence.at(-1):null;
 }catch(e){if(e.message==='source_rate_limit')throw e;brandError=true;}}
 return {id:ids.item+'|'+q.supplier,status:'award',description:item.descricaoResumida,detail:item.descricaodetalhada,unit:item.unidadeMedida,catalog:String(item.codItemCatalogo??''),brand,brandSource,brandError,supplier:win.nomeRazaoSocialFornecedor,supplier_id:q.supplier,size:win.porteFornecedorNome,price:win.valorUnitarioHomologado,quantity:win.quantidadeHomologada,total:win.valorTotalHomologado,date:String(win.dataResultadoPncp).slice(0,10),state:win.unidadeOrgaoUfSigla,sphere:meta.orgaoEntidadeEsferaId||'',buyer:meta.orgaoEntidadeRazaoSocial||meta.unidadeOrgaoNomeUnidade||m[1],object:meta.objetoCompra||'',process:meta.processo||'',pncp:id,url:`https://pncp.gov.br/app/editais/${m[1]}/${m[3]}/${Number(m[2])}`,evidence:[evidence[1],evidence[0],...evidence.slice(2)],collected_at:captures.sort()[0]};
}
export async function requestDiscovery(input,{fetcher=fetch}={}){
 const q=validateDiscovery(input);
 if(q.action==='discover_enrich'){
  const rows=[],failures=[];let skipped=0;let cursor=0;await Promise.all(Array.from({length:Math.min(3,q.items.length)},async()=>{while(cursor<q.items.length){const ids=q.items[cursor++];try{const row=await enrich(q,ids,fetcher);if(row?.skip)skipped++;else if(row)rows.push(row);else failures.push({...ids,error:'unconfirmed'});}catch(e){failures.push({...ids,error:e.message==='source_rate_limit'?'source_rate_limit':'official_unavailable'});}}}));return {rows,failures,skipped,collected_at:new Date().toISOString()};
 }
 const source=discoveryURL(q),d=await get(source,fetcher),collected_at=d._collected_at||new Date().toISOString();
 if(q.action==='discover_ce_contract'){const rows=(Array.isArray(d.data)?d.data:[d.data||d]).map(r=>cearaRecord(r,source,collected_at)).filter(Boolean);if(rows.some(r=>!r.id||r.id==='ceara|undefined'))throw Error('invalid_source');return {rows,scanned:rows.length,total:rows.length,pages:1,source,collected_at};}
 if(q.action==='discover_ceara'){if(!Array.isArray(d.data)||!d.sumary)throw Error('invalid_source');return {rows:d.data.map(r=>cearaRecord(r,source,collected_at)).filter(Boolean),scanned:d.data.length,total:d.sumary.total_records,pages:d.sumary.total_pages,source,collected_at};}
 if(q.action==='discover_supplier'){if(!Array.isArray(d.resultado))throw Error('invalid_source');return {candidates:supplierCandidates(d),scanned:d.resultado.length,total:d.totalRegistros,pages:d.totalPaginas,source,collected_at};}
 if(!Array.isArray(d.data))throw Error('invalid_source');return {rows:d.data.map(r=>contractRecord(r,source,collected_at)),scanned:d.data.length,total:d.totalRegistros,pages:d.totalPaginas,source,collected_at};
}
