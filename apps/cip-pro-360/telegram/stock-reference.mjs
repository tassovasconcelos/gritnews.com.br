import {formatMoney} from '../erp-engine.mjs';
const normalized=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const REFERENCE_KINDS=['stock_sources','stock_cd','stock_stores','stock_product','stock_quality','stock_priorities','stock_units'];
export function referenceIntent(text){
 const q=normalized(text);let kind=null,query='';
 if(/^\/produto\b/.test(q)){kind='stock_product';query=text.replace(/^\/produto\s*/i,'');}
 else if(/\bsku\s+([a-z0-9_-]+)/i.test(text)){kind='stock_product';query=text.match(/\bsku\s+([a-z0-9_-]+)/i)[1];}
 else if(/^\/bases\b/.test(q))kind='stock_sources';
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
 const lines=['Doquita · Shopping Prohospital','ESTOQUE DE REFERÊNCIA · NÃO CONCILIADO','Fontes separadas; não representam inventário completo da empresa.'];
 if(data.query)lines.push('Busca: '+data.query);if(data.store)lines.push('Filtro: unidade '+data.store);
 for(const s of data.sources){const cd=s.scope==='cd100_partial',a=s.summary;lines.push('',cd?'CD 100 · saldo do arquivo':'Lojas · recorte da origem +180 dias',`Fonte: ${s.source}`,`Data do saldo: ${s.reference_date?'deduzida '+s.reference_date+'; pendente de confirmação':'não informada'}`,`Importação: ${new Date(s.loaded_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília); não comprova saldo atualizado.`,`Filtro: ${a.rows} linhas · ${a.skus} SKUs · ${a.stores} códigos de unidade`,`Custo declarado no filtro: ${formatMoney(a.cost)}`,`Conferência: ${a.cost_review} divergências de custo · ${a.zero_cost} custos unitários zero.`);
  if(cd)lines.push('CD sem preço de venda, data de saldo ou histórico: giro/idade/receita indisponíveis.');else lines.push('Indicador da origem usa o evento mais recente entre venda e entrada; não comprova idade original por lote nem histórico completo de vendas.');
  if(data.kind==='units'||data.kind==='summary')for(const u of s.units)lines.push(`${u.store_code==='100'?'CD 100':'Loja '+u.store_code}: ${formatMoney(u.cost)} · ${u.rows} linhas`);
  if(['product','priorities','quality'].includes(data.kind)){for(const x of s.items)lines.push(`${x.sku} · ${x.description} · unidade ${x.store_code}\nSaldo: ${x.quantity} (unidade de fornecimento ausente) · custo total ${formatMoney(x.declared_cost)}\nCusto unitário ${Number(x.unit_cost).toLocaleString('pt-BR',{maximumFractionDigits:6})} · preço ${x.sale_price===null?'ausente':Number(x.sale_price).toLocaleString('pt-BR',{maximumFractionDigits:6})}${x.cost_review?' · CONFERIR DIVERGÊNCIA':''}${Number(x.unit_cost)===0?' · CUSTO ZERO':''}`);if(!s.items.length)lines.push('Nenhuma linha encontrada neste filtro.');else lines.push(`Linhas ${s.offset+1}–${s.offset+s.items.length} de ${a.rows} por valor de custo.${s.has_more?' Lista completa no painel.':''}`);}
 }
 if(data.kind==='priorities')lines.push('','Pauta dos agentes: Giro confere saldo, unidade, reserva e demanda; Prisma/Cifra validam custo e despesas antes do preço; Elo prepara oportunidades após conferir equivalência; Sofia mede resultados após receber vendas. Ranking de custo não autoriza transferência ou desconto.');
 lines.push('','Não some quantidades entre produtos. Não há vendas do mês, lucro, margem realizada ou giro comprovado nestas planilhas. Nenhum preço ou saldo foi alterado.','Detalhes e CSV: https://cip.gritnews.com.br/ → Estoque Inteligente.');return lines.join('\n');
}
