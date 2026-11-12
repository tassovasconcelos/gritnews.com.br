import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadDraft,quoteTotal} from '../src/lib/counter.ts';
test('rascunho com quantidade corrompida não impede abrir atendimento',()=>{
 const before=globalThis.localStorage;
 globalThis.localStorage={getItem:()=>JSON.stringify({draft:{id:'antigo',version:0,kind:'counter',customer_label:'',due_at:'',items:[{product_id:'p',quantity:'inválida'}]}})};
 try {const recovered=loadDraft('teste');assert.doesNotThrow(()=>quoteTotal(recovered.draft.items,[{id:'p',sale_price:5}]));assert.equal(recovered.draft.items.length,0);}
 finally {if(before===undefined)delete globalThis.localStorage;else globalThis.localStorage=before;}
});

import {withDeadline} from '../src/lib/request.ts';
import {whatsAppReceiptUrl} from '../../../packages/operations/src/receipt.ts';
import {withOperationDeadline} from '../../../packages/operations/src/request.ts';
import {operationSection} from '../../../packages/operations/src/supportNavigation.ts';
test('espera sem resposta termina com erro recuperável',async()=>{
 await assert.rejects(withDeadline(new Promise(()=>{}),10),/demorou/);
 await assert.rejects(withOperationDeadline(new Promise(()=>{}),10),/operation_timeout/);
 assert.equal(await withDeadline(Promise.resolve(3),10),3);
});
test('WhatsApp valida destinatário e preserva cupom codificado, sem enviar',()=>{
 const url=new URL(whatsAppReceiptUrl('(85) 99999-0000','RECIBO NÃO FISCAL\nTOTAL: R$ 10,00 & obrigado'));
 assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/5585999990000');
 assert.equal(url.searchParams.get('text'),'RECIBO NÃO FISCAL\nTOTAL: R$ 10,00 & obrigado');
 assert.throws(()=>whatsAppReceiptUrl('javascript:123','x'),/DDD/);
 for(const tab of ['pos','cash','sales','customers','sell'])assert.equal(operationSection('sr-padeiro',tab),tab);
 assert.equal(operationSection('sr-padeiro','unknown'),null);
});
test('rascunho inválido com confirmação pendente nunca é apagado silenciosamente',()=>{
 const previous=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify({draft:{id:'old',items:[]},attempt:{mode:'complete'}})};
 try{assert.throws(()=>loadDraft('pending'),/Confirmação pendente/);}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
