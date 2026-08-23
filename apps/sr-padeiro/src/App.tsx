import { Home, ShoppingCart, Package, WalletCards, Menu, Plus, AlertTriangle, TrendingUp } from 'lucide-react';

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Sr. Padeiro</span>
          <h1>Bom dia 👋</h1>
        </div>
        <div className="brand-mark">SP</div>
      </header>

      <main className="content">
        <section className="hero-card">
          <span>Vendas de hoje</span>
          <strong>R$ 0,00</strong>
          <small>Comece sua primeira venda</small>
        </section>

        <button className="primary-action">
          <Plus size={20} /> Nova venda
        </button>

        <section className="grid">
          <article className="metric-card">
            <WalletCards size={22} />
            <span>Caixa</span>
            <strong>Fechado</strong>
          </article>
          <article className="metric-card warning">
            <AlertTriangle size={22} />
            <span>Estoque</span>
            <strong>0 alertas</strong>
          </article>
        </section>

        <section className="summary">
          <div className="section-title">
            <h2>Resumo do dia</h2>
            <TrendingUp size={20} />
          </div>
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
