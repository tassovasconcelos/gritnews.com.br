import {capabilityFor,MATURITY} from './agent-capabilities.mjs';
import {academyFrame,mountAcademy} from './academy-ui.mjs';
import {AGENTS,COMPANIES,COURSES,STATUS,agentsFor,coursesFor,escapeHtml as esc,validWork} from './agents-data.mjs';
import {correlate,latestInSample,fetchPublications,getJson,awardedRecord,PNCP} from './b2g-radar.mjs';
const money=x=>Number.isFinite(x)?x.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'Não informado';
const date=x=>x?new Date(String(x).length===10?x+'T12:00:00':x).toLocaleString('pt-BR'):'Não informado';
const nodes=(root,selector)=>[...root.querySelectorAll(selector)];
const portrait=a=>`<div class="agent-portrait" style="--agent:${a.color}" aria-hidden="true"><span class="agent-orbit"></span><div class="agent-head"><i></i><i></i><b></b></div><div class="agent-uniform"><img src="./logo-grupo-prohospital.jpg" alt=""><span>${a.icon}</span></div><span class="agent-light"></span></div>`;
function hero(kicker,title,subtitle,icon){return `<section class="squad-hero"><div><span class="squad-eyebrow">${kicker}</span><h1>${title}</h1><p>${subtitle}</p><span class="squad-tag">FASE 1 · PESSOAS NO COMANDO</span></div><div class="hero-orbit" aria-hidden="true">${icon}<i></i><b></b></div></section>`;}
function frame(page){
 if(page==='quartel')return hero('SQUAD PROHOSPITAL','Quartel dos Agentes','Conheça quem cuida de cada frente. Dê uma missão, acompanhe o time e transforme análise em próximo passo.','✦')+`<div class="squad-toolbar"><div><strong>Uma equipe. Muitas especialidades.</strong><p>Personagens animados; atividade e evidências identificadas em cada registro.</p></div><button class="btn" data-squad-create>＋ Nova missão</button></div><section class="card executive-bridge"><span class="eyebrow">DIRETORIA ↔ GESTÃO</span><h2>RufasIA · Diretoria executiva</h2><p>Diretrizes de Rufino e Glauco viram pautas com objetivo, indicador, responsável e prazo para acompanhamento pelo time.</p><button class="btn secondary" data-executive>Registrar pauta executiva →</button></section><div id="squadSummary" class="squad-summary"></div><div class="squad-layout"><section><div class="squad-filters"><label>Encontrar especialista<input id="agentSearch" placeholder="Nome, área ou habilidade"></label><label>Empresa<select id="squadCompany"></select></label></div><div id="agentGrid" class="agent-grid"></div></section><aside class="mission-panel"><span class="eyebrow">CENTRAL DE MISSÕES</span><h2>O trabalho ganha forma aqui.</h2><p class="mini">Tarefas e estados registrados pelo time. Não representam execução autônoma.</p><div id="missionList" aria-live="polite"></div></aside></div><div id="agentDetail"></div><div id="workComposer"></div>`;
 if(page==='escola')return hero('APRENDER · TESTAR · REVISAR','Escola dos Agentes','O dia a dia vira conhecimento. O conhecimento passa por revisão. O squad evolui com o seu time.','⌘')+`<div class="squad-toolbar"><div><strong>Aprendizado contínuo, com critério.</strong><p>Trilhas disponíveis para o time; nenhuma habilidade ou permissão é publicada automaticamente.</p></div><button class="btn" data-squad-create>＋ Registrar aprendizado</button></div><div class="school-pipeline"><span>01 · Caso do dia</span><b>→</b><span>02 · Revisão humana</span><b>→</b><span>03 · Teste</span><b>→</b><span>04 · Versão aprovada</span></div><div class="squad-filters"><label>Empresa<select id="squadCompany"></select></label></div><div class="squad-filters"><label>Trilha do especialista<select id="schoolAgent"></select></label><label>Pesquisar tema<input id="schoolSearch" placeholder="Margem, entrega, compras, diretoria…"></label></div><p id="schoolProgress" aria-live="polite"></p>${academyFrame()}<section class="card" id="advancedLearning"></section><h2 class="section">Trilhas e práticas do squad</h2><div class="course-grid" id="courseGrid"></div><div class="school-bottom"><section class="card"><h2>Do aprendizado à habilidade</h2><p>Fonte, objetivo, exemplos, limites e teste devem acompanhar cada proposta. Concluir uma prática não certifica o agente.</p><div id="coursePractice"></div></section><section class="card"><h2>Caderno de evolução do time</h2><p class="mini">Propostas compartilhadas na empresa selecionada. Marcar como concluída registra a revisão do time; não treina um modelo.</p><div id="missionList" aria-live="polite"></div></section></div><div id="workComposer"></div>`;
 return hero('ÍRIS · INTELIGÊNCIA EM COMPRAS PÚBLICAS','Radar B2G','Encontre contratações, investigue produtos e veja resultados homologados com evidência oficial.','◎')+`<div class="b2g-scope"><strong>Pesquisa oficial · PNCP · Ceará</strong><span>Coleta sob demanda. Sem robô contínuo configurado.</span></div><div class="radar-console"><div class="radar-screen" aria-hidden="true"><span></span><i></i><b>ÍRIS</b></div><div><h2>Da publicação à análise.</h2><p>Publicações → itens → resultados → fornecedor → revisão da equivalência. A correlação com seu SKU depende do catálogo Procfit.</p><div class="b2g-actions"><button class="btn" id="refreshB2g">Consultar PNCP agora</button><button class="btn secondary" id="refreshAwards">Atualizar resultados da amostra</button></div><p id="b2gStatus" role="status">Carregando a coleta publicada…</p></div></div><div class="squad-filters"><label>Produto ou objeto<input id="b2gSearch" placeholder="Ex.: luva, cadeira, curativo, broca"></label><label>Visualização<select id="b2gView"><option value="purchases">Contratações da amostra</option><option value="awards">Resultados homologados</option></select></label></div><div id="b2gMeta" class="b2g-meta"></div><div id="b2gResults"></div><section class="card section"><h2>Estruturar uma análise de licitação</h2><ol class="b2g-steps"><li>Conferir edital e descrição completa do item.</li><li>Correlacionar especificação, unidade, embalagem e catálogo interno.</li><li>Revisar histórico homologado, fornecedor e condições.</li><li>Validar custo, margem, capacidade, documentos e prazo.</li><li>Encaminhar ao responsável B2G. Nenhuma proposta ou lance é enviado aqui.</li></ol><a href="https://www.gov.br/compras/pt-br/cidadao/portal-de-dados-abertos" target="_blank" rel="noopener noreferrer">Compras.gov.br e pesquisa de preços ↗</a> · <a href="https://pncp.gov.br/app/editais" target="_blank" rel="noopener noreferrer">Consultar o PNCP ↗</a></section>`;
}
function capabilityDetails(a){const c=capabilityFor(a.id),list=items=>'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';return `<h3>Plano avançado de competências · v${c.version}</h3><p>Definição de capacidade. Domínio depende de fontes aprovadas, testes e resultado medido.</p><div class="capability-levels">${MATURITY.map((x,i)=>`<span>${i+1} · ${esc(x)}</span>`).join('')}</div><div class="capability-grid"><section><h3>Habilidades a desenvolver</h3>${list(c.skills)}</section><section><h3>Entradas necessárias</h3>${list(c.inputs)}<h3>Entregas esperadas</h3>${list(c.outputs)}</section></div><p><strong>Fluxo com o squad:</strong> ${c.handoffs.map(id=>esc(AGENTS.find(x=>x.id===id)?.name)).join(' → ')}</p><p><strong>Como medir:</strong> ${esc(c.metric)}</p><p><strong>Caso de avaliação:</strong> ${esc(c.test)}</p><p><strong>Limites:</strong> ${esc(c.limits)}</p>`;}
export function renderSquadPage(page){return `<div class="squad-page" id="squadRoot" data-squad-page="${esc(page)}">${frame(page)}<p class="squad-foot">Grupo Prohospital · GRIT · Personagens visuais não indicam consciência ou trabalho em segundo plano. Cada fonte e atividade tem seu estado próprio.</p></div>`;}
export function mountSquad(page,{db,user,companies,onDispose=()=>{}}){
 const root=document.getElementById('squadRoot');if(!root)return;
 let alive=true,revision=0,work=[],selected=companies[0],currentAbort=null;
 const available=agentsFor(companies),isAlive=()=>alive&&root.isConnected&&window.cipAuth?.allowedRoutes?.includes(page);
 const current=()=>document.getElementById('squadRoot')===root;
 const dispose=()=>{alive=false;currentAbort?.abort();};onDispose(dispose);
 if(page==='radar-b2g'){mountRadar(root,isAlive,onDispose,{db,user});return;}
 const company=root.querySelector('#squadCompany');company.innerHTML=companies.map(c=>`<option value="${esc(c)}">${esc(COMPANIES[c]??c)}</option>`).join('');
 const list=root.querySelector('#missionList');
 const academy=page==='escola'?mountAcademy(root,{db,user,getCompany:()=>selected,isAlive,onDispose}):null;
 async function load(){
  const own=++revision;list.textContent='Consultando os registros da empresa…';
  const {data,error}=await db.from('cip_agent_work').select('id,company_id,agent_id,kind,title,notes,status,created_at').eq('company_id',selected).eq('kind',page==='escola'?'lesson':'task').order('created_at',{ascending:false}).limit(60);
  if(!isAlive()||own!==revision)return;
  if(error){list.textContent='Não foi possível carregar as atividades. Nenhum estado foi confirmado.';return;}
  work=data??[];drawWork();drawAgents();drawSchool();
 }
 function drawWork(){
  list.innerHTML=work.length?work.map(w=>`<article class="mission-item"><div class="row"><span class="mission-state ${esc(w.status)}">${esc(STATUS[w.status]??w.status)}</span><small>${esc(available.find(a=>a.id===w.agent_id)?.name??'Especialista')}</small></div><h3>${esc(w.title)}</h3><p>${esc(w.notes||'Sem observação adicional.')}</p><small>${esc(date(w.created_at))}</small><label>Estado registrado pelo time<select data-work-state="${esc(w.id)}">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${w.status===k?'selected':''}>${v}</option>`).join('')}</select></label><span class="work-status" role="status"></span></article>`).join(''):'<div class="squad-empty">Nenhum registro nesta empresa.<br>Comece com uma missão ou um aprendizado real.</div>';
  nodes(list,'[data-work-state]').forEach(select=>select.addEventListener('change',async()=>{
   const w=work.find(x=>x.id===select.dataset.workState),before=w?.status;select.disabled=true;const note=select.parentElement.parentElement.querySelector('.work-status');note.textContent='Salvando…';
   const {data,error}=await db.from('cip_agent_work').update({status:select.value}).eq('id',select.dataset.workState).eq('company_id',selected).select('id');
   if(!isAlive())return;if(error||!data?.length){select.value=before;note.textContent='Alteração não autorizada ou indisponível.';}else{note.textContent='Estado registrado. Sem execução automática.';await load();}select.disabled=false;
  }));
 }
 function drawAgents(){
  const grid=root.querySelector('#agentGrid');if(!grid)return;
  const q=(root.querySelector('#agentSearch')?.value??'').toLocaleLowerCase('pt-BR');
  const filtered=available.filter(a=>a.companies.includes(selected)&&`${a.name} ${a.role} ${a.skills.join(' ')} ${capabilityFor(a.id).skills.join(' ')}`.toLocaleLowerCase('pt-BR').includes(q));
  root.querySelector('#squadSummary').innerHTML=`<div><b>${AGENTS.length}</b><span>especialistas no squad · incluindo RufasIA</span></div><div><b>${work.filter(w=>w.status==='in_progress').length}</b><span>missões em andamento pelo time</span></div><div><b>${work.filter(w=>w.status==='review').length}</b><span>aguardando revisão</span></div><div><b>1</b><span>fase · recomendar e revisar</span></div>`;
  grid.innerHTML=filtered.map(a=>{const count=work.filter(w=>w.agent_id===a.id&&!['done','cancelled'].includes(w.status)).length;return `<article class="agent-card" style="--agent:${a.color}"><div class="agent-card-top"><span class="agent-role">${esc(a.role)}</span><span class="agent-mode">${a.id==='b2g'?'Pesquisa sob demanda':'Especialista planejado'}</span></div>${portrait(a)}<h2>${esc(a.name)}</h2><p>${esc(a.mission)}</p><div class="agent-skills">${[...a.skills,...capabilityFor(a.id).skills.slice(0,2)].map(s=>`<span>${esc(s)}</span>`).join('')}</div><div class="agent-card-foot"><span>${count} ${count===1?'missão':'missões'} do time</span><button type="button" data-agent="${a.id}" aria-label="Conhecer ${esc(a.name)}">Conhecer →</button></div></article>`;}).join('')||'<p>Nenhum especialista neste filtro.</p>';
  nodes(grid,'[data-agent]').forEach(b=>b.addEventListener('click',()=>showAgent(b.dataset.agent)));
 }
 function showAgent(id){
  const a=available.find(x=>x.id===id);if(!a)return;
  const host=root.querySelector('#agentDetail');host.innerHTML=`<section class="agent-detail card" tabindex="-1"><div class="row"><h2>${esc(a.name)} · ${esc(a.role)}</h2><button class="link" data-close-detail>Fechar</button></div><p>${esc(a.mission)}</p>${capabilityDetails(a)}<p><strong>Como atua hoje:</strong> ${a.id==='b2g'?'pesquisa pública acionada no radar B2G, com fontes e amostra explícitas.':'papel e competências definidos; missões são registradas e conduzidas pelo time. Motor autônomo ainda não conectado.'}</p><p><strong>Aprendizado:</strong> casos registrados na Escola passam por revisão humana. Nenhuma permissão muda automaticamente.</p><button class="btn" data-assign>Registrar missão para ${esc(a.name)}</button></section>`;
  host.querySelector('[data-close-detail]').addEventListener('click',()=>host.replaceChildren());host.querySelector('[data-assign]').addEventListener('click',()=>compose(id));host.querySelector('section').focus();host.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 function compose(agentId,options={}){
  const kind=options.kind??(page==='escola'?'lesson':'task'),host=root.querySelector('#workComposer');
  host.innerHTML=`<section class="work-composer card" tabindex="-1"><div class="row"><h2>${kind==='lesson'?'Registrar um aprendizado':'Uma nova missão para o time'}</h2><button class="link" data-close-composer>Fechar</button></div><form id="agentWorkForm"><div class="squad-filters"><label>Especialista<select name="agent">${available.filter(a=>a.companies.includes(selected)).map(a=>`<option value="${a.id}" ${a.id===agentId?'selected':''}>${esc(a.name)} · ${esc(a.role)}</option>`).join('')}</select></label><label>Empresa<input value="${esc(COMPANIES[selected])}" readonly></label></div><label>Título<input name="title" required minlength="4" maxlength="160" placeholder="O que precisamos investigar ou aprender?"></label><label>Contexto, evidência e próximo passo<textarea name="notes" maxlength="3000" rows="4" placeholder="Registre a fonte e a orientação para revisão. Não inclua senhas ou dados sensíveis."></textarea></label><p class="mini">Registro compartilhado nesta empresa. ${kind==='lesson'?'Vai para revisão; não treina nem certifica um modelo.':'Cria uma tarefa; não dispara ações no ERP ou mensagens.'}</p><button class="btn" type="submit">Salvar ${kind==='lesson'?'aprendizado':'missão'}</button><p id="workSaveStatus" role="status"></p></form></section>`;
  host.querySelector('[name=title]').value=options.title??'';host.querySelector('[name=notes]').value=options.notes??'';
  host.querySelector('[data-close-composer]').addEventListener('click',()=>host.replaceChildren());
  host.querySelector('form').addEventListener('submit',async event=>{
   event.preventDefault();if(!isAlive())return;const form=event.currentTarget,button=form.querySelector('[type=submit]'),message=form.querySelector('#workSaveStatus');
   const payload={agent_id:form.elements.agent.value,company_id:selected,kind,title:form.elements.title.value.trim(),notes:form.elements.notes.value.trim(),created_by:user.id,status:kind==='lesson'?'review':'queued'};
   if(!validWork(payload)){message.textContent='Confira o título e o especialista da empresa.';return;}
   button.disabled=true;message.textContent='Salvando registro compartilhado…';
   const {data,error}=await db.from('cip_agent_work').insert(payload).select('id');
   if(!isAlive())return;button.disabled=false;
   if(error||!data?.length){message.textContent='Não foi possível salvar. Verifique sua permissão e conexão.';return;}
   form.elements.title.value='';form.elements.notes.value='';message.textContent='Registro salvo. Aguarda o próximo passo do time.';await load();
  });host.querySelector('section').focus();host.scrollIntoView({behavior:'smooth',block:'start'});
 }
 root.querySelector('[data-squad-create]').addEventListener('click',()=>compose(page==='escola'?'escola':'doquita'));
 company.addEventListener('change',()=>{selected=company.value;academy?.refresh();root.querySelector('#workComposer')?.replaceChildren();root.querySelector('#agentDetail')?.replaceChildren();load();});
 root.querySelector('#agentSearch')?.addEventListener('input',drawAgents);
 function drawSchool(){
  const grid=root.querySelector('#courseGrid');if(!grid)return;
  const select=root.querySelector('#schoolAgent'),before=select.value;
  select.innerHTML='<option value="">Todo o squad</option>'+agentsFor([selected]).map(a=>'<option value="'+a.id+'">'+esc(a.name)+' · '+esc(a.role)+'</option>').join('');select.value=agentsFor([selected]).some(a=>a.id===before)?before:'';
  const courses=coursesFor(selected,select.value,root.querySelector('#schoolSearch').value);
  const picked=available.find(a=>a.id===select.value);root.querySelector('#advancedLearning').innerHTML=picked?capabilityDetails(picked)+'<button class="btn secondary" data-advanced-case>Registrar caso de avaliação</button>':'<h2>14 especialistas, evolução por evidência</h2><p>Selecione uma trilha para consultar habilidades avançadas, entradas, entregas, conexões, limites e caso de avaliação. Sofia transforma os materiais revisados em propostas de habilidades para o squad existente.</p><p>'+MATURITY.map(esc).join(' → ')+'</p>';
  root.querySelector('[data-advanced-case]')?.addEventListener('click',()=>{const c=capabilityFor(picked.id);compose(picked.id,{kind:'lesson',title:'Avaliação: '+picked.name,notes:'Objetivo: '+picked.mission+'\nCaso de teste: '+c.test+'\nComo medir: '+c.metric+'\nLimites: '+c.limits+'\nFonte aprovada: \nResultado observado: \nRevisor e próxima revisão: '});});
  root.querySelector('#schoolProgress').textContent=courses.length+' temas disponíveis · '+work.filter(w=>w.status==='review').length+' aprendizados em revisão · '+work.filter(w=>w.status==='done').length+' registros concluídos pelo time. Práticas não certificam modelos.';
  grid.innerHTML=courses.map(c=>'<article class="course-card"><div class="course-icon" aria-hidden="true">✦</div><span class="eyebrow">'+esc(c.topic??c.level)+'</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.detail)+'</p><button class="btn secondary" data-course="'+c.id+'">Praticar e aplicar →</button></article>').join('')||'<p>Nenhum tema neste filtro.</p>';
  nodes(grid,'[data-course]').forEach(button=>button.addEventListener('click',()=>practice(button.dataset.course)));
 }
 function practice(id){
  const course=coursesFor(selected).find(c=>c.id===id);if(!course)return;
  const host=root.querySelector('#coursePractice');
  host.innerHTML='<form class="practice"><h3>'+esc(course.title)+'</h3><fieldset><legend>'+esc(course.question)+'</legend>'+course.choices.map((c,i)=>'<label><input type="radio" name="answer" required value="'+i+'"> '+esc(c)+'</label>').join('')+'</fieldset><button class="btn secondary" type="submit">Conferir meu raciocínio</button><p role="status"></p></form><div class="b2g-actions"><button class="btn secondary" data-learn>Registrar caso para revisão</button><button class="btn secondary" data-apply>Criar missão prática</button></div>';
  host.querySelector('form').addEventListener('submit',event=>{event.preventDefault();host.querySelector('[role=status]').textContent=Number(new FormData(event.currentTarget).get('answer'))===course.answer?'Raciocínio correto nesta prática. Acrescente um caso real e suas evidências para revisão. Isso não certifica o agente.':'Vamos revisar: '+course.detail;});
  const agent=root.querySelector('#schoolAgent').value||course.agents?.[0]||'escola';
  const draft=kind=>compose(agent,{kind,title:(kind==='lesson'?'Aprendizado: ':'Aplicar: ')+course.title,notes:'Tema: '+course.title+'\nHabilidade: '+course.detail+'\nCaso real e fonte: \nResultado esperado / indicador: \nResponsável e prazo: \nLimites e revisão: '});
  host.querySelector('[data-learn]').addEventListener('click',()=>draft('lesson'));host.querySelector('[data-apply]').addEventListener('click',()=>draft('task'));host.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 root.querySelector('#schoolAgent')?.addEventListener('change',drawSchool);
 root.querySelector('#schoolSearch')?.addEventListener('input',drawSchool);
 root.querySelector('[data-executive]')?.addEventListener('click',()=>compose('estrategico',{title:'Pauta executiva: ',notes:'Diretriz da diretoria / gestão: \nObjetivo e indicador: \nÁreas envolvidas: \nResponsável e prazo: \nEvidências e decisão para revisão: '}));
 if(current())load();
}
function mountRadar(root,isAlive,onDispose,{db,user}){
 let snapshot=null,abort=null,loading=false;
 onDispose(()=>abort?.abort());
 const msg=root.querySelector('#b2gStatus'),results=root.querySelector('#b2gResults'),meta=root.querySelector('#b2gMeta'),refresh=root.querySelector('#refreshB2g'),awardButton=root.querySelector('#refreshAwards');
 const url=source=>{try{const u=new URL(source);return u.origin===PNCP?u.href:PNCP;}catch{return PNCP;}};
 function draw(){
  if(!isAlive()||!snapshot)return;
  const q=root.querySelector('#b2gSearch').value,mode=root.querySelector('#b2gView').value,rows=correlate(mode==='awards'?snapshot.awards:snapshot.purchases,q);
  meta.textContent=`Coleta: ${date(snapshot.collected_at)} · ${snapshot.scanned} publicações consultadas de ${snapshot.total} no recorte · ${snapshot.purchases.length} candidatas por texto · ${snapshot.awards.length} resultados homologados na amostra (coleta: ${date(snapshot.awards_collected_at??snapshot.collected_at)}). ${snapshot.scope}`;
  const latest=mode==='awards'?latestInSample(rows):null;
  const latestBox=latest?`<div class="b2g-latest"><strong>Resultado mais recente neste filtro e nesta amostra</strong><p>${money(latest.unit_price)} / ${esc(latest.unit)} · ${esc(latest.supplier)} · ${esc(latest.date)}</p><small>Não é o último preço global nem comprova equivalência com seu SKU. Valide descrição, embalagem, edital e condições.</small></div>`:'';
  results.innerHTML=latestBox+(rows.length?`<div class="b2g-grid">${rows.slice(0,40).map(r=>mode==='awards'?`<article class="b2g-card"><span class="mission-state done">Homologado · fonte PNCP</span><h3>${esc(r.description)}</h3><div class="award-price">${money(r.unit_price)} <small>/ ${esc(r.unit)}</small></div><dl><dt>Fornecedor informado</dt><dd>${esc(r.supplier)}</dd><dt>CNPJ</dt><dd>${esc(r.supplier_id)}</dd><dt>Data do resultado</dt><dd>${esc(r.date)}</dd><dt>Quantidade homologada</dt><dd>${esc(r.quantity)}</dd><dt>Compra · item</dt><dd>${esc(r.purchase_id)} · ${esc(r.item)}</dd></dl><p class="mini">Correspondência textual para investigação; catálogo ERP e validação técnica ainda pendentes.</p><a href="${url(r.source)}" target="_blank" rel="noopener noreferrer">Evidência do resultado ↗</a> · <a href="${url(r.url)}" target="_blank" rel="noopener noreferrer">Contratação ↗</a></article>`:`<article class="b2g-card"><div class="row"><span class="mission-state review">${esc(r.status)}</span><small>${esc(r.city)} · ${esc(r.state)}</small></div><h3>${esc(r.object)}</h3><p>${esc(r.buyer)}</p><small>${esc(r.unit)}</small><dl><dt>Publicação</dt><dd>${esc(date(r.published))}</dd><dt>Encerramento informado</dt><dd>${esc(date(r.closes))}</dd></dl><p class="mini">Situação informada na fonte na coleta. Confirme vigência e retificações antes de agir.</p><a href="${url(r.url)}" target="_blank" rel="noopener noreferrer">Abrir contratação oficial ↗</a><p><button type="button" class="btn secondary" data-b2g-mission="${esc(r.id)}">Criar missão de revisão</button><span class="work-status" role="status"></span></p></article>`).join('')}</div>${rows.length>40?'<p>Mostrando os primeiros 40 registros deste filtro. Refine o produto.</p>':''}`:'<div class="squad-empty">Nenhum registro encontrado nesta amostra. Isso não significa ausência de licitações ou resultados no mercado.</div>');
  nodes(results,'[data-b2g-mission]').forEach(button=>button.addEventListener('click',()=>createMission(button)));
 }
 async function createMission(button){
  const record=snapshot.purchases.find(p=>p.id===button.dataset.b2gMission);if(!record||!isAlive())return;
  button.disabled=true;const message=button.parentElement.querySelector('[role=status]');message.textContent='Registrando revisão no Quartel…';
  const payload={company_id:'distribuidora_prohospital',created_by:user.id,agent_id:'b2g',kind:'task',title:`Revisar contratação ${record.id}`,status:'review',notes:`Fonte: ${record.url}\nÓrgão: ${record.buyer}\nObjeto: ${record.object.slice(0,1800)}\nPróximos passos: conferir edital e itens; validar especificação, embalagem e unidade; correlacionar SKU; pesquisar resultados e condições; revisar custo, margem, capacidade e prazo com o responsável B2G. Não autoriza proposta ou lance.`};
  const {data,error}=await db.from('cip_agent_work').insert(payload).select('id');
  if(!isAlive())return;
  if(error||!data?.length){button.disabled=false;message.textContent='Não foi possível registrar. Confira permissão e conexão.';}else{message.textContent='Missão salva na Distribuidora. Consulte o Quartel; aguarda revisão humana.';}
 }
 async function run(action){
  if(loading)return;loading=true;abort=new AbortController();refresh.disabled=awardButton.disabled=true;root.classList.add('radar-working');
  try{await action();}catch{if(isAlive())msg.textContent='A consulta não foi concluída. A coleta anterior foi preservada; confira a fonte oficial.';}
  finally{if(isAlive()){refresh.disabled=awardButton.disabled=false;root.classList.remove('radar-working');}loading=false;}
 }
 refresh.addEventListener('click',()=>run(async()=>{
  msg.textContent='Íris está consultando publicações no PNCP…';
  const end=new Date(),start=new Date(end);start.setDate(start.getDate()-30);const fmt=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d).replaceAll('-','');
  const data=await fetchPublications({start:fmt(start),end:fmt(end),signal:abort.signal});if(!isAlive())return;
  snapshot={...snapshot,collected_at:new Date().toISOString(),scope:'Consulta da primeira página (50 registros) de pregões publicados no Ceará nos últimos 30 dias. Resultados homologados mantêm sua própria data da coleta publicada.',scanned:data.scanned,total:data.total,purchases:data.purchases};draw();msg.textContent='Consulta confirmada. Filtro de saúde por texto; revise os itens no edital. Os resultados homologados podem ser atualizados pelo botão ao lado.';
 }));
 awardButton.addEventListener('click',()=>run(async()=>{
  if(!snapshot)return;const collected=[],candidates=snapshot.purchases.filter(p=>Number(p.total_awarded)>0).slice(0,4);let failed=0;
  if(!candidates.length){msg.textContent='Não há contratações com total homologado informado nesta amostra. A ausência não prova inexistência de resultado.';return;}
  for(const p of candidates){
   if(!isAlive())return;msg.textContent=`Íris está verificando itens e resultados de ${p.id}…`;
   try{const items=await getJson(`${PNCP}/api/pncp/v1/orgaos/${p.cnpj}/compras/${p.year}/${p.sequence}/itens`,{signal:abort.signal});
    for(const item of (Array.isArray(items)?items:[]).filter(i=>i.temResultado).slice(0,3)){
     const raw=await getJson(`${PNCP}/api/pncp/v1/orgaos/${p.cnpj}/compras/${p.year}/${p.sequence}/itens/${item.numeroItem}/resultados`,{signal:abort.signal});const record=awardedRecord(p,item,raw);if(record)collected.push(record);
    }
   }catch{failed++;}
  }
  if(!isAlive())return;
  if(collected.length){snapshot.awards=collected;snapshot.awards_collected_at=new Date().toISOString();root.querySelector('#b2gView').value='awards';draw();}
  msg.textContent=`Consulta encerrada: ${collected.length} resultados homologados confirmados agora; ${failed} contratação(ões) não puderam ser verificadas. Consulta limitada a 4 contratações e 3 itens por contratação; não é histórico completo. ${collected.length?'':'A coleta anterior foi mantida.'}`;
 }));
 root.querySelector('#b2gSearch').addEventListener('input',draw);root.querySelector('#b2gView').addEventListener('change',draw);
 run(async()=>{const response=await fetch('./b2g-snapshot.json',{cache:'no-cache',signal:abort.signal});if(!response.ok)throw Error();const data=await response.json();if(!isAlive())return;snapshot=data;draw();msg.textContent='Coleta pública carregada. Use os filtros para investigar. Nenhuma busca contínua está em execução.';});
}
