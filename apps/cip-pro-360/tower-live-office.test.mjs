import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OFFICE_PEOPLE,officePeople,movementWaypoints,officeModeLabel,officeGroups,portrait,workstation,PANORAMA_STATIONS,PHOTO_MOTION_REGIONS,motionOffset} from './tower-live-office.mjs';
import {TOWER_AGENTS,OFFICE_SCENARIO} from './tower-engine.mjs';

test('all twelve specialist desks have a consistent professional operator and coordinate',()=>{
 const people=officePeople(TOWER_AGENTS);
 assert.equal(people.length,12);
 assert.equal(new Set(people.map(p=>p.id)).size,12);
 for(const person of people){
  assert.ok(person.appearance.length===3);
  assert.ok(person.x>0&&person.x<100&&person.y>0&&person.y<100);
  assert.ok(person.route);
  assert.ok(OFFICE_PEOPLE[person.id]);
 }
});
test('legacy movement geometry preserves distinct agent positions',()=>{
 for(const scene of OFFICE_SCENARIO){
  const a=TOWER_AGENTS.find(p=>p.id===scene.from),b=TOWER_AGENTS.find(p=>p.id===scene.to);
  assert.ok(a&&b&&a.id!==b.id);
  const path=movementWaypoints(a,b);
  assert.equal(path.length,7);
  assert.deepEqual(path[0],{x:a.x,y:a.y,offset:0});
  assert.deepEqual(path[path.length-1],{x:a.x,y:a.y,offset:1});
  assert.ok(path.some(p=>p.x===b.x&&p.y===b.y));
  assert.ok(path.every(p=>p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100));
  assert.ok(path.every((p,i)=>!i||p.offset>=path[i-1].offset));
 }
});
test('no fake event should ever be presented as confirmed business automation',()=>{
 assert.match(officeModeLabel('demo'),/ILUSTRATIVA/);
 assert.match(officeModeLabel('demo'),/não executa ações/);
 assert.match(officeModeLabel('ambient'),/evidência/);
 assert.match(officeModeLabel('event','Central de Ações'),/REGISTRO REAL/);
 assert.match(officeModeLabel('event','Central de Ações'),/movimento representativo/);
 assert.deepEqual(movementWaypoints(TOWER_AGENTS[0],TOWER_AGENTS[0]),[]);
});

test('executive studio has three balanced groups and no duplicated specialists',()=>{
 const groups=officeGroups(TOWER_AGENTS);
 assert.equal(groups.length,3);
 assert.deepEqual(groups.map(g=>g.people.length),[4,4,4]);
 const ids=groups.flatMap(g=>g.people.map(p=>p.id));
 assert.equal(new Set(ids).size,12);
 assert.deepEqual([...ids].sort(),TOWER_AGENTS.map(p=>p.id).sort());
});
test('every portrait is local, decorative and does not make a network request',()=>{
 for(const p of officePeople(TOWER_AGENTS)){
  const svg=portrait(p);
  assert.match(svg,/^<svg class="ct-portrait"/);
  assert.match(svg,/aria-hidden="true"/);
  assert.match(svg,/<\/svg>$/);
  assert.doesNotMatch(svg,/https?:|<script|<image|undefined/);
 }
});

test('each specialist has a local architectural workstation with person, desk and monitor',()=>{
 for(const p of officePeople(TOWER_AGENTS)){
  const art=workstation(p);
  assert.match(art,/^<svg class="ct-workstation-art" viewBox="0 0 300 166"/);
  assert.match(art,/class="ct-office-human"/);
  assert.match(art,/class="ct-office-monitor"/);
  assert.match(art,/aria-hidden="true"/);
  assert.doesNotMatch(art,/https?:|<script|<image|undefined/);
  assert.equal((art.match(/<svg\b/g)||[]).length,2);
  assert.equal((art.match(/<\/svg>/g)||[]).length,2);
 }
});

import {readFileSync} from 'node:fs';
import {towerFrame} from './tower-ui.mjs';

