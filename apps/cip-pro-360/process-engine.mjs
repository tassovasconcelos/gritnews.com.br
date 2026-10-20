import {AGENTS} from './agents-data.mjs';
export const NODE_TYPES={start:'Início',task:'Atividade',decision:'Decisão',approval:'Aprovação',end:'Fim'};
export const PRACTICES=[{title:'Processos, risco e melhoria contínua · ISO',url:'https://www.iso.org/insights/iso-9001-explained',checked:'2026-10-19',detail:'Referência para donos, indicadores e melhoria contínua; não representa certificação.'},{title:'Rastreabilidade por eventos · GS1 EPCIS',url:'https://www.gs1.org/standards/epcis',checked:'2026-10-19',detail:'Evolução a avaliar para estoque e logística: registrar eventos e seus dados essenciais.'},{title:'Governança, medição e supervisão de IA · NIST',url:'https://airc.nist.gov/airmf-resources/airmf/5-sec-core/',checked:'2026-10-19',detail:'Referência para responsabilidades humanas, avaliação e monitoramento dos agentes.'},{title:'Fluxos com início, fim e decisões explícitas',url:'https://www.omg.org/spec/BPMN/2.0/',checked:'2026-10-19',detail:'Inspiração em BPMN. O editor usa notação simplificada, sem certificação de conformidade BPMN.'},{title:'Conhecimento aprovado e revisão periódica',url:'https://cip.gritnews.com.br/',checked:'2026-10-19',detail:'Prática interna CIP: fonte, responsável, indicador, teste e aprovação. Recomendações são regras locais; tendências atuais exigem pesquisa e evidência datada.'}];
const str=(v,max)=>typeof v==='string'&&v.length<=max;
export function validGraph(g,company){
 if(!g||g.schema!==1||!Array.isArray(g.nodes)||!Array.isArray(g.edges)||g.nodes.length>60||g.edges.length>120)return false;
 const ids=new Set();
 for(const n of g.nodes){if(!n||!str(n.id,48)||!/^n[\w-]+$/.test(n.id)||ids.has(n.id)||!Object.hasOwn(NODE_TYPES,n.type)||!str(n.title,120)||!n.title.trim()||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.y<0||n.x>3000||n.y>3000||!['owner','metric','evidence','notes'].every(k=>str(n[k]??'',k==='notes'?2000:500))||!AGENTS.some(a=>a.id===n.agent&&(!company||a.companies.includes(company))))return false;ids.add(n.id);}
 return g.edges.every(e=>e&&ids.has(e.from)&&ids.has(e.to)&&str(e.label??'',120))&&new Set(g.edges.map(e=>e.from+'>'+e.to)).size===g.edges.length;
}
export function auditGraph(g,company){
 if(!validGraph(g,company))return [{level:'error',code:'shape',text:'Estrutura inválida, referência quebrada ou especialista fora da empresa.'}];
 const f=[],add=(level,code,text,id)=>f.push({level,code,text,id}),start=g.nodes.filter(n=>n.type==='start'),ends=g.nodes.filter(n=>n.type==='end');
 if(start.length!==1)add('error','start','Defina exatamente um início.');if(!ends.length)add('error','end','Inclua pelo menos um fim.');
 const next=id=>g.edges.filter(e=>e.from===id),prev=id=>g.edges.filter(e=>e.to===id),reach=(seeds,step)=>{const seen=new Set(seeds),q=[...seeds];while(q.length){for(const id of step(q.shift()))if(!seen.has(id)){seen.add(id);q.push(id);}}return seen;};
 const reached=reach(start.map(n=>n.id),id=>next(id).map(e=>e.to)),canEnd=reach(ends.map(n=>n.id),id=>prev(id).map(e=>e.from));
 for(const n of g.nodes){
  if(!reached.has(n.id))add('error','unreachable',`${n.title}: etapa sem caminho a partir do início.`,n.id);
  if(!canEnd.has(n.id))add('error','no_exit',`${n.title}: nenhum caminho para um fim.`,n.id);
  if(n.type==='start'&&prev(n.id).length)add('error','start_in','O início não deve receber uma conexão.',n.id);
  if(n.type==='end'&&next(n.id).length)add('error','end_out','O fim não deve ter saída.',n.id);
  if(n.type==='decision'){
   const exits=next(n.id);if(exits.length<2)add('error','branches',`${n.title}: registre pelo menos duas alternativas.`,n.id);
   if(exits.some(e=>!e.label?.trim())||new Set(exits.map(e=>e.label?.trim().toLowerCase())).size!==exits.length)add('error','conditions',`${n.title}: cada alternativa precisa de condição distinta.`,n.id);
  }else if(n.type!=='end'&&next(n.id).length!==1)add('error','single_exit',`${n.title}: use uma decisão para ramificar o fluxo.`,n.id);
  if(['task','approval'].includes(n.type)){
   if(!n.owner?.trim())add('warning','owner',`${n.title}: defina o responsável humano.`,n.id);
   if(!n.metric?.trim())add('warning','metric',`${n.title}: defina prazo ou indicador de sucesso.`,n.id);
   if(!n.evidence?.trim())add('warning','evidence',`${n.title}: registre a fonte ou evidência exigida.`,n.id);
  }
 }
 // Back edges identify loops even when there is a valid exit.
 const visiting=new Set(),done=new Set();let loop=false;
 function visit(id){if(visiting.has(id)){loop=true;return;}if(done.has(id))return;visiting.add(id);for(const e of next(id))visit(e.to);visiting.delete(id);done.add(id);}for(const n of g.nodes)visit(n.id);
 if(loop)add('warning','cycle','Há repetição no fluxo: defina limite de tentativas, prazo e saída da exceção.');
 if(!g.nodes.some(n=>n.type==='approval'))add('warning','approval','Confirme se decisões de preço, compra ou comunicação precisam de etapa de aprovação humana.');
 if(!f.length)add('ok','structure','Nenhuma inconsistência detectada pelas regras locais. Valide a operação com o responsável.');return f;
}
export function simulationChoices(g,id){return g.edges.filter(e=>e.from===id).map(e=>({...e,title:g.nodes.find(n=>n.id===e.to)?.title??''}));}
export function processTemplate(kind='growth'){
 if(OPERATIONAL_PROCESSES.some(p=>p.key===kind))return operationalTemplate(kind);
 const entries=kind==='stock'?[['Demanda identificada','start','comercial'],['Conferir saldo e validade','task','estoque'],['Disponível?','decision','estoque'],['Preparar proposta de compra','task','compras'],['Revisar alçada e orçamento','approval','financeiro'],['Atender e acompanhar','task','comercial'],['Resultado registrado','end','doquita']]:[['Oportunidade identificada','start','radar'],['Qualificar a oportunidade','task','comercial'],['Oferta viável?','decision','precos'],['Revisar a campanha','approval','marketing'],['Executar pelo time e medir','task','comercial'],['Registrar aprendizado','task','escola'],['Oportunidade arquivada','end','estrategico'],['Resultado revisado','end','doquita']];
 const nodes=entries.map(([title,type,agent],i)=>({id:'n'+i,title,type,agent,x:60+(i%3)*290,y:50+Math.floor(i/3)*190,owner:'',metric:'',evidence:'',notes:''}));
 const pairs=kind==='stock'?[[0,1],[1,2],[2,5,'Sim'],[2,3,'Não'],[3,4],[4,5],[5,6]]:[[0,1],[1,2],[2,3,'Sim'],[2,6,'Não'],[3,4],[4,5],[5,7]];
 return {schema:1,nodes,edges:pairs.map(([from,to,label=''])=>({from:'n'+from,to:'n'+to,label}))};
}

