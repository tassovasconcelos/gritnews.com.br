import {AGENTS,agentsFor,escapeHtml as esc,COMPANIES} from './agents-data.mjs';
import {MATERIAL_TYPES,STATES,FILE_TYPES,validMaterial,validFile,safeLink,isDue,learningState,knowledgeContext} from './academy-engine.mjs';
const INGEST={not_required:'Orientação cadastrada',queued:'Na fila de leitura',processing:'Lendo conteúdo',ready:'Leitura concluída',failed:'Falha de leitura',manual_required:'Requer revisão / OCR'};
const date=v=>v?new Date(v.length===10?v+'T12:00:00':v).toLocaleDateString('pt-BR'):'—';
export function academyFrame(){return `<section id="academy" class="academy card"><div class="row"><div><span class="eyebrow">SOFIA · EDUCAÇÃO CONTINUADA</span><h2>Conhecimento que evolui com a operação</h2><p>Adicione uma fonte, transforme em habilidade, teste um caso e revise o resultado. Materiais e versões ficam compartilhados na empresa selecionada.</p></div></div><nav class="academy-tabs" aria-label="Áreas da escola"><button class="btn secondary" data-tab="library" aria-pressed="true">Biblioteca</button><button class="btn secondary" data-tab="skills" aria-pressed="false">Habilidades</button><button class="btn secondary" data-tab="renewal" aria-pressed="false">Revisão e renovação</button></nav><p id="academyStatus" role="status">Carregando a biblioteca…</p><div id="academyMetrics" class="squad-summary"></div><div class="squad-filters"><label>Especialista<select id="academyAgent"><option value="">Todo o squad</option></select></label><label>Buscar material ou habilidade<input id="academySearch" type="search" placeholder="Ex.: ruptura, cotação, margem"></label></div><div class="b2g-actions"><button class="btn" data-new-material>＋ Material de apoio</button><button class="btn secondary" data-new-skill>＋ Desenvolver habilidade</button><button class="btn secondary" data-search-content>Buscar no texto dos materiais</button><button class="btn secondary" data-export>Consultar contexto aprovado</button></div><div id="academyEditor"></div><div id="academyRecords" class="academy-records"></div><div id="academyContext"></div><p class="mini">Anexos privados · PDF, TXT, MD, DOCX e XLSX até 10 MB. Leitura automática no servidor. Links públicos são conferidos diariamente; mudanças exigem nova revisão. PDF digitalizado requer OCR. Até 200 páginas PDF e 1 milhão de caracteres por fonte; limites são sinalizados sem publicação parcial. Avaliações são humanas; não representam treinamento automático de um modelo.</p></section>`;}
export function mountAcademy(root,{db,user,getCompany,isAlive,onDispose}){
 const host=root.querySelector('#academy');if(!host)return {refresh:()=>{}};
 let alive=true,generation=0,company='',tab='library',materials=[],skills=[],evaluations=[],jobs=[],canReview=false,ready=false;
 const live=()=>alive&&isAlive()&&host.isConnected;
 const status=host.querySelector('#academyStatus'),editor=host.querySelector('#academyEditor'),records=host.querySelector('#academyRecords');
 const message=s=>{if(live())status.textContent=s;};
 const agentOptions=value=>agentsFor([company]).map(a=>`<option value="${a.id}" ${a.id===value?'selected':''}>${esc(a.name)} · ${esc(a.role)}</option>`).join('');
 async function refresh(){
  const own=++generation;company=getCompany();ready=false;editor.replaceChildren();host.querySelector('#academyContext').replaceChildren();records.replaceChildren();host.querySelector('#academyMetrics').replaceChildren();
  const select=host.querySelector('#academyAgent');select.innerHTML='<option value="">Todo o squad</option>'+agentOptions();
  message('Consultando materiais, habilidades e avaliações…');
  try{
   const [m,s,e,r,j]=await Promise.all([
    db.from('cip_academy_materials').select('*').eq('company_id',company).order('created_at',{ascending:false}).limit(200),
    db.from('cip_academy_skills').select('*').eq('company_id',company).order('created_at',{ascending:false}).limit(200),
    db.from('cip_academy_evaluations').select('*').eq('company_id',company).order('created_at',{ascending:false}).limit(400),
    db.rpc('cip_academy_reviewer',{company}),
    db.from('cip_academy_ingestion_jobs').select('material_id,status,attempts,last_error,updated_at').eq('company_id',company).limit(200)
   ]);
   if(!live()||own!==generation)return;
   if(m.error||s.error||e.error||r.error||j.error)throw Error('load');
   materials=m.data??[];skills=s.data??[];evaluations=e.data??[];jobs=j.data??[];canReview=r.data===true;ready=true;
   message(`Biblioteca de ${COMPANIES[company]??company}. Até 200 materiais e 200 habilidades recentes; histórico de até 400 avaliações.`);draw();
  }catch{if(live()&&own===generation)message('Biblioteca indisponível. Verifique a conexão e a implantação do módulo; nenhum conteúdo foi confirmado.');}
 }
 function draw(){
  if(!ready||!live())return;
  const state=learningState(materials,skills),agent=host.querySelector('#academyAgent').value,q=host.querySelector('#academySearch').value.toLocaleLowerCase('pt-BR');
  host.querySelector('#academyMetrics').innerHTML=[[materials.length,'materiais no recorte'],[state.skills.length,'habilidades liberadas'],[state.due.length,'fontes com revisão vencida'],[skills.filter(s=>s.status==='draft').length,'habilidades em desenvolvimento']].map(([n,t])=>`<div><b>${n}</b><span>${t}</span></div>`).join('');
  host.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
  const rows=(tab==='skills'?skills:tab==='renewal'?[...materials.filter(m=>m.status==='draft'||isDue(m)),...skills.filter(s=>s.status==='draft'||state.blocked.includes(s))]:materials).filter(x=>(!agent||x.agent_id===agent)&&`${x.title} ${x.content??x.instructions}`.toLocaleLowerCase('pt-BR').includes(q));
  records.innerHTML=rows.map(row=>{
   const job=jobs.find(j=>j.material_id===row.id);
   const skill='instructions' in row,evaluation=skill?evaluations.find(e=>e.skill_id===row.id):null,active=skill?state.skills.some(s=>s.id===row.id):state.sources.some(m=>m.id===row.id);
   return `<article class="academy-record"><div class="row"><span class="mission-state">${esc(skill?'Habilidade':MATERIAL_TYPES[row.kind])} · ${esc(STATES[row.status])}</span><small>${esc(AGENTS.find(a=>a.id===row.agent_id)?.name)}</small></div><h3>${esc(row.title)}</h3>${!skill?`<p class="mini">${esc(INGEST[job?.status==='processing'?'processing':row.ingestion_status]??'Orientação cadastrada')}${job?' · Tentativas: '+job.attempts:''}${job?.last_error?' · '+esc(job.last_error):''}</p>`:''}<p>${esc(row.content??row.instructions)}</p>${skill?`<p><strong>Limites:</strong> ${esc(row.limits)}</p><p><strong>Cenário de teste:</strong> ${esc(row.test_case)}</p><p><strong>Resultado esperado:</strong> ${esc(row.expected_result)}</p><p>Fontes vinculadas: ${row.source_ids.map(id=>esc(materials.find(m=>m.id===id)?.title??'Fonte fora deste recorte')).join(' · ')}</p>`:''}<p class="mini">Versão ${esc(row.id.slice(0,8))} · ${date(row.created_at)} · Revisar até ${date(row.review_due)}${row.supersedes_id?' · Revisão de '+esc(row.supersedes_id.slice(0,8)):''}</p><p class="academy-state ${active?'current':'pending'}">${active?'Disponível para consulta com evidências':row.status==='retired'?'Versão retirada':isDue(row)?'Revisão vencida: fora do contexto de consulta':row.status==='approved'?'Fora de uso: fonte substituída, vencida ou versão posterior':'Aguarda revisão e liberação'}</p>${evaluation?`<details><summary>Última avaliação humana · ${date(evaluation.created_at)}</summary><p>${esc(evaluation.observed_result)}</p><p>Fontes: ${evaluation.source_valid?'OK':'revisar'} · Cenário: ${evaluation.scenario_passed?'OK':'revisar'} · Limites: ${evaluation.limits_passed?'OK':'revisar'}</p></details>`:''}<div class="b2g-actions">${!skill&&(row.file_path||row.source_url)?`<button class="btn secondary" data-process="${row.id}">Processar / conferir fonte</button><button class="btn secondary" data-read="${row.id}">Ler texto extraído</button>`:''}${safeLink(row.source_url)?`<a href="${esc(safeLink(row.source_url))}" target="_blank" rel="noopener noreferrer">Abrir fonte ↗</a>`:''}${row.file_path?`<button class="btn secondary" data-file="${esc(row.id)}">Baixar ${esc(row.file_name??'anexo')}</button>`:''}<button class="btn secondary" data-revise="${row.id}" data-kind="${skill?'skill':'material'}">Criar nova versão</button>${canReview&&row.status!=='retired'?`${skill?`<button class="btn secondary" data-evaluate="${row.id}">Registrar avaliação</button>`:''}<button class="btn secondary" data-approve="${row.id}" data-kind="${skill?'skill':'material'}">Aprovar versão</button><button class="btn secondary" data-retire="${row.id}" data-kind="${skill?'skill':'material'}">Retirar</button>`:''}</div></article>`;
  }).join('')||'<p class="squad-empty">Nenhum registro neste filtro. Adicione uma fonte ou desenvolva uma habilidade.</p>';
 }
 function showForm(kind,previous){
  const skill=kind==='skill',state=learningState(materials,skills);
  editor.innerHTML=`<form class="academy-form"><h3>${previous?'Nova versão de ':skill?'Desenvolver habilidade':'Adicionar material de apoio'}${previous?esc(previous.title):''}</h3><label>Título<input name="title" required minlength="4" maxlength="160"></label><div class="squad-filters"><label>Especialista<select name="agent_id">${agentOptions(previous?.agent_id||host.querySelector('#academyAgent').value)}</select></label><label>Próxima revisão<input name="review_due" type="date" required></label></div>${skill?`<label>Como aplicar a habilidade<textarea name="instructions" required minlength="20" maxlength="12000" rows="4"></textarea></label><label>Limites e situações para escalar ao gestor<textarea name="limits" required minlength="10" maxlength="3000"></textarea></label><label>Cenário para avaliação<textarea name="test_case" required minlength="10" maxlength="3000"></textarea></label><label>Resultado esperado<textarea name="expected_result" required minlength="10" maxlength="3000"></textarea></label><fieldset><legend>Fontes aprovadas e atuais</legend>${state.sources.map(m=>`<label class="academy-check"><input type="checkbox" name="source_ids" value="${m.id}" ${previous?.source_ids?.includes(m.id)?'checked':''}>${esc(m.title)}</label>`).join('')||'<p>Aprove um material antes de desenvolver a habilidade.</p>'}</fieldset>`:`<label>Tipo<select name="kind">${Object.entries(MATERIAL_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Orientação adicional (opcional para arquivos e links)<textarea name="content" minlength="20" maxlength="20000" rows="5" placeholder="Como aplicar, exemplos e cuidados. Arquivos e links públicos entram na fila de leitura automaticamente."></textarea></label><label>Link da fonte (HTTPS)<input name="source_url" type="url" maxlength="2000" placeholder="https://"></label><label>Documento<input name="attachment" type="file" accept=".pdf,.txt,.md,.docx,.xlsx"></label>`}<p class="mini">Uma versão salva começa em rascunho. ${skill?'A aprovação exige avaliação com fontes, cenário e limites conferidos.':'O resumo compõe o contexto de consulta após aprovação.'}</p><div class="b2g-actions"><button class="btn" type="submit">Salvar rascunho</button><button class="btn secondary" type="button" data-close>Cancelar</button></div><p role="status"></p></form>`;
  const form=editor.querySelector('form');for(const [key,value] of Object.entries(previous??{}))if(form.elements[key]&&key!=='source_ids'&&key!=='attachment')form.elements[key].value=value??'';
  if(!previous)form.elements.review_due.value=new Date(Date.now()+90*864e5).toISOString().slice(0,10);
  form.addEventListener('submit',async e=>{
   e.preventDefault();const own=generation,scope=company,button=form.querySelector('[type=submit]'),note=form.querySelector('[role=status]'),data=new FormData(form),payload={company_id:scope,agent_id:data.get('agent_id'),title:data.get('title').trim(),review_due:data.get('review_due'),created_by:user.id,status:'draft',supersedes_id:previous?.id??null};let filePath=null;
   if(skill){for(const k of ['instructions','limits','test_case','expected_result'])payload[k]=data.get(k).trim();payload.source_ids=data.getAll('source_ids');if(!payload.source_ids.length){note.textContent='Selecione ao menos uma fonte aprovada.';return;}}
   else{if(!data.get('content').trim()&&data.get('kind')==='orientation'&&!data.get('source_url').trim()&&!data.get('attachment')?.size&&!previous?.file_path){note.textContent='Descreva a orientação ou inclua um arquivo/link para leitura.';return;}Object.assign(payload,{kind:data.get('kind'),content:data.get('content').trim()||'Leitura automática solicitada. Conteúdo aguardando extração e revisão da escola.',source_url:data.get('source_url').trim()||null});if(!validMaterial(payload)){note.textContent='Confira título, conteúdo, data e link HTTPS.';return;}}
   const file=skill?null:data.get('attachment');if(file?.size&&!validFile(file)){note.textContent='Use PDF, TXT, MD, DOCX ou XLSX de até 10 MB.';return;}
   if(!skill&&payload.kind==='document'&&!file?.size&&!previous?.file_path){note.textContent='Selecione o documento para anexar.';return;}
   button.disabled=true;note.textContent='Salvando…';
   try{
    if(!skill&&file?.size){const ext=file.name.split('.').pop().toLowerCase();filePath=`${scope}/${user.id}/${crypto.randomUUID()}.${ext}`;const upload=await db.storage.from('cip-academy').upload(filePath,file,{contentType:FILE_TYPES[ext],upsert:false});if(upload.error)throw upload.error;payload.file_path=filePath;payload.file_name=file.name;}
    else if(!skill&&previous?.file_path){payload.file_path=previous.file_path;payload.file_name=previous.file_name;}
    // A completed upload stays in its original company even if navigation changes.
    if(!live()||own!==generation){if(filePath)await db.storage.from('cip-academy').remove([filePath]);return;}
    const result=await db.from(skill?'cip_academy_skills':'cip_academy_materials').insert(payload).select('id');if(result.error||!result.data?.length)throw result.error??Error('unsaved');
    if(!skill&&(payload.file_path||payload.source_url))void db.functions.invoke('cip-academy-ingest',{body:{material_id:result.data[0].id}}).catch(()=>{});
    if(live()&&own===generation){await refresh();message('Rascunho salvo. A revisão e a avaliação continuam na escola.');}
   }catch{if(filePath)await db.storage.from('cip-academy').remove([filePath]);if(live()&&own===generation){button.disabled=false;note.textContent='Não foi possível salvar. Confira sua permissão, a conexão e o documento.';}}
  });form.querySelector('input').focus();editor.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 function evaluate(id){
  const skill=skills.find(s=>s.id===id);if(!skill||!canReview)return;
  editor.innerHTML=`<form class="academy-form"><h3>Avaliar: ${esc(skill.title)}</h3><p><strong>Cenário:</strong> ${esc(skill.test_case)}</p><p><strong>Esperado:</strong> ${esc(skill.expected_result)}</p><label>Resultado observado e evidências<textarea name="observed_result" required minlength="20" maxlength="5000" rows="5" placeholder="Descreva a execução do caso, a resposta observada e as evidências. Sem execução, registre como pendente."></textarea></label>${[['source_valid','Fontes conferidas e válidas'],['scenario_passed','Cenário executado com resultado esperado'],['limits_passed','Limites e regras respeitados']].map(([k,t])=>`<label class="academy-check"><input name="${k}" type="checkbox">${t}</label>`).join('')}<p class="mini">Avaliação declarada pelo revisor. Um resultado reprovado devolve a habilidade para rascunho.</p><button class="btn" type="submit">Registrar avaliação</button><button class="btn secondary" type="button" data-close>Cancelar</button><p role="status"></p></form>`;
  editor.querySelector('form').addEventListener('submit',async e=>{
   e.preventDefault();const own=generation,form=e.currentTarget,button=form.querySelector('[type=submit]'),note=form.querySelector('[role=status]');button.disabled=true;
   const payload={company_id:company,skill_id:id,created_by:user.id,observed_result:form.elements.observed_result.value.trim()};for(const k of ['source_valid','scenario_passed','limits_passed'])payload[k]=form.elements[k].checked;
   try{const {data,error}=await db.from('cip_academy_evaluations').insert(payload).select('id');if(error||!data?.length)throw error;if(live()&&own===generation){await refresh();message('Avaliação registrada. A liberação da versão exige aprovação do revisor.');}}
   catch{if(live()&&own===generation){button.disabled=false;note.textContent='Avaliação não registrada. Verifique sua permissão e conexão.';}}
  });editor.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 async function click(event){
  const b=event.target.closest('button');if(!b||!host.contains(b))return;
  if(b.hasAttribute('data-close')){editor.replaceChildren();return;}
  if(b.dataset.tab){tab=b.dataset.tab;draw();return;}
  if(!ready){message('Aguarde carregar a biblioteca.');return;}
  if(b.hasAttribute('data-new-material'))return showForm('material');
  if(b.hasAttribute('data-new-skill'))return showForm('skill');
  if(b.dataset.revise)return showForm(b.dataset.kind,(b.dataset.kind==='skill'?skills:materials).find(x=>x.id===b.dataset.revise));
  if(b.dataset.evaluate)return evaluate(b.dataset.evaluate);
  if(b.hasAttribute('data-export')){
   const exportGeneration=generation,exportCompany=company;
   const ids=materials.map(m=>m.approved_extraction_id).filter(Boolean).slice(0,20);let extractions=[];
   if(ids.length){const extracted=await db.from('cip_academy_extractions').select('id,material_id,text_content,complete').in('id',ids).eq('company_id',company);if(extracted.error){message('Não foi possível carregar os textos aprovados.');return;}extractions=extracted.data??[];}
   if(!live()||exportGeneration!==generation||exportCompany!==company)return;
   const context=knowledgeContext({materials,skills,extractions,company,agent:host.querySelector('#academyAgent').value,query:host.querySelector('#academySearch').value});
   const box=host.querySelector('#academyContext');box.innerHTML='<h3>Contexto revisado para consulta</h3><p class="mini">Somente fontes e habilidades atuais. Este contexto ainda não está conectado a um executor de IA.</p><pre></pre>';box.querySelector('pre').textContent=JSON.stringify(context,null,2);box.scrollIntoView({behavior:'smooth',block:'nearest'});return;
  }
  const own=generation,scope=company;b.disabled=true;
  try{
   if(b.hasAttribute('data-search-content')){
    const result=await db.rpc('cip_academy_search',{p_company:scope,p_query:host.querySelector('#academySearch').value,p_agent:host.querySelector('#academyAgent').value||null,p_limit:12});if(result.error)throw result.error;
    if(live()&&own===generation){const box=host.querySelector('#academyContext');box.innerHTML='<h3>Resultados no conteúdo aprovado</h3>'+((result.data??[]).map(r=>'<article class="academy-record"><h4>'+esc(r.title)+'</h4><small>'+esc(r.locator)+' · versão '+esc(r.extraction_id.slice(0,8))+'</small><p>'+esc(r.content)+'</p></article>').join('')||'<p>Nenhum trecho aprovado e atual encontrado. Extrações novas precisam de revisão.</p>');box.scrollIntoView({behavior:'smooth',block:'nearest'});}return;
   }
   if(b.dataset.process){const result=await db.functions.invoke('cip-academy-ingest',{body:{material_id:b.dataset.process}});if(result.error)throw result.error;if(live()&&own===generation){await refresh();message('Solicitação de leitura consultada. Confira o estado e eventual orientação de revisão.');}return;}
   if(b.dataset.read){const result=await db.from('cip_academy_extractions').select('id,text_content,complete,warnings,method,units,created_at').eq('company_id',scope).eq('material_id',b.dataset.read).order('created_at',{ascending:false}).limit(1);if(result.error)throw result.error;
    if(live()&&own===generation){const box=host.querySelector('#academyContext'),r=result.data?.[0];box.innerHTML='<h3>Texto extraído da fonte</h3>'+(r?'<p>'+esc(r.method)+' · '+esc(r.units)+' unidades · '+(r.complete?'Texto extraído; aguarda revisão humana.':'Leitura incompleta: verificar OCR ou avisos.')+'</p><p>'+esc((r.warnings??[]).join(' '))+'</p><pre></pre>':'<p>A extração ainda não está disponível. Confira a fila de leitura.</p>');if(r)box.querySelector('pre').textContent=r.text_content;box.scrollIntoView({behavior:'smooth',block:'nearest'});}return;
   }
   if(b.dataset.file){const m=materials.find(x=>x.id===b.dataset.file);const {data,error}=await db.storage.from('cip-academy').download(m.file_path);if(error)throw error;if(live()&&own===generation){const a=document.createElement('a'),url=URL.createObjectURL(data);a.href=url;a.download=m.file_name||'documento';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}return;}
   if(b.dataset.approve||b.dataset.retire){
    const {data,error}=await db.from(b.dataset.kind==='skill'?'cip_academy_skills':'cip_academy_materials').update({status:b.dataset.approve?'approved':'retired'}).eq('id',b.dataset.approve||b.dataset.retire).eq('company_id',scope).select('id');
    if(error||!data?.length)throw error;
    if(live()&&own===generation){await refresh();message('Estado da versão atualizado. Materiais vencidos ou substituídos saem do contexto de consulta.');}
   }
  }catch{if(live()&&own===generation)message('Operação não confirmada. Aprovar exige perfil de revisor, prazo válido, leitura concluída, fontes atuais e avaliação aprovada para habilidades.');}
  finally{if(live())b.disabled=false;}
 }
 host.addEventListener('click',click);host.querySelector('#academySearch').addEventListener('input',draw);host.querySelector('#academyAgent').addEventListener('change',draw);
 const timer=setInterval(()=>{if(live()&&!editor.childElementCount&&!host.contains(document.activeElement)&&jobs.some(j=>['queued','processing','failed'].includes(j.status)&&j.attempts<3))refresh();},20000);
 onDispose(()=>{clearInterval(timer);alive=false;++generation;host.removeEventListener('click',click);});
 refresh();return {refresh};
}
