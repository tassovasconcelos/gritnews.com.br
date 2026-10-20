import {brazilDay,day} from './erp-engine.mjs';
const DAY=86400000;
const elapsed=(a,b)=>Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/DAY);
const number=(v,name,min=0,max=1e12)=>{if(v===null||v===undefined||String(v).trim()===''||!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)throw Error('Confira '+name+'.');return Number(v);};
const ceilMoney=v=>Math.ceil((v-1e-9)*100)/100;
const addDays=(date,days)=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
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
  let idleSince=null,idleBasis=null;
  if(noSales===true){
   if(last&&(m.last_sale_verified||history180)){idleSince=addDays(last,1);if(idleSince<m.sales_from&&history180)idleSince=m.sales_from;idleBasis=m.last_sale_verified?'ultima_venda_erp_verificada':'janela_completa_de_vendas';}
   else if(history180){idleSince=m.sales_from;idleBasis='inicio_da_janela_completa_sem_vendas';}
  }
  const idleDays=idleSince===null?null:Math.max(0,elapsed(asof,idleSince));
  const carryingCostScenario=g.value*MP_MONTHLY_CARRY_RATE_PCT/100;
  const monthlyCarryCost=noSales===true?g.value*MP_MONTHLY_CARRY_RATE_PCT/100:null;
  const accruedCarryEstimate=idleDays===null?null:g.value*MP_MONTHLY_CARRY_RATE_PCT/100*idleDays/30;
  const reasons=[];if(stale)reasons.push('Atualizar carga: custo e saldo observados em base antiga');if(!m.inventory_complete)reasons.push('Conferir cobertura do estoque');if(g.old_value>0)reasons.push('Capital em lotes >180 dias');if(noSales===true)reasons.push('Sem venda positiva em 180 dias');if(noSales===true&&idleDays===null)reasons.push('Data confiável de início da parada indisponível');if(coverage!==null&&coverage>180)reasons.push('Cobertura superior a 180 dias');if(coverage!==null&&coverage<15)reasons.push('Risco de ruptura: evitar promoção');if(g.unknown_age)reasons.push('Idade parcialmente desconhecida');if(!current)reasons.push('Preço vigente ausente');
  return {...g,last_sale_date:last,no_sales_180:noSales,idle_since:idleSince,idle_basis:idleBasis,idle_days:idleDays,monthly_carry_rate_pct:MP_MONTHLY_CARRY_RATE_PCT,monthly_carrying_cost_scenario:carryingCostScenario,monthly_carrying_cost:monthlyCarryCost,accumulated_carrying_cost_estimate:accruedCarryEstimate,average_cost:g.value/g.quantity,current_price:current,cost_observed_at:snapshot.captured_at,cost_status:stale?'atualizacao_requerida':'custo_da_base_aprovada',coverage_days:coverage,net_units_90d:demandComplete?s?.units??0:null,priority:g.old_value>0?'capital_antigo':noSales===true?'sem_vendas':coverage!==null&&coverage>180?'excesso':coverage!==null&&coverage<15?'ruptura':'conferir',reasons,discount_ready:false};
 }).sort((a,b)=>b.old_value-a.old_value||b.value-a.value||a.store_id.localeCompare(b.store_id)||a.sku.localeCompare(b.sku));
 const start=Number.isSafeInteger(offset)&&offset>=0?offset:0;
  return {available:true,company:snapshot.company_id,source:snapshot.source_name,hash:snapshot.source_hash,captured_at:snapshot.captured_at,status:snapshot.status,partial:m.scope!=='company_all',stale,demand_complete:demandComplete,page:{offset:start,limit:20,total:all.length,has_more:start+20<all.length},items:all.slice(start,start+20),notice:'Custo unitário médio ponderado vem do saldo valorizado da última base aprovada. Atualize a carga Procfit para renovar custo e preço observados. Custo mensal estimado = valor atual a custo × 1,5%. Acumulado estimado só aparece quando uma janela confiável comprova a parada; usa o saldo atual e não é perda contábil realizada. Validar custo de reposição, tributação, reservas, validade, frete, comissão e contribuição antes de agir. ABC/XYZ e elasticidade aguardam histórico adequado.'};
}

