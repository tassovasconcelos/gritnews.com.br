import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validAccess,validEmail,roleCapabilities,ROLES} from './admin/access-model.mjs';
test('only defined roles and companies can be granted; superadmin is never an invite role',()=>{
 for(const role of Object.keys(ROLES))assert.equal(validAccess({role,companies:['shopping_prohospital']}),true);
 for(const input of [{role:'superadm',companies:['shopping_prohospital']},{role:'gestor',companies:[]},{role:'gestor',companies:['unknown']},{role:'gestor',companies:['shopping_prohospital','shopping_prohospital']}])assert.equal(validAccess(input),false);
 assert.equal(validEmail('person@example.org'),true);assert.equal(validEmail('person@example.org\nBcc: other@example.org'),false);
 assert.equal(roleCapabilities('diretoria').write,false);assert.equal(roleCapabilities('supervisor').write,false);assert.equal(roleCapabilities('gestor').review,true);
});
const activation=fs.readFileSync(new URL('./cip-activation.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
async function fixture({newAccount=false,failAccept=false}={}){
 const nodes={},calls=[],updates=[],signins=[],urls=[];const button={disabled:false};
 for(const id of ['activationAccount','activationScope','activationStatus','activationForm','passwordLabel','activationPassword','confirmationLabel','activationConfirm','activationHelp','activationReturn']){const classes=new Set(['activationForm','confirmationLabel','activationReturn'].includes(id)?['hidden']:[]);nodes[id]={value:'',textContent:'',firstChild:{textContent:''},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},addEventListener(_n,f){this.submit=f;},querySelector:()=>button};}
 const client={functions:{invoke:async(_n,{body})=>{calls.push(body);if(body.action==='preview_invite')return {data:{email:'invite@example.invalid',role:'gestor',companies:['shopping_prohospital']}};return failAccept?{error:{message:'rejected'}}:{data:{accepted:true}};}},auth:{verifyOtp:async()=>({data:{user:{email:'invite@example.invalid'}}}),updateUser:async obj=>{updates.push(obj);return {};},signInWithPassword:async obj=>{signins.push(obj);return {};},signOut:async()=>{}}};
 const hash='#invite=00000000-0000-0000-0000-000000000001&token='+'a'.repeat(64)+(newAccount?'&auth_token=opaque':'');
 await vm.runInNewContext(`(async()=>{${activation}})()`,{createClient:()=>client,URLSearchParams,location:{hash,pathname:'/ativar.html'},history:{replaceState:(_a,_b,u)=>urls.push(u)},document:{getElementById:id=>nodes[id]}});
 return {nodes,calls,updates,signins,urls,submit:()=>nodes.activationForm.submit({preventDefault(){},currentTarget:nodes.activationForm})};
}
test('existing accounts use their current password and activation never resets it',async()=>{
 const f=await fixture();f.nodes.activationPassword.value='existing-test-password';await f.submit();assert.equal(f.signins.length,1);assert.equal(f.updates.length,0);assert.equal(f.calls.filter(c=>c.action==='accept_invite').length,1);assert.equal(f.nodes.activationPassword.value,'');assert.deepEqual(f.urls,['/ativar.html']);
});
test('new accounts require matching strong password before accepting scope',async()=>{
 const f=await fixture({newAccount:true});f.nodes.activationPassword.value='new-test-password';f.nodes.activationConfirm.value='other';await f.submit();assert.equal(f.updates.length,0);
 f.nodes.activationConfirm.value='new-test-password';await f.submit();assert.equal(f.updates.length,1);assert.equal(f.calls.filter(c=>c.action==='accept_invite').length,1);assert.match(f.nodes.activationStatus.textContent,/Acesso ativado/);
});
test('rejected activation does not claim success and always clears passwords',async()=>{
 const f=await fixture({failAccept:true});f.nodes.activationPassword.value='existing-test-password';await f.submit();assert.match(f.nodes.activationStatus.textContent,/não concluída/);assert.equal(f.nodes.activationPassword.value,'');assert.equal(f.nodes.activationReturn.classList.contains('hidden'),true);
});
