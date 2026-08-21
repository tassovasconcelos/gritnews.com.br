import { useEffect, useState } from 'react';
import Admin from './Admin';
import { supabase } from './lib/supabase';

export default function AdminLoginEntry(){
  const params=new URLSearchParams(window.location.search);
  const resume=params.get('resume')==='1';
  const[ready,setReady]=useState(resume);

  useEffect(()=>{
    if(resume)return;
    let active=true;
    (async()=>{
      try{await supabase?.auth.signOut({scope:'local'} as any)}catch{}
      if(active)setReady(true);
    })();
    return()=>{active=false};
  },[resume]);

  if(!ready)return <div className="admin-loading">Abrindo login administrativo...</div>;
  return <Admin/>;
}
