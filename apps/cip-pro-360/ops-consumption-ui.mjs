import {OPS_GROUPS,OPS_READINESS,OPS_PROVIDER_LINKS,metricTotals,budgetSignal,creditSignal,opsHealth,formatCount,formatUSD,cleanCsv,groupByProvider} from './ops-consumption-engine.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=x=>x?new Date(x).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'N/D';
const companyNames={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
const month=()=>new Date().toISOString().slice(0,7)+'-01';
const numberOrNull=s=>s===null||String(s).trim()===''?null:Number(s);
export function consumptionFrame(){
 return '<section class="ops" id="cipConsumption">'+
 '<header class="ops-head"><div class="ops-brand"><img src="./logo-grupo-prohospital.jpg" alt="Marca oficial Grupo Prohospital"><div><small>CIP360 · CONSELHO DE INTELIGÊNCIA OPERACIONAL</small><h1>Central de Consumo e Continuidade</h1><p>IA, agentes, pesquisa, créditos, infraestrutura e saúde das rotinas e gastos operacionais.</p></div></div><div class="ops-controls"><label>Empresa<select data-ops-company></select></label><label>Período<select data-ops-period><option value="7">7 dias</option><option value="30">30 dias</option><option selected value="90">90 dias</option><option value="120">120 dias</option></select></label><button class="btn secondary" data-ops-refresh>Atualizar</button></div></header>'+
 '<p class="ops-status" role="status" data-ops-status>Conferindo dados...</p><div class="ops-kpis" data-ops-kpis></div>'+
 '<div class="ops-continuity"><div><small>CONTINUIDADE OPERACIONAL</small><h2>Observabilidade, eficiência e fallback seguro</h2><p>O monitor opera sem IA. Provedores alternativos exigem acesso e homologação; não há troca automática de contas neste estágio.</p></div><div class="ops-lights" data-ops-health></div></div>'+
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
 let providers=[],daily=[],billing=[],verified=[],alerts=[],history=[],faro=null,cycles=[];
 const notice=t=>{if(live())$('[data-ops-status]').textContent=t;};
 const statement=p=>billing.find(b=>b.provider===p);
 $('[data-ops-company]').innerHTML=scope.map(c=>'<option value="'+esc(c)+'">'+esc(companyNames[c]||c)+'</option>').join('');
 $('[data-ops-company]').value=company;
 function render(){
  const totals=metricTotals(daily),totalsByProvider=groupByProvider(daily);
  const reported = source => {
   const rows = verified.filter(b => b.source === source);
   return rows.length ? formatUSD(rows.reduce((sum,b) => sum + Number(b.month_spend_usd),0)) : 'Não informado';
  };
  const kpis=[['Tokens de entrada',formatCount(totals.input),'Medições registradas'],['Tokens de saída',formatCount(totals.output),'Não inclui solicitações sem métricas'],['Pesquisas web',formatCount(totals.searches),'Chamadas contabilizadas nos resultados'],['Falhas registradas',formatCount(totals.failed),'Investigar sem repetir em excesso'],['Custo reportado por API',reported('provider_api'),'Parcial no mês UTC · escopos vinculados'],['Faturas conciliadas',reported('invoice'),'Total dos documentos do mês'],['Eventos auditados',formatCount(totals.events),'Histórico, não cobrança']];
  $('[data-ops-kpis]').innerHTML=kpis.map(([label,value,sub],i)=>'<article class="ops-kpi '+(i===3&&totals.failed?'ops-risk':'')+'"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(sub)+'</span></article>').join('');
  const health=opsHealth(faro,totals,cycles[0]?.created_at);
  $('[data-ops-health]').innerHTML='<div class="ops-health" data-health="'+esc(health.kind)+'"><b>Radar Faro</b><span>'+esc(health.label)+'</span></div>'+
  '<div class="ops-health"><b>Último ciclo de agentes</b><span>'+esc(cycles.length?date(cycles[0].created_at):'Não consultável')+'</span></div>'+
  '<div class="ops-health"><b>Serviços cadastrados</b><span>'+providers.length+' fontes, sem pressupor contratos ativos</span></div>';
  const categories=[...new Set(providers.map(p=>p.category))];
  $('[data-ops-services]').innerHTML=categories.map(category=>'<div class="ops-category"><h3>'+esc(OPS_GROUPS[category]||category)+'</h3><div class="ops-cards">'+providers.filter(p=>p.category===category).map(p=>{
   const usage=totalsByProvider.get(p.provider)||{input:0,output:0,failed:0,searches:0},bill=statement(p.provider);
   const cost=verified.find(b=>b.provider===p.provider&&b.source==='provider_api');
   const signal=budgetSignal(p,cost??bill),credit=creditSignal(bill),link=OPS_PROVIDER_LINKS[p.provider];
   const budgetValue=p.monthly_budget_usd===null?'Não definido':formatUSD(p.monthly_budget_usd);
   return '<article class="ops-service"><div class="ops-service-top"><strong>'+esc(p.display_name)+'</strong><span>'+esc(OPS_READINESS[p.readiness]||p.readiness)+'</span></div>'+
    '<div class="ops-service-stats"><div><small>Tokens entrada / saída</small><b>'+formatCount(usage.input)+' / '+formatCount(usage.output)+'</b></div><div><small>Falhas</small><b>'+formatCount(usage.failed)+'</b></div></div>'+
    '<div class="ops-service-stats"><div><small>Despesa informada</small><b>'+esc(bill?.month_spend_usd===null||!bill?'N/D':formatUSD(bill.month_spend_usd))+'</b></div><div><small>Crédito conhecido</small><b>'+esc(bill?.credit_balance_usd===null||!bill?'N/D':formatUSD(bill.credit_balance_usd))+'</b></div></div>'+
    (cost?'<p class="ops-provenance">'+esc(formatUSD(cost.month_spend_usd))+' · '+esc(cost.reference_label)+' · consultado '+esc(date(cost.observed_at))+'</p>':'')+
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
  const cell = value => value == null ? 'N/D' : formatCount(value);
  $('[data-ops-history]').innerHTML=history.length?'<div class="ops-table-scroll"><table><thead><tr><th>Quando</th><th>Agente</th><th>Provedor</th><th>Modelo</th><th>Entrada</th><th>Saída</th><th>Cache</th><th>Raciocínio</th><th>Busca</th><th>Latência</th><th>Estado</th><th>Custo</th><th>Origem</th></tr></thead><tbody>'+
   history.map(e=>'<tr><td>'+esc(date(e.occurred_at))+'</td><td>'+esc(e.agent)+'</td><td>'+esc(e.provider)+'</td><td>'+esc(e.model||'N/D')+'</td><td>'+esc(e.input_tokens===null?'N/D':formatCount(e.input_tokens))+'</td><td>'+esc(e.output_tokens===null?'N/D':formatCount(e.output_tokens))+'</td><td>'+cell(e.cached_input_tokens)+'</td><td>'+cell(e.reasoning_tokens)+'</td><td>'+cell(e.search_calls)+'</td><td>'+cell(e.latency_ms)+'</td><td>'+esc(e.failure_code||e.status)+'</td><td>'+esc(e.cost_usd==null?'N/D':formatUSD(e.cost_usd)+' · '+e.cost_kind)+'</td><td>'+esc(e.source_kind)+' · '+esc(e.source_ref)+'</td></tr>').join('')+'</tbody></table></div>':
    '<p class="ops-note">Sem registros no período.</p>';
 }
 async function load(){
  if(!live()||!company)return;const stamp=++requestId;
  notice('Consultando agentes, custos, créditos e riscos...');
  const dateStart=new Date(Date.now()-period*86400000);
  const fetches=[
   db.from('cip_ops_provider_settings').select('*').eq('company_id',company).order('category').order('display_name'),
   db.from('cip_ops_daily_usage').select('*').eq('company_id',company).gte('day',dateStart.toISOString().slice(0,10)).order('day',{ascending:false}).limit(500),
   db.from('cip_ops_billing_current').select('*').eq('company_id',company),
   db.from('cip_ops_alerts').select('provider,severity,message,last_seen_at,resolved_at').eq('company_id',company).order('last_seen_at',{ascending:false}).limit(40),
   db.from('cip_ops_usage_events').select('agent,provider,model,occurred_at,input_tokens,output_tokens,cached_input_tokens,reasoning_tokens,search_calls,latency_ms,status,failure_code,cost_usd,cost_kind,source_kind,source_ref').eq('company_id',company).gte('occurred_at',dateStart.toISOString()).order('occurred_at',{ascending:false}).limit(40),
   db.from('cip_faro_config').select('enabled,failure_streak,circuit_until').eq('company_id',company).maybeSingle(),
   db.from('cip_agent_cycles').select('created_at').eq('company_id',company).order('created_at',{ascending:false}).limit(1),
   db.from('cip_ops_verified_monthly_spend').select('*').eq('company_id',company).eq('period_month',month())
  ];
  const results=await Promise.allSettled(fetches);if(!live()||stamp!==requestId)return;
  const got=i=>results[i].status==='fulfilled'?results[i].value:{error:{message:'indisponível'}};
  const [a,b,c,d,e,f,g,h]=[0,1,2,3,4,5,6,7].map(got);
  verified=h.error?[]:h.data||[];
  providers=a.error?[]:a.data||[];daily=b.error?[]:b.data||[];
  billing=c.error?[]:c.data||[];alerts=d.error?[]:d.data||[];
  history=e.error?[]:e.data||[];faro=f.error?null:f.data||null;cycles=g.error?[]:g.data||[];
  render();const failed=[a,b,c,d,e,f,g,h].filter(x=>x.error).length;
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
 root.addEventListener('submit',e=>{const f=e.target.closest('form[data-ops-budget],form[data-ops-manual]');if(!f)return;e.preventDefault();if(f.dataset.opsBudget)saveBudget(f);else saveManual(f);});
 root.addEventListener('click',e=>{if(e.target.closest('[data-ops-refresh]'))load();if(e.target.closest('[data-ops-export]'))exportCsv();});
 $('[data-ops-company]').addEventListener('change',e=>{if(scope.includes(e.target.value)){company=e.target.value;providers=[];daily=[];billing=[];verified=[];alerts=[];history=[];faro=null;cycles=[];render();load();}});
 $('[data-ops-period]').addEventListener('change',e=>{const days=Number(e.target.value);if([7,30,90,120].includes(days)){period=days;load();}});
 const timer=setInterval(()=>{if(live()&&document.visibilityState==='visible')load();},90000);
 onDispose?.(()=>{active=false;requestId++;clearInterval(timer);});
 load();
}
