import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});

async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim();}

Deno.serve(async(req)=>{try{
  const auth=req.headers.get("Authorization"); if(!auth)return json({error:"unauthorized"},401);
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const mode=(Deno.env.get("MERCADO_PAGO_MODE")||await secret(sb,"MERCADO_PAGO_MODE")||"production")==="test"?"test":"production";
  const tokenName=mode==="test"?"MERCADO_PAGO_TEST_ACCESS_TOKEN":"MERCADO_PAGO_ACCESS_TOKEN";
  const mp=Deno.env.get(tokenName)||await secret(sb,tokenName);
  if(!mp)return json({error:mode==="test"?"mercado_pago_test_not_configured":"mercado_pago_not_configured",mode},503);
  const {data:{user},error}=await sb.auth.getUser(auth.replace("Bearer ","")); if(error||!user)return json({error:"unauthorized"},401);
  const {tenant_id}=await req.json();
  const {data:tenant}=await sb.from("tenants").select("id,name,owner_user_id").eq("id",tenant_id).maybeSingle();
  if(!tenant||tenant.owner_user_id!==user.id)return json({error:"forbidden"},403);
  const body={reason:`Meu Espetinho - ${tenant.name}`,external_reference:`subscription:${tenant.id}`,payer_email:user.email,auto_recurring:{frequency:1,frequency_type:"months",transaction_amount:89,currency_id:"BRL"},back_url:"https://meuespetinho.gritnews.com.br/app?subscription=return",status:"pending"};
  const r=await fetch("https://api.mercadopago.com/preapproval",{method:"POST",headers:{Authorization:`Bearer ${mp}`,"Content-Type":"application/json","X-Idempotency-Key":crypto.randomUUID()},body:JSON.stringify(body)});
  const data=await r.json(); if(!r.ok)return json({error:"mercado_pago_error",mode,provider_status:r.status,details:data},502);
  const checkoutUrl=mode==="test"?(data.sandbox_init_point||data.init_point):data.init_point;
  await sb.from("subscriptions").upsert({tenant_id:tenant.id,plan_code:"meu_espetinho_89",provider:"mercadopago",provider_subscription_id:String(data.id),status:data.status==="authorized"?"active":"pending",provider_status:data.status,payer_email:user.email,checkout_url:checkoutUrl||null,updated_at:new Date().toISOString()},{onConflict:"tenant_id"});
  await sb.from("billing_transactions").insert({tenant_id:tenant.id,kind:"subscription",provider_id:String(data.id),status:data.status||"pending",amount:89,external_reference:`subscription:${tenant.id}`,checkout_url:checkoutUrl||null,payload:{...data,_integration_mode:mode}});
  return json({checkout_url:checkoutUrl,subscription_id:data.id,status:data.status,mode});
}catch(e){console.error(e);return json({error:"internal_error"},500)}});
