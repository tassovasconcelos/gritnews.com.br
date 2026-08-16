import { BarChart3, Flame, Package, Receipt, Settings, ShoppingCart, Store, Users } from 'lucide-react';

const metrics = [
  { label: 'Vendas hoje', value: 'R$ 0,00', helper: '0 pedidos' },
  { label: 'Contas abertas', value: '0', helper: 'R$ 0,00 em aberto' },
  { label: 'Ticket médio', value: 'R$ 0,00', helper: 'Atualizado em tempo real' },
  { label: 'Produtos vendidos', value: '0', helper: 'Hoje' },
];

const menu = [
  { icon: ShoppingCart, label: 'Nova venda', active: true },
  { icon: Receipt, label: 'Contas abertas' },
  { icon: Package, label: 'Produtos' },
  { icon: Users, label: 'Clientes' },
  { icon: BarChart3, label: 'Gerencial' },
  { icon: Settings, label: 'Configurações' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Flame size={22} /></div>
          <div>
            <strong>Meu Espetinho</strong>
            <span>Gestão simples</span>
          </div>
        </div>

        <nav>
          {menu.map(({ icon: Icon, label, active }) => (
            <button key={label} className={active ? 'nav-item active' : 'nav-item'}>
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="trial-card">
          <span>Período gratuito</span>
          <strong>3 dias</strong>
          <small>Experimente todos os recursos.</small>
          <button>Conhecer planos</button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">Painel do estabelecimento</span>
            <h1>Bom dia 👋</h1>
            <p>Seu movimento de hoje aparece aqui em tempo real.</p>
          </div>
          <div className="store-pill"><Store size={18} /> Meu Espetinho</div>
        </header>

        <section className="metrics-grid">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.helper}</small>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel sale-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">Operação</span>
                <h2>Venda rápida</h2>
              </div>
              <button className="primary">+ Nova conta</button>
            </div>
            <div className="empty-state">
              <div className="empty-icon"><ShoppingCart size={28} /></div>
              <h3>Pronto para a primeira venda</h3>
              <p>Abra uma conta por cliente, mesa ou comanda e lance os produtos com poucos toques.</p>
              <button className="primary">Começar a vender</button>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">Hoje</span>
                <h2>Resumo do caixa</h2>
              </div>
            </div>
            <div className="summary-list">
              <div><span>Dinheiro</span><strong>R$ 0,00</strong></div>
              <div><span>PIX</span><strong>R$ 0,00</strong></div>
              <div><span>Cartão</span><strong>R$ 0,00</strong></div>
              <div className="summary-total"><span>Total recebido</span><strong>R$ 0,00</strong></div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
