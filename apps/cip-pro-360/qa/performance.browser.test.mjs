// Browser contract tests use synthetic data, never real financial results or authentication.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CIP_PLAYWRIGHT_PATH||'playwright');
const fixture=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/performance.css"><div id="app"></div><script type="module">
import {performanceFrame,mountPerformance} from '/performance-ui.mjs';
window.qa={calls:[],writes:[],records:[],delay:0,fail:false,telemetryFail:false};
window.cipAuth={email:'qa@example.invalid'};
const db={from(table){const filters=[];let update;const q={select(){return q},eq(k,v){filters.push([k,v]);return q},in(){return q},gte(){return q},lt(){return q},order(){return q},limit(){return q},
then(resolve){const fail=qa.fail||(qa.telemetryFail&&table==='cip_agent_events');const data=qa.records.filter(x=>x.table===table&&filters.every(([k,v])=>x[k]===v));qa.calls.push({table,filters});return new Promise(r=>setTimeout(()=>r({data,error:fail?{message:'Fixture offline'}:null}),qa.delay)).then(resolve)},
async insert(payload){qa.writes.push({table,payload});qa.records.push({...payload,id:'qa-row',table});await new Promise(r=>setTimeout(r,150));return {error:null}},update(payload){update=payload;return q},async single(){qa.writes.push({table,payload:update});return {data:{id:'qa-row'},error:null}}};return q}};
const role=new URL(location.href).searchParams.get('role')||'diretoria';
document.querySelector('#app').innerHTML=performanceFrame();
mountPerformance({db,user:{id:'qa-actor',email:cipAuth.email},companies:['shopping_prohospital','distribuidora_prohospital'],role});
</script>`;
test('Performance browser: mobile, forms, stale context, errors and read-only access',async()=>{
 const server=createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  if(name==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
  if(!['/performance.css','/performance-ui.mjs','/performance-engine.mjs'].includes(name)){res.writeHead(404);res.end();return;}
  try{res.setHeader('Content-Type',name.endsWith('.css')?'text/css':'text/javascript');res.end(await readFile(new URL('..'+name,import.meta.url)));}catch{res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CIP_BROWSER_CHANNEL?{channel:process.env.CIP_BROWSER_CHANNEL}:{})});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port;
  await page.goto(url);await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  await page.locator('[data-perf-company]').selectOption('shopping_prohospital');
  await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  await page.locator('[data-perf-tab="indicadores"]').click();
  await page.locator('[name=baseline]').fill('100');await page.locator('[name=target]').fill('90');await page.locator('[name=actual]').fill('110');
  await page.locator('[name=evidence]').fill('Evidencia sintetica de teste');
  await page.getByRole('button',{name:'Registrar no CIP'}).click();
  await page.getByRole('status').filter({hasText:'meta precisa melhorar'}).waitFor();
  assert.equal(await page.evaluate(()=>qa.writes.length),0);
  await page.locator('[name=target]').fill('120');
  await page.getByRole('button',{name:'Registrar no CIP'}).dblclick();
  await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  assert.equal(await page.evaluate(()=>qa.writes.length),1,'double click must produce one write');
  await page.locator('[name=baseline]').fill('100');await page.locator('[name=target]').fill('120');await page.locator('[name=actual]').fill('112');await page.locator('[name=evidence]').fill('Evidencia sintetica atualizada');
  await page.getByRole('button',{name:'Registrar no CIP'}).click();await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  assert.equal(await page.evaluate(()=>qa.writes.length),2);
  assert.equal(await page.evaluate(()=>Object.hasOwn(qa.writes[1].payload,'company_id')),false,'update must respect immutable column grants');
  await page.evaluate(()=>{qa.delay=250;});
  await page.locator('[data-perf-company]').selectOption('distribuidora_prohospital');
  assert.equal(await page.locator('[data-perf-form]').count(),0,'old company form removed immediately');
  await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  await page.evaluate(()=>{qa.fail=true;});await page.locator('[data-perf-refresh]').click();
  await page.getByRole('status').filter({hasText:'Dados indisponíveis'}).waitFor();
  assert.equal(await page.locator('[data-perf-form]').count(),0);
  await page.evaluate(()=>{
   qa.fail=false;qa.delay=0;qa.telemetryFail=true;
   const month=document.querySelector('[data-perf-month]').value;
   const end=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10);
   qa.records=[{table:'cip_perf_financial_events',id:'gain',event_kind:'benefit',company_id:'shopping_prohospital',period_start:month+'-01',period_end:end,
    created_by:'qa-actor',source_key:'QA:BROWSER:GAIN',gross_value:100,incremental_cost:0,reversals:0,attribution_pct:100,cip_action_ref:'QA:ACTION:1',baseline_reference:'Baseline sintetica de teste',evidence:'Evidencia sintetica',description:'Beneficio sintetico de teste',benefit_type:'margem_incremental'},
    ...['controladoria','diretoria'].map((review_role,i)=>({table:'cip_perf_financial_approvals',event_id:'gain',company_id:'shopping_prohospital',review_role,reviewer_id:'reviewer-'+i,decision:'aprovado'}))];
  });
  await page.locator('[data-perf-company]').selectOption('shopping_prohospital');await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  await page.locator('[data-perf-tab="agentes"]').click();await page.getByText('Telemetria indisponível.',{exact:false}).waitFor();
  await page.locator('[data-perf-tab="beneficios"]').click();await page.getByText('Registrar estorno vinculado',{exact:true}).click();
  const reverse=page.locator('[data-perf-form="reversal"]');
  await reverse.locator('[name=source_key]').fill('QA:BROWSER:REVERSAL');await reverse.locator('[name=reversals]').fill('20');
  await reverse.locator('[name=description]').fill('Correcao sintetica de teste');await reverse.locator('[name=evidence]').fill('Evidencia de estorno sintetica');
  await reverse.getByRole('button',{name:'Submeter estorno'}).click();await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  assert.equal(await page.evaluate(()=>qa.writes.at(-1).payload.reverses_event_id),'gain');
  await page.getByText('em_revisao',{exact:true}).waitFor();
  await page.goto(url+'/?role=gestor');await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  await page.locator('[data-perf-company]').selectOption('shopping_prohospital');await page.getByRole('status').filter({hasText:'Registros carregados'}).waitFor();
  for(const tab of ['indicadores','processos','agentes','beneficios']){
   await page.locator('[data-perf-tab="'+tab+'"]').click();assert.equal(await page.locator('[data-perf-form]').count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page must fit viewport');
  }
  if(process.env.CIP_QA_ARTIFACTS){await mkdir(process.env.CIP_QA_ARTIFACTS,{recursive:true});await page.screenshot({path:process.env.CIP_QA_ARTIFACTS+'/performance-mobile.png',fullPage:true});}
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-perf-tab="visao"]').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(process.env.CIP_QA_ARTIFACTS)await page.screenshot({path:process.env.CIP_QA_ARTIFACTS+'/performance-desktop.png',fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
