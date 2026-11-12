import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {verifyProbe} from './probe-validation.mjs';
import {validateCatalog} from './catalog-validation.mjs';
const PUBLIC_KEY='MCowBQYDK2VwAyEA8sHNg6/ZLOrmTDLpxQC7olepw0HB2rUVd5DtdRElD+Y=';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return reply(405,{error:'post_required'});
 const signature=req.headers.get('x-cip-signature');if(!signature)return reply(401,{error:'signature_required'});
 try{
  if(Number(req.headers.get('content-length'))>1048576)return reply(413,{error:'body_limit'});
  const reader=req.body?.getReader();if(!reader)return reply(400,{error:'body_required'});
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>1048576){await reader.cancel();return reply(413,{error:'body_limit'});}chunks.push(x.value);}
  const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}const raw=new TextDecoder().decode(all);
  if(!await verifyProbe(raw,signature,PUBLIC_KEY))return reply(401,{error:'invalid_signature'});
  const p=validateCatalog(JSON.parse(raw));
  const r=await db.rpc('cip_procfit_catalog_receive',{p});
  if(r.error)return reply(409,{error:'catalog_not_saved'});
  return reply(200,r.data);
 }catch{return reply(400,{error:'invalid_catalog_packet'});}
});
