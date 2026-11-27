import {abcWorkbenchFrame,mountAbcWorkbench} from './tower-abc-ui.mjs';
import {mountLiveOffice,officePeople,portrait} from './tower-live-office.mjs';
import {TOWER_AGENTS,TOWER_SOURCE_TABLES,TOWER_ACTION_STATUSES,ABC_REFERENCE,towerMetrics,sanitizeCsv,agentById,towerAgentCycleInsight,towerHandoff,OFFICE_SCENARIO} from './tower-engine.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const companyNames={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
const statusName=s=>TOWER_ACTION_STATUSES.find(x=>x[0]===s)?.[1]||s;
const number=n=>Number.isInteger(n)?n.toLocaleString('pt-BR'):'—';
const date=s=>s?new Date(s).toLocaleString('pt-BR'):'—';

export function towerFrame(){
 return `<div id="cipTower" class="ct">
 <header class="ct-head"><div class="ct-logo"><img src="./logo-grupo-prohospital.jpg" alt="Logo oficial Grupo Prohospital"><div><strong>CIP<span>360</span></strong><small>Torre de Comando Prohospital</small></div></div><div class="ct-head-control"><label>Operação <select data-ct-company></select></label><span>SESSÃO AUTENTICADA</span></div></header>
 <div class="ct-banner" role="status">Consultando fontes do CIP...</div>
 <nav class="ct-view-nav" aria-label="Áreas da Torre"><button type="button" data-ct-view="overview" aria-pressed="true">Visão geral</button><button type="button" data-ct-view="agents" aria-pressed="false">Especialistas</button><button type="button" data-ct-view="pricing" aria-pressed="false">Preços e margem</button></nav>
 <section data-ct-pane="overview" class="ct-view-pane">
  <div class="ct-executive-hero"><div class="ct-hero-content"><small>CIP360 · GESTÃO COMERCIAL</small><h1>Torre de Comando</h1><p>O que precisa de atenção agora?</p><p class="ct-hero-meta" data-ct-summary role="status">Consultando encaminhamentos e alertas...</p><div class="ct-hero-actions"><button type="button" class="ct-hero-primary" data-ct-command>Abrir Central de Ações</button><button type="button" class="ct-hero-secondary" data-ct-agent="doquita">Consultar Doquita 360</button></div></div><div class="ct-hero-portrait" aria-hidden="true">${portrait(officePeople(TOWER_AGENTS).find(p=>p.id==='doquita'))}<span>Doquita 360</span></div></div>
  <section class="ct-kpis" data-ct-metrics aria-label="Indicadores da Torre">Consultando fontes...</section>
  <div class="ct-lower">
   <section class="ct-box"><div class="ct-box-head"><div><h2>Ações para acompanhar</h2><p>Prioridades e responsáveis nos registros consultados.</p></div><span data-ct-count>—</span></div><div class="ct-task-filter"><label>Mostrar <select data-ct-task-filter><option value="open">Pendentes</option><option value="all">Todos os registros</option></select></label></div><div data-ct-tasks>Consultando...</div></section>
   <section class="ct-box"><div class="ct-box-head"><div><h2>Alertas e oportunidades</h2><p>Estoque e mercado. Confira a origem antes de decidir.</p></div></div><div data-ct-alerts>Consultando...</div></section>
  </div>
 </section>
 <section data-ct-pane="agents" class="ct-view-pane" hidden>
 <div class="ct-layout">
  <section class="ct-office"><div class="ct-office-top"><div><h2>Especialistas</h2><p>Escolha uma área e consulte o agente responsável.</p></div></div>
   <div class="ct-office-visual"><div class="ct-office-official"><img src="./logo-grupo-prohospital.jpg" alt="Marca oficial do Grupo Prohospital"></div>
     ${TOWER_AGENTS.map(a=>`<button class="ct-agent-hotspot" type="button" data-ct-agent="${esc(a.id)}" title="${esc(a.area)}"><b>${esc(a.icon)}</b><span>${esc(a.name)}</span></button>`).join('')}
     <span class="ct-handoff-marker" data-ct-handoff-marker aria-hidden="true" hidden></span>
   </div><div class="ct-room-foot"><span data-ct-handoff-status role="status">Encaminhamentos registrados aparecem na visão geral.</span></div>
   <details class="ct-demo"><summary>Ver demonstração de colaboração</summary><div class="ct-office-simulation">
    <button type="button" class="ct-small-button" data-ct-simulate aria-pressed="false">Simular rotina</button>
    <button type="button" class="ct-small-button" data-ct-sim-step hidden>Próxima interação</button>
    <p data-ct-sim-status role="status">Demonstração sem alterações nos registros do CIP.</p>
   </div></details>
  </section><aside class="ct-agent-info" data-ct-detail aria-live="polite">Selecione um agente.</aside>
 </div></section>
 <section data-ct-pane="pricing" class="ct-view-pane" hidden>${abcWorkbenchFrame()}</section>
 <p class="ct-disclaimer">Ambiente operacional: números exibidos são registros de origem ou ficam indisponíveis (—). A representação de agentes não comprova execução automática nem ganho financeiro realizado.</p>
 </div>`;
}
export function mountTower({db,user,companies=[],allowedRoutes=[],onDispose}){
 const root=document.getElementById('cipTower');if(!root)return;
 let active=true,stamp=0,company=companies.includes('shopping_prohospital')?'shopping_prohospital':companies[0],selected='doquita';
 let counts={},tasks=[],stocks=[],offers=[],canWrite=false,loadErrors=[],lastCycle=null,taskSourceReady=false,taskFilter='open',view='overview';
 let seenHandoffs, handoffAnimation, simulationTimer, simulationStep=0, simulating=false,officeController;
 const $=sel=>root.querySelector(sel);
 const live=()=>active&&root.isConnected&&window.cipAuth?.email===user.email;
 if(onDispose)onDispose(()=>{active=false;stamp++;stopSimulation();});
 $('[data-ct-company]').innerHTML=companies.map(c=>`<option value="${esc(c)}">${esc(companyNames[c]||c)}</option>`).join('');
 $('[data-ct-company]').value=company;
 const central=$('[data-ct-command]');central.disabled=!allowedRoutes.includes('acoes');
 function showView(next){if(!['overview','agents','pricing'].includes(next))return; if(view==='agents'&&next!=='agents')stopSimulation();view=next;root.querySelectorAll('[data-ct-pane]').forEach(p=>p.hidden=p.dataset.ctPane!==next);root.querySelectorAll('[data-ct-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ctView===next)));}
 const unavailable='<div class="ct-none">Nenhuma evidência consultável nesta fonte, ou acesso indisponível.</div>';
 function renderMetrics(){
   $('[data-ct-metrics]').innerHTML=towerMetrics(counts,tasks).map(m=>`<article class="ct-kpi"><small>${esc(m.label)}</small><strong>${number(m.value)}</strong><span>${esc(m.unit)}</span></article>`).join('');
 }
 function renderAlerts(){
  const rows=[...stocks.map(x=>({sku:x.sku,state:x.state,description:x.description,date:x.updated_at,origin:'Análise do estoque',agent:'estoque'})),
              ...offers.map(x=>({sku:x.sku,state:x.state,description:'Oferta candidata. Preço, disponibilidade e similaridade ainda precisam ser conferidos.',date:x.created_at,origin:'Radar digital',agent:'radar_digital'}))].slice(0,10);
  $('[data-ct-alerts]').innerHTML=rows.length?rows.map(x=>`<article class="ct-alert"><b>!</b><div><strong>${esc(x.sku||'Sem SKU')}</strong><p>${esc(x.description||'Conferência de origem pendente.')}</p><small>${esc(x.origin)} · ${esc(x.state||'sem status')} · ${esc(date(x.date))}</small></div><button class="ct-small-button" data-ct-agent="${x.agent}">Analisar</button></article>`).join(''):unavailable;
 }
 function renderTasks(){
  const pending=tasks.filter(t=>!['concluida','descartada'].includes(t.status));
  const rank={critica:0,alta:1,normal:2,baixa:3};
  const rows=(taskFilter==='all'?tasks:pending).slice().sort((a,b)=>(rank[a.priority]??4)-(rank[b.priority]??4));
  $('[data-ct-count]').textContent=taskSourceReady?rows.length+' na amostra':'—';
  $('[data-ct-summary]').textContent=taskSourceReady?pending.length+' ação(ões) pendente(s) nos '+tasks.length+' registros consultados.':'A fonte de encaminhamentos está indisponível.';
  $('[data-ct-tasks]').innerHTML=!taskSourceReady?unavailable:rows.length?rows.slice(0,25).map(t=>`<article class="ct-task"><div class="ct-task-title"><strong>${esc(t.title)}</strong><span>${esc(t.priority||"normal")} · ${esc(statusName(t.status))}</span></div><p>${esc(t.description||'Sem descrição')}</p><small>${esc(agentById(t.agent_code)?.name||t.agent_code)} · ${esc(t.owner_name||'Não atribuído')} · ${esc(date(t.updated_at))}</small>
  ${canWrite?`<details class="ct-task-edit"><summary>Atualizar ação</summary><div class="ct-task-form"><label>Estado<select data-ct-task-status="${esc(t.id)}">${TOWER_ACTION_STATUSES.map(([v,label])=>`<option value="${v}" ${v===t.status?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label>Evidência<input type="text" maxlength="2000" data-ct-task-evidence="${esc(t.id)}" value="${esc(t.evidence_note||'')}" placeholder="Obrigatória para concluir"></label><button class="ct-small-button" type="button" data-ct-task-save="${esc(t.id)}">Salvar</button></div></details>`:''}</article>`).join('')+(rows.length>25?'<p class="ct-hint">Exibindo 25 registros prioritários. Consulte a Central de Ações para detalhes.</p>':''):'<p class="ct-none">Nenhum registro para este filtro.</p>';
 }
 function renderAgent(){
  const a=agentById(selected);if(!a)return;
  const count=counts[a.source],numberText=Number.isInteger(count)?number(count)+' registros':'Fonte indisponível';
  const ownTasks=tasks.filter(t=>t.agent_code===selected),allowed=allowedRoutes.includes(a.route);
  const insight=towerAgentCycleInsight(selected,lastCycle);
  const analysisMarkup=insight?'<div class="ct-agent-intelligence"><small>ANÁLISE REGISTRADA · '+esc(new Date(insight.created_at).toLocaleString('pt-BR'))+'</small><p>'+esc(insight.analysis)+'</p><span>'+esc(insight.state)+' · '+(insight.stale?'fonte histórica/desatualizada':'fonte declarada pelo ciclo')+'</span></div>':'<div class="ct-agent-intelligence"><small>ANÁLISE NÃO DISPONÍVEL</small><p>Este especialista ainda não possui um ciclo consultável nesta empresa.</p></div>';
  const abcMarkup=selected==='marca_passo'
    ?'<div class="ct-abc"><strong>Planilha ABC de referência · '+ABC_REFERENCE.total.toLocaleString('pt-BR')+' SKUs</strong><div>'+ABC_REFERENCE.curves.map(c=>'<span>Curva '+esc(c.curve)+': '+c.products.toLocaleString('pt-BR')+' itens · LUCRO '+c.lucro+' · DESPESA '+c.despesa+' · COMISSÃO '+c.comissao+'</span>').join('')+'</div><small>Campos do arquivo original; regras de margem mínima ainda não homologadas para precificação.</small></div>'
    :'';
  $('[data-ct-detail]').innerHTML=`<div class="ct-agent-header"><div class="ct-agent-icon">${esc(a.icon)}</div><div><small>AGENTE ESPECIALISTA</small><h2>${esc(a.name)}</h2><p>${esc(a.area)}</p></div></div>
   <div class="ct-agent-source">${esc(numberText)}<small>Origem: ${esc(TOWER_SOURCE_TABLES[a.source])}; registros não significam decisões já executadas.</small></div>
   ${analysisMarkup}
   ${abcMarkup}
   <details class="ct-agent-functions"><summary>Funções e responsabilidades</summary><ul>${a.functions.map(f=>`<li>${esc(f)}</li>`).join('')}</ul></details>
   <div class="ct-agent-buttons"><button class="btn" type="button" data-ct-go="${esc(a.route)}" ${!allowed?'disabled':''}>Abrir módulo</button><button class="btn secondary" type="button" data-ct-report>Exportar relatório</button></div>
   ${['marca_passo','campanhas','radar_digital','produtos'].includes(selected)?'<button class="ct-open-desk" type="button" data-ct-open-desk>Explorar margem, ABC e campanhas</button>':''}
   ${allowed?'':'<p class="ct-hint">Seu perfil não tem permissão para o módulo de destino.</p>'}
   <details class="ct-new-task"><summary>+ Encaminhar nova ação</summary>${canWrite?`<form data-ct-create>
    <label>Título<input name="title" minlength="6" maxlength="160" placeholder="Ação necessária" required></label>
    <label>Responsável humano<input name="owner_name" maxlength="120" placeholder="Nome do responsável"></label>
    <label>Prioridade<select name="priority"><option value="normal">Normal</option><option value="alta">Alta</option><option value="critica">Crítica</option><option value="baixa">Baixa</option></select></label>
    <label>Orientações<textarea name="description" rows="3" maxlength="2500" placeholder="Base e próximo passo"></textarea></label>
    <label>Evidência<input name="evidence_note" maxlength="2000" placeholder="Origem, número ou justificativa"></label>
    <button type="submit" class="btn">Registrar no CIP</button>
   </form>`:'<p>Apenas perfis autorizados podem registrar ações nesta empresa.'}</details>
   <div class="ct-agent-history"><h3>Encaminhamentos: ${ownTasks.length}</h3>${ownTasks.length?ownTasks.slice(0,4).map(t=>`<p><strong>${esc(t.title)}</strong><br><small>${esc(statusName(t.status))}</small></p>`).join(''):'<p>Nenhuma ação registrada para este agente.</p>'}</div>
   <p data-ct-message role="status" aria-live="polite"></p>`;
  root.querySelectorAll('.ct-agent-hotspot').forEach(el=>el.classList.toggle('ct-selected',el.dataset.ctAgent===selected));
  officeController?.setSelected(selected);
 }
 function render(){renderMetrics();renderAlerts();renderTasks();renderAgent();officeController?.setEvents({tasks,cycle:lastCycle});}
 function showHandoff(task){
  const agent=agentById(task.agent_code);
  $('[data-ct-handoff-status]').textContent='Encaminhamento humano registrado para '+agent.name+' · '+date(task.created_at)+'. Movimento ilustrativo.';
  if(!simulating)officeController?.visit(agentById('doquita'),agent,{real:true,source:'Central de Ações'});
 }
 function highlightDesks(origin,destination){
  for(const desk of root.querySelectorAll('.ct-agent-hotspot')){
   desk.classList.toggle('ct-visit-origin',desk.dataset.ctAgent===origin?.id);
   desk.classList.toggle('ct-visit-destination',desk.dataset.ctAgent===destination?.id);
  }
 }
 function animateVisit(origin,agent,roundTrip=false){
  if(officeController){officeController.visit(origin,agent,{real:false});return;}
  if(origin.id===agent.id||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const room=$('.ct-office-visual');
  const marker=$('[data-ct-handoff-marker]');
  if(!marker.animate)return;
  handoffAnimation?.cancel();
  marker.style.left='calc('+origin.x+'% - 15px)';
  marker.style.top='calc('+origin.y+'% - 15px)';
  marker.hidden=false;
  const distanceX=room.clientWidth*(agent.x-origin.x)/100;
  const distanceY=room.clientHeight*(agent.y-origin.y)/100;
  const start='translate(0, 0)';
  const arrival='translate('+distanceX+'px, '+distanceY+'px)';
  const animation=marker.animate(roundTrip?[
   {transform:start},{transform:arrival,offset:.35},
   {transform:arrival,offset:.66},{transform:start,opacity:0}
  ]:[
   {transform:start},{transform:arrival,offset:.8},{transform:arrival,opacity:0}
  ],{duration:roundTrip?3600:1900,easing:'ease-in-out'});
  handoffAnimation=animation;
  animation.onfinish=()=>{if(handoffAnimation===animation)marker.hidden=true;};
 }
 function stopSimulation(message='Demonstração de colaboração sem alterações nos registros do CIP.'){
  window.clearTimeout(simulationTimer);
  handoffAnimation?.cancel();
  officeController?.stop?.();
  simulating=false;
  $('[data-ct-handoff-marker]').hidden=true;
  highlightDesks();
  $('[data-ct-simulate]').textContent='Simular rotina';
  $('[data-ct-simulate]').setAttribute('aria-pressed','false');
  $('[data-ct-sim-step]').hidden=true;
  $('[data-ct-sim-status]').textContent=message;
 }
 function nextInteraction(){
  window.clearTimeout(simulationTimer);
  if(!live()||simulationStep>=OFFICE_SCENARIO.length){
   stopSimulation('Simulação concluída. Os registros da Central podem ser consultados no botão acima.');
   return;
  }
  const scene=OFFICE_SCENARIO[simulationStep++];
  const origin=agentById(scene.from), destination=agentById(scene.to);
  highlightDesks(origin,destination);
  $('[data-ct-sim-status]').textContent='Simulação · '+origin.name+' → '+destination.name+' · '+scene.description;
  animateVisit(origin,destination,true);
  // Demonstration advances only when requested by the user.
 }
 async function count(kind){
  const {count,error}=await db.from(TOWER_SOURCE_TABLES[kind]).select('*',{count:'exact',head:true}).eq('company_id',company);
  return {kind,value:error?null:count,error:error?.message||''};
 }
 async function load(){
  if(!live()||!company)return;
  const token=++stamp;
  counts={};tasks=[];stocks=[];offers=[];canWrite=false;loadErrors=[];lastCycle=null;taskSourceReady=false;
  $('[data-ct-metrics]').textContent='Consultando fontes...';
  const kinds=['stock_actions','market_offers','faro_signals','directory','price_plans','campaigns','demands','quotes','missions','tower_tasks'];
  const results=await Promise.allSettled([
   ...kinds.map(count),
   db.from('cip_tower_tasks').select('id,version,company_id,agent_code,title,description,status,priority,owner_name,evidence_note,source_module,source_reference,created_at,updated_at').eq('company_id',company).order('updated_at',{ascending:false}).limit(100),
   db.from('cip_stock_actions').select('action_id,sku,kind,description,state,priority,updated_at').eq('company_id',company).order('priority',{ascending:false}).limit(5),
   db.from('cip_market_offers').select('id,sku,state,created_at').eq('company_id',company).order('created_at',{ascending:false}).limit(5),
   db.from('cip_agent_cycles').select('created_at,trigger_kind,engine_version,report').eq('company_id',company).order('created_at',{ascending:false}).limit(1),
   db.rpc('cip_can_access',{p_company:company,p_write:true})
  ]);
  if(!live()||token!==stamp)return;
  kinds.forEach((k,i)=>{
   if(results[i].status==='fulfilled'){counts[k]=results[i].value.value;if(results[i].value.error)loadErrors.push(k);}
   else{counts[k]=null;loadErrors.push(k);}
  });
  const j=kinds.length;
  if(results[j].status==='fulfilled'&&!results[j].value.error){
   tasks=results[j].value.data||[];taskSourceReady=true;
   const {seen,latest}=towerHandoff(tasks,company,seenHandoffs);
   seenHandoffs=seen;
   if(latest)showHandoff(latest);
  }else loadErrors.push('tarefas');
  if(results[j+1].status==='fulfilled'&&!results[j+1].value.error)stocks=results[j+1].value.data||[];
  if(results[j+2].status==='fulfilled'&&!results[j+2].value.error)offers=results[j+2].value.data||[];
  if(results[j+3].status==='fulfilled'&&!results[j+3].value.error)lastCycle=results[j+3].value.data?.[0]||null;
  if(results[j+4].status==='fulfilled'&&!results[j+4].value.error)canWrite=results[j+4].value.data===true;
  const time=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  $('.ct-banner').textContent=(loadErrors.length?'Algumas fontes estão indisponíveis; dados ausentes não são estimados.':'Fontes CIP consultadas. Candidatos, planos e registros precisam de revisão humana antes de decisões.')+' Consulta atualizada às '+time+'; novas coletas dependem da rotina de cada agente.';
  render();
 }
 function report(){
  const a=agentById(selected);if(!a)return;
  const rows=[['Tipo','Empresa','Agente','SKU ou título','Estado','Evidência/descrição','Atualização']];
  tasks.filter(t=>t.agent_code===selected).forEach(t=>rows.push(['Tarefa',company,a.name,t.title,t.status,t.evidence_note||t.description,t.updated_at]));
  if(['estoque','compras','transferencias','campanhas','marca_passo'].includes(selected))stocks.filter(s=>selected!=='transferencias'||s.kind==='redistribuicao').forEach(x=>rows.push(['Análise estoque',company,a.name,x.sku,x.state,x.description,x.updated_at]));
  if(['radar_digital','marca_passo'].includes(selected))offers.forEach(x=>rows.push(['Oferta candidata',company,a.name,x.sku,x.state,'Aguardando checagem de equivalência e disponibilidade',x.created_at]));
  const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(sanitizeCsv).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const href=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=href;link.download='CIP360_'+selected+'_'+company+'.csv';document.body.append(link);link.click();link.remove();URL.revokeObjectURL(href);
 }
 async function createTask(form){
  if(!canWrite)return;
  const f=new FormData(form),title=String(f.get('title')||'').trim();
  if(title.length<6)return;
  const data={company_id:company,agent_code:selected,title,description:String(f.get('description')||'').trim(),
   owner_name:String(f.get('owner_name')||'').trim()||null,priority:f.get('priority')||'normal',evidence_note:String(f.get('evidence_note')||'').trim(),created_by:user.id};
  const button=form.querySelector('button[type=submit]');button.disabled=true;
  const {error}=await db.from('cip_tower_tasks').insert(data);if(!live())return;button.disabled=false;
  if(error){$('[data-ct-message]').textContent='Não foi possível registrar: '+error.message;return;}
  await load();
 }
 async function saveTask(id){
  if(!canWrite)return;
  const current=tasks.find(x=>x.id===id),state=root.querySelector('[data-ct-task-status="'+id+'"]'),evidence=root.querySelector('[data-ct-task-evidence="'+id+'"]');
  if(!current||!state||!evidence)return;
  if(state.value==='concluida'&&evidence.value.trim().length<10){evidence.setCustomValidity('Obrigatória evidência de dez caracteres');evidence.reportValidity();evidence.setCustomValidity('');return;}
  const {data,error}=await db.from('cip_tower_tasks').update({status:state.value,evidence_note:evidence.value.trim()}).eq('id',id).eq('company_id',company).eq('version',current.version).select('id');
  if(error||!data?.length){alert('Falha ao salvar: sem permissão ou versão modificada.');return;}
  await load();
 }
 root.addEventListener('click',e=>{
  const tab=e.target.closest('[data-ct-view]');if(tab){showView(tab.dataset.ctView);return;}
  const hit=e.target.closest('[data-ct-agent],[data-ct-live-event]');if(hit){const agent=hit.dataset.ctAgent||hit.dataset.ctLiveEvent;if(agentById(agent)){selected=agent;showView('agents');renderAgent();if(window.matchMedia('(max-width: 1180px)').matches)$('[data-ct-detail]').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}return;}
  const nav=e.target.closest('[data-ct-go]');if(nav){const r=nav.dataset.ctGo;if(allowedRoutes.includes(r))window.navigate(r);return;}
  if(e.target.closest('[data-ct-report]')){report();return;}
  if(e.target.closest('[data-ct-command]')&&allowedRoutes.includes('acoes')){window.navigate('acoes');return;}
  if(e.target.closest('[data-ct-simulate]')){
   if(simulating){stopSimulation();return;}
   simulating=true;
   simulationStep=0;
   $('[data-ct-simulate]').textContent='Encerrar simulação';
   $('[data-ct-simulate]').setAttribute('aria-pressed','true');
   $('[data-ct-sim-step]').hidden=false;
   nextInteraction();
   return;
  }
  if(e.target.closest('[data-ct-sim-step]')&&simulating){nextInteraction();return;}
  if(e.target.closest('[data-ct-open-desk]')){showView('pricing');workbench?.open();return;}
  const save=e.target.closest('[data-ct-task-save]');if(save)saveTask(save.dataset.ctTaskSave);
 });
 root.addEventListener('submit',e=>{if(e.target.matches('[data-ct-create]')){e.preventDefault();createTask(e.target);}});
 $('[data-ct-task-filter]').addEventListener('change',e=>{taskFilter=e.target.value;renderTasks();});
 $('[data-ct-company]').addEventListener('change',e=>{
  if(!companies.includes(e.target.value)||company===e.target.value)return;
  company=e.target.value;
  seenHandoffs=undefined;
  stopSimulation();
  officeController?.setCompany();
  counts={};tasks=[];stocks=[];offers=[];canWrite=false;lastCycle=null;taskSourceReady=false;renderMetrics();renderAlerts();renderTasks();renderAgent();
  $('[data-ct-handoff-status]').textContent='Colaboração representativa · consulte os registros para confirmar ações';
  workbench?.setCompany();
  load();
 });
 officeController=mountLiveOffice({root,agents:TOWER_AGENTS,scenes:OFFICE_SCENARIO,onDispose,onSelect:id=>{selected=id;renderAgent();}});
 const workbench=mountAbcWorkbench({root,db,user,companies,getCompany:()=>company,getCanWrite:()=>canWrite,onDispose});
 const poll=window.setInterval(()=>{if(live()&&document.visibilityState==='visible')load();},90000);
 if(onDispose)onDispose(()=>window.clearInterval(poll));
 load();
}
