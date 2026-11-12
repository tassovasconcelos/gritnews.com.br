import test from 'node:test';import assert from 'node:assert/strict';
import {landedCost,supplierCoverage,dossierHtml} from '../src/lib/procurement-evidence.mjs';
test('equalization includes packaging, freight, tax and discount exactly once',()=>{
 assert.equal(landedCost({quantity:100,unit_price:60,unit_factor:12,freight:30,extra_tax:10,discount_total:20}),520);
});
test('a changed quantity or noncompliant offer cannot complete supplier coverage',()=>{
 const lines=[{product_id:'a',quantity:10},{product_id:'b',quantity:2}];
 const offers=[{supplier_id:'s',product_id:'a',quantity:10,status:'received',technical_compliant:true},{supplier_id:'s',product_id:'b',quantity:1,status:'received',technical_compliant:true}];
 assert.equal(supplierCoverage(offers,lines).get('s'),1);
 offers[1].quantity=2;assert.equal(supplierCoverage(offers,lines).get('s'),2);
 offers[1].technical_compliant=false;assert.equal(supplierCoverage(offers,lines).get('s'),1);
});
test('dossier requires formalization and escapes supplier-provided markup',()=>{
 assert.throws(()=>dossierHtml({}),/Formalize/);
 const html=dossierHtml({formalization_snapshot:{title:'<script>alert(1)</script>',offers:[],criteria:'Approved <img onerror=x>'}});
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<img'));
});
