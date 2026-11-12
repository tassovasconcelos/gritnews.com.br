import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeDoquita} from './doquita-insights.mjs';

test('Doquita does not leak Shopping data into Distribuidora-only access',()=>{
 const result=summarizeDoquita({
  companies:['distribuidora_prohospital'],
  prices:{rows:[{status:'em_analise',cost:900,current_price:1000,expense_pct:20,target_margin_pct:30}],total:1},
  quotes:{rows:[{status:'negociacao'}],total:1},
  demands:{rows:[{status:'em_busca'}],total:1}
 });
 assert.equal(result.available,true);
 assert.ok(result.signals.some(s=>s.route==='cotacoes'));
 assert.ok(result.signals.some(s=>s.route==='caderninho'));
 assert.ok(result.signals.every(s=>s.route!=='precos'));
 assert.ok(result.metrics.every(x=>!x.label.includes('preço')));
 assert.ok(result.signals.every(s=>s.requiresApproval&&s.forecast===false));
});
test('Doquita finds below-target manual margin without inventing ERP financials',()=>{
 const x=summarizeDoquita({companies:['shopping_prohospital'],
  prices:{rows:[
   {status:'em_analise',current_price:1000,cost:700,expense_pct:12,target_margin_pct:25},
   {status:'aprovado',current_price:1000,cost:700,expense_pct:12,target_margin_pct:25},
   {status:'em_analise',current_price:1000,cost:150,expense_pct:12,target_margin_pct:25}],total:3}});
 const risks=x.signals.filter(s=>s.kind==='MARGEM');
 assert.equal(risks.length,1);
 assert.equal(risks[0].quantity,1);
 assert.match(x.limitations,/Sem conexão com o Procfit/);
 assert.ok(x.signals.every(s=>!('customer' in s)));
});
test('Caderninho opportunities are limited to registered and searching states',()=>{
 const x=summarizeDoquita({companies:['distribuidora_prohospital'],
  quotes:{rows:[{status:'perdida',loss_reason:''},{status:'ganha'}],total:2},
  demands:{rows:[{status:'registrado'},{status:'em_busca'},{status:'cotado'},{status:'convertido'}],total:4}});
 assert.equal(x.signals.find(s=>s.kind==='OPORTUNIDADE').quantity,2);
 assert.equal(x.signals.find(s=>s.kind==='QUALIDADE').quantity,1);
});
test('missing data source yields an explicit evidence warning, not fabricated zero',()=>{
 const x=summarizeDoquita({companies:['shopping_prohospital'],prices:{error:true}});
 assert.ok(x.signals.some(s=>s.kind==='DADOS'));
 const denied=summarizeDoquita({companies:[]});
 assert.equal(denied.available,false);
 assert.equal(denied.signals.length,0);
});
test('manual-data sampling makes any truncation explicit',()=>{
 const x=summarizeDoquita({companies:['distribuidora_prohospital'],
 quotes:{rows:[{status:'enviada'}],total:250},
 demands:{rows:[],total:0}});
 assert.match(x.metrics[0].detail,/amostra parcial/);
});
test('CIP mobile menu and Doquita are gated behind authenticated routes and safe DOM escaping',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const auth=readFileSync(new URL('./cip-auth.js',import.meta.url),'utf8');
 const release=readFileSync(new URL('./release-check.mjs',import.meta.url),'utf8');
 for(const pattern of [/id="menuBackdrop"/,/aria-expanded="false"/,/function closeMenu\(/,/event.key==='Escape'/,/id="cipDoquitaBoard"/]){
  assert.match(html,pattern);
 }
 assert.match(readFileSync(new URL('./navigation-data.mjs',import.meta.url),'utf8'),/\['doquita','Doquita'/);
 assert.match(auth,/import \{summarizeDoquita\}/);
 assert.match(auth,/doquitaSource\("cip_price_reviews"/);
 assert.match(auth,/doquitaSanitize/);
 assert.match(auth,/window\.cipAuth\?\.allowedRoutes\?\.includes/);
 assert.match(release,/doquita-insights\.mjs/);
 assert.doesNotMatch(auth,/service_role|CIP_FTPS_PASSWORD|innerHTML\s*=\s*customer/);
});
