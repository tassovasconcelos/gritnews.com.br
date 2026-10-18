import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Unit checks only. Real login and RLS still require browser homologation.
const original=fs.readFileSync(new URL('./cip-auth.js',import.meta.url),'utf8');
function client(values={},resetError=true){
 const elements=Object.fromEntries(Object.entries({stock:'6000000',sales:'3000000',cmv:'47',days:'90',email:'test@example.invalid',...values}).map(([id,value])=>[id,{value,textContent:''}]));
 elements.scenarioMessage={};elements.loginMessage={};
 const writes=[],resets=[];
 const db={auth:{onAuthStateChange(){},resetPasswordForEmail:async(email,options)=>{resets.push({email,...options});return {error:resetError?{message:'rejected'}:null};}},from(table){return {insert:async value=>{writes.push({table,value});return {error:null};}};}};
 const context={supabase:db,window:{addEventListener(){}},document:{getElementById:id=>elements[id]},location:{origin:'https://example.invalid',pathname:'/'},alert(){}};
 const code=original.slice(original.indexOf('const V=')).replace('await verify();','user={id:"test-user"};');
 vm.runInNewContext(code,context);
 return {window:context.window,elements,writes,resets};
}
test('scenario rejects invalid bounds and blank fields before any database write',async()=>{
 for(const values of [{stock:'-1'},{stock:'1e14'},{sales:'Infinity'},{sales:''},{cmv:'101'},{cmv:'-0.1'},{days:'0'},{days:'366'},{days:'1.5'}]){
  const c=client(values);await c.window.cipSaveScenario();assert.equal(c.writes.length,0,JSON.stringify(values));assert.match(c.elements.scenarioMessage.textContent,/valores válidos/);
 }
});
test('valid stock baseline is persisted with the Shopping company and exact values',async()=>{
 const c=client();await c.window.cipSaveScenario();assert.equal(c.writes.length,1);
 assert.equal(c.writes[0].table,'cip_scenarios');assert.equal(c.writes[0].value.company_id,'shopping_prohospital');
 assert.equal(c.writes[0].value.stock_value,6000000);assert.equal(c.writes[0].value.cmv_pct,47);assert.equal(c.writes[0].value.target_days,90);
});
test('returned password recovery error does not show success',async()=>{
 const c=client();await c.window.cipResetPassword();assert.match(c.elements.loginMessage.textContent,/indisponível/);
});
test('recovery uses the allowlisted GRIT password update page',async()=>{
 const c=client({},false);await c.window.cipResetPassword();
 assert.equal(c.resets[0].redirectTo,'https://gritnews.com.br/?view=admin&recovery=1');
 assert.match(c.elements.loginMessage.textContent,/recuperação GRIT/);
});
