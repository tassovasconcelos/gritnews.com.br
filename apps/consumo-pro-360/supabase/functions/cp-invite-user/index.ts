import { createClient } from "npm:@supabase/supabase-js@2.57.0";

// Corporate user invitations and governance. JWT + database membership is mandatory.
const projectOrigin="https://consumo-pro-360-grit-tassos-projects-167133f0.vercel.app";
function response(body:unknown,status:number,origin:string){
 return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json",
 "Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization, apikey, content-type",
 "Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
}
const now=()=>new Date().toISOString();
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")||"";
 const allowed=(Deno.env.get("APP_ALLOWED_ORIGINS")||projectOrigin).split(",").map(x=>x.trim()).filter(Boolean);
 // Authorization is enforced by JWT and org role; CORS is not used as an authorization boundary.
 const allowedPreview=/^https:\/\/consumo-pro-360-grit-[a-z0-9-]+-tassos-projects-167133f0\.vercel\.app$/.test(origin);
 if(origin&&!allowed.includes(origin)&&!allowedPreview)return response({error:"Origem não autorizada para administração"},403,"");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});
 if(req.method!=="POST")return response({error:"Método não permitido"},405,origin);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret)return response({error:"Serviço não configurado"},503,origin);
 const authToken=(req.headers.get("authorization")||"").replace(/^Bearer /i,"");
 if(!authToken)return response({error:"Autenticação necessária"},401,origin);
 const caller=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await caller.auth.getUser(authToken);
 if(authError||!user||!user.email_confirmed_at)return response({error:"Conta não verificada"},401,origin);
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const p=await req.json();
  const organizationId=String(p.organization_id||"");
  const action=String(p.action||"invite");
  if(!/^[0-9a-f-]{36}$/i.test(organizationId))return response({error:"Grupo inválido"},400,origin);
  const {data:membership,error:memberErr}=await admin.from("cp_memberships").select("role")
   .eq("organization_id",organizationId).eq("user_id",user.id).eq("active",true)
   .is("company_id",null).in("role",["group_admin","grit_superadmin"]);
  if(memberErr||!membership?.length)return response({error:"Acesso de administração negado"},403,origin);
  const groupAdmin=membership.some(m=>m.role==="group_admin");
  const grit=membership.some(m=>m.role==="grit_superadmin");
  const targetId=String(p.id||"");
  const sensitiveRoles=["group_admin","director","finance"];
  const role=String(p.role||"");
  const roles=["group_admin","director","controller","finance","buyer","warehouse","manager","requester"];
  if((action==="invite"||action==="update")&&(!roles.includes(role)||(sensitiveRoles.includes(role)&&!groupAdmin)))
   return response({error:"Perfil não autorizado pela sua alçada"},403,origin);
  const companyId=p.company_id||null,departmentId=p.department_id||null;
  if((action==="invite"||action==="update")){
   if(companyId){
    const {data:c}=await admin.from("cp_companies").select("id").eq("id",companyId).eq("organization_id",organizationId).eq("active",true).maybeSingle();
    if(!c)return response({error:"Empresa fora do Grupo"},400,origin);
   }
   if(departmentId){
    const {data:d}=await admin.from("cp_departments").select("id").eq("id",departmentId).eq("company_id",companyId).eq("active",true).maybeSingle();
    if(!d)return response({error:"Setor não corresponde à empresa"},400,origin);
   }
   if(["requester","manager","warehouse"].includes(role)&&!companyId)
    return response({error:"Selecione empresa para o perfil"},400,origin);
   if(departmentId&&!companyId)return response({error:"Setor exige empresa"},400,origin);
  }
  async function audit(entityId:string,event:string,details:Record<string,unknown>){
   const a=await admin.from("cp_audit_events").insert({
    organization_id:organizationId,actor_id:user!.id,entity:"user_directory",entity_id:entityId,
    action:event,detail:details});
   if(a.error)throw new Error("Falha no registro de auditoria");
  }
  if(action==="invite"){
   const email=String(p.email||"").trim().toLowerCase();
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email.length>254)
    return response({error:"E-mail inválido"},400,origin);
   if(email==="gritsolucoes@gmail.com")return response({error:"Superadmin GRIT protegido por ativação específica"},403,origin);
   const {data:existing}=await admin.from("cp_user_directory").select("id,status")
    .eq("organization_id",organizationId).eq("email",email).maybeSingle();
   if(existing&&existing.status!=="pending")return response({error:"Cadastro já existente; use editar ou reativar"},409,origin);
   const fullName=String(p.full_name||"").trim().slice(0,140);
   if(fullName.length<2)return response({error:"Nome completo obrigatório"},400,origin);
   let id=existing?.id as string|undefined;
   if(id){
    const {error}=await admin.from("cp_user_directory").update({full_name:fullName,
     position_title:String(p.position_title||"").slice(0,120),phone:String(p.phone||"").slice(0,40),
     company_id:companyId,department_id:departmentId,requested_role:role,updated_at:now()}).eq("id",id);
    if(error)throw error;
   }else{
    const {data,error}=await admin.from("cp_user_directory").insert({organization_id:organizationId,
     email,full_name:fullName,position_title:String(p.position_title||"").slice(0,120),
     phone:String(p.phone||"").slice(0,40),company_id:companyId,department_id:departmentId,
     requested_role:role,status:"pending"}).select("id").single();
    if(error)throw error;id=data.id;
   }
   const {data:invited,error:inviteErr}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:origin||projectOrigin});
   if(inviteErr||!invited?.user){
    await audit(id!,"invite_failed",{email,reason:"Auth invite unsuccessful"});
    return response({error:"Convite não enviado: "+(inviteErr?.message||"conta já existente")},409,origin);
   }
   const {error:linkError}=await admin.from("cp_memberships").insert({
    organization_id:organizationId,user_id:invited.user.id,company_id:companyId,
    department_id:departmentId,role,active:false});
   if(linkError){await audit(id!,"invite_link_failed",{email});
    return response({error:"Convite enviado, mas vínculo exige reconciliação administrativa"},500,origin);}
   const {error:statusError}=await admin.from("cp_user_directory").update({
    auth_user_id:invited.user.id,status:"invited",invitation_sent_at:now(),updated_at:now()
   }).eq("id",id);
   if(statusError)throw statusError;
   await audit(id!,"invited",{email,role,company_id:companyId,department_id:departmentId});
   return response({success:true,status:"invited",message:"Convite enviado. Ativação somente após comprovação do e-mail."},200,origin);
  }
  if(!/^[0-9a-f-]{36}$/i.test(targetId))return response({error:"Cadastro inválido"},400,origin);
  const {data:directory,error:dErr}=await admin.from("cp_user_directory").select("*")
   .eq("organization_id",organizationId).eq("id",targetId).maybeSingle();
  if(dErr||!directory)return response({error:"Usuário não localizado"},404,origin);
  if(directory.requested_role==="grit_superadmin")
   return response({error:"Acesso GRIT protegido: somente processo de governança separado"},403,origin);
  if(directory.auth_user_id===user.id)
   return response({error:"Não é permitido editar o próprio privilégio"},403,origin);
  if(!groupAdmin&&sensitiveRoles.includes(directory.requested_role))
   return response({error:"Alçada administrativa insuficiente"},403,origin);
  if(action==="suspend"){
   const {error:mErr}=await admin.from("cp_memberships").update({active:false})
    .eq("organization_id",organizationId).eq("user_id",directory.auth_user_id);
   if(mErr)throw mErr;
   const {error:dErr}=await admin.from("cp_user_directory").update({
    status:"suspended",suspended_at:now(),updated_at:now()}).eq("id",targetId);
   if(dErr)throw dErr;
   await audit(targetId,"suspended",{email:directory.email});
   return response({success:true,message:"Acesso suspenso no servidor; sessões não concedem dados protegidos."},200,origin);
  }
  if(action==="reactivate"){
   if(directory.status!=="suspended")return response({error:"Somente usuários suspensos podem ser reativados"},409,origin);
   const {error}=await admin.from("cp_user_directory").update({
    status:"invited",suspended_at:null,updated_at:now()}).eq("id",targetId);
   if(error)throw error;
   await audit(targetId,"reactivation_pending",{email:directory.email});
   return response({success:true,message:"Reativação pendente: o usuário precisará validar sua identidade novamente."},200,origin);
  }
  if(action==="update"){
   if(directory.status==="suspended")return response({error:"Reative antes de modificar usuário suspenso"},409,origin);
   const old={role:directory.requested_role,company_id:directory.company_id,department_id:directory.department_id};
   if(directory.auth_user_id){
    const {data:links,error:linkError}=await admin.from("cp_memberships").select("id")
     .eq("organization_id",organizationId).eq("user_id",directory.auth_user_id);
    if(linkError)throw linkError;
    if((links?.length||0)!==1)return response({error:"Usuário com múltiplos vínculos; edição exige gestão individual de acessos"},409,origin);
    const {error:editError}=await admin.from("cp_memberships").update({
     role,company_id:companyId,department_id:departmentId
    }).eq("id",links![0].id);
    if(editError)throw editError;
   }
   const {error}=await admin.from("cp_user_directory").update({
    full_name:String(p.full_name||directory.full_name).trim().slice(0,140),
    phone:String(p.phone||"").slice(0,40),position_title:String(p.position_title||"").slice(0,120),
    company_id:companyId,department_id:departmentId,requested_role:role,updated_at:now()
   }).eq("id",targetId);
   if(error)throw error;
   await audit(targetId,"user_edited",{before:old,after:{role,company_id:companyId,department_id:departmentId}});
   return response({success:true,message:"Cadastro, papel e escopo atualizados."},200,origin);
  }
  return response({error:"Ação inválida"},400,origin);
 }catch(e){return response({error:"Operação não concluída: "+(e instanceof Error?e.message:"erro interno")},500,origin);}
});
