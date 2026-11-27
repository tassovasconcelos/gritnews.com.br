import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OFFICE_PEOPLE,officePeople,movementWaypoints,officeModeLabel,officeGroups,portrait,workstation} from './tower-live-office.mjs';
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
test('every collaboration walks a named person to a distinct desk then returns',()=>{
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
