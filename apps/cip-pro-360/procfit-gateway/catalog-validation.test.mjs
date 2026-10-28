import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateCatalog,PRODUCT_FIELDS,EAN_FIELDS} from './catalog-validation.mjs';
const now=Date.now(),base={schema:'cip-procfit-catalog-v1',batch_id:'00000000-0000-4000-8000-000000000001',sent_at:new Date(now).toISOString()};
const product=()=>Object.fromEntries(PRODUCT_FIELDS.map(k=>[k,k==='COD_PRODUTO'?'123':k==='NOME_PRODUTO'?'Teste':null]));
test('accepts complete source fields and null values without manufacturing missing data',()=>{
 const p={...base,action:'products',rows:[product()]};assert.equal(validateCatalog(p,now),p);
 const e=Object.fromEntries(EAN_FIELDS.map(k=>[k,k==='REGISTRO'?'1':k==='COD_PRODUTO'?'123':k==='EAN'?'0001234567890':null]));assert.equal(validateCatalog({...base,action:'eans',rows:[e]},now).rows[0].EAN,'0001234567890');
});
test('rejects wrong scope, stale signatures, invalid actions and row overflow',()=>{
 for(const p of [{...base,schema:'cip-procfit-probe-v1',action:'finish'},{...base,sent_at:new Date(now-300001).toISOString(),action:'finish'},{...base,action:'sql'},{...base,action:'products',rows:Array(501).fill(product())}])assert.throws(()=>validateCatalog(p,now));
});
test('rejects missing source fields, duplicate identities and unsafe numeric IDs',()=>{
 for(const rows of [[{...product(),COD_PRODUTO:9007199254740992}],[product(),product()],[{COD_PRODUTO:'1',NOME_PRODUTO:'Test'}],[{...product(),NOME_PRODUTO:'  '}]])assert.throws(()=>validateCatalog({...base,action:'products',rows},now));
});
test('begin requires nonempty bounded product manifest and finish has no rows',()=>{
 assert.equal(validateCatalog({...base,action:'begin',captured_at:base.sent_at,products:59471,eans:56747},now).products,59471);
 for(const products of [0,300001,1.2])assert.throws(()=>validateCatalog({...base,action:'begin',captured_at:base.sent_at,products,eans:0},now));
 assert.equal(validateCatalog({...base,action:'finish'},now).action,'finish');
});
