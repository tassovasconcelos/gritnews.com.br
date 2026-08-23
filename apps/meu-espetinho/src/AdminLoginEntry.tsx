import { useEffect, useState } from 'react';
import Admin from './Admin';
import GritAppsAdmin from './GritAppsAdmin';
import GritLeadsCrm from './GritLeadsCrm';
import SecurityOpsCenter from './SecurityOpsCenter';
import { supabase } from './lib/supabase';

const quickStyle={display:'inline-flex',alignItems:'center',gap:8,padding:'12px 16px',borderRadius:14,color:'#fff',fontWeight:800,textDecoration:'none',boxShadow:'0 12px 30px rgba(15,23,42,.20)'} as const;
export default function AdminLoginEntry(){
  const params=new URLSearchParams(window.location.search);
  const resume=params.get('resume')==='1';
  const[ready,setReady]=useState(resume);
  const path=window.location.pathname;
  const isSecurityOps=path.startsWith('/admin/apps/security');
  const isGritLeads=path.startsWith('/admin/apps/leads');
  const isGritApps=path.startsWith('/admin/apps');

  useEffect(()=>{
    if(isGritApps)return;
    if(resume)return;
    let active=true;
    (async()=>{
      try{await supabase?.auth.signOut({scope:'local'} as any)}catch{}
      if(active)setReady(true);
    })();
    return()=>{active=false};
  },[resume,isGritApps]);

  if(isSecurityOps)return <SecurityOpsCenter/>;
  if(isGritLeads)return <GritLeadsCrm/>;
  if(isGritApps)return <div style={{position:'relative'}}><div style={{position:'fixed',right:18,bottom:18,zIndex:9999,display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><a href="/admin/apps/security" style={{...quickStyle,background:'#334155'}}>Segurança & Operação</a><a href="/admin/apps/leads" style={{...quickStyle,background:'#0f766e'}}>Leads & Oportunidades</a></div><GritAppsAdmin/></div>;
  if(!ready)return <div className="admin-loading">Abrindo login administrativo...</div>;

  return <div style={{position:'relative'}}>
    <div style={{position:'fixed',right:18,bottom:18,zIndex:9999,display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
      <a href="/admin/apps/security" style={{...quickStyle,background:'#334155'}}>Segurança & Operação</a>
      <a href="/admin/apps/leads" style={{...quickStyle,background:'#0f766e'}}>Leads & Oportunidades</a>
      <a href="/admin/apps" style={{...quickStyle,background:'#111827'}} aria-label="Abrir Central de Apps GRIT">Central GRIT</a>
    </div>
    <Admin/>
  </div>;
}
