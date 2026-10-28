import {publicDomain,sourceUrl,norm} from './market-radar-engine.mjs';
export const PLAN_STATES={draft:'Rascunho para revisão',scheduled:'Programado',ready:'Pronto para aplicação assistida',blocked:'Bloqueado na reavaliação',reported_applied:'Aplicação informada pelo responsável',ended:'Vigência encerrada · revisar tabela',cancelled:'Cancelado'};
export const STRATEGIES={protect_margin:'Proteger contribuição',target_margin:'Buscar contribuição alvo',competitive:'Comparar com concorrência válida'};
export const DESTINATIONS={procfit:'Procfit · aplicação assistida',pdv:'PDV / loja · aplicação assistida',ecommerce:'E-commerce · aplicação assistida',marketplace:'Marketplace · aplicação assistida'};
export const CHANNELS={loja:'Loja física',b2b:'B2B / atacado',ecommerce:'E-commerce',marketplace:'Marketplace'};
export const ISSUES={policy_missing:'Publicar a regra aprovada de margem e alçada.',source_unapproved:'A origem ainda não é uma carga financeira aprovada.',source_stale:'Atualizar a carga aprovada: limite de 36 horas.',source_incomplete:'Custo, preço ou saldo está ausente/inválido.',unit_mismatch:'Conferir a unidade do produto.',reference_invalid:'Referência vencida, retirada ou não equivalente ao canal/unidade.',reference_required:'Selecionar uma referência válida para a estratégia competitiva.',invalid_expenses:'Despesas e margem alvo precisam somar menos de 100%.',competitor_below_floor:'Concorrente abaixo do piso: rever estratégia/custo; não acompanhar abaixo da margem mínima.',below_floor:'Preço planejado abaixo do piso aprovado.',outside_authority:'Variação maior que a alçada aprovada.',policy_changed:'A regra mudou; criar novo rascunho com a versão atual.',source_changed:'Custo ou preço da origem mudou; criar novo rascunho.',duration_exceeds_policy:'Vigência maior que o prazo permitido pela regra.'};
const n=x=>x!==null&&x!==undefined&&String(x).trim()!==''&&Number.isFinite(Number(x))?Number(x):null;
export function normalizedReference(r){const p=n(r.pack_price),f=n(r.shipping),u=n(r.equivalent_units);return p!==null&&p>0&&f!==null&&f>=0&&u!==null&&u>0?(p+f)/u:null;}
export function boardScenario(item,policy,expense,fixed,strategy='protect_margin'){
 const cost=n(item?.cost),price=n(item?.price),e=n(expense),f=n(fixed),p=policy?.rules,minimum=n(p?.minimum_margin_pct),target=n(p?.target_margin_pct),variation=n(p?.max_change_pct);
 if(cost===null||cost<=0||price===null||price<=0||e===null||e<0||f===null||f<0||minimum===null||target===null||e+target>=100||variation===null)return null;
 const ceil=v=>Math.ceil((v-1e-9)*100)/100,floor=ceil((cost+f)/(1-(e+minimum)/100)),targetPrice=ceil((cost+f)/(1-(e+target)/100)),ref=n(item.best_reference?.normalized_price);
 let candidate=strategy==='protect_margin'?Math.max(price,targetPrice):strategy==='competitive'?ref===null?null:Math.max(floor,Math.min(targetPrice,ref)):targetPrice;
 const margin=v=>(v*(1-e/100)-cost-f)/v*100;
 return {floor,targetPrice,candidate:candidate===null?null:Math.round(candidate*100)/100,currentMargin:margin(price),candidateMargin:candidate===null?null:margin(candidate),reference:ref,gap:ref>0?(price/ref-1)*100:null,outsideAuthority:candidate!==null&&Math.abs((candidate/price-1)*100)>variation,belowMarketFloor:ref!==null&&ref<floor,simulation:true};
}
export function safeCsv(rows){const clean=v=>{const s=String(v??'');return '"'+(/^[\s]*[=+\-@\t\r\n]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';};return '\uFEFF'+rows.map(row=>row.map(clean).join(';')).join('\r\n');}
export function planExport(plans){return safeCsv([['PLANO_ASSISTIDO_NAO_EXECUTA_ERP','Empresa','SKU','Loja','Canal','Destino','Tabela','Preço anterior da origem','Preço planejado','Inicio_Brasilia','Fim_Brasilia','Responsavel','Estado','Revisao_ao_final'],...plans.map(p=>[p.id,p.company_id,p.sku,p.store_code,p.channel,p.destination,p.price_table,p.previous_price,p.new_price,new Date(p.start_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),new Date(p.end_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),p.owner_name,PLAN_STATES[p.state]??p.state,'Conferir tabela e aprovar eventual reversão; sem retorno automático'])]);}

// Decision support only: the server remains responsible for approval and revalidation.
export function decisionDossier(item,desk,expense,fixed,now=new Date()){
 const blockers=[],pending=[],cost=n(item?.cost),price=n(item?.price),qty=n(item?.quantity),e=n(expense),f=n(fixed);
 const stamp=Date.parse(desk?.source_at),age=Number.isFinite(stamp)?(now.getTime()-stamp)/3600000:null;
 if(desk?.source!=='erp_approved')blockers.push('Conciliar e aprovar a carga financeira da empresa.');
 if(desk?.source_fresh!==true||age===null||age>36||age< -5/60)blockers.push('Atualizar a origem: data válida e carga de até 36 horas.');
 if(cost===null||cost<=0||price===null||price<=0||qty===null||qty<0||!item?.unit)blockers.push('Conferir custo, preço, saldo e unidade do SKU nesta loja.');
 if(!desk?.policy)blockers.push('Publicar a regra financeira da diretoria.');
 if(e===null||e<0||e>=100||f===null||f<0)blockers.push('Informar despesas completas e custo fixo por unidade; zero exige confirmação.');
 const ref=item?.best_reference,refDay=ref?.observed_on?Date.parse(ref.observed_on+'T00:00:00-03:00'):NaN;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const dayAge=(Date.parse(today+'T00:00:00-03:00')-refDay)/86400000;
 const maxDays=n(desk?.config?.reference_days);
 const ownSeller=/(^|[^a-z])prohospital([^a-z]|$)/i.test(ref?.competitor??'');
 let https=false;try{const u=new URL(ref?.source_url);const d=publicDomain(u.hostname);https=!!d&&!!sourceUrl(ref.source_url,[d])&&!!String(ref.competitor??'').trim()&&!/nao identificado|nao informado|desconhecido/.test(norm(ref.competitor));}catch{}
 const comparable=!!ref&&ref.active===true&&ref.equivalent===true&&ref.availability==='available'&&normalizedReference(ref)!==null&&String(ref.our_unit??'').trim().toUpperCase()===String(item?.unit??'').trim().toUpperCase()&&Number.isFinite(dayAge)&&dayAge>=0&&maxDays!==null&&dayAge<=maxDays&&https&&!ownSeller;
 if(!comparable)pending.push(ownSeller?'Verificar se o vendedor PROHOSPITAL é operação própria antes de usá-lo como concorrente.':'Validar anúncio individual, vendedor, marca/modelo, embalagem, canal, praça, frete, disponibilidade e pagamento.');
 pending.push('Identificar tabela vigente, reservas e custo de reposição antes de aplicar.','Integrar vendas líquidas por loja e período para medir giro; curva ABC isolada não mede velocidade.','Conciliar transferências, devoluções e ajustes separadamente de vendas; idade do lote exige data de entrada e saldo remanescente.');
 const scenario=boardScenario({...item,best_reference:comparable?ref:null},desk?.policy,expense,fixed);
 const unitContribution=cost>0&&price>0&&e!==null&&e>=0&&e<100&&f!==null&&f>=0?price*(1-e/100)-cost-f:null;
 const sensitivity=[-10,-5,0,5].map(change=>{
  const candidate=price>0?Math.round(price*(1+change/100)*100)/100:null;
  const contribution=candidate>0&&unitContribution!==null?candidate*(1-e/100)-cost-f:null;
  return {change,price:candidate,unitContribution:contribution,margin:contribution!==null?contribution/candidate*100:null,volumeChangeRequired:unitContribution>0&&contribution>0?(unitContribution/contribution-1)*100:null,belowFloor:scenario&&candidate!==null?candidate<scenario.floor:null};
 });
 return {status:blockers.length?'Preparação de dados':'Revisão assistida',blockers,pending,comparable,sourceAgeHours:age,scenario,unitContribution,sensitivity,stockCapital:cost>0&&qty!==null&&qty>=0?cost*qty:null,forecast:false,canExecute:false};
}
