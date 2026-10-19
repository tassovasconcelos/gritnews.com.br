import {brazilDay,day} from './erp-engine.mjs';
const DAY=86400000;
const elapsed=(a,b)=>Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/DAY);
const number=(v,name,min=0,max=1e12)=>{if(v===null||v===undefined||String(v).trim()===''||!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)throw Error('Confira '+name+'.');return Number(v);};
const ceilMoney=v=>Math.ceil((v-1e-9)*100)/100;
// Simulation only; no write, discount execution, inferred elasticity or forecast.
export function simulatePrice(input,now=new Date()){
 const cost=number(input.cost,'custo',0.00000001),price=number(input.price,'preço atual',0.01),expenses=number(input.expense_pct,'despesas percentuais',0,99),fixed=number(input.fixed_cost,'despesas fixas por unidade'),minimum=number(input.minimum_margin_pct,'contribuição mínima',0,99),target=number(input.target_margin_pct,'contribuição alvo',0,99),maxChange=number(input.max_change_pct,'variação máxima',0,100),candidate=number(input.candidate,'preço em avaliação',0.01),units=number(input.units,'quantidade do cenário',0.0001);
 if(minimum>target||expenses+target>=100)throw Error('Contribuição alvo deve ser maior ou igual à mínima; despesas + alvo precisam ser inferiores a 100%.');
 const unitCost=cost+fixed,floor=ceilMoney(unitCost/(1-(expenses+minimum)/100)),targetPrice=ceilMoney(unitCost/(1-(expenses+target)/100));
 const contribution=p=>p*(1-expenses/100)-unitCost,current=contribution(price),next=contribution(candidate),change=(candidate/price-1)*100;
 const blockers=[];if(candidate<floor)blockers.push('Preço abaixo do piso de contribuição mínima.');if(Math.abs(change)>maxChange+1e-8)blockers.push('Variação supera a alçada simulada.');
 let reference=null;
 if(input.reference_price!==undefined&&String(input.reference_price).trim()!==''){
  const ref=number(input.reference_price,'preço de referência',0.01),date=day(input.reference_date),age=date?elapsed(brazilDay(now),date):null;
  if(!date||age<0||age>7||input.equivalent!==true||typeof input.reference_source!=='string'||!input.reference_source.trim())blockers.push('Referência exige fonte, equivalência de produto/unidade e coleta de até 7 dias.');
  else reference={price:ref,gap_pct:(candidate/ref-1)*100,date,source:input.reference_source.trim().slice(0,300)};
 }
 return {simulation:true,floor,target_price:targetPrice,current_contribution:current,candidate_contribution:next,candidate_margin_pct:next/candidate*100,change_pct:change,discount_capacity_pct:Math.max(0,(1-floor/price)*100),scenario_revenue:candidate*units,scenario_contribution:next*units,baseline_contribution:current*units,extra_units_pct:current>0&&next>0?Math.max(0,(current/next-1)*100):null,blockers,reference,status:blockers.length?'bloqueado':'revisao_humana',notice:'Cenário com quantidade informada; não prevê aumento de demanda. Alçadas e despesas devem ser confirmadas pelo responsável. Nenhum preço será aplicado.'};
}
export function buildPriceQueue(snapshot,now=new Date(),offset=0){
 if(!snapshot)return {available:false,reason:'Aguardando a primeira base Procfit conferida e aprovada.'};
 const {data:d,metadata:m}=snapshot.payload,asof=brazilDay(snapshot.captured_at),stale=now.getTime()-Date.parse(snapshot.captured_at)>36*3600000;
 const products=new Map(d.products.map(p=>[p.sku,p])),prices=new Map(d.prices.map(p=>[p.store_id+'|'+p.sku,Number(p.current_price)])),groups=new Map(),sales=new Map();
 const demandComplete=m.sales_complete&&elapsed(asof,m.sales_from)>=89&&m.sales_through>=asof;
 for(const r of d.sales){const key=r.store_id+'|'+r.sku;let g=sales.get(key);if(!g){g={units:0,revenue:0,last:null};sales.set(key,g);}if(elapsed(asof,r.sale_date)<90){g.units+=Number(r.quantity);g.revenue+=Number(r.net_revenue);}if(Number(r.quantity)>0&&(!g.last||r.sale_date>g.last))g.last=r.sale_date;}
 for(const r of d.inventory){if(Number(r.quantity)<=0)continue;const key=r.store_id+'|'+r.sku;let g=groups.get(key);if(!g){g={sku:r.sku,store_id:r.store_id,description:products.get(r.sku)?.description??r.sku,unit:products.get(r.sku)?.unit,quantity:0,value:0,old_value:0,unknown_age:false,last:null};groups.set(key,g);}g.quantity+=Number(r.quantity);g.value+=Number(r.stock_value);if(!r.received_date)g.unknown_age=true;else if(elapsed(asof,r.received_date)>180)g.old_value+=Number(r.stock_value);if(m.last_sale_verified&&r.last_sale_date&&(!g.last||r.last_sale_date>g.last))g.last=r.last_sale_date;}
 const all=[...groups.entries()].map(([key,g])=>{const s=sales.get(key),recent=s?.last&&elapsed(asof,s.last)<=180;const last=s?.last&&(!g.last||s.last>g.last)?s.last:g.last;const history180=m.sales_complete&&elapsed(asof,m.sales_from)>=180&&m.sales_through>=asof;
  const noSales=recent?false:last?elapsed(asof,last)>180?history180||m.last_sale_verified?true:null:false:history180?true:null;
  const daily=demandComplete&&s?.units>0?s.units/90:null,coverage=daily?g.quantity/daily:null,current=prices.get(key)??null;
  const reasons=[];if(stale)reasons.push('Atualizar carga antes de decidir');if(!m.inventory_complete)reasons.push('Conferir cobertura do estoque');if(g.old_value>0)reasons.push('Capital em lotes >180 dias');if(noSales===true)reasons.push('Sem venda positiva em 180 dias');if(coverage!==null&&coverage>180)reasons.push('Cobertura superior a 180 dias');if(coverage!==null&&coverage<15)reasons.push('Risco de ruptura: evitar promoção');if(g.unknown_age)reasons.push('Idade parcialmente desconhecida');if(!current)reasons.push('Preço vigente ausente');
  return {...g,last_sale_date:last,no_sales_180:noSales,average_cost:g.value/g.quantity,current_price:current,coverage_days:coverage,net_units_90d:demandComplete?s?.units??0:null,priority:g.old_value>0?'capital_antigo':noSales===true?'sem_vendas':coverage!==null&&coverage>180?'excesso':coverage!==null&&coverage<15?'ruptura':'conferir',reasons,discount_ready:false};
 }).sort((a,b)=>b.old_value-a.old_value||b.value-a.value||a.store_id.localeCompare(b.store_id)||a.sku.localeCompare(b.sku));
 const start=Number.isSafeInteger(offset)&&offset>=0?offset:0;
 return {available:true,company:snapshot.company_id,source:snapshot.source_name,hash:snapshot.source_hash,captured_at:snapshot.captured_at,status:snapshot.status,partial:m.scope!=='company_all',stale,demand_complete:demandComplete,page:{offset:start,limit:20,total:all.length,has_more:start+20<all.length},items:all.slice(start,start+20),notice:'Fila de revisão; custo por saldo valorizado. Antes de precificar: validar custo de reposição, tributação, reservas, validade, frete, comissão e contribuição. ABC/XYZ e elasticidade aguardam histórico adequado.'};
}
