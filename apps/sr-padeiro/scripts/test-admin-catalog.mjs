import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/lib/adminCatalog.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const compiled={exports:{}};new Function('exports',js)(compiled.exports);
const {parseCatalog,parseCsv}=compiled.exports;
test('CSV respeita aspas, delimitador, quebra de linha e preço brasileiro',()=>{
 const rows=parseCatalog('nome;categoria;variante;unidade;preco_centavos;modalidade;observacao\r\n"Pão; especial";Pães;;unidade;80;pronta_entrega;"Linha 1\nLinha 2"');
 assert.equal(rows[0].sale_price,.8);assert.equal(rows[0].name,'Pão; especial');assert.equal(rows[0].catalog_notes,'Linha 1\nLinha 2');assert.equal(rows[0].active,false);
});
test('cento preserva preço da caixa, variantes ficam distintas',()=>{
 const rows=parseCatalog(JSON.stringify([{nome:'Empada',unidade:'cento',preco_centavos:7000,modalidade:'encomenda'},{nome:'Bolo',variante:'P',sale_price:10},{nome:'Bolo',variante:'G',sale_price:20}]));
 assert.equal(rows[0].unit,'CAIXA');assert.equal(rows[0].sale_price,70);assert.match(rows[0].catalog_notes,/100 unidades/);assert.notEqual(rows[1].external_key,rows[2].external_key);
});
test('não transforma preço ausente em produto grátis',()=>{
 for(const row of [{name:'Teste'},{name:'Teste',sale_price:null},{name:'Teste',sale_price:''},{name:'Teste',sale_price:-1},{name:'Teste',sale_price:'abc'},{name:'Teste',preco_centavos:1.2}])assert.throws(()=>parseCatalog(JSON.stringify([row])));
});
test('recusa duplicatas, cabeçalhos duplicados, CSV truncado e modalidades inválidas',()=>{
 assert.throws(()=>parseCatalog('[{"name":"Pão","sale_price":1},{"name":"Pão","sale_price":2}]'),/duplicado/);
 assert.throws(()=>parseCsv('nome;nome\na;b'),/repetidas/);
 assert.throws(()=>parseCsv('nome;preco\n"Pão;1'),/aspas/);
 assert.throws(()=>parseCatalog('[{"name":"Teste","sale_price":1,"fulfillment":"qualquer"}]'),/modalidade/);
});
