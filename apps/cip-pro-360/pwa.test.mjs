import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {gzipSync} from 'node:zlib';

const read=name=>fs.readFileSync(new URL(name,import.meta.url));
const manifest=JSON.parse(read('./manifest.webmanifest'));
const html=read('./index.html').toString('utf8');
const sw=read('./sw.js').toString('utf8');
const auth=read('./cip-auth.js').toString('utf8');

test('PWA manifest is installable and uses square Android icons',()=>{
 assert.equal(manifest.name,'CIP 360° — Centro de Inteligência Prohospital');
 assert.equal(manifest.short_name,'CIP 360');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.lang,'pt-BR');
 assert.equal(manifest.scope,'./');
 assert.deepEqual(manifest.icons.map(icon=>icon.sizes),['192x192','512x512']);
 for(const icon of manifest.icons){
  const bytes=read(icon.src.slice(2));
  assert.equal(bytes.readUInt32BE(0),0x89504e47);
  assert.equal(bytes.readUInt32BE(16),Number.parseInt(icon.sizes,10));
 }
 assert.match(html,/rel="apple-touch-icon" href="\.\/icon-192\.png"/);
});

test('mobile navigation exposes at most five destinations and routes are permission filtered',()=>{
 const section=html.match(/<nav id="bottomNav"[\s\S]*?<\/nav>/)?.[0]||'';
 assert.ok(section);
 assert.equal((section.match(/<button\b/g)||[]).length,5);
 for(const route of ['inicio','estoque','precos','b2b'])assert.ok(section.includes(`data-bottom-route="${route}"`));
 assert.ok(section.includes('data-bottom-more'));
 assert.ok(auth.includes('allowedRoutes.includes(b.dataset.route)'));
 assert.ok(html.includes('dataset.bottomRoute===page'));
});

test('offline caching is limited to the explicit static app shell',()=>{
 assert.match(sw,/request\.method!=='GET'\|\|url\.origin!==self\.location\.origin/);
 assert.match(sw,/request\.mode==='navigate'/);
 assert.match(sw,/cache\.match\(new URL\('\.\/index\.html',self\.location\)\)/);
 assert.match(sw,/if\(!shellPaths\.has\(url\.pathname\)\)return/);
 assert.doesNotMatch(sw,/b2g-snapshot|b2g-catalog|supabase\.co|stock_intelligence_rows|localStorage|indexedDB/i);
 assert.ok(sw.includes("'./cip-auth.js'"));
 assert.ok(sw.includes("'./pricing-engine.mjs'"));
 assert.ok(sw.includes("'./campaign-planner-engine.mjs'"));
 assert.ok(sw.includes("'./campaign-planner.css'"));
 assert.ok(sw.includes("'./stock-actions-ui.mjs'"));
 const shellAssets=[...sw.matchAll(/'(\.\/[^']+)'/g)].map(match=>match[1]).filter(path=>path!=='./');
 for(const asset of new Set(shellAssets))assert.ok(fs.existsSync(new URL(asset,import.meta.url)),`Missing app-shell file ${asset}`);
 const budget=[...new Set(shellAssets)].filter(asset=>asset!=='./supabase-js-2.57.0.mjs').reduce((total,asset)=>total+gzipSync(fs.readFileSync(new URL(asset,import.meta.url))).length,0);
 assert.ok(budget<250_000,`Compressed app shell excluding Supabase is ${budget} bytes`);
 assert.match(read('./.htaccess').toString('utf8'),/AddOutputFilterByType DEFLATE/);
});

test('install help and connection notice are available without persisting business data',()=>{
 assert.match(html,/beforeinstallprompt/);
 assert.match(html,/apple-touch-icon/);
 assert.match(html,/Compartilhar no Safari/);
 assert.match(html,/Sem conexão desde/);
 assert.match(html,/somente a tela que já estava aberta/);
 assert.match(html,/navigator\.serviceWorker\.register\('\.\/sw\.js'/);
});
