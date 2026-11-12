import {test} from 'node:test';import assert from 'node:assert/strict';
import {retailFixture,retailCall} from './fixtures/srp-retail.mjs';
import {as,call,draft,id,org,foreign,store,foreignStore,owner,cashier,stockist,other,cash} from './fixtures/srp-counter.mjs';
test('cliente, pedido e venda: vínculo, histórico, recibo e repetição preservados',async()=>{
 const db=await retailFixture();try{
 await assert.rejects(db.query("insert into public.srp_customers(name) values('Bypass')"),/permission denied/);
 const c={id:id(700),name:'Cliente teste',phone:'85999990000',whatsapp_opt_in:false};
 const saved=await retailCall(db,'customer_save',c);assert.equal(saved.phone,'5585999990000');
 await retailCall(db,'customer_save',c);assert.equal((await retailCall(db,'customers')).rows.length,1);
 const d={...draft(),customer_id:c.id};await call(db,'save',d);const done=await call(db,'complete',{id:d.id,version:1,cash_id:cash,payment_method:'cash'});
 assert.equal((await call(db,'complete',{id:d.id,version:1,cash_id:cash,payment_method:'cash'})).sale_id,done.sale_id);
 const history=await retailCall(db,'sales',{customer_id:c.id,days:30});assert.equal(history.rows.length,1);
 await as(db,cashier);const receipt=await retailCall(db,'receipt',{sale_id:done.sale_id});assert.equal(receipt.operator_name,'Atendente da venda');assert.equal(receipt.customer.id,c.id);assert.equal(receipt.items[0].name,'Pão');
 const detail=await retailCall(db,'customer',{customer_id:c.id});assert.equal(detail.summary.visits,1);assert.equal(Number(detail.summary.total),10);
 const contact={id:id(701),customer_id:c.id,note:'Preferência informada no balcão'};await retailCall(db,'contact',contact);await retailCall(db,'contact',contact);
 assert.equal((await retailCall(db,'customer',{customer_id:c.id})).contacts.length,1);
 await assert.rejects(retailCall(db,'customer_save',{...c,id:id(702)}),/customer_phone_exists/);
 await assert.rejects(retailCall(db,'customer_save',{...c,phone:'123'}),/invalid_customer_details/);
 }finally{await db.close();}
});
test('isolamento: outra empresa, cliente externo, estoque e consulta sem escrita',async()=>{
 const db=await retailFixture();try{
 await retailCall(db,'customer_save',{id:id(700),name:'Cliente local',phone:''});
 await assert.rejects(retailCall(db,'customers',{},foreign),/forbidden/);
 await assert.rejects(retailCall(db,'sales',{store_id:foreignStore}),/invalid_store/);
 await as(db,other);await retailCall(db,'customer_save',{id:id(701),name:'Outro cliente',phone:'',store_id:null},foreign);
 await as(db,owner);await assert.rejects(call(db,'save',{...draft(),customer_id:id(701)}),/invalid_customer/);
 await as(db,stockist);await assert.rejects(retailCall(db,'customers'),/forbidden/);
 await db.exec(`reset role;update srp_members set role='viewer' where user_id='${owner}'`);await as(db,owner);
 assert.equal((await retailCall(db,'customers')).rows.length,1);await assert.rejects(retailCall(db,'customer_save',{id:id(700),name:'Indevido',phone:''}),/forbidden/);
 await db.exec(`select set_config('test.password_blocked','true',false)`);await assert.rejects(retailCall(db,'sales'),/password_change_required/);
 }finally{await db.close();}
});
test('caixa: dinheiro esperado exclui PIX, fechamento idempotente, abertura única',async()=>{
 const db=await retailFixture();try{
 await assert.rejects(db.query("update public.srp_cash_registers set status='closed'"),/permission denied/);
 let d=draft();await call(db,'save',d);await call(db,'complete',{id:d.id,version:1,cash_id:cash,payment_method:'cash'});
 d=draft(101);await call(db,'save',d);await call(db,'complete',{id:d.id,version:1,cash_id:cash,payment_method:'pix'});
 const result=await retailCall(db,'cash_close',{id:cash,amount:29});assert.equal(Number(result.cash.expected_amount),30);
 assert.equal(Number((await retailCall(db,'cash_close',{id:cash,amount:29})).cash.counted_amount),29);
 await assert.rejects(retailCall(db,'cash_close',{id:cash,amount:31}),/cash_conflict/);
 const args={id:id(800),amount:5};await retailCall(db,'cash_open',args);await retailCall(db,'cash_open',args);
 await assert.rejects(retailCall(db,'cash_open',{id:id(801),amount:5}),/cash_already_open/);
 await assert.rejects(retailCall(db,'cash_open',{id:id(802),amount:-1}),/invalid_amount/);
 await as(db,stockist);await assert.rejects(retailCall(db,'cash_close',{id:id(800),amount:5}),/forbidden/);
 }finally{await db.close();}
});

