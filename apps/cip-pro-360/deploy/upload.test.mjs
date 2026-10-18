import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateTarget} from './upload.mjs';
test('dedicated website FTP account can use only its public_html root',()=>{
 assert.equal(validateTarget('example.cip.gritnews.com.br','/public_html/'),'/public_html');
 assert.throws(()=>validateTarget('portal-account','/public_html/'));
});
test('rejects parent traversal, unrelated domains and broader account roots',()=>{
 for(const directory of ['/','/public_html/../','/public_html/cip/../../','/domains/other/public_html/','/public_html/cip-other/']){
  assert.throws(()=>validateTarget('example.cip.gritnews.com.br',directory));
 }
});
test('retains the existing explicitly allowed CIP subdirectory mappings',()=>{
 assert.equal(validateTarget('account','domains/gritnews.com.br/public_html/cip/'),'/domains/gritnews.com.br/public_html/cip');
});
