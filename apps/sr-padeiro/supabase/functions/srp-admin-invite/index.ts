import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const origins=new Set(['https://srpadeiro.gritnews.com.br','http://localhost:5173','http://localhost:4173']);
Deno.serve(async req=>{
  const origin=req.headers.get('Origin')||'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origins.has(origin)?origin:'https://srpadeiro.gritnews.com.br','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({error:'Método não permitido.'},405);
  if(origin&&!origins.has(origin))return json({error:'Origem não permitida.'},403);
  try{
    const bearer=req.headers.get('Authorization');if(!bearer)return json({error:'Autenticação necessária.'},401);
    const url=Deno.env.get('SUPABASE_URL')!;
    const sb=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:authError}=await sb.auth.getUser(bearer.replace(/^Bearer /i,''));
    if(authError||!user)return json({error:'Sessão inválida.'},401);
    const {data:admin}=await sb.from('admin_users').select('role,active').eq('user_id',user.id).maybeSingle();
    if(!admin?.active||admin.role!=='superadmin')return json({error:'Acesso exclusivo do Super Admin.'},403);
    const body=await req.json();const email=String(body.email||'').trim().toLowerCase();const org=String(body.organization_id||'');const role=String(body.role||'');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!['owner','manager','cashier','stockist','viewer'].includes(role)||!/^[0-9a-f-]{36}$/i.test(org))return json({error:'E-mail, cliente ou perfil inválido.'},400);
    const names=Array.isArray(body.operator_names)?body.operator_names.map(String).map((n:string)=>n.trim()).filter(Boolean):[];
    if(names.length>20||names.some((n:string)=>n.length>100))return json({error:'Lista de pessoas inválida.'},400);
    // Authenticated RPC independently verifies Super Admin and organization scope.
    const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}});
    const {data:identity,error:lookupError}=await caller.rpc('srp_admin_console',{p_action:'find_identity',p_org_id:org,p_payload:{email}});
    if(lookupError)return json({error:'Não foi possível validar o cliente.'},403);
    let userId=identity?.user_id;let invited=false;
    if(!userId){
      const {data,error}=await sb.auth.admin.inviteUserByEmail(email,{redirectTo:'https://srpadeiro.gritnews.com.br/app'});
      if(error||!data.user)return json({error:'O provedor não concluiu o convite. Confira a configuração de e-mail e tente novamente.'},502);
      userId=data.user.id;invited=true;
    }
    const {error:memberError}=await caller.rpc('srp_admin_console',{p_action:'member',p_org_id:org,p_payload:{user_id:userId,role,active:true,operator_names:names}});
    if(memberError)return json({error:invited?'Convite solicitado, mas o vínculo não foi concluído. Tente vincular novamente com o mesmo e-mail.':'Não foi possível vincular a conta ao cliente.'},409);
    return json({ok:true,invited});
  }catch{return json({error:'Não foi possível concluir o convite.'},500)}
});
