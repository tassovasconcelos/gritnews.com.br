import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim()}
function equal(a:string,b:string){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}

Deno.serve(async(req)=>{try{
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const expected=Deno.env.get("ASAAS_WEBHOOK_TOKEN")||await secret(sb,"ASAAS_WEBHOOK_TOKEN");
  const received=req.headers.get("asaas-access-token")||"";if(!expected||!equal(received,expected))return json({error:"invalid_signature"},401);
  const body=await req.json();const event=String(body.event||"");const checkout=body.checkout||body.payment||{};const providerId=String(checkout.id||"");
  if(!providerId||!event)return json({error:"invalid_payload"},400);
  const eventKey=`asaas:${event}:${providerId}`;
  const {error:eventError}=await sb.from("billing_webhook_events").insert({provider:"asaas",event_key:eventKey,event_type:event,payload:body});
  if(eventError?.code==="23505")return json({ok:true,duplicate:true});if(eventError)return json({error:"event_store_failed"},500);
  const {data:transaction}=await sb.from("srp_billing_transactions").select("id,organization_id,kind,status,amount,external_reference").eq("provider","asaas").eq("provider_id",providerId).maybeSingle();
  if(!transaction)return json({ok:true,ignored:"unknown_checkout"});
  const paid=event==="CHECKOUT_PAID"||event==="PAYMENT_CONFIRMED"||event==="PAYMENT_RECEIVED";
  const failed=event==="CHECKOUT_CANCELED"||event==="CHECKOUT_EXPIRED"||event==="PAYMENT_DELETED"||event==="PAYMENT_REFUNDED";
  if(paid){
    await sb.from("srp_billing_transactions").update({status:"approved",occurred_at:new Date().toISOString(),payload:body,updated_at:new Date().toISOString()}).eq("id",transaction.id);
    if(transaction.kind==="activation")await sb.from("srp_organizations").update({activation_paid_at:new Date().toISOString()}).eq("id",transaction.organization_id).is("activation_paid_at",null);
    if(transaction.kind==="subscription")await sb.from("srp_subscriptions").upsert({organization_id:transaction.organization_id,plan_code:"sr_padeiro_89",provider:"asaas",provider_subscription_id:providerId,status:"active",provider_status:event,monthly_amount:89,updated_at:new Date().toISOString()},{onConflict:"organization_id"});
  }else if(failed)await sb.from("srp_billing_transactions").update({status:event.toLowerCase(),payload:body,updated_at:new Date().toISOString()}).eq("id",transaction.id);
  return json({ok:true});
}catch(e){console.error(e);return json({error:"internal_error"},500)}});
