import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderExecutive,cents,amount} from './executive-reports.mjs';
import {renderReference,referenceIntent,referenceArgs} from './stock-reference.mjs';
import {normalizePacket} from '../erp-engine.mjs';
const company='shopping_prohospital',other='distribuidora_prohospital',now=new Date('2026-10-19T12:00:00Z');
const source=(scope,cost,sku='A')=>({scope,status:'reference_unreconciled',source:'SYNTHETIC.xlsx',hash:'a'.repeat(64),reference_date:null,loaded_at:now.toISOString(),summary:{cost,rows:1,skus:1,stores:1,cost_review:0,zero_cost:0},items:[{sku,description:'Synthetic',store_code:scope==='cd100_partial'?'100':'1',quantity:'1',unit_cost:cost,declared_cost:cost,sale_price:null}],units:[],offset:0});
const reference=()=>({available:true,company,kind:'summary',sources:[source('cd100_partial','0.10','CD'),source('stores_only_partial','0.20','LOJA')]});
function snapshot(c=company,value='0.10'){
 const packet={schema:'cip-procfit-v2',captured_at:now.toISOString(),datasets:{products:[{company_id:c,sku:'A',description:'Synthetic',unit:'UN'}],inventory:[{company_id:c,store_id:'1',sku:'A',quantity:'1',average_cost:value,stock_value:value,lot_id:'l',received_date:'2026-01-01'}],sales:[{company_id:c,store_id:'1',sku:'A',sale_date:'2026-10-18',quantity:'1',net_revenue:value}]}};
 const [payload]=normalizePacket(packet,{scope:'company_all',inventory_basis:'physical',inventory_complete:true,sales_complete:true,sales_from:'2026-10-01',sales_through:'2026-10-19'},now);
 return {company_id:c,status:'approved',captured_at:now.toISOString(),source_name:'SYNTHETIC',source_hash:'b'.repeat(64),payload};
}
test('reference answer leads with exact sum then scope and calculation; ranks across sources',()=>{
 const text=renderReference(reference());assert.match(text.split('\n')[0],/R\$ 0,30/);assert.match(text,/não é o estoque total/);assert.match(text,/R\$ 0,10 \+ R\$ 0,20 = R\$ 0,30/);assert.ok(text.indexOf('LOJA ·')<text.indexOf('CD ·'));assert.match(text,/não somente das linhas exibidas/);assert.ok(text.length<3800);
});
test('combined CD and stores request does not silently discard one source',()=>{
 for(const text of ['Unifique custo do estoque CD100 e lojas','Total do CD e filiais','Estoque de lojas e CD 100 consolidado'])assert.equal(referenceArgs(referenceIntent(text),text).p_scope,'both');
});
test('compatible approved companies consolidate in exact cents and show operands',()=>{
 const result=renderExecutive([{company,snapshot:snapshot()},{company:other,snapshot:snapshot(other,'0.20')}],'inventory',now);assert.match(result.split('\n')[0],/R\$ 0,30.*completa/);assert.match(result,/R\$ 0,10 \+ R\$ 0,20/);
 const sales=renderExecutive([{company,snapshot:snapshot()},{company:other,snapshot:snapshot(other,'0.20')}],'sales_mtd',now);assert.match(sales.split('\n')[0],/Venda líquida.*R\$ 0,30/);
});
test('dates bases and sales periods must agree before addition',()=>{
 for(const mutate of [s=>s.captured_at='2026-10-18T12:00:00Z',s=>s.payload.metadata.inventory_basis='available']){
  const s=snapshot(other);mutate(s);const text=renderExecutive([{company,snapshot:snapshot()},{company:other,snapshot:s}],'inventory',now);assert.match(text.split('\n')[0],/total unificado indisponível/);assert.doesNotMatch(text,/Soma:/);
 }
 const s=snapshot(other);s.payload.metadata.sales_through='2026-10-18';assert.match(renderExecutive([{company,snapshot:snapshot()},{company:other,snapshot:s}],'sales_mtd',now).split('\n')[0],/indisponível/);
});
test('missing company is not zero and provisional loads never inflate approved totals',()=>{
 const text=renderExecutive([{company,reference:reference()},{company:other,snapshot:snapshot(other,'1.00')}],'inventory',now);assert.match(text.split('\n')[0],/R\$ 1,00.*PARCIAL/);assert.match(text,/não entram na soma conciliada/);assert.doesNotMatch(text,/R\$ 1,30/);
 const missing=renderExecutive([{company,reference:reference()},{company:other}],'inventory',now);assert.match(missing,/Distribuidora Prohospital: sem base/);assert.match(missing,/não foi considerada como zero/);
});
test('draft mismatched or duplicate company and repeated source are rejected',()=>{
 assert.throws(()=>renderExecutive([{company,snapshot:{...snapshot(),status:'draft'}}],'inventory',now));
 assert.throws(()=>renderExecutive([{company:other,reference:reference()}],'inventory',now));
 assert.throws(()=>renderExecutive([{company},{company}],'inventory',now));
 const r=reference();r.sources.push(r.sources[0]);assert.throws(()=>renderReference(r));
});
test('aging fallback never claims original lot age; missing sales never uses stock references',()=>{
 assert.match(renderExecutive([{company,reference:reference()}],'aged_stock',now).split('\n')[0],/não comprovado/);
 assert.match(renderExecutive([{company}],'sales_mtd',now),/Não há informação validada/);
 const s=snapshot();assert.match(renderExecutive([{company,snapshot:s}],'no_sales_stock',now).split('\n')[0],/indisponível/);
});
test('unknown and partial coverage prevents full-company claims',()=>{
 const s=snapshot();s.payload.metadata.inventory_complete=false;assert.match(renderExecutive([{company,snapshot:s}],'inventory',now).split('\n')[0],/PARCIAL/);
 s.payload.data.inventory=[];assert.match(renderExecutive([{company,snapshot:s}],'inventory',now).split('\n')[0],/indisponível/);
});
test('decimal helpers preserve negative cents and large amounts and reject missing',()=>{
 assert.equal(amount(cents('0.10')+cents('0.20')),'0.30');assert.equal(amount(cents('-0.50')),'-0.50');assert.equal(amount(cents('90071992547409.93')),'90071992547409.93');assert.throws(()=>cents(null));
});
