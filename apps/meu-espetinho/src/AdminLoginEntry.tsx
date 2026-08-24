import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Admin from './Admin';
import GritAppsAdmin from './GritAppsAdmin';
import GritLeadsCrm from './GritLeadsCrm';
import SecurityOpsCenter from './SecurityOpsCenter';
import { supabase } from './lib/supabase';

const GLOBAL_SUPERADMIN_EMAIL='gritsolucoes@gmail.com';
const quickStyle={display:'inline-flex',alignItems:'center',gap:8,padding:'12px 16px',borderRadius:14,color:'#fff',fontWeight:800,textDecoration:'none',boxShadow:'0 12px 30px rgba(15,23,42,.20)'} as const;

export default function AdminLoginEntry(){
  const params=new URLSearchParams(window.location.search);
  const resume=params.get('resume')==='1';
  const[ready,setReady]=useState(false);
  const[session,setSession]=useState<Session|null>(null);
  const[allowed,setAllowed]=useState<boolean|null>(null);
  const path=window.location.pathname;
  const isSecurityOps=path.startsWith('/admin/apps/security');
  const isGritLeads=path.startsWith('/admin/apps/leads');
  const isGritApps=path.startsWith('/admin/apps');

  async function validate(next:Session|null){
    setSession(next);
    if(!next){setAllowed(false);setReady(true);return;}
    const email=(next.user.email||'').trim().toLowerCase();
    if(email===GLOBAL_SUPERADMIN_EMAIL){setAllowed(true);setReady(true);return;}
    try{
      const{data}=await supabase?.from('admin_users').select('role,active').eq('user_id',next.user.id).maybeSingle()||{data:null};
      setAllowed(Boolean(data?.active&&String(data.role||'').toLowerCase()==='superadmin'));
    }catch{setAllowed(false)}
    setReady(true);
  }

  useEffect(()=>{
    let active=true;
    supabase?.auth.getSession().then(({data})=>{if(active)validate(data.session)});
    const listener=supabase?.auth.onAuthStateChange((_event,next)=>{if(active)validate(next)});
    return()=>{active=false;listener?.data.subscription.unsubscribe()};
  },[]);

  if(!ready)return <div className="admin-loading">Validando acesso administrativo...</div>;

  // Toda rota administrativa exige sessão válida. O componente Admin fornece a tela
  // oficial de login/recuperação e o listener acima libera a rota solicitada após autenticar.
  if(!session)return <Admin/>;

  if((isGritApps||isGritLeads||isSecurityOps)&&!allowed){
    return <div className="admin-login"><div className="admin-login-card"><h1>Acesso protegido</h1><p>Esta operação exige permissão de Super Admin.</p><small>{session.user.email}</small><button onClick={()=>supabase?.auth.signOut()}>Sair</button></div></div>;
  }

  if(isSecurityOps)return <SecurityOpsCenter/>;
  if(isGritLeads)return <GritLeadsCrm/>;
  if(isGritApps)return <div style={{position:'relative'}}><div style={{position:'fixed',right:18,bottom:18,zIndex:9999,display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><a href="/admin/apps/security" style={{...quickStyle,background:'#334155'}}>Segurança & Operação</a><a href="/admin/apps/leads" style={{...quickStyle,background:'#0f766e'}}>Leads & Oportunidades</a></div><GritAppsAdmin/></div>;

  // /admin continua usando o painel completo, que também valida admin_users internamente.
  return <div style={{position:'relative'}}>
    <div style={{position:'fixed',right:18,bottom:18,zIndex:9999,display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
      <a href="/admin/apps/security" style={{...quickStyle,background:'#334155'}}>Segurança & Operação</a>
      <a href="/admin/apps/leads" style={{...quickStyle,background:'#0f766e'}}>Leads & Oportunidades</a>
      <a href="/admin/apps" style={{...quickStyle,background:'#111827'}} aria-label="Abrir Central de Apps GRIT">Central GRIT</a>
    </div>
    <Admin key={resume?'resume':'admin'}/>
  </div>;
}
