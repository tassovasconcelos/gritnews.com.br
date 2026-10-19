export const PNCP='https://pncp.gov.br';
export const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const health=/hospital|medicamento|material medico|produtos para saude|odontolog|curativo|enfermagem|nutricao|nutricional|equipamento medico/;
export function relevantPurchase(row){const s=normalize(row?.objetoCompra);return health.test(s)&&!/(prestacao de servicos|contratacao de servicos|obras de|construcao de|reforma de)/.test(s);}
export function purchaseRecord(p){
 const cnpj=String(p?.orgaoEntidade?.cnpj??''),year=Number(p?.anoCompra),sequence=Number(p?.sequencialCompra);
 if(!/^\d{14}$/.test(cnpj)||!Number.isInteger(year)||!Number.isInteger(sequence))return null;
 return {total_awarded:p.valorTotalHomologado??null,id:String(p.numeroControlePNCP),cnpj,year,sequence,object:String(p.objetoCompra??''),buyer:String(p.orgaoEntidade.razaoSocial??''),unit:String(p.unidadeOrgao?.nomeUnidade??''),city:String(p.unidadeOrgao?.municipioNome??''),state:String(p.unidadeOrgao?.ufSigla??''),published:p.dataPublicacaoPncp??null,opens:p.dataAberturaProposta??null,closes:p.dataEncerramentoProposta??null,status:String(p.situacaoCompraNome??'Não informado'),url:`${PNCP}/app/editais/${cnpj}/${year}/${sequence}`};
}
export function activeResults(rows=[]){return rows.filter(r=>!r.dataCancelamento&&r.situacaoCompraItemResultadoId===1&&r.tipoPessoa==='PJ'&&/^\d{14}$/.test(String(r.niFornecedor))&&Number.isFinite(r.valorUnitarioHomologado)&&r.valorUnitarioHomologado>0&&/^\d{4}-\d{2}-\d{2}/.test(String(r.dataResultado))).sort((a,b)=>String(b.dataResultado).localeCompare(String(a.dataResultado)));}
export function awardedRecord(p,item,results){
 const r=activeResults(results)[0];if(!r||!item.temResultado||normalize(item.situacaoCompraItemNome)!=='homologado')return null;
 return {purchase_id:p.id,item:Number(item.numeroItem),description:String(item.descricao),unit:String(item.unidadeMedida??'Não informada'),quantity:r.quantidadeHomologada,unit_price:r.valorUnitarioHomologado,total:r.valorTotalHomologado,supplier:String(r.nomeRazaoSocialFornecedor),supplier_id:String(r.niFornecedor),date:r.dataResultado,status:'Homologado · resultado informado',city:p.city,source:`${PNCP}/api/pncp/v1/orgaos/${p.cnpj}/compras/${p.year}/${p.sequence}/itens/${item.numeroItem}/resultados`,url:p.url};
}
export function correlate(records,query){
 const words=normalize(query).split(/\W+/).filter(w=>w.length>2);
 if(!words.length)return records;
 return records.map(r=>({row:r,score:words.filter(w=>normalize(r.description??r.object).includes(w)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.row);
}
export function latestInSample(rows){return [...rows].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]??null;}
export async function getJson(url,{signal}={}){
 const u=new URL(url);if(u.origin!==PNCP||!u.pathname.startsWith('/api/'))throw Error('Fonte não permitida');
 const response=await fetch(u,{signal:signal??AbortSignal.timeout(18000),headers:{Accept:'application/json'}});
 if(!response.ok)throw Error(`PNCP respondeu ${response.status}`);
 return response.json();
}
export async function fetchPublications({start,end,page=1,signal}={}){
 if(!/^\d{8}$/.test(start??'')||!/^\d{8}$/.test(end??'')||!Number.isInteger(page)||page<1||page>6)throw Error('Período ou página inválida');
 const url=`${PNCP}/api/consulta/v1/contratacoes/publicacao?dataInicial=${start}&dataFinal=${end}&codigoModalidadeContratacao=6&uf=CE&pagina=${page}&tamanhoPagina=50`;
 const data=await getJson(url,{signal});
 return {purchases:(data.data??[]).filter(relevantPurchase).map(purchaseRecord).filter(Boolean),scanned:(data.data??[]).length,total:Number(data.totalRegistros??0),source:url};
}
