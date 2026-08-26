import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim()}

Deno.serve(async(req)=>{try{
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  const auth=req.headers.get("Authorization");if(!auth)return json({error:"unauthorized"},401);
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:{user}}=await sb.auth.getUser(auth.replace("Bearer ",""));if(!user)return json({error:"unauthorized"},401);
  const apiKey=Deno.env.get("ASAAS_API_KEY")||await secret(sb,"ASAAS_API_KEY");
  const mode=(Deno.env.get("ASAAS_MODE")||await secret(sb,"ASAAS_MODE")||"sandbox")==="production"?"production":"sandbox";
  return json({configured:Boolean(apiKey),mode});
}catch(e){console.error(e);return json({error:"internal_error"},500)}});
