import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COMMAND_KINDS,DECISION_STATES,availableActions,evidenceStatus,freshness,rankFeed,insightCounters,safeCsv,safeExternalUrl} from './command-center-engine.mjs';
test('freshness and source age are explicit, not invented',()=>{
 const now=new Date('2026-11-27T14:00:00Z');
 assert.equal(freshness({source_kind:'radar',source_at:'2026-10-29T12:00:00Z'},now).fresh,false);
 assert.equal(freshness({source_kind:'estoque',source_at:'2026-11-27T12:00:00Z'},now).fresh,true);
 assert.equal(freshness({source_kind:'estoque',source_at:null},now).fresh,false);
});
test('manager only approvals, current evidence required for a planning approval',()=>{
 assert.deepEqual(availableActions('em_analise',false,false),[]);
 assert.ok(availableActions('em_analise',false,true).includes('apuracao_autorizada'));
 assert.ok(!availableActions('em_analise',false,true).includes('plano_aprovado'));
 assert.ok(availableActions('em_analise',true,true).includes('plano_aprovado'));
 assert.equal(availableActions('rejeitada',true,true).length,0);
});
test('radar candidates with incomplete price/pack/freight never become equivalent confirmed',()=>{
 const candidate={source_kind:'radar',market_price:32.24,market_shipping:null,availability:'available',evidence:{quality:{certified:false},match:{certified:false}}};
 assert.equal(evidenceStatus(candidate).eligibleForComparison,false);
 assert.ok(/candidata/i.test(evidenceStatus(candidate).label));
});
test('source URL allows HTTPS only, rejects javascript and embedded credentials',()=>{
 assert.equal(safeExternalUrl('https://example.org/ean'),'https://example.org/ean');
 assert.equal(safeExternalUrl('javascript:alert(1)'),null);
 assert.equal(safeExternalUrl('https://user:pass@example.org'),null);
 assert.equal(safeExternalUrl('http://example.org'),null);
});
test('rank and filters do not misstate status or cross-scope',()=>{
 const items=[{company_id:'shopping_prohospital',source_kind:'radar',source_ref:'1',sku:'10073',title:'Agulha',source_at:'2026-10-29T12:00:00Z',priority:55},
  {company_id:'shopping_prohospital',source_kind:'estoque',source_ref:'2',sku:'50000',title:'Curativo',source_at:'2026-10-19T12:00:00Z',priority:90}];
 assert.equal(rankFeed(items,'radar','agulha').length,1);
 assert.equal(rankFeed(items,'estoque','curativo')[0].sku,'50000');
 const count=insightCounters(items,[{source_kind:'radar',source_ref:'1',state:'apuracao_autorizada'}]);
 assert.equal(count.authorized,1);assert.equal(count.open,1);
});
test('CSV export escapes formula injection and quotes',()=>{
 const csv=safeCsv([['SKU','Ação'],['123','=IMPORTXML("http://fake")'],['2','normal']]);
 assert.ok(csv.includes("'=IMPORTXML"));
 assert.ok(csv.includes('"normal"'));
});
test('named source and decision taxonomy stays explicit',()=>{
 assert.equal(Object.keys(COMMAND_KINDS).length,4);
 assert.equal(DECISION_STATES.resultado_declarado,'Resultado declarado (não conciliado)');
});
