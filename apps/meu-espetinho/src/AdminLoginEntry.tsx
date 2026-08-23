import { useEffect, useState } from 'react';
import Admin from './Admin';
import GritAppsAdmin from './GritAppsAdmin';
import { supabase } from './lib/supabase';

export default function AdminLoginEntry(){
  const params=new URLSearchParams(window.location.search);
  const resume=params.get('resume')==='1';
  const[ready,setReady]=useState(resume);
  const path=window.location.pathname;
  const isMeuEspetinhoAdmin=path.startsWith('/admin/meu-espetinho');

  useEffect(()=>{
    if(!isMeuEspetinhoAdmin)return;
    if(resume)return;
    let active=true;
    (async()=>{
      try{await supabase?.auth.signOut({scope:'local'} as any)}catch{}
      if(active)setReady(true);
    })();
    return()=>{active=false};
  },[resume,isMeuEspetinhoAdmin]);

  // /admin e /admin/apps passam a abrir a central corporativa GRIT.
  // O gerenciador operacional original permanece disponível em /admin/meu-espetinho.
  if(!isMeuEspetinhoAdmin)return <GritAppsAdmin/>;
  if(!ready)return <div className="admin-loading">Abrindo login administrativo...</div>;
  return <Admin/>;
}
