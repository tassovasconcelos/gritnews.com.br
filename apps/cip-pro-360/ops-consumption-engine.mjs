// CIP360 Operational Consumption · pure, deterministic presentation helpers.
// NO billing estimate is produced without a versioned, externally validated tariff.
export const OPS_GROUPS=Object.freeze({
 llm:'IA e modelos',search:'Pesquisa na web',market:'Radar e marketplaces',
 infra:'Infraestrutura',erp:'Sistemas corporativos',communication:'Mensageria',local:'Modelos locais'});
export const OPS_READINESS=Object.freeze({
 integrated:'Integrado ao CIP',partial:'Integração parcial',planned:'A conectar',
 manual:'Controle manual',unverified:'Não verificado'});
export const OPS_PROVIDER_LINKS=Object.freeze({
 openai:'https://platform.openai.com/usage',
 anthropic:'https://platform.claude.com/',
 google_gemini:'https://aistudio.google.com/',
 deepseek:'https://platform.deepseek.com/',
 supabase:'https://supabase.com/dashboard',
 hostinger:'https://hpanel.hostinger.com/',
 brave_search:'https://api-dashboard.search.brave.com/',
 dataforseo:'https://app.dataforseo.com/',
 mercado_livre:'https://developers.mercadolivre.com.br/'});
export const OPS_LOOKBACKS=Object.freeze({'7':7,'30':30,'90':90,'120':120});
export function metricTotals(rows){
 return (rows||[]).reduce((out,r)=>{
  out.events+=Number(r.events)||0;out.input+=Number(r.input_tokens)||0;out.output+=Number(r.output_tokens)||0;
  out.searches+=Number(r.search_calls)||0;out.failed+=Number(r.failed_events)||0;
  out.metered+=Number(r.metered_events)||0;out.costed+=Number(r.costed_events)||0;
  if(r.estimated_or_billed_cost_usd!==null&&r.estimated_or_billed_cost_usd!==undefined)
   out.measuredCost+=Number(r.estimated_or_billed_cost_usd)||0;
  return out;
 },{events:0,input:0,output:0,searches:0,failed:0,metered:0,costed:0,measuredCost:0});
}
export function budgetSignal(setting,billing,now=new Date()){
 if(setting?.monthly_budget_usd==null)return {kind:'unconfigured',label:'Sem orçamento informado',pct:null};
 if(!billing||billing.period_month!==now.toISOString().slice(0,7)+'-01'||billing.month_spend_usd==null)
  return {kind:'unknown',label:'Cobrança mensal não conciliada',pct:null};
 const budget=Number(setting.monthly_budget_usd),spent=Number(billing.month_spend_usd);
 if(!(budget>0))return {kind:'zero_budget',label:'Orçamento zero: definir política',pct:null};
 const pct=spent/budget*100,manual=billing.source!=='provider_api';
 const kind=pct>=Number(setting.critical_percent)?'critical':pct>=Number(setting.warn_percent)?'warning':'ok';
 return {kind, pct,source:billing.source,label:(manual?'Conferência manual: ':'Provedor: ')+
  pct.toFixed(1)+'% do orçamento mensal'};
}
export function creditSignal(snapshot,now=new Date()){
 if(!snapshot||snapshot.credit_balance_usd===null||snapshot.credit_balance_usd===undefined)
  return {kind:'unknown',label:'Saldo de créditos não conectado'};
 const ageHours=(now.getTime()-Date.parse(snapshot.observed_at))/3600000;
 if(!Number.isFinite(ageHours)||ageHours<-.1||ageHours>24)
  return {kind:'stale',label:'Saldo informado está desatualizado'};
 return {kind:snapshot.source==='provider_api'?'reported':'manual',
  label:snapshot.source==='provider_api'?'Saldo informado pela API':'Saldo informado manualmente'};
}
export function opsHealth(faro,counters,latestRun){
 if(!faro)return {kind:'unknown',label:'Faro não consultado'};
 if(faro.enabled!==true)return {kind:'disabled',label:'Faro desativado'};
 if(faro.circuit_until&&new Date(faro.circuit_until)>new Date())
  return {kind:'critical',label:'Proteção contra bloqueios do provedor ativa'};
 if((Number(faro.failure_streak)||0)>=3)return {kind:'critical',label:'Falhas consecutivas de pesquisa: '+faro.failure_streak};
 if(!latestRun)return {kind:'stale',label:'Sem execução comprovada'};
 if((Number(counters?.failed)||0)>0)return {kind:'warning',label:'Pesquisa com falhas registradas'};
 return {kind:'monitoring',label:'Execuções registradas; evidências exigem revisão'};
}
export function formatCount(n){return Math.round(Number(n)||0).toLocaleString('pt-BR');}
export function formatUSD(n){
 return n===null||n===undefined||!Number.isFinite(Number(n))?
  'Não informado':Number(n).toLocaleString('en-US',{style:'currency',currency:'USD'});
}
export function cleanCsv(rows){
 const safe=v=>{let s=String(v??'').replace(/[\r\n]+/g,' ');
  if(/^\s*[=+\-@]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';};
 return '\ufeff'+rows.map(row=>row.map(safe).join(';')).join('\r\n');
}
export function groupByProvider(rows){
 const map=new Map();
 for(const row of rows||[]){
  const id=row.provider,prev=map.get(id)||{provider:id,events:0,input:0,output:0,searches:0,failed:0,metered:0,costed:0};
  prev.events+=Number(row.events)||0;prev.input+=Number(row.input_tokens)||0;
  prev.output+=Number(row.output_tokens)||0;prev.searches+=Number(row.search_calls)||0;
  prev.failed+=Number(row.failed_events)||0;prev.metered+=Number(row.metered_events)||0;
  prev.costed+=Number(row.costed_events)||0;map.set(id,prev);
 }
 return map;
}
