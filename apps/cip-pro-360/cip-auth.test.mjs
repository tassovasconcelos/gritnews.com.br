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
 const timers=[],intervals=[],listeners={};
 const context={supabase:db,setInterval:(fn,ms)=>intervals.push({fn,ms}),setTimeout:(fn,ms)=>timers.push({fn,ms}),window:{addEventListener(){}},document:{getElementById:id=>elements[id],querySelector:selector=>selector.includes("loginForm")?submit:null,querySelectorAll:()=>[],addEventListener:(name,handler)=>{listeners[name]=handler;}},location:{origin:'https://example.invalid',pathname:'/'},alert(){}};
 const code=original.slice(original.indexOf('const V=')).replace('await verify();','user={id:"test-user"};');
 vm.runInNewContext(code,context);
 return {window:context.window,elements,writes,resets,timers,db,intervals,listeners,context,run:code=>vm.runInNewContext(code,context)};
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

test('password reveal is absent from the login markup and application API',()=>{
 const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/togglePassword|cipTogglePassword|Mostrar senha/);
 assert.doesNotMatch(original,/cipTogglePassword|togglePassword|field\.type=.*text/);
 assert.match(html,/id="password" type="password"/);
 assert.equal(client().window.cipTogglePassword,undefined);
});
test('credentials use isolated tab storage and do not accept authentication from URLs',()=>{
 assert.match(original,/storage:authStorage,storageKey:"cip-auth-session-v2"/);
 assert.match(original,/detectSessionInUrl:false/);
 assert.match(original,/localStorage\?\.removeItem\('sb-pcrwtoddavpvkaxwtstc-auth-token'\)/);
 assert.doesNotMatch(original,/localStorage\??\.setItem/);
});
test('duplicate login submissions perform a single authentication request',async()=>{
 const c=client({password:'unit-test-only'});let calls=0,release;
 c.db.auth.signInWithPassword=()=>{calls++;return new Promise(resolve=>release=resolve);};
 const a=c.window.cipLogin({preventDefault(){}});await c.window.cipLogin({preventDefault(){}});
 assert.equal(calls,1);release({error:{code:'invalid_credentials'}});await a;
});
test('logout hides and clears content immediately even if server revocation fails',async()=>{
 const c=client();let cleared=false,hidden=false;
 c.elements.interface={classList:{add(){hidden=true;}}};c.elements.content={replaceChildren(){cleared=true;}};
 c.elements.login={classList:{remove(){}}};c.db.auth.signOut=async()=>{throw Error('offline');};
 await c.window.cipSignOut();assert.equal(cleared,true);assert.equal(hidden,true);assert.equal(c.window.cipAuth,null);
 assert.match(c.elements.loginMessage.textContent,/revogação no servidor não foi confirmada/);
});
test('logout during pending profile lookup cannot reopen the authenticated interface',async()=>{
 const c=client();let resolveProfile,opened=0;
 c.db.from=()=>({select(){return this;},eq(){return this;},maybeSingle(){return new Promise(resolve=>resolveProfile=resolve);}});
 c.db.auth.signOut=async()=>({error:null});c.window.showPreview=()=>opened++;
 const entering=c.run('enter()');await c.window.cipSignOut();resolveProfile({data:{active:true,role:'superadm'}});await entering;
 assert.equal(opened,0);assert.equal(c.window.cipAuth,null);
});
test('idle session is locked and trusted activity cannot extend an expired session',async()=>{
 const c=client();c.db.auth.signOut=async()=>({error:null});
 c.run('lastActivity=Date.now()-IDLE_MS-1;sessionStarted=Date.now();');
 await c.run('checkAccess()');assert.equal(c.window.cipAuth,null);assert.match(c.elements.loginMessage.textContent,/inatividade/);
 assert.equal(c.intervals[0].ms,30000);
});
test('browser-generated activity updates clock but synthetic events do not',()=>{
 const c=client();c.run('lastActivity=Date.now()-10000;sessionStarted=Date.now();');
 const before=c.run('lastActivity');c.listeners.keydown({isTrusted:false});assert.equal(c.run('lastActivity'),before);
 c.listeners.keydown({isTrusted:true});assert.ok(c.run('lastActivity')>before);
});

