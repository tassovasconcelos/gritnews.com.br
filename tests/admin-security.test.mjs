import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadAuth(base, record) {
  const stores = ['localStorage', 'sessionStorage'].map(() => {
    const map = new Map([['grit_admin_password','legacy'],['grit_admin_user_role','SUPERADMIN'],['sb-project-auth-token','legacy'],['sb-project-auth-token-code-verifier','legacy'],['editorial-bookmarks','keep']]);
    return { get length(){return map.size}, key(i){return [...map.keys()][i]}, removeItem(k){map.delete(k)}, getItem(k){return map.get(k)} };
  });
  let signedOut = false, options;
  const fake = {from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:record,error:null}}}}, auth:{async signInWithPassword(){return {data:{user:{id:'own-user',email:'test@example.invalid',user_metadata:{role:'superadmin'}}},error:null}},async signOut(){signedOut=true},async resetPasswordForEmail(){return {error:{message:'account absent'}}}}};
  let source=fs.readFileSync(`${base}/lib/adminAuth.ts`,'utf8').replace(/import\s+.*?;\r?\n/g,'').replace('(import.meta as any).env',"({VITE_SUPABASE_PUBLISHABLE_KEY:'public-test-key'})");
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const context={exports:{},createClient(_url,_key,opts){options=opts;return fake},window:{localStorage:stores[0],sessionStorage:stores[1]},console};
  vm.runInNewContext(js,context);
  return {auth:context.exports,stores,get signedOut(){return signedOut},options};
}
for(const base of ['src','apps/gritnews/src']) {
 test(`${base}: removes legacy credentials from both stores and preserves editorial data`,()=>{
   const {stores,options}=loadAuth(base,null);
   for(const store of stores){assert.equal(store.length,1);assert.equal(store.getItem('editorial-bookmarks'),'keep')}
   assert.equal(options.auth.persistSession,false);
 });
 test(`${base}: editable user metadata cannot grant administrative access`,async()=>{
   const setup=loadAuth(base,null);
   await assert.rejects(setup.auth.adminSignIn('test@example.invalid','test-password'),/E-mail ou senha inválidos/);
   assert.equal(setup.signedOut,true);
 });
 test(`${base}: permissions come from active server record`,async()=>{
   const setup=loadAuth(base,{role:'operator',active:true});
   assert.equal((await setup.auth.adminSignIn('test@example.invalid','test-password')).role,'EDITOR');
 });
 test(`${base}: inactive record and unknown role fail closed`,async()=>{
   for(const record of [{role:'superadmin',active:false},{role:'invented',active:true}]){
     await assert.rejects(loadAuth(base,record).auth.adminSignIn('test@example.invalid','test-password'));
   }
 });
 test(`${base}: recovery does not disclose account existence`,async()=>{
   await loadAuth(base,null).auth.requestAdminPasswordReset('test@example.invalid');
 });
}

