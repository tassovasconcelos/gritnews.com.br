// Supabase Edge Function: cp-invite-user
// Deploy with verify_jwt=true. Secrets live only in Supabase Edge environment.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const json=(value:unknown,status=200,origin="")=>new Response(JSON.stringify(value),{status,headers:{
 "Content-Type":"application/json","Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization, apikey, content-type","Vary":"Origin"}});
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")||"";
 const allowed=(Deno.env.get("APP_ALLOWED_ORIGINS")||"").split(",").map(x=>x.trim()).filter(Boolean);
 if(origin&&!allowed.includes(origin))return json({error:"Origem não autorizada"},403,"");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization, apikey, content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});
 if(req.method!=="POST")return json({error:"Método não permitido"},405,origin);
 try{
  const url=Deno.env.get("SUPABASE_URL")!;
  const publicKey=Deno.env.get("SUPABASE_ANON_KEY")!;
  const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if(!url||!publicKey||!secret) return json({error:"Backend não configurado"},503,origin);
  const token=(req.headers.get("authorization")||"").replace(/^Bearer /i,"");
  if(!token)return json({error:"Autenticação requerida"},401,origin);
  const callerClient=createClient(url,publicKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:authError}=await callerClient.auth.getUser(token);
  if(authError||!user)return json({error:"Sessão inválida"},401,origin);
  const payload=await req.json();
  const {organization_id,company_id,department_id,email,role}=payload;
  const roles=["group_admin","director","controller","finance","buyer","warehouse","manager","requester"];
  if(typeof organization_id!=="string"||typeof email!=="string"||!/.+@.+\..+/.test(email)||!roles.includes(role))
   return json({error:"Convite inválido"},400,origin);
  const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:membership,error:membershipError}=await admin.from("cp_memberships").select("id")
   .eq("organization_id",organization_id).eq("user_id",user.id)
   .eq("role","group_admin").eq("active",true).is("company_id",null).limit(1);
  if(membershipError||!membership?.length)return json({error:"Alçada administrativa insuficiente"},403,origin);
  if(company_id){
   const {data:company}=await admin.from("cp_companies").select("id").eq("organization_id",organization_id).eq("id",company_id).single();
   if(!company)return json({error:"Empresa não pertence à organização"},400,origin);
  }
  if(department_id){
   if(!company_id)return json({error:"Setor exige empresa"},400,origin);
   const {data:department}=await admin.from("cp_departments").select("id").eq("company_id",company_id).eq("id",department_id).single();
   if(!department)return json({error:"Setor não pertence à empresa"},400,origin);
  }
  if(["manager","requester","warehouse"].includes(role)&&!company_id)
   return json({error:"Este perfil requer empresa"},400,origin);
  const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase());
  if(inviteError||!invited.user){
   return json({error:"Não foi possível convidar: "+(inviteError?.message||"Usuário já existente")},409,origin);
  }
  const {error:linkError}=await admin.from("cp_memberships").insert({
   organization_id,user_id:invited.user.id,company_id:company_id||null,
   department_id:department_id||null,role,active:true
  });
  if(linkError)return json({error:"Convite enviado, mas vínculo não criado; regularização administrativa necessária"},500,origin);
  return json({success:true,message:"Convite enviado e papel atribuído ao usuário.",email:email.toLowerCase()},200,origin);
 }catch{return json({error:"Falha inesperada no serviço de convite"},500,origin);}
});
