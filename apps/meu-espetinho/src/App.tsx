import { useMemo, useState } from 'react';
import { BarChart3, Check, Flame, Package, Plus, Receipt, Settings, ShoppingCart, Store, Users, WalletCards } from 'lucide-react';
import { loadState, saveState, type AppState, type Order, type Product } from './store';
import { supabaseConfigured } from './lib/supabase';

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const total = (order: Order) => order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

type Screen = 'dashboard' | 'sale' | 'orders' | 'products' | 'customers' | 'reports' | 'settings';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [screen, setScreen] = useState<Screen>(state.onboarded ? 'dashboard' : 'settings');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Espetinhos' });

  const persist = (next: AppState) => { setState(next); saveState(next); };
  const openOrders = state.orders.filter((order) => order.status === 'open');
  const paidOrders = state.orders.filter((order) => order.status === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + total(order), 0);
  const activeOrder = state.orders.find((order) => order.id === activeOrderId) ?? null;
  const soldItems = paidOrders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.qty, 0), 0);
  const ticket = paidOrders.length ? revenue / paidOrders.length : 0;

  const metrics = [
    { label: 'Vendas registradas', value: money(revenue), helper: `${paidOrders.length} contas fechadas` },
    { label: 'Contas abertas', value: String(openOrders.length), helper: `${money(openOrders.reduce((s, o) => s + total(o), 0))} em aberto` },
    { label: 'Ticket médio', value: money(ticket), helper: 'Contas já fechadas' },
    { label: 'Produtos vendidos', value: String(soldItems), helper: 'Itens finalizados' },
  ];

  function startOrder(label?: string) {
    const id = crypto.randomUUID();
    const order: Order = { id, label: label || `Comanda #${state.orders.length + 1}`, openedAt: new Date().toISOString(), items: [], status: 'open' };
    persist({ ...state, orders: [order, ...state.orders] });
    setActiveOrderId(id);
    setScreen('sale');
  }

  function addItem(product: Product) {
    if (!activeOrder) return;
    const orders = state.orders.map((order) => {
      if (order.id !== activeOrder.id) return order;
      const found = order.items.find((item) => item.productId === product.id);
      const items = found
        ? order.items.map((item) => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item)
        : [...order.items, { productId: product.id, name: product.name, qty: 1, unitPrice: product.price }];
      return { ...order, items };
    });
    persist({ ...state, orders });
  }

  function changeQty(productId: string, delta: number) {
    if (!activeOrder) return;
    const orders = state.orders.map((order) => {
      if (order.id !== activeOrder.id) return order;
      return { ...order, items: order.items.map((item) => item.productId === productId ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter((item) => item.qty > 0) };
    });
    persist({ ...state, orders });
  }

  function closeOrder() {
    if (!activeOrder || !activeOrder.items.length) return;
    persist({ ...state, orders: state.orders.map((order) => order.id === activeOrder.id ? { ...order, status: 'paid' as const } : order) });
    setActiveOrderId(null);
    setScreen('orders');
  }

  function addProduct() {
    const price = Number(newProduct.price.replace(',', '.'));
    if (!newProduct.name.trim() || !price) return;
    persist({ ...state, products: [...state.products, { id: crypto.randomUUID(), name: newProduct.name.trim(), price, category: newProduct.category, active: true }] });
    setNewProduct({ name: '', price: '', category: 'Espetinhos' });
  }

  function saveBusiness() {
    persist({ ...state, onboarded: true });
    setScreen('dashboard');
  }

  const menu = [
    { key: 'dashboard', icon: BarChart3, label: 'Visão geral' },
    { key: 'sale', icon: ShoppingCart, label: 'Nova venda' },
    { key: 'orders', icon: Receipt, label: 'Contas abertas' },
    { key: 'products', icon: Package, label: 'Produtos' },
    { key: 'customers', icon: Users, label: 'Clientes' },
    { key: 'reports', icon: WalletCards, label: 'Gerencial' },
    { key: 'settings', icon: Settings, label: 'Configurações' },
  ] as const;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Flame size={22} /></div><div><strong>Meu Espetinho</strong><span>Gestão simples</span></div></div>
        <nav>{menu.map(({ key, icon: Icon, label }) => <button key={key} onClick={() => setScreen(key)} className={screen === key ? 'nav-item active' : 'nav-item'}><Icon size={19} /><span>{label}</span></button>)}</nav>
        <div className="trial-card"><span>Período gratuito</span><strong>3 dias</strong><small>{supabaseConfigured ? 'Nuvem conectada.' : 'Modo local de implantação.'}</small><button>Conhecer planos</button></div>
      </aside>

      <main>
        <header className="topbar"><div><span className="eyebrow">{state.settings.businessName}</span><h1>{screen === 'dashboard' ? 'Seu negócio em um só lugar' : menu.find((m) => m.key === screen)?.label}</h1><p>Operação rápida para vender sem complicação.</p></div><div className="store-pill"><Store size={18} /> {state.settings.businessName}</div></header>

        {screen === 'dashboard' && <>
          <section className="metrics-grid">{metrics.map((metric) => <article className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.helper}</small></article>)}</section>
          <section className="content-grid"><article className="panel sale-panel"><div className="panel-head"><div><span className="eyebrow">Operação</span><h2>Venda rápida</h2></div><button className="primary" onClick={() => startOrder()}>+ Nova conta</button></div><div className="empty-state"><div className="empty-icon"><ShoppingCart size={28} /></div><h3>{openOrders.length ? `${openOrders.length} conta(s) em andamento` : 'Pronto para vender'}</h3><p>Abra uma conta por cliente, mesa ou comanda e lance produtos com poucos toques.</p><button className="primary" onClick={() => startOrder()}>Começar a vender</button></div></article><article className="panel"><div className="panel-head"><div><span className="eyebrow">Resumo</span><h2>Movimento registrado</h2></div></div><div className="summary-list"><div><span>Contas abertas</span><strong>{openOrders.length}</strong></div><div><span>Contas fechadas</span><strong>{paidOrders.length}</strong></div><div><span>Produtos cadastrados</span><strong>{state.products.length}</strong></div><div className="summary-total"><span>Faturamento</span><strong>{money(revenue)}</strong></div></div></article></section>
        </>}

        {screen === 'sale' && <section className="sale-workspace"><div className="panel"><div className="panel-head"><div><span className="eyebrow">Produtos</span><h2>{activeOrder ? activeOrder.label : 'Abra uma conta'}</h2></div>{!activeOrder && <button className="primary" onClick={() => startOrder()}>+ Abrir conta</button>}</div><div className="product-grid">{state.products.filter(p => p.active).map((product) => <button className="product-tile" key={product.id} onClick={() => addItem(product)} disabled={!activeOrder}><span>{product.category}</span><strong>{product.name}</strong><b>{money(product.price)}</b></button>)}</div></div><div className="panel order-panel"><span className="eyebrow">Conta atual</span>{activeOrder ? <><h2>{activeOrder.label}</h2><div className="order-items">{activeOrder.items.length === 0 && <p className="muted">Nenhum item lançado.</p>}{activeOrder.items.map(item => <div className="order-row" key={item.productId}><div><strong>{item.name}</strong><span>{money(item.unitPrice)} cada</span></div><div className="qty"><button onClick={() => changeQty(item.productId, -1)}>-</button><b>{item.qty}</b><button onClick={() => changeQty(item.productId, 1)}>+</button></div><strong>{money(item.qty * item.unitPrice)}</strong></div>)}</div><div className="order-total"><span>Total</span><strong>{money(total(activeOrder))}</strong></div><button className="primary full" onClick={closeOrder}>Receber e finalizar</button></> : <div className="empty-state compact"><Receipt size={28}/><p>Abra uma nova conta para iniciar.</p></div>}</div></section>}

        {screen === 'orders' && <section className="panel"><div className="panel-head"><div><span className="eyebrow">Comandas</span><h2>Contas abertas</h2></div><button className="primary" onClick={() => startOrder()}>+ Nova conta</button></div><div className="cards-list">{openOrders.length === 0 && <div className="empty-state compact"><Check size={28}/><h3>Nenhuma conta pendente</h3></div>}{openOrders.map(order => <button className="account-card" key={order.id} onClick={() => { setActiveOrderId(order.id); setScreen('sale'); }}><div><strong>{order.label}</strong><span>{order.items.reduce((s, i) => s + i.qty, 0)} itens</span></div><strong>{money(total(order))}</strong></button>)}</div></section>}

        {screen === 'products' && <section className="content-grid"><article className="panel"><div className="panel-head"><div><span className="eyebrow">Cardápio</span><h2>Produtos</h2></div></div><div className="cards-list">{state.products.map(product => <div className="account-card static" key={product.id}><div><strong>{product.name}</strong><span>{product.category}</span></div><strong>{money(product.price)}</strong></div>)}</div></article><article className="panel"><span className="eyebrow">Cadastro rápido</span><h2>Novo produto</h2><div className="form-grid"><label>Produto<input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ex.: Coração" /></label><label>Preço<input value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="10,00" inputMode="decimal" /></label><label>Categoria<select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}><option>Espetinhos</option><option>Bebidas</option><option>Acompanhamentos</option><option>Outros</option></select></label><button className="primary" onClick={addProduct}><Plus size={17}/> Adicionar produto</button></div></article></section>}

        {(screen === 'customers' || screen === 'reports') && <section className="panel"><div className="empty-state"><BarChart3 size={30}/><h3>{screen === 'customers' ? 'Clientes e histórico' : 'Gerencial em preparação'}</h3><p>{screen === 'customers' ? 'A próxima etapa conecta nome, telefone e consumo por cliente.' : 'Aqui entrarão vendas por período, produtos, formas de pagamento, ticket e margem.'}</p></div></section>}

        {screen === 'settings' && <section className="content-grid"><article className="panel"><span className="eyebrow">Primeira configuração</span><h2>Seu estabelecimento</h2><div className="form-grid"><label>Nome do negócio<input value={state.settings.businessName} onChange={e => setState({ ...state, settings: { ...state.settings, businessName: e.target.value } })} /></label><label>Endereço<input value={state.settings.address} onChange={e => setState({ ...state, settings: { ...state.settings, address: e.target.value } })} placeholder="Rua, número, bairro" /></label><label>WhatsApp<input value={state.settings.whatsapp} onChange={e => setState({ ...state, settings: { ...state.settings, whatsapp: e.target.value } })} placeholder="(85) 99999-9999" /></label><button className="primary" onClick={saveBusiness}><Check size={17}/> Salvar e começar</button></div></article><article className="panel"><span className="eyebrow">Infraestrutura</span><h2>Status</h2><div className="summary-list"><div><span>Aplicação</span><strong>Ativa</strong></div><div><span>Persistência</span><strong>{supabaseConfigured ? 'Supabase' : 'LocalStorage'}</strong></div><div><span>Trial</span><strong>3 dias</strong></div><div><span>Ambiente</span><strong>MVP</strong></div></div></article></section>}
      </main>
    </div>
  );
}
