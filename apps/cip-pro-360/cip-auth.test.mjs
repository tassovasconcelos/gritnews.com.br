import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Unit checks only. Real login and RLS still require browser homologation.
const original=fs.readFileSync(new URL('./cip-auth.js',import.meta.url),'utf8');
function client(values={},resetError=true){
 const elements=Object.fromEntries(Object.entries({stock:'6000000',sales:'3000000',cmv:'47',days:'90',email:'test@example.invalid',...values}).map(([id,value])=>[id,{value,textContent:''}]));
 elements.scenarioMessage={};elements.loginMessage={};elements.recoverAccess={};
 const writes=[],resets=[];
 const db={auth:{onAuthStateChange(){},resetPasswordForEmail:async(email,options)=>{resets.push({email,...options});return {error:resetError?(typeof resetError==='object'?resetError:{message:'rejected'}):null};}},from(table){return {insert:async value=>{writes.push({table,value});return {error:null};}};}};
 db.auth.signInWithPassword=async()=>({data:null,error:{code:'invalid_credentials'}});
 const submit={disabled:false};
 const timers=[];
 const context={supabase:db,setTimeout:(fn,ms)=>timers.push({fn,ms}),window:{addEventListener(){}},document:{getElementById:id=>elements[id],querySelector:()=>submit},location:{origin:'https://example.invalid',pathname:'/'},alert(){}};
 const code=original.slice(original.indexOf('const V=')).replace('await verify();','user={id:"test-user"};');
 vm.runInNewContext(code,context);
 return {window:context.window,elements,writes,resets,timers};
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
test('recovery uses the dedicated GRIT password update page',async()=>{
 const c=client({},false);await c.window.cipResetPassword();
 assert.equal(c.resets[0].redirectTo,'https://cip.gritnews.com.br/recuperar.html');
 assert.match(c.elements.loginMessage.textContent,/recuperação GRIT/);
});
test('invalid credentials are distinguished from authorization and entered password is cleared',async()=>{
 const c=client({password:'unit-test-only'});
 await c.window.cipLogin({preventDefault(){}});
 assert.match(c.elements.loginMessage.textContent,/E-mail ou senha não conferem/);
 assert.equal(c.elements.password.value,'');
 assert.equal(c.elements.password.type,'password');
});
test('recovery rate limit explains the wait and prevents duplicate sends until cooldown ends',async()=>{
 const c=client({},{status:429,code:'over_email_send_rate_limit'});
 await c.window.cipResetPassword();await c.window.cipResetPassword();
 assert.equal(c.resets.length,1);assert.match(c.elements.loginMessage.textContent,/60 segundos/);
 assert.doesNotMatch(c.elements.loginMessage.textContent,/administrador/);
 assert.equal(c.elements.recoverAccess.disabled,true);assert.equal(c.timers[0].ms,60000);
 c.timers[0].fn();assert.equal(c.elements.recoverAccess.disabled,false);
 await c.window.cipResetPassword();assert.equal(c.resets.length,2);
});
test('accepted recovery prevents simultaneous duplicate requests and unlocks after one minute',async()=>{
 const c=client({},false);
 await Promise.all([c.window.cipResetPassword(),c.window.cipResetPassword()]);
 assert.equal(c.resets.length,1);assert.match(c.elements.loginMessage.textContent,/aceita/);
 assert.equal(c.elements.recoverAccess.disabled,true);c.timers[0].fn();
 assert.equal(c.elements.recoverAccess.disabled,false);
});
