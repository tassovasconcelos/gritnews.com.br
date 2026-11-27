import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OFFICE_PEOPLE,officePeople,movementWaypoints,officeModeLabel} from './tower-live-office.mjs';
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
