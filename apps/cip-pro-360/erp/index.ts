import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {normalizePacket,buildERPReport,decimal,DataError,COMPANIES} from '../erp-engine.mjs';
const url=Deno.env.get('SUPABASE_URL')!,db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),origin='https://cip.gritnews.com.br';
const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
async function readBody(req:Request){const reader=req.body?.getReader();if(!reader)throw Error('body');let size=0;const parts:Uint8Array[]=[];while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>8000000){await reader.cancel();throw Error('size');}parts.push(r.value);}const b=new Uint8Array(size);let i=0;for(const p of parts){b.set(p,i);i+=p.length;}return JSON.parse(new TextDecoder().decode(b));}
const hash=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(v=>v.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'origin_not_allowed'});
 try{
  const auth=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('authorization')??''}},auth:{persistSession:false}}),u=await auth.auth.getUser();if(u.error||!u.data?.user)return reply(401,{error:'authentication_required'});
  const actor=u.data.user.id,p=await db.from('cip_profiles').select('role,active').eq('user_id',actor).single();if(!p.data?.active)return reply(403,{error:'cip_access_required'});
  const body=await readBody(req);
  if(body.action==='import'){
   if(p.data.role!=='superadm'||req.headers.get('origin')!==origin)return reply(403,{error:'superadmin_required'});
   if(typeof body.source_name!=='string'||body.source_name.length<1||body.source_name.length>180)return reply(400,{error:'invalid_source_name'});
   const rows=normalizePacket(body.packet,body.metadata),digest=await hash(JSON.stringify(rows));
   const r=await db.rpc('cip_erp_import',{p_actor:actor,p_source:body.source_name,p_hash:digest,p_rows:rows});return r.error?reply(409,{error:'import_not_saved'}):reply(200,{snapshots:r.data,hash:digest,warnings:rows.map(r=>({company_id:r.company_id,warnings:r.warnings}))});
  }
  if(body.action==='approve'){
   if(p.data.role!=='superadm'||req.headers.get('origin')!==origin)return reply(403,{error:'superadmin_required'});
   const inventory=decimal(body.inventory_total,2,'canonical',true),sales=decimal(body.sales_total,2);if(inventory===null||sales===null||body.confirmed!==true)return reply(400,{error:'reconciliation_required'});
   const r=await db.rpc('cip_erp_approve',{p_actor:actor,p_id:body.id,p_inventory:inventory,p_sales:sales,p_note:body.note});return r.error?reply(409,{error:'reconciliation_not_approved'}):reply(200,{approved:r.data===true});
  }
  if(body.action==='report'){
   if(!COMPANIES.includes(body.company)||!['sales_mtd','inventory','aged_stock','no_sales_stock','growth_actions'].includes(body.kind))return reply(400,{error:'invalid_report'});
   const r=await db.rpc('cip_erp_get',{p_actor:actor,p_company:body.company,p_id:body.id??null});if(r.error)return reply(403,{error:'company_or_review_access_required'});
   return reply(200,{report:buildERPReport(r.data,body.kind,new Date(),{offset:body.offset,limit:20})});
  }
  return reply(400,{error:'unknown_action'});
 }catch(e){return e instanceof DataError?reply(400,{error:'invalid_dataset',detail:e.message}):reply(503,{error:'erp_request_unavailable'});}
});
