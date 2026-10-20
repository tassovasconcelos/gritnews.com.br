export const metrics = ['Crescimento da base','Conversão de leads','Churn mensal','MRR','Recuperação de cobrança','Produtividade'];
export function initialPlan() {
  return {
    start: new Date().toISOString().slice(0,10), weeklyHours:15,
    goals:metrics.map((name,i)=>({name,baseline:null,target:[20,25,1,130000,80,90][i],actual:null,unit:['%','%','%','R$','%','%'][i],owner:['Comercial','Comercial','Atendimento','Financeiro','Financeiro','Operações'][i],deadline:'',evidence:'',definition:[ '100 × (base final − base inicial) / base inicial','100 × contratos ativados / leads qualificados','100 × cancelamentos / base no início do mês','Receita mensal recorrente ativa, sem instalação avulsa','100 × valor recuperado / saldo vencido elegível','100 × ordens concluídas no prazo e sem retrabalho / ordens elegíveis'][i]})),
    agenda:[['Entrevistas',1,'GRIT / equipe'],['Visitas de campo',2,'GRIT / Técnico'],['Prospecção',2,'Comercial'],['RH e reconhecimento',1.5,'GRIT / Carla'],['Processos e checklists',2,'Operações'],['Treinamentos',1.5,'GRIT'],['Direção e decisões',1,'Naldo / Carla'],['Retenção',2,'Atendimento'],['Análise financeira e cobrança',2,'Financeiro']].map(([activity,hours,owner])=>({activity,hours,owner,day:'A combinar',evidence:''})),
    actions:[
      [30,'Conciliar base, MRR, cancelamentos e custos; entrevistar direção e equipe','GRIT / Financeiro'],
      [30,'Implantar fila de suporte e checklist de instalação, com evidência e prazo','Operações'],
      [60,'Pilotar retenção e cobrança; registrar motivo de saída e recuperação','Atendimento / Financeiro'],
      [60,'Pilotar UNIÃO GANHA+ e avaliar qualidade, equidade e custo','GRIT / Carla'],
      [90,'Revisar funil comercial, treinamento e metas com dados conciliados','Comercial / GRIT'],
      [180,'Escalar processos aprovados e revisar expansão e estabilidade da equipe','Direção / Operações'],
      [365,'Auditar resultado anual, margem incremental e renovar plano','Direção / GRIT / Financeiro']
    ].map(([horizon,title,owner],i)=>({id:'a'+i,horizon,title,owner,status:'planejado',deadline:'',evidence:''})),
    rules:[['Ativação com primeira mensalidade recebida',30],['Retenção confirmada após 60 dias',20],['Recuperação de dívida com recebimento conciliado',15],['Instalação no prazo sem retrabalho por 30 dias',20],['Melhoria implantada com ganho medido',25]].map(([event,reward],i)=>({id:'r'+i,event,reward,windowDays:[30,60,30,30,30][i],criteria:'Comprovar no sistema de origem, conciliar recebimento quando aplicável e validar qualidade; sem duplicidade.'})),
    events:[], finance:{percent:30,baselineRevenue:0,baselineCosts:0,currentRevenue:0,currentCosts:0,adjustments:0,baselinePeriod:'',currentPeriod:'',method:'Comparar períodos de igual duração e escopo; excluir receita avulsa, ajustar sazonalidade, inflação, expansão não atribuível e custos variáveis incluindo incentivos. Valores efetivamente conciliados.',evidence:'',auditor:'',clientSigner:'',gritSigner:'',agreementEvidence:''}, approvals:{}, notes:'Metas e incentivos iniciais são propostas para negociação. Validar baseline no ERP; números das pesquisas são declarações, não auditoria.'
  };
}
export function economics(f) {
  const baseline=f.baselineRevenue-f.baselineCosts;
  const current=f.currentRevenue-f.currentCosts;
  const incremental=Math.max(0,current-baseline-f.adjustments);
  return {baseline,current,incremental,fee:Math.round(incremental*f.percent)/100};
}
export function validatePlan(d) {
  const str=(v,n=2000)=>typeof v==='string'&&v.length<=n;
  const num=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  if(!d||!str(d.start,10)||!/^\d{4}-\d{2}-\d{2}$/.test(d.start)||!num(d.weeklyHours,0.5,80)||!str(d.notes,5000))throw Error('Plano inválido');
  if(!Array.isArray(d.goals)||d.goals.length!==6||d.goals.some((g,i)=>g.name!==metrics[i]||![g.baseline,g.target,g.actual].every(v=>v===null||num(v))||!['%','R$','unidades'].includes(g.unit)||!str(g.owner,150)||!str(g.deadline,10)||!str(g.evidence)||!str(g.definition)))throw Error('Metas inválidas');
  if(!Array.isArray(d.agenda)||d.agenda.length!==9||d.agenda.some(a=>!str(a.activity,150)||!num(a.hours,0,80)||!str(a.owner,150)||!str(a.day,150)||!str(a.evidence)))throw Error('Agenda inválida');
  if(Math.abs(d.agenda.reduce((s,a)=>s+a.hours,0)-d.weeklyHours)>0.001)throw Error('Distribua exatamente a carga semanal entre as atividades');
  if(!Array.isArray(d.actions)||d.actions.length>100||d.actions.some(a=>!str(a.id,64)||!str(a.title,500)||!str(a.owner,150)||![30,60,90,180,365].includes(a.horizon)||!['planejado','em andamento','bloqueado','concluído'].includes(a.status)||!str(a.deadline,10)||!str(a.evidence)||(a.status==='concluído'&&!a.evidence.trim())))throw Error('Ações inválidas: conclusão exige evidência');
  if(!Array.isArray(d.rules)||d.rules.length!==5||d.rules.some(r=>!str(r.id,64)||!str(r.event,200)||!num(r.reward,0,10000)||!num(r.windowDays,1,365)||!str(r.criteria)))throw Error('Regras inválidas');
  if(!Array.isArray(d.events)||d.events.length>300||d.events.some(e=>!str(e.id,64)||!str(e.reference,150)||!e.reference.trim()||!str(e.beneficiary,150)||!str(e.date,10)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!str(e.evidence)||!d.rules.some(r=>r.id===e.ruleId)))throw Error('Eventos inválidos');
  if(new Set(d.events.map(e=>e.reference.trim().toLowerCase())).size!==d.events.length||new Set(d.events.map(e=>e.id)).size!==d.events.length)throw Error('Evento duplicado');
  if(new Set(d.rules.map(e=>e.id)).size!==d.rules.length||new Set(d.actions.map(e=>e.id)).size!==d.actions.length)throw Error('Identificador duplicado');
  const f=d.finance;
  if(!f||!num(f.percent,0,100)||!['baselineRevenue','baselineCosts','currentRevenue','currentCosts','adjustments'].every(k=>num(f[k],k==='adjustments'?-1e12:0))||!['baselinePeriod','currentPeriod','method','evidence','auditor','clientSigner','gritSigner','agreementEvidence'].every(k=>str(f[k])))throw Error('Simulação financeira inválida');
}
export function cleanSave(next,prev) {
  validatePlan(next);
  next.approvals=JSON.stringify(next.finance)===JSON.stringify(prev.finance)?prev.approvals:{};
  next.events=next.events.map(e=>{
    const old=prev.events.find(x=>x.id===e.id);
    const fields=['ruleId','reference','beneficiary','date','evidence'];
    const unchanged=old&&fields.every(k=>old[k]===e[k])&&JSON.stringify(prev.rules)===JSON.stringify(next.rules);
    return {id:e.id,ruleId:e.ruleId,reference:e.reference.trim(),beneficiary:e.beneficiary,date:e.date,evidence:e.evidence,verification:unchanged?old.verification:null};
  });
  return next;
}
