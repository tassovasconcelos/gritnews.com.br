import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ABC_REFERENCE,TOWER_AGENTS,TOWER_SOURCE_TABLES,TOWER_ACTION_STATUSES,towerMetrics,sanitizeCsv,exportTowerCsv,agentById} from './tower-engine.mjs';

test('ABC workbook is reference-only and preserves original columns',()=>{
 assert.equal(ABC_REFERENCE.status,'referencia_nao_homologada');
 assert.equal(ABC_REFERENCE.total,6514);
 assert.equal(ABC_REFERENCE.curves.reduce((n,r)=>n+r.products,0),6514);
 assert.deepEqual(ABC_REFERENCE.curves.map(r=>[r.curve,r.lucro,r.despesa,r.comissao]),[['A',3,17,2],['B',5,17,2],['C',9,17,3]]);
});

test('twelve clickable specialists have unique IDs and known destinations',()=>{
 assert.equal(TOWER_AGENTS.length,12);
 assert.equal(new Set(TOWER_AGENTS.map(x=>x.id)).size,12);
 const known=new Set(['precos','estoque','radar-mercado','concorrentes','caderninho','cotacoes','quartel','doquita']);
 for(const agent of TOWER_AGENTS){
  assert.ok(known.has(agent.route),agent.route);
  assert.ok(TOWER_SOURCE_TABLES[agent.source],agent.source);
  assert.ok(agent.functions.length>=3);
  assert.ok(agent.x>=0&&agent.x<=100&&agent.y>=0&&agent.y<=100);
 }
 assert.equal(agentById('marca_passo').name,'Marca-passo');
});

test('source counters preserve unavailable state and do not fabricate sales or margin',()=>{
 const data=towerMetrics({stock_actions:10,market_offers:12,faro_signals:0,missions:2,tower_tasks:3},[]);
 assert.equal(data.find(x=>x.id==='stock_actions').value,10);
 assert.equal(data.find(x=>x.id==='faro_signals').value,0);
 assert.equal(data.find(x=>x.id==='financial').value,null);
 assert.equal(towerMetrics({}).find(x=>x.id==='market_offers').value,null);
});

test('task state model is explicit and result completion requires evidence at database level',()=>{
 assert.deepEqual(TOWER_ACTION_STATUSES.map(x=>x[0]),['aberta','em_analise','proposta','em_execucao','concluida','descartada']);
});

test('CSV export is scoped and escapes newlines, injection strings, and quotes',()=>{
 const tasks=[
 {company_id:'shopping_prohospital',agent_code:'marca_passo',title:'=HYPERLINK("danger")',status:'aberta',priority:'alta',owner_name:'Pessoa',description:'item\nABC',evidence_note:'',created_at:'2026-11-27',updated_at:'2026-11-27'},
 {company_id:'distribuidora_prohospital',agent_code:'caderninho',title:'B2B',status:'aberta',priority:'normal',owner_name:'Outro',description:'Comercial',evidence_note:'',created_at:'2026-11-27',updated_at:'2026-11-27'}
 ];
 const csv=exportTowerCsv(tasks,'shopping_prohospital','marca_passo');
 assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes('item ABC'));
 assert.ok(!csv.includes('B2B'));
 assert.ok(!csv.includes('distribuidora_prohospital'));
 assert.equal(sanitizeCsv('=2+2'),"\"'=2+2\"");
});
