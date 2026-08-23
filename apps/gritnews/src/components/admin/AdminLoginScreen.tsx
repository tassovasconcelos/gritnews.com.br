import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Lock, ShieldCheck, User } from 'lucide-react';
import { UserRole } from '../../types';
import { getSupabaseClient } from '../../lib/supabase';

interface AdminLoginScreenProps {
  onLoginSuccess: (user: { name: string; role: UserRole; email: string }) => void;
  onExit: () => void;
}

const mapRole = (role?: string | null): UserRole => {
  switch ((role || '').toLowerCase()) {
    case 'editor_in_chief': return 'EDITOR_IN_CHIEF';
    case 'commercial_manager': return 'COMMERCIAL_MANAGER';
    case 'author': return 'AUTHOR';
    default: return 'SUPERADMIN';
  }
};

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess, onExit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('Autenticação indisponível. Verifique a configuração do Supabase.');
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await client.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error || !data.user) {
      setErrorMsg('E-mail ou senha inválidos.');
      setIsLoading(false);
      return;
    }

    const { data: admin, error: adminError } = await client
      .from('admin_users')
      .select('role,active')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (adminError || !admin?.active) {
      await client.auth.signOut();
      setErrorMsg('Esta conta não possui acesso administrativo ativo.');
      setIsLoading(false);
      return;
    }

    const displayName = (data.user.user_metadata?.full_name || data.user.user_metadata?.name || normalizedEmail.split('@')[0]) as string;
    onLoginSuccess({ name: displayName, role: mapRole(admin.role), email: normalizedEmail });
    setPassword('');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#145EDB]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <main className="max-w-md w-full z-10">
        <button onClick={onExit} className="mb-4 flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4"/> Voltar ao site</button>
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6">
          <div className="flex items-center justify-center gap-2 bg-blue-950/80 text-blue-300 border border-blue-800/50 py-2 px-3 rounded-full text-xs font-medium w-fit mx-auto"><Lock className="w-3.5 h-3.5"/> Área administrativa restrita</div>
          <div className="text-center"><h1 className="text-2xl font-black">Acesso GRIT</h1><p className="text-xs text-slate-400 mt-2">Autenticação protegida pelo Supabase Auth e permissões administrativas do banco.</p></div>
          {errorMsg && <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-3 rounded-2xl text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/><span>{errorMsg}</span></div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block"><span className="block text-xs font-bold text-slate-300 mb-1.5">E-mail</span><div className="relative"><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-[#145EDB] rounded-xl pl-10 pr-4 py-3 text-sm outline-none" placeholder="seuemail@dominio.com"/><User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/></div></label>
            <label className="block"><span className="block text-xs font-bold text-slate-300 mb-1.5">Senha</span><div className="relative"><input type={showPassword?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-[#145EDB] rounded-xl pl-10 pr-10 py-3 text-sm outline-none"/><KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></label>
            <button disabled={isLoading} className="w-full bg-[#145EDB] hover:bg-blue-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4"/>{isLoading?'Validando...':'Entrar no painel'}</button>
          </form>
          <p className="text-[11px] text-slate-500 text-center">Credenciais de demonstração foram removidas do frontend.</p>
        </div>
      </main>
    </div>
  );
};
