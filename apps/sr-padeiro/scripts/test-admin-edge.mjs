import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function handler(slug,{environment='homologation',admin=true,pendingPassword=false,folder='sr-padeiro',policy=null,policyError=false,paid=false}={}){
 let serve,providerCalls=0,invites=0;const links=[];
 const fake={auth:{getUser:async()=>({data:{user:{id:'actor',email:'actor@example.invalid',app_metadata:{ops_password_required:pendingPassword}}}}),admin:{inviteUserByEmail:async()=>{invites++;return {data:{user:{id:'new-user'}}}}}},from(table){const q={select(){return q},eq(){return q},gte(){return q},order(){return q},limit(){return q},async maybeSingle(){if(table==='srp_commercial_settings')return {data:policy,error:policyError?{message:'unavailable'}:undefined};return {data:table==='admin_users'?{active:admin,role:admin?'superadmin':'viewer'}:table==='srp_members'?{active:true,role:'owner'}:table==='srp_organizations'?{id:'org',name:'QA',environment,activation_paid_at:paid?'2026-10-01T00:00:00Z':null}:null}}};return q},async rpc(name,args){if(name==='platform_secret_get')return {data:args.secret_name.endsWith('MODE')?'production':args.secret_name==='ASAAS_PIX_ENABLED'?'false':'test-placeholder'};if(args.p_action==='find_identity')return {data:{user_id:'existing-user'}};links.push(args);return {data:{ok:true}}}};
 const source=fs.readFileSync(new URL(`../../${folder}/supabase/functions/${slug}/index.ts`,import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const deno={env:{get:n=>n==='SUPABASE_URL'?'https://example.invalid':n.endsWith('MODE')?'production':'test-placeholder'},serve:fn=>{serve=fn}};
 new Function('require','Deno','fetch','console','exports',js)(name=>name.includes('supabase-js')?{createClient:()=>fake}:{},deno,async()=>{providerCalls++;return new Response('{"error":"test provider"}',{status:502})},{error(){}},{});
 return {serve,stats:()=>({providerCalls,invites,links})};
}
for(const slug of ['create-srp-activation-checkout','create-srp-subscription','create-asaas-checkout'])test(`${slug}: homologação bloqueia antes de qualquer chamada ao provedor`,async()=>{
 const h=handler(slug);const res=await h.serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({organization_id:'org',kind:'activation'})}));assert.equal(res.status,409);assert.equal((await res.json()).error,'billing_disabled_in_homologation');assert.equal(h.stats().providerCalls,0);
});
test('convite rejeita usuário sem permissão sem enviar e-mail',async()=>{
 const h=handler('srp-admin-invite',{admin:false});const res=await h.serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:'{}'}));assert.equal(res.status,403);assert.equal(h.stats().invites,0);assert.equal(h.stats().links.length,0);
});
test('convite vincula conta existente sem reenviar e-mail ou inventar identidades',async()=>{
 const h=handler('srp-admin-invite');const res=await h.serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({organization_id:'11111111-1111-4111-8111-111111111111',email:'team@example.invalid',role:'manager',operator_names:['Equipe QA']})}));assert.equal(res.status,200);assert.equal((await res.json()).invited,false);assert.equal(h.stats().invites,0);assert.equal(h.stats().links[0].p_payload.role,'manager');assert.deepEqual(h.stats().links[0].p_payload.operator_names,['Equipe QA']);
});

for(const [folder,slug] of [['sr-padeiro','create-srp-activation-checkout'],['sr-padeiro','create-srp-subscription'],['sr-padeiro','create-asaas-checkout'],['meu-espetinho','create-activation-checkout'],['meu-espetinho','create-subscription'],['meu-espetinho','cancel-subscription']])test(`${slug}: senha temporária bloqueia operação antes do provedor`,async()=>{
 const h=handler(slug,{folder,environment:'production',pendingPassword:true});const res=await h.serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:'{}'}));assert.equal(res.status,403);assert.equal((await res.json()).error,'password_change_required');assert.equal(h.stats().providerCalls,0);
});
for(const slug of ['create-srp-activation-checkout','create-srp-subscription','create-asaas-checkout']){
 test(slug+': método desabilitado não chama o provedor em produção',async()=>{const h=handler(slug,{environment:'production',policy:{allowed_providers:[]}});const r=await h.serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({organization_id:'org',kind:'activation'})}));assert.equal(r.status,409);assert.equal((await r.json()).error,'provider_disabled');assert.equal(h.stats().providerCalls,0);});
 test(slug+': falha na política de cobrança bloqueia antes do provedor',async()=>{const h=handler(slug,{environment:'production',policyError:true});const r=await h.serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({organization_id:'org',kind:'activation'})}));assert.equal(r.status,503);assert.equal(h.stats().providerCalls,0);});}

for(const slug of ['create-srp-activation-checkout','create-srp-subscription','create-asaas-checkout'])test(slug+': provedor permitido alcança somente a API simulada',async()=>{const subscription=slug==='create-srp-subscription';const h=handler(slug,{environment:'production',policy:{allowed_providers:['asaas','mercadopago']},paid:subscription});const r=await h.serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({organization_id:'org',kind:'activation'})}));assert.equal(r.status,502);assert.equal(h.stats().providerCalls,1);});
