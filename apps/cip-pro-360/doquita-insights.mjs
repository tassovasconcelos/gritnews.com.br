// Doquita · CIP PRO 360° | leitura explicável de registros manuais.
 // Nenhuma previsão estatística, valor de ERP, dado pessoal ou ação automática.
export function summarizeDoquita({companies=[],quotes=null,demands=null,prices=null,now=new Date()}={}) {
 const canShopping=companies.includes('shopping_prohospital');
 const canB2B=companies.includes('distribuidora_prohospital');
 const signals=[];
 const metrics=[];
 const format=n=>Number(n||0).toLocaleString('pt-BR');
 const normalize=(rows)=>Array.isArray(rows)?rows:[];
 function signal(priority,kind,title,detail,action,route,source,quantity) {
   signals.push({priority,kind,title,detail,action,route,source,quantity,
     requiresApproval:true,forecast:false});
 }
 if(canShopping) {
   if(!prices||prices.error) {
     signal('ATENCAO','DADOS','Sem leitura do Marca-passo',
       'Não foi possível consultar as revisões manuais de preço.','Conferir permissão e conexão do módulo de preços.','precos','CIP · revisões manuais',0);
   } else {
     const rows=normalize(prices.rows);
     const atRisk=rows.filter(r=>r.status==='em_analise'&&
       Number(r.current_price)>0&&Number(r.cost)>=0&&
       Number.isFinite(Number(r.expense_pct))&&Number.isFinite(Number(r.target_margin_pct))&&
       (1-Number(r.cost)/Number(r.current_price)-Number(r.expense_pct)/100)*100<Number(r.target_margin_pct)).length;
     const pending=rows.filter(r=>r.status==='em_analise').length;
     metrics.push({label:'Revisões de preço (CIP)',value:format(prices.total),
       detail:'Base manual; não equivale a preços do Procfit'});
     if(atRisk)signal('ALTA','MARGEM','Revisões com margem abaixo do alvo',
       atRisk+' registro(s) em análise com margem calculada abaixo da meta informada.',
       'Validar custo, impostos, despesas e alçada antes de aprovar qualquer preço.',
       'precos','CIP · simulações de margem',atRisk);
     if(pending&&!atRisk)signal('MEDIA','DECISAO','Revisões de preço aguardando decisão',
       pending+' revisão(ões) manuais ainda em análise.',
       'Conferir premissas e registrar a decisão pelo fluxo autorizado.',
       'precos','CIP · revisões de preço',pending);
     if(prices.total>rows.length)metrics[metrics.length-1].detail+=' · amostra parcial';
   }
 }
 if(canB2B) {
   if(!quotes||quotes.error) {
     signal('ATENCAO','DADOS','Cotações não disponíveis',
       'A fonte de cotações manuais não pôde ser lida.','Verificar dados e permissões do B2B.','cotacoes','CIP · cotações',0);
   } else {
     const rows=normalize(quotes.rows);
     const open=rows.filter(r=>['rascunho','enviada','negociacao'].includes(r.status)).length;
     const lostWithoutReason=rows.filter(r=>r.status==='perdida'&&!String(r.loss_reason||'').trim()).length;
     metrics.push({label:'Cotações registradas no CIP',value:format(quotes.total),
       detail:'Cadastro manual, sem conciliação ERP'+(quotes.total>rows.length?' · amostra parcial':'')});
     if(open)signal('MEDIA','COMERCIAL','Cotações em andamento',
       open+' cotação(ões) na amostra sem status final de ganho ou perda.',
       'Atualizar o andamento e o próximo contato após validação comercial.',
       'cotacoes','CIP · funil B2B',open);
     if(lostWithoutReason)signal('ALTA','QUALIDADE','Cotações perdidas sem motivo',
       lostWithoutReason+' perda(s) manuais sem justificativa registrada.',
       'Solicitar motivo de perda para orientar sortimento e negociação.',
       'cotacoes','CIP · motivo de perda',lostWithoutReason);
   }
   if(!demands||demands.error) {
     signal('ATENCAO','DADOS','Caderninho indisponível',
       'Não foi possível consultar as procuras registradas.',
       'Verificar a fonte e as permissões do Caderninho.',
       'caderninho','CIP · demandas',0);
   } else {
     const rows=normalize(demands.rows);
     const waiting=rows.filter(r=>['registrado','em_busca'].includes(r.status)).length;
     metrics.push({label:'Procuras registradas',value:format(demands.total),
       detail:'Demandas informadas manualmente'+(demands.total>rows.length?' · amostra parcial':'')});
     if(waiting)signal('ALTA','OPORTUNIDADE','Procuras ainda não atendidas',
       waiting+' procura(s) na amostra aguardando verificação ou busca de produto.',
       'Validar disponibilidade, responsável e retorno ao cliente antes de prometer entrega.',
       'caderninho','CIP · Caderninho Inteligente',waiting);
   }
 }
 if(!canShopping&&!canB2B) {
   return {available:false,metrics:[],signals:[],reason:'Seu perfil não possui empresa habilitada para esta análise.'};
 }
 const order={ALTA:0,ATENCAO:1,MEDIA:2};
 signals.sort((a,b)=>(order[a.priority]??3)-(order[b.priority]??3)||b.quantity-a.quantity);
 return {available:true,metrics,signals,checkedAt:new Date(now).toISOString(),
   dataScope:'Somente registros manuais do CIP autorizados para esta conta.',
   limitations:'Sem conexão com o Procfit/BI. Nenhuma recomendação envia mensagens, altera preços ou executa aprovações.'};
}
