import { useEffect, useState } from 'react';
import Admin from './Admin';
import GritAppsAdmin from './GritAppsAdmin';
import { supabase } from './lib/supabase';

export default function AdminLoginEntry(){
  const params=new URLSearchParams(window.location.search);
  const resume=params.get('resume')==='1';
  const[ready,setReady]=useState(resume);
  const path=window.location.pathname;
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

  if(isGritApps)return <GritAppsAdmin/>;
  if(!ready)return <div className="admin-loading">Abrindo login administrativo...</div>;

  return <div style={{position:'relative'}}>
    <a href="/admin/apps" style={{position:'fixed',right:18,bottom:18,zIndex:9999,display:'inline-flex',alignItems:'center',gap:8,padding:'12px 16px',borderRadius:14,background:'#111827',color:'#fff',fontWeight:800,textDecoration:'none',boxShadow:'0 12px 30px rgba(15,23,42,.25)'}} aria-label="Abrir Central de Apps GRIT">Central GRIT</a>
    <Admin/>
  </div>;
}
