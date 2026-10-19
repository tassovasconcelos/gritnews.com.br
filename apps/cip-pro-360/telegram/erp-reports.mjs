import {buildERPReport,formatMoney} from '../erp-engine.mjs';
import {COMPANY_NAMES} from './conversation.mjs';
export const ERP_KINDS=['sales_mtd','inventory','aged_stock','no_sales_stock','growth_actions'];
const money=formatMoney;
export function financialIntent(text){const q=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(/conhecimento|orientacao|material|documento/.test(q))return null;
 if(/^\/vendas\b/.test(q))return 'sales_mtd';if(/^\/estoque\b/.test(q))return 'inventory';if(/^\/parados\b/.test(q))return 'aged_stock';if(/^\/semvendas\b/.test(q))return 'no_sales_stock';if(/^\/giro\b/.test(q))return 'growth_actions';
 if(/giro|marca.?passo|vender mais|aumentar.*vendas|vender.*rapido/.test(q))return 'growth_actions';
 if(/estoque|produto|mercadoria/.test(q)&&/sem venda|sem vender|ultima venda/.test(q))return 'no_sales_stock';
 if(/estoque|produto|mercadoria/.test(q)&&/180|envelhecid|antig/.test(q))return /custo|quanto.*valor|valor.*total/.test(q)?'inventory':'aged_stock';
 if(/estoque/.test(q))return 'inventory';
 if(/vendas?|faturamento|receita/.test(q)&&!/ontem|semana|mes passado|ano passado|\d{2}\/\d{2}/.test(q))return 'sales_mtd';return null;
}
export function renderERP(snapshot,kind,now=new Date()){
 const r=buildERPReport(snapshot,kind,now);if(!r.available)return r.reason+' No CIP, abra Procfit & relatórios para importar e conferir os dados. Nenhum saldo ausente será tratado como zero.';
 const p=r.provenance,title=COMPANY_NAMES[p.company],lines=[`Doquita · ${title}`,`Fonte: importação manual aprovada · ${p.source}`,`Atualização: ${new Date(p.captured_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília)`,`Escopo: ${r.full_company?'empresa completa declarada':'PARCIAL — lojas selecionadas'} · lojas ${p.stores.join(', ')}`];
 if(p.stale)lines.push('ATENÇÃO: base com mais de 36 horas.');
 if(kind==='sales_mtd'){lines.push('',r.sales_mtd.available?`Venda líquida de ${r.sales_mtd.from} a ${r.sales_mtd.through}: ${money(r.sales_mtd.total)}${r.sales_mtd.complete_company?'':' (PARCIAL: escopo informado).'}`:'Cobertura insuficiente para informar o mês atual completo. Confira as datas e a exportação de vendas.');}
 else{
  lines.push('',`Custo do estoque ${p.inventory_basis==='available'?'disponível':'físico'}: ${money(r.inventory.total)}${r.inventory.complete?'':' (cobertura incompleta).'}`,r.aging.available?`Saldo com entrada original acima de 180 dias: ${money(r.aging.total)}`:`Idade >180 dias não comprovada para todo o saldo. Linhas sem entrada por lote: ${r.aging.unknown_rows}. Valor antigo confirmado apenas nos lotes conhecidos: ${money(r.aging.known_aged_total)}.`);
  if(kind!=='inventory'){lines.push('',`Primeiras ${Math.min(5,r.top.length)} de ${r.page.total} linhas SKU/loja deste filtro:`);for(const x of r.top.slice(0,5))lines.push(`${x.sku} · ${x.description.slice(0,100)} · loja ${x.store_id}\nSaldo: ${x.quantity} ${x.unit} · valor: ${money(x.value)}\n>180 dias por entrada: ${x.old_quantity} ${x.unit} · ${money(x.old_value)}${x.unknown_age?' (idade parcialmente desconhecida)':''}${kind==='no_sales_stock'?' · última venda: '+(x.last_sale_date??'nenhuma positiva na janela coberta'):''}`);if(!r.top.length)lines.push('Nenhum item confirmado neste filtro; ausência de comprovação não significa estoque zerado.');}
  if(kind==='growth_actions')lines.push('',...r.actions.map(a=>a.title+': '+a.detail));
 }
 lines.push('','Estoque antigo e ausência de vendas são critérios distintos. Confira a lista paginada e registre propostas no CIP: https://cip.gritnews.com.br/');return lines.join('\n');
}
