import {test} from 'node:test';import assert from 'node:assert/strict';
import {marketFamilies,requestMarketResearch,validateMarketQuery} from './b2g-market-search.mjs';
import {discoveryMatch,productCorrespondence} from './b2g-discovery.mjs';
const q={action:'discover_market',product:'cama',brand:'PROCIRURGICA',state:'',sphere:'',supplier:'',start:'2025-10-19',end:'2026-10-19'};
const catalog=[{code:10,name:'Cama hospitalar',group:65,active:true},{code:11,name:'Cama hospitalar (Ver PDM: 10)',group:65,active:false}];
const price={idCompra:'12345678901234567',idCompraItem:'1234567890123456700001',niFornecedor:'11111111000111',nomeFornecedor:'Outro fornecedor',precoUnitario:100,quantidade:2,dataResultado:'2026-01-01',descricaoItem:'Cama hospitalar',codigoItemCatalogo:123,marca:'PROCIRURGICA',siglaUnidadeFornecimento:'UN',estado:'SP',esfera:'E'};
test('colostomy terminology retrieves intestinal ostomy systems but not urinary or unknown applications',()=>{
 const row={description:'Sistema p/ estomia, aplicação intestinal, tipo bolsa com base adesiva',brand:'PROCIRURGICA'};
 assert.equal(discoveryMatch(row,{product:'bolsa de colostomia',brand:'procirúrgica'}),true);
 assert.ok(productCorrespondence(row,'bolsa de colostomia').note);
 for(const description of ['Sistema p/ estomia, aplicação urinária, tipo bolsa','Bolsa para urostomia','Sistema p/ estomia, tipo bolsa','Adjuvante para estomia intestinal, tipo pasta','Adjuvante p/ estomia, aplicação intestinal, tipo fixador para bolsa','Placa para bolsa de colostomia'])assert.equal(discoveryMatch({...row,description},{product:'bolsa de colostomia'}),false);
 assert.equal(discoveryMatch({description:'Placa para bolsa de colostomia'},{product:'placa para bolsa de colostomia'}),true);
 assert.equal(discoveryMatch({description:'Bolsas colostomia 57 mm'},{product:'bolsa de colostomia 70 mm'}),false);
 assert.equal(discoveryMatch({description:'Bolsa colostomia'},{product:'bolsa de colostomia'}),true);
});
test('specific ostomy families outrank generic bags and preserve legacy names',()=>{
 const c=[{code:1,name:'Bolsa parenteral',group:65,active:true},{code:2,name:'Bolsa de ostomia',group:65,active:false},{code:3,name:'Sistema p/ estomia',group:65,active:true}];
 assert.deepEqual(marketFamilies(c,'bolsa de colostomia').map(r=>r.code),[3,2]);
});
test('brand results beyond the first page remain discoverable and municipality scope reaches the source',async()=>{
 const calls=[];const d=await requestMarketResearch({...q,product:'bolsa de colostomia',state:'PE',sphere:'M'},{catalog:[{code:3,name:'Sistema p/ estomia',group:65,active:true}],official:async input=>{calls.push(input);if(input.action==='result')return {resultado:[],source:'https://dadosabertos.compras.gov.br/result'};return {resultado:input.page===1?Array.from({length:500},()=>({...price,marca:'OUTRA'})):[{...price,descricaoItem:'Sistema p/ estomia, aplicação intestinal, tipo bolsa',marca:'PROCIRURGICA',estado:'PE',esfera:'M',municipio:'OLINDA'}],totalRegistros:501,source:'https://dadosabertos.compras.gov.br/prices?pagina='+input.page};}});
 assert.equal(d.received,501);assert.equal(d.rows.length,1);assert.equal(d.rows[0].city,'OLINDA');assert.equal(d.rows[0].sphere,'M');assert.equal(d.coverage[0].pages,2);assert.equal(d.partial,false);assert.equal(calls[0].state,'PE');assert.equal(calls[0].sphere,'M');
});
test('page cap reports partial coverage instead of claiming complete absence',async()=>{
 const d=await requestMarketResearch(q,{catalog:catalog.slice(0,1),official:async()=>({resultado:[{...price,marca:'OUTRA'}],totalRegistros:100,source:'https://dadosabertos.compras.gov.br/prices'})});
 assert.equal(d.coverage[0].pages,6);assert.equal(d.partial,true);assert.equal(d.rows.length,0);
});
test('catalog candidates include legacy references without a product-specific special case',()=>{assert.deepEqual(marketFamilies(catalog,'cama').map(r=>r.code),[10,11]);assert.throws(()=>validateMarketQuery({...q,product:''}));assert.throws(()=>validateMarketQuery({...q,action:'other'}));});
test('searches national prices without supplier restriction and confirms only exact active results',async()=>{const calls=[];const d=await requestMarketResearch(q,{catalog,official:async input=>{calls.push(input);return input.action==='prices'?{resultado:input.code==='11'?[price]:[],source:'https://dadosabertos.compras.gov.br/prices',totalRegistros:input.code==='11'?1:0}:{resultado:[{idCompraItem:price.idCompraItem,niFornecedor:price.niFornecedor,situacaoCompraItemResultadoId:1,tipoPessoa:'PJ',valorUnitarioHomologado:100,quantidadeHomologada:2,valorTotalHomologado:200,numeroControlePNCPCompra:'07954480000179-1-000001/2025',dataResultadoPncp:'2026-01-01'}],source:'https://dadosabertos.compras.gov.br/result',collected_at:'2026-10-19'};}});assert.equal(d.confirmed,1);assert.equal(d.rows[0].status,'award');assert.equal(d.rows[0].supplier_id,'11111111000111');assert.equal(d.rows[0].total,200);assert.equal(calls[0].state,'');assert.ok(!('supplier' in calls[0]));});
test('buyer state and brand filters reject unrelated references; source failure stays explicit',async()=>{const d=await requestMarketResearch({...q,state:'PE'},{catalog,official:async input=>{if(input.code==='11')throw Error('down');return {resultado:[price,{...price,marca:'OUTRA',estado:'PE'}],source:'https://dadosabertos.compras.gov.br/prices',totalRegistros:2};}});assert.equal(d.rows.length,0);assert.equal(d.failures.length,1);assert.equal(d.received,2);});
test('price disagreement cannot become a confirmed award',async()=>{const d=await requestMarketResearch(q,{catalog:catalog.slice(0,1),official:async input=>input.action==='prices'?{resultado:[price],source:'https://dadosabertos.compras.gov.br/prices',totalRegistros:1}:{resultado:[{idCompraItem:price.idCompraItem,niFornecedor:price.niFornecedor,situacaoCompraItemResultadoId:1,tipoPessoa:'PJ',valorUnitarioHomologado:50,quantidadeHomologada:2}],source:'https://dadosabertos.compras.gov.br/result'}});assert.equal(d.confirmed,0);assert.equal(d.rows[0].status,'reference');});
