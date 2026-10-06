import { createClient, type User } from '@supabase/supabase-js';
import type { UserRole } from '../types';

const PROJECT_URL='https://pcrwtoddavpvkaxwtstc.supabase.co';
const env=(import.meta as any).env||{};
const configuredKey=String(env.VITE_SUPABASE_ANON_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||'').trim();
const authConfigured=Boolean(configuredKey);

export function clearAdminBrowserCredentials():void{
  if(typeof window==='undefined')return;
  for(const storageName of ['localStorage','sessionStorage'] as const){
    try{
      const storage=window[storageName];
      for(let i=storage.length-1;i>=0;i-=1){
        const key=storage.key(i);
        if(key&&(/^(grit[_-]admin|grit_news_supabase_)/i.test(key)||/^sb-.*-(auth-token|code-verifier)/i.test(key)))storage.removeItem(key);
      }
    }catch{}
  }
  // Remove only legacy authentication databases, preserving public editorial data.
  try{
    const db=window.indexedDB as IDBFactory & {databases?:()=>Promise<{name?:string}[]>};
    db.databases?.().then(items=>items.forEach(({name})=>{
      if(name&&/^(grit[_-]admin|supabase[_-]auth|sb-.*auth)/i.test(name))db.deleteDatabase(name);
    })).catch(()=>undefined);
  }catch{}
}

clearAdminBrowserCredentials();

const client=createClient(PROJECT_URL,configuredKey||'missing-public-key',{
  auth:{
    persistSession:false,
    autoRefreshToken:false,
    detectSessionInUrl:true,
    flowType:'implicit',
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
  if(!authConfigured)throw new Error('Acesso administrativo temporariamente indisponível.');
  const normalized=String(email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw new Error('Informe um e-mail válido.');
  if(String(password||'').length<8)throw new Error('Senha inválida.');

  const {data,error}=await client.auth.signInWithPassword({email:normalized,password});
  if(error||!data.user){
    await client.auth.signOut({scope:'local'}).catch(()=>undefined);
    clearAdminBrowserCredentials();
    throw new Error('E-mail ou senha inválidos.');
  }

  const identity=await resolveIdentity(data.user);
  if(!identity){
    await client.auth.signOut({scope:'local'}).catch(()=>undefined);
    throw new Error('E-mail ou senha inválidos.');
  }
  return identity;
}

export async function getAdminSession():Promise<AdminIdentity|null>{
  if(!authConfigured)return null;
  const {data,error}=await client.auth.getUser();
  if(error||!data.user)return null;
  return resolveIdentity(data.user);
}

export async function adminSignOut():Promise<void>{
  await client.auth.signOut({scope:'local'}).catch(()=>undefined);
  clearAdminBrowserCredentials();
}

export async function requestAdminPasswordReset(email:string):Promise<void>{
  if(!authConfigured)throw new Error('Acesso administrativo temporariamente indisponível.');
  const normalized=String(email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw new Error('Informe um e-mail válido.');
  const redirectTo='https://gritnews.com.br/?view=admin&recovery=1';
  const {error}=await client.auth.resetPasswordForEmail(normalized,{redirectTo});
  // Keep the same outward result regardless of whether the account exists.
  if(error) return;
}

export async function updateRecoveredAdminPassword(password:string):Promise<void>{
  if(!authConfigured)throw new Error('Acesso administrativo temporariamente indisponível.');
  if(String(password||'').length<12)throw new Error('Use uma senha com pelo menos 12 caracteres.');
  const {data:userData,error:userError}=await client.auth.getUser();
  if(userError||!userData.user)throw new Error('Abra novamente o link de recuperação enviado por e-mail.');
  const {error}=await client.auth.updateUser({password});
  if(error)throw new Error('Não foi possível atualizar a senha.');
  await adminSignOut();
}
