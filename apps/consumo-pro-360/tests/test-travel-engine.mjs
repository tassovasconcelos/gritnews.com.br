import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {test} from "node:test";
import ts from "typescript";

const directory=resolve(fileURLToPath(new URL(".",import.meta.url)),"..");
const source=await readFile(resolve(directory,"src/lab/travelEngine.ts"),"utf8");
const transpiled=ts.transpileModule(source,{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}
});
const travel=await import("data:text/javascript;base64,"+Buffer.from(transpiled.outputText).toString("base64"));
const dates={outbound:"2026-11-10",connection:"2026-11-12",inbound:"2026-11-14"};
const routes=travel.makeScenarios(dates);
const base={...travel.DEFAULT_COSTS,travelers:1,bufferPercent:0};
const sample=(route,values)=>Object.fromEntries(values.map((p,i)=>[
 travel.quoteKey(route.id,i),{price:p,hours:route.legs[i].mode==="air"?1.5:8,
 baggage:0,fees:0,source:"https://operadora.example/consulta",provider:"Pesquisa demonstrativa",checkedAt:"2026-10-12T09:00:00Z"}
]));
test("four scenario paths include user's FOR→SLZ air, SLZ→THE bus, THE→FOR bus",()=>{
 assert.equal(routes.length,4);
 assert.deepEqual(routes[0].legs.map(x=>x.from+"-"+x.to+"-"+x.mode),
 ["FOR-SLZ-air","SLZ-THE-bus","THE-FOR-bus"]);
});
test("absence of observed fares MUST NOT rank as cheapest",()=>{
 const scenarios=routes.map(r=>travel.evaluateScenario(r,{},base));
 assert.equal(travel.rankComplete(scenarios).length,0);
 assert.equal(scenarios[0].directCost,null);
 assert.ok(travel.recommendations(scenarios,dates)[0].includes("não escolhe"));
});
test("compute multi-person trip costs + baggage + contingency + time value",()=>{
 const r=routes[0];
 const q=sample(r,[500,120,220]);
 q["hybrid:0"].baggage=70;
 const result=travel.evaluateScenario(r,q,{
  travelers:2,hotelNights:2,hotelNightly:200,meals:100,localTransfers:50,
  timeValue:40,bufferPercent:10,maxBudget:2200
 });
 // transport: (500+70+120+220)*2=1820; expenses:(2*200+100+50)*2=1100
 // direct 2920 * 1.1 = 3212; time 17.5 hrs *2*40=1400
 assert.equal(result.transport,1820);
 assert.equal(result.expenses,1100);
 assert.equal(result.directCost,3212);
 assert.equal(result.workTimeCost,1400);
 assert.equal(result.decisionCost,4612);
 assert.equal(result.withinBudget,false);
 assert.equal(result.confidence,"complete");
});
test("partially quoted itineraries must not outrank complete itineraries",()=>{
 const partial=travel.evaluateScenario(routes[0],sample(routes[0],[500,null,220]),base);
 const complete=travel.evaluateScenario(routes[1],sample(routes[1],[900,900,900]),base);
 assert.equal(partial.confidence,"partial");
 assert.deepEqual(travel.rankComplete([partial,complete]).map(x=>x.id),["air"]);
});
test("reject reversed meeting sequence and warn on same-day handoff",()=>{
 assert.ok(travel.validateDates({...dates,connection:"2026-11-09"}).length>0);
 assert.ok(travel.validateDates({...dates,connection:dates.outbound}).length>0);
});
test("history only uses cited quotes observed within 48 hours",()=>{
 const now=new Date("2026-10-12T12:00:00Z");
 const common={from:"FOR",to:"SLZ",mode:"air",date:"2026-11-10",source:"https://airline.example/quote"};
 const fares=[
  {...common,price:500,observedAt:"2026-10-12T10:00:00Z"},
  {...common,price:450,observedAt:"2026-10-12T09:00:00Z"},
  {...common,price:250,observedAt:"2026-10-06T09:00:00Z"},
  {...common,price:200,observedAt:"2026-10-12T08:00:00Z",source:""}
 ];
 const list=travel.cheapestObserved(fares,now);
 assert.equal(list.length,1);
 assert.equal(list[0].price,450);
});
test("long bus legs surface duty-of-care warning",()=>{
 const route=routes[2];const qs=sample(route,[100,120,130]);
 qs["bus:0"].hours=12.5;
 const result=travel.evaluateScenario(route,qs,base);
 assert.ok(result.warnings.some(x=>x.includes("10 horas")));
});
test("reverse itinerary cannot appear as simple equivalent without meeting flexibility",()=>{
 const r=travel.evaluateScenario(routes[3],sample(routes[3],[100,100,100]),base);
 assert.ok(r.warnings.some(x=>x.includes("inverter a ordem")));
});
