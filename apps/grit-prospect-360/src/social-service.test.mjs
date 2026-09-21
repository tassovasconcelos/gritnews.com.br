import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocialProspectingService } from './social-service.mjs';

const ORG='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', OTHER='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', USER='11111111-1111-4111-8111-111111111111';
const BASE={ platform:'instagram',account_key:'@empresa',company_label:'Empresa Teste',source_kind:'manual_corporate_url' };

function service({role='operator',org=ORG,existing=null,insertError=null}={}) {
  const calls=[];
  const result=createSocialProspectingService({
    authenticate:async token=>token==='valid'?{id:USER}:null,
    membershipFor:async (tenant,user)=>tenant===org && user===USER?{active:true,role}:null,
    findExisting:async (tenant,platform,key)=>{
      assert.equal(tenant,org);
      return platform==='instagram' && key==='empresa'?existing:null;
    },
    insertCandidate:async data=>{
      calls.push(data);
      if(insertError) throw insertError;
      return {id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'};
    },
    clock:()=>1000
  });
  const request={authorization:'Bearer valid',organizationId:ORG,candidate:BASE};
  return {result,calls,request};
}

test('social service: manual Instagram company is saved as pending review',async()=>{
  const {result,calls,request}=service();
  const response=await result.registerManual(request);
  assert.equal(response.status,'pending_review');
  assert.equal(calls.length,1);
  assert.equal(calls[0].organization_id,ORG);
  assert.equal(calls[0].created_by,USER);
  assert.equal(calls[0].review_status,'pending');
});

test('social service: rejects anonymous and incorrect tenant or viewer',async()=>{
  const {result,calls,request}=service();
  await assert.rejects(result.registerManual({...request,authorization:null}),{status:401});
  await assert.rejects(result.registerManual({...request,organizationId:OTHER}),{status:403});
  await assert.rejects(service({role:'viewer'}).result.registerManual(request),{status:403});
  assert.equal(calls.length,0);
});

test('social service: blocks caller from forging Meta discovery or LinkedIn sources',async()=>{
  const {result,calls,request}=service();
  await assert.rejects(result.registerManual({...request,
    candidate:{...BASE,source_kind:'approved_meta_business_discovery',api_approved:true}}),{status:400});
  await assert.rejects(result.registerManual({...request,
    candidate:{...BASE,source_kind:'first_party_inbound',source_reference:'fake'}}),{status:400});
  assert.equal(calls.length,0);
});

test('social service: duplicate within tenant does not write',async()=>{
  const {result,calls,request}=service({existing:{id:'existing-id'}});
  const response=await result.registerManual(request);
  assert.equal(response.status,'already_exists');
  assert.equal(calls.length,0);
});

test('social service: catches unique index concurrency collisions',async()=>{
  const {result,request}=service({insertError:{code:'23505'}});
  await assert.rejects(result.registerManual(request),{status:409});
});

test('social service: at most twenty writes per minute in one process',async()=>{
  const {result,request,calls}=service();
  for(let i=0;i<20;i++) await result.registerManual(request);
  await assert.rejects(result.registerManual(request),{status:429});
  assert.equal(calls.length,20);
});
