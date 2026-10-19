import {buildERPReport,formatMoney} from '../erp-engine.mjs';
import {COMPANY_NAMES} from './conversation.mjs';
import {renderReference} from './stock-reference.mjs';
import {buildPriceQueue} from '../pricing-engine.mjs';

export const cents=value=>{
 if(!/^-?\d+(?:\.\d{1,2})?$/.test(String(value)))throw Error('invalid_report_amount');
 const negative=String(value).startsWith('-'),[whole,frac='']=String(value).replace(/^-/,'').split('.');
 return (negative?-1n:1n)*(BigInt(whole)*100n+BigInt(frac.padEnd(2,'0')));
};
export const amount=value=>(value<0n?'-':'')+(value<0n?-value:value)/100n+'.'+((value<0n?-value:value)%100n).toString().padStart(2,'0');
const total=values=>amount(values.reduce((n,v)=>n+cents(v),0n));

// Inputs must come from the existing binding-authorized RPCs, never model output.
export function renderExecutive(entries,kind,now=new Date()){
 if(!entries.length||new Set(entries.map(e=>e.company)).size!==entries.length)throw Error('invalid_report_scope');
 for(const e of entries){
  if(!Object.hasOwn(COMPANY_NAMES,e.company)||e.company==='all'||e.snapshot&&(e.snapshot.company_id!==e.company||e.snapshot.status!=='approved'))throw Error('invalid_report_scope');
  if(e.reference?.available&&e.reference.company!==e.company)throw Error('invalid_report_scope');
 }
 const reports=entries.filter(e=>e.snapshot).map(e=>({company:e.company,r:buildERPReport(e.snapshot,kind,now)}));
 const refs=entries.filter(e=>!e.snapshot&&e.reference?.available);
 const missing=entries.filter(e=>!e.snapshot&&!e.reference?.available);
 const lines=[];
 if(reports.length){
  const sales=kind==='sales_mtd',aged=kind==='aged_stock',noSales=kind==='no_sales_stock';
  const label=sales?'Venda líquida do mês':aged?'Estoque acima de 180 dias por lote':noSales?'Estoque com ausência de vendas comprovada':'Custo do estoque';
  const metrics=reports.map(({company,r})=>({company,r,value:sales?(r.sales_mtd.available?r.sales_mtd.total:null):aged?r.aging.total:noSales?(r.page.total?total(r.top.map(x=>x.value)):null):r.inventory.total}));
  // A five/twenty-row ranking cannot serve as a complete no-sales monetary total.
  if(noSales)for(const m of metrics)m.value=null;
  const compatible=metrics.every(m=>m.value!==null)&&new Set(metrics.map(({r})=>sales?r.sales_mtd.from+'|'+r.sales_mtd.through:r.provenance.captured_at+'|'+r.provenance.inventory_basis)).size===1;
  const complete=metrics.length===entries.length&&metrics.every(({r})=>r.full_company&&(sales?r.sales_mtd.complete_company:aged?r.aging.available:r.inventory.complete));
  if(compatible)lines.push(`${label}: ${formatMoney(total(metrics.map(m=>m.value)))} · ${complete?'cobertura declarada completa':'PARCIAL — somente bases disponíveis'}.`);
  else lines.push(`${label}: total unificado indisponível; ${noSales?'o ranking não comprova o valor de todo o filtro':'há datas, critérios ou cobertura incompatíveis'}.`);
  lines.push('','Composição e memória de cálculo');
  for(const {company,r,value} of metrics){
   const p=r.provenance;
   lines.push(`${COMPANY_NAMES[company]}: ${formatMoney(value)}${r.full_company?'':' · recorte de unidades'}.`);
   lines.push(`Fonte: ${p.source} · captura ${new Date(p.captured_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília) · importação aprovada · ${p.inventory_basis==='available'?'saldo disponível':'saldo físico'}.`);
   if(sales)lines.push(`Período: ${r.sales_mtd.from} a ${r.sales_mtd.through}; soma da receita líquida importada, sem nova dedução de devoluções.`);
   else lines.push(`Unidades: ${p.stores.join(', ')}. Cálculo: soma dos valores de custo das linhas${aged?' com entrada original do lote há mais de 180 dias':''}.`);
   if(p.stale)lines.push('Base com mais de 36 horas; não representa posição em tempo real.');
   if(!sales&&!r.aging.available)lines.push(`Idade do saldo não comprovada em ${r.aging.unknown_rows} linhas; não inferir pelo último movimento.`);
   if(!sales){
    const items=r.top.slice(0,3);
    if(items.length)lines.push('Maiores linhas do filtro, por custo:');
    for(const x of items)lines.push(`${x.sku} · ${x.description.slice(0,70)} · unidade ${x.store_id}: ${formatMoney(aged?x.old_value:x.value)}.`);
    lines.push(`Exibidas ${items.length} de ${r.page.total} linhas SKU/unidade; detalhe completo no painel.`);
   }
  }
  if(compatible&&metrics.length>1)lines.push('Soma: '+metrics.map(m=>formatMoney(m.value)).join(' + ')+' = '+formatMoney(total(metrics.map(m=>m.value)))+'.');
  if(kind==='growth_actions'){
   lines.push('','Marca passo e giro · pontos para decisão');
   for(const e of entries.filter(e=>e.snapshot))for(const x of buildPriceQueue(e.snapshot,now).items.slice(0,3))lines.push(`${COMPANY_NAMES[e.company]} · ${x.sku} · unidade ${x.store_id}: ${x.reasons.join('; ')||'validar contribuição e demanda'}${x.coverage_days!==null?' · cobertura observada '+x.coverage_days.toFixed(1)+' dias':''}.`);
  }
  if(refs.length)lines.push('','Referências adicionais abaixo não entram na soma conciliada.');
 }
 if(!reports.length&&refs.length&&kind==='aged_stock')lines.push('Valor do saldo acima de 180 dias por lote: não comprovado. A referência das lojas abaixo usa outro critério de movimento.','');
 for(const e of refs)lines.push(renderReference(e.reference));
 if(missing.length)lines.push('',...missing.map(e=>`${COMPANY_NAMES[e.company]}: sem base adequada para esta consulta; não foi considerada como zero.`));
 if(!reports.length&&!refs.length)lines.unshift('Não há informação validada para calcular este indicador.');
 if(reports.length)lines.push('','Próxima ação: '+(kind==='sales_mtd'?'conferir a conversão das cotações e a contribuição por item no mesmo período.':'Giro e Cifra devem conferir os maiores saldos; Prisma valida despesas e contribuição antes de qualquer preço. Registrar responsável e resultado no CIP.'),'Detalhes: https://cip.gritnews.com.br/');
 return lines.join('\n');
}
