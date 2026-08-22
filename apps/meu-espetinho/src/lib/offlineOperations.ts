import type{Order,OrderItem}from'../store';
import{cloudCreateOrder,cloudSyncItem}from'../cloudStore';
import{enqueueEvent}from'./offlineOutbox';
import{flushOfflineOutbox}from'./offlineSync';

function online(){return typeof navigator==='undefined'||navigator.onLine}

export async function createOrderOfflineFirst(tenantId:string,userId:string,order:Order){
 if(online()){
  try{await cloudCreateOrder(tenantId,userId,order);return{queued:false}}catch{}
 }
 await enqueueEvent({tenantId,userId,type:'order.create',entityId:order.id,payload:{id:order.id,customerId:order.customerId,label:order.label,assignedTo:order.assignedTo,openedAt:order.openedAt,subtotal:0,total:0}});
 return{queued:true};
}

export async function syncOrderItemOfflineFirst(tenantId:string,userId:string,orderId:string,item:OrderItem|null,productId:string,orderTotal:number){
 if(online()){
  try{await cloudSyncItem(tenantId,orderId,item,productId,orderTotal,userId);return{queued:false}}catch{}
 }
 await enqueueEvent({tenantId,userId,type:'order.item.sync',entityId:`${orderId}:${productId}`,payload:{orderId,item,productId,orderTotal}});
 return{queued:true};
}

export async function syncNow(tenantId?:string){return flushOfflineOutbox(tenantId)}
