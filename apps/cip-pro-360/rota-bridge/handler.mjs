export function createReceiver(db){return async req=>{
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
 if(req.method!=='POST')return reply(405,{error:'post_required'});
 if(req.headers.has('origin'))return reply(403,{error:'server_only'});
 const stamp=req.headers.get('x-cip-timestamp'),signature=req.headers.get('x-cip-signature');
 if(!/^\d{10}$/.test(stamp??'')||!/^[a-f0-9]{64}$/.test(signature??''))return reply(401,{error:'authentication_required'});
 try{const reader=req.body?.getReader();if(!reader)return reply(400,{error:'body_required'});let total=0,body='';const decode=new TextDecoder();for(;;){const x=await reader.read();if(x.done)break;total+=x.value.byteLength;if(total>30000){await reader.cancel();return reply(413,{error:'body_limit'});}body+=decode.decode(x.value,{stream:true});}body+=decode.decode();
 const result=await db.rpc('cip_faro_rental_receive',{p_body:body,p_stamp:stamp,p_signature:signature});
 if(result.error)return reply(403,{error:'bridge_rejected'});return reply(200,result.data);
 }catch{return reply(503,{error:'bridge_unavailable'});}
};}
