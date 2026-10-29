import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async(req)=>{try{
 const auth=req.headers.get('Authorization'); if(!auth)return json({error:'unauthorized'},401);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data:{user},error:ue}=await db.auth.getUser(auth.replace('Bearer ','')); if(ue||!user)return json({error:'unauthorized'},401);
  if(user.app_metadata?.ops_password_required===true)return json({error:'password_change_required'},403);
  const requestGuard=await createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}}).rpc("ops_account_request_guard",{});
  if(requestGuard.error)return json({error:"password_change_required"},403);
 const body=await req.json().catch(()=>({})); const tenantId=String(body.tenant_id||''); if(!tenantId)return json({error:'tenant_required'},400);
 const {data:tenant}=await db.from('tenants').select('id,owner_user_id,subscription_status,created_at').eq('id',tenantId).maybeSingle(); if(!tenant||tenant.owner_user_id!==user.id)return json({error:'forbidden'},403);
 const {data:firstPaid}=await db.from('billing_transactions').select('created_at').eq('tenant_id',tenantId).eq('status','approved').order('created_at',{ascending:true}).limit(1).maybeSingle();
 const start=new Date(firstPaid?.created_at||tenant.created_at); const deadline=new Date(start.getTime()+7*86400000); const within=Date.now()<=deadline.getTime();
 const {data:subscription}=await db.from('subscriptions').select('id,provider_subscription_id,status').eq('tenant_id',tenantId).order('created_at',{ascending:false}).limit(1).maybeSingle();
 const {data:reqRow}=await db.from('cancellation_requests').insert({tenant_id:tenantId,requested_by:user.id,reason_code:body.reason_code||null,reason_detail:body.reason_detail||null,within_cooling_off:within,cooling_off_deadline:deadline.toISOString(),status:'processing',provider_subscription_id:subscription?.provider_subscription_id||null}).select('id').single();
 let mp=Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')||''; if(!mp){const{data}=await db.rpc('platform_secret_get',{secret_name:'MERCADO_PAGO_ACCESS_TOKEN'});mp=String(data||'')} if(!mp)return json({error:'mercado_pago_not_configured'},503);
 if(subscription?.provider_subscription_id){const r=await fetch(`https://api.mercadopago.com/preapproval/${subscription.provider_subscription_id}`,{method:'PUT',headers:{Authorization:`Bearer ${mp}`,'Content-Type':'application/json'},body:JSON.stringify({status:'cancelled'})}); if(!r.ok){const d=await r.json().catch(()=>({}));await db.from('cancellation_requests').update({status:'subscription_cancel_failed',refund_details:[{stage:'subscription_cancel',error:d}],updated_at:new Date().toISOString()}).eq('id',reqRow.id);return json({error:'subscription_cancel_failed',details:d},502)}}
 let refunded=0; const details:any[]=[];
 if(within){const {data:txs}=await db.from('billing_transactions').select('id,kind,provider_id,amount,status,payload,created_at').eq('tenant_id',tenantId).eq('status','approved').lte('created_at',deadline.toISOString()).order('created_at',{ascending:true});
  for(const tx of txs||[]){try{let paymentId=String(tx.provider_id||''); if(tx.kind==='subscription'){const inv=await fetch(`https://api.mercadopago.com/authorized_payments/${paymentId}`,{headers:{Authorization:`Bearer ${mp}`}});const invData=await inv.json();paymentId=String(invData?.payment?.id||'');if(!paymentId)throw new Error('subscription_payment_id_not_found')}
   const idempotency=`${reqRow.id}:${tx.id}`; const rr=await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,{method:'POST',headers:{Authorization:`Bearer ${mp}`,'Content-Type':'application/json','X-Idempotency-Key':idempotency},body:'{}'}); const rd=await rr.json(); if(!rr.ok)throw new Error(JSON.stringify(rd)); refunded+=Number(tx.amount||0); details.push({transaction_id:tx.id,payment_id:paymentId,amount:Number(tx.amount||0),status:'refunded',provider:rd}); await db.from('billing_transactions').update({status:'refunded',updated_at:new Date().toISOString(),payload:{...tx.payload,refund:rd}}).eq('id',tx.id)}catch(e){details.push({transaction_id:tx.id,status:'refund_failed',error:String(e)})}}
 }
 await db.from('subscriptions').update({status:'cancelled',provider_status:'cancelled',updated_at:new Date().toISOString()}).eq('tenant_id',tenantId);
 await db.from('tenants').update({subscription_status:'cancelled',setup_status:'suspended'}).eq('id',tenantId);
 const failed=details.some(x=>x.status==='refund_failed'); await db.from('cancellation_requests').update({status:failed?'refund_partial':'completed',refund_total:refunded,refund_details:details,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',reqRow.id);
 return json({ok:true,within_cooling_off:within,cooling_off_deadline:deadline.toISOString(),refund_total:refunded,refund_status:failed?'partial':'completed'});
}catch(e){console.error(e);return json({error:'internal_error'},500)}});
