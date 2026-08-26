import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim()}

Deno.serve(async(req)=>{
  try{
    if(req.method!=="POST")return json({error:"method_not_allowed"},405);
    const auth=req.headers.get("Authorization");
    if(!auth)return json({error:"unauthorized"},401);
    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:{user},error:userError}=await sb.auth.getUser(auth.replace("Bearer ",""));
    if(userError||!user)return json({error:"unauthorized"},401);
    const {organization_id}=await req.json();
    const {data:member}=await sb.from("srp_members").select("role,active").eq("organization_id",organization_id).eq("user_id",user.id).maybeSingle();
    if(!member?.active||member.role!=="owner")return json({error:"forbidden"},403);
    const {data:org}=await sb.from("srp_organizations").select("id,name,activation_paid_at").eq("id",organization_id).maybeSingle();
    if(!org)return json({error:"organization_not_found"},404);
    if(!org.activation_paid_at)return json({error:"activation_required"},409);

    const mode=(Deno.env.get("MERCADO_PAGO_MODE")||await secret(sb,"MERCADO_PAGO_MODE")||"production")==="test"?"test":"production";
    const tokenName=mode==="test"?"MERCADO_PAGO_TEST_ACCESS_TOKEN":"MERCADO_PAGO_ACCESS_TOKEN";
    const accessToken=Deno.env.get(tokenName)||await secret(sb,tokenName);
    if(!accessToken)return json({error:mode==="test"?"mercado_pago_test_not_configured":"mercado_pago_not_configured",mode},503);

    const externalReference=`srp_subscription:${org.id}`;
    const body={
      reason:`Sr. Padeiro - ${org.name}`,
      external_reference:externalReference,
      payer_email:user.email,
      auto_recurring:{frequency:1,frequency_type:"months",transaction_amount:89,currency_id:"BRL"},
      back_url:"https://srpadeiro.gritnews.com.br/app?subscription=return",
      status:"pending",
    };
    const response=await fetch("https://api.mercadopago.com/preapproval",{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json","X-Idempotency-Key":crypto.randomUUID()},body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok)return json({error:"mercado_pago_error",mode,provider_status:response.status},502);
    const checkoutUrl=mode==="test"?(data.sandbox_init_point||data.init_point):data.init_point;
    await sb.from("srp_subscriptions").upsert({organization_id:org.id,plan_code:"sr_padeiro_89",provider:"mercadopago",provider_subscription_id:String(data.id),status:data.status==="authorized"?"active":"pending",provider_status:data.status,monthly_amount:89,payer_email:user.email,checkout_url:checkoutUrl||null,updated_at:new Date().toISOString()},{onConflict:"organization_id"});
    return json({checkout_url:checkoutUrl,subscription_id:data.id,status:data.status,mode});
  }catch(error){console.error(error);return json({error:"internal_error"},500)}
});
