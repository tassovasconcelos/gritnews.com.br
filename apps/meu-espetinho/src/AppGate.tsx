import { FormEvent, useEffect, useState } from 'react';
import App from './App';
import { supabase } from './lib/supabase';
import { trackMarketing } from './lib/analytics';
import './auth.css';

type Tenant = {
  id: string;
  name: string;
  subscription_status: string;
  trial_ends_at: string;
};

export default function AppGate() {
  const [session, setSession] = useState<any>(undefined);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase?.auth.getSession().then(async ({ data }) => {
      setSession(data.session || null);
      if (data.session) await loadTenant();
    });
    const listener = supabase?.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) await loadTenant();
      else setTenant(null);
    });
    return () => listener?.data.subscription.unsubscribe();
  }, []);

  async function loadTenant() {
    if (!supabase) return;
    const { data } = await supabase
      .from('tenants')
      .select('id,name,subscription_status,trial_ends_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) setTenant(data as Tenant);
  }

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(f.get('email')),
      password: String(f.get('password')),
    });
    if (error) setMsg(error.message);
    else {
      setSession(data.session);
      await loadTenant();
    }
    setBusy(false);
  }

  async function checkout(kind: 'activation' | 'subscription') {
    if (!supabase || !tenant) return;
    setBusy(true);
    setMsg('');
    trackMarketing({name:'begin_checkout',params:{kind,value:kind==='activation'?199:89,currency:'BRL'}});
    const fn = kind === 'activation' ? 'create-activation-checkout' : 'create-subscription';
    const { data, error } = await supabase.functions.invoke(fn, { body: { tenant_id: tenant.id } });
    if (error || !data?.checkout_url) {
      setMsg(data?.error === 'mercado_pago_not_configured'
        ? 'Pagamento em configuração. Tente novamente em breve.'
        : 'Não foi possível abrir o pagamento.');
      setBusy(false);
      return;
    }
    location.href = data.checkout_url;
  }

  if (session === undefined) return <div className="admin-loading">Carregando...</div>;

  if (!session) {
    return (
      <div className="auth-page">
        <a className="auth-back" href="/">← Voltar</a>
        <div className="auth-grid">
          <section>
            <span className="auth-kicker">MEU ESPETINHO</span>
            <h1>Entre e continue vendendo.</h1>
            <p>Seu negócio, suas comandas e seus resultados em um só lugar.</p>
          </section>
          <form onSubmit={login}>
            <h2>Entrar</h2>
            <label>E-mail<input name="email" type="email" required /></label>
            <label>Senha<input name="password" type="password" required /></label>
            <button disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
            {msg && <p className="auth-message">{msg}</p>}
            <small>Primeiro acesso? <a href="/cadastro">Teste 3 dias grátis</a></small>
          </form>
        </div>
      </div>
    );
  }

  if (!tenant) return <div className="admin-loading">Preparando seu estabelecimento...</div>;

  const days = Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000));

  return (
    <>
      <App tenantId={tenant.id} userId={session.user.id} />
      {tenant.subscription_status !== 'active' && (
        <div className="billing-banner">
          <strong>{tenant.subscription_status === 'trialing' ? `Seu teste termina em ${days} dia(s)` : 'Ative o Meu Espetinho'}</strong>
          <small>Mensalidade R$ 89 + ativação única de R$ 199.</small>
          <div className="billing-actions">
            <button disabled={busy} onClick={() => checkout('activation')}>Pagar ativação</button>
            <button disabled={busy} onClick={() => checkout('subscription')}>Assinar R$ 89/mês</button>
          </div>
          {msg && <small>{msg}</small>}
        </div>
      )}
    </>
  );
}
