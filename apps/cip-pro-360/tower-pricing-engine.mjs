// CIP360 Marca-passo · motor puro de simulação, sem comando de alteração de preço.
const num=x=>x!==''&&x!==null&&x!==undefined&&Number.isFinite(Number(x))?Number(x):null;
const round=(n,d=2)=>Number.isFinite(n)?Math.round((n+Number.EPSILON)*10**d)/10**d:null;
const money=n=>Number.isFinite(n)?round(n):null;
export function curveReference(curve,source){
 const r=(source?.curves||[]).find(x=>x.curve===String(curve||'').toUpperCase());
 return r?{curve:r.curve,lucro:r.lucro,despesa:r.despesa,comissao:r.comissao,unapproved:true}:null;
}
export function contribution(price,cost,expensePct,commissionPct,fixedCost=0){
 const [p,c,e,k,f]=[price,cost,expensePct,commissionPct,fixedCost].map(num);
 if([p,c,e,k,f].some(x=>x===null)||p<=0||c<0||e<0||k<0||f<0||e+k>=100)return null;
 const variable=p*(e+k)/100,unit=p-c-f-variable;
 return {price:money(p),cost:money(c),variable:money(variable),fixedCost:money(f),
  contributionUnit:money(unit),marginPct:round(unit/p*100,2)};
}
export function floorPrice(cost,expensePct,commissionPct,fixedCost,minMarginPct){
 const [c,e,k,f,m]=[cost,expensePct,commissionPct,fixedCost,minMarginPct].map(num);
 if([c,e,k,f,m].some(x=>x===null)||c<0||f<0||e<0||k<0||m<0||e+k+m>=100)return null;
 return Math.ceil((c+f)/(1-(e+k+m)/100)*100-1e-8)/100;
}
export function verifiedReference(input,now=new Date(),maxAgeDays=7){
 const p=num(input?.normalized_price),age=Date.parse(String(input?.observed_on||'')+'T12:00:00Z');
 const nowDay=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),12);
 const days=Number.isFinite(age)?Math.floor((nowDay-age)/86400000):null;
 const reason=!(p>0)?'Preço equivalente indisponível':
  !input?.equivalent?'Produto/unidade não homologados':
  input?.active!==true?'Referência inativa':
  !['disponivel','em_estoque','available'].includes(String(input?.availability||'').toLowerCase())?'Disponibilidade não confirmada':
  !Number.isInteger(days)||days<0||days>maxAgeDays?'Evidência desatualizada':'';
 return {valid:reason==='',price:reason===''?p:null,days,reason,source:input?.source_url||null};
}
export function priceScenarios(input){
 const warnings=[],types=['protecao','competitivo','promocao','campanha'];
 const cost=num(input?.cost),price=num(input?.currentPrice),expense=num(input?.expensePct),commission=num(input?.commissionPct),
   fixed=num(input?.fixedCost??0),minPct=num(input?.minimumMarginPct),targetPct=num(input?.targetMarginPct);
 if([cost,price,expense,commission,fixed,minPct,targetPct].some(x=>x===null)||
  cost<=0||price<=0||expense<0||commission<0||fixed<0||minPct<0||targetPct<0||expense+commission+Math.max(minPct,targetPct)>=100)
   return {ready:false,blockers:['Informar custo, preço atual, despesas, comissão e margens coerentes (a soma deve ficar abaixo de 100%).'],scenarios:[]};
 const floor=floorPrice(cost,expense,commission,fixed,minPct);
 const target=floorPrice(cost,expense,commission,fixed,targetPct);
 const before=contribution(price,cost,expense,commission,fixed);
 const stockAge=input?.stockAsOf?Math.floor((Date.now()-Date.parse(input.stockAsOf+'T12:00:00Z'))/86400000):null;
 if(input?.stockSource!=='erp_conciliado')warnings.push('Custo e preço são de carga histórica/manual; confirmar a base financeira antes de alterar preço.');
 if(stockAge!==null&&stockAge>2)warnings.push('Posição de estoque antiga ('+stockAge+' dias). Conferir custo, quantidade e preço vigente.');
 const competitor=verifiedReference(input?.competitor);
 const compPrice=competitor.price;
 if(!competitor.valid)warnings.push('Concorrência: '+competitor.reason+'. Dados manuais não se tornam evidência homologada.');
 const proposed={
  protecao:Math.max(price,target),
  competitivo:compPrice!==null?Math.max(floor,Math.min(compPrice,target)):null,
  promocao:Math.max(floor,price*(1-(num(input?.discountPct)??5)/100)),
  campanha:Math.max(floor,price*(1-(num(input?.campaignDiscountPct)??8)/100))
 };
 const currentUnits=num(input?.baselineUnits),projectedUnits=num(input?.expectedUnits),
   campaignCost=num(input?.campaignCost??0);
 const scenarioCosts=campaignCost!==null&&campaignCost>=0?campaignCost:0;
 const scenarios=types.map(kind=>{
  const candidate=proposed[kind];
  if(candidate===null)return {kind,available:false,reason:'Referência equivalente homologada ausente',suggestedPrice:null,simulation:true};
  const priceVal=Math.max(.01,Math.ceil(candidate*100-1e-8)/100);
  const after=contribution(priceVal,cost,expense,commission,fixed);
  const belowFloor=priceVal<floor-.001,stockLimit=num(input?.availableUnits);
  let quantity=(kind==='campanha'||kind==='promocao')?projectedUnits:currentUnits;
  const projectedQuantityValid=quantity!==null&&quantity>=0;
  if(stockLimit!==null&&stockLimit>=0&&projectedQuantityValid)quantity=Math.min(quantity,stockLimit);
  const grossValue=projectedQuantityValid?money(after.contributionUnit*quantity-(kind==='campanha'?scenarioCosts:0)):null;
  const baselineValue=currentUnits!==null&&currentUnits>=0?money(before.contributionUnit*currentUnits):null;
  const incremental=(grossValue!==null&&baselineValue!==null)?money(grossValue-baselineValue):null;
  return {kind,available:!belowFloor,suggestedPrice:priceVal,floor,marginPct:after.marginPct,
    contributionUnit:after.contributionUnit,priceChangePct:round((priceVal/price-1)*100,2),
    quantityScenario:projectedQuantityValid?quantity:null,
    expectedContribution:grossValue,baselineContribution:baselineValue,scenarioDifference:incremental,
    belowFloor,simulation:true,requiresApproval:true};
 });
 return {ready:true,floor,target,before,competitor,warnings,scenarios,simulation:true,
  headline:price<floor?'Preço atual abaixo do piso simulado — validar custos e política.':
    compPrice!==null&&price>compPrice?'Nosso preço acima de referência validada; comparar serviço e margem.':
    compPrice!==null&&price<compPrice?'Possível espaço para proteger margem, após validação comercial.':
    'Comparar contribuição e giro antes de aprovar qualquer ação.'};
}
export function campaignSensitivity(input){
 const base=priceScenarios(input);if(!base.ready)return base;
 const b=base.scenarios.find(x=>x.kind==='campanha');
 if(!b.available||b.contributionUnit<=0)return {...base,breakEvenUnits:null};
 const before=base.before,volume=num(input.baselineUnits),cost=num(input.campaignCost??0);
 return {...base,breakEvenUnits:volume!==null&&volume>=0&&cost!==null&&cost>=0?
   Math.ceil((before.contributionUnit*volume+cost)/b.contributionUnit):null};
}