// Marca-passo F1: deterministic scenarios, never a forecast or an ERP instruction.
export const MP_RULE_VERSION='mp-economics-2026-10-19.1';
export const MP_MONTHLY_CARRY_RATE_PCT=1.5;
export function carryingCost({capital,days,monthly_rate_pct=1.5,expiry_risk=0}){
 const c=number(capital,'capital elegível'),d=number(days,'dias',0,3650),r=number(monthly_rate_pct,'taxa mensal',0,100),risk=number(expiry_risk,'risco de perda estimado');
 return {simulation:true,capital:c,days:d,monthly_rate_pct:r,capital_cost:c*r/100*d/30,expiry_risk:risk,total:c*r/100*d/30+risk,formula:'capital × taxa mensal ÷ 100 × dias ÷ 30 + risco de perda',rule_version:MP_RULE_VERSION};
}
export function coverageEconomics({stock_cost,daily_cogs,target_days}){
 const stock=number(stock_cost,'estoque a custo'),daily=number(daily_cogs,'CMV diário',0.00000001),target=number(target_days,'cobertura alvo',0,3650);
 return {coverage_days:stock/daily,excess_capital:Math.max(0,stock-daily*target),target_cost:daily*target,rule_version:MP_RULE_VERSION};
}
export function priceEconomics(input){
 const r=simulatePrice({...input,target_margin_pct:input.minimum_margin_pct});
 const cost=number(input.cost,'custo',0.00000001)+number(input.fixed_cost,'despesa por unidade'),expense=number(input.expense_pct,'despesa percentual',0,99),units=number(input.units,'quantidade',0.0001);
 const liquidationFloor=ceilMoney(cost/(1-expense/100));
 const carrying=carryingCost({capital:number(input.cost,'custo')*units,days:input.days??30,monthly_rate_pct:input.monthly_rate_pct??1.5,expiry_risk:input.expiry_risk??0});
 const contributionLoss=Math.max(0,r.current_contribution-r.candidate_contribution)*units;
 return {...r,rule_version:MP_RULE_VERSION,liquidation_floor:liquidationFloor,price_shortfall:Math.max(0,r.floor-Number(input.candidate)),margin_gap_pp:r.candidate_margin_pct-Number(input.minimum_margin_pct),cash_if_all_sold_and_received:Number(input.candidate)*units,stock_cost_released_if_sold:Number(input.cost)*units,contribution_loss_same_volume:contributionLoss,carrying,discount_economic_same_volume:contributionLoss<carrying.total,volume_compensation_pct:r.candidate_contribution>0?r.current_contribution>0?(r.current_contribution/r.candidate_contribution-1)*100:0:null,notice:'Simulação na quantidade informada. Caixa exige venda e recebimento; custo carregado não é prejuízo contábil realizado. Comparação econômica não autoriza furar piso ou alçada.'};
}
export function scoreMP(components,weights={excess:30,age:20,competition:20,floor:15,demand:15}){
 if(Object.values(weights).some(x=>!Number.isFinite(x)||x<0)||Object.values(weights).reduce((a,b)=>a+b,0)!==100)throw Error('Pesos devem somar 100.');
 const missing=Object.keys(weights).filter(k=>components[k]===undefined||components[k]===null);
 for(const k of Object.keys(weights))if(!missing.includes(k)&&(!Number.isFinite(components[k])||components[k]<0||components[k]>1))throw Error('Componentes do rating devem estar entre zero e um.');
 return {score:missing.length?null:Object.entries(weights).reduce((sum,[key,w])=>sum+components[key]*w,0),missing,weights,rule_version:MP_RULE_VERSION,notice:'Componentes normalizados precisam de origem, data e política aprovada. Sem evidência não há rating econômico.'};
}
