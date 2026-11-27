import {abcWorkbenchFrame,mountAbcWorkbench} from './tower-abc-ui.mjs';
import {TOWER_AGENTS,TOWER_SOURCE_TABLES,TOWER_ACTION_STATUSES,ABC_REFERENCE,towerMetrics,sanitizeCsv,agentById} from './tower-engine.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const companyNames={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
const statusName=s=>TOWER_ACTION_STATUSES.find(x=>x[0]===s)?.[1]||s;
const number=n=>Number.isInteger(n)?n.toLocaleString('pt-BR'):'—';
const date=s=>s?new Date(s).toLocaleString('pt-BR'):'—';

export function towerFrame(){
 return `<div id="cipTower" class="ct">
 <header class="ct-head"><div class="ct-logo"><img src="./logo-grupo-prohospital.jpg" alt="Logo oficial Grupo Prohospital"><div><strong>CIP<span>360</span></strong><small>Torre de Comando Prohospital</small></div></div><div class="ct-head-control"><label>Operação <select data-ct-company></select></label><span>SESSÃO AUTENTICADA</span></div></header>
 <div class="ct-banner" role="status">Carregando registros de origem do CIP. Não há valores financeiros demonstrativos neste painel.</div>
 <div class="ct-layout">
  <section class="ct-office"><div class="ct-office-top"><div><span>INTELIGÊNCIA COMERCIAL, ESTOQUE E PRECIFICAÇÃO</span><h1>Torre de Comando</h1><p>Clique em cada agente para abrir responsabilidades, tarefas e relatórios.</p></div><small>SHOPPING + DISTRIBUIDORA</small></div>
   <div class="ct-office-visual"><div class="ct-office-official"><img src="./logo-grupo-prohospital.jpg" alt="Marca oficial do Grupo Prohospital"></div>
     ${TOWER_AGENTS.map(a=>`<button class="ct-agent-hotspot" type="button" style="--left:${a.x}%;--top:${a.y}%" data-ct-agent="${esc(a.id)}" title="${esc(a.area)}"><b>${esc(a.icon)}</b><span>${esc(a.name)}</span></button>`).join('')}
   </div><div class="ct-room-foot"><span>Salão ilustrativo · ações e indicadores consultados em fontes autorizadas</span><button type="button" class="ct-small-button" data-ct-report>Relatório do agente (.csv)</button></div>
  </section><aside class="ct-agent-info" data-ct-detail aria-live="polite">Selecione um agente.</aside>
 </div>
 <section class="ct-kpis" data-ct-metrics aria-label="Indicadores da Torre">Carregando dados...</section>
 ${abcWorkbenchFrame()}
 <div class="ct-lower">
  <section class="ct-box"><div class="ct-box-head"><div><h2>Alertas e oportunidades</h2><p>Registros de estoque e mercado — conferir fonte, equivalência e data antes de executar.</p></div><span>FONTES CIP</span></div><div data-ct-alerts>Buscando...</div></section>
  <section class="ct-box"><div class="ct-box-head"><div><h2>Encaminhamentos registrados</h2><p>Tarefas humanas com evidências e trilha de auditoria.</p></div><span data-ct-count>—</span></div><div data-ct-tasks>Buscando...</div></section>
 </div><p class="ct-disclaimer">Ambiente operacional: números exibidos são registros de origem ou ficam indisponíveis (—). A representação de agentes não comprova execução automática nem ganho financeiro realizado.</p>
 </div>`;
}
export function mountTower({db,user,companies=[],allowedRoutes=[],onDispose}){
 const root=document.getElementById('cipTower');if(!root)return;
 let active=true,stamp=0,company=companies.includes('shopping_prohospital')?'shopping_prohospital':companies[0],selected='marca_passo';
 let counts={},tasks=[],stocks=[],offers=[],canWrite=false,loadErrors=[];
 const $=sel=>root.querySelector(sel);
 const live=()=>active&&root.isConnected&&window.cipAuth?.email===user.email;
 if(onDispose)onDispose(()=>{active=false;stamp++;});
 $('[data-ct-company]').innerHTML=companies.map(c=>`<option value="${esc(c)}">${esc(companyNames[c]||c)}</option>`).join('');
 $('[data-ct-company]').value=company;
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
  $('[data-ct-count]').textContent=tasks.length+' registro(s)';
  $('[data-ct-tasks]').innerHTML=tasks.length?tasks.slice(0,25).map(t=>`<article class="ct-task"><div class="ct-task-title"><strong>${esc(t.title)}</strong><span>${esc(statusName(t.status))}</span></div><p>${esc(t.description||'Sem descrição')}</p><small>${esc(agentById(t.agent_code)?.name||t.agent_code)} · ${esc(t.owner_name||'Não atribuído')} · ${esc(date(t.updated_at))}</small>
  ${canWrite?`<div class="ct-task-form"><label>Estado<select data-ct-task-status="${esc(t.id)}">${TOWER_ACTION_STATUSES.map(([v,label])=>`<option value="${v}" ${v===t.status?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label>Evidência<input type="text" maxlength="2000" data-ct-task-evidence="${esc(t.id)}" value="${esc(t.evidence_note||'')}" placeholder="Obrigatória para concluir"></label><button class="ct-small-button" type="button" data-ct-task-save="${esc(t.id)}">Salvar</button></div>`:''}</article>`).join(''):unavailable;
 }
 function renderAgent(){
  const a=agentById(selected);if(!a)return;
  const count=counts[a.source],numberText=Number.isInteger(count)?number(count)+' registros':'Fonte indisponível';
  const ownTasks=tasks.filter(t=>t.agent_code===selected),allowed=allowedRoutes.includes(a.route);
  const abcMarkup=selected==='marca_passo'
    ?'<div class="ct-abc"><strong>Planilha ABC de referência · '+ABC_REFERENCE.total.toLocaleString('pt-BR')+' SKUs</strong><div>'+ABC_REFERENCE.curves.map(c=>'<span>Curva '+esc(c.curve)+': '+c.products.toLocaleString('pt-BR')+' itens · LUCRO '+c.lucro+' · DESPESA '+c.despesa+' · COMISSÃO '+c.comissao+'</span>').join('')+'</div><small>Campos do arquivo original; regras de margem mínima ainda não homologadas para precificação.</small></div>'
    :'';
  $('[data-ct-detail]').innerHTML=`<div class="ct-agent-header"><div class="ct-agent-icon">${esc(a.icon)}</div><div><small>AGENTE ESPECIALISTA</small><h2>${esc(a.name)}</h2><p>${esc(a.area)}</p></div></div>
   <div class="ct-agent-source">${esc(numberText)}<small>Origem: ${esc(TOWER_SOURCE_TABLES[a.source])}; registros não significam decisões já executadas.</small></div>
   ${abcMarkup}
   <h3>Funções e responsabilidades</h3><ul>${a.functions.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>
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
 }
 function render(){renderMetrics();renderAlerts();renderTasks();renderAgent();}
 async function count(kind){
  const {count,error}=await db.from(TOWER_SOURCE_TABLES[kind]).select('*',{count:'exact',head:true}).eq('company_id',company);
  return {kind,value:error?null:count,error:error?.message||''};
 }
 async function load(){
  if(!live()||!company)return;
  const token=++stamp;
  counts={};tasks=[];stocks=[];offers=[];canWrite=false;loadErrors=[];
  $('[data-ct-metrics]').textContent='Consultando fontes...';
  const kinds=['stock_actions','market_offers','faro_signals','directory','price_plans','campaigns','demands','quotes','missions','tower_tasks'];
  const results=await Promise.allSettled([
   ...kinds.map(count),
   db.from('cip_tower_tasks').select('id,version,company_id,agent_code,title,description,status,priority,owner_name,evidence_note,created_at,updated_at').eq('company_id',company).order('updated_at',{ascending:false}).limit(100),
   db.from('cip_stock_actions').select('action_id,sku,kind,description,state,priority,updated_at').eq('company_id',company).order('priority',{ascending:false}).limit(5),
   db.from('cip_market_offers').select('id,sku,state,created_at').eq('company_id',company).order('created_at',{ascending:false}).limit(5),
   db.rpc('cip_can_access',{p_company:company,p_write:true})
  ]);
  if(!live()||token!==stamp)return;
  kinds.forEach((k,i)=>{
   if(results[i].status==='fulfilled'){counts[k]=results[i].value.value;if(results[i].value.error)loadErrors.push(k);}
   else{counts[k]=null;loadErrors.push(k);}
  });
  const j=kinds.length;
  if(results[j].status==='fulfilled'&&!results[j].value.error)tasks=results[j].value.data||[];else loadErrors.push('tarefas');
  if(results[j+1].status==='fulfilled'&&!results[j+1].value.error)stocks=results[j+1].value.data||[];
  if(results[j+2].status==='fulfilled'&&!results[j+2].value.error)offers=results[j+2].value.data||[];
  if(results[j+3].status==='fulfilled'&&!results[j+3].value.error)canWrite=results[j+3].value.data===true;
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
  const hit=e.target.closest('[data-ct-agent]');if(hit){selected=hit.dataset.ctAgent;renderAgent();return;}
  const nav=e.target.closest('[data-ct-go]');if(nav){const r=nav.dataset.ctGo;if(allowedRoutes.includes(r))window.navigate(r);return;}
  if(e.target.closest('[data-ct-report]')){report();return;}
  if(e.target.closest('[data-ct-open-desk]')){workbench?.open();return;}
  const save=e.target.closest('[data-ct-task-save]');if(save)saveTask(save.dataset.ctTaskSave);
 });
 root.addEventListener('submit',e=>{if(e.target.matches('[data-ct-create]')){e.preventDefault();createTask(e.target);}});
 $('[data-ct-company]').addEventListener('change',e=>{if(!companies.includes(e.target.value))return;company=e.target.value;workbench?.setCompany();load();});
 const workbench=mountAbcWorkbench({root,db,user,companies,getCompany:()=>company,getCanWrite:()=>canWrite,onDispose});
 const poll=window.setInterval(()=>{if(live()&&document.visibilityState==='visible')load();},90000);
 if(onDispose)onDispose(()=>window.clearInterval(poll));
 load();
}
