import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {validAccess,validEmail} from './access-model.mjs';
const origin='https://cip.gritnews.com.br',url=Deno.env.get('SUPABASE_URL')!;
const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const hash=async(value:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(v=>v.toString(16).padStart(2,'0')).join('');
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(v);
async function inviteRecord(body:any){
 if(!uuid(body.invite_id)||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))return null;
 const {data,error}=await db.from('cip_user_invites').select('*').eq('id',body.invite_id).eq('token_hash',await hash(body.token)).eq('state','ready').single();
 if(error||!data||Date.parse(data.expires_at)<Date.now())return null;return data;
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'origin_not_allowed'});
 try{
  if(Number(req.headers.get('content-length'))>16000)return reply(413,{error:'request_too_large'});
  const body=await req.json();
  if(body.action==='preview_invite'){
   const i=await inviteRecord(body);if(!i)return reply(404,{error:'invalid_invitation'});
   return reply(200,{email:i.email,role:i.role,companies:i.companies,expires_at:i.expires_at});
  }
  const authorization=req.headers.get('authorization')??'';
  const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:auth,error}=await client.auth.getUser();if(error||!auth?.user)return reply(401,{error:'authentication_required'});
  if(body.action==='accept_invite'){
   const i=await inviteRecord(body);if(!i||!auth.user.email_confirmed_at||auth.user.email?.toLowerCase()!==i.email)return reply(403,{error:'invited_account_required'});
   const r=await db.rpc('cip_admin_accept_invite',{p_invite:i.id,p_token_hash:i.token_hash,p_user:auth.user.id,p_email:auth.user.email});
   return r.error?reply(409,{error:'invitation_not_accepted'}):reply(200,{accepted:true,...r.data});
  }
  const profile=await db.from('cip_profiles').select('role,active').eq('user_id',auth.user.id).single();
  if(profile.error||!profile.data?.active||profile.data.role!=='superadm')return reply(403,{error:'superadmin_required'});
  if(body.action==='list'){
   const [p,m,d,i,e]=await Promise.all([
    db.from('cip_profiles').select('user_id,role,active').order('created_at',{ascending:false}).limit(200),
    db.from('cip_memberships').select('user_id,company_id,role,active').limit(1000),
    db.from('cip_directory').select('user_id,email').limit(200),
    db.from('cip_user_invites').select('id,email,role,companies,state,expires_at,created_at').order('created_at',{ascending:false}).limit(100),
    db.from('cip_access_events').select('id,action,target_id,created_at').order('created_at',{ascending:false}).limit(30)
   ]);if([p,m,d,i,e].some(r=>r.error))return reply(503,{error:'directory_unavailable'});
   return reply(200,{users:(p.data??[]).map(u=>({...u,email:d.data?.find(v=>v.user_id===u.user_id)?.email??'Conta sem e-mail no diretório CIP',companies:m.data?.filter(v=>v.user_id===u.user_id&&v.active).map(v=>v.company_id)??[]})),invites:i.data,events:e.data});
  }
  if(body.action==='set_access'){
   if(!uuid(body.user_id)||!validAccess(body)||typeof body.active!=='boolean')return reply(400,{error:'invalid_access'});
   const r=await db.rpc('cip_admin_apply_access',{p_actor:auth.user.id,p_target:body.user_id,p_role:body.role,p_companies:body.companies,p_active:body.active});
   return r.error?reply(409,{error:'access_not_changed'}):reply(200,{changed:true});
  }
  if(body.action==='revoke_invite'){
   if(!uuid(body.invite_id))return reply(400,{error:'invalid_invitation'});
   const r=await db.from('cip_user_invites').update({state:'revoked'}).eq('id',body.invite_id).in('state',['pending','ready']).select('id');if(r.error||!r.data?.length)return reply(409,{error:'invitation_not_revoked'});
   await db.from('cip_access_events').insert({actor_id:auth.user.id,action:'invite_revoked',details:{invitation:body.invite_id}});return reply(200,{revoked:true});
  }
  if(body.action==='create_invite'){
   const email=String(body.email??'').trim().toLowerCase();if(!validEmail(email)||!validAccess(body))return reply(400,{error:'invalid_invitation'});
   // Reject existing active CIP accounts; use access management rather than a new invitation.
   const existing=await db.from('cip_directory').select('user_id').eq('email',email).limit(1);if(existing.data?.length)return reply(409,{error:'account_already_in_cip'});
   const count=await db.from('cip_user_invites').select('id',{count:'exact',head:true}).eq('created_by',auth.user.id).gte('created_at',new Date(Date.now()-3600000).toISOString());if(count.error||Number(count.count)>=20)return reply(429,{error:'invitation_rate_limit'});
   const token=[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join('');
   const record=await db.from('cip_user_invites').insert({email,role:body.role,companies:body.companies,token_hash:await hash(token),created_by:auth.user.id}).select('id,expires_at').single();if(record.error)return reply(503,{error:'invitation_unavailable'});
   const identity=await db.rpc('cip_admin_identity',{p_actor:auth.user.id,p_email:email});if(identity.error)return reply(503,{error:'identity_lookup_unavailable'});
   const link=identity.data?{data:null,error:null}:await db.auth.admin.generateLink({type:'invite',email});let authHash:string|null=null;
   if(link.error){
    if(!['email_exists','email_address_already_exists','user_already_exists'].includes(link.error.code??'')){await db.from('cip_user_invites').update({state:'revoked'}).eq('id',record.data.id);return reply(503,{error:'identity_invitation_unavailable'});}
   }else authHash=link.data?.properties?.hashed_token??null;
   if(!identity.data&&!link.error&&!authHash){await db.from('cip_user_invites').update({state:'revoked'}).eq('id',record.data.id);return reply(503,{error:'identity_invitation_unavailable'});}
   const ready=await db.from('cip_user_invites').update({state:'ready'}).eq('id',record.data.id).select('id');if(ready.error||!ready.data?.length)return reply(503,{error:'invitation_unavailable'});
   await db.from('cip_access_events').insert({actor_id:auth.user.id,action:'invite_created',details:{invitation:record.data.id,role:body.role,companies:body.companies}});
   const fragment=new URLSearchParams({invite:record.data.id,token});if(authHash)fragment.set('auth_token',authHash);
   return reply(200,{activation_url:origin+'/ativar.html#'+fragment.toString(),expires_at:record.data.expires_at,delivery:'link_only',mode:authHash?'new_account':'existing_account'});
  }
  return reply(400,{error:'unknown_action'});
 }catch{return reply(503,{error:'admin_unavailable'});}
});
