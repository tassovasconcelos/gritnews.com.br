import React,{useEffect,useMemo,useState} from 'react';
import {AlertCircle,ArrowLeft,CheckCircle2,Eye,EyeOff,KeyRound,Lock,Mail,ShieldCheck} from 'lucide-react';
import type {UserRole} from '../../types';
import {adminSignIn,requestAdminPasswordReset,updateRecoveredAdminPassword} from '../../lib/adminAuth';

interface AdminLoginScreenProps{
  onLoginSuccess:(user:{name:string;role:UserRole;email:string})=>void;
  onExit:()=>void;
}

export const AdminLoginScreen:React.FC<AdminLoginScreenProps>=({onLoginSuccess,onExit})=>{
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[confirmPassword,setConfirmPassword]=useState('');
  const[showPassword,setShowPassword]=useState(false);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[message,setMessage]=useState('');
  const recovery=useMemo(()=>typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('recovery')==='1',[]);

  useEffect(()=>{
    try{
      for(const key of ['grit_admin_authenticated','grit_admin_user_name','grit_admin_user_role','grit_admin_user_email']){
        sessionStorage.removeItem(key);
      }
    }catch{}
  },[]);

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');setMessage('');setBusy(true);
    try{
      const user=await adminSignIn(email,password);
      onLoginSuccess(user);
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível autenticar.');
    }finally{setBusy(false)}
  };

  const recover=async()=>{
    setError('');setMessage('');
    if(!email.trim()){setError('Informe seu e-mail para recuperar a senha.');return}
    setBusy(true);
    try{
      await requestAdminPasswordReset(email);
      setMessage('Se o e-mail estiver habilitado para acesso, você receberá um link de recuperação. O link expira e a senha não é exibida nem armazenada neste navegador.');
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível iniciar a recuperação.');
    }finally{setBusy(false)}
  };

  const updatePassword=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');setMessage('');
    if(password!==confirmPassword){setError('As senhas não coincidem.');return}
    setBusy(true);
    try{
      await updateRecoveredAdminPassword(password);
      setPassword('');setConfirmPassword('');
      setMessage('Senha atualizada. Remova o parâmetro de recuperação da URL e entre com sua nova senha.');
      if(typeof window!=='undefined')window.history.replaceState({},'',window.location.pathname+'?view=admin');
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível atualizar a senha.');
    }finally{setBusy(false)}
  };

  return <div className="min-h-screen bg-slate-950 text-white flex flex-col p-4 sm:p-6 lg:p-8">
    <header className="max-w-6xl mx-auto w-full flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#145EDB] rounded-2xl flex items-center justify-center font-black text-xl">G</div>
        <div><strong>GRIT NEWS</strong><p className="text-[10px] text-slate-400">Administração protegida por Supabase Auth</p></div>
      </div>
      <button onClick={onExit} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs"><ArrowLeft className="w-4 h-4"/>Voltar ao site</button>
    </header>

    <main className="max-w-md w-full mx-auto my-auto py-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-center gap-2 text-blue-300 text-xs"><Lock className="w-4 h-4"/>Área administrativa restrita</div>
        <div className="text-center"><h1 className="text-2xl font-black">{recovery?'Definir nova senha':'Acesso gerencial'}</h1><p className="text-xs text-slate-400 mt-2">{recovery?'Use uma senha forte e exclusiva.':'O perfil e as permissões são definidos pelo servidor, não pelo navegador.'}</p></div>

        {error&&<div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-3 rounded-2xl text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/><span>{error}</span></div>}
        {message&&<div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 p-3 rounded-2xl text-xs flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0"/><span>{message}</span></div>}

        {recovery?
          <form onSubmit={updatePassword} className="space-y-4">
            <PasswordField value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} label="Nova senha"/>
            <div><label className="block text-[11px] font-bold mb-1">Confirmar nova senha</label><input type={showPassword?'text':'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={12} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm"/></div>
            <button disabled={busy} className="w-full bg-[#145EDB] py-3 rounded-xl font-bold text-sm disabled:opacity-50">{busy?'Atualizando...':'Atualizar senha'}</button>
          </form>
        :
          <form onSubmit={submit} className="space-y-4">
            <div><label className="block text-[11px] font-bold mb-1">E-mail</label><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-sm" placeholder="seu@email.com"/></div></div>
            <PasswordField value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} label="Senha"/>
            <button disabled={busy} className="w-full bg-[#145EDB] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"><ShieldCheck className="w-4 h-4"/>{busy?'Autenticando...':'Entrar com segurança'}</button>
            <button type="button" onClick={recover} disabled={busy} className="w-full text-xs text-amber-300 hover:text-amber-200 flex items-center justify-center gap-2"><KeyRound className="w-4 h-4"/>Esqueci minha senha</button>
          </form>
        }
      </div>
    </main>
  </div>
};

function PasswordField({value,onChange,show,setShow,label}:{value:string;onChange:(v:string)=>void;show:boolean;setShow:(v:boolean)=>void;label:string}){
  return <div><label className="block text-[11px] font-bold mb-1">{label}</label><div className="relative"><KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input type={show?'text':'password'} autoComplete={label==='Senha'?'current-password':'new-password'} value={value} onChange={e=>onChange(e.target.value)} minLength={8} required className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-3 text-sm"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={show?'Ocultar senha':'Mostrar senha'}>{show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
}
