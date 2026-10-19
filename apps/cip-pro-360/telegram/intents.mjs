const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function interpret(text){
 if(typeof text!=='string'||text.length>1200)return {kind:'help'};
 const q=normalize(text);
 const pair=text.trim().match(/^\/vincular\s+([a-f0-9]{64})$/i);if(pair)return {kind:'pair',code:pair[1].toLowerCase()};
 if(/^\/(sair|revogar)(?:\s|$)/.test(q))return {kind:'revoke'};
 if(/\b(alterar|excluir|pagar|comprar|enviar campanha|mudar preco)\b/.test(q))return {kind:'blocked'};
 if(/\b(faturamento|saldo|vendas|receita|margem|estoque|ruptura|sku)\b/.test(q)&&!/^\/(conhecimento|buscar)\b/.test(q)&&!/(orientacao|conhecimento|material|documento|como funciona)/.test(q))return {kind:'erp_unavailable'};
 if(/^\/(conhecimento|buscar)\b/.test(q)||/\b(conhecimento|orientacao|material|documento)\b/.test(q))return {kind:'knowledge',query:text.replace(/^\/(conhecimento|buscar)\s*/i,'').replace(/^(?:buscar|pesquisar|quero|me mostre|consulte)?\s*(?:conhecimento|orienta[çc][aã]o|material|documento)s?\s*(?:sobre|de)?\s*/i,'').trim().slice(0,200)};
 if(/\b(missoes|missao|tarefas|tarefa)\b/.test(q))return {kind:'missions'};
 if(/\b(processos|processo|fluxos|fluxo)\b/.test(q))return {kind:'processes'};
 if(/^\/(resumo|status)\b/.test(q)||/\b(resumo|relatorio|situacao)\b/.test(q))return {kind:'summary'};
 return {kind:'help'};
}
export function privateMessage(update){
 const m=update?.message;return Number.isSafeInteger(update?.update_id)&&update.update_id>=0&&m?.chat?.type==='private'&&!m?.from?.is_bot&&Number.isSafeInteger(m?.from?.id)&&m.from.id>0&&m.chat.id===m.from.id&&typeof m.text==='string'&&m.text.length<=1200?{update_id:update.update_id,chat:String(m.chat.id),user:String(m.from.id),text:m.text}:null;
}
export const HELP='Sou o Doquita do CIP. Nesta primeira versão interpreto pedidos de resumo, missões, processos e conhecimento revisado.\n\n/resumo\n/missoes\n/processos\n/conhecimento reposição\n/sair\n\nOs totais representam o cadastro atual do CIP, sem filtros históricos. Dados de estoque, vendas e faturamento aguardam a integração Procfit. Não executo alterações.';
