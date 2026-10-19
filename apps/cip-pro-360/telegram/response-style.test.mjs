import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderBrief,rememberReport,restoreReport,resultMenu} from './response-style.mjs';
import {interpret} from './intents.mjs';
const company='shopping_prohospital';
const reference={available:true,company,kind:'summary',sources:[{scope:'cd100_partial',status:'reference_unreconciled',source:'SYNTHETIC',hash:'a'.repeat(64),loaded_at:'2026-10-19T12:00:00Z',summary:{rows:1,skus:1,cost:'0.10',cost_review:0,zero_cost:0},items:[],units:[]}]};
test('short result keeps value, partial scope and missing-company caveat without calculation dump',()=>{
 const r=renderBrief([{company,reference},{company:'distribuidora_prohospital'}],'inventory');
 assert.match(r,/^Custo declarado.*R\$ 0,10/);assert.match(r,/PARCIAL, não conciliada/);assert.match(r,/não é o estoque total/i);assert.match(r,/não considerada como zero/);assert.doesNotMatch(r,/Composição e memória|Cálculo:/);assert.ok(r.length<650);
 assert.match(renderBrief([{company,reference}],'aged_stock').split('\n')[0],/não comprovado/);
});
test('follow-up preserves exact filter including long query and CD scope, never restores arbitrary tools',()=>{
 const intent={kind:'stock_product',query:'a'.repeat(200),store:'12345678'};
 const saved=rememberReport(intent,'CD100');assert.ok(saved.length<=512);
 assert.deepEqual(restoreReport({last_kind:intent.kind,last_query:saved}),{intent,text:'CD 100'});
 for(const c of [{last_kind:'sql',last_query:saved},{last_kind:'stock_product',last_query:'broken'},{last_kind:'stock_product',last_query:JSON.stringify({query:'x',store:'foreign',scope:'both'})},{last_kind:null}])assert.equal(restoreReport(c),null);
});
test('short reading never weakens full-renderer scope validation',()=>{
 assert.throws(()=>renderBrief([{company:'distribuidora_prohospital',reference}],'inventory'));
 assert.throws(()=>renderBrief([{company,reference},{company,reference}],'inventory'));
});
test('plain-language details and shorter follow-ups are deterministic without AI',()=>{
 for(const s of ['/detalhes','memória de cálculo','como calculou?'])assert.deepEqual(interpret(s),{kind:'report_followup',detailed:true});
 for(const s of ['/curto','mais objetivo','resumir'])assert.deepEqual(interpret(s),{kind:'report_followup',detailed:false});
 assert.equal(resultMenu().inline_keyboard.length,2);assert.equal(resultMenu(true).inline_keyboard[0][0].callback_data,'report_summary');
});