test('approved panorama has nine nonoverlapping station targets and three extra specialists',()=>{
 const known=new Set(TOWER_AGENTS.map(a=>a.id));
 const stations=Object.entries(PANORAMA_STATIONS);
 assert.equal(stations.length,9);
 for(const [id,{x,y,w}] of stations){
  assert.ok(known.has(id));
  assert.ok(x-w/2>=0&&x+w/2<=100&&y>5&&y<95);
 }
 for(let i=0;i<stations.length;i++)for(let j=i+1;j<stations.length;j++){
  const [,a]=stations[i], [,b]=stations[j];
  assert.ok(Math.abs(a.y-b.y)>=9.1||Math.abs(a.x-b.x)>=(a.w+b.w)/2,stations[i][0]+' overlaps '+stations[j][0]);
 }
 assert.deepEqual([...known].filter(id=>!PANORAMA_STATIONS[id]).sort(),['caderninho','doquita','estoque']);
});
test('office panorama is local and the exact approved raster is embedded',()=>{
 const svg=readFileSync(new URL('./command-room.svg',import.meta.url),'utf8');
 const b64=svg.match(/base64,([A-Za-z0-9+/=]+)"/)?.[1];
 assert.ok(b64);
 const bytes=Buffer.from(b64,'base64');
 assert.equal(bytes.length,100086);
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.doesNotMatch(svg,/<script|<foreignObject/i);
});
test('default office and shared KPIs are visible, specialist details and pricing start collapsed',()=>{
 const html=towerFrame();
 assert.match(html,/<section data-ct-pane="agents" class="ct-view-pane">/);
 assert.match(html,/<section data-ct-shared class="ct-view-pane">/);
 assert.match(html,/<section data-ct-drawer class="ct-agent-drawer" hidden>/);
 assert.match(html,/<section data-ct-pane="pricing" class="ct-view-pane" hidden>/);
 assert.equal((html.match(/data-ct-metrics/g)||[]).length,1);
 assert.equal((html.match(/class="ct-agent-hotspot"/g)||[]).length,12);
 assert.doesNotMatch(html,/28,6%|352\.107|125\.289/);
});

test('photographic motion stays in approved panorama and does not cover station controls',()=>{
 assert.equal(PHOTO_MOTION_REGIONS.length,14);
 const ids=new Set(TOWER_AGENTS.map(a=>a.id));
 for(const r of PHOTO_MOTION_REGIONS){
  assert.ok(ids.has(r.id));
  assert.ok(['head','hands'].includes(r.kind));
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=1221&&r.y+r.h<=542);
  for(const station of Object.values(PANORAMA_STATIONS)){
   const x=(station.x-station.w/2)*12.21,y=(station.y-4.55)*5.42,w=station.w*12.21,h=9.1*5.42;
   assert.ok(r.x+r.w<=x||r.x>=x+w||r.y+r.h<=y||r.y>=y+h, r.id+' intersects station');
  }
 }
});
test('micro-motion is bounded, ambient is subtle, and motion can be disabled',()=>{
 for(const r of PHOTO_MOTION_REGIONS)for(let t=0;t<40;t+=.1){
  const active=motionOffset(r,t,[r.id],true),ambient=motionOffset(r,t,[],true),off=motionOffset(r,t,[],false);
  assert.ok(Math.abs(active.dx)<=2.301&&Math.abs(active.dy)<=1.251);
  assert.ok(Math.abs(ambient.dx)<=1&&Math.abs(ambient.dy)<=.526);
  assert.equal(Math.abs(off.dx),0);assert.equal(Math.abs(off.dy),0);
 }
});
test('guided collaboration is opt-in and keeps the original station and data panels',()=>{
 const html=towerFrame();
 assert.match(html,/Iniciar visita guiada/);
 assert.match(html,/seis cenas ilustrativas/);
 assert.match(html,/data-ct-sim-step hidden/);
 assert.equal((html.match(/class="ct-agent-hotspot"/g)||[]).length,12);
 assert.equal((html.match(/data-ct-metrics/g)||[]).length,1);
});
