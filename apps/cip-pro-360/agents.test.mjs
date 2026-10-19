import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AGENTS,agentsFor,validWork,escapeHtml,COURSES} from './agents-data.mjs';
import {renderSquadPage} from './agents-ui.mjs';
import {relevantPurchase,purchaseRecord,activeResults,awardedRecord,correlate,latestInSample,getJson} from './b2g-radar.mjs';
test('company catalogue excludes B2G for Shopping-only users and work rejects incorrect company',()=>{
 assert.equal(AGENTS.length,14);assert.equal(new Set(AGENTS.map(a=>a.id)).size,14);
 assert.ok(!agentsFor(['shopping_prohospital']).some(a=>a.id==='b2g'));
 assert.ok(agentsFor(['distribuidora_prohospital']).some(a=>a.id==='b2g'));
 assert.equal(validWork({agent_id:'b2g',company_id:'shopping_prohospital',kind:'task',title:'Investigar edital'}),false);
 assert.equal(validWork({agent_id:'b2g',company_id:'distribuidora_prohospital',kind:'task',title:'Investigar edital'}),true);
 assert.equal(validWork({agent_id:'doquita',company_id:'shopping_prohospital',kind:'lesson',title:'abc'}),false);
});
test('learning practices have a valid answer and do not certify a model automatically',()=>{
 for(const c of COURSES)assert.ok(c.answer>=0&&c.answer<c.choices.length);
 assert.match(renderSquadPage('escola'),/não treina um modelo|não certifica|não.*automaticamente/);
 assert.match(renderSquadPage('quartel'),/Não representam execução autônoma/);
});
test('public text is escaped and the source client refuses non-official URLs',async()=>{
 assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
 await assert.rejects(()=>getJson('https://attacker.invalid/api/'),/Fonte não permitida/);
 await assert.rejects(()=>getJson('http://pncp.gov.br/api/'),/Fonte não permitida/);
});
test('health candidate filter excludes unrelated construction/services and preserves traceable official IDs',()=>{
 assert.equal(relevantPurchase({objetoCompra:'Aquisição de material médico hospitalar'}),true);
 assert.equal(relevantPurchase({objetoCompra:'Reforma de hospital municipal'}),false);
 assert.equal(relevantPurchase({objetoCompra:'Prestação de serviços hospitalares'}),false);
 assert.equal(purchaseRecord({orgaoEntidade:{cnpj:'invalid'}}),null);
});
const raw={tipoPessoa:'PJ',niFornecedor:'12345678000190',nomeRazaoSocialFornecedor:'Fornecedor de teste',dataResultado:'2026-10-10',situacaoCompraItemResultadoId:1,valorUnitarioHomologado:2.5,quantidadeHomologada:100,valorTotalHomologado:250};
test('award excludes canceled, unconfirmed, non-company and malformed results',()=>{
 assert.equal(activeResults([{...raw,dataCancelamento:'2026-10-11'},{...raw,tipoPessoa:'PF'},{...raw,situacaoCompraItemResultadoId:2},{...raw,valorUnitarioHomologado:null},raw]).length,1);
 const p={id:'source',cnpj:'12345678000190',year:2026,sequence:1,city:'Fortaleza',url:'https://pncp.gov.br/app/editais/12345678000190/2026/1'};
 const item={numeroItem:1,descricao:'Luva caixa 100',unidadeMedida:'Caixa',temResultado:true,situacaoCompraItemNome:'Homologado'};
 assert.equal(awardedRecord(p,{...item,situacaoCompraItemNome:'Em andamento'},[raw]),null);
 assert.equal(awardedRecord(p,item,[raw]).unit_price,2.5);
});
test('correlation ranks candidates but last price is explicitly limited to sample chronology',()=>{
 const rows=[{description:'luva nitrílica caixa',date:'2026-01-01',unit_price:80},{description:'luva látex caixa',date:'2026-10-10',unit_price:70}];
 assert.equal(correlate(rows,'luva nitrílica')[0].unit_price,80);
 assert.equal(latestInSample(rows).unit_price,70);
 assert.equal(latestInSample([]),null);
 assert.match(renderSquadPage('radar-b2g'),/Sem robô contínuo configurado/);
});
test('public snapshot has source lineage, no invented winners and a bounded declared sample',()=>{
 const s=JSON.parse(fs.readFileSync(new URL('./b2g-snapshot.json',import.meta.url),'utf8'));
 assert.ok(s.scanned>0&&s.scanned<=150);assert.ok(s.total>=s.scanned);assert.match(s.collected_at,/^\d{4}-/);
 for(const r of s.awards){assert.ok(r.unit_price>0);assert.match(r.supplier_id,/^\d{14}$/);assert.match(r.source,/^https:\/\/pncp.gov.br\/api\/pncp\/v1\//);assert.ok(s.purchases.some(p=>p.id===r.purchase_id));}
});
test('release navigation and data policy enforce separate scope and immutable ownership',()=>{
 const auth=fs.readFileSync(new URL('./cip-auth.js',import.meta.url),'utf8');
 const sql=fs.readFileSync(new URL('./schema/agent-work.sql',import.meta.url),'utf8');
 assert.match(auth,/\[B\]:\[.*"radar-b2g"/);assert.match(auth,/disposeSquad\(\)/);
 assert.match(sql,/enable row level security/);assert.match(sql,/created_by=\(select auth.uid\(\)\)/);
 assert.match(sql,/grant update\(title,notes,status\)/);assert.doesNotMatch(sql,/grant update on/);
});
