import {referenceIntent} from './stock-reference.mjs';
import {financialIntent} from './erp-reports.mjs';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function interpret(text){
 if(typeof text!=='string'||text.length>1200)return {kind:'help'};
 const q=normalize(text);
 const pair=text.trim().match(/^\/vincular\s+([a-f0-9]{64})$/i);if(pair)return {kind:'pair',code:pair[1].toLowerCase()};
 if(/^\/(sair|revogar)(?:\s|$)/.test(q))return {kind:'revoke'};
 if(/^\/(empresas|empresa)(?:\s|$)/.test(q)||/escolher empresa|trocar empresa/.test(q))return {kind:'companies'};
 if(/^\/(menu|inicio|start|ajuda)(?:\s|$)/.test(q))return {kind:'help'};
 if(/^\/rotina(?:\s|$)/.test(q))return {kind:'stock_routine',enabled:q==='\/rotina ativar'?true:q==='\/rotina desativar'?false:null};
 if(/\b(alterar|excluir|pagar|comprar|enviar campanha|mudar preco)\b/.test(q))return {kind:'blocked'};
 const reference=referenceIntent(text);if(reference)return reference;
 const financial=financialIntent(text);if(financial)return {kind:financial};
 if(/\b(faturamento|saldo|vendas|receita|margem|estoque|ruptura|sku)\b/.test(q)&&!/^\/(conhecimento|buscar)\b/.test(q)&&!/(orientacao|conhecimento|material|documento|como funciona)/.test(q))return {kind:'erp_unavailable'};
 if(/^\/(conhecimento|buscar)\b/.test(q)||/\b(conhecimento|orientacao|material|documento)\b/.test(q))return {kind:'knowledge',query:text.replace(/^\/(conhecimento|buscar)\s*/i,'').replace(/^(?:buscar|pesquisar|quero|me mostre|consulte)?\s*(?:conhecimento|orienta[çc][aã]o|material|documento)s?\s*(?:sobre|de)?\s*/i,'').trim().slice(0,200)};
 if(/\b(ontem|hoje|semana|mes|periodo)\b/.test(q)||/\d{2}\/\d{2}/.test(q))return {kind:'clarification',question:'period'};
 if(/\b(missoes|missao|tarefas|tarefa)\b/.test(q))return {kind:'missions'};
 if(/\b(processos|processo|fluxos|fluxo)\b/.test(q))return {kind:'processes'};
 if(/^\/(resumo|status)\b/.test(q)||/\b(resumo|relatorio|situacao)\b/.test(q))return {kind:'summary'};
 return {kind:'help'};
}
export function privateMessage(update){
 const m=update?.message;return Number.isSafeInteger(update?.update_id)&&update.update_id>=0&&m?.chat?.type==='private'&&!m?.from?.is_bot&&Number.isSafeInteger(m?.from?.id)&&m.from.id>0&&m.chat.id===m.from.id&&typeof m.text==='string'&&m.text.length<=1200?{update_id:update.update_id,chat:String(m.chat.id),user:String(m.from.id),text:m.text}:null;
}
export const HELP='Sou o Doquita. Seu vínculo não expira: permanece ativo até revogação ou suspensão. Use os botões abaixo ou envie /empresas para escolher o escopo.\n\n/resumo · cadastro atual\n/missoes · estados das tarefas\n/processos · mapas cadastrados\n/conhecimento reposição · fontes revisadas\n/rotina · briefing diário opcional da Shopping\n/bases · fontes de estoque disponíveis\n/cd · saldo e custo do CD 100\n/lojas · recorte das lojas; aceita loja 5\n/produto CODIGO · localizar SKU ou descrição\n/unidades · custo por código de loja\n/conferencia · custos com pendências\n/prioridades · ranking e pauta dos agentes\n/vendas · venda líquida do mês\n/estoque · custo do saldo\n/parados · entrada acima de 180 dias\n/semvendas · janela sem venda positiva\n/giro · plano de ação\n/sair · revogar acesso\n\nVocê pode escrever seu pedido. Voz e interpretação semântica dependem da IA habilitada pelo superadm no CIP. As planilhas de estoque disponíveis são referências não conciliadas, separadas entre CD e lojas. Vendas do mês e indicadores realizados dependem de base aprovada. As respostas são em texto.';
