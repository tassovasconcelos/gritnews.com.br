import {renderExecutive} from './executive-reports.mjs';
import {buildERPReport,formatMoney} from '../erp-engine.mjs';
import {REFERENCE_KINDS,referenceArgs} from './stock-reference.mjs';
import {ERP_KINDS} from './erp-reports.mjs';
import {COMPANY_NAMES} from './conversation.mjs';
export const REPORT_KINDS=[...REFERENCE_KINDS,...ERP_KINDS];
const date=x=>x?String(x).slice(0,10).split('-').reverse().join('/'):'data do saldo não informada';
export function resultMenu(detailed=false){return {inline_keyboard:[[{text:detailed?'Ver resumo da última consulta':'Detalhar última consulta',callback_data:detailed?'report_summary':'report_details'}],[{text:'Abrir CIP',url:'https://cip.gritnews.com.br/'},{text:'Menu',callback_data:'help'}]]};}
export function navigationMenu(){return {inline_keyboard:[[{text:'Nova consulta',callback_data:'help'},{text:'Trocar empresa',callback_data:'companies'}]]};}
export function rememberReport(intent,text=''){
 const a=referenceArgs(intent,text);return JSON.stringify({query:a.p_query,store:a.p_store,scope:a.p_scope});
}
export function restoreReport(context){
 if(!REPORT_KINDS.includes(context?.last_kind))return null;
 let data;try{data=JSON.parse(context.last_query??'{}');}catch{return null;}
 if(!data||typeof data!=='object'||typeof data.query!=='string'||data.query.length>200||typeof data.store!=='string'||!/^\d{0,8}$/.test(data.store)||!['both','cd100_partial','stores_only_partial'].includes(data.scope))return null;
 return {intent:{kind:context.last_kind,query:data.query,store:data.store},text:data.scope==='cd100_partial'?'CD 100':data.scope==='stores_only_partial'?'lojas':''};
}
export function renderBrief(entries,kind,now=new Date()){
 // Preserve full renderer validation and its exact approved consolidation rules.
 const full=renderExecutive(entries,kind,now),lines=[];
 const reports=entries.filter(e=>e.snapshot),refs=entries.filter(e=>!e.snapshot&&e.reference?.available);
 if(reports.length){
  lines.push(full.split('\n')[0]);
  for(const e of reports){const r=buildERPReport(e.snapshot,kind,now),p=r.provenance;
   const v=kind==='sales_mtd'?(r.sales_mtd.available?r.sales_mtd.total:null):kind==='aged_stock'?r.aging.total:kind==='no_sales_stock'?null:r.inventory.total;
   lines.push(`${COMPANY_NAMES[e.company]}: ${v===null?'indicador sem total comprovado':formatMoney(v)} · ${date(p.captured_at)}${r.full_company?'':' · parcial'}${p.stale?' · base antiga':''}.`);
  }
  if(refs.length)lines.push('Referências abaixo não entram no total conciliado.');
 }
 for(const e of refs){const d=e.reference;
  if(d.source_kind==='shopping_position'){
   const s=d.summary;
   lines.push(s.rows?`Estoque valorizado no filtro: ${formatMoney(s.declared_cost)}.`:'Nenhum item encontrado no filtro; não significa estoque zero.');
   lines.push(`Shopping Prohospital · ${date(d.batch.as_of)} · ${d.scope==='cd'?'CD100':d.scope==='stores'?'lojas':'lojas + CD100'}${d.store?' · unidade '+d.store:''}${d.query?' · '+d.query:''}. Referência não conciliada.`);
   if(kind==='aged_stock'||kind==='no_sales_stock')lines.push('⚠ Idade dos lotes e ausência de vendas atuais não comprovadas.');
   else lines.push(`⚠ Campo de última venda desatualizado (${d.batch.summary.last_sale_max||'sem data'}); não comprova giro atual.`);
   if(kind==='stock_priorities'||kind==='growth_actions')lines.push(`Prioridades: ${d.alerts.protect_stock||0} alertas de disponibilidade; ${d.alerts.below_cost||0} preços abaixo do custo. Exigem conferência.`);
   if(kind==='stock_quality')lines.push(`Conferência: ${d.alerts.cost_review||0} pendências de custo/dados; ${d.alerts.stock_rules||0} parâmetros de estoque inconsistentes.`);
   if(kind==='stock_product')for(const x of d.items.slice(0,2))lines.push(`${x.sku} · ${x.description.slice(0,60)} · unidade ${x.store_code}: ${x.quantity} ${x.unit||'(unidade ausente)'}; preço ${formatMoney(x.sale_price)}.`);
   if(kind==='stock_units')lines.push('Distribuição por unidade disponível em Detalhar última consulta.');
  }else if(d.source_kind==='inventory_intelligence'){
   lines.push(d.filtered_total?`Estoque B2B no filtro: ${formatMoney(d.filtered_cost)} a custo médio declarado.`:'Nenhum lote encontrado; não significa estoque zero.');
   lines.push(`Distribuidora Prohospital · ${date(d.batch.as_of)} · C.Estoque 1000 (separado do CD100 Shopping). Referência não conciliada.`);
   const a=d.batch.summary.alerts;
   lines.push(`⚠ ${a.vencido||0} lotes vencidos e ${a.validade_90d||0} com validade em até 90 dias na base completa. Sem vendas/preços confirmados para calcular giro ou margem.`);
   if(kind==='stock_product')for(const x of d.items.slice(0,2))lines.push(`${x.sku} · ${x.description.slice(0,60)} · validade ${x.expiry||'não informada'} · custo ${formatMoney(x.declared_cost)}.`);
  }else{
   const detail=renderExecutive([e],kind,now);lines.push(detail.split('\n')[0]);
   lines.push('Shopping Prohospital · referência PARCIAL, não conciliada; datas distintas ou ausentes. Não é o estoque total da empresa.');
   if(kind==='stock_quality')lines.push('Conferência: '+d.sources.map(s=>`${s.scope==='cd100_partial'?'CD100':'Lojas'}: ${s.summary.cost_review} divergências e ${s.summary.zero_cost} custos zero`).join('; ')+'.');
   if(kind==='aged_stock'||kind==='no_sales_stock')lines.push('⚠ Não comprova idade dos lotes ou ausência de vendas atuais.');
  }
 }
 for(const e of entries.filter(e=>!e.snapshot&&!e.reference?.available))lines.push(`${COMPANY_NAMES[e.company]}: sem base adequada; não considerada como zero.`);
 if(!reports.length&&!refs.length)lines.unshift('Não há informação validada para calcular este indicador.');
 if(kind==='stock_quality')lines.push('Próximo passo: conferir pendências de custo e cadastro no CIP.');
 else if(kind==='stock_priorities'||kind==='growth_actions')lines.push('Próximo passo: revisar prioridades no CIP antes de aprovar preço, campanha ou transferência.');
 return lines.join('\n\n');
}
