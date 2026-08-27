import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim()}
async function hmacHex(secretValue:string,message:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secretValue),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));return [...new Uint8Array(signature)].map(v=>v.toString(16).padStart(2,"0")).join("")}
function safeEqual(left:string,right:string){if(left.length!==right.length)return false;let difference=0;for(let i=0;i<left.length;i++)difference|=left.charCodeAt(i)^right.charCodeAt(i);return difference===0}
function money(value:unknown,expected:number){return Number.isFinite(Number(value))&&Math.abs(Number(value)-expected)<0.001}

Deno.serve(async(request)=>{
  if(request.method!=="POST")return json({ok:true});
  try{
    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const mode=Deno.env.get("MERCADO_PAGO_MODE")||await secret(sb,"MERCADO_PAGO_MODE")||"production";
    const tokenName=mode==="test"?"MERCADO_PAGO_TEST_ACCESS_TOKEN":"MERCADO_PAGO_ACCESS_TOKEN";
    const accessToken=Deno.env.get(tokenName)||await secret(sb,tokenName);
    const webhookSecret=Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET")||await secret(sb,"MERCADO_PAGO_WEBHOOK_SECRET");
    if(!accessToken||!webhookSecret)return json({error:"not_configured"},503);

    const url=new URL(request.url);const signature=request.headers.get("x-signature")||"";const requestId=request.headers.get("x-request-id")||"";
    const parts=Object.fromEntries(signature.split(",").map(part=>part.trim().split("=")));
    const timestamp=parts.ts||"";const received=parts.v1||"";const signedId=(url.searchParams.get("data.id")||url.searchParams.get("id")||"").toLowerCase();
    const manifest=[signedId?`id:${signedId};`:"",requestId?`request-id:${requestId};`:"",timestamp?`ts:${timestamp};`:""].join("");
    if(!manifest||!received||!safeEqual(await hmacHex(webhookSecret,manifest),received))return json({error:"invalid_signature"},401);

    const body=await request.json().catch(()=>({}));const type=String(body?.type||url.searchParams.get("type")||"");const providerId=String(body?.data?.id||url.searchParams.get("data.id")||url.searchParams.get("id")||"");
    if(!type||!providerId)return json({ok:true,ignored:true});
    const eventKey=`${type}:${providerId}`;
    const {data:claim,error:claimError}=await sb.from("billing_webhook_events").upsert({event_key:eventKey,event_type:type,provider_id:providerId,payload:{processing:true}},{onConflict:"event_key",ignoreDuplicates:true}).select("id").maybeSingle();
    if(claimError)throw claimError;if(!claim)return json({ok:true,duplicate:true});

    const endpoints:Record<string,string>={
      payment:`https://api.mercadopago.com/v1/payments/${providerId}`,
      subscription_preapproval:`https://api.mercadopago.com/preapproval/${providerId}`,
      subscription_authorized_payment:`https://api.mercadopago.com/authorized_payments/${providerId}`,
    };
    if(!endpoints[type]){await sb.from("billing_webhook_events").update({payload:{ignored:true}}).eq("id",claim.id);return json({ok:true,ignored:true})}
    const providerResponse=await fetch(endpoints[type],{headers:{Authorization:`Bearer ${accessToken}`}});const data=await providerResponse.json();
    if(!providerResponse.ok){await sb.from("billing_webhook_events").delete().eq("id",claim.id);return json({error:"provider_lookup_failed"},502)}
    if(typeof data.live_mode==="boolean"&&data.live_mode!==(mode!=="test")){await sb.from("billing_webhook_events").update({payload:data}).eq("id",claim.id);return json({error:"environment_mismatch"},422)}
    await sb.from("billing_webhook_events").update({payload:data}).eq("id",claim.id);

    const reference=String(data.external_reference||"");
    if(type==="payment"&&reference.startsWith("srp_activation:")){
      const organizationId=reference.split(":")[1];
      if(data.status!=="approved"||data.currency_id!=="BRL"||!money(data.transaction_amount,199))return json({error:"payment_validation_failed"},422);
      const {data:transaction}=await sb.from("srp_billing_transactions").select("id,amount").eq("organization_id",organizationId).eq("kind","activation").eq("external_reference",`srp_activation:${organizationId}`).eq("status","pending").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(!transaction||!money(transaction.amount,199))return json({error:"payment_validation_failed"},422);
      await sb.from("srp_billing_transactions").update({status:data.status,provider_id:String(data.id),payload:data,updated_at:new Date().toISOString()}).eq("id",transaction.id);
      await sb.from("srp_organizations").update({activation_paid_at:new Date().toISOString()}).eq("id",organizationId);
    }else if(type==="payment"&&reference.startsWith("activation:")){
      const tenantId=reference.split(":")[1];
      if(data.status!=="approved"||data.currency_id!=="BRL"||!money(data.transaction_amount,199))return json({error:"payment_validation_failed"},422);
      const {data:transaction}=await sb.from("billing_transactions").select("id,amount").eq("tenant_id",tenantId).eq("kind","activation").eq("external_reference",`activation:${tenantId}`).maybeSingle();
      if(!transaction||!money(transaction.amount,199))return json({error:"payment_validation_failed"},422);
      await sb.from("billing_transactions").update({status:data.status,provider_id:String(data.id),payload:data,updated_at:new Date().toISOString()}).eq("id",transaction.id);
      const now=new Date().toISOString();const {data:tenant}=await sb.from("tenants").select("owner_user_id").eq("id",tenantId).single();
      await sb.from("tenants").update({subscription_status:"pending",setup_status:"pending_setup",activation_paid_at:now,setup_requested_at:now}).eq("id",tenantId);
      if(tenant?.owner_user_id)await sb.from("setup_requests").upsert({tenant_id:tenantId,owner_user_id:tenant.owner_user_id,status:"pending",requested_at:now,updated_at:now},{onConflict:"tenant_id"});
    }else if(type==="subscription_preapproval"){
      const mapped=data.status==="authorized"?"active":data.status==="paused"?"paused":data.status==="cancelled"?"cancelled":"pending";
      const amount=data.auto_recurring?.transaction_amount;const currency=data.auto_recurring?.currency_id;
      if(reference.startsWith("srp_subscription:")){
        const organizationId=reference.split(":")[1];
        if(!organizationId||currency!=="BRL"||!money(amount,89))return json({error:"subscription_validation_failed"},422);
        await sb.from("srp_subscriptions").update({provider_status:data.status,status:mapped,provider_subscription_id:String(data.id),updated_at:new Date().toISOString()}).eq("organization_id",organizationId).eq("plan_code","sr_padeiro_89");
      }else if(reference.startsWith("subscription:")){
        const tenantId=reference.split(":")[1];
        if(!tenantId||currency!=="BRL"||!money(amount,89))return json({error:"subscription_validation_failed"},422);
        await sb.from("subscriptions").update({provider_status:data.status,status:mapped,provider_subscription_id:String(data.id),updated_at:new Date().toISOString()}).eq("tenant_id",tenantId).eq("plan_code","meu_espetinho_89");
        await sb.from("tenants").update({subscription_status:mapped}).eq("id",tenantId);
      }else if(reference.startsWith("grit_homologation:subscription:")){
        if(currency!=="BRL"||!money(amount,1))return json({error:"homologation_validation_failed"},422);
      }else return json({error:"subscription_reference_invalid"},422);
    }else if(type==="subscription_authorized_payment"){
      const preapproval=String(data.preapproval_id||"");if(data.currency_id!=="BRL")return json({error:"subscription_payment_validation_failed"},422);
      if(money(data.transaction_amount,1)){
        const testResponse=await fetch(`https://api.mercadopago.com/preapproval/${preapproval}`,{headers:{Authorization:`Bearer ${accessToken}`}});const testSubscription=await testResponse.json();
        if(!testResponse.ok||!String(testSubscription.external_reference||"").startsWith("grit_homologation:subscription:"))return json({error:"subscription_payment_validation_failed"},422);
        return json({ok:true,homologation:true});
      }
      if(!money(data.transaction_amount,89))return json({error:"subscription_payment_validation_failed"},422);
      const {data:srpSubscription}=await sb.from("srp_subscriptions").select("organization_id").eq("provider_subscription_id",preapproval).eq("plan_code","sr_padeiro_89").maybeSingle();
      if(srpSubscription?.organization_id){
        await sb.from("srp_billing_transactions").upsert({organization_id:srpSubscription.organization_id,kind:"subscription",provider_id:String(data.id),provider_subscription_id:preapproval,status:data.status||"approved",amount:89,currency:"BRL",external_reference:`srp_subscription:${srpSubscription.organization_id}`,payload:data,occurred_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"provider_id"});
      }else{
        const {data:meSubscription}=await sb.from("subscriptions").select("tenant_id").eq("provider_subscription_id",preapproval).eq("plan_code","meu_espetinho_89").maybeSingle();
        if(!meSubscription?.tenant_id)return json({error:"subscription_not_found"},422);
        await sb.from("billing_transactions").insert({tenant_id:meSubscription.tenant_id,kind:"subscription",provider_id:String(data.id),status:data.status||"approved",amount:89,external_reference:preapproval,payload:data});
      }
    }
    return json({ok:true});
  }catch(error){console.error(error);return json({error:"internal_error"},500)}
});

