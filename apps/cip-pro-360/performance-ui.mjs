import {PILLARS,SUPPLEMENTARY,scorecard,productivity,agentsSummary,verifiedBenefits,bonusSimulation,formatMetric,pillarProgress} from './performance-engine.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const companiesNames={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
const benefitNames={margem_incremental:'Margem incremental',despesa_reduzida:'Despesa reduzida',custo_financeiro_evitado:'Custo financeiro evitado',contratacao_evitada:'Contratação efetivamente evitada',outro_validavel:'Outro benefício demonstrável'};
const currentMonth=()=>new Date().toISOString().slice(0,7);
const range=month=>{const [year,mm]=String(month).split('-').map(Number);if(!(year>2020&&mm>=1&&mm<=12))return null;const end=new Date(Date.UTC(year,mm,0)).toISOString().slice(0,10);return {start:month+'-01',end};};
const fmt=(n,u)=>formatMetric(Number.isFinite(n)?n:null,u);
function stat(title,value,subtitle){return "<div class='perf-stat'><small>"+esc(title)+"</small><strong>"+esc(value)+"</strong><span>"+esc(subtitle)+"</span></div>";}
function table(headers,rows){if(!rows.length)return "<div class='perf-empty'>Nenhum registro neste período. Não há números operacionais a apresentar.</div>";return "<div class='perf-data-table'><table><thead><tr>"+headers.map(h=>"<th>"+esc(h)+"</th>").join('')+"</tr></thead><tbody>"+rows.join('')+"</tbody></table></div>";}
function input(name,label,type='text',extra=''){
 return "<label>"+esc(label)+"<input name='"+esc(name)+"' type='"+esc(type)+"' "+extra+" required></label>";
}
function select(name,label,options){return "<label>"+esc(label)+"<select name='"+esc(name)+"'>"+options.map(([val,title])=>"<option value='"+esc(val)+"'>"+esc(title)+"</option>").join('')+"</select></label>";}
function evidence(){return "<label class='wide'>Evidência / referência verificável (obrigatória)<textarea name='evidence' minlength='12' maxlength='2000' placeholder='Fonte, relatório, vínculo ERP, protocolo ou documento verificável.' required></textarea></label>";}
function info(text){return "<p class='perf-note'>"+esc(text)+"</p>";}
export function performanceFrame(){
 return "<div id='performanceRoot' class='perf-page'><section class='perf-hero'><div><span class='perf-eyebrow'>CIP PRO 360° · Resultados incrementais</span><h1>Performance CIP | Tasso</h1><p>Velocidade, horas-homem, margem, giro, conversão, agentes, ações coordenadas e impacto real no Grupo Prohospital.</p></div><span class='perf-tag'>MEDIÇÃO AUDITÁVEL</span></section>"
 +"<section class='perf-controls'><label>Empresa <select data-perf-company></select></label><label>Período de apuração <input data-perf-month type='month'></label><button class='btn secondary' data-perf-refresh type='button'>Atualizar</button></section>"
 +"<p class='perf-disclaimer'>O CIP separa registros manuais, resultados conciliados e benefícios com dupla validação. Horas poupadas e equivalência de pessoal são capacidade liberada, não redução automática de folha. Nenhuma bonificação é paga automaticamente.</p>"
 +"<p data-perf-status role='status' aria-live='polite'>Carregando dados autorizados...</p><nav class='perf-nav' aria-label='Áreas de performance'>"
 +[["visao","Placar"],["indicadores","Indicadores"],["processos","Velocidade & horas"],["agentes","Agentes & ações"],["beneficios","Ganhos & bônus"],["governanca","Governança"]].map(([key,label])=>"<button type='button' data-perf-tab='"+key+"' aria-current='"+(key==='visao'?'true':'false')+"'>"+label+"</button>").join('')
 +"</nav><div data-perf-panel></div></div>";
}
export function mountPerformance({db,user,companies=[],role,onDispose}){
 const root=document.getElementById('performanceRoot');if(!root)return;
 let alive=true,epoch=0,selected=companies[0]||'',month=currentMonth(),tab='visao';
 let data={kpis:[],processes:[],agents:[],benefits:[],approvals:[],reviewers:[]};
 let ready=false;
 const readOnly=!['superadm','diretoria'].includes(role);
 const $=sel=>root.querySelector(sel);
 const isAlive=()=>alive&&root.isConnected&&window.cipAuth?.email===user.email;
 if(onDispose)onDispose(()=>{alive=false;epoch++;});
 const opts=companies.map(k=>"<option value='"+esc(k)+"'>"+esc(companiesNames[k]||k)+"</option>");
 if(companies.length>1)opts.unshift("<option value='all'>Consolidado das duas empresas</option>");
 $('[data-perf-company]').innerHTML=opts.join('');
 if(companies.length>1)selected='all';
 $('[data-perf-company]').value=selected;
 $('[data-perf-month]').value=month;
 const setMessage=s=>{if(isAlive())$('[data-perf-status]').textContent=s;};
 function scopes(){return selected==='all'?companies:[selected];}
 function scopedQuery(table){
  const period=range(month);
  let q=db.from(table).select('*').eq('period_start',period.start).eq('period_end',period.end);
  return selected==='all'?q.in('company_id',scopes()):q.eq('company_id',selected);
 }
 async function load(){
  if(!isAlive())return;
  const run=++epoch;ready=false;setMessage("Consultando registros do CIP para o período selecionado...");
  const p=range(month);
  if(!p){setMessage('Período inválido.');return;}
  try{
   const q=[scopedQuery('cip_perf_kpi_records'),scopedQuery('cip_perf_process_samples'),
    scopedQuery('cip_perf_agent_samples'),scopedQuery('cip_perf_financial_events'),
    db.from('cip_perf_reviewers').select('company_id,review_role,user_id').eq('user_id',user.id)];
   const res=await Promise.all(q);
   if(run!==epoch||!isAlive())return;
   const fail=res.find(r=>r.error);if(fail){throw Error('Falha na consulta autorizada: '+(fail.error.message||'verifique acesso'));}
   const items=res[3].data||[];let approvals={data:[]};
   if(items.length){
    approvals=await db.from('cip_perf_financial_approvals').select('event_id,reviewer_id,review_role,decision,company_id,created_at').in('event_id',items.map(x=>x.id));
    if(approvals.error)throw Error('Não foi possível confirmar os pareceres financeiros.');
   }
   if(run!==epoch||!isAlive())return;
   data={kpis:res[0].data||[],processes:res[1].data||[],agents:res[2].data||[],benefits:items,approvals:approvals.data||[],
    reviewers:(res[4].data||[]).filter(r=>scopes().includes(r.company_id))};
   ready=true;setMessage('Registros carregados. Dados informados manualmente permanecem provisórios até validação independente.');
   render();
  }catch(error){if(run!==epoch||!isAlive())return;ready=false;data={kpis:[],processes:[],agents:[],benefits:[],approvals:[],reviewers:[]};setMessage('Dados indisponíveis: '+(error.message||'falha de consulta')+'. Nenhum resultado foi presumido.');render();}
 }
 function scoreForCurrent(){
  return selected==='all'?null:scorecard(data.kpis.filter(k=>k.company_id===selected));
 }
 function render(){
  if(!isAlive())return;
  root.querySelectorAll('[data-perf-tab]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.perfTab===tab)));
  const panel=$('[data-perf-panel]');
  if(!ready){panel.innerHTML="<section class='perf-card'><div class='perf-empty'>Não há dados confirmados para exibir.</div></section>";return;}
  const frames={visao:overview,indicadores:metrics,processos:processes,agentes:agents,beneficios:benefits,governanca:governance};
  panel.innerHTML=(frames[tab]||overview)();
 }
 function overview(){
  const s=scoreForCurrent(),p=productivity(data.processes),a=agentsSummary(data.agents),f=verifiedBenefits(data.benefits,data.approvals);
  const bonus=s?bonusSimulation(s,f):{available:false};
  const cards=[
   stat('Índice de performance CIP',s?.complete?fmt(s.totalPoints,'COUNT')+' / 100':'—',!s?'Selecione empresa para pontuação':'Cobertura de metas: '+s.coverageWeight+'% · prévia não homologada'),
   stat('Horas-homem líquidas',data.processes.length?fmt(p.netHours,'HOURS'):'—','Descontadas revisão e retrabalho'),
   stat('Capacidade equivalente (FTE)',data.processes.length?fmt(p.fteEquivalent,'COUNT'):'—','Não equivale a demissão nem economia de folha'),
   stat('Tempo médio de decisão',a.decisionAfterMinutes!==null?fmt(a.decisionAfterMinutes,'MINUTES'):'—','Antes: '+fmt(a.decisionBeforeMinutes,'MINUTES')),
   stat('Taxa de automação',fmt(a.automationPct,'PCT'),'Tarefas automáticas / elegíveis'),
   stat('Efetividade das ações',fmt(a.efficacyPct,'PCT'),'Ações efetivas / executadas'),
   stat('Benefício líquido com 2 pareceres',data.benefits.length?fmt(f.netValidated,'BRL'):'—','Controladoria + Diretoria independentes'),
   stat('Prévia de bonificação',bonus.available?fmt(bonus.amount,'BRL'):'—','Referência de 6%; nunca pagamento automático'),
   stat('Análises dos agentes',data.agents.length?fmt(a.analyses,'COUNT'):'—','Registros sujeitos à verificação')
  ].join('');
  return "<div class='perf-stat-grid'>"+cards+"</div><div class='perf-split'>"
   +"<section class='perf-card'><h2>8 pilares ponderados do Tasso</h2>"+scorePillars(s)+"</section>"
   +"<section class='perf-card'><h2>Apuração e atribuição</h2><p>O CIP registra crescimento sobre o marco zero de cada empresa, não premia faturamento preexistente.</p>"
   +info('Somente margem adicional, despesas efetivamente evitadas e economia financeira validada entram como benefício. Liberação de estoque não é lucro; horas-homem não são redução de pessoal.')
   +"<div class='perf-bonus'><span>Benefício validado</span><strong>"+fmt(f.netValidated,'BRL')+"</strong><small>"+f.pending+" pendente(s) · "+f.approved+" com dois pareceres · "+f.rejected+" rejeitado(s)</small></div>"
   +"<h3>Próxima ação</h3>"+info('Registrar e validar linha de base, metas por empresa, tempos de processos e fontes financeiras. A apuração permanece provisória sem evidências e pareceres.')+"</section></div>";
 }
 function scorePillars(s){
  if(!s)return "<div class='perf-empty'>No consolidado, os ganhos podem ser somados por empresa, mas índices percentuais não são misturados sem critério ponderado. Selecione uma empresa.</div>";
  return "<div class='perf-pillar-list'>"+s.pillars.map(p=>{
   const value=p.progress===null?'Sem base/meta válida':fmt(p.actual,p.unit)+' · '+Math.round(p.progress*100)+'% da evolução-alvo';
   const width=p.progress===null?0:Math.min(100,p.progress*100);
   return "<div class='perf-pillar'><div class='perf-pillar-head'><b>"+esc(p.title)+"</b><span>"+p.weight+" pontos</span></div><div class='perf-progress'><i style='width:"+width+"%'></i></div><div class='perf-pillar-head'><span>"+esc(value)+"</span><span>"+(p.points===null?'—':p.points.toFixed(1))+" pt</span></div></div>";
  }).join('')+"</div>"+info('O índice usa baseline → meta → realizado; limite de 120% por pilar. É uma prévia até a homologação de fontes, amostragem e regras da bonificação.');
 }
 function readonlyHint(){return readOnly?info('Seu perfil permite consulta, não lançamento. Solicite registro ao superadministrador ou à diretoria.'):'';}
 function formShell(title,formId,fields){
  if(readOnly||selected==='all')return info('Escolha uma única empresa e utilize perfil superadm/diretoria para registrar medições.');
  return "<section class='perf-card'><h2>"+esc(title)+"</h2><form class='perf-form' data-perf-form='"+formId+"'><div class='perf-form-grid'>"+fields+"</div><button class='btn' type='submit'>Registrar no CIP</button></form></section>";
 }
 function metrics(){
  const all=[...PILLARS,...SUPPLEMENTARY],current=selected==='all'?[]:data.kpis.filter(x=>x.company_id===selected);
  const rows=data.kpis.map(x=>{const spec=all.find(p=>p.code===x.metric_code),unit=spec?.unit||'COUNT';return "<tr><td>"+esc(companiesNames[x.company_id])+"</td><td>"+esc(spec?.title||x.metric_code)+"</td><td>"+fmt(x.baseline,unit)+"</td><td>"+fmt(x.target,unit)+"</td><td>"+fmt(x.actual,unit)+"</td><td><span class='perf-state'>Lançamento · "+esc(x.source_kind)+"</span></td><td>"+esc(x.evidence||'—')+"</td></tr>";});
  const form=formShell('Cadastrar ou atualizar marco zero, meta e realizado','kpi',
   select('metric_code','Indicador',[...PILLARS,...SUPPLEMENTARY].map(x=>[x.code,x.title]))+
   input('baseline','Marco zero / baseline','number',"step='any'")+
   input('target','Meta acordada','number',"step='any'")+
   input('actual','Resultado observado','number',"step='any'")+
   evidence()+
   "<label class='wide'>Metodologia / observações<textarea name='notes' maxlength='1500' placeholder='Mesmo escopo e mesmo período da comparação; exclusões e sazonalidade.'></textarea></label>");
  return "<div class='perf-split'>"+form+"<section class='perf-card'><h2>Como pontuamos</h2>"+info('8 pilares com pesos 20 / 15 / 15 / 10 / 5 / 5 / 15 / 15. Além deles, 7 métricas operacionais de apoio. Preencher marco zero, meta e realizado do mesmo escopo e período. O marco zero é o desempenho anterior ao CIP; medidas sem fonte não são comprovadas.')+"</section></div><section class='perf-card'><h2>Registros de indicadores</h2>"+table(['Empresa','Indicador','Marco zero','Meta','Realizado','Origem','Evidência'],rows)+readonlyHint()+"</section>";
 }
 function processes(){
  const p=productivity(data.processes);
  const fields=input('process_key','Código único do processo','text',"minlength='3' maxlength='100' placeholder='ex.: cotacao_b2b'")+
   input('process_name','Nome do processo','text',"minlength='3' maxlength='160'")+
   input('baseline_minutes','Minutos antes do CIP','number',"step='0.001' min='0'")+
   input('current_minutes','Minutos com CIP','number',"step='0.001' min='0'")+
   input('monthly_executions','Execuções comparáveis no mês','number',"step='1' min='0'")+
   input('supervision_hours','Horas de supervisão adicional','number',"step='0.001' min='0' value='0'")+
   input('rework_hours','Horas de retrabalho adicional','number',"step='0.001' min='0' value='0'")+
   input('monthly_productive_hours','Horas produtivas / pessoa / mês','number',"step='0.001' min='1' value='160'")+
   input('estimated_hour_cost','Custo-hora informativo (R$)','number',"step='0.01' min='0'")+
   evidence();
  const rows=data.processes.map(x=>{const r=productivity([x]);return "<tr><td>"+esc(companiesNames[x.company_id])+"</td><td>"+esc(x.process_name)+"</td><td>"+fmt(x.baseline_minutes,'MINUTES')+"</td><td>"+fmt(x.current_minutes,'MINUTES')+"</td><td>"+x.monthly_executions+"</td><td>"+fmt(r.netHours,'HOURS')+"</td><td>"+fmt(r.fteEquivalent,'COUNT')+"</td></tr>";});
  const top="<div class='perf-stat-grid'>"+stat('Horas líquidas poupadas',data.processes.length?fmt(p.netHours,'HOURS'):'—','(Antes − depois) × volume, menos supervisão/retrabalho')+
   stat('Capacidade equivalente',data.processes.length?fmt(p.fteEquivalent,'COUNT'):'—','FTE estimado, não empregados eliminados')+
   stat('Custo-hora ilustrativo',data.processes.length?fmt(p.indicativeLaborValue,'BRL'):'—','Não incorpora o benefício financeiro aprovado')+"</div>";
  return top+"<div class='perf-split'>"+formShell('Nova medição de velocidade e trabalho','process',fields)+"<section class='perf-card'><h2>Critérios</h2>"+info('Medir operações do mesmo tipo, qualidade, dificuldade e volume. Descontar revisão humana, monitoramento e retrabalho. Ganho de capacidade só vira economia financeira se houver despesas comprovadamente reduzidas ou contratações evitadas, com pareceres independentes.')+"</section></div><section class='perf-card'><h2>Histórico de processos</h2>"+table(['Empresa','Processo','Antes','Depois','Execuções','Horas líquidas','FTE'],rows)+"</section>";
 }
 function agents(){
  const a=agentsSummary(data.agents);
  const fields=input('agent_key','Agente / missão','text',"minlength='2' maxlength='100' placeholder='ex.: faro, doquita, bot_radar'")+
   input('analyses','Análises realizadas','number',"min='0' step='1'")+
   input('actions_recommended','Ações recomendadas','number',"min='0' step='1'")+
   input('actions_executed','Ações executadas','number',"min='0' step='1'")+
   input('actions_effective','Ações eficazes com evidência','number',"min='0' step='1'")+
   input('tasks_eligible','Tarefas elegíveis à automação','number',"min='0' step='1'")+
   input('tasks_automatic','Tarefas realmente automáticas','number',"min='0' step='1'")+
   input('before_decision_minutes','Tempo decisório anterior (min)','number',"min='0' step='0.001'")+
   input('after_decision_minutes','Tempo decisório atual (min)','number',"min='0' step='0.001'")+
   evidence();
  const rows=data.agents.map(x=>{const r=agentsSummary([x]);return "<tr><td>"+esc(companiesNames[x.company_id])+"</td><td>"+esc(x.agent_key)+"</td><td>"+x.analyses+"</td><td>"+x.actions_recommended+"</td><td>"+x.actions_executed+"</td><td>"+x.actions_effective+"</td><td>"+fmt(r.efficacyPct,'PCT')+"</td><td>"+fmt(r.automationPct,'PCT')+"</td></tr>";});
  return "<div class='perf-stat-grid'>"+stat('Análises registradas',data.agents.length?fmt(a.analyses,'COUNT'):'—','Medidas capturadas/informadas')+
    stat('Efetividade de ações',fmt(a.efficacyPct,'PCT'),'Execuções eficazes / executadas')+
    stat('Automação',fmt(a.automationPct,'PCT'),'Execuções automáticas / elegíveis')+"</div>"+
    "<div class='perf-split'>"+formShell('Nova medição de agentes e coordenação','agent',fields)+"<section class='perf-card'><h2>Agentes inteligentes</h2>"+info('Quantidade de pesquisas não é resultado. Medir evidências válidas, ações concluídas, velocidade de decisão e impactos auditados. Não classificar tarefas manuais como automáticas. A execução autônoma depende de integração e logs homologados.')+"</section></div>"+
    "<section class='perf-card'><h2>Histórico de ações e agentes</h2>"+table(['Empresa','Agente','Análises','Recomendadas','Executadas','Eficazes','Efetividade','Automação'],rows)+"</section>";
 }
 function benefits(){
  const summary=verifiedBenefits(data.benefits,data.approvals),s=scoreForCurrent(),bonus=s?bonusSimulation(s,summary):null;
  const fields=input('source_key','Identificador único da evidência','text',"minlength='8' maxlength='180' placeholder='ERP:PEDIDO:12345'")+
   select('benefit_type','Categoria',Object.entries(benefitNames))+
   input('gross_value','Benefício incremental bruto R$','number',"min='0' step='0.01'")+
   input('incremental_cost','Custo incremental R$','number',"min='0' step='0.01' value='0'")+
   input('reversals','Estornos/devoluções R$','number',"min='0' step='0.01' value='0'")+
   input('description','Descrição objetiva do ganho','text',"minlength='10' maxlength='250'")+
   evidence();
  const rows=summary.events.map(x=>{
   const reviewer=data.reviewers.find(r=>r.company_id===x.company_id),already=data.approvals.some(a=>a.event_id===x.id&&a.review_role===reviewer?.review_role);
   const canReview=reviewer&&!already&&x.created_by!==user.id&&x.validation==='pendente';
   let signoff='';
   if(canReview)signoff="<form class='perf-review' data-perf-form='approval'><input type='hidden' name='event_id' value='"+esc(x.id)+"'><input type='hidden' name='company_id' value='"+esc(x.company_id)+"'><select name='decision'><option value='aprovado'>Aprovar</option><option value='rejeitado'>Rejeitar</option></select><input name='evidence_note' minlength='10' required placeholder='Justificativa verificável'><button class='btn secondary' type='submit'>Parecer</button></form>";
   return "<tr><td>"+esc(companiesNames[x.company_id])+"</td><td>"+esc(x.source_key)+"<div class='perf-muted'>"+esc(x.description)+"</div></td><td>"+esc(benefitNames[x.benefit_type]||x.benefit_type)+"</td><td>"+fmt(x.gross_value,'BRL')+"</td><td>"+fmt(x.incremental_cost,'BRL')+"</td><td>"+fmt(x.reversals,'BRL')+"</td><td>"+fmt(x.net,'BRL')+"</td><td><span class='perf-state "+(x.validation==='validado'?'ok':x.validation==='rejeitado'?'no':'')+"'>"+esc(x.validation)+"</span>"+signoff+"</td></tr>";
  });
  return "<div class='perf-stat-grid'>"+stat('Ganho líquido submetido',data.benefits.length?fmt(summary.netSubmitted,'BRL'):'—','Não equivale a ganho aprovado')+
   stat('Ganho com dupla aprovação',data.benefits.length?fmt(summary.netValidated,'BRL'):'—','Controladoria + Diretoria')+
   stat('Prévia de participação (6%)',bonus?.available?fmt(bonus.amount,'BRL'):'—','Índice completo necessário; não gera pagamento')+"</div>"+
   "<div class='perf-split'>"+formShell('Registrar resultado financeiro incremental','benefit',fields)+
   "<section class='perf-card'><h2>Regras para bonificação</h2>"+info('Exigir base histórica e aprovação independente. O saldo de estoque liberado não é lucro; considerar apenas o custo financeiro comprovado. Nunca lançar duas vezes a mesma margem obtida no Caderninho ou na venda normal. Usar chave única por evento de origem. O percentual de 6% é uma referência de negociação, não contrato.')+
   info('Atribuição: cada evento deve ter uma ação do CIP identificável, número rastreável, custos/reversões e uma prova verificável. Só há ganho validado após pareceres distintos de Controladoria e Diretoria.')+"</section></div>"+
   "<section class='perf-card'><h2>Livro de benefícios e validações</h2>"+table(['Empresa','Origem / descrição','Tipo','Bruto','Custos','Estornos','Líquido','Situação'],rows)+"</section>";
 }
 function governance(){
  const r=data.reviewers;
  return "<div class='perf-split'><section class='perf-card'><h2>Critérios de validação</h2>"
   +"<p>1. Estabelecer marco zero por empresa, processo, filial e canal.<br>2. Comparar período de mesma duração, sazonalidade e escopo.<br>3. Registrar origem, ação CIP, responsável e evidências.<br>4. Medir velocidade, qualidade, falhas e necessidade de revisão humana.<br>5. Conciliar os ganhos e descontar custos incrementais e estornos.<br>6. Requerer pareceres independentes da Controladoria e da Diretoria.<br>7. Tratar a bonificação como simulação até contrato formal e fechamento.</p>"
   +info('Cada pessoa deve ser formalmente designada como revisora no backend; o próprio autor do lançamento não pode aprová-lo. A mesma pessoa não pode fazer os dois pareceres. Não existe aprovação automática por superadm.')+"</section>"
   +"<section class='perf-card'><h2>Revisores autorizados nesta sessão</h2>"+
   (r.length?r.map(x=>"<p>"+esc(companiesNames[x.company_id])+" · "+esc(x.review_role)+"</p>").join(''):"<div class='perf-empty'>Sem designação independente para esta conta. Os benefícios permanecerão pendentes até a governança configurar os revisores.</div>")+
   "<h3>Qualidade dos dados</h3>"+info('No momento os lançamentos nesta interface são manuais. Futuras leituras do ERP, processos e agentes precisam de contratos de dados, cobertura e logs antes de receberem selo de integração homologada.')+"</section></div>";
 }
 async function submit(form){
  if(!isAlive())return;
  const action=form.dataset.perfForm;
  if(action!=='approval'&&(readOnly||selected==='all')){setMessage('Acesso somente leitura ou empresa não selecionada.');return;}
  const fd=new FormData(form);const raw=Object.fromEntries(fd.entries());const p=range(month);
  if(!p)return;
  const numeric=(key)=>{const v=String(raw[key]??'').trim();return v===''?null:Number(v);};
  const note=String(raw.evidence||'').trim();
  if(action!=='approval'&&note.length<12){setMessage('Informe evidência verificável com pelo menos 12 caracteres.');return;}
  const common={company_id:selected,period_start:p.start,period_end:p.end,created_by:user.id,evidence:note};
  let table,payload,method='insert',onConflict=null;
  if(action==='kpi'){
   const metric=[...PILLARS,...SUPPLEMENTARY].find(x=>x.code===raw.metric_code);
   if(!metric)return;
   const base=numeric('baseline'),target=numeric('target'),actual=numeric('actual');
   if([base,target,actual].some(x=>x===null||!Number.isFinite(x))||pillarProgress({baseline:base,target,actual},metric)===null){
    setMessage('Marco zero, meta ou realizado inválidos. A meta precisa melhorar o baseline no sentido correto.');return;
   }
   table='cip_perf_kpi_records';method='upsert';onConflict='company_id,metric_code,period_start,period_end';
   payload={...common,metric_code:metric.code,baseline:base,target,actual,source_kind:'manual',notes:String(raw.notes||'')};
  }else if(action==='process'){
   const keys=['baseline_minutes','current_minutes','monthly_executions','supervision_hours','rework_hours','monthly_productive_hours'];
   if(keys.some(k=>numeric(k)===null||numeric(k)<0)||numeric('monthly_productive_hours')<=0){setMessage('Preencha os tempos e volumes com números válidos.');return;}
   table='cip_perf_process_samples';payload={...common,process_key:String(raw.process_key).trim(),process_name:String(raw.process_name).trim(),
    baseline_minutes:numeric('baseline_minutes'),current_minutes:numeric('current_minutes'),monthly_executions:numeric('monthly_executions'),
    supervision_hours:numeric('supervision_hours'),rework_hours:numeric('rework_hours'),monthly_productive_hours:numeric('monthly_productive_hours'),
    estimated_hour_cost:numeric('estimated_hour_cost')};
  }else if(action==='agent'){
   const keys=['analyses','actions_recommended','actions_executed','actions_effective','tasks_eligible','tasks_automatic'];
   if(keys.some(k=>numeric(k)===null||!Number.isInteger(numeric(k))||numeric(k)<0)||numeric('actions_effective')>numeric('actions_executed')||numeric('actions_executed')>numeric('actions_recommended')||numeric('tasks_automatic')>numeric('tasks_eligible')){
    setMessage('Ações e tarefas inconsistentes. Os resultados não podem exceder as ações executadas ou elegíveis.');return;
   }
   table='cip_perf_agent_samples';payload={...common,agent_key:String(raw.agent_key).trim(),analyses:numeric('analyses'),actions_recommended:numeric('actions_recommended'),
    actions_executed:numeric('actions_executed'),actions_effective:numeric('actions_effective'),tasks_eligible:numeric('tasks_eligible'),tasks_automatic:numeric('tasks_automatic'),
    before_decision_minutes:numeric('before_decision_minutes'),after_decision_minutes:numeric('after_decision_minutes'),source_kind:'manual'};
  }else if(action==='benefit'){
   if(['gross_value','incremental_cost','reversals'].some(k=>numeric(k)===null||numeric(k)<0)){setMessage('Informe valores financeiros positivos ou zero.');return;}
   table='cip_perf_financial_events';payload={...common,source_key:String(raw.source_key).trim(),benefit_type:raw.benefit_type,description:String(raw.description).trim(),
    gross_value:numeric('gross_value'),incremental_cost:numeric('incremental_cost'),reversals:numeric('reversals')};
  }else if(action==='approval'){
   const event=data.benefits.find(x=>x.id===raw.event_id&&x.company_id===raw.company_id);
   if(!event||event.created_by===user.id||!data.reviewers.some(x=>x.company_id===event.company_id)){setMessage('Parecer não autorizado para esta conta.');return;}
   table='cip_perf_financial_approvals';payload={event_id:event.id,company_id:event.company_id,reviewer_id:user.id,
    review_role:data.reviewers.find(x=>x.company_id===event.company_id).review_role,decision:raw.decision,evidence_note:String(raw.evidence_note||'').trim()};
   if(payload.evidence_note.length<10){setMessage('Informe uma justificativa verificável.');return;}
  }else return;
  try{
   setMessage('Registrando lançamento autorizado...');
   const q=db.from(table);const result=method==='upsert'?await q.upsert(payload,{onConflict}):await q.insert(payload);
   if(result.error)throw result.error;
   setMessage('Lançamento registrado. Recarregando a apuração provisória.');
   await load();
  }catch(error){setMessage('Não foi possível registrar: '+(error.message||'verifique permissões e duplicidade')+'.');}
 }
 root.addEventListener('change',event=>{
  if(event.target.matches('[data-perf-company]')){selected=event.target.value;load();}
  if(event.target.matches('[data-perf-month]')){month=event.target.value;load();}
 });
 root.addEventListener('click',event=>{
  const t=event.target.closest('[data-perf-tab]');
  if(t){tab=t.dataset.perfTab;render();}
  if(event.target.closest('[data-perf-refresh]'))load();
 });
 root.addEventListener('submit',event=>{
  const form=event.target.closest('[data-perf-form]');
  if(form){event.preventDefault();submit(form);}
 });
 load();
}
