import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins=new Set(["https://srpadeiro.gritnews.com.br","http://localhost:5173","http://localhost:4173"]);
const cors=(req:Request)=>{const origin=req.headers.get("Origin")||"";return {"Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://srpadeiro.gritnews.com.br","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}};
const json=(req:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors(req),"Content-Type":"application/json","Cache-Control":"no-store"}});
async function secret(sb:any,name:string){const {data}=await sb.rpc("platform_secret_get",{secret_name:name});return String(data||"").trim()}

Deno.serve(async(req)=>{try{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method_not_allowed"},405);
  const auth=req.headers.get("Authorization");if(!auth)return json(req,{error:"unauthorized"},401);
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:{user}}=await sb.auth.getUser(auth.replace("Bearer ",""));if(!user)return json(req,{error:"unauthorized"},401);
  const apiKey=Deno.env.get("ASAAS_API_KEY")||await secret(sb,"ASAAS_API_KEY");
  const mode=(Deno.env.get("ASAAS_MODE")||await secret(sb,"ASAAS_MODE")||"sandbox")==="production"?"production":"sandbox";
  return json(req,{configured:Boolean(apiKey),mode});
}catch(e){console.error(e);return json(req,{error:"internal_error"},500)}});
