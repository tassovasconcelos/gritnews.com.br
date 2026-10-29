import { useEffect, useState } from 'react';
import AppGate from './AppGate';
import { supabase } from './lib/supabase';
import { preserveOperationSession } from '@gritnews/operations';

export default function CustomerLoginEntry(){
  const installed=window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
  const preserveSession=preserveOperationSession(window.location.search,installed);
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
