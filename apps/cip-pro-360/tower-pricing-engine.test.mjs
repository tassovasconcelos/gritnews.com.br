import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contribution,floorPrice,priceScenarios,verifiedReference,campaignSensitivity,curveReference} from './tower-pricing-engine.mjs';
import {ABC_REFERENCE} from './tower-engine.mjs';
import {parseABCcsv} from './tower-abc-ui.mjs';

const input={currentPrice:100,cost:50,expensePct:17,commissionPct:2,fixedCost:5,
 minimumMarginPct:10,targetMarginPct:20,discountPct:5,campaignDiscountPct:8,
 baselineUnits:100,expectedUnits:140,availableUnits:200,campaignCost:100,
 stockAsOf:'2026-10-19',stockSource:'historical_stock'};

test('unit contribution deducts cost, expenses, commission and fixed unit cost',()=>{
 const x=contribution(100,50,17,2,5);
 assert.equal(x.contributionUnit,26);
 assert.equal(x.marginPct,26);
 assert.equal(floorPrice(50,17,2,5,10),77.47);
 assert.equal(floorPrice(50,70,20,5,10),null);
});

test('ABC columns are preserved as raw file fields, not approved policies',()=>{
 const a=curveReference('A',ABC_REFERENCE);
 assert.deepEqual([a.lucro,a.despesa,a.comissao],[3,17,2]);
 assert.equal(a.unapproved,true);
});

test('scenario engine produces four traceable what-if strategies and break-even',()=>{
 const x=campaignSensitivity(input);
 assert.equal(x.ready,true);
 assert.equal(x.before.contributionUnit,26);
 assert.equal(x.scenarios.length,4);
 assert.equal(x.scenarios.find(r=>r.kind==='competitivo').available,false);
 assert.equal(x.scenarios.find(r=>r.kind==='campanha').suggestedPrice,92);
 assert.equal(x.breakEvenUnits,139);
 assert.equal(x.scenarios.every(r=>r.simulation===true),true);
});

test('scenario without assumptions refuses to fabricate results or estimated volumes',()=>{
 const x=priceScenarios({...input,baselineUnits:'',expectedUnits:''});
 assert.equal(x.ready,true);
 assert.equal(x.scenarios.find(r=>r.kind==='campanha').expectedContribution,null);
 assert.equal(x.scenarios.find(r=>r.kind==='campanha').scenarioDifference,null);
 assert.equal(priceScenarios({...input,cost:''}).ready,false);
});

test('competitor reference requires equivalent, available, active and recent',()=>{
 const today=new Date('2026-11-27T14:00:00Z');
 const record={normalized_price:85,observed_on:'2026-11-26',equivalent:true,active:true,availability:'available',source_url:'https://exemplo.com'};
 assert.equal(verifiedReference(record,today).valid,true);
 assert.equal(verifiedReference({...record,equivalent:false},today).valid,false);
 assert.equal(verifiedReference({...record,availability:'unknown'},today).valid,false);
 assert.equal(verifiedReference({...record,observed_on:'2026-10-15'},today).valid,false);
});

test('competition reference can alter suggestion but never becomes ERP command',()=>{
 const recent=new Date().toISOString().slice(0,10);
 const x=priceScenarios({...input,competitor:{normalized_price:85,observed_on:recent,equivalent:true,active:true,availability:'available',source_url:'https://exemplo.com/sku'}});
 const c=x.scenarios.find(s=>s.kind==='competitivo');
 assert.equal(c.available,true);
 assert.equal(c.suggestedPrice,85);
 assert.equal(c.requiresApproval,true);
});

test('CSV parser requires original 6514 product count and curve distribution',()=>{
 const header='TIPO;COD_PRODUTO;PRODUTO;LUCRO;DESPESA;COMISSAO';
 const values=[];
 for(const [curve,count,profit,commission] of [['A',3545,3,2],['B',1803,5,2],['C',1166,9,3]]){
  for(let i=0;i<count;i++)values.push('PRODUTOS CURVA - '+curve+';'+(100000+values.length)+';"PRODUTO; COM PONTO E VIRGULA '+i+'";'+profit+';17;'+commission);
 }
 const parsed=parseABCcsv('\uFEFF'+header+'\r\n'+values.join('\r\n'));
 assert.equal(parsed.items.length,6514);
 assert.deepEqual(parsed.counts,{A:3545,B:1803,C:1166});
 assert.equal(parsed.items[0].product_name,'PRODUTO; COM PONTO E VIRGULA 0');
 assert.throws(()=>parseABCcsv(header+'\r\n'+values.slice(0,6513).join('\r\n')),/6\.514/);
 assert.throws(()=>parseABCcsv(header+'\r\n'+values.map((v,i)=>i===1?values[0]:v).join('\r\n')),/SKU repetido/);
});

test('competition under floor and campaign with zero stock remain blocked',()=>{
 const today=new Date().toISOString().slice(0,10);
 const low=priceScenarios({...input,competitor:{normalized_price:70,observed_on:today,equivalent:true,active:true,availability:'available',source_url:'https://exemplo.com/item'}});
 assert.equal(low.scenarios.find(x=>x.kind==='competitivo').available,false);
 const none=priceScenarios({...input,availableUnits:0});
 assert.equal(none.scenarios.find(x=>x.kind==='campanha').available,false);
 assert.equal(none.scenarios.find(x=>x.kind==='promocao').available,false);
});
