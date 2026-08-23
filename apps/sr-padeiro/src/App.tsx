import { useEffect, useState } from 'react';
import { Home, ShoppingCart, Package, WalletCards, Menu, Plus, AlertTriangle, TrendingUp, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import Auth from './Auth';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="splash"><div className="brand-mark">SP</div><strong>Sr. Padeiro</strong></div>;
  if (!session) return <Auth />;

  const firstName = session.user.user_metadata?.full_name?.split(' ')[0] || 'empreendedor';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Sr. Padeiro</span>
          <h1>Bom dia, {firstName} 👋</h1>
        </div>
        <button className="icon-button" title="Sair" onClick={() => supabase.auth.signOut()}><LogOut size={19}/></button>
      </header>

      <main className="content">
        <section className="hero-card">
          <span>Vendas de hoje</span>
          <strong>R$ 0,00</strong>
          <small>Comece sua primeira venda</small>
        </section>

        <button className="primary-action"><Plus size={20} /> Nova venda</button>

        <section className="grid">
          <article className="metric-card"><WalletCards size={22} /><span>Caixa</span><strong>Fechado</strong></article>
          <article className="metric-card warning"><AlertTriangle size={22} /><span>Estoque</span><strong>0 alertas</strong></article>
        </section>

        <section className="summary">
          <div className="section-title"><h2>Resumo do dia</h2><TrendingUp size={20} /></div>
          <div className="summary-row"><span>Vendas</span><strong>R$ 0,00</strong></div>
          <div className="summary-row"><span>Transações</span><strong>0</strong></div>
          <div className="summary-row"><span>Ticket médio</span><strong>R$ 0,00</strong></div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        <button className="active"><Home size={20}/><span>Início</span></button>
        <button><ShoppingCart size={20}/><span>Vender</span></button>
        <button><Package size={20}/><span>Produtos</span></button>
        <button><WalletCards size={20}/><span>Caixa</span></button>
        <button><Menu size={20}/><span>Mais</span></button>
      </nav>
    </div>
  );
}
