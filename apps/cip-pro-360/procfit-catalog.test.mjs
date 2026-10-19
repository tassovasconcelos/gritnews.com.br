import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalogCards,catalogFrame} from './procfit-catalog-ui.mjs';
test('source text is escaped, all commercial master fields and EAN flags remain visible',()=>{
 const html=catalogCards([{product:{COD_PRODUTO:'123',NOME_PRODUTO:'<script>alert(1)</script>',MARCA:'Teste',GRUPO_MARCA:'Grupo'},eans:[{EAN:'000123',VALIDO:'N'}]}]);
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));for(const s of ['Grupo de marca','Família','NCM','Inclusão no ERP','000123','Válido na origem','Não informado'])assert.ok(html.includes(s));
});
test('catalog never promises availability, activity or live financial information',()=>{
 assert.match(catalogFrame(),/Cadastro não comprova disponibilidade, preço, venda ou produto ativo/);
 assert.match(catalogCards([{product:{},eans:[]}]),/Sem EAN vinculado nesta carga/);
});
