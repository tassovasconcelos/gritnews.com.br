export const landedCost=o=>Number(o.quantity)*Number(o.unit_price)/Number(o.unit_factor)+Number(o.freight||0)+Number(o.extra_tax||0)-Number(o.discount_total||0);
export function supplierCoverage(offers,lines){
 const coverage=new Map();
 for(const offer of offers){
  const line=lines.find(l=>l.product_id===offer.product_id);
  if(offer.status!=='received'||!offer.technical_compliant||!line||Number(line.quantity)!==Number(offer.quantity))continue;
  if(!coverage.has(offer.supplier_id))coverage.set(offer.supplier_id,new Set());
  coverage.get(offer.supplier_id).add(offer.product_id);
 }
 return new Map([...coverage].map(([id,products])=>[id,products.size]));
}
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function dossierHtml(batch){
 const s=batch.formalization_snapshot;
 if(!s)throw new Error('Formalize a cotação antes de gerar o dossiê.');
 const rows=(s.offers||[]).map(o=>`<tr><td>${escape(o.supplier_name||o.supplier_id)}</td><td>${escape(o.product_name||o.product_id)}</td><td>${escape(o.quantity)}</td><td>${escape(o.unit_price)}</td><td>${escape(o.unit_factor)}</td><td>${landedCost(o).toFixed(2)}</td><td>${escape(o.delivery_days)} / ${escape(o.payment_days)}</td><td>${escape(o.notes)}</td><td>${o.technical_compliant?'Conforme':'Não conforme'}</td></tr>`).join('');
 return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Proconsumo — Dossiê de cotação</title><style>body{font:14px Arial;max-width:1200px;margin:40px auto;color:#24313d}h1{color:#aa2030}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ddd;padding:8px;text-align:left}p{white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:10px}}</style><h1>Proconsumo · Dossiê de cotação</h1><h2>${escape(s.title)}</h2><p>Campanha: ${escape(s.batch_id)}\nOperação: ${escape(s.company_name||s.company_id)}\nFormalizado em: ${escape(s.formalized_at)}\nResponsável: ${escape(s.formalized_by)}</p><h3>Critérios e justificativa</h3><p>${escape(s.criteria)}</p><h3>Propostas equalizadas · valores em BRL</h3><table><thead><tr><th>Fornecedor</th><th>Material</th><th>Qtd. base</th><th>Preço embalagem</th><th>Fator</th><th>Custo posto</th><th>Entrega / pagamento (dias)</th><th>Referência / observações</th><th>Técnica</th></tr></thead><tbody>${rows}</tbody></table><p>Registro imutável das propostas e critérios. O dossiê não substitui a aprovação financeira do pedido de compra. Desconto, frete e imposto adicional estão incluídos no custo posto.</p></html>`;
}
