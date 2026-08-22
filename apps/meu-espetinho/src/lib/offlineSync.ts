import {supabase} from './supabase';
import {listPendingEvents,markFailed,markPending,markProcessing,removeEvent,type OutboxEvent} from './offlineOutbox';

let running=false;

async function applyEvent(event:OutboxEvent){
 if(!supabase)throw new Error('supabase_unavailable');
 const p:any=event.payload;
 if(event.type==='order.create'){
  const{error}=await supabase.from('orders').upsert({id:p.id,tenant_id:event.tenantId,customer_id:p.customerId||null,label:p.label,status:'open',subtotal:p.subtotal||0,total:p.total||0,opened_by:event.userId,assigned_to:p.assignedTo||event.userId,opened_at:p.openedAt},{onConflict:'id'});if(error)throw error;return;
 }
 if(event.type==='order.item.sync'){
  if(!p.item||p.item.qty<=0){const{error}=await supabase.from('order_items').delete().eq('tenant_id',event.tenantId).eq('order_id',p.orderId).eq('product_id',p.productId);if(error)throw error}else{const{error}=await supabase.from('order_items').upsert({tenant_id:event.tenantId,order_id:p.orderId,product_id:p.item.productId,product_name:p.item.name,unit_price:p.item.unitPrice,quantity:p.item.qty,total:p.item.qty*p.item.unitPrice,created_by:event.userId},{onConflict:'order_id,product_id'});if(error)throw error}const orderUpdate=await supabase.from('orders').update({subtotal:p.orderTotal,total:p.orderTotal}).eq('tenant_id',event.tenantId).eq('id',p.orderId);if(orderUpdate.error)throw orderUpdate.error;return;
 }
 if(event.type==='order.close'){
  const{data,error}=await supabase.rpc('close_order_atomic',{p_tenant_id:event.tenantId,p_order_id:p.orderId,p_user_id:event.userId,p_amount:p.amount,p_method:p.method,p_customer_id:p.customerId||null});if(error)throw error;if(!(data as any)?.ok)throw new Error('close_not_confirmed');return;
 }
 if(event.type==='customer.upsert'){
  const{error}=await supabase.from('customers').upsert({...p,tenant_id:event.tenantId},{onConflict:'id'});if(error)throw error;return;
 }
 if(event.type==='product.upsert'){
  const{error}=await supabase.from('products').upsert({...p,tenant_id:event.tenantId},{onConflict:'id'});if(error)throw error;return;
 }
 throw new Error('unsupported_event');
}

export async function flushOfflineOutbox(tenantId?:string){
 if(running||typeof navigator!=='undefined'&&!navigator.onLine)return{processed:0,remaining:(await listPendingEvents(tenantId)).length};
 running=true;let processed=0;
 try{
  const events=await listPendingEvents(tenantId);
  for(const event of events){
   try{await markProcessing(event.id);await applyEvent(event);await removeEvent(event.id);processed++}
   catch(error){const message=error instanceof Error?error.message:String(error);if(!navigator.onLine){await markPending(event.id);break}await markFailed(event.id,message);break}
  }
  return{processed,remaining:(await listPendingEvents(tenantId)).length};
 }finally{running=false}
}

export function startOfflineSync(tenantId?:string){
 const sync=()=>flushOfflineOutbox(tenantId).catch(()=>{});
 window.addEventListener('online',sync);
 const timer=window.setInterval(()=>{if(navigator.onLine)sync()},30000);
 sync();
 return()=>{window.removeEventListener('online',sync);window.clearInterval(timer)};
}
