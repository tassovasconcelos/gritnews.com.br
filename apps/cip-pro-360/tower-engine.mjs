// CIP360 Torre de Comando — configurações por agente; nenhum "agente ativo" é inferido sem logs.
export const TOWER_AGENTS=Object.freeze([
 {id:'radar_digital',name:'Radar Digital',area:'Concorrência em canais digitais',route:'radar-mercado',icon:'◉',x:21,y:30,source:'market_offers',functions:['Investigar ofertas candidatas e seus links de origem','Conferir SKU/EAN, marca, embalagem e unidade equivalente','Comparar canal, frete e disponibilidade sem presumir estoque','Encaminhar evidências ao Marca-passo e registrar alertas']},
 {id:'radar_fisico',name:'Radar Físico',area:'Concorrentes por cidade e região',route:'concorrentes',icon:'⌖',x:80,y:30,source:'directory',functions:['Mapear concorrentes físicos por cidade e bairro','Separar cadastro territorial de preços realmente verificados','Registrar raio de atuação e fonte da informação','Propor visitas e verificações comerciais supervisionadas']},
 {id:'compras',name:'Compras',area:'Abastecimento e fornecedores',route:'estoque',icon:'▣',x:11,y:50,source:'stock_actions',functions:['Avaliar necessidade e prioridade de compras','Conferir capital imobilizado, prazo e política de estoque','Considerar alternativas de transferência entre lojas','Encaminhar decisão para aprovação humana']},
 {id:'marca_passo',name:'Marca-passo',area:'Preço, margem e categoria',route:'precos',icon:'⌁',x:43,y:49,source:'price_plans',functions:['Aplicar políticas de margem mínima por curva e categoria','Relacionar custo, impostos, comissão, frete e margem','Verificar ofertas equivalentes e disponibilidade','Propor preços com memória de cálculo e aprovação antes da aplicação']},
 {id:'transferencias',name:'Transferências',area:'Redistribuição entre unidades',route:'estoque',icon:'⇄',x:68,y:49,source:'stock_actions',functions:['Localizar excesso e risco de falta entre filiais','Preservar estoque de segurança e prazo de reposição','Simular viabilidade de transferência','Acompanhar plano e resultado sem simular execução do ERP']},
 {id:'produtos',name:'Produtos',area:'Catálogo, ABC e simililaridade',route:'estoque',icon:'⬡',x:89,y:49,source:'stock_actions',functions:['Conferir SKU, EAN, categoria e cadastro mestre','Validar classificação ABC e compatibilidade de embalagens','Identificar lacunas de portfólio com origem','Conectar oportunidades ao Caderninho']},
 {id:'campanhas',name:'Campanhas',area:'Promoções e sell-out',route:'precos',icon:'✦',x:12,y:77,source:'campaigns',functions:['Avaliar campanhas e promoções por SKU/loja','Projetar contribuição e giro antes de aprovar','Medir baseline, custo, vendas e canibalização','Registrar ações coordenadas com o time comercial']},
 {id:'caderninho',name:'Caderninho',area:'Procura não atendida',route:'caderninho',icon:'▤',x:33,y:78,source:'demands',functions:['Registrar produtos não encontrados na operação','Classificar quantidade, cliente, recorrência e valor potencial','Propor alternativa ou fornecedor para validação','Medir oportunidades recuperadas sem duplicar vendas']},
 {id:'doquita',name:'Doquita 360',area:'Coordenação executiva',route:'doquita',icon:'✺',x:51,y:22,source:'missions',functions:['Priorizar alertas com evidências e riscos','Coordenar responsáveis, tarefas e prazos','Explicar decisões e identificar dados ausentes','Acompanhar resultados sem assumir execução autônoma inexistente']},
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
