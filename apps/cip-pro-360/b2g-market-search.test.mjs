import {test} from 'node:test';import assert from 'node:assert/strict';
import {marketFamilies,requestMarketResearch,validateMarketQuery} from './b2g-market-search.mjs';
import {discoveryMatch,productCorrespondence,mergeMarketBatches,brandCorrespondence,isBrandIndividuallyConfirmed,isExactAwardItem} from './b2g-discovery.mjs';
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
test('family page cap reports partial coverage and resumes at the next page',async()=>{
 const d=await requestMarketResearch(q,{catalog:catalog.slice(0,1),official:async()=>({resultado:Array.from({length:500},()=>({...price,marca:'OUTRA'})),totalRegistros:9000,source:'https://dadosabertos.compras.gov.br/prices'})});
 assert.equal(d.coverage[0].pages,10);assert.equal(d.partial,true);assert.equal(d.rows.length,0);
 assert.deepEqual(d.next_cursor,[{code:'10',page:11}]);assert.equal(d.page_limit,24);assert.equal(d.family_page_limit,10);
});
test('expands coverage across candidate families up to the 24-page round budget',async()=>{
 const c=Array.from({length:8},(_,i)=>({code:String(10+i),name:'Cama hospitalar',group:65,active:true}));
 const d=await requestMarketResearch(q,{catalog:c,official:async()=>({resultado:Array.from({length:500},()=>({...price,marca:'OUTRA'})),totalRegistros:6000,source:'https://dadosabertos.compras.gov.br/prices'})});
 assert.equal(d.coverage.length,5);assert.equal(d.coverage.reduce((n,f)=>n+f.pages,0),24);assert.equal(d.next_cursor.length,5);assert.equal(d.partial,true);
});
test('reports matching records beyond the official verification sample',async()=>{
 const candidates=Array.from({length:121},(_,i)=>{const purchase=String(10000000000000000n+BigInt(i));return {...price,idCompra:purchase,idCompraItem:purchase+'00001',marca:'PROCIRURGICA'};});
 const d=await requestMarketResearch(q,{catalog:catalog.slice(0,1),official:async input=>input.action==='prices'?{resultado:candidates,totalRegistros:121,source:'https://dadosabertos.compras.gov.br/prices'}:{resultado:[],source:'https://dadosabertos.compras.gov.br/result'}});
 assert.equal(d.matched,121);assert.equal(d.displayed,120);assert.equal(d.verification_pending,1);assert.equal(d.partial,true);
});
test('catheter discovery includes urinary nomenclature without ranking a laxative or guide as catheter',()=>{
 const c=[{code:1,name:'Cateter periférico',active:true},{code:2,name:'Sonda trato urinário',active:true},{code:3,name:'Sonda uretral',active:false},{code:4,name:'Mucilóide hidrofílico de psyllium',active:true},{code:5,name:'Guia hidrofílico',active:true}];
 for(const product of ['cateter','cateter hidrofílico']){const ids=marketFamilies(c,product).map(r=>r.code);assert.ok(ids.includes(2));assert.ok(!ids.includes(4));assert.ok(!ids.includes(5));}
 assert.ok(!marketFamilies(c,'cateter periférico').some(r=>r.code===2));
});
test('urethral synonyms preserve technical uncertainty, explicit contradictions, type and dimensions',()=>{
 const row={description:'Sonda trato urinário, modelo uretral, calibre 6 French, lubrificada',brand:'PROCIRURGICA'};
 assert.equal(discoveryMatch(row,{product:'cateter',brand:'procirúrgica'}),true);
 assert.equal(discoveryMatch(row,{product:'cateter hidrofílico'}),false);
 assert.equal(discoveryMatch(row,{product:'cateter hidrofílico',allowRelated:true}),true);
 assert.ok(productCorrespondence(row,'cateter hidrofílico').technical_pending.length);
 for(const product of ['cateter periférico','cateter central','cateter hidrofílico 12 French'])assert.equal(discoveryMatch(row,{product,allowRelated:true}),false);
 assert.equal(discoveryMatch({...row,description:row.description+' não hidrofílica'},{product:'cateter hidrofílico',allowRelated:true}),false);
 assert.equal(discoveryMatch({...row,description:row.description+' revestimento hidrofílico'},{product:'cateter hidrofílico'}),true);
});
test('continuation reaches page seven, preserves state and existing results, rejects arbitrary cursor families',async()=>{
 const input={...q,state:'SP',cursor:[{code:'10',page:7}]},calls=[];
 const next=await requestMarketResearch(input,{catalog:catalog.slice(0,1),official:async i=>{calls.push(i);return i.action==='prices'?{resultado:[price],totalRegistros:3001,source:'https://dadosabertos.compras.gov.br/prices?page=7'}:{resultado:[],source:'https://dadosabertos.compras.gov.br/result'};}});
 assert.equal(calls[0].page,7);assert.equal(calls[0].state,'SP');assert.equal(next.rows.length,1);assert.deepEqual(next.next_cursor,[]);
 const merged=mergeMarketBatches({rows:[],coverage:[{code:10,received:3000,pages:6,total:3001,partial:true}],received:3000,sources:[],failures:[]},next);assert.equal(merged.received,3001);assert.equal(merged.coverage[0].pages,7);assert.equal(merged.rows.length,1);
 await assert.rejects(requestMarketResearch({...input,cursor:[{code:'999',page:1}]},{catalog}),/invalid_query/);
 assert.throws(()=>validateMarketQuery({...q,cursor:[{code:'10',page:0}]}));
});
test('catalog candidates include legacy references without a product-specific special case',()=>{assert.deepEqual(marketFamilies(catalog,'cama').map(r=>r.code),[10,11]);assert.throws(()=>validateMarketQuery({...q,product:''}));assert.throws(()=>validateMarketQuery({...q,action:'other'}));});
test('searches national prices without supplier restriction and confirms only exact active results',async()=>{const calls=[];const d=await requestMarketResearch(q,{catalog,official:async input=>{calls.push(input);return input.action==='prices'?{resultado:input.code==='11'?[price]:[],source:'https://dadosabertos.compras.gov.br/prices',totalRegistros:input.code==='11'?1:0}:{resultado:[{idCompraItem:price.idCompraItem,niFornecedor:price.niFornecedor,situacaoCompraItemResultadoId:1,tipoPessoa:'PJ',valorUnitarioHomologado:100,quantidadeHomologada:2,valorTotalHomologado:200,numeroControlePNCPCompra:'07954480000179-1-000001/2025',dataResultadoPncp:'2026-01-01'}],source:'https://dadosabertos.compras.gov.br/result',collected_at:'2026-10-19'};}});assert.equal(d.confirmed,1);assert.equal(d.rows[0].status,'award');assert.equal(d.rows[0].supplier_id,'11111111000111');assert.equal(d.rows[0].total,200);assert.equal(calls[0].state,'');assert.ok(!('supplier' in calls[0]));});
test('prioritizes exact requested brand award candidates ahead of newer composite-brand references',async()=>{
 const target={...price,idCompra:'99999999999999999',idCompraItem:'9999999999999999900001',niFornecedor:'09485574000171',nomeFornecedor:'PROHOSPITAL COMERCIO HOLANDA LTDA',descricaoItem:'Bolsa de colostomia',dataResultado:'2025-11-01',marca:'CONVATEC'};
 const otherRows=Array.from({length:61},(_,i)=>{const purchase=String(10000000000000000n+BigInt(i));return {...price,idCompra:purchase,idCompraItem:purchase+'00001',descricaoItem:'Bolsa de colostomia',dataResultado:'2026-09-01',marca:'CONVATEC e OUTRA'};});
 const calls=[];const d=await requestMarketResearch({...q,product:'bolsa de colostomia',brand:'Convatec'}, {catalog:[{code:40,name:'Sistema p/ estomia',group:65,active:true}],official:async input=>{calls.push(input);if(input.action==='prices')return {resultado:[...otherRows,target],totalRegistros:62,source:'https://dadosabertos.compras.gov.br/prices'};return {resultado:[],source:'https://dadosabertos.compras.gov.br/result'};}});
 assert.equal(d.rows.length,62);assert.equal(d.rows[0].supplier_id,'09485574000171');assert.equal(d.rows[0].brand,'CONVATEC');assert.equal(calls.find(c=>c.action==='result').item,target.idCompraItem);assert.equal(d.verification_limit,120);assert.equal(d.verification_pending,0);
});
test('buyer state and brand filters reject unrelated references; source failure stays explicit',async()=>{const d=await requestMarketResearch({...q,state:'PE'},{catalog,official:async input=>{if(input.code==='11')throw Error('down');return {resultado:[price,{...price,marca:'OUTRA',estado:'PE'}],source:'https://dadosabertos.compras.gov.br/prices',totalRegistros:2};}});assert.equal(d.rows.length,0);assert.equal(d.failures.length,1);assert.equal(d.received,2);});
test('price disagreement cannot become a confirmed award',async()=>{const d=await requestMarketResearch(q,{catalog:catalog.slice(0,1),official:async input=>input.action==='prices'?{resultado:[price],source:'https://dadosabertos.compras.gov.br/prices',totalRegistros:1}:{resultado:[{idCompraItem:price.idCompraItem,niFornecedor:price.niFornecedor,situacaoCompraItemResultadoId:1,tipoPessoa:'PJ',valorUnitarioHomologado:50,quantidadeHomologada:2}],source:'https://dadosabertos.compras.gov.br/result'}});assert.equal(d.confirmed,0);assert.equal(d.rows[0].status,'reference');});
test('winning result carries the exact PNCP item identity separately from its price-catalog description',async()=>{
 const detailedPrice={...price,descricaoItem:'Cama motorizada elétrica · texto extenso do catálogo de preço',descricaoDetalhadaItem:'Especificação de catálogo',marca:'PROCIRURGICA e RIOFL'};
 const official=async input=>{
  if(input.action==='prices')return {resultado:[detailedPrice],totalRegistros:1,source:'https://dadosabertos.compras.gov.br/prices'};
  if(input.action==='result')return {resultado:[{idCompraItem:price.idCompraItem,niFornecedor:price.niFornecedor,situacaoCompraItemResultadoId:1,tipoPessoa:'PJ',valorUnitarioHomologado:100,quantidadeHomologada:2,valorTotalHomologado:200,numeroControlePNCPCompra:'07954480000179-1-000001/2025',dataResultadoPncp:'2026-01-01'}],source:'https://dadosabertos.compras.gov.br/result'};
  return {resultado:[{idCompra:price.idCompra,idCompraItem:price.idCompraItem,numeroItemPncp:3,descricaoResumida:'Cama hospitalar',descricaodetalhada:'Especificação oficial do item 3',codItemCatalogo:402629,codigoPdm:'9639',codFornecedor:price.niFornecedor,valorUnitarioResultado:100,quantidadeResultado:2}],source:'https://dadosabertos.compras.gov.br/item'};
 };
 const d=await requestMarketResearch(q,{catalog:[{code:11,name:'Cama hospitalar',group:65,active:true}],official});
 assert.equal(d.rows.length,1);assert.equal(d.rows[0].status,'award');assert.equal(d.rows[0].description,'Cama hospitalar');assert.equal(d.rows[0].catalog_description,detailedPrice.descricaoItem);assert.equal(d.rows[0].procurement_item_number,3);assert.equal(d.rows[0].item_award_aligned,true);assert.ok(d.rows[0].evidence.includes('https://dadosabertos.compras.gov.br/item'));
 const authoritative={...d.rows[0],procurement_description:'Cama hospitalar',procurement_detail:'Cama hospitalar elétrica e hidráulica',catalog_description:'Cama hospitalar manual'};
 assert.equal(discoveryMatch(authoritative,{product:'cama hospitalar'}),true);assert.equal(discoveryMatch(authoritative,{product:'cama manual'}),false);
});
test('composite declared brands remain candidates and are never counted as an individually confirmed requested brand',()=>{
 const row={status:'award',item_identity:'official_item',item_award_aligned:true,procurement_description:'Cama hospitalar',procurement_detail:'Cama hospitalar elétrica/hidráulica, polietileno, capacidade até 200 kg',brand:'PROCIRURGICA e RIOFL'};
 assert.equal(discoveryMatch(row,{product:'cama',brand:'procirurgica'}),true);
 assert.deepEqual(brandCorrespondence(row.brand,'PROCIRURGICA'),{status:'composite',parts:['procirurgica','riofl']});
 assert.equal(isExactAwardItem(row),true);
 assert.equal(isBrandIndividuallyConfirmed(row,'PROCIRURGICA'),false);
 assert.equal(isBrandIndividuallyConfirmed({...row,brand:'PROCIRURGICA'},'PROCIRURGICA'),true);
 assert.equal(brandCorrespondence('RIOFL','PROCIRURGICA').status,'different');
});
