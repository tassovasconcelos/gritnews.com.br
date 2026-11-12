async function request(body:unknown){return await fetch('/qa-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());}
export const supabase:any={rpc:(fn:string,args:unknown)=>request({type:'rpc',fn,args}),from:(table:string)=>{
 const filters:unknown[]=[];let single=false;const q:any={select:()=>q,eq:(field:string,value:unknown)=>{filters.push([field,'=',value]);return q;},gte:(field:string,value:unknown)=>{filters.push([field,'>=',value]);return q;},order:()=>q,limit:()=>q,maybeSingle:()=>{single=true;return q;},single:()=>{single=true;return q;},then:(resolve:any,reject:any)=>request({type:'table',table,filters,single}).then(resolve,reject)};return q;
}};
