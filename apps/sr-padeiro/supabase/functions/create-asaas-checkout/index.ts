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
  const {organization_id,kind}=await req.json();if(!organization_id||!["activation","subscription"].includes(kind))return json(req,{error:"invalid_input"},400);
  const {data:member}=await sb.from("srp_members").select("role,active").eq("organization_id",organization_id).eq("user_id",user.id).maybeSingle();
  if(!member?.active||member.role!=="owner")return json(req,{error:"forbidden"},403);
  const {data:org}=await sb.from("srp_organizations").select("id,name,activation_paid_at").eq("id",organization_id).maybeSingle();if(!org)return json(req,{error:"organization_not_found"},404);
  if(kind==="activation"&&org.activation_paid_at)return json(req,{error:"activation_already_paid"},409);
  if(kind==="subscription"&&!org.activation_paid_at)return json(req,{error:"activation_required"},409);

  const mode=(Deno.env.get("ASAAS_MODE")||await secret(sb,"ASAAS_MODE")||"sandbox")==="production"?"production":"sandbox";
  const apiKey=Deno.env.get("ASAAS_API_KEY")||await secret(sb,"ASAAS_API_KEY");if(!apiKey)return json(req,{error:"asaas_not_configured",mode},503);
  const base=mode==="production"?"https://api.asaas.com/v3":"https://api-sandbox.asaas.com/v3";
  const headers={"Content-Type":"application/json","access_token":apiKey,"User-Agent":"GRIT-Hybrid-Gateway/1.0"};
  const externalReference=`srp_asaas_${kind}:${org.id}`;
  const amount=kind==="activation"?199:89;
  const payload={billingTypes:["PIX","CREDIT_CARD"],chargeTypes:[kind==="activation"?"DETACHED":"RECURRENT"],minutesToExpire:60,externalReference,callback:{successUrl:"https://srpadeiro.gritnews.com.br/app?payment=success",cancelUrl:"https://srpadeiro.gritnews.com.br/app?payment=cancel",expiredUrl:"https://srpadeiro.gritnews.com.br/app?payment=expired"},items:[{name:kind==="activation"?"Implantação Sr. Padeiro":"Sr. Padeiro mensal",description:org.name,quantity:1,value:amount}]};
  const response=await fetch(`${base}/checkouts`,{method:"POST",headers,body:JSON.stringify(payload)});const data=await response.json();
  if(!response.ok)return json(req,{error:"asaas_error",mode,provider_status:response.status},502);
  const checkoutUrl=`${mode==="production"?"https://asaas.com":"https://sandbox.asaas.com"}/checkoutSession/show?id=${encodeURIComponent(data.id)}`;
  await sb.from("srp_billing_transactions").insert({organization_id:org.id,kind,provider:"asaas",provider_id:String(data.id),status:"pending",amount,currency:"BRL",external_reference:externalReference,checkout_url:checkoutUrl,payload:{checkout_id:data.id,_integration_mode:mode}});
  return json(req,{checkout_url:checkoutUrl,checkout_id:data.id,mode});
}catch(e){console.error(e);return json(req,{error:"internal_error"},500)}});
