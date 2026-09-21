import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFirstOwnerConfig, getFirstOwnerStatus, performFirstOwnerAction
} from '../scripts/first-owner.mjs';

const USER='11111111-1111-4111-8111-111111111111';
const ORG='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EMAIL='approved@example.invalid';

function env(mode='status') {
  return {
    PROSPECT_SUPABASE_URL:'https://qspluchjhnnzgbbgmsro.supabase.co',
    PROSPECT_SUPABASE_SERVICE_ROLE_KEY:'simulated-test-value-never-a-real-key',
    PROSPECT_FIRST_ADMIN_EMAIL:EMAIL,
    PROSPECT_FIRST_ADMIN_APPROVED_EMAIL:EMAIL,
    ...(mode==='invite' ? {
      PROSPECT_INVITE_REDIRECT_URL:'https://prospect.gritnews.com.br/',
      PROSPECT_INVITE_REDIRECT_VERIFIED:'yes',PROSPECT_AUTH_SMTP_VERIFIED:'yes'
    } : {}),
    ...(mode==='activate' ? { PROSPECT_OWNER_ACTIVATION_APPROVED:'yes' } : {})
  };
}
function fakeSystem({ users=[], org=null, membership=null }={}) {
  const calls=[];
  const adminClient={
    async listUsers(){return {data:{users},error:null}},
    async inviteUserByEmail(email, options){
      calls.push({action:'invite',email,options});
      return {data:{user:{id:USER}},error:null};
    }
  };
  const db={
    from(name){
      const w={};
      return {
        select(){return this},
        eq(key,value){w[key]=value;return this},
        async maybeSingle(){
          if(name==='organizations') return {data:org,error:null};
          if(name==='memberships'){
            return {data:w.user_id===USER&&w.organization_id===ORG?membership:null,error:null};
          }
          throw Error('unexpected_table');
        }
      };
    },
    async rpc(name, params) {
      calls.push({action:'rpc',name,params});
      return {data:{status:'activated',organization_id:ORG},error:null};
    }
  };
  return {adminClient,db,calls};
}

test('first owner: refuses other Supabase projects or missing approver',()=>{
  const bad=env();bad.PROSPECT_SUPABASE_URL='https://pcrwtoddavpvkaxwtstc.supabase.co';
  assert.throws(()=>validateFirstOwnerConfig(bad,'status'),/refusing_shared_or_malformed/);
  const badEmail=env();delete badEmail.PROSPECT_FIRST_ADMIN_APPROVED_EMAIL;
  assert.throws(()=>validateFirstOwnerConfig(badEmail,'status'),/explicit_approval/);
});

test('first owner: invite is blocked before callback and SMTP verification',()=>{
  assert.throws(()=>validateFirstOwnerConfig(env(),'invite'),/verified_first/);
  const config=validateFirstOwnerConfig(env('invite'),'invite');
  assert.equal(config.redirect,'https://prospect.gritnews.com.br/');
});

test('first owner: status is read-only and accurately describes no Auth user',async()=>{
  const system=fakeSystem();
  const result=await performFirstOwnerAction({...system,mode:'status',email:EMAIL});
  assert.equal(result.total_auth_users,0);
  assert.equal(result.user_id,null);
  assert.equal(system.calls.length,0);
});

test('first owner: new invitation request is distinguished from delivery',async()=>{
  const system=fakeSystem();
  const result=await performFirstOwnerAction({...system,mode:'invite',email:EMAIL,redirect:'https://prospect.gritnews.com.br/'});
  assert.equal(result.status,'provider_accepted_request_delivery_not_verified');
  assert.equal(system.calls.length,1);
  assert.equal(system.calls[0].action,'invite');
});

test('first owner: never reinvites an existing unconfirmed user',async()=>{
  const system=fakeSystem({users:[{id:USER,email:EMAIL,invited_at:'2026-09-21'}]});
  const result=await performFirstOwnerAction({...system,mode:'invite',email:EMAIL});
  assert.equal(result.status,'existing_identity_no_invitation_sent');
  assert.equal(system.calls.length,0);
});

test('first owner: activation rejects unverified identity',async()=>{
  const system=fakeSystem({users:[{id:USER,email:EMAIL}]});
  await assert.rejects(
    performFirstOwnerAction({...system,mode:'activate',email:EMAIL}),/confirmed_auth_identity_required/
  );
  assert.equal(system.calls.length,0);
});

test('first owner: activation rejects multiple existing Auth identities',async()=>{
  const system=fakeSystem({users:[
    {id:USER,email:EMAIL,email_confirmed_at:'2026-09-21'},
    {id:'22222222-2222-4222-8222-222222222222',email:'other@example.invalid'}
  ]});
  await assert.rejects(
    performFirstOwnerAction({...system,mode:'activate',email:EMAIL}),/first_owner_auth_inventory_unexpected/
  );
  assert.equal(system.calls.length,0);
});

test('first owner: trusted activation RPC is invoked only after verified Auth identity',async()=>{
  let membership=null;
  const system=fakeSystem({users:[{id:USER,email:EMAIL,email_confirmed_at:'2026-09-21'}],org:{id:ORG,slug:'grit-solucoes-e-negocios'}});
  const original=system.db.from.bind(system.db);
  system.db.from=(name)=>{
    if(name==='memberships'){
      return {
        select(){return this},
        eq(){return this},
        async maybeSingle(){return {data:membership,error:null}}
      };
    }
    return original(name);
  };
  system.db.rpc=async(name,params)=>{
    assert.equal(name,'bootstrap_first_owner');
    assert.equal(params.p_user_id,USER);
    membership={role:'owner',active:true};
    return {data:{status:'activated',organization_id:ORG},error:null};
  };
  const result=await performFirstOwnerAction({...system,mode:'activate',email:EMAIL});
  assert.equal(result.verified,true);
  assert.equal(result.organization_id,ORG);
});
