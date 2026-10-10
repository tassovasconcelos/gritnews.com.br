import { createClient } from "npm:@supabase/supabase-js@2.57.0";
// Activate previously approved directory records only after Supabase verifies mailbox ownership.
// Official GRIT technical owner has exactly one pre-registered email; no hardcoded password.
const projectOrigin="https://consumo-pro-360-grit-tassos-projects-167133f0.vercel.app";
const reply=(body:unknown,status:number,origin:string)=>new Response(JSON.stringify(body),{status,
 headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")||"";
 const origins=(Deno.env.get("APP_ALLOWED_ORIGINS")||projectOrigin).split(",").map(s=>s.trim());
 if(origin&&!origins.includes(origin))return reply({error:"Origem não autorizada"},403,"");
 if(req.method==="OPTIONS")return reply({},204,origin);
 if(req.method!=="POST")return reply({error:"Método inválido"},405,origin);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret)return reply({error:"Serviço indisponível"},503,origin);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer /i,"");
 if(!token)return reply({error:"Login obrigatório"},401,origin);
 const caller=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:uErr}=await caller.auth.getUser(token);
 if(uErr||!user||!user.email||!user.email_confirmed_at)return reply({error:"Verifique seu e-mail para ativar o acesso"},401,origin);
 const normalized=user.email.trim().toLowerCase();
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const {data:matches,error:mErr}=await admin.from("cp_user_directory").select("*")
   .eq("email",normalized).in("status",["pending","invited","active"]);
  if(mErr)throw mErr;
  if(!matches?.length)return reply({error:"Seu e-mail ainda não está autorizado no Grupo"},403,origin);
  if(matches.length!==1)return reply({error:"Cadastro duplicado entre organizações; requer revisão"},409,origin);
  const directory=matches[0];
  if(directory.auth_user_id && directory.auth_user_id!==user.id)
   return reply({error:"Convite pertence a outra identidade de autenticação"},403,origin);
  if(directory.requested_role==="grit_superadmin"&&
     (normalized!=="gritsolucoes@gmail.com"||directory.company_id||directory.department_id))
   return reply({error:"Identidade GRIT não corresponde ao registro oficial"},403,origin);
  if(directory.status==="pending"&&directory.requested_role!=="grit_superadmin")
   return reply({error:"Convite ainda não enviado pelo administrador"},403,origin);
  if(directory.status==="active")return reply({success:true,status:"active",message:"Acesso já ativo"},200,origin);

  const {data:links,error:linksErr}=await admin.from("cp_memberships").select("id,role,active,company_id,department_id")
   .eq("organization_id",directory.organization_id).eq("user_id",user.id);
  if(linksErr)throw linksErr;
  if(directory.requested_role==="grit_superadmin"){
   if(links?.some(l=>l.role!=="grit_superadmin"))return reply({error:"Vínculos incompatíveis na identidade técnica"},403,origin);
   if(!links?.length){
    const {error:insertErr}=await admin.from("cp_memberships").insert({
     organization_id:directory.organization_id,user_id:user.id,
     company_id:null,department_id:null,role:"grit_superadmin",active:true
    });
    if(insertErr)throw insertErr;
   }else{
    const {error:activateErr}=await admin.from("cp_memberships").update({active:true}).eq("id",links[0].id);
    if(activateErr)throw activateErr;
   }
  }else{
   if(!links?.length||links.length!==1)return reply({error:"Vínculo de convite ausente; solicite regularização"},409,origin);
   const link=links[0];
   if(link.role!==directory.requested_role||link.company_id!==directory.company_id||
       link.department_id!==directory.department_id)
    return reply({error:"O vínculo do convite não corresponde ao cadastro"},409,origin);
   const {error:activateErr}=await admin.from("cp_memberships").update({active:true}).eq("id",link.id);
   if(activateErr)throw activateErr;
  }
  const {error:statusErr}=await admin.from("cp_user_directory").update({
   auth_user_id:user.id,status:"active",activated_at:new Date().toISOString(),updated_at:new Date().toISOString()
  }).eq("id",directory.id).in("status",["pending","invited"]);
  if(statusErr)throw statusErr;
  const {error:auditErr}=await admin.from("cp_audit_events").insert({
   organization_id:directory.organization_id,actor_id:user.id,entity:"user_directory",
   entity_id:directory.id,action:"verified_access_activated",
   detail:{email:normalized,role:directory.requested_role,provider:"supabase-auth"}
  });
  if(auditErr)throw auditErr;
  return reply({success:true,status:"active",message:"E-mail validado e acesso autorizado"},200,origin);
 }catch(e){
  return reply({error:"Falha ao ativar: "+(e instanceof Error?e.message:"erro não identificado")},500,origin);
 }
});
