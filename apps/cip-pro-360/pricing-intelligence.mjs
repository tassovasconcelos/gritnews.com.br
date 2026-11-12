import {simulatePrice} from './pricing-engine.mjs';
import {day} from './erp-engine.mjs';
export const POSITION_ALERTS={
 cost_review:{label:'Conferir custo',priority:100,action:'Conferir custo e valorização antes de precificar.'},
 missing_price:{label:'Preço ausente ou zero',priority:95,action:'Confirmar o preço vigente; não anunciar com preço ausente.'},
 below_cost:{label:'Preço abaixo do custo informado',priority:90,action:'Revisar preço e custo da mesma embalagem antes da oferta.'},
 stock_rules:{label:'Mínimo máximo ou segurança incoerentes',priority:85,action:'Revisar os parâmetros antes de automatizar compra ou promoção.'},
 protect_stock:{label:'Curva A ou venda recente abaixo do mínimo',priority:80,action:'Proteger o alto giro classificado; validar saldo e reposição antes de estimular demanda.'},
 curve_review:{label:'Curva A com última venda antiga',priority:65,action:'Confirmar período da curva e corrigir a data de última venda; preservar a classificação A da origem.'},
 no_recent_sale:{label:'Última venda informada há mais de 180 dias',priority:55,action:'Investigar demanda e cadastro; este critério não mede idade do lote.'},
 over_max:{label:'Saldo acima do máximo informado',priority:40,action:'Revisar demanda e parâmetros; comparar transferência ou oferta com contribuição.'}
};
const finite=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&Number.isFinite(Number(v));
const dateDays=(asof,date)=>day(asof)&&day(date)?Math.round((Date.parse(asof+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000):null;
export function assessPosition(row,asof=row.as_of){
 const q=finite(row.quantity)?Number(row.quantity):null,c=finite(row.unit_cost)?Number(row.unit_cost):null,p=finite(row.sale_price)?Number(row.sale_price):null;
 const min=finite(row.min_stock)?Number(row.min_stock):null,max=finite(row.max_stock)?Number(row.max_stock):null,security=finite(row.security_stock)?Number(row.security_stock):null;
 const sinceSale=dateDays(asof,row.last_sale),sincePurchase=dateDays(asof,row.last_purchase),issues=[];
 if(c===null||c<=0||q===null||q<0||!row.unit||row.cost_delta===null||!finite(row.cost_delta)||Math.abs(Number(row.cost_delta))>.010001||row.last_sale&&sinceSale===null||sinceSale!==null&&sinceSale<0)issues.push('cost_review');
 if(p===null||p<=0)issues.push('missing_price');else if(c!==null&&c>0&&p<c)issues.push('below_cost');
 const invalid=min===null||security===null||max===null||[min,max,security].some(v=>v!==null&&v<0)||max>0&&(min>max||security>max);
 if(invalid)issues.push('stock_rules');
 if(!invalid&&q!==null&&(row.curve==='A'||sinceSale!==null&&sinceSale>=0&&sinceSale<=30)&&Math.max(min,security)>0&&q<Math.max(min,security))issues.push('protect_stock');
 if(row.curve==='A'&&sinceSale!==null&&sinceSale>180)issues.push('curve_review');
 if(sinceSale!==null&&sinceSale>180)issues.push('no_recent_sale');
 if(!invalid&&q!==null&&max>0&&q>max)issues.push('over_max');
 issues.sort((a,b)=>POSITION_ALERTS[b].priority-POSITION_ALERTS[a].priority);
 return {alerts:issues,priority:issues.length?POSITION_ALERTS[issues[0]].priority:0,days_since_sale:sinceSale,gross_margin_pct:p>0&&c!==null&&c>0?(p-c)/p*100:null,high_turnover_classified:row.curve==='A',low_turnover_classified:row.curve==='E',high_turnover_verified:false,sales_velocity:null,coverage_days:null,purchase_cost_recent:sincePurchase!==null&&sincePurchase>=0&&sincePurchase<=90&&finite(row.purchase_unit_cost)&&Number(row.purchase_unit_cost)>0,notice:'Curva A alto giro e E baixo giro: classificação da origem confirmada pelo usuário. Velocidade e cobertura não calculadas. Margem bruta não desconta despesas.'};
}
export function explainPriceStrategy(input,position=null,now=new Date()){
 const scenario=simulatePrice(input,now),blockers=[...scenario.blockers],advice=[];
 if(position){const a=assessPosition(position);if(a.alerts.includes('protect_stock'))blockers.push('Curva A ou venda recente com saldo abaixo do mínimo: validar reposição antes de promover.');if(a.alerts.some(x=>['cost_review','stock_rules','missing_price'].includes(x)))blockers.push('A origem tem pendências de custo, preço ou parâmetros; conferir antes do teste.');
  advice.push(position.cost_basis==='CUSTO MEDIO'?'Custo médio da origem; confirmar custo de reposição.':'A origem usa '+position.cost_basis+'; confirmar a base de custo antes de decidir.');
  if(position.curve==='A')advice.push('Alto giro classificado: proteger disponibilidade e reposição. Avaliar a contribuição compatível com a referência válida antes de ampliar desconto; testar preservação de margem com acompanhamento de conversão.');
  if(position.curve==='E')advice.push('Baixo giro classificado: investigar demanda, exposição, transferência e oferta dirigida. Qualquer desconto deve respeitar contribuição mínima, validade e alçada; não há ganho previsto sem teste.');
 }
 let compatibleMargin=null,competitiveCandidate=null;
 if(scenario.reference){
  const referencePrice=scenario.reference.price,expenses=Number(input.expense_pct)/100,cost=Number(input.cost)+Number(input.fixed_cost);
  compatibleMargin=(referencePrice*(1-expenses)-cost)/referencePrice*100;
  if(referencePrice<scenario.floor)advice.push('A referência está abaixo do piso informado. Não acompanhar sem rever custo, serviço ou condição comercial.');
  else{competitiveCandidate=Math.max(scenario.floor,Math.min(scenario.target_price,referencePrice));advice.push('Faixa de avaliação entre o piso e a referência válida; a contribuição alvo é uma premissa, não uma margem ótima comprovada.');}
 }else advice.push('Sem concorrente equivalente e recente validado: não há comparação de mercado comprovada.');
 advice.push('Curva A indica alto giro e E baixo giro conforme classificação da origem confirmada. Sem histórico de vendas, velocidade, cobertura, elasticidade e aumento de vendas não são calculados. Testar por produto/unidade, com período e resultado observado.');
 return {...scenario,blockers,status:blockers.length?'bloqueado':'revisao_humana',compatible_margin_pct:compatibleMargin,competitive_candidate:competitiveCandidate,advice};
}
