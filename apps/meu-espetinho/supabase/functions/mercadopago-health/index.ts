import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"https://meuespetinho.gritnews.com.br","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, OPTIONS","Vary":"Origin"};
async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim();}
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const mode=(Deno.env.get("MERCADO_PAGO_MODE")||await secret(sb,"MERCADO_PAGO_MODE")||"production")==="test"?"test":"production";
  const prodAccess=Boolean(Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")||await secret(sb,"MERCADO_PAGO_ACCESS_TOKEN"));
  const prodWebhook=Boolean(Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET")||await secret(sb,"MERCADO_PAGO_WEBHOOK_SECRET"));
  const testAccess=Boolean(Deno.env.get("MERCADO_PAGO_TEST_ACCESS_TOKEN")||await secret(sb,"MERCADO_PAGO_TEST_ACCESS_TOKEN"));
  const testWebhook=Boolean(Deno.env.get("MERCADO_PAGO_TEST_WEBHOOK_SECRET")||await secret(sb,"MERCADO_PAGO_TEST_WEBHOOK_SECRET"));
  const selectedConfigured=mode==="test"?testAccess&&testWebhook:prodAccess&&prodWebhook;
  return new Response(JSON.stringify({service:"mercadopago",mode,configured:selectedConfigured,production:{access_token:prodAccess,webhook_secret:prodWebhook},test:{access_token:testAccess,webhook_secret:testWebhook}}),{headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}});
});
