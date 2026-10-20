import {test} from 'node:test';import assert from 'node:assert/strict';
import {PRODUCT_VOCABULARY,keywordPlan,recognizeProduct,vocabularyCorrespondence,vocabularyKey} from './b2g-vocabulary.mjs';
import {discoveryMatch,familySearchQueries,productCorrespondence} from './b2g-discovery.mjs';
import {marketFamilies} from './b2g-market-search.mjs';
import {webRequest} from './b2g-web-search.mjs';
test('reviewed vocabulary covers 28 groups with sources, criteria and distinct product identities',()=>{
 assert.equal(PRODUCT_VOCABULARY.length,28);assert.equal(new Set(PRODUCT_VOCABULARY.map(p=>p.id)).size,28);
 for(const p of PRODUCT_VOCABULARY){assert.ok(p.aliases.length);assert.ok(p.criteria.length);assert.ok(p.sources.every(u=>u.startsWith('https://')));assert.equal(recognizeProduct(p.aliases[0]).profile.id,p.id);}
});
test('urinary keywords are reciprocal while hydro coating stays a separate requirement',()=>{
 for(const product of ['cateter uretral','sonda uretral','sonda de trato urinário']){assert.ok(discoveryMatch({description:'Cateter uretral',brand:'PROCIRURGICA'},{product,brand:'procirúrgica'}));assert.ok(familySearchQueries(product).includes('sonda trato urinario'));}
 const r={description:'Sonda trato urinário, modelo uretral, lubrificada',brand:'PROCIRURGICA'};
 for(const product of ['cateter hidrofílico','sonda uretral hidrofílica']){assert.equal(discoveryMatch(r,{product}),false);assert.equal(discoveryMatch(r,{product,allowRelated:true}),true);assert.ok(productCorrespondence(r,product).technical_pending.length);}
 assert.equal(discoveryMatch(r,{product:'sonda uretral não hidrofílica',allowRelated:true}),false);
 assert.equal(discoveryMatch({...r,description:r.description+' não hidrofílica'},{product:'sonda uretral hidrofílica',allowRelated:true}),false);
 assert.equal(discoveryMatch({description:'Sonda trato urinário modelo Foley uretral com balonete'},{product:'cateter hidrofílico',allowRelated:true}),false);
 assert.equal(discoveryMatch({description:'Sonda trato urinário'},{product:'sonda uretral'}),false);
 assert.equal(discoveryMatch({description:'Sonda trato urinário'},{product:'sonda uretral',allowRelated:true}),true);
 assert.equal(discoveryMatch(r,{product:'cateterismo vesical intermitente'}),false);
 assert.equal(discoveryMatch(r,{product:'cateterismo vesical intermitente',allowRelated:true}),true);
});
test('bath vocabulary routes official hygiene classification and does not merge mobility or transfer chairs',()=>{
 assert.equal(discoveryMatch({description:'Cadeira para higienização'},{product:'cadeira de banho'}),true);
 assert.equal(discoveryMatch({description:'Cadeira para higienização'},{product:'cadeira de rodas'}),false);
 assert.equal(discoveryMatch({description:'Cadeira de rodas manual para locomoção'},{product:'cadeira de banho'}),false);
 assert.equal(discoveryMatch({description:'Cadeira higiênica de transferência'},{product:'cadeira de banho'}),false);
 const catalog=[{code:1,name:'Cadeira para higienização',group:65,active:true},{code:2,name:'Cadeira rodas manual locomoção',group:65,active:true}];assert.equal(marketFamilies(catalog,'cadeira de banho')[0].code,1);
});
test('commercial and official names preserve material, dimension and model tokens',()=>{
 assert.equal(discoveryMatch({description:'Muleta apoio antebraço alumínio'},{product:'muleta canadense alumínio'}),true);
 assert.equal(discoveryMatch({description:'Muleta axilar alumínio'},{product:'muleta canadense alumínio'}),false);
 assert.equal(discoveryMatch({description:'Elevador de pacientes 180 kg'},{product:'guincho transferência 180 kg'}),true);
 assert.equal(discoveryMatch({description:'Elevador de pacientes 150 kg'},{product:'guincho transferência 180 kg'}),false);
 assert.equal(discoveryMatch({description:'Elevador de pacientes 180 kg'},{product:'guincho transferência Y401 180 kg'}),false);
});
test('technical qualifiers inside aliases cannot disappear during substitution',()=>{
 for(const [product,description] of [['termômetro infravermelho','Termômetro clínico digital'],['oxímetro de dedo','Oxímetro uso médico de mesa'],['poltrona reclinável','Poltrona acompanhante'],['avental descartável','Capote procedimento reutilizável'],['cama Fowler','Cama hospitalar']])assert.equal(discoveryMatch({description},{product}),false,product);
 assert.equal(discoveryMatch({description:'Termômetro clínico digital infravermelho'},{product:'termômetro infravermelho'}),true);
});
test('accessories and broad related indications are not promoted to complete products',()=>{
 assert.equal(discoveryMatch({description:'Manta colchão pneumático'},{product:'colchão pneumático'}),false);
 assert.equal(discoveryMatch({description:'Kit nebulizador com máscara'},{product:'nebulizador'}),false);
 assert.equal(discoveryMatch({description:'Colchão espuma piramidal antiescaras'},{product:'colchão pneumático'}),false);
 assert.equal(discoveryMatch({description:'Maca de transporte de cadáver'},{product:'mesa de exame clínico'}),false);
 assert.equal(discoveryMatch({description:'Cama com balança corporal'},{product:'balança corporal'}),false);
});
test('new synonyms never relax brand, state or numeric units',()=>{
 const r={description:'Cadeira para higienização 46 cm',brand:'OUTRA',state:'CE'};
 assert.equal(discoveryMatch(r,{product:'cadeira banho 46 cm',brand:'PROCIRURGICA'}),false);
 assert.equal(discoveryMatch({...r,brand:'PROCIRURGICA'},{product:'cadeira banho 46 cm',state:'SP'}),false);
 assert.equal(discoveryMatch({...r,brand:'PROCIRURGICA'},{product:'cadeira banho 43 cm'}),false);
 assert.equal(vocabularyCorrespondence({description:'Elevador paciente 180 unidades e 150 kg'},'guincho transferência 180 kg').matches,false);
 assert.equal(vocabularyKey('CH06'),'6 french');
 const s={description:'Sonda trato urinário, modelo uretral, calibre 6 French, lubrificada'};
 assert.equal(discoveryMatch(s,{product:'cateter hidrofílico CH06',allowRelated:true}),true);
 assert.equal(discoveryMatch(s,{product:'cateter hidrofílico CH12',allowRelated:true}),false);
 assert.equal(discoveryMatch({description:'Sonda uretral comprimento 6 cm calibre 10 French'},{product:'cateter CH06'}),false);
});
test('unknown products and commercial models remain explicit without guessing SKU identity',()=>{
 assert.equal(keywordPlan('produto desconhecido xyz').profile,null);assert.equal(vocabularyCorrespondence({description:'Sonda uretral'},'ComfortCath'),null);
 assert.equal(discoveryMatch({description:'Sonda uretral'},{product:'ComfortCath'}),false);
 assert.equal(keywordPlan('cateter hidrofílico').profile,'cateter-uretral');
});
test('mix search seeds resolve without treating broad triggers as proven technical aliases',()=>{
 for(const product of ['oximetro','termometro','balanca','poltrona','exercitador','avental','colchao','grade','elevador','maca'])assert.ok(keywordPlan(product).profile,product);
 assert.equal(vocabularyCorrespondence({description:'Termômetro industrial'},'termometro'),null);
});
test('ostomy expansion distinguishes urinary, intestinal and explicit competing indications',()=>{
 assert.equal(discoveryMatch({description:'Sistema p/ estomia, aplicação urinária, tipo bolsa'},{product:'bolsa urostomia'}),true);
 assert.equal(discoveryMatch({description:'Sistema p/ estomia, aplicação intestinal, tipo bolsa'},{product:'bolsa urostomia'}),false);
 assert.equal(discoveryMatch({description:'Sistema p/ estomia, aplicação intestinal, tipo bolsa'},{product:'bolsa ileostomia'}),true);
 assert.equal(discoveryMatch({description:'Bolsa colostomia'},{product:'bolsa ileostomia'}),false);
});
test('sterility and compound negations remain hard requirements while brand spacing is normalized',()=>{
 assert.equal(discoveryMatch({description:'Avental não estéril'},{product:'avental estéril'}),false);
 assert.equal(discoveryMatch({description:'Avental com manga, sem pó, com látex'},{product:'avental sem látex'}),false);
 assert.equal(discoveryMatch({description:'Avental com manga, sem pó'},{product:'avental com pó'}),false);
 assert.equal(discoveryMatch({description:'Cadeira para higienização',brand:'PRO CIRURGICA'},{product:'cadeira banho',brand:'PROCIRÚRGICA'}),true);
});
test('web request receives only the selected reviewed vocabulary and keeps official domain filtering',()=>{
 const p=webRequest({action:'discover_web',product:'cadeira de banho',brand:'PROCIRURGICA',state:'CE',sphere:'',supplier:'',start:'2025-10-19',end:'2026-10-19'}),i=JSON.parse(p.input);assert.equal(i.vocabulary.profile,'cadeira-banho');assert.ok(i.vocabulary.families.includes('cadeira higienizacao'));assert.ok(p.tools[0].filters.allowed_domains.includes('ce.gov.br'));assert.ok(!p.tools[0].filters.allowed_domains.includes('sp.gov.br'));
});
