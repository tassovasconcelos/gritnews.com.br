// CIP360 · decisões sobre evidências reais, sem comandos automáticos ao ERP.
export const COMMAND_KINDS=Object.freeze({
 estoque:{label:'Estoque e preço',icon:'▣',route:'estoque',expiresHours:48},
 radar:{label:'Radar de concorrência',icon:'⌖',route:'radar-mercado',expiresHours:48},
 missao:{label:'Missões dos agentes',icon:'✺',route:'quartel',expiresHours:48},
 campanha:{label:'Campanhas comerciais',icon:'✦',route:'precos',expiresHours:48}
});
export const DECISION_STATES=Object.freeze({
 em_analise:'Em análise',apuracao_autorizada:'Apuração autorizada',
 plano_aprovado:'Plano aprovado (não executado)',rejeitada:'Rejeitada',
 em_acompanhamento:'Em acompanhamento',resultado_declarado:'Resultado declarado (não conciliado)'
});
export const DECISION_ACTIONS=Object.freeze({
 pendente:['em_analise','apuracao_autorizada','plano_aprovado','rejeitada'],
 em_analise:['apuracao_autorizada','plano_aprovado','rejeitada'],
 apuracao_autorizada:['plano_aprovado','rejeitada'],
 plano_aprovado:['em_acompanhamento','rejeitada'],
 em_acompanhamento:['resultado_declarado','rejeitada'],
 resultado_declarado:[],rejeitada:[]
});
const validNum=x=>x!==null&&x!==undefined&&Number.isFinite(Number(x))?Number(x):null;
export function freshness(row,now=new Date()){
 const age=Date.parse(row?.source_at);
 const hours=Number.isFinite(age)?(now.getTime()-age)/3600000:null;
 const limit=COMMAND_KINDS[row?.source_kind]?.expiresHours??48;
 const fresh=hours!==null&&hours>=-0.1&&hours<=limit;
 return {fresh,ageHours:hours,limitHours:limit,
  label:hours===null?'Sem data comprovável':hours<0?'Data futura: verificar':
  fresh?'Fonte dentro da janela':'Fonte desatualizada — atualizar antes de aprovar'};
}
export function evidenceStatus(row){
 if(row?.source_kind==='radar'){
  const cert=row?.evidence?.quality?.certified===true;
  const equivalent=row?.evidence?.match?.certified===true;
  const freight=validNum(row?.market_shipping);
  const price=validNum(row?.market_price);
  return {eligibleForComparison:cert&&equivalent&&price!==null&&freight!==null&&
   ['available','disponivel','em_estoque'].includes(String(row.availability).toLowerCase()),
   label:cert&&equivalent?'Revisar frete, praça e unidade':'Oferta candidata; equivalência não homologada'};
 }
 return {eligibleForComparison:false,label:String(row?.quality||'Exige conferência')};
}
export function availableActions(state,sourceFresh,canManage){
 if(!canManage)return [];
 const possible=DECISION_ACTIONS[state||'pendente']||[];
 return possible.filter(a=>a!=='plano_aprovado'||sourceFresh);
}
export function safeExternalUrl(value){
 try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export function rankFeed(items,filter='todos',query=''){
 const q=String(query).trim().toLocaleLowerCase('pt-BR');
 return items.filter(x=>(filter==='todos'||x.source_kind===filter)&&
  (!q||[x.sku,x.title,x.recommendation,x.evidence?.seller].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q))))
  .sort((a,b)=>new Date(b.source_at)-new Date(a.source_at)||b.priority-a.priority);
}
export function insightCounters(items,decisions){
 const statuses=Object.fromEntries(decisions.map(d=>[d.source_kind+':'+d.source_ref,d.state]));
 return {total:items.length,open:items.filter(x=>!statuses[x.source_kind+':'+x.source_ref]).length,
  authorized:items.filter(x=>['apuracao_autorizada','plano_aprovado'].includes(statuses[x.source_kind+':'+x.source_ref])).length,
  stale:items.filter(x=>!freshness(x).fresh).length};
}
export function safeCsv(rows){
 const escape=x=>{let s=String(x??'').replace(/[\r\n]+/g,' ');
  if(/^\s*[=+\-@]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+rows.map(r=>r.map(escape).join(';')).join('\r\n');
}
