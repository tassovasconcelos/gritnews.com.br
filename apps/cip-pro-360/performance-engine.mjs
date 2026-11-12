// CIP PRO 360° — cálculos puros e auditáveis. Não faz chamadas ao ERP nem gera pagamentos.
export const PILLARS=Object.freeze([
 {code:'crescimento_vendas',title:'Crescimento de vendas',weight:20,unit:'BRL',direction:'up'},
 {code:'margem_contribuicao',title:'Margem incremental',weight:15,unit:'BRL',direction:'up'},
 {code:'giro_estoque',title:'Giro de estoque',weight:15,unit:'TURNS',direction:'up'},
 {code:'recuperacao_caderninho',title:'Caderninho e vendas recuperadas',weight:10,unit:'BRL',direction:'up'},
 {code:'radar_acoes',title:'Radar e ações competitivas',weight:5,unit:'COUNT',direction:'up'},
 {code:'engajamento_equipe',title:'Engajamento e gamificação',weight:5,unit:'PCT',direction:'up'},
 {code:'horas_liquidas',title:'Velocidade e produtividade',weight:15,unit:'HOURS',direction:'up'},
 {code:'efetividade_agentes',title:'Agentes e ações coordenadas',weight:15,unit:'PCT',direction:'up'}
]);
export const SUPPLEMENTARY=Object.freeze([
 {code:'tempo_decisao',title:'Tempo de decisão',unit:'MINUTES',direction:'down'},
 {code:'tempo_processos',title:'Tempo por processo',unit:'MINUTES',direction:'down'},
 {code:'automacao',title:'Taxa de automação',unit:'PCT',direction:'up'},
 {code:'produtividade_pessoa',title:'Produtividade por pessoa',unit:'PER_HOUR',direction:'up'},
 {code:'retrabalho',title:'Retrabalho',unit:'PCT',direction:'down'},
 {code:'economia_pessoal',title:'Despesa efetivamente evitada',unit:'BRL',direction:'up'},
 {code:'capital_estoque',title:'Estoque imobilizado',unit:'BRL',direction:'down'}
]);
const finite=x=>x!==null&&x!==undefined&&String(x).trim()!==''&&Number.isFinite(Number(x));
const number=x=>finite(x)?Number(x):null;
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function pillarProgress(row,pillar){
 if(!row||!pillar)return null;
 const base=number(row.baseline),target=number(row.target),actual=number(row.actual);
 if([base,target,actual].some(x=>x===null))return null;
 const desired=pillar.direction==='down'?base-target:target-base;
 const attained=pillar.direction==='down'?base-actual:actual-base;
 if(!(desired>0))return null;
 if(pillar.unit==='PCT'&&[base,target,actual].some(x=>x<0||x>100))return null;
 return clamp(attained/desired,0,1.2);
}
export function scorecard(records=[],catalog=PILLARS){
 const best=new Map();
 for(const r of records){
  if(!catalog.some(p=>p.code===r.metric_code))continue;
  // Caller must scope records to one company + period; last record wins only after stable ordering.
  best.set(r.metric_code,r);
 }
 let weighted=0,covered=0;
 const pillars=catalog.map(p=>{
  const row=best.get(p.code);
  const progress=pillarProgress(row,p);
  if(progress!==null){covered+=p.weight;weighted+=p.weight*progress;}
  return {...p,baseline:row?number(row.baseline):null,target:row?number(row.target):null,actual:row?number(row.actual):null,progress,points:progress===null?null:p.weight*progress,source:row?.source_kind??null,evidence:row?.evidence??null};
 });
 return {pillars,coverageWeight:covered,partialPoints:Math.round(weighted*100)/100,complete:covered===100,totalPoints:covered===100?Math.round(weighted*100)/100:null,unverified:true};
}
export function productivity(samples=[]){
 let netHours=0,executions=0,grossHours=0,reviewHours=0;
 let weightedBefore=0,weightedAfter=0,capacityHours=0,potentialCost=0;
 for(const s of samples){
  const before=number(s.baseline_minutes),after=number(s.current_minutes),vol=number(s.monthly_executions),review=number(s.supervision_hours),rework=number(s.rework_hours);
  const monthHours=number(s.monthly_productive_hours);
  if([before,after,vol,review,rework,monthHours].some(x=>x===null)||before<0||after<0||vol<0||review<0||rework<0||monthHours<=0)continue;
  const gross=(before-after)*vol/60;
  const net=gross-review-rework;
  grossHours+=gross;netHours+=net;reviewHours+=review+rework;executions+=vol;
  weightedBefore+=before*vol;weightedAfter+=after*vol;
  capacityHours+=vol?net/monthHours:0;
  const hourly=number(s.estimated_hour_cost);
  if(hourly!==null&&hourly>=0)potentialCost+=net*hourly;
 }
 return {samples:samples.length,executions,netHours,grossHours,reviewHours,
  fteEquivalent:capacityHours,avgBeforeMinutes:executions?weightedBefore/executions:null,
  avgAfterMinutes:executions?weightedAfter/executions:null,
  indicativeLaborValue:potentialCost,financialSavingValidated:false};
}
export function agentsSummary(samples=[]){
 let analyses=0,recommended=0,executed=0,effective=0,automatic=0,eligible=0;
 let decisionCount=0,weightedBefore=0,weightedAfter=0;
 for(const s of samples){
  const v=['analyses','actions_recommended','actions_executed','actions_effective','tasks_eligible','tasks_automatic'].map(k=>number(s[k]));
  if(v.some(x=>x===null||x<0)||v[3]>v[2]||v[2]>v[1]||v[5]>v[4])continue;
  analyses+=v[0];recommended+=v[1];executed+=v[2];effective+=v[3];eligible+=v[4];automatic+=v[5];
  const before=number(s.before_decision_minutes),after=number(s.after_decision_minutes);
  if(before!==null&&after!==null&&before>=0&&after>=0&&v[0]>0){decisionCount+=v[0];weightedBefore+=before*v[0];weightedAfter+=after*v[0];}
 }
 return {analyses,recommended,executed,effective,eligible,automatic,efficacyPct:executed?100*effective/executed:null,
  automationPct:eligible?100*automatic/eligible:null,
  decisionBeforeMinutes:decisionCount?weightedBefore/decisionCount:null,
  decisionAfterMinutes:decisionCount?weightedAfter/decisionCount:null};
}
export function verifiedBenefits(events=[],approvals=[]){
 const byEvent=new Map();
 for(const a of approvals){
  if(!byEvent.has(a.event_id))byEvent.set(a.event_id,[]);
  byEvent.get(a.event_id).push(a);
 }
 let approved=0,pending=0,rejected=0,netValidated=0,netSubmitted=0;
 const checked=[];
 for(const event of events){
  const items=byEvent.get(event.id)||[];
  const rejectedDecision=items.some(a=>a.decision==='rejeitado');
  const finance=items.find(a=>a.review_role==='controladoria'&&a.decision==='aprovado');
  const board=items.find(a=>a.review_role==='diretoria'&&a.decision==='aprovado');
  const ok=!rejectedDecision&&finance&&board&&finance.reviewer_id!==board.reviewer_id;
  const gross=number(event.gross_value),cost=number(event.incremental_cost),reverse=number(event.reversals);
  if([gross,cost,reverse].some(x=>x===null||x<0))continue;
  const net=Math.round((gross-cost-reverse)*100)/100;
  netSubmitted+=net;
  if(ok){approved++;netValidated+=net;}else if(rejectedDecision)rejected++;else pending++;
  checked.push({...event,net,validation:ok?'validado':rejectedDecision?'rejeitado':'pendente'});
 }
 return {approved,pending,rejected,netValidated:Math.round(netValidated*100)/100,netSubmitted:Math.round(netSubmitted*100)/100,events:checked};
}
export function bonusSimulation(performance,finances,shareRate=0.06){
 if(!performance?.complete||!Number.isFinite(performance.totalPoints)||!finances||!Number.isFinite(shareRate)||shareRate<0||shareRate>1)return {available:false,reason:'linha_base_ou_parecer_pendente'};
 const benefit=Math.max(0,finances.netValidated||0);
 return {available:true,amount:Math.round(benefit*shareRate*performance.totalPoints)/100,benefit,performanceFactor:performance.totalPoints/100,
   onlyIllustrative:true,notPayable:true};
}
export function formatMetric(value,unit='COUNT'){
 if(value===null||value===undefined||!Number.isFinite(Number(value)))return '—';
 const n=Number(value);
 if(unit==='BRL')return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
 if(unit==='PCT')return n.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
 if(unit==='HOURS')return n.toLocaleString('pt-BR',{maximumFractionDigits:1})+' h';
 if(unit==='MINUTES')return n.toLocaleString('pt-BR',{maximumFractionDigits:1})+' min';
 if(unit==='TURNS')return n.toLocaleString('pt-BR',{maximumFractionDigits:2})+'x';
 if(unit==='PER_HOUR')return n.toLocaleString('pt-BR',{maximumFractionDigits:2})+'/h';
 return n.toLocaleString('pt-BR',{maximumFractionDigits:2});
}
