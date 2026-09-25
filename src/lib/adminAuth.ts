import { createClient, type User } from '@supabase/supabase-js';
import type { UserRole } from '../types';

const EXPECTED_URL='https://pcrwtoddavpvkaxwtstc.supabase.co';
const FALLBACK_PUBLISHABLE_KEY='sb_publishable_m11Lb0v2t5Cp-BrooNWE6g_np421eYS';

const env=(import.meta as any).env||{};
const configuredUrl=String(env.VITE_SUPABASE_URL||'').trim();
const configuredKey=String(env.VITE_SUPABASE_ANON_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||'').trim();
const url=configuredUrl===EXPECTED_URL?configuredUrl:EXPECTED_URL;
const key=configuredUrl===EXPECTED_URL&&configuredKey?configuredKey:FALLBACK_PUBLISHABLE_KEY;

const client=createClient(url,key,{
  auth:{
    persistSession:true,
    autoRefreshToken:true,
    detectSessionInUrl:true,
    flowType:'pkce',
  },
});

export type AdminIdentity={name:string;email:string;role:UserRole};

const roleMap:Record<string,UserRole>={
  superadmin:'SUPERADMIN',
  admin:'ADMIN',
  operator:'EDITOR',
  auditor:'ANALYST',
};

async function resolveIdentity(user:User):Promise<AdminIdentity|null>{
  const {data,error}=await client
    .from('admin_users')
    .select('role,active')
    .eq('user_id',user.id)
    .maybeSingle();

  if(error||!data?.active)return null;
  const role=roleMap[String(data.role||'').toLowerCase()];
  if(!role)return null;

  const email=String(user.email||'').trim().toLowerCase();
  if(!email)return null;
  const display=String(user.user_metadata?.full_name||user.user_metadata?.name||email.split('@')[0]||'Administrador').trim().slice(0,120);
  return {name:display,email,role};
}

export async function adminSignIn(email:string,password:string):Promise<AdminIdentity>{
  const normalized=String(email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw new Error('Informe um e-mail válido.');
  if(String(password||'').length<8)throw new Error('Senha inválida.');

  const {data,error}=await client.auth.signInWithPassword({email:normalized,password});
  if(error||!data.user)throw new Error('E-mail ou senha inválidos.');

  const identity=await resolveIdentity(data.user);
  if(!identity){
    await client.auth.signOut({scope:'local'}).catch(()=>undefined);
    throw new Error('Esta conta não possui acesso administrativo ativo.');
  }
  return identity;
}

export async function getAdminSession():Promise<AdminIdentity|null>{
  const {data,error}=await client.auth.getUser();
  if(error||!data.user)return null;
  return resolveIdentity(data.user);
}

export async function adminSignOut():Promise<void>{
  await client.auth.signOut({scope:'local'});
}

export async function requestAdminPasswordReset(email:string):Promise<void>{
  const normalized=String(email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw new Error('Informe um e-mail válido.');
  const redirectTo='https://gritnews.com.br/?view=admin&recovery=1';
  const {error}=await client.auth.resetPasswordForEmail(normalized,{redirectTo});
  if(error)throw new Error('Não foi possível iniciar a recuperação agora.');
}

export async function updateRecoveredAdminPassword(password:string):Promise<void>{
  if(String(password||'').length<12)throw new Error('Use uma senha com pelo menos 12 caracteres.');
  const {data:userData,error:userError}=await client.auth.getUser();
  if(userError||!userData.user)throw new Error('Abra novamente o link de recuperação enviado por e-mail.');
  const {error}=await client.auth.updateUser({password});
  if(error)throw new Error('Não foi possível atualizar a senha.');
}
