import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHAPTERS,REAL_ROUTES,JOURNEYS,PRESENTATION_ROLES,coverageScenario,capacityScenario,mountPresentation} from './presentation.mjs';
test('coverage scenario uses same-scope cost and monthly CMV without claiming revenue or cash',()=>{
 const s=coverageScenario('100000','50000','40','90');assert.equal(s.monthly,20000);assert.equal(s.target,60000);assert.equal(s.release,40000);assert.equal(s.current,150);
 assert.equal(coverageScenario('10000','50000','40','90').release,-50000);
 for(const values of [['','500','40','90'],['10',0,40,90],[10,5,0,90],[10,5,101,90],[-1,5,40,90],[10,5,40,366],[Infinity,5,40,90]])assert.equal(coverageScenario(...values),null);
});
test('capacity scenario distinguishes gross and reusable hours without counting hires',()=>{
 assert.deepEqual(capacityScenario(25,20),{gross:25*20*22/60,useful:110});assert.equal(capacityScenario(0,20),null);assert.equal(capacityScenario(25,-1),null);assert.equal(capacityScenario(2.5,10),null);
});
test('guide is a final navigation route with explicit director authorization at entry and mount',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8'),auth=readFileSync(new URL('./cip-auth.js',import.meta.url),'utf8'),routeManifest=readFileSync(new URL('./route-manifest.mjs',import.meta.url),'utf8');
 assert.ok(html.indexOf('data-route="apresentacao"')>html.indexOf('data-route="integracoes"'));assert.ok(html.indexOf('data-route="apresentacao"')<html.indexOf('Encerrar sessão'));
 assert.match(html,/\['superadm','diretoria'\]\.includes\(window\.cipAuth\.role\)/);assert.match(auth,/allowedRoutesFor/);assert.match(routeManifest,/apresentacao:.*roles: \['superadm', 'diretoria'\]/s);
 assert.deepEqual(PRESENTATION_ROLES,['superadm','diretoria']);
 for(const role of ['vendedor','gestor',null]){const host={innerHTML:'unchanged'};mountPresentation({root:{querySelector:()=>host},role,allowedRoutes:['apresentacao']});assert.equal(host.innerHTML,'unchanged');}
 const host={innerHTML:'unchanged'};mountPresentation({root:{querySelector:()=>host},role:'diretoria',allowedRoutes:[]});assert.equal(host.innerHTML,'unchanged');
});
test('chapters cover all requested modules with safe real-route targets and planned ecommerce',()=>{
 assert.equal(CHAPTERS.length,16);assert.equal(new Set(CHAPTERS.map(c=>c.id)).size,16);
 for(const id of ['agentes','precos','estoque','escola','quartel','processos','telegram','b2g','cronograma','indicadores','escala'])assert.ok(CHAPTERS.some(c=>c.id===id));
 const safe=['doquita','precos','procfit','quartel','estoque','cotacoes','escola','processos','mensageiro','radar-b2g','cronograma','inicio'];assert.ok(Object.values(REAL_ROUTES).every(r=>safe.includes(r)));assert.equal(JOURNEYS.ecommerce.route,null);
});
test('presentation contains no private budget ledger and motion respects user preferences',()=>{
 const js=readFileSync(new URL('./presentation.mjs',import.meta.url),'utf8'),css=readFileSync(new URL('./presentation.css',import.meta.url),'utf8');
 assert.doesNotMatch(js,/137700|397150|2118030|839155|1278875|service_role|fetch\(/);assert.match(js,/inert aria-hidden="true"/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(js,/clearInterval\(timer\)/);assert.match(js,/abort\.abort\(\)/);
});
