import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./grit-recovery.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
async function fixture(hash='#type=recovery',reject=false){
 const elements={},updates=[],signouts=[],urls=[];
 for(const id of ['message','recoveryForm','newPassword','confirmPassword','savePassword','returnLink']){
  const classes=new Set(id==='recoveryForm'||id==='returnLink'?['hidden']:[]);
  elements[id]={value:'',textContent:'',classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},addEventListener(_name,handler){this.submit=handler;}};
 }
 const client={auth:{getSession:async()=>({}),getUser:async()=>({data:{user:{id:'unit-user'}}}),updateUser:async input=>{updates.push(input);return {error:reject?{message:'rejected'}:null};},signOut:async input=>signouts.push(input)}};
 await vm.runInNewContext(`(async()=>{${source}\n})()`,{createClient:()=>client,URLSearchParams,location:{hash,pathname:'/recuperar.html'},history:{replaceState:(_a,_b,url)=>urls.push(url)},document:{getElementById:id=>elements[id]}});
 return {elements,updates,signouts,urls,submit:()=>elements.recoveryForm.submit({preventDefault(){}})};
}
test('opening recovery page without a recovery link does not expose a password form',async()=>{
 const f=await fixture('');assert.equal(f.elements.recoveryForm.classList.contains('hidden'),true);assert.match(f.elements.message.textContent,/inválido/);assert.deepEqual(f.urls,['/recuperar.html']);
});
test('valid recovery updates only the authenticated account and clears entered passwords',async()=>{
 const f=await fixture();assert.equal(f.elements.recoveryForm.classList.contains('hidden'),false);
 f.elements.newPassword.value=f.elements.confirmPassword.value='unit-test-password-2026';await f.submit();
 assert.equal(f.updates.length,1);assert.equal(f.elements.newPassword.value,'');assert.equal(f.elements.confirmPassword.value,'');assert.equal(f.signouts[0].scope,'local');assert.match(f.elements.message.textContent,/atualizada/);assert.equal(f.elements.returnLink.classList.contains('hidden'),false);
});
test('mismatched confirmation never submits a password update',async()=>{
 const f=await fixture();f.elements.newPassword.value='unit-test-password-2026';f.elements.confirmPassword.value='different';await f.submit();assert.equal(f.updates.length,0);
});
test('rejected update does not claim success or reveal entered passwords',async()=>{
 const f=await fixture('#type=recovery',true);f.elements.newPassword.value=f.elements.confirmPassword.value='unit-test-password-2026';await f.submit();assert.match(f.elements.message.textContent,/Não foi possível/);assert.equal(f.elements.newPassword.value,'');assert.equal(f.signouts.length,0);
});
