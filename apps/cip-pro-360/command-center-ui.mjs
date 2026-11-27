import {COMMAND_KINDS,DECISION_STATES,availableActions,evidenceStatus,freshness,rankFeed,insightCounters,safeCsv,safeExternalUrl} from './command-center-engine.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=v=>v?new Date(v).toLocaleString('pt-BR'):'Sem data';
const money=v=>v===null||v===undefined||!Number.isFinite(Number(v))?'Não informado':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const names={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
const labels={em_analise:'Registrar análise',apuracao_autorizada:'Autorizar apuração',plano_aprovado:'Aprovar plano, sem executar',rejeitada:'Rejeitar',em_acompanhamento:'Em acompanhamento',resultado_declarado:'Declarar resultado para auditoria'};
const key=x=>x.source_kind+':'+x.source_ref;
export function commandCenterFrame(){
 return '<section class="cc" id="cipCommandCenter" aria-labelledby="ccTitle">'+
 '<header class="cc-head"><div class="cc-brand"><img src="./logo-grupo-prohospital.jpg" alt="Logo oficial Grupo Prohospital"><div><small>CIP360 · INTELIGÊNCIA COMERCIAL</small><h1 id="ccTitle">Central de Ações</h1><p>Da evidência à decisão supervisionada · Shopping e Distribuidora</p></div></div><div class="cc-head-controls"><label>Empresa<select data-cc-company></select></label><button class="btn secondary" type="button" data-cc-reload>Atualizar fontes</button></div></header>'+
 '<p class="cc-notice" data-cc-status role="status">Consultando fontes...</p>'+
 '<section class="cc-squad"><div class="cc-section-title"><div><small>CONSELHO DE INTELIGÊNCIA</small><h2>Agentes trabalhando com dados rastreáveis</h2><p>Diagnósticos efetivamente registrados no último ciclo; não são análises inventadas.</p></div><span data-cc-cycle-time></span></div><div data-cc-agents class="cc-squad-grid"></div></section>'+
 '<div class="cc-stats" data-cc-stats></div>'+
 '<div class="cc-cols"><section class="cc-opportunities"><div class="cc-section-title"><div><small>RADAR DE OPORTUNIDADES</small><h2>Sugestões fundamentadas</h2><p>Estoque, concorrência, missões e campanhas, com fonte e data.</p></div><button class="btn secondary" type="button" data-cc-export>Exportar CSV</button></div>'+
 '<div class="cc-filters"><label>Fonte<select data-cc-kind><option value="todos">Todas</option><option value="estoque">Estoque</option><option value="radar">Radar</option><option value="missao">Missões</option><option value="campanha">Campanhas</option></select></label>'+
 '<label>SKU ou produto<input data-cc-query type="search" maxlength="100" placeholder="Filtrar oportunidades"></label>'+
 '<label>Estado<select data-cc-state><option value="todos">Todos</option><option value="pendente">Sem decisão</option><option value="em_analise">Em análise</option><option value="apuracao_autorizada">Apuração autorizada</option><option value="plano_aprovado">Plano aprovado</option><option value="rejeitada">Rejeitada</option><option value="em_acompanhamento">Em acompanhamento</option><option value="resultado_declarado">Resultado declarado</option></select></label></div>'+
 '<div data-cc-feed class="cc-feed">Consultando recomendações...</div></section>'+
 '<aside class="cc-governance"><small>GOVERNANÇA OPERACIONAL</small><h2>A inteligência recomenda. A gestão decide.</h2>'+
 ['Detectar evidência','Conferir SKU e margem','Aprovar com alçada','Encaminhar para pessoa responsável','Medir resultado conciliado'].map((x,i)=>'<div class="cc-step"><b>0'+(i+1)+'</b><strong>'+x+'</strong></div>').join('')+
 '<p class="cc-rule">Esta Central não altera preços no Procfit, anúncios, estoque nem compras. Dados históricos não são dados atuais; ofertas candidatas não são preços homologados.</p>'+
 '<button type="button" class="btn secondary" data-cc-tower>Torre de Comando</button><button type="button" class="btn secondary" data-cc-price>Marca-passo</button></aside></div>'+
 '<p class="cc-foot">Tela atualizada a cada 90 segundos enquanto visível. Agentes e pesquisas executam apenas por jobs existentes; atualizar a tela não inicia pesquisa de concorrentes.</p></section>';
}
export function mountCommandCenter({db,user,companies=[],allowedRoutes=[],onDispose}){
 const root=document.getElementById('cipCommandCenter');if(!root)return;
 const $=s=>root.querySelector(s),live=()=>alive&&root.isConnected&&window.cipAuth?.email===user.email;
 let company=companies.includes('shopping_prohospital')?'shopping_prohospital':companies[0]||'',alive=true,seq=0,canManage=false,feed=[],decisions=[],cycle=null,busy=false,kind='todos',term='',state='todos';
 const decisionMap=()=>new Map(decisions.map(d=>[key(d),d]));
 const visible=()=>{const m=decisionMap();return rankFeed(feed,kind,term).filter(r=>state==='todos'||(m.get(key(r))?.state||'pendente')===state);};
 const notice=t=>{if(live())$('[data-cc-status]').textContent=t;};
 $('[data-cc-company]').innerHTML=companies.map(c=>'<option value="'+esc(c)+'">'+esc(names[c]||c)+'</option>').join('');
 $('[data-cc-company]').value=company;
 function renderAgents(){
  const a=Array.isArray(cycle?.report?.agents)?cycle.report.agents:[];
  $('[data-cc-cycle-time]').textContent=cycle?'Último ciclo: '+when(cycle.created_at):'Nenhum ciclo consultável';
  $('[data-cc-agents]').innerHTML=a.length?a.slice(0,7).map((x,i)=>
   '<article class="cc-agent"><div class="cc-avatar" style="--delay:'+(-i*.35)+'s">✺</div><strong>'+
   esc(({precos:'Marca-passo',radar:'Radar',marketing:'Campanhas',comercial:'Vendas e CRM'}[x.agent_id]||x.agent_id))+
   '</strong><small>'+(x.stale?'Fonte histórica · verificar':'Análise registrada')+'</small><p>'+esc(String(x.analysis||'Sem diagnóstico').slice(0,170))+'</p></article>').join(''):
   '<p class="cc-empty">Nenhuma análise registrada para esta empresa.</p>';
 }
 function card(r,d){
  const type=COMMAND_KINDS[r.source_kind]||COMMAND_KINDS.missao,f=freshness(r),quality=evidenceStatus(r),url=safeExternalUrl(r.source_url);
  const current=d?.state||'pendente',actions=availableActions(current,f.fresh,canManage);
  let html='<article class="cc-card"><div class="cc-card-top"><span>'+esc(type.icon)+' '+esc(type.label)+'</span><b>'+esc(r.priority>=85?'Prioridade elevada':'Revisar')+'</b></div>';
  html+='<h3>'+esc(r.title)+'</h3><p>'+esc(r.recommendation)+'</p><small>'+(r.sku?'SKU '+esc(r.sku)+' · ':'')+esc(when(r.source_at))+'</small>';
  if(r.source_kind==='radar')html+='<div class="cc-market"><strong>'+esc(money(r.market_price))+'</strong><span>Oferta candidata, frete '+esc(money(r.market_shipping))+'; disponibilidade '+esc(r.availability||'não confirmada')+'</span></div>';
  html+='<div class="cc-tags"><span class="'+(f.fresh?'cc-fresh':'cc-stale')+'">'+esc(f.label)+'</span><span>'+esc(DECISION_STATES[current]||'Sem decisão')+'</span></div>';
  html+='<details><summary>Evidências e decisão</summary><p>Confiabilidade: '+esc(quality.label)+' · Origem: '+esc(r.evidence?.origin||r.source_kind)+'</p>';
  if(url)html+='<p><a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">Consultar anúncio ou evidência</a></p>';
  if(actions.length){
   html+='<form data-cc-decision="'+esc(key(r))+'"><label>Próxima ação<select name="action">'+
    actions.map(a=>'<option value="'+esc(a)+'">'+esc(labels[a]||a)+'</option>').join('')+'</select></label>'+
    '<label>Responsável<input name="owner" maxlength="120" value="'+esc(d?.owner_name||'')+'"></label>'+
    '<label>Justificativa<textarea name="note" rows="2" maxlength="2000" required>'+esc(d?.review_note||'')+'</textarea></label>'+
    '<label>Evidência de resultado, se aplicável<input name="evidence" maxlength="3000" placeholder="Documento, fonte e resultado"></label>'+
    '<button class="btn" type="submit">Registrar decisão</button></form>';
  }else html+='<p class="cc-muted">Somente gestão autorizada pode aprovar. Fontes vencidas precisam de nova pesquisa.</p>';
  html+='<p><button type="button" class="cc-link" data-cc-module="'+esc(type.route)+'" '+(allowedRoutes.includes(type.route)?'':'disabled')+'>Abrir módulo de origem</button></p></details></article>';
  return html;
 }
 function render(){
  const m=decisionMap(),rows=visible(),c=insightCounters(feed,decisions);
  $('[data-cc-stats]').innerHTML=[['Itens consultados',c.total,'Amostra dos 120 recentes'],['Sem decisão',c.open,'Exigem avaliação'],['Apurações/planos',c.authorized,'Não executados'],['Fontes vencidas',c.stale,'Revisar dados']].map(row=>
   '<article><small>'+row[0]+'</small><strong>'+row[1].toLocaleString('pt-BR')+'</strong><span>'+row[2]+'</span></article>').join('');
  $('[data-cc-feed]').innerHTML=rows.length?rows.slice(0,90).map(r=>card(r,m.get(key(r)))).join(''):'<p class="cc-empty">Nenhuma oportunidade para o filtro selecionado.</p>';
  renderAgents();
 }
 async function load(){
  if(!live()||!company)return;
  const id=++seq;notice('Consultando fontes autorizadas, decisões e ciclos reais...');
  const r=await Promise.allSettled([
   db.from('cip_command_feed').select('company_id,source_kind,source_ref,sku,title,recommendation,action_type,priority,source_at,quality,source_url,market_price,market_shipping,availability,evidence').eq('company_id',company).order('source_at',{ascending:false}).limit(120),
   db.from('cip_command_decisions').select('id,company_id,source_kind,source_ref,state,owner_name,review_note,version,updated_at').eq('company_id',company).order('updated_at',{ascending:false}).limit(250),
   db.from('cip_agent_cycles').select('created_at,report').eq('company_id',company).order('created_at',{ascending:false}).limit(1),
   db.rpc('cip_agent_can_manage',{p_company:company})
  ]);
  if(!live()||id!==seq)return;
  const result=i=>r[i].status==='fulfilled'?r[i].value:{error:{message:'Falha de conexão'}};
  const [a,b,c,d]=[result(0),result(1),result(2),result(3)];
  feed=a.error?[]:a.data||[];decisions=b.error?[]:b.data||[];cycle=c.error?null:c.data?.[0]||null;canManage=!d.error&&d.data===true;
  render();
  const failures=[a,b,c,d].filter(x=>x.error).length;
  notice(failures?'Algumas fontes falharam. Não inferir resultados.':'Consulta às '+new Date().toLocaleTimeString('pt-BR')+
   '. '+feed.length+' eventos; novos dados dependem dos jobs reais do CIP.');
 }
 async function decide(form){
  if(!canManage||busy)return;
  const r=feed.find(x=>key(x)===form.dataset.ccDecision);if(!r)return;
  const f=new FormData(form),action=String(f.get('action')||''),note=String(f.get('note')||'').trim(),owner=String(f.get('owner')||'').trim(),evidence=String(f.get('evidence')||'').trim();
  if(action!=='em_analise'&&note.length<12){notice('Informe justificativa de no mínimo 12 caracteres.');return;}
  if(action==='resultado_declarado'&&evidence.length<20){notice('Informe pelo menos 20 caracteres de evidência documental.');return;}
  const previous=decisionMap().get(key(r));busy=true;form.querySelector('button[type=submit]').disabled=true;
  const response=await db.rpc('cip_command_decide',{p_company:company,p_kind:r.source_kind,p_ref:r.source_ref,p_action:action,
    p_note:note,p_owner:owner||null,p_evidence:evidence,p_expected_version:previous?.version??null});
  busy=false;if(!live())return;
  if(response.error){form.querySelector('button[type=submit]').disabled=false;notice('Não registrado: '+response.error.message);return;}
  await load();notice('Decisão auditada e tarefa encaminhada quando aplicável. Nenhum preço ou estoque foi modificado.');
 }
 function exportCsv(){
  const m=decisionMap(),rows=[['Empresa','Fonte','SKU','Título','Recomendação','Prioridade','Data','Qualidade','URL','Preço candidato','Frete','Estado']];
  visible().forEach(x=>rows.push([company,x.source_kind,x.sku,x.title,x.recommendation,x.priority,x.source_at,x.quality,x.source_url,x.market_price,x.market_shipping,m.get(key(x))?.state||'pendente']));
  const u=URL.createObjectURL(new Blob([safeCsv(rows)],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=u;a.download='CIP360_Acoes_'+company+'.csv';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(u);
 }
 root.addEventListener('submit',e=>{const form=e.target.closest('[data-cc-decision]');if(form){e.preventDefault();decide(form);}});
 root.addEventListener('click',e=>{
  if(e.target.closest('[data-cc-reload]'))return load();
  if(e.target.closest('[data-cc-export]'))return exportCsv();
  if(e.target.closest('[data-cc-tower]')&&allowedRoutes.includes('torre'))return window.navigate('torre');
  if(e.target.closest('[data-cc-price]')&&allowedRoutes.includes('precos'))return window.navigate('precos');
  const n=e.target.closest('[data-cc-module]');if(n&&allowedRoutes.includes(n.dataset.ccModule))window.navigate(n.dataset.ccModule);
 });
 $('[data-cc-company]').addEventListener('change',e=>{if(companies.includes(e.target.value)){company=e.target.value;load();}});
 $('[data-cc-kind]').addEventListener('change',e=>{kind=e.target.value;render();});
 $('[data-cc-state]').addEventListener('change',e=>{state=e.target.value;render();});
 $('[data-cc-query]').addEventListener('input',e=>{term=e.target.value;render();});
 const interval=setInterval(()=>{if(live()&&document.visibilityState==='visible')load();},90000);
 onDispose?.(()=>{alive=false;seq++;clearInterval(interval);});
 load();
}
