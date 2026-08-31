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
  const {data:tenant}=await sb.from("tenants").select("id,name,owner_user_id").eq("id",tenant_id).maybeSingle(); if(!tenant||tenant.owner_user_id!==user.id)return json({error:"forbidden"},403);
  const external=`activation:${tenant.id}`;
  const pref=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${mp}`,"Content-Type":"application/json","X-Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({items:[{title:`Ativação Meu Espetinho - ${tenant.name}`,quantity:1,currency_id:"BRL",unit_price:199}],payer:{email:user.email},external_reference:external,back_urls:{success:"https://meuespetinho.gritnews.com.br/app?payment=success",pending:"https://meuespetinho.gritnews.com.br/app?payment=pending",failure:"https://meuespetinho.gritnews.com.br/app?payment=failure"},auto_return:"approved",notification_url:"https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/mercadopago-webhook"})});
  const data=await pref.json(); if(!pref.ok)return json({error:"mercado_pago_error",mode,provider_status:pref.status,details:data},502);
  const checkoutUrl=mode==="test"?(data.sandbox_init_point||data.init_point):data.init_point;
  await sb.from("billing_transactions").insert({tenant_id:tenant.id,kind:"activation",provider_id:String(data.id),status:"pending",amount:199,external_reference:external,checkout_url:checkoutUrl||null,payload:{...data,_integration_mode:mode}});
  return json({checkout_url:checkoutUrl,preference_id:data.id,mode});
}catch(e){console.error(e);return json({error:"internal_error"},500)}});
