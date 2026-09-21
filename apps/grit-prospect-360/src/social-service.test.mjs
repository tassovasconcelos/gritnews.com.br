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
    reviewAtomic:async params=>{
      calls.push({operation:'review',params});
      return {status:'reviewed',review_status:params.p_decision,candidate_id:params.p_candidate_id};
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

test('social service: provisional CNPJ association is stripped until human review',async()=>{
  const {result,calls,request}=service();
  await result.registerManual({...request,candidate:{
    ...BASE,company_id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  }});
  assert.equal(calls.length,1);
  assert.equal(calls[0].company_id,null);
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


test('social review: owner can approve a linked company with an audit reason',async()=>{
  const {result,calls}=service({role:'owner'});
  const id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const company='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const response=await result.reviewCandidate({
    authorization:'Bearer valid',organizationId:ORG,candidateId:id,decision:'approved',
    companyId:company,reason:'CNPJ e perfil institucional confirmados manualmente'
  });
  assert.equal(response.review_status,'approved');
  assert.equal(calls[0].operation,'review');
  assert.equal(calls[0].params.p_company_id,company);
});

test('social review: operators/viewers cannot approve or reject; cross-tenant denied',async()=>{
  const request={
    authorization:'Bearer valid',organizationId:ORG,
    candidateId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    decision:'rejected',reason:'Página empresarial não corresponde à empresa'
  };
  await assert.rejects(service().result.reviewCandidate(request),{status:403});
  await assert.rejects(service({role:'viewer'}).result.reviewCandidate(request),{status:403});
  await assert.rejects(service({role:'admin'}).result.reviewCandidate({...request,organizationId:OTHER}),{status:403});
});

test('social review: approval cannot proceed without company and justification',async()=>{
  const {result,calls}=service({role:'admin'});
  const request={
    authorization:'Bearer valid',organizationId:ORG,
    candidateId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    decision:'approved',reason:'Identidade e página institucional conferidas'
  };
  await assert.rejects(result.reviewCandidate(request),{status:400});
  await assert.rejects(result.reviewCandidate({...request,decision:'rejected',companyId:ORG}),{status:400});
  await assert.rejects(result.reviewCandidate({...request,decision:'rejected',reason:'curta'}),{status:400});
  assert.equal(calls.length,0);
});
