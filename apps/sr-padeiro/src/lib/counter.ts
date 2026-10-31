export type CounterProduct={id:string;name:string;variant:string;fulfillment:string;barcode:string|null;unit:string;sale_price:number;cost_price:number|null;active:boolean};
export type CounterLine={product_id:string;name:string;quantity:number;unit:string;unit_price:number};
export type CounterOrder={id:string;kind:'counter'|'pickup'|'preorder';customer_label:string;due_at:string|null;status:'open'|'ready'|'completed'|'cancelled';items:CounterLine[];total:number;version:number;sale_id:string|null;payment_method:string|null;created_at:string;updated_at:string};
export type Draft={id:string;version:number;kind:CounterOrder['kind'];customer_label:string;due_at:string;items:{product_id:string;quantity:number}[]};
export type Attempt={mode:'save'|'complete';payload:Draft&{save_key:string;store_id:string};payment_method:string;cash_id:string|null;expected_total:number};
export const newDraft=():Draft=>({id:crypto.randomUUID(),version:0,kind:'counter',customer_label:'',due_at:'',items:[]});
export const cleanSearch=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function draftKey(org:string,store:string,user:string){return `srp-counter-v1:${org}:${store}:${user}`;}
export function loadDraft(key:string):{draft:Draft;attempt:Attempt|null}{
 try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v&&typeof v.draft?.id==='string'&&Array.isArray(v.draft.items)&&['counter','pickup','preorder'].includes(v.draft.kind))return {draft:v.draft,attempt:v.attempt||null};}catch{/* An unavailable draft cannot replace server orders. */}
 return {draft:newDraft(),attempt:null};
}
export function writeDraft(key:string,draft:Draft,attempt:Attempt|null){localStorage.setItem(key,JSON.stringify({draft,attempt}));}
export function draftFromOrder(order:CounterOrder):Draft{return {id:order.id,version:order.version,kind:order.kind,customer_label:order.customer_label,due_at:order.due_at?localDateTime(order.due_at):'',items:order.items.map(i=>({product_id:i.product_id,quantity:Number(i.quantity)}))};}

export function quoteTotal(items:{product_id:string;quantity:number}[],products:CounterProduct[]){const prices=new Map(products.map(p=>[p.id,p.sale_price]));const cents=items.reduce((sum,i)=>sum+(BigInt(Math.round(Number(prices.get(i.product_id)||0)*100))*BigInt(Math.round(i.quantity*1000))+500n)/1000n,0n);return Number(cents)/100;}

export function localDateTime(value:string){const d=new Date(value);return Number.isFinite(d.getTime())?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';}