function authorizedClient(){
 const c=client({password:'unit-test-only'}),storage=new Map();
 c.context.sessionStorage={getItem:key=>storage.get(key)??null,setItem:(key,v)=>storage.set(key,v),removeItem:key=>storage.delete(key)};
 c.context.initNavigation=()=> 'inicio';c.window.showPreview=()=>{};c.window.navigate=()=>{};
 c.db.auth.signInWithPassword=async()=>({data:{user:{id:'test-user',email:'test@example.invalid'}}});
 c.db.auth.getUser=async()=>({data:{user:{id:'test-user'}}});c.db.auth.signOut=async()=>({error:null});
 c.db.from=()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{role:'superadm',active:true}})});
 return {...c,storage};
}
test('an explicit password login starts a fresh clock after an expired prior session',async()=>{
 const c=authorizedClient();c.storage.set('cip-session-clock-v2',JSON.stringify({user:'test-user',lastActivity:1,sessionStarted:1}));
 await c.window.cipLogin({preventDefault(){}});assert.equal(c.window.cipAuth.role,'superadm');
 const clock=JSON.parse(c.storage.get('cip-session-clock-v2'));assert.ok(clock.lastActivity>Date.now()-1000);
});
test('reload restores the original inactivity deadline instead of extending it',async()=>{
 const c=authorizedClient();c.storage.set('cip-session-clock-v2',JSON.stringify({user:'test-user',lastActivity:Date.now()-31*60000,sessionStarted:Date.now()-60*60000}));
 await c.run('enter()');assert.equal(c.window.cipAuth,null);assert.match(c.elements.loginMessage.textContent,/inatividade/);
});
test('role suspension detected during revalidation locks the interface',async()=>{
 const c=authorizedClient();await c.window.cipLogin({preventDefault(){}});
 c.db.from=()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{role:'superadm',active:false}})});
 c.run('lastAccessCheck=0;');await c.run('checkAccess()');assert.equal(c.window.cipAuth,null);
 assert.match(c.elements.loginMessage.textContent,/permissões/);
});
test('inactivity locks immediately even while another access check is pending',async()=>{
 const c=authorizedClient();await c.window.cipLogin({preventDefault(){}});
 c.run('checkingAccess=true;lastActivity=Date.now()-IDLE_MS-1;');await c.run('checkAccess()');
 assert.equal(c.window.cipAuth,null);assert.match(c.elements.loginMessage.textContent,/inatividade/);
});
test('logout retains credentials until server revocation has been attempted, then clears them',async()=>{
 const c=authorizedClient();let removed=false,release;
 c.context.authStorage={removeItem(){removed=true;}};
 c.db.auth.signOut=()=>new Promise(resolve=>{assert.equal(removed,false);release=resolve;});
 const logout=c.window.cipSignOut();assert.equal(removed,false);release({error:null});await logout;assert.equal(removed,true);
});
test('maximum session duration locks even with recent activity',async()=>{
 const c=authorizedClient();await c.window.cipLogin({preventDefault(){}});
 c.run('lastActivity=Date.now();sessionStarted=Date.now()-MAX_SESSION_MS-1;');await c.run('checkAccess()');
 assert.equal(c.window.cipAuth,null);assert.match(c.elements.loginMessage.textContent,/tempo de uso/);
});

test('tab credential adapter never writes credentials to localStorage even when session storage fails',()=>{
 const prefix=original.slice(original.indexOf('// CIP credentials'),original.indexOf('const V='));
 let options,legacyCleared=false;
 const context={createClient:(_url,_key,config)=>{options=config;return {};},localStorage:{removeItem(){legacyCleared=true;},setItem(){throw Error('must never persist');}},sessionStorage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}}};
 vm.runInNewContext(prefix,context);assert.equal(legacyCleared,true);
 const storage=options.auth.storage;assert.equal(storage.getItem('unit'),null);storage.setItem('unit','test-token');assert.equal(storage.getItem('unit'),'test-token');
 storage.removeItem('unit');assert.equal(storage.getItem('unit'),null);assert.equal(options.auth.detectSessionInUrl,false);
});
