import {OPS_GROUPS,OPS_READINESS,OPS_PROVIDER_LINKS,metricTotals,budgetSignal,creditSignal,opsHealth,formatCount,formatUSD,cleanCsv,groupByProvider} from './ops-consumption-engine.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=x=>x?new Date(x).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'N/D';
const companyNames={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
const month=()=>new Date().toISOString().slice(0,7)+'-01';
const numberOrNull=s=>s===null||String(s).trim()===''?null:Number(s);
export function consumptionFrame(){
 return '<section class="ops" id="cipConsumption">'+
 '<header class="ops-head"><div class="ops-brand"><img src="./logo-grupo-prohospital.jpg" alt="Marca oficial Grupo Prohospital"><div><small>CIP360 · CONSELHO DE INTELIGÊNCIA OPERACIONAL</small><h1>Central de Consumo e Continuidade</h1><p>IA, agentes, pesquisa, créditos, infraestrutura e execução 24/7.</p></div></div><div class="ops-controls"><label>Empresa<select data-ops-company></select></label><label>Período<select data-ops-period><option value="7">7 dias</option><option value="30">30 dias</option><option selected value="90">90 dias</option><option value="120">120 dias</option></select></label><button class="btn secondary" data-ops-refresh>Atualizar</button></div></header>'+
 '<p class="ops-status" role="status" data-ops-status>Conferindo dados...</p><div class="ops-kpis" data-ops-kpis></div>'+
 '<div class="ops-continuity"><div><small>CONTINUIDADE OPERACIONAL</small><h2>Observabilidade, eficiência e fallback seguro</h2><p>O monitor opera sem IA. Provedores alternativos exigem acesso e homologação; não há troca automática de contas neste estágio.</p></div><div class="ops-lights" data-ops-health></div></div>'+
 '<section class="ops-org"><div class="ops-section-head"><div><small>CIP GUARDIAN · AUDITORIA CONTÍNUA</small><h2>Saúde da operação</h2><p>Verificações determinísticas a cada 10 minutos. Sem dados recentes, o estado é desconhecido.</p></div></div><div data-guardian role="status" aria-live="polite">Consultando...</div></section>'+ 
 '<section class="ops-org"><div class="ops-section-head"><div><small>GUARDIAN · PLANO DE AÇÃO</small><h2>Incidentes e responsáveis</h2><p>O diagnóstico abre incidentes sem duplicação. Somente nova verificação regular encerra a ocorrência.</p></div></div><div data-guardian-incidents>Consultando...</div><p role="status" data-incident-message></p></section>'+ 
 '<section class="ops-org" data-ops-org hidden><div class="ops-section-head"><div><small>CONCILIAÇÃO FINANCEIRA GLOBAL</small><h2>Contas administrativas dos provedores</h2><p>Custos desta seção pertencem à organização. Nunca são duplicados entre Shopping e Distribuidora sem atribuição por projeto homologada.</p></div></div><div data-ops-org-cards></div></section>'+ 
 '<div class="ops-columns"><section class="ops-main"><div class="ops-section-head"><div><small>CONSUMO POR SERVIÇO</small><h2>Mapa de provedores e plataformas</h2><p>O financeiro acompanha gastos reais; a operação acompanha tokens, falhas e disponibilidade.</p></div><button class="btn secondary" data-ops-export>Exportar CSV</button></div><div data-ops-services></div></section>'+
 '<aside class="ops-sidebar"><h2>Alertas de continuidade</h2><div data-ops-alerts></div><div class="ops-governance"><strong>Política de responsabilidade</strong><p>Tokens observados não equivalem a cobrança. Orçamento registrado não altera o limite contratado. Saldo informado manualmente é identificado. Não armazenamos chaves, prompts nem respostas.</p></div><div class="ops-fallback"><strong>Sequência de economia</strong><p>1. Regras e cache sem tokens</p><p>2. Coleta direta autorizada e feeds</p><p>3. IA apenas nas análises relevantes</p><p>4. Circuit breaker e alertas por fornecedor</p><p>5. Alternativa habilitada após homologação</p></div></aside></div>'+
 '<section class="ops-history"><div class="ops-section-head"><div><small>TRILHA DE AUDITORIA</small><h2>Últimas execuções atribuídas</h2><p>Chamadas com métricas e falhas separadas, sem transformar consumo desconhecido em zero.</p></div></div><div data-ops-history></div></section>'+
 '<p class="ops-foot">A tela reconsulta os registros a cada 90 segundos quando visível. O banco consolida históricos a cada 10 minutos, sem usar tokens. Faturas e créditos precisam de integração administrativa por fornecedor ou conciliação manual.</p></section>';
}
export function mountConsumption({db,user,companies:scope=[],onDispose}){
 const root=document.getElementById('cipConsumption');if(!root)return;
 const $=s=>root.querySelector(s);
 const live=()=>active&&root.isConnected&&window.cipAuth?.email===user.email;
 let active=true,requestId=0,company=scope.includes('shopping_prohospital')?'shopping_prohospital':scope[0],period=90,busy=false;
 let providers=[],daily=[],billing=[],alerts=[],history=[],faro=null,cycles=[],globalSnapshots=[],globalStates=[],globalFailed=false,guardian=[],guardianFailed=false,incidents=[],incidentEvents=new Map(),incidentFailed=false;
 const notice=t=>{if(live())$('[data-ops-status]').textContent=t;};
 const statement=p=>billing.find(b=>b.provider===p);
 $('[data-ops-company]').innerHTML=scope.map(c=>'<option value="'+esc(c)+'">'+esc(companyNames[c]||c)+'</option>').join('');
 $('[data-ops-company]').value=company;
 function renderGlobal(){
  const host=$('[data-ops-org]');
  if(window.cipAuth?.role!=='superadm'){host.hidden=true;return;}
  host.hidden=false;
  const names={openai:'OpenAI',anthropic:'Anthropic Claude',dataforseo:'DataForSEO',deepseek:'DeepSeek'};
  const st=globalStates.length?globalStates:[{provider:'openai',state:'not_configured'},{provider:'anthropic',state:'not_configured'},{provider:'dataforseo',state:'not_configured'},{provider:'deepseek',state:'not_configured'}];
  $('[data-ops-org-cards]').innerHTML=(globalFailed?'<p class="ops-note">Relatório global indisponível. Verifique o acesso e o estado da sincronização.</p>':'')+
   '<div class="ops-org-grid">'+st.map(x=>{
    const snap=globalSnapshots.find(s=>s.provider===x.provider);
    const spent=snap?.month_spend_usd==null?'Não informado':formatUSD(snap.month_spend_usd);
    const balance=snap?.credit_balance==null?'Não disponibilizado':String(snap.credit_currency||'USD')+' '+Number(snap.credit_balance).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:6});
    const source=snap?.cost_basis==='api_reported_precredits'?'Uso reportado, antes de créditos':
     snap?.cost_basis==='api_reported_cost'?'Custos reportados pela API (não fatura final)':
     snap?.cost_basis==='balance_only'?'Somente saldo; sem despesas do mês':'Sem relatório oficial';
    return '<article class="ops-org-card"><div class="ops-org-card-top"><b>'+esc(names[x.provider]||x.provider)+'</b><span>'+esc(x.state||'não conectado')+'</span></div>'+
     '<div><small>Despesa reportada no mês</small><strong>'+esc(spent)+'</strong></div>'+
     '<div><small>Saldo de créditos</small><strong>'+esc(balance)+'</strong></div>'+
     '<p class="ops-note">'+esc(source)+'</p><p class="ops-note">Última consulta: '+esc(date(x.last_attempt_at))+' · Último sucesso: '+esc(date(x.last_success_at))+'</p>'+
     (x.last_error_code?'<p class="ops-org-error">Diagnóstico: '+esc(x.last_error_code)+'</p>':'')+
     '<p class="ops-note">Conta organizacional · sem rateio automático e sem inferência de saldo ausente.</p></article>';
   }).join('')+'</div>';
 }
 function renderGuardian(){
  const host=$('[data-guardian]');if(!host)return;
  if(guardianFailed||!guardian.length){host.textContent='Verificações indisponíveis ou não autorizadas. Nenhum estado saudável inferido.';return;}
  const titles={faro:'Radar Faro',queue:'Fila de pesquisa',agents:'Ciclos de agentes',erp:'ERP conciliado',stock:'Atualidade do estoque',execution:'Decisões e tarefas',billing:'Custos e créditos',results:'Comprovação financeira',procfit_source:'Origem Procfit · locações'};
  const labels={critical:'Crítico',warning:'Atenção',ok:'Dentro do critério',unknown:'Indeterminado',paused:'Pausado'};
  const fmt=n=>n==null?'N/D':formatCount(n);
  const details=x=>{const d=x.detail||{};switch(x.check_code){
    case 'faro':return 'Última conclusão: '+date(d.last_completed)+' · últimas 24h: '+fmt(d.completed_24h)+' concluídas / '+fmt(d.failed_24h)+' falhas · limite diário '+fmt(d.daily_limit)+(d.circuit_until?' · proteção até '+date(d.circuit_until):'');
    case 'queue':return fmt(d.queued_over_1h)+' tarefas aguardando há mais de 1 hora';
    case 'agents':return 'Último ciclo: '+date(d.last_run)+' · não comprova resultado';
    case 'erp':return 'Última base conciliada: '+date(d.last_approved_snapshot);
    case 'stock':return 'Referência: '+(d.reference_date||'N/D')+' · '+fmt(d.suggested_actions)+' sugestões';
    case 'execution':return fmt(d.suggested_stock_actions)+' sugestões de estoque · '+fmt(d.decision_records)+' decisões · '+fmt(d.tower_task_records)+' tarefas';
    case 'billing':return 'Última referência de custo: '+date(d.last_company_billing_snapshot)+' · '+fmt(d.unknown_cost_events_24h)+' eventos sem custo em 24h';
    case 'results':return fmt(d.financial_approval_records)+' registros de aprovação; não equivalem a benefício realizado';
    case 'procfit_source':return 'Estado da origem: '+(d.status||'N/D')+' · último recebimento '+date(d.last_received);
    default:return 'Sem interpretação definida';
  }};
  const rank={critical:0,warning:1,unknown:2,paused:3,ok:4};
  const fresh=x=>{const t=Date.parse(x.checked_at);return Number.isFinite(t)&&t<=Date.now()+60000&&Date.now()-t<=25*60000;};
  const state=x=>fresh(x)&&Object.hasOwn(labels,x.severity)?x.severity:'unknown';
  host.innerHTML='<div class="ops-org-grid">'+[...guardian].sort((a,b)=>rank[state(a)]-rank[state(b)]).map(x=>'<article class="ops-service"><div class="ops-service-top"><strong>'+esc(titles[x.check_code]||x.check_code)+'</strong><span>'+esc(labels[state(x)])+'</span></div><p>'+esc(fresh(x)?details(x):'Verificação vencida; dados anteriores não confirmam estado atual.')+'</p><small>Verificado: '+esc(date(x.checked_at))+'</small></article>').join('')+'</div>';
 }
 function renderIncidents(){
  const host=$('[data-guardian-incidents]');
  if(incidentFailed){host.textContent='Incidentes indisponíveis ou sem autorização.';return;}
  if(!incidents.length){host.textContent='Nenhum incidente aberto visível para este perfil. Consulte a saúde das fontes.';return;}
  const labels={faro:'Radar Faro',queue:'Fila de pesquisa',agents:'Ciclos de agentes',erp:'ERP conciliado',stock:'Estoque',execution:'Decisões e tarefas',billing:'Custos e créditos',results:'Resultados financeiros',procfit_source:'Origem Procfit'};
  const stages={triagem:'Triagem',em_tratamento:'Em tratamento',aguardando_validacao:'Aguardando validação'};
  const nextStep={faro:'Validar cota e fontes antes de retomar.',queue:'Revisar fila e circuito sem reprocessar tarefas antigas automaticamente.',erp:'Obter e conciliar a base ERP.',stock:'Atualizar referência e conciliar saldo.',execution:'Revisar sugestões com responsável comercial.',billing:'Conciliar custos com comprovantes.',results:'Registrar evidências financeiras.',procfit_source:'Verificar serviço VM, acesso de leitura e contrato da view.'};
  const sorted=[...incidents].sort((a,b)=>Number(b.severity==='critical')-Number(a.severity==='critical')||Date.parse(a.opened_at)-Date.parse(b.opened_at));
  host.innerHTML='<p><b>'+sorted.length+' incidentes abertos</b> · '+sorted.filter(x=>x.severity==='critical').length+' críticos</p><div class="ops-org-grid">'+sorted.map(i=>{
   const logs=incidentEvents.get(i.id),last=logs?.[0],overdue=last&&Date.parse(last.due_at)<Date.now();
   return '<article class="ops-service"><div class="ops-service-top"><strong>'+esc(labels[i.check_code]||i.check_code)+'</strong><span>'+esc(i.severity==='critical'?'Crítico':'Atenção')+'</span></div><p>'+esc(nextStep[i.check_code]||'Investigar diagnóstico.')+'</p><p><b>'+esc(logs===null?'Histórico indisponível':last?stages[last.stage]:'Sem responsável')+'</b>'+ (last?' · '+esc(last.owner_name)+' · '+esc(date(last.due_at))+(overdue?' · PRAZO VENCIDO':''):'')+'</p><small>Aberto em '+esc(date(i.opened_at))+' · visto '+esc(date(i.last_seen_at))+'</small>'+
    '<details><summary>Tratar incidente e consultar histórico</summary><form data-guardian-incident="'+esc(i.id)+'"><label>Responsável<input name="owner" required minlength="3" maxlength="120" value="'+esc(last?.owner_name||'')+'"></label><label>Etapa<select name="stage">'+Object.entries(stages).map(([k,v])=>'<option value="'+esc(k)+'"'+(last?.stage===k?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label><label>Prazo (horário do dispositivo)<input type="datetime-local" name="due" required></label><label class="ops-full">Ação e evidência<textarea name="note" required minlength="10" maxlength="2000" rows="3"></textarea></label><button type="submit" class="btn">Registrar tratamento</button></form>'+
    '<p>Últimos cinco registros</p>'+(logs===null?'<p>Não foi possível consultar o histórico.</p>':logs?.length?logs.map(e=>'<p><b>'+esc(stages[e.stage])+'</b> · '+esc(e.owner_name)+' · '+esc(date(e.created_at))+'<br>'+esc(e.note)+'</p>').join(''):'<p>Sem histórico de tratamento.</p>')+'</details></article>';
  }).join('')+'</div>';
 }
 async function saveIncident(form){
  if(busy||!live())return;
  const item=incidents.find(i=>i.id===form.dataset.guardianIncident&&i.company_id===company);if(!item)return;
  const f=new FormData(form),due=new Date(String(f.get('due')||'')),owner=String(f.get('owner')||'').trim(),note=String(f.get('note')||'').trim(),stage=String(f.get('stage'));
  const msg=$('[data-incident-message]');if(!Number.isFinite(due.getTime())||due.getTime()<=Date.now()||due.getTime()>Date.now()+365*86400000||owner.length<3||note.length<10||!['triagem','em_tratamento','aguardando_validacao'].includes(stage)){msg.textContent='Confira responsável, etapa, prazo futuro e evidência de pelo menos dez caracteres.';return;}
  busy=true;const button=form.querySelector('button[type=submit]');button.disabled=true;
  try{const result=await db.from('cip_guardian_incident_events').insert({incident_id:item.id,company_id:item.company_id,stage,owner_name:owner,due_at:due.toISOString(),note});
   if(!live()||company!==item.company_id)return;
   if(result.error){msg.textContent='Registro recusado. Verifique acesso, prazo e se o incidente continua aberto.';return;}
   await load();if(live()&&company===item.company_id)$('[data-incident-message]').textContent='Tratamento registrado e auditado. A resolução depende de nova verificação.';
  }catch{if(live()&&company===item.company_id)msg.textContent='Falha ao registrar. Confira a conexão e o histórico antes de tentar novamente.';}
  finally{busy=false;button.disabled=false;}
 }
 function render(){
  renderGlobal();
  renderGuardian();
  renderIncidents();
  const totals=metricTotals(daily),totalsByProvider=groupByProvider(daily),official=billing.filter(b=>b.source==='provider_api'&&b.month_spend_usd!==null);
  const known=official.length?formatUSD(official.reduce((x,b)=>x+Number(b.month_spend_usd),0)):'Não conectado';
  const kpis=[['Tokens de entrada',formatCount(totals.input),'Medições registradas'],['Tokens de saída',formatCount(totals.output),'Não inclui solicitações sem métricas'],['Pesquisas web',formatCount(totals.searches),'Chamadas contabilizadas nos resultados'],['Falhas registradas',formatCount(totals.failed),'Investigar sem repetir em excesso'],['Custo confirmado',known,'Somente relatórios administrativos'],['Eventos auditados',formatCount(totals.events),'Histórico, não cobrança']];
  $('[data-ops-kpis]').innerHTML=kpis.map(([label,value,sub],i)=>'<article class="ops-kpi '+(i===3&&totals.failed?'ops-risk':'')+'"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(sub)+'</span></article>').join('');
  const health=opsHealth(faro,totals,cycles[0]?.created_at);
  $('[data-ops-health]').innerHTML='<div class="ops-health" data-health="'+esc(health.kind)+'"><b>Radar Faro</b><span>'+esc(health.label)+'</span></div>'+
  '<div class="ops-health"><b>Último ciclo de agentes</b><span>'+esc(cycles.length?date(cycles[0].created_at):'Não consultável')+'</span></div>'+
  '<div class="ops-health"><b>Serviços cadastrados</b><span>'+providers.length+' fontes, sem pressupor contratos ativos</span></div>';
  const categories=[...new Set(providers.map(p=>p.category))];
  $('[data-ops-services]').innerHTML=categories.map(category=>'<div class="ops-category"><h3>'+esc(OPS_GROUPS[category]||category)+'</h3><div class="ops-cards">'+providers.filter(p=>p.category===category).map(p=>{
   const usage=totalsByProvider.get(p.provider)||{input:0,output:0,failed:0,searches:0},bill=statement(p.provider);
   const signal=budgetSignal(p,bill),credit=creditSignal(bill),link=OPS_PROVIDER_LINKS[p.provider];
   const budgetValue=p.monthly_budget_usd===null?'Não definido':formatUSD(p.monthly_budget_usd);
   return '<article class="ops-service"><div class="ops-service-top"><strong>'+esc(p.display_name)+'</strong><span>'+esc(OPS_READINESS[p.readiness]||p.readiness)+'</span></div>'+
    '<div class="ops-service-stats"><div><small>Tokens entrada / saída</small><b>'+formatCount(usage.input)+' / '+formatCount(usage.output)+'</b></div><div><small>Falhas</small><b>'+formatCount(usage.failed)+'</b></div></div>'+
    '<div class="ops-service-stats"><div><small>Despesa informada</small><b>'+esc(bill?.month_spend_usd===null||!bill?'N/D':formatUSD(bill.month_spend_usd))+'</b></div><div><small>Crédito conhecido</small><b>'+esc(bill?.credit_balance_usd===null||!bill?'N/D':formatUSD(bill.credit_balance_usd))+'</b></div></div>'+
    '<p class="ops-provenance">'+esc(credit.label)+(bill?' · '+esc(date(bill.observed_at)):'')+'</p>'+
    '<p class="ops-budget-status" data-status="'+esc(signal.kind)+'">'+esc(signal.label)+'</p>'+
    '<details><summary>Orçamento, saldo e conexão</summary><p class="ops-note">'+esc(p.notes||'Integração pendente')+'</p>'+
    '<p class="ops-note">Orçamento mensal: '+esc(budgetValue)+'. A edição não altera o teto contratado no provedor.</p>'+
    '<form data-ops-budget="'+esc(p.provider)+'"><label>Mensal (USD)<input name="monthly" type="number" min="0" step="0.01" value="'+esc(p.monthly_budget_usd??'')+'"></label>'+
    '<label>Diário (USD)<input name="daily" type="number" min="0" step="0.01" value="'+esc(p.daily_budget_usd??'')+'"></label>'+
    '<label>Aviso (%)<input name="warning" type="number" min="10" max="95" value="'+esc(p.warn_percent)+'"></label>'+
    '<label>Crítico (%)<input name="critical" type="number" min="50" max="100" value="'+esc(p.critical_percent)+'"></label>'+
    '<label class="ops-full">Justificativa<textarea name="reason" rows="2" maxlength="300" required placeholder="Explique a política"></textarea></label>'+
    '<button type="submit" class="btn">Salvar orçamento auditado</button></form>'+
    '<form data-ops-manual="'+esc(p.provider)+'"><p class="ops-note"><b>Conciliação manual</b> — não é saldo confirmado automaticamente.</p>'+
    '<label>Despesa do mês (USD)<input name="spent" type="number" min="0" step="0.01" placeholder="Opcional"></label>'+
    '<label>Créditos restantes (USD)<input name="credits" type="number" min="0" step="0.01" placeholder="Opcional"></label>'+
    '<label class="ops-full">Fonte e documento<input name="reference" maxlength="120" minlength="6" placeholder="Origem do lançamento" required></label>'+
    '<button type="submit" class="btn secondary">Registrar saldo manual</button></form>'+
    (link?'<p><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Consultar fornecedor</a></p>':'')+'</details></article>';
  }).join('')+'</div></div>').join('')||'<p>Sem fornecedores autorizados.</p>';
  $('[data-ops-alerts]').innerHTML=alerts.filter(a=>!a.resolved_at).slice(0,12).map(a=>'<article class="ops-alert" data-level="'+esc(a.severity)+'"><b>'+esc(a.provider)+' · '+esc(a.severity)+'</b><p>'+esc(a.message)+'</p><small>'+esc(date(a.last_seen_at))+'</small></article>').join('')||
   '<p class="ops-note">Sem novos alertas. Ausência de dados não significa serviço saudável.</p>';
  $('[data-ops-history]').innerHTML=history.length?'<div class="ops-table-scroll"><table><thead><tr><th>Quando</th><th>Agente</th><th>Provedor</th><th>Modelo</th><th>Entrada</th><th>Saída</th><th>Estado</th><th>Custo</th></tr></thead><tbody>'+
   history.map(e=>'<tr><td>'+esc(date(e.occurred_at))+'</td><td>'+esc(e.agent)+'</td><td>'+esc(e.provider)+'</td><td>'+esc(e.model||'N/D')+'</td><td>'+esc(e.input_tokens===null?'N/D':formatCount(e.input_tokens))+'</td><td>'+esc(e.output_tokens===null?'N/D':formatCount(e.output_tokens))+'</td><td>'+esc(e.status)+'</td><td>'+esc(formatUSD(e.cost_usd))+'</td></tr>').join('')+'</tbody></table></div>':
    '<p class="ops-note">Sem registros no período.</p>';
 }
 async function load(){
  if(!live()||!company)return;const stamp=++requestId;
  $('[data-guardian]').textContent='Consultando a empresa selecionada...';
  $('[data-guardian-incidents]').textContent='Consultando incidentes...';$('[data-incident-message]').textContent='';
  notice('Consultando agentes, custos, créditos e riscos...');
  const dateStart=new Date(Date.now()-period*86400000);
  const fetches=[
   db.from('cip_ops_provider_settings').select('*').eq('company_id',company).order('category').order('display_name'),
   db.from('cip_ops_daily_usage').select('*').eq('company_id',company).gte('day',dateStart.toISOString().slice(0,10)).order('day',{ascending:false}).limit(500),
   db.from('cip_ops_billing_current').select('*').eq('company_id',company),
   db.from('cip_ops_alerts').select('provider,severity,message,last_seen_at,resolved_at').eq('company_id',company).order('last_seen_at',{ascending:false}).limit(40),
   db.from('cip_ops_usage_events').select('agent,provider,model,occurred_at,input_tokens,output_tokens,status,cost_usd').eq('company_id',company).gte('occurred_at',dateStart.toISOString()).order('occurred_at',{ascending:false}).limit(40),
   db.from('cip_faro_config').select('enabled,failure_streak,circuit_until').eq('company_id',company).maybeSingle(),
   db.from('cip_agent_cycles').select('created_at').eq('company_id',company).order('created_at',{ascending:false}).limit(1)
  ];
  const isAdmin=window.cipAuth?.role==='superadm';
  if(isAdmin){
   fetches.push(db.from('cip_ops_global_billing_current').select('provider,account_ref,observed_at,period_month,month_spend_usd,credit_balance,credit_currency,credit_available,cost_basis,report_through,source').order('observed_at',{ascending:false}));
   fetches.push(db.from('cip_ops_global_provider_sync').select('provider,state,last_attempt_at,last_success_at,last_error_code,next_retry_at').order('provider'));
  }
  const guardianIndex=fetches.length;
  fetches.push(db.from('cip_guardian_status').select('check_code,severity,detail,checked_at,changed_at').eq('company_id',company));
  const incidentIndex=fetches.length;
  fetches.push(db.from('cip_guardian_incidents').select('id,company_id,check_code,severity,opened_at,last_seen_at,resolved_at').eq('company_id',company).is('resolved_at',null).order('opened_at'));
  const results=await Promise.allSettled(fetches);if(!live()||stamp!==requestId)return;
  const got=i=>results[i].status==='fulfilled'?results[i].value:{error:{message:'indisponível'}};
  const [a,b,c,d,e,f,g]=[0,1,2,3,4,5,6].map(got);
  providers=a.error?[]:a.data||[];daily=b.error?[]:b.data||[];
  billing=c.error?[]:c.data||[];alerts=d.error?[]:d.data||[];
  history=e.error?[]:e.data||[];faro=f.error?null:f.data||null;cycles=g.error?[]:g.data||[];
  const h=isAdmin?got(7):null,i=isAdmin?got(8):null;
  globalSnapshots=h&&!h.error?h.data||[]:[];
  globalStates=i&&!i.error?i.data||[]:[];
  globalFailed=isAdmin&&!!(h?.error||i?.error);
  const guardianResponse=got(guardianIndex);guardianFailed=!!guardianResponse.error;guardian=guardianFailed?[]:guardianResponse.data||[];
  const ir=got(incidentIndex);incidentFailed=!!ir.error;incidents=incidentFailed?[]:ir.data||[];
  const eventResponses=await Promise.allSettled(incidents.map(i=>db.from('cip_guardian_incident_events').select('stage,owner_name,due_at,note,created_at').eq('company_id',company).eq('incident_id',i.id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(5)));
  if(!live()||stamp!==requestId)return;
  incidentEvents=new Map(incidents.map((i,n)=>[i.id,eventResponses[n].status==='fulfilled'&&!eventResponses[n].value.error?eventResponses[n].value.data||[]:null]));
  render();const failed=[a,b,c,d,e,f,g,...(isAdmin?[h,i]:[]),guardianResponse,ir].filter(x=>x?.error).length;
  notice(failed?'Falha em '+failed+' fonte(s). Não interpretar dados ausentes como saldo zero.':
   'Dados consultados às '+new Date().toLocaleTimeString('pt-BR')+'. O banco registra novos eventos sem consumir tokens.');
 }
 async function saveBudget(form){
  if(busy)return;const p=providers.find(x=>x.provider===form.dataset.opsBudget);if(!p)return;
  const f=new FormData(form),monthly=numberOrNull(f.get('monthly')),dailyBudget=numberOrNull(f.get('daily')),
  warning=Number(f.get('warning')),critical=Number(f.get('critical')),reason=String(f.get('reason')||'').trim();
  if([monthly,dailyBudget].some(x=>x!==null&&(!Number.isFinite(x)||x<0))||warning>=critical||reason.length<12){notice('Política inválida: valores positivos, alertas ordenados e motivo de 12 caracteres.');return;}
  busy=true;form.querySelector('button[type=submit]').disabled=true;
  const result=await db.rpc('cip_ops_set_budget',{p_company:company,p_provider:p.provider,p_expected_version:p.version,p_monthly:monthly,p_daily:dailyBudget,p_warning:warning,p_critical:critical,p_reason:reason});
  busy=false;if(!live())return;
  if(result.error){form.querySelector('button[type=submit]').disabled=false;notice('Falha ao salvar orçamento: '+result.error.message);return;}
  await load();notice('Orçamento versionado e auditado; não altera os limites do fornecedor.');
 }
 async function saveManual(form){
  if(busy)return;const provider=form.dataset.opsManual;if(!providers.some(x=>x.provider===provider))return;
  const f=new FormData(form),spent=numberOrNull(f.get('spent')),credits=numberOrNull(f.get('credits')),ref=String(f.get('reference')||'').trim();
  if([spent,credits].some(x=>x!==null&&(!Number.isFinite(x)||x<0))||(spent===null&&credits===null)||ref.length<6){notice('Informe saldo ou despesa não negativo e referência documental.');return;}
  busy=true;form.querySelector('button[type=submit]').disabled=true;
  const now=new Date(),result=await db.from('cip_ops_billing_snapshots').insert({
   company_id:company,provider,observed_at:now.toISOString(),period_month:month(),source:'manual',currency:'USD',
   month_spend_usd:spent,credit_balance_usd:credits,reference_label:ref,created_by:user.id});
  busy=false;if(!live())return;
  if(result.error){form.querySelector('button[type=submit]').disabled=false;notice('Lançamento recusado: '+result.error.message);return;}
  await load();notice('Conciliação registrada como MANUAL; confirmar no painel do provedor.');
 }
 function exportCsv(){
  const rows=[['Empresa','Provedor','Categoria','Situação','Orçamento mensal USD','Despesa mês USD','Saldo USD','Fonte','Data']];
  for(const p of providers){const b=statement(p.provider);rows.push([company,p.provider,p.category,p.readiness,p.monthly_budget_usd,b?.month_spend_usd,b?.credit_balance_usd,b?.source,b?.observed_at]);}
  const url=URL.createObjectURL(new Blob([cleanCsv(rows)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='CIP360_Consumo_'+company+'.csv';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
 }
 root.addEventListener('submit',e=>{const f=e.target.closest('form[data-ops-budget],form[data-ops-manual],form[data-guardian-incident]');if(!f)return;e.preventDefault();if(f.dataset.guardianIncident)saveIncident(f);else if(f.dataset.opsBudget)saveBudget(f);else saveManual(f);});
 root.addEventListener('click',e=>{if(e.target.closest('[data-ops-refresh]'))load();if(e.target.closest('[data-ops-export]'))exportCsv();});
 $('[data-ops-company]').addEventListener('change',e=>{if(scope.includes(e.target.value)){company=e.target.value;load();}});
 $('[data-ops-period]').addEventListener('change',e=>{const days=Number(e.target.value);if([7,30,90,120].includes(days)){period=days;load();}});
 const timer=setInterval(()=>{if(live()&&!busy&&document.visibilityState==='visible'&&!root.querySelector('[data-guardian-incidents] details[open]'))load();},90000);
 onDispose?.(()=>{active=false;requestId++;clearInterval(timer);});
 load();
}
