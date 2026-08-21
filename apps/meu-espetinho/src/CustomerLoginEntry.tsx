import { useEffect, useState } from 'react';
import AppGate from './AppGate';
import { supabase } from './lib/supabase';

export default function CustomerLoginEntry(){
  const params=new URLSearchParams(window.location.search);
  const preserveSession=params.has('support_tenant')||params.get('reset')==='1'||params.has('mode');
  const[ready,setReady]=useState(preserveSession);

  useEffect(()=>{
    if(preserveSession)return;
    let active=true;
    (async()=>{
      try{await supabase?.auth.signOut({scope:'local'} as any)}catch{}
      try{sessionStorage.removeItem('meu-espetinho-active-tenant')}catch{}
      if(active)setReady(true);
    })();
    return()=>{active=false};
  },[preserveSession]);

  if(!ready)return <div className="admin-loading">Abrindo login seguro...</div>;
  return <AppGate/>;
}
