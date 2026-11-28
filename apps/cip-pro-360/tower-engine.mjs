// CIP360 Torre de Comando — configurações por agente; nenhum "agente ativo" é inferido sem logs.
export const ABC_REFERENCE=Object.freeze({source:'ABC produtos.xlsx',status:'referencia_nao_homologada',total:6514,curves:[{curve:'A',products:3545,lucro:3,despesa:17,comissao:2},{curve:'B',products:1803,lucro:5,despesa:17,comissao:2},{curve:'C',products:1166,lucro:9,despesa:17,comissao:3}]});
export const TOWER_AGENTS=Object.freeze([
 {id:'radar_digital',name:'Radar Digital',area:'Concorrência em canais digitais',route:'radar-mercado',icon:'◉',x:21,y:30,source:'market_offers',functions:['Investigar ofertas candidatas e seus links de origem','Conferir SKU/EAN, marca, embalagem e unidade equivalente','Comparar canal, frete e disponibilidade sem presumir estoque','Encaminhar evidências ao Marca-passo e registrar alertas']},
 {id:'radar_fisico',name:'Radar Físico',area:'Concorrentes por cidade e região',route:'concorrentes',icon:'⌖',x:80,y:30,source:'directory',functions:['Mapear concorrentes físicos por cidade e bairro','Separar cadastro territorial de preços realmente verificados','Registrar raio de atuação e fonte da informação','Propor visitas e verificações comerciais supervisionadas']},
 {id:'compras',name:'Compras',area:'Abastecimento e fornecedores',route:'estoque',icon:'▣',x:11,y:50,source:'stock_actions',functions:['Avaliar necessidade e prioridade de compras','Conferir capital imobilizado, prazo e política de estoque','Considerar alternativas de transferência entre lojas','Encaminhar decisão para aprovação humana']},
 {id:'marca_passo',name:'Marca-passo',area:'Preço, margem e categoria',route:'precos',icon:'⌁',x:43,y:49,source:'price_plans',functions:['Aplicar políticas de margem mínima por curva e categoria','Relacionar custo, impostos, comissão, frete e margem','Verificar ofertas equivalentes e disponibilidade','Propor preços com memória de cálculo e aprovação antes da aplicação']},
 {id:'transferencias',name:'Transferências',area:'Redistribuição entre unidades',route:'estoque',icon:'⇄',x:68,y:49,source:'stock_actions',functions:['Localizar excesso e risco de falta entre filiais','Preservar estoque de segurança e prazo de reposição','Simular viabilidade de transferência','Acompanhar plano e resultado sem simular execução do ERP']},
 {id:'produtos',name:'Produtos',area:'Catálogo, ABC e simililaridade',route:'estoque',icon:'⬡',x:89,y:49,source:'stock_actions',functions:['Conferir SKU, EAN, categoria e cadastro mestre','Validar classificação ABC e compatibilidade de embalagens','Identificar lacunas de portfólio com origem','Conectar oportunidades ao Caderninho']},
 {id:'campanhas',name:'Campanhas',area:'Promoções e sell-out',route:'precos',icon:'✦',x:12,y:77,source:'campaigns',functions:['Avaliar campanhas e promoções por SKU/loja','Projetar contribuição e giro antes de aprovar','Medir baseline, custo, vendas e canibalização','Registrar ações coordenadas com o time comercial']},
 {id:'caderninho',name:'Caderninho',area:'Procura não atendida',route:'caderninho',icon:'▤',x:33,y:78,source:'demands',functions:['Registrar produtos não encontrados na operação','Classificar quantidade, cliente, recorrência e valor potencial','Propor alternativa ou fornecedor para validação','Medir oportunidades recuperadas sem duplicar vendas']},
 {id:'doquita',name:'Doquita 360',area:'Coordenação executiva',route:'doquita',icon:'✺',x:51,y:36,source:'missions',functions:['Priorizar alertas com evidências e riscos','Coordenar responsáveis, tarefas e prazos','Explicar decisões e identificar dados ausentes','Acompanhar resultados sem assumir execução autônoma inexistente']},
 {id:'vendas_b2b',name:'Vendas & CRM',area:'Conversão Shopping e B2B',route:'cotacoes',icon:'♧',x:55,y:79,source:'quotes',functions:['Medir cotações e conversão por status','Monitorar pendências e motivos de perda','Relacionar cliente, produto, loja, representante e retorno','Promover follow-up apoiado em registros verificáveis']},
 {id:'estoque',name:'Estoque Inteligente',area:'Giro, cobertura e capital',route:'estoque',icon:'▦',x:72,y:79,source:'stock_actions',functions:['Medir estoque real por filial, fonte e data','Investigar excesso, ruptura, curva e vencimentos','Analisar cobertura, capital e propostas de compra','Registrar ações de giro e indicadores de resultado']},
 {id:'gamificacao',name:'Gamificação',area:'Equipe, missões e aprendizagem',route:'quartel',icon:'♛',x:91,y:79,source:'missions',functions:['Coordenar missões e participação autorizada','Acompanhar execução, aprendizado e revisão humana','Apurar pontuação por critérios públicos e auditáveis','Evitar confundir atividade registrada com benefício realizado']}
]);
export const TOWER_SOURCE_TABLES=Object.freeze({
 stock_actions:'cip_stock_actions',market_offers:'cip_market_offers',faro_signals:'cip_faro_signals',
 directory:'cip_market_directory',price_plans:'cip_mp_price_plans',campaigns:'cip_mp_campaign_proposals',
 demands:'cip_demands',quotes:'cip_quotes',missions:'cip_agent_missions',tower_tasks:'cip_tower_tasks'
});
export const TOWER_ACTION_STATUSES=Object.freeze([
 ['aberta','Aberta'],['em_analise','Em análise'],['proposta','Proposta para aprovação'],
 ['em_execucao','Em acompanhamento'],['concluida','Concluída (registro humano)'],['descartada','Descartada']
]);
export function towerMetrics(counts={},tasks=[]){
 const num=k=>Number.isInteger(counts[k])?counts[k]:null;
 return [
  {id:'stock_actions',label:'Ações de estoque registradas',value:num('stock_actions'),unit:'registros da base; requer conferência'},
  {id:'market_offers',label:'Ofertas digitais candidatas',value:num('market_offers'),unit:'não são preços homologados'},
  {id:'faro_signals',label:'Sinais do Faro',value:num('faro_signals'),unit:'avaliar evidências e validade'},
  {id:'missions',label:'Missões de agentes',value:num('missions'),unit:'não comprovam execução autônoma'},
  {id:'tower_tasks',label:'Tarefas em aberto na Torre',value:tasks.length?tasks.filter(t=>!['concluida','descartada'].includes(t.status)).length:num('tower_tasks'),unit:'encaminhamentos humanos'},
  {id:'financial',label:'Ganho financeiro validado',value:null,unit:'aguardando conciliação e pareceres'}
 ];
}
export function sanitizeCsv(value){
 const s=String(value??'').replace(/\r?\n/g,' ');
 const safe=/^[\s]*[=+\-@]/.test(s)?"'"+s:s;
 return '"'+safe.replace(/"/g,'""')+'"';
}
export function exportTowerCsv(tasks=[],company='',agent=''){
 const header=['Empresa','Agente','Título','Estado','Prioridade','Responsável','Descrição','Evidência','Criado em','Atualizado em'];
 const rows=tasks.filter(t=>(!company||t.company_id===company)&&(!agent||t.agent_code===agent)).map(t=>
  [t.company_id,t.agent_code,t.title,t.status,t.priority,t.owner_name,t.description,t.evidence_note,t.created_at,t.updated_at].map(sanitizeCsv).join(';'));
 return '\uFEFF'+header.map(sanitizeCsv).join(';')+'\r\n'+rows.join('\r\n');
}
export function agentById(id){return TOWER_AGENTS.find(a=>a.id===id)||null;}

export const OFFICE_SCENARIO=Object.freeze([
 {from:'caderninho',to:'estoque',description:'Uma procura não atendida chega ao Estoque para checar cobertura.'},
 {from:'estoque',to:'transferencias',description:'Estoque e Transferências avaliam disponibilidade entre unidades.'},
 {from:'radar_digital',to:'marca_passo',description:'Radar entrega uma oferta candidata ao Marca-passo para conferir equivalência e frete.'},
 {from:'marca_passo',to:'campanhas',description:'Marca-passo compartilha as premissas de margem com Campanhas.'},
 {from:'campanhas',to:'doquita',description:'Doquita reúne a proposta e as evidências para decisão humana na Central.'},
 {from:'vendas_b2b',to:'doquita',description:'Vendas compartilha o retorno comercial para revisão de eficácia.'}
]);

export function towerHandoff(tasks, company, previous, now=Date.now()){
 const current=tasks.filter(task=>task.company_id===company&&task.source_module==='command_center'&&
  task.id&&task.source_reference&&agentById(task.agent_code));
 const latest=current.filter(task=>previous&&!previous.has(task.id)&&
  Date.parse(task.created_at)<=now&&Date.parse(task.created_at)>=now-180000)
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
 return {seen:new Set(current.map(task=>task.id)),latest};
}

export const TOWER_CYCLE_AGENT_MAP=Object.freeze({
 doquita:'doquita',marca_passo:'precos',radar_digital:'radar',radar_fisico:'radar',
 estoque:'estoque',compras:'compras',transferencias:'logistica',
 produtos:'analista',campanhas:'marketing',caderninho:'experiencia_cliente',
 vendas_b2b:'comercial',gamificacao:'estrategico'
});
export function towerAgentCycleInsight(agentId,cycle){
 const sourceId=TOWER_CYCLE_AGENT_MAP[agentId];
 const item=cycle?.report?.agents?.find(a=>a.agent_id===sourceId);
 if(!item||!cycle.created_at||!sourceId)return null;
 return {analysis:String(item.analysis||''),state:String(item.state||'unknown'),
  metric:String(item.metric||''),source:String(item.source||''),stale:item.stale===true,
  created_at:cycle.created_at,trigger_kind:String(cycle.trigger_kind||'unspecified'),
  notice:String(cycle.report?.notice||'')};
}

/* Guardian priorities are read-only, attributed to an area, not automatically assigned to an agent. */
export const TOWER_GUARDIAN_AREAS=Object.freeze({
 procfit_source:{title:'Origem Procfit',agent:'doquita',next:'TI: conferir serviço, acesso de leitura e contrato da origem.'},
 erp:{title:'ERP conciliado',agent:'doquita',next:'Obter base atual e conciliar antes de decidir.'},
 stock:{title:'Estoque atualizado',agent:'estoque',next:'Atualizar posição e verificar saldos por unidade.'},
 faro:{title:'Radar Faro',agent:'radar_digital',next:'Validar fontes, cota e evidências antes de retomar.'},
 queue:{title:'Fila de pesquisa',agent:'radar_digital',next:'Revisar fila e proteção; não repetir tarefas antigas indiscriminadamente.'},
 agents:{title:'Ciclos dos agentes',agent:'doquita',next:'Verificar execução e disponibilidade dos ciclos.'},
 execution:{title:'Decisões e tarefas',agent:'doquita',next:'Priorizar sugestões válidas com responsáveis.'},
 billing:{title:'Custos e créditos',agent:'doquita',next:'Conciliar custo e crédito com fontes oficiais.'},
 results:{title:'Resultados financeiros',agent:'doquita',next:'Registrar evidências e validação financeira.'}
});
export function towerGuardianBrief(status,incidents,now=Date.now()){
 const rows=Array.isArray(status)?status:[];
 const fresh=rows.length>0&&rows.every(r=>{const at=Date.parse(r.checked_at);return Number.isFinite(at)&&at<=now+60000&&now-at<=25*60000;});
 const readable=fresh&&Array.isArray(incidents);
 if(!readable)return {ready:false,critical:null,open:null,priorities:[],checkedAt:null};
 const checks=new Map(rows.map(r=>[r.check_code,r]));
 const open=incidents.filter(i=>!i.resolved_at&&['critical','warning'].includes(i.severity));
 const priorities=rows.filter(r=>['critical','warning'].includes(r.severity)).map(r=>{
 const area=TOWER_GUARDIAN_AREAS[r.check_code]||{title:r.check_code,agent:'doquita',next:'Investigar origem.'};
 const incident=open.find(i=>i.check_code===r.check_code);
 return {...area,code:r.check_code,severity:r.severity,incidentId:incident?.id||null};
 }).sort((a,b)=>Number(b.severity==='critical')-Number(a.severity==='critical')||a.title.localeCompare(b.title,'pt-BR'));
 return {ready:true,critical:priorities.filter(p=>p.severity==='critical').length,open:open.length,priorities,checkedAt:rows.map(r=>r.checked_at).sort()[0]};
}
