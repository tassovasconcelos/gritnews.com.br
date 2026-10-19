export const STOCK_POLICY=Object.freeze({risk_days:14,target_days:30,donor_days:60,excess_days:90,expiry_days:90,version:'piloto-supervisionado-1'});
export const STOCK_CHECKS={saldo_atual:'Saldo atual conferido na origem',reservas:'Reservas e compras pendentes verificadas, sem contar pedido como recebido',unidade_lote_validade:'SKU, embalagem, lote, validade e elegibilidade comercial conferidos',demanda_atual:'Demanda e período atualizados e documentados',margem_frete:'Contribuição, frete e condição comercial validados',responsavel_prazo:'Responsável, prazo e capacidade operacional confirmados'};
export const STOCK_KINDS={redistribuicao:'Redistribuição entre filiais',campanha:'Campanha dirigida para revisão',preco:'Revisão de preço e margem',conferencia:'Conferência de dados ou lote'};
const n=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&Number.isFinite(Number(v))?Number(v):null;
export function retailSignal(current,historical){
 const q=n(current?.quantity),d=n(historical?.daily),flags=[];
 if(!current)flags.push('saldo_atual_ausente');
 if(historical?.duplicates>1)flags.push('giro_duplicado');
 if(historical?.invalid_date)flags.push('data_invalida');
 if(d===null)flags.push('demanda_ausente');
 const coverage=q!==null&&d>0?q/d:null;
 if(coverage!==null&&coverage<=STOCK_POLICY.risk_days)flags.push('risco_cenario');
 if(coverage!==null&&coverage>STOCK_POLICY.excess_days)flags.push('excesso_cenario');
 if(d===0)flags.push('demanda_zero_origem');
 if(current?.curve==='E')flags.push('curva_e');
 const params=current&&[current.min_stock,current.max_stock,current.security_stock].map(n);
 const validParams=params&&params.every(x=>x!==null&&x>=0)&&(params[1]===0||Math.max(params[0],params[2])<=params[1]);
 const quality=current&&!current.alerts?.some(x=>['cost_review','missing_price','stock_rules'].includes(x));
 return {flags,coverage_scenario:coverage,eligible:!!current&&q!==null&&q>=0&&d>0&&historical?.duplicates===1&&!historical?.invalid_date&&validParams&&quality&&!!current.unit};
}
export function planRedistribution(rows,policy=STOCK_POLICY){
 if(![policy.risk_days,policy.target_days,policy.donor_days].every(x=>Number.isFinite(x)&&x>0)||policy.risk_days>policy.target_days||policy.target_days>policy.donor_days)throw Error('invalid_stock_policy');
 const groups=new Map(),out=[];
 for(const r of rows){if(!r.signal.eligible||r.current.store_code==='100')continue;const c=r.current,key=[c.sku,c.unit,c.description.trim().toUpperCase()].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 for(const list of groups.values()){
  const donors=list.map(r=>({r,left:Math.max(0,Math.floor(Number(r.current.quantity)-Math.max(Number(r.current.min_stock),Number(r.current.security_stock),r.historical.daily*policy.donor_days)))})).filter(x=>x.left>0).sort((a,b)=>b.left-a.left||a.r.current.store_code.localeCompare(b.r.current.store_code));
  const receivers=list.filter(r=>r.signal.coverage_scenario<=policy.risk_days||r.current.curve==='A'&&Number(r.current.quantity)<Math.max(Number(r.current.min_stock),Number(r.current.security_stock))).sort((a,b)=>a.signal.coverage_scenario-b.signal.coverage_scenario||a.current.store_code.localeCompare(b.current.store_code));
  for(const target of receivers){const c=target.current,max=Number(c.max_stock),room=max>0?Math.max(0,max-Number(c.quantity)):Infinity;let need=Math.min(Math.floor(room),Math.max(0,Math.ceil(Math.max(Number(c.min_stock),target.historical.daily*policy.target_days)-Number(c.quantity))));
   for(const donor of donors){if(!need)break;if(donor.r.current.store_code===c.store_code)continue;const quantity=Math.min(need,donor.left);if(quantity<=0)continue;donor.left-=quantity;need-=quantity;out.push({kind:'redistribuicao',sku:c.sku,description:c.description,unit:c.unit,source_store:donor.r.current.store_code,target_store:c.store_code,quantity_limit:quantity,priority:90,payload:{policy,unit:c.unit,target_min:Number(c.min_stock),target_max:Number(c.max_stock),target_security:Number(c.security_stock),donor_protected:Math.max(Number(donor.r.current.min_stock),Number(donor.r.current.security_stock),donor.r.historical.daily*policy.donor_days),donor_stock:Number(donor.r.current.quantity),target_stock:Number(c.quantity),donor_daily:donor.r.historical.daily,target_daily:target.historical.daily,coverage_scenario:target.signal.coverage_scenario,source_unit:c.unit,unit_cost:c.unit_cost,sale_price:c.sale_price,reason:'Cenário com demanda histórica de setembro e saldo de outubro. Validar período, reservas, embalagem, logística e demanda atual antes de aprovar.'}});}
  }
 }
 const donors=new Map(),targets=new Map();for(const a of out){const d=JSON.stringify([a.source_store,a.sku]),t=JSON.stringify([a.target_store,a.sku]);donors.set(d,(donors.get(d)||0)+a.quantity_limit);targets.set(t,(targets.get(t)||0)+a.quantity_limit);}for(const a of out){a.payload.donor_planned_total=donors.get(JSON.stringify([a.source_store,a.sku]));a.payload.target_planned_total=targets.get(JSON.stringify([a.target_store,a.sku]));}
 return out;
}
export function b2bSignal(row,asof){
 const alerts=[];const days=row.expiry?Math.round((Date.parse(row.expiry+'T00:00:00Z')-Date.parse(asof+'T00:00:00Z'))/86400000):null;
 if(typeof row.lot==='number'&&!Number.isSafeInteger(row.lot)||row.lot===null)alerts.push('lote_conferir');
 if(days===null||!Number.isFinite(days)||row.expiry>='2099-01-01')alerts.push('validade_conferir');
 else if(days<0)alerts.push('vencido');else if(days<=STOCK_POLICY.expiry_days)alerts.push('validade_90d');
 if(!(Number(row.unit_cost)>0))alerts.push('custo_conferir');
 if(row.tax_cost===null)alerts.push('tributacao_ausente');else if(Number(row.tax_cost)<Number(row.declared_cost))alerts.push('tributacao_conferir');
 if(/BLOQUEAD|PRESCRI|MEDICAMENT/i.test(row.section||'')||row.controlled)alerts.push('elegibilidade_conferir');
 return {alerts,days_to_expiry:days,priority:alerts.includes('vencido')?100:alerts.includes('validade_90d')?90:alerts.length?60:0,promotion_candidate:alerts.includes('validade_90d')&&!alerts.some(x=>['vencido','custo_conferir','elegibilidade_conferir','validade_conferir','lote_conferir'].includes(x))};
}
