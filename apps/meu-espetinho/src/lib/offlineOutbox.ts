export type OutboxEventType='order.create'|'order.item.sync'|'order.close'|'customer.upsert'|'product.upsert';
export type OutboxStatus='pending'|'processing'|'failed';
export type OutboxEvent<T=unknown>={id:string;tenantId:string;userId:string;type:OutboxEventType;entityId:string;payload:T;createdAt:string;updatedAt:string;attempts:number;status:OutboxStatus;lastError?:string};

const DB_NAME='meu-espetinho-offline';
const DB_VERSION=1;
const STORE='outbox';

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:'id'});store.createIndex('status','status');store.createIndex('tenantId','tenantId');store.createIndex('createdAt','createdAt')}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function done(tx:IDBTransaction){return new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}

export async function enqueueEvent<T>(input:Omit<OutboxEvent<T>,'id'|'createdAt'|'updatedAt'|'attempts'|'status'>){const now=new Date().toISOString();const event:OutboxEvent<T>={...input,id:crypto.randomUUID(),createdAt:now,updatedAt:now,attempts:0,status:'pending'};const db=await openDb();const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).add(event);await done(tx);db.close();window.dispatchEvent(new CustomEvent('meu-espetinho-outbox-change'));return event}
export async function listPendingEvents(tenantId?:string){const db=await openDb();const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).getAll();const rows=await new Promise<OutboxEvent[]>((resolve,reject)=>{req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});await done(tx);db.close();return rows.filter(x=>(!tenantId||x.tenantId===tenantId)&&x.status!=='processing').sort((a,b)=>a.createdAt.localeCompare(b.createdAt))}
export async function countPendingEvents(tenantId?:string){return (await listPendingEvents(tenantId)).length}
export async function markProcessing(id:string){return patch(id,{status:'processing',updatedAt:new Date().toISOString()})}
export async function markFailed(id:string,error:string){const current=await getEvent(id);if(!current)return;return patch(id,{status:'failed',attempts:current.attempts+1,lastError:error.slice(0,300),updatedAt:new Date().toISOString()})}
export async function markPending(id:string){const current=await getEvent(id);if(!current)return;return patch(id,{status:'pending',attempts:current.attempts+1,updatedAt:new Date().toISOString()})}
export async function removeEvent(id:string){const db=await openDb();const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);await done(tx);db.close();window.dispatchEvent(new CustomEvent('meu-espetinho-outbox-change'))}
async function getEvent(id:string){const db=await openDb();const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(id);const value=await new Promise<OutboxEvent|undefined>((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});await done(tx);db.close();return value}
async function patch(id:string,changes:Partial<OutboxEvent>){const current=await getEvent(id);if(!current)return;const db=await openDb();const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({...current,...changes});await done(tx);db.close();window.dispatchEvent(new CustomEvent('meu-espetinho-outbox-change'))}
