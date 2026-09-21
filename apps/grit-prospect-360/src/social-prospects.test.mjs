import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCorporateAccount, deduplicateCorporateCandidates, SOCIAL_CHANNEL_POLICY
} from './social-prospects.mjs';

test('accepts and normalizes Instagram corporate handle supplied manually',()=>{
  const c=normalizeCorporateAccount({
    platform:'instagram',profile_url:'https://instagram.com/Empresa.Exemplo/',
    company_label:'  Empresa   Exemplo  ',source_kind:'manual_corporate_url'
  });
  assert.equal(c.account_key,'empresa.exemplo');
  assert.equal(c.profile_url,'https://www.instagram.com/empresa.exemplo/');
  assert.equal(c.company_label,'Empresa Exemplo');
  assert.equal(c.review_status,'pending');
});

test('accepts corporate LinkedIn company URL but not personal member or post URLs',()=>{
  const c=normalizeCorporateAccount({
    platform:'linkedin',profile_url:'https://linkedin.com/company/grit-solucoes/',
    company_label:'GRIT Soluções',source_kind:'manual_corporate_url'
  });
  assert.equal(c.account_key,'grit-solucoes');
  for (const url of ['https://linkedin.com/in/person/', 'https://linkedin.com/posts/person-abc',
    'http://linkedin.com/company/company','https://linkedin.com/company/company?trk=1']) {
    assert.throws(()=>normalizeCorporateAccount({
      platform:'linkedin',profile_url:url,company_label:'Empresa',source_kind:'manual_corporate_url'
    }),/invalid_profile_url|corporate_page_required/);
  }
});

test('requires explicit approved Meta scope before accepting business discovery evidence',()=>{
  const payload={platform:'instagram',profile_url:'@empresa',
    company_label:'Empresa',source_kind:'approved_meta_business_discovery',source_reference:'meta:ig-business:123'};
  assert.throws(()=>normalizeCorporateAccount(payload),/meta_api_approval_required/);
  assert.equal(normalizeCorporateAccount({...payload,api_approved:true}).source_kind,'approved_meta_business_discovery');
});

test('rejects LinkedIn Marketing API scraping/member data source',()=>{
  assert.throws(()=>normalizeCorporateAccount({
    platform:'linkedin',profile_url:'company',company_label:'Company',
    source_kind:'linkedin_member_search'
  }),/unsupported_platform_or_source/);
  assert.equal(SOCIAL_CHANNEL_POLICY.linkedin.search_members,false);
  assert.equal(SOCIAL_CHANNEL_POLICY.instagram.outbound,false);
});

test('rejects URL redirects, credentials, query tracking, non-platform domains',()=>{
  for (const url of ['https://instagram.com.evil.example/business/',
    'https://user:password@instagram.com/business/', 'https://instagram.com/business/?secret=1',
    'https://instagram.com/business/#tag']) {
    assert.throws(()=>normalizeCorporateAccount({
      platform:'instagram',profile_url:url,company_label:'Company',source_kind:'manual_corporate_url'
    }),/invalid_profile_url/);
  }
});

test('intake dedupes within batch and against existing organization profiles',()=>{
  const payload=[
    {platform:'instagram',account_key:'@grit',company_label:'GRIT',source_kind:'manual_corporate_url'},
    {platform:'instagram',profile_url:'https://www.instagram.com/GRIT/',company_label:'GRIT',source_kind:'manual_corporate_url'},
    {platform:'linkedin',account_key:'grit-solucoes',company_label:'GRIT',source_kind:'manual_corporate_url'}
  ];
  const report=deduplicateCorporateCandidates(payload,[{platform:'linkedin',account_key:'grit-solucoes'}]);
  assert.equal(report.total,3);
  assert.equal(report.accepted.length,1);
  assert.deepEqual(report.skipped.map(x=>x.reason),['duplicate_account','duplicate_account']);
});

test('inbound requires evidence reference and never enables outbound',()=>{
  assert.throws(()=>normalizeCorporateAccount({
    platform:'instagram',account_key:'grit',company_label:'GRIT',
    source_kind:'first_party_inbound'
  }),/inbound_reference_required/);
  assert.equal(SOCIAL_CHANNEL_POLICY.linkedin.outbound,false);
});
