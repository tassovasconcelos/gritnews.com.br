import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim()}

Deno.serve(async(req)=>{try{
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  const auth=req.headers.get("Authorization");if(!auth)return json({error:"unauthorized"},401);
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:{user},error}=await sb.auth.getUser(auth.replace("Bearer ",""));if(error||!user)return json({error:"unauthorized"},401);
  const {data:admin}=await sb.from("admin_users").select("role,active").eq("user_id",user.id).maybeSingle();
  if(!admin?.active||String(admin.role).toLowerCase()!=="superadmin")return json({error:"forbidden"},403);
  const {kind,payer_email}=await req.json();
  if(!["one_time","subscription"].includes(kind)||!/^\S+@\S+\.\S+$/.test(String(payer_email||"")))return json({error:"invalid_input"},400);
  const mode=(Deno.env.get("MERCADO_PAGO_MODE")||await secret(sb,"MERCADO_PAGO_MODE")||"production")==="test"?"test":"production";
  const tokenName=mode==="test"?"MERCADO_PAGO_TEST_ACCESS_TOKEN":"MERCADO_PAGO_ACCESS_TOKEN";
  const accessToken=Deno.env.get(tokenName)||await secret(sb,tokenName);if(!accessToken)return json({error:"mercado_pago_not_configured"},503);
  const runId=crypto.randomUUID();const reference=`grit_homologation:${kind}:${runId}`;
  const endpoint=kind==="one_time"?"https://api.mercadopago.com/checkout/preferences":"https://api.mercadopago.com/preapproval";
  const body=kind==="one_time"?{items:[{title:"Homologação GRIT — pagamento único",quantity:1,currency_id:"BRL",unit_price:1}],payer:{email:payer_email},external_reference:reference,back_urls:{success:"https://srpadeiro.gritnews.com.br/homologacao-gateway?result=success",pending:"https://srpadeiro.gritnews.com.br/homologacao-gateway?result=pending",failure:"https://srpadeiro.gritnews.com.br/homologacao-gateway?result=failure"},auto_return:"approved",notification_url:"https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/mercadopago-webhook"}:{reason:"Homologação GRIT — recorrência mensal",external_reference:reference,payer_email,auto_recurring:{frequency:1,frequency_type:"months",transaction_amount:1,currency_id:"BRL"},back_url:"https://srpadeiro.gritnews.com.br/homologacao-gateway?result=subscription",status:"pending"};
  const response=await fetch(endpoint,{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json","X-Idempotency-Key":runId},body:JSON.stringify(body)});const data=await response.json();
  if(!response.ok)return json({error:"mercado_pago_error",provider_status:response.status},502);
  return json({checkout_url:mode==="test"?(data.sandbox_init_point||data.init_point):data.init_point,reference,amount:1,currency:"BRL",kind,mode});
}catch(e){console.error(e);return json({error:"internal_error"},500)}});
