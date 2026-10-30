import { FormEvent, useState } from 'react';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AccountConfirmation, currentCustomerPath, confirmationRedirect } from '@gritnews/operations';
import { getAttribution,track } from './lib/tracking';

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
    const normalizedEmail=email.trim().toLowerCase();

    try {
      if (mode === 'forgot') {
        const target = new URL(confirmationRedirect(location.origin, location.search, currentCustomerPath()));
        target.searchParams.set('mode','recovery');
        const redirectTo=target.href;
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
        if (error) throw error;
        setMessage('Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.');
        return;
      }

      if (mode === 'signup') {
        const acquisition=getAttribution();
        const { error } = await supabase.auth.signUp({
          email:normalizedEmail,
          password,
          options: { data: { full_name: name.trim(), product: 'sr-padeiro', acquisition }, emailRedirectTo: confirmationRedirect(location.origin, location.search, currentCustomerPath()) },
        });
        if (error) throw error;
        track('sign_up',{product:'sr-padeiro',source:acquisition.source,campaign:acquisition.campaign});
        setMessage('Cadastro realizado. Confira seu e-mail para confirmar o acesso.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email:normalizedEmail, password });
      if (error) {
        setMessage(error.code==='email_not_confirmed' ? 'Confirme seu e-mail antes de entrar. Use a opção de reenviar confirmação abaixo.' : 'E-mail ou senha inválidos. Se necessário, use “Esqueci minha senha”.');
        return;
      }
    } catch (error) {
      const text=error instanceof Error?error.message.toLowerCase():'';
      setMessage(text.includes('rate')?'Muitas tentativas. Aguarde alguns minutos e tente novamente.':'Não foi possível concluir o acesso agora. Tente novamente.');
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
          {mode === 'signup' && <label><span>Seu nome</span><div className="input-wrap"><UserRound size={18}/><input value={name} onChange={e => setName(e.target.value)} required placeholder="Como podemos chamar você?" autoComplete="name" /></div></label>}
          <label><span>E-mail</span><div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="voce@empresa.com.br" autoComplete="email" autoCapitalize="none" /></div></label>
          {mode !== 'forgot' && <label><span>Senha</span><div className="input-wrap"><LockKeyhole size={18}/><input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Sua senha" autoComplete={mode==='signup'?'new-password':'current-password'} /></div></label>}
          <button className="primary-action" disabled={loading}>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar minha conta' : 'Recuperar senha'}</button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <div className="auth-links">
          {mode === 'login' ? <><button type="button" onClick={() => {setMode('forgot');setMessage('')}}>Esqueci minha senha</button><button type="button" onClick={() => {setMode('signup');setMessage('')}}>Criar conta</button></> : <button type="button" onClick={() => {setMode('login');setMessage('')}}>Voltar para entrar</button>}
        </div>
        {mode==='login' && <AccountConfirmation client={supabase} email={email}/>}
        <small className="auth-note">Feito para padarias, mercadinhos, mercearias e conveniências.</small>
      </section>
    </main>
  );
}
