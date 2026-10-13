/* CONSUMO PRO 360 · GRIT Soluções e Negócios
 * Deterministic executive scenarios. No synthetic fares, live availability or provider secrets.
 */
export type Mode="air"|"bus";
export type TripCity="FOR"|"SLZ"|"THE";
export type TravelDates={outbound:string;connection:string;inbound:string};
export type TripLeg={from:TripCity;to:TripCity;mode:Mode;date:string;label:string};
export type RouteKind="hybrid"|"air"|"bus"|"reverse";
export type QuoteInput={
 price:number|null;
 hours:number|null;
 baggage:number|null;
 fees:number|null;
 source:string;
 provider:string;
 checkedAt:string;
};
export type TravelCosts={
 travelers:number;hotelNights:number;hotelNightly:number;meals:number;
 localTransfers:number;timeValue:number;bufferPercent:number;maxBudget:number;
};
export type TravelScenario={
 id:RouteKind;label:string;description:string;legs:TripLeg[];orderingWarning?:string;
};
export type CalculatedScenario=TravelScenario&{
 quotedLegs:number;totalLegs:number;transport:number|null;expenses:number|null;
 directCost:number|null;workTimeCost:number|null;decisionCost:number|null;
 travelHours:number|null;confidence:"complete"|"partial"|"unquoted";
 warnings:string[];withinBudget:boolean|null;
};
export const CITY_NAMES:Record<TripCity,string>={FOR:"Fortaleza",SLZ:"São Luís",THE:"Teresina"};
export const DEFAULT_COSTS:TravelCosts={
 travelers:1,hotelNights:2,hotelNightly:0,meals:0,
 localTransfers:0,timeValue:0,bufferPercent:10,maxBudget:0
};
export const makeScenarios=(dates:TravelDates):TravelScenario[]=>[
 {id:"hybrid",label:"Misto · avião + ônibus",description:"Fortaleza → São Luís de avião; São Luís → Teresina de ônibus; Teresina → Fortaleza de ônibus",
  legs:[
   {from:"FOR",to:"SLZ",mode:"air",date:dates.outbound,label:"Aéreo até São Luís"},
   {from:"SLZ",to:"THE",mode:"bus",date:dates.connection,label:"Rodoviário até Teresina"},
   {from:"THE",to:"FOR",mode:"bus",date:dates.inbound,label:"Retorno rodoviário"}
  ]},
 {id:"air",label:"Aéreo · três trechos",description:"Comparar voo em cada percurso; escalas e conexões exigem confirmação",
  legs:[
   {from:"FOR",to:"SLZ",mode:"air",date:dates.outbound,label:"Voo para São Luís"},
   {from:"SLZ",to:"THE",mode:"air",date:dates.connection,label:"Voo para Teresina"},
   {from:"THE",to:"FOR",mode:"air",date:dates.inbound,label:"Voo de retorno"}
  ]},
 {id:"bus",label:"Rodoviário · três trechos",description:"Menos trechos aéreos; considerar horas em deslocamento e segurança",
  legs:[
   {from:"FOR",to:"SLZ",mode:"bus",date:dates.outbound,label:"Ônibus para São Luís"},
   {from:"SLZ",to:"THE",mode:"bus",date:dates.connection,label:"Ônibus para Teresina"},
   {from:"THE",to:"FOR",mode:"bus",date:dates.inbound,label:"Ônibus de retorno"}
  ]},
 {id:"reverse",label:"Ordem invertida · alternativa",description:"Fortaleza → Teresina de avião; Teresina → São Luís de ônibus; São Luís → Fortaleza de avião",
  orderingWarning:"Somente comparar se for possível inverter a ordem das reuniões.",
  legs:[
   {from:"FOR",to:"THE",mode:"air",date:dates.outbound,label:"Voo para Teresina"},
   {from:"THE",to:"SLZ",mode:"bus",date:dates.connection,label:"Ônibus para São Luís"},
   {from:"SLZ",to:"FOR",mode:"air",date:dates.inbound,label:"Voo de retorno"}
  ]}
];
export const quoteKey=(route:RouteKind,leg:number)=>route+":"+leg;
export const normalizedPrice=(v:unknown):number|null=>{
 const value=Number(v);
 return Number.isFinite(value)&&value>0?value:null;
};
export const isValidDate=(value:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+"T12:00:00Z");
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
};
export const validateDates=(dates:TravelDates):string[]=>{
 const reasons:string[]=[];
 if(!isValidDate(dates.outbound)||!isValidDate(dates.connection)||!isValidDate(dates.inbound))
  reasons.push("Informe datas válidas em todos os trechos.");
 else{
  if(dates.outbound>dates.connection||dates.connection>dates.inbound)
   reasons.push("A sequência de datas não corresponde ao roteiro.");
  if(dates.outbound===dates.connection)reasons.push("Verifique o tempo disponível para a reunião em São Luís antes da conexão.");
  if(dates.connection===dates.inbound)reasons.push("Verifique a reunião em Teresina antes do retorno.");
 }
 return reasons;
};
export const quoteAgeHours=(checkedAt:string,now=new Date()):number|null=>{
 if(!checkedAt)return null;
 const time=Date.parse(checkedAt);
 if(!Number.isFinite(time))return null;
 return Math.max(0,(now.getTime()-time)/3600000);
};
export function evaluateScenario(
 scenario:TravelScenario,quotes:Record<string,QuoteInput>,costs:TravelCosts
):CalculatedScenario{
 const travelers=Math.min(20,Math.max(1,Math.floor(Number(costs.travelers)||1)));
 const expenseFields=[costs.hotelNights,costs.hotelNightly,costs.meals,costs.localTransfers,costs.timeValue,costs.bufferPercent];
 const badCost=expenseFields.some(v=>!Number.isFinite(Number(v))||Number(v)<0);
 let subtotal=0,travelHours=0,quotedLegs=0;
 const warnings:string[]=[];
 for(const [i,leg] of scenario.legs.entries()){
  const q=quotes[quoteKey(scenario.id,i)];
  if(!q||normalizedPrice(q.price)===null||normalizedPrice(q.hours)===null)continue;
  quotedLegs++;
  subtotal+=Number(q.price)+Math.max(0,Number(q.baggage)||0)+Math.max(0,Number(q.fees)||0);
  travelHours+=Number(q.hours);
  const age=quoteAgeHours(q.checkedAt);
  if(age!==null&&age>48)warnings.push("Trecho "+(i+1)+": preço informado há mais de 48 horas; reconfirmar.");
  if(leg.mode==="bus"&&Number(q.hours)>10)
   warnings.push("Trecho "+(i+1)+": mais de 10 horas de ônibus; avaliar fadiga e descanso.");
  if(!q.source.trim())warnings.push("Trecho "+(i+1)+": tarifa sem fonte auditável; valor apenas informativo.");
  if(!q.checkedAt)warnings.push("Trecho "+(i+1)+": data/hora da cotação não registrada.");
  if(q.baggage===null||q.fees===null)warnings.push("Trecho "+(i+1)+": bagagem ou taxas não verificadas.");
  if(leg.mode==="air"&&Number(q.hours)>6)warnings.push("Trecho "+(i+1)+": voo ou conexões demorados; conferir escala.");
 }
 if(scenario.orderingWarning)warnings.push(scenario.orderingWarning);
 if(badCost)warnings.push("Despesas extras inválidas: utilize valores positivos ou zero.");
 const complete=quotedLegs===scenario.legs.length&&!badCost;
 const accommodation=Math.max(0,Number(costs.hotelNights)*Number(costs.hotelNightly));
 const living=Math.max(0,Number(costs.meals)+Number(costs.localTransfers));
 const extras=accommodation+living;
 const transport=complete?subtotal*travelers:null;
 const expenses=complete?extras*travelers:null;
 const buffer=1+Math.min(100,Math.max(0,Number(costs.bufferPercent)))/100;
 const directCost=complete?Math.round(((transport||0)+(expenses||0))*buffer*100)/100:null;
 const workTimeCost=complete?Math.round(travelHours*travelers*Math.max(0,Number(costs.timeValue))*100)/100:null;
 const decisionCost=complete?Math.round(((directCost||0)+(workTimeCost||0))*100)/100:null;
 return {
  ...scenario,quotedLegs,totalLegs:scenario.legs.length,transport,expenses,directCost,
  workTimeCost,decisionCost,travelHours:complete?travelHours:null,
  confidence:complete?"complete":quotedLegs?"partial":"unquoted",warnings,
  withinBudget:complete&&Number(costs.maxBudget)>0?(directCost||0)<=Number(costs.maxBudget):null
 };
}
export function rankComplete(rows:CalculatedScenario[]):CalculatedScenario[]{
 return rows.filter(r=>r.confidence==="complete"&&r.decisionCost!==null)
  .sort((a,b)=>(a.decisionCost||0)-(b.decisionCost||0));
}
export type HistoricalFare={from:TripCity;to:TripCity;mode:Mode;date:string;price:number;observedAt:string;source:string};
export function cheapestObserved(fares:HistoricalFare[],now=new Date()):HistoricalFare[]{
 // Advisory quote history only: discard unsourced and stale records and never call it a booked price.
 const fresh=fares.filter(q=>normalizedPrice(q.price)!==null&&q.source.trim().length>0&&
  isValidDate(q.date)&&Number.isFinite(Date.parse(q.observedAt))&&
  (now.getTime()-Date.parse(q.observedAt))<=48*3600000&&
  Date.parse(q.observedAt)<=now.getTime());
 const lowest=new Map<string,HistoricalFare>();
 for(const f of fresh){
  const key=[f.from,f.to,f.mode,f.date].join(":");
  const prev=lowest.get(key);
  if(!prev||f.price<prev.price)lowest.set(key,f);
 }
 return [...lowest.values()].sort((a,b)=>a.price-b.price);
}
export function recommendations(rows:CalculatedScenario[],dates:TravelDates):string[]{
 const messages=validateDates(dates);
 const ranked=messages.length?[]:rankComplete(rows);
 if(!ranked.length){
  messages.push("O agente AERO não escolhe a tarifa mais barata sem preços e durações informados para todos os trechos.");
  messages.push("Colete cotações com data/hora de consulta e bagagem incluída; compare o custo porta a porta.");
 }else{
  const leader=ranked[0];
  messages.push("Menor custo total ajustado entre cenários preenchidos: "+leader.label+".");
  if(ranked.length>1)
   messages.push("Diferença ajustada para o segundo cenário: R$ "+(ranked[1].decisionCost!-leader.decisionCost!).toFixed(2).replace(".",",")+".");
 }
 if(rows.some(r=>r.warnings.some(w=>w.includes("10 horas"))))
  messages.push("Política de viagens: jornadas rodoviárias longas devem prever descanso, conexão segura e aprovação.");
 messages.push("Nenhuma pesquisa nesta tela equivale à reserva ou à garantia de preço. Revalide com a operadora antes de comprar.");
 return messages;
}
