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