export function improvementSuggestions(g){
 const agents=new Set(g.nodes.map(n=>n.agent)),out=[{title:'Fechar o ciclo de melhoria',text:agents.has('escola')?'A etapa de aprendizado já está no mapa. Defina quem verifica o resultado e quando o conhecimento será revisado.':'Inclua uma etapa de avaliação do resultado e retorno à Escola, com responsável e indicador.',reference:0},{title:'Medir a utilidade do agente',text:'Antes de automatizar cada etapa, registre um caso de teste, taxa de erro aceitável, responsável e procedimento de exceção. Reavalie após mudança de fonte ou regra.',reference:2}];
 if(agents.has('estoque')||agents.has('logistica'))out.push({title:'Rastreabilidade por evento',text:'Avalie registrar recebimento, reserva, movimentação e entrega com SKU/lote, filial, data e origem. Oportunidade técnica inspirada no GS1 EPCIS; depende do mapeamento Procfit.',reference:1});
 if(agents.has('precos')||agents.has('financeiro'))out.push({title:'Conferir a memória de cálculo',text:'Na revisão financeira, confira unidade/embalagem, custo, período, impostos e alçada. Registre cenário, baseline e resultado realizado separadamente. Recomendação interna CIP.',reference:4});
 if(agents.has('comercial')||agents.has('marketing'))out.push({title:'Testar crescimento com capacidade de atender',text:'Antes da campanha, defina público, oferta, estoque, margem, dono e métrica. Compare o resultado com um baseline e registre aprendizados; não presuma aumento de receita. Recomendação interna CIP.',reference:4});
 return out;
}

