import {formatMoney} from '../erp-engine.mjs';
const normalized=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const cents=v=>{if(!/^\d+(?:\.\d{1,2})?$/.test(String(v)))throw Error('invalid_reference_amount');const [a,b='']=String(v).split('.');return BigInt(a)*100n+BigInt(b.padEnd(2,'0'));};
const amount=n=>n/100n+'.'+(n%100n).toString().padStart(2,'0');
export const REFERENCE_KINDS=['stock_sources','stock_cd','stock_stores','stock_product','stock_quality','stock_priorities','stock_units'];
export function referenceIntent(text){
 const q=normalized(text);let kind=null,query='';
 if(/^\/produto\b/.test(q)){kind='stock_product';query=text.replace(/^\/produto\s*/i,'');}
 else if(/\bsku\s+([a-z0-9_-]+)/i.test(text)){kind='stock_product';query=text.match(/\bsku\s+([a-z0-9_-]+)/i)[1];}
 else if(/^\/bases\b/.test(q))kind='stock_sources';
 else if(/\bcd\s*(?:100)?\b/.test(q)&&/\b(lojas|filiais)\b/.test(q)&&/estoque|custo|saldo|unific|consolid|total|junt/.test(q))kind='stock_sources';
 else if(/^\/cd\b/.test(q)||/\b(estoque|custo|saldo|produtos?)\b.*\bcd\s*100?\b|\bcd\s*100?\b.*\b(estoque|custo|saldo|produtos?)\b/.test(q)||/\b(estoque|custo|saldo)\b.*\bcd\b/.test(q))kind='stock_cd';
 else if(/^\/lojas\b/.test(q)||/\b(estoque|custo|saldo)\b.*\b(lojas|filiais|filial|loja)\b/.test(q))kind='stock_stores';
 else if(/^\/conferencia\b/.test(q)||/custo.*(zero|divergen)|divergen.*custo/.test(q))kind='stock_quality';
 else if(/^\/prioridades\b/.test(q))kind='stock_priorities';
 else if(/^\/unidades\b/.test(q))kind='stock_units';
 if(!kind)return null;
 const store=q.match(/\b(?:loja|filial|unidade)\s*(\d{1,8})\b/)?.[1]??'';
 if(kind==='stock_product')query=query.replace(/\b(?:no|do)?\s*cd\s*(?:100)?\b/ig,'').replace(/\b(?:loja|filial|unidade)\s*\d{1,8}\b/ig,'').trim().slice(0,200);
 return {kind,query,store};
}
export function referenceArgs(intent,text=''){
 const q=normalized(text),store=intent.store??q.match(/\b(?:loja|filial|unidade)\s*(\d{1,8})\b/)?.[1]??'';
 return {p_scope:intent.kind==='stock_cd'||intent.kind==='stock_product'&&/\bcd\s*(?:100)?\b/.test(q)?'cd100_partial':intent.kind==='stock_stores'?'stores_only_partial':'both',p_query:typeof intent.query==='string'?intent.query.slice(0,200):'',p_store:store,p_kind:({stock_product:'product',stock_quality:'quality',stock_priorities:'priorities',stock_units:'units'})[intent.kind]??'summary',p_offset:Number.isSafeInteger(intent.offset)&&intent.offset>=0?intent.offset:0};
}
export function renderReference(data){
 if(!data?.available)return data?.reason??'Nenhuma carga de referência disponível nesta empresa.';
 const sources=data.sources;
 if(!sources?.length||sources.some(s=>!['cd100_partial','stores_only_partial'].includes(s.scope)||s.status&&s.status!=='reference_unreconciled')||new Set(sources.map(s=>s.scope)).size!==sources.length)throw Error('invalid_reference_sources');
 const cost=sources.reduce((n,s)=>n+cents(s.summary.cost),0n),rows=sources.reduce((n,s)=>n+Number(s.summary.rows),0);
 const lines=[`Custo declarado nas referências consultadas: ${formatMoney(amount(cost))}.`, 'Shopping Prohospital · PARCIAL · NÃO CONCILIADO.', 'É a soma dos arquivos filtrados, com datas distintas ou ausentes; não é o estoque total da empresa nem uma posição na mesma data.'];
 if(!rows)lines[0]='Nenhuma linha encontrada neste filtro; não significa estoque zerado na empresa.';
 if(data.query)lines.push('Busca: '+data.query);if(data.store)lines.push('Filtro: unidade '+data.store);
 lines.push('','Composição e memória de cálculo');
 for(const s of sources){const cd=s.scope==='cd100_partial',a=s.summary;lines.push(`${cd?'CD 100':'Lojas · recorte da origem +180 dias'}: ${formatMoney(a.cost)} · ${a.rows} linhas · ${a.skus} SKUs.`, `Fonte: ${s.source} · lote ${s.hash?.slice(0,12)??'não informado'}.`,`Data do saldo: ${s.reference_date?'deduzida '+s.reference_date+'; pendente de confirmação':'não informada'}`,`Importação: ${new Date(s.loaded_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília); não é data de saldo.`,`Conferência: ${a.cost_review} divergências de custo · ${a.zero_cost} custos unitários zero.`);
  if(cd)lines.push('CD sem preço de venda, data de saldo ou histórico: giro/idade/receita indisponíveis.');else lines.push('Indicador da origem: evento mais recente entre venda e entrada; não comprova idade original por lote.');
 }
 lines.push(`Cálculo: ${sources.map(s=>formatMoney(s.summary.cost)).join(' + ')} = ${formatMoney(amount(cost))}. Soma do custo total declarado em ${rows} linhas do filtro, não somente das linhas exibidas. Custos divergentes são preservados e destacados, sem correção presumida.`);
 if(data.kind==='units'){
  lines.push('','Estratificação por unidade');
  for(const s of sources)for(const u of s.units)lines.push(`${u.store_code==='100'?'CD 100':'Loja '+u.store_code}: ${formatMoney(u.cost)} · ${u.rows} linhas`);
 }else{
  const items=sources.flatMap(s=>s.items.map(x=>({...x,scope:s.scope}))).sort((a,b)=>cents(a.declared_cost)>cents(b.declared_cost)?-1:cents(a.declared_cost)<cents(b.declared_cost)?1:0).slice(0,5);
  if(items.length)lines.push('','Maiores linhas por custo entre as fontes do filtro');
  for(const x of items){lines.push(`${x.sku} · ${x.description.slice(0,90)} · ${x.scope==='cd100_partial'?'CD 100':'loja '+x.store_code}: ${formatMoney(x.declared_cost)}${x.cost_review?' · CONFERIR DIVERGÊNCIA':''}${Number(x.unit_cost)===0?' · CUSTO ZERO':''}.`);if(data.kind==='product')lines.push(`Saldo: ${x.quantity} (unidade de fornecimento ausente) · custo unitário ${Number(x.unit_cost).toLocaleString('pt-BR',{maximumFractionDigits:6})} · preço ${x.sale_price===null?'ausente':Number(x.sale_price).toLocaleString('pt-BR',{maximumFractionDigits:6})}.`);}
  lines.push(`Exibidas ${items.length} de ${rows} linhas; lista completa e CSV no painel. Não some SKUs entre fontes sem deduplicar nem quantidades com embalagem desconhecida.`);
 }
 const pending=sources.reduce((n,s)=>n+Number(s.summary.cost_review)+Number(s.summary.zero_cost),0);
 lines.push('','Próxima ação: '+(pending?'Cifra e Giro devem conferir as pendências de custo antes de priorizar preço ou transferência.':'Giro deve validar saldo, unidade, reserva e demanda dos maiores itens; Prisma confere despesas e contribuição antes do preço.')+' Elo registra oportunidade, responsável e próximo contato após a validação. Ranking de custo não autoriza transferência ou desconto.');
 lines.push('Não há vendas do mês, lucro, margem realizada ou giro comprovado nestas planilhas. Nenhum preço ou saldo foi alterado.','Detalhes: https://cip.gritnews.com.br/ → Estoque Inteligente.');return lines.join('\n');
}
