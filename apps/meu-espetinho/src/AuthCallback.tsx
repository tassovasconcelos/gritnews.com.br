import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Brand } from './Brand';
import { supabase, supabaseConfigured } from './lib/supabase';
import './auth.css';

export default function AuthCallback(){
  const [status,setStatus]=useState<'loading'|'success'|'error'>('loading');
  const [message,setMessage]=useState('Confirmando seu e-mail com segurança...');
  useEffect(()=>{
    if(!supabase||!supabaseConfigured){setStatus('error');setMessage('Não foi possível conectar ao serviço de autenticação.');return;}
    const hash=new URLSearchParams(window.location.hash.replace(/^#/,''));
    const query=new URLSearchParams(window.location.search);
    const authError=hash.get('error_description')||query.get('error_description');
    if(authError){setStatus('error');setMessage(decodeURIComponent(authError));return;}
    let done=false;
    const finish=async()=>{
      const {data,error}=await supabase.auth.getSession();
      if(done)return;
      if(error){setStatus('error');setMessage('O link não pôde ser validado. Solicite uma nova confirmação.');return;}
      if(data.session){done=true;setStatus('success');setMessage('E-mail confirmado! Seu acesso está pronto.');setTimeout(()=>location.replace('/app'),1200);}
    };
    finish();
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(session&&!done){done=true;setStatus('success');setMessage('E-mail confirmado! Seu acesso está pronto.');setTimeout(()=>location.replace('/app'),1200);}});
    const timeout=setTimeout(()=>{if(!done){setStatus('error');setMessage('Este link expirou ou não é mais válido. Volte ao cadastro para entrar ou solicitar um novo acesso.');}},8000);
    return()=>{clearTimeout(timeout);listener.subscription.unsubscribe();};
  },[]);
  return <div className="auth-page"><div style={{maxWidth:520,margin:'8vh auto',padding:'24px'}}><div style={{display:'flex',justifyContent:'center',marginBottom:28}}><Brand/></div><div style={{background:'#fff',border:'1px solid #e7eaf0',borderRadius:24,padding:'38px 30px',textAlign:'center',boxShadow:'0 18px 50px rgba(13,19,35,.10)'}}>{status==='loading'?<Loader2 size={44} style={{color:'#FF6A00'}}/>:status==='success'?<CheckCircle2 size={48} style={{color:'#14804a'}}/>:<XCircle size={48} style={{color:'#b42318'}}/>}<h1 style={{color:'#0D1323',fontSize:26,margin:'18px 0 10px'}}>{status==='loading'?'Só um instante':status==='success'?'Tudo certo!':'Não foi possível confirmar'}</h1><p style={{color:'#657084',lineHeight:1.6}}>{message}</p>{status==='error'&&<a href="/cadastro" style={{display:'inline-block',marginTop:16,background:'#FF6A00',color:'#fff',fontWeight:700,textDecoration:'none',padding:'13px 20px',borderRadius:12}}>Voltar ao Meu Espetinho</a>}</div></div></div>;
}
