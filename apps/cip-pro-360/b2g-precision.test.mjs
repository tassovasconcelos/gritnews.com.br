import {test} from 'node:test';
import assert from 'node:assert/strict';
import {officialURL,PRICE_PAGE_SIZE,rankFamilies,technicalMatch,filterPrices,comparisonSummary,comparisonKey,researchCSVCell} from './b2g-research.mjs';
test('official queries expand to 500 references and 100 CATMAT specifications',()=>{
 const q={action:'prices',type:'codigoPdm',code:'1',start:'2026-01-01',end:'2026-10-19'};
 assert.equal(PRICE_PAGE_SIZE,500);assert.equal(new URL(officialURL(q)).searchParams.get('tamanhoPagina'),'500');
 assert.equal(new URL(officialURL({action:'catalog',code:'1'})).searchParams.get('tamanhoPagina'),'100');
});
test('family search tolerates commercial specifications and ranks explicit candidates, not mappings',()=>{
 const c=[{code:1,name:'LUVA PARA PROCEDIMENTO',active:true,group:65},{code:2,name:'LUVA INDUSTRIAL',active:true,group:84},{code:3,name:'SERINGA DESCARTAVEL',active:true,group:65}];
 const r=rankFamilies(c,'luvas nitrílica M 100 unidades');assert.equal(r[0].code,1);assert.match(r[0].search_match,/candidata/);assert.ok(!r.some(x=>x.code===3));assert.equal(rankFamilies(c,'3')[0].code,3);
});
test('technical matching respects word boundaries, dimensions and common negation',()=>{
 assert.equal(technicalMatch({description:'SERINGA 20ML ESTERIL'},'20 ml estéril').matches,true);
 assert.equal(technicalMatch({description:'SERINGA 200 ML NÃO ESTÉRIL'},'20 ml estéril').matches,false);
 assert.equal(technicalMatch({description:'SERINGA CAPACIDADE 3 ML AGULHA 20 G'},'seringa 20 ml').matches,false);
 assert.equal(technicalMatch({description:'SERINGA CAPACIDADE 20,0 MILILITROS'},'seringa 20 ml').matches,true);
 assert.equal(technicalMatch({description:'LUVA SEM LÁTEX'},'latex').matches,false);
 assert.equal(technicalMatch({description:'LUVA SEM LÁTEX'},'sem latex').matches,true);
 assert.equal(technicalMatch({description:'LUVA TAMANHO M'},'M').matches,true);assert.equal(technicalMatch({description:'LUVA MATERIAL NITRÍLICO TAMANHO: MÉDIO'},'nitrilica tamanho M').matches,true);
 assert.equal(technicalMatch({description:'LUVA TAMANHO P MATERIAL NITRILO'},'M').matches,false);
});
test('technical, supply unit, quantity and confirmed supplier size filters compose',()=>{
 const rows=[{description:'SERINGA 20 ML',unit:'CX',quantity:100,size:'EPP'},{description:'SERINGA 20 ML',unit:'UN',quantity:100,size:'EPP'},{description:'SERINGA 200 ML',unit:'CX',quantity:100,size:'EPP'}];
 assert.equal(filterPrices(rows,{technical:'20 ml',unit:'CX',minQuantity:'50',size:'EPP'}).length,1);
});
test('comparison summary only joins confirmed identical CATMAT, packaging and brand series',()=>{
 const r={catalog:'1',unit:'CX',capacity:100,measure:'UN',brand:'A',brand_quality:'reported',status:'confirmed',id:'1',price:10,result_date:'2026-01-01',supplier_id:'1',state:'SP'};
 const s=comparisonSummary([r,{...r,id:'2',price:20,result_date:'2026-10-01',supplier_id:'2',state:'CE'},{...r,id:'3',price:100,unit:'UN'},{...r,id:'4',price:1000,status:'reference'}],comparisonKey(r));
 assert.equal(s.count,2);assert.equal(s.median,15);assert.equal(s.latest.price,20);assert.equal(s.states,2);
});
test('CSV neutralizes formulas while preserving original characters',()=>{
 assert.equal(researchCSVCell('=SUM(A1)'),`"'=SUM(A1)"`);assert.equal(researchCSVCell(' a"b'),`" a""b"`);
});
