import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"https://meuespetinho.gritnews.com.br","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}});

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  try{
    const auth=req.headers.get("Authorization"); if(!auth)return json({error:"unauthorized"},401);
    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:{user},error}=await sb.auth.getUser(auth.replace("Bearer ","")); if(error||!user)return json({error:"unauthorized"},401);
    const {data:admin}=await sb.from("admin_users").select("active,role").eq("user_id",user.id).maybeSingle();
    if(!admin?.active||!["superadmin","admin"].includes(admin.role))return json({error:"forbidden"},403);
    const body=await req.json();
    const accessToken=String(body?.access_token||"").trim(); const webhookSecret=String(body?.webhook_secret||"").trim();
    const mode=body?.mode==="test"?"test":"production"; if(!accessToken||!webhookSecret)return json({error:"missing_credentials"},400);
    const probe=await fetch("https://api.mercadopago.com/users/me",{headers:{Authorization:`Bearer ${accessToken}`}}); const account=await probe.json().catch(()=>({}));
    if(!probe.ok)return json({error:"invalid_access_token",provider_status:probe.status,provider_message:account?.message||null},400);
    const accessName=mode==="test"?"MERCADO_PAGO_TEST_ACCESS_TOKEN":"MERCADO_PAGO_ACCESS_TOKEN";
    const webhookName=mode==="test"?"MERCADO_PAGO_TEST_WEBHOOK_SECRET":"MERCADO_PAGO_WEBHOOK_SECRET";
    const a=await sb.rpc("platform_secret_set",{secret_name:accessName,secret_value:accessToken}); if(a.error)return json({error:"vault_access_token_failed"},500);
    const w=await sb.rpc("platform_secret_set",{secret_name:webhookName,secret_value:webhookSecret}); if(w.error)return json({error:"vault_webhook_failed"},500);
    const m=await sb.rpc("platform_secret_set",{secret_name:"MERCADO_PAGO_MODE",secret_value:mode}); if(m.error)return json({error:"vault_mode_failed"},500);
    return json({ok:true,mode,account_id:account.id||null,nickname:account.nickname||null});
  }catch(e){console.error(e);return json({error:"internal_error"},500)}
});
