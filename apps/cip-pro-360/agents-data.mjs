export const COMPANIES={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
const both=Object.keys(COMPANIES);
const make=(id,name,role,color,icon,companies,skills,mission)=>({id,name,role,color,icon,companies,skills,mission});
export const AGENTS=[
 make('doquita','Doquita','Inteligência executiva','#764dff','✦',both,['Escuta e contexto','Síntese executiva','Decisão com evidências'],'Transformar dúvidas em prioridades claras e reunir os especialistas certos.'),
 make('analista','Atlas','Análise de dados','#2980ef','◫',both,['Conciliação','Indicadores','Qualidade de dados'],'Explicar desvios e conferir a origem de cada número.'),
 make('estoque','Giro','Estoque e filiais','#00a485','▦',both,['Cobertura e giro','Validade','Transferências'],'Encontrar falta e excesso sem comprometer disponibilidade.'),
 make('compras','Nexo','Compras inteligentes','#dc7a13','◇',both,['Reposição','Fornecedores','Pedidos em aberto'],'Preparar compras justificadas por demanda, prazo e orçamento.'),
 make('precos','Prisma','Marca-passo de preços','#e54083','▥',both,['Margem','Unidades equivalentes','Preço por canal'],'Investigar oportunidades de preço com contribuição e evidência.'),
 make('comercial','Elo','Inteligência comercial','#ee5b34','↗',both,['Cotações','Motivos de perda','Caderninho'],'Conectar disponibilidade a oportunidades e próximos passos.'),
 make('financeiro','Cifra','Finanças e economia','#119c71','◈',both,['Capital de giro','Economia realizada','Cenários de caixa'],'Separar potencial, resultado realizado e capital liberado.'),
 make('estrategico','RufasIA','Diretoria executiva','#8560be','☀',both,['Diretrizes de Rufino e Glauco','Síntese executiva','Metas e responsáveis'],'Conectar diretoria e gestão: organizar pautas, traduzir diretrizes em missões e acompanhar decisões com evidências.'),
 make('marketing','Faísca','Marketing e crescimento','#d648b0','✳',both,['Briefings','Calendário','Campanhas elegíveis'],'Sugerir campanhas coerentes com estoque, público e margem.'),
 make('radar','Faro','Radar de concorrência','#088eaa','◎',both,['Fontes públicas','Comparação de produtos','Tendências'],'Pesquisar referências e mudanças sem confundir promessa com fato.'),
 make('escola','Sofia','Escola e qualidade','#6962db','⌘',both,['Curadoria','Avaliação','Habilidades versionadas'],'Transformar casos revisados em aprendizados úteis para o squad.'),
 make('logistica','Rumo','Logística inteligente','#3271d1','➜',both,['Prazo e remessas','Exceções','ROTA PRO'],'Investigar atrasos e aproximar a operação da promessa ao cliente.'),
 make('experiencia_cliente','Lia','Experiência do cliente','#bd5a9b','♡',both,['Voz do cliente','Protocolos','Melhoria contínua'],'Garantir que dúvidas e sugestões recebam acompanhamento.'),
 make('b2g','Íris','Radar B2G e licitações','#226ec9','◉',['distribuidora_prohospital'],['PNCP e fontes oficiais','Itens e resultados','Correlação de produtos'],'Pesquisar compras públicas e estruturar análises para revisão humana.')
];
const themes=[
 ['diretoria','Diretoria e gestão','estrategico','Da diretriz à missão executiva','Transformar orientações de Rufino, Glauco e gestores em objetivo, responsável, prazo e indicador.'],
 ['estoque','Estoque inteligente','estoque','Giro, cobertura e validade','Confrontar demanda, saldo por filial, lote e validade antes de sugerir transferência.'],
 ['compras','Compras','compras','Reposição com critério','Validar demanda, prazo de entrega, orçamento e pedidos em aberto antes de comprar.'],
 ['financas','Economia e margem','financeiro','Economia que aparece no resultado','Separar economia potencial, economia realizada e capital liberado; conferir a base de comparação.'],
 ['comercial','Vendas e crescimento','comercial','Oportunidades com próximo passo','Relacionar necessidade, disponibilidade, margem e responsável pelo retorno ao cliente.'],
 ['logistica','Entrega e integração','logistica','Promessa de entrega acompanhada','Conciliar pedido, remessa e eventos do ERP/ROTA PRO antes de comunicar um status ao cliente.'],
 ['cliente','Experiência do cliente','experiencia_cliente','Escutar e fechar o ciclo','Registrar avaliação, causa, responsável e retorno; proteger dados pessoais.'],
 ['marketing','Marketing','marketing','Campanha com capacidade de atender','Validar público, estoque, margem e entrega antes de propor divulgação.'],
 ['radar','Concorrência e tendências','radar','Do sinal público à oportunidade','Guardar fonte e data; comparar produto equivalente e testar a hipótese antes de agir.'],
 ['integracao','Dados e ERP','analista','Procfit: confiança antes da decisão','Conciliar chaves, unidades, atualização e totais; integração pendente não produz saldo confiável.']
];

export function coursesFor(company,agent='',query=''){
 const ids=agentsFor([company]).map(a=>a.id),q=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return COURSES.filter(c=>ids.length&&(!agent||ids.includes(agent))&&(c.id!=='b2g'||ids.includes('b2g'))&&(!agent||(c.agents??ids).includes(agent))&&`${c.title} ${c.topic??c.level} ${c.detail}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));
}
export function agentsFor(companies=[]){return AGENTS.filter(a=>a.companies.some(c=>companies.includes(c)));}
export const STATUS={queued:'Na fila',in_progress:'Em andamento pelo time',review:'Em revisão',done:'Concluída pelo time',cancelled:'Cancelada'};
export const COURSES=[
 {id:'evidencias',title:'Evidência antes da resposta',level:'Fundação',detail:'Fonte, período, unidade e atualização. Ausência de dado não é zero.',question:'O ERP não informou saldo de um produto. Qual é a conclusão correta?',choices:['O saldo é zero','A informação está indisponível','O produto está em falta'],answer:1},
 {id:'precos',title:'Preços que podem ser comparados',level:'Aplicação',detail:'Mesmo produto, especificação, embalagem, condição e período.',question:'Caixa de 100 e unidade avulsa podem ser comparadas diretamente?',choices:['Sim, pelo valor anunciado','Sim, pelo fornecedor','Não; é preciso normalizar e validar equivalência'],answer:2},
 {id:'b2g',title:'Leitura responsável de licitações',level:'Especialização',detail:'Estimativa, homologação, contrato e execução são etapas diferentes.',question:'Um preço homologado comprova pagamento ou entrega?',choices:['Não; são evidências e etapas distintas','Sim, se o fornecedor estiver identificado','Sim, se o valor for positivo'],answer:0},
 {id:'autonomia',title:'Da sugestão à ação aprovada',level:'Governança',detail:'Aprovação é específica, com conteúdo, alçada e validade.',question:'Aprovar uma proposta libera qualquer alteração posterior?',choices:['Sim, durante o dia','Não; mudança material exige nova aprovação','Sim, se o agente concordar'],answer:1}
];
for(const [id,topic,agent,title,detail] of themes)COURSES.push({id,topic,agents:[agent,'escola','doquita'],title,level:'Prática do dia',detail,question:'Como transformar este tema em uma habilidade útil para o squad?',choices:['Aplicar automaticamente a qualquer situação','Registrar caso, fonte, limites e resultado para revisão humana','Considerar o tema dominado após abrir a aula'],answer:1});
export function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function validWork({agent_id,company_id,kind,title,notes=''}){
 const agent=AGENTS.find(a=>a.id===agent_id);
 return !!agent&&agent.companies.includes(company_id)&&['task','lesson'].includes(kind)&&typeof title==='string'&&title.trim().length>=4&&title.length<=160&&typeof notes==='string'&&notes.length<=3000;
}