// Proposed operational standards; loading a model does not activate integrations or approve actions.
export const OPERATIONAL_PROCESSES=[
 {
  "key": "pricing-cycle",
  "title": "Radar + estoque inteligente + Marca-passo",
  "agent": "radar",
  "stages": [
   "Selecionar prioridades por SKU e filial",
   "Conferir concorrente e contribuição líquida",
   "Referência comparável e dados atuais?",
   "Aprovar preço, canal, prazo e limite",
   "Encaminhar preço aprovado e medir piloto",
   "Bloquear sugestão e completar evidências"
  ],
  "rule": "Ranking proposto: 30% valor a custo do estoque elegível parado, 20% excesso de cobertura, 15% risco de validade, 15% demanda/giro comprovado, 10% quantidade e 10% volume físico. Normalizar por canal e categoria; não somar unidades diferentes. Pesos exigem aceite. Sem dimensão física, não inventar m³. Curva A indica prioridade comercial, não comprova venda atual.",
  "scope": "Lista permanente de alto giro para consulta diária; segunda fila de excesso, capital imobilizado e sem giro. Cruzar quantidade, custo conciliado, curva, demanda, ciclo de reposição e disponibilidade. Ausência de dados reduz confiança, não vira zero. Fonte antiga bloqueia publicação automática.",
  "control": "Coleta diária proposta online em fontes acessíveis e cadastro offline pelo time com foto/cotação, data, loja e validade. Mesmo SKU/GTIN, marca, embalagem, região, frete, imposto, condição e disponibilidade; sem equivalência, apenas pista. Custo + tributos + taxas + frete + comissão + piso de contribuição limitam o preço. Preço do concorrente não é ordem de redução.",
  "kpi": "Margem de contribuição; conversão; unidades vendidas; cobertura; ruptura; capital liberado conciliado; frescor e cobertura das referências. Baseline por canal antes/depois; não atribuir efeito causal sem controle."
 },
 {
  "key": "stock-transfer",
  "title": "Redistribuição entre filiais e prevenção de ruptura",
  "agent": "estoque",
  "stages": [
   "Conciliar saldo por SKU, lote e filial",
   "Calcular necessidade e excedente disponível",
   "Transferência viável e mais econômica?",
   "Aprovar origem, destino e quantidade",
   "Reservar, transferir, receber e conciliar",
   "Solicitar reposição ou corrigir divergência"
  ],
  "rule": "Quantidade sugerida = menor entre excedente livre doador, necessidade destino e capacidade logística. Excedente desconta reservas, segurança e transferências já propostas. Considerar demanda validada, lead time, validade, embalagem e mínimo/máximo por filial.",
  "scope": "Manter alto giro disponível; impedir que a transferência gere ruptura no doador. Sem demanda recente, sugerir conferência, não previsão. Fonte, competência e janela histórica explícitas.",
  "control": "Compras, estoque e logística confirmam tributação, documentação, integridade e custo da transferência. Não executar no ERP nesta simulação. Destino confirma quantidade e lote recebidos; divergência abre ocorrência.",
  "kpi": "Ruptura real; atendimento completo; cobertura origem/destino; custo por transferência; divergência recebida; vendas após reposição. Transferência não é receita nem caixa liberado."
 },
 {
  "key": "stock-campaign",
  "title": "Estoque parado: campanha com margem e recuperação de caixa",
  "agent": "comercial",
  "stages": [
   "Selecionar lotes elegíveis e público",
   "Conferir validade, custo, preço e capacidade",
   "Oferta rentável e estoque reservado?",
   "Aprovar campanha, margem e teto",
   "Executar piloto pelo time e conciliar vendas",
   "Rever público, oferta ou impedimento"
  ],
  "rule": "Separar idade do lote de ausência de vendas. Quantificar estoque parado somente com critério e período conhecidos. Curva E é pista, não prova de ausência de giro. Produto vencido ou bloqueado não entra na campanha.",
  "scope": "Usar radar comparável e Marca-passo para faixa de preço. Antes do desconto avaliar kits elegíveis, contato B2B direcionado e transferência. Preservar apresentação, regras comerciais e disponibilidade.",
  "control": "Piso calculado com custo e despesas verificadas. Definir canal, público autorizado, quantidade máxima, vigência, responsável e condição de parada por margem ou ruptura. Nenhuma mensagem ou preço é publicado pelo mapa.",
  "kpi": "Unidades e contribuição realizadas; recebimento efetivo; estoque elegível reduzido a custo; conversão; devolução; canibalização. Separar faturamento de recebimento e potencial de realizado."
 },
 {
  "key": "order-promise",
  "title": "Pedido B2B/B2C: promessa de entrega e operação logística",
  "agent": "logistica",
  "stages": [
   "Registrar pedido, canal e itens completos",
   "Conferir reserva, crédito, endereço e capacidade",
   "Promessa de entrega pode ser cumprida?",
   "Aprovar janela e exceções com o cliente",
   "Separar, conferir, faturar e expedir",
   "Negociar nova janela ou pedido parcial"
  ],
  "rule": "Referência desejada por Rufino: pedido até 11h entregue até 18h; após 11h até meio-dia seguinte. Proposta interna a validar por cidade, dia útil, pagamento, crédito, estoque e capacidade; não é SLA confirmado da Riosfarma.",
  "scope": "B2B: crédito, embalagem, quantidade mínima e recebimento institucional. B2C: pagamento, prazo por CEP e canal. Definir se o marco é pedido recebido ou liberado. Registrar horário local e corte sem lacuna às 11h.",
  "control": "Eventos: recebido, em validação, confirmado, separação, conferido, faturado, expedido, em entrega, entregue; exceção: atraso, entrega parcial, tentativa sem sucesso, cancelamento e devolução. Entrega exige comprovante. Integração direta CIP/Procfit e transportador, sem alterar ROTA PRO.",
  "kpi": "OTIF = pedidos completos no prazo / pedidos elegíveis; tempo pedido-entrega; erro de separação; custo por pedido; primeira tentativa; atraso comunicado; satisfação por canal. Segmentar região e janela."
 },
 {
  "key": "customer-tracking",
  "title": "Cliente acompanha pedido por link seguro",
  "agent": "experiencia_cliente",
  "stages": [
   "Vincular pedido e remessas ao cliente correto",
   "Conferir origem e consistência dos eventos",
   "Evento autêntico e acesso autorizado?",
   "Homologar página e política de comunicação",
   "Disponibilizar link e acompanhar exceções",
   "Bloquear exposição e abrir ocorrência"
  ],
  "rule": "Fluxo de evolução; link ainda depende de implementação e homologação. Nunca usar número sequencial de pedido como autorização. Token aleatório opaco, revogável, com validade e escopo mínimo; dados sensíveis exigem autenticação adicional.",
  "scope": "Página B2B/B2C: etapas, última atualização, janela prometida, itens/remessas parciais sem dados desnecessários, canal de ajuda e protocolo. Evento atrasado não pode regredir status; entregue somente com evidência. Não exibir localização do motorista ou dados de outros clientes.",
  "control": "Procfit deve fornecer pedido, filial, canal, reserva, liberação, faturamento e cancelamento; transportador fornece expedição, tentativas e comprovante. Conciliar IDs, fuso, duplicidade e ordem dos eventos. Aviso apenas em canal autorizado e com preferência do cliente.",
  "kpi": "Cobertura de pedidos rastreáveis; atraso dos eventos; contatos perguntando status por 100 pedidos; acesso ao link; resolução; satisfação. Testar acesso cruzado, expiração, revogação, parcial e cancelamento."
 },
 {
  "key": "customer-voice",
  "title": "Voz do cliente e melhoria contínua da jornada",
  "agent": "experiencia_cliente",
  "stages": [
   "Capturar solicitação, perda ou avaliação",
   "Classificar causa e impacto por jornada",
   "Há risco ou promessa descumprida?",
   "Aprovar solução e prazo de retorno",
   "Resolver, confirmar com cliente e medir",
   "Encaminhar melhoria à área responsável"
  ],
  "rule": "Conectar vendedor, ecommerce, varejo, B2B e entrega pelo pedido/protocolo. Registrar motivo de perda, item solicitado indisponível, prazo desejado e alternativa oferecida no Caderninho; não presumir faturamento perdido integral.",
  "scope": "Classificar preço, falta, mix, prazo, atendimento e qualidade. Retornar ao cliente em prazo pactuado, com responsável e histórico. Diretores recebem síntese objetiva: impacto comprovado, ação, dono, prazo e memória de cálculo acessível.",
  "control": "Reunião semanal de exceções e mensal de resultados: revisar radar, estoque, Marca-passo e logística juntos. Escola recebe apenas aprendizado revisado. Autonomia só após aceite, limites, auditoria, monitoramento e reversão testados.",
  "kpi": "Conversão de cotações elegíveis; demanda não atendida; recompra; CSAT com taxa de resposta; tempo de resolução; reincidência. Metas numéricas após baseline e validação dos responsáveis."
 }
];
export function operationalTemplate(key){
 const p=OPERATIONAL_PROCESSES.find(x=>x.key===key);if(!p)throw new Error('Modelo operacional desconhecido');
 const titles=['Iniciar ciclo com fonte e data',...p.stages,'Resultado conciliado','Pendência registrada','Alçada aprovada?'];
 const types=['start','task','task','decision','approval','task','task','end','end','decision'];
 const notes=[p.scope,p.rule,p.control,'Se faltar fonte, equivalência ou capacidade, seguir pela exceção.','Confirmar nomes, limites, canal e prazo antes do piloto.',p.kpi,'Registrar lacuna, responsável e prazo; nenhuma execução automática.','Comparar baseline e realizado; registrar aprendizado revisado.','Revisar e reapresentar após correção.','Reprovação mantém ação bloqueada.'];
 const graph={schema:1,nodes:titles.map((title,i)=>({id:'n'+i,title,type:types[i],agent:i===0||types[i]==='end'?'doquita':p.agent,x:60+(i%4)*290,y:60+Math.floor(i/4)*200,owner:'Responsável a confirmar com a área',metric:i===5?p.kpi:'Critério e prazo a pactuar antes do piloto',evidence:'Fonte identificada, data, empresa, SKU/pedido e evidência do responsável',notes:notes[i]})),edges:[[0,1],[1,2],[2,3],[3,4,'Sim'],[3,6,'Não / pendente'],[4,9],[9,5,'Aprovado'],[9,6,'Reprovado'],[5,7],[6,8]].map(([a,b,label=''])=>({from:'n'+a,to:'n'+b,label}))};
 graph.consultation={title:p.title,summary:p.scope,assumptions:[p.rule,'Modelo proposto para revisão. Nenhuma consulta diária, preço, transferência ou link de cliente é ativado por este mapa.'],questions:['Quem é o dono e substituto de cada etapa?','Quais limites, fontes, frequência e metas serão aprovados?','Quais campos e eventos ainda faltam no Procfit ou transportador?'],risks:[{risk:'Fonte desatualizada, incompleta ou sem conciliação',control:'Bloquear ação e abrir pendência com responsável.'},{risk:'Decisão sem alçada ou promessa incompatível com capacidade',control:p.control}],indicators:[{name:'Performance e experiência',measure:p.kpi,target:'Definir baseline, janela e meta com os responsáveis antes do piloto.'}],tests:[{name:'Caminho elegível e aprovado',input:'Fonte atual, critérios completos e aceite da alçada.',expected:'Encaminhamento supervisionado com evidência; medir resultado sem execução pelo mapa.',path:['n0','n1','n2','n3','n4','n9','n5','n7']},{name:'Dado ausente ou critério inválido',input:p.key==='customer-tracking'?'Link revogado, evento duplicado ou acesso a pedido de outro cliente.':p.key==='pricing-cycle'?'Concorrente com embalagem diferente, custo ausente ou referência vencida.':p.key==='stock-transfer'?'Quantidade proposta consumiria a reserva de segurança do doador.':p.key==='stock-campaign'?'Lote vencido ou preço abaixo do piso de contribuição.':p.key==='order-promise'?'Pedido após o corte, fora da região atendida ou sem estoque reservado.':'Reclamação de atraso ou item solicitado indisponível, com responsável ainda não definido.',expected:'Bloquear ação e registrar pendência.',path:['n0','n1','n2','n3','n6','n8']},{name:'Alçada reprova',input:'Dados conferidos, mas responsável rejeita a proposta.',expected:'Nenhuma execução; registrar motivo e correção.',path:['n0','n1','n2','n3','n4','n9','n6','n8']}],source:'guided',generated_at:new Date().toISOString(),observations:[],validator:'',edited:false};
 return graph;
}
