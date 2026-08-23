import { FormEvent, useState } from 'react';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { supabase } from './lib/supabase';

type Mode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'forgot') {
        const redirectTo = `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setMessage('Enviamos as instruções de recuperação para seu e-mail.');
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, product: 'sr-padeiro' } },
        });
        if (error) throw error;
        setMessage('Cadastro realizado. Confira seu e-mail para confirmar o acesso.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir o acesso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><div className="brand-mark">SP</div><div><span className="eyebrow">Sr. Padeiro</span><h1>Seu negócio na sua mão.</h1></div></div>
        <p className="auth-copy">Venda, controle estoque, caixa e fiado direto pelo celular.</p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label><span>Seu nome</span><div className="input-wrap"><UserRound size={18}/><input value={name} onChange={e => setName(e.target.value)} required placeholder="Como podemos chamar você?" /></div></label>}
          <label><span>E-mail</span><div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="voce@empresa.com.br" /></div></label>
          {mode !== 'forgot' && <label><span>Senha</span><div className="input-wrap"><LockKeyhole size={18}/><input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Sua senha" /></div></label>}
          <button className="primary-action" disabled={loading}>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar minha conta' : 'Recuperar senha'}</button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <div className="auth-links">
          {mode === 'login' ? <><button onClick={() => setMode('forgot')}>Esqueci minha senha</button><button onClick={() => setMode('signup')}>Criar conta</button></> : <button onClick={() => setMode('login')}>Voltar para entrar</button>}
        </div>
        <small className="auth-note">Feito para padarias, mercadinhos, mercearias e conveniências.</small>
      </section>
    </main>
  );
}
