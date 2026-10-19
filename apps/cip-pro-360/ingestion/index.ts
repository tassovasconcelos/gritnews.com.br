import {createClient} from '@supabase/supabase-js';
import {extract,ReadError,MAX_BYTES} from './extract.mjs';
import {fetchSource,getPinnedDeno} from './safe-fetch.mjs';
const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const digest=async(value:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const cors={'Access-Control-Allow-Origin':'https://cip.gritnews.com.br','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
function response(status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});}
async function processJob(job:any){
 let result:any;
 try{
  const {data:m,error}=await admin.from('cip_academy_materials').select('id,company_id,file_path,file_name,source_url').eq('id',job.material_id).eq('company_id',job.company_id).single();if(error||!m)throw new ReadError('missing_source','Fonte indisponível.');
  let bytes:Uint8Array,name='',mime='';
  if(m.file_path){
   if(!m.file_path.startsWith(m.company_id+'/'))throw new ReadError('scope','Arquivo fora da empresa.');
   const {data:file,error}=await admin.storage.from('cip-academy').download(m.file_path);if(error||!file)throw new ReadError('download','Não foi possível baixar o anexo privado.');if(file.size>MAX_BYTES)throw new ReadError('size_limit','Arquivo maior que 10 MB.');bytes=new Uint8Array(await file.arrayBuffer());name=m.file_name??m.file_path;mime=file.type;
  }else{const source=await fetchSource(m.source_url,{resolve:async(host:string)=>(await Deno.resolveDns(host,'A')).map(address=>({address,family:4})),request:getPinnedDeno});bytes=source.bytes;name=new URL(source.url).pathname;mime=source.mime;}
  const parsed=await extract(bytes,{name,mime});result={...parsed,content_hash:await digest(parsed.text_content),status:parsed.complete?'succeeded':'manual_required',error:parsed.complete?null:'Há páginas sem texto; conferir OCR antes de aprovar.'};
 }catch(e){console.error('cip_academy_read_error',{name:e?.name,code:e?.code,message:String(e?.message??'').replace(/https?:\/\/\S+/g,'[source]').slice(0,180)});const known=e instanceof ReadError;result={status:known&&['unsafe_url','unsafe_xml','unsupported','no_text','size_limit','page_limit','zip_limit','invalid_docx','invalid_xlsx','requires_login'].includes(e.code)?'manual_required':'failed',error:known?e.message:'Falha de leitura. Confira o formato, o acesso à fonte e tente novamente.'};}
 const finish=await admin.rpc('cip_academy_finish_job',{p_job:job.id,p_lease:job.lease_token,p_result:result});
 if(finish.error||finish.data!==true)throw Error('processing_commit_failed');
 return {material_id:job.material_id,status:result.status,error:result.error??null};
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return response(405,{error:'method_not_allowed'});
 if(req.headers.get('origin')&&req.headers.get('origin')!=='https://cip.gritnews.com.br')return response(403,{error:'origin_not_allowed'});
 try{
  const workerToken=req.headers.get('x-academy-worker-token');let worker=false,materialId:string|null=null;
  if(workerToken){const {data}=await admin.from('cip_academy_worker_config').select('token_hash').eq('id',true).single();worker=!!data&&await digest(workerToken)===data.token_hash;if(!worker)return response(401,{error:'unauthorized'});}
  else{
   const authorization=req.headers.get('authorization')??'';const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
   const auth=await client.auth.getUser();if(auth.error||!auth.data.user)return response(401,{error:'unauthorized'});
   const body=await req.json();if(typeof body.material_id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.material_id))return response(400,{error:'material_required'});materialId=body.material_id;
   const source=await client.from('cip_academy_materials').select('company_id').eq('id',materialId).single();if(source.error||!source.data)return response(404,{error:'source_unavailable'});
   const access=await client.rpc('cip_can_access',{p_company:source.data.company_id,p_write:true});if(access.data!==true)return response(403,{error:'write_access_required'});
   const job=await admin.from('cip_academy_ingestion_jobs').select('status,updated_at').eq('material_id',materialId).single();
   if(job.data&&job.data.status!=='processing'&&Date.now()-Date.parse(job.data.updated_at)>60000)await admin.from('cip_academy_ingestion_jobs').update({status:'queued',attempts:0,next_attempt_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('material_id',materialId);
  }
  const results=[];for(let i=0;i<(worker?2:1);i++){
   const claim=await admin.rpc('cip_academy_claim_job',{p_material:materialId});if(claim.error)throw Error('queue_unavailable');if(!claim.data?.length)break;
   results.push(await processJob(claim.data[0]));
  }
  return response(200,{processed:results.length,results});
 }catch{return response(500,{error:'processing_unavailable'});}
});
