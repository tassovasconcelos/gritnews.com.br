import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, Flame, Package, Plus, Receipt, Settings, ShoppingCart, Store, Users, WalletCards } from 'lucide-react';
import { loadState, saveState, type AppState, type Order, type Product } from './store';
import { cloudAddProduct, cloudCloseOrder, cloudCreateOrder, cloudSaveBusiness, cloudSyncItem, hydrateCloudState } from './cloudStore';

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const total = (order: Order) => order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

type Screen = 'dashboard' | 'sale' | 'orders' | 'products' | 'customers' | 'reports' | 'settings';
type PaymentMethod = 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'other';
type Props = { tenantId: string; userId: string };

export default function App({ tenantId, userId }: Props) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [screen, setScreen] = useState<Screen>(state.onboarded ? 'dashboard' : 'settings');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Espetinhos' });
  const [orderLabel, setOrderLabel] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cloudStatus, setCloudStatus] = useState<'loading'|'online'|'cache'>('loading');

  useEffect(() => {
    let mounted = true;
    hydrateCloudState(tenantId).then(next => {
      if (!mounted) return;
      if (next) {
        setState(next);
        saveState(next);
        setScreen('dashboard');
        setCloudStatus('online');
      } else setCloudStatus('cache');
    }).catch(() => mounted && setCloudStatus('cache'));
    return () => { mounted = false; };
  }, [tenantId]);

  const persist = (next: AppState) => { setState(next); saveState(next); };
  const markCloudError = () => setCloudStatus('cache');
  const openOrders = state.orders.filter((order) => order.status === 'open');
  const paidOrders = state.orders.filter((order) => order.status === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + total(order), 0);
  const activeOrder = state.orders.find((order) => order.id === activeOrderId) ?? null;
  const soldItems = paidOrders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.qty, 0), 0);
  const ticket = paidOrders.length ? revenue / paidOrders.length : 0;

  const productRanking = useMemo(() => {
    const map = new Map<string,{name:string;qty:number;revenue:number}>();
    paidOrders.forEach(order => order.items.forEach(item => {
      const current = map.get(item.productId) || { name: item.name, qty: 0, revenue: 0 };
      current.qty += item.qty;
      current.revenue += item.qty * item.unitPrice;
      map.set(item.productId, current);
    }));
    return [...map.values()].sort((a,b) => b.qty - a.qty);
  }, [paidOrders]);

  const customerSummary = useMemo(() => {
    const map = new Map<string,{name:string;orders:number;spent:number}>();
    paidOrders.forEach(order => {
      const name = order.customer || order.label;
      const current = map.get(name) || { name, orders: 0, spent: 0 };
      current.orders += 1;
      current.spent += total(order);
      map.set(name, current);
    });
    return [...map.values()].sort((a,b) => b.spent - a.spent);
  }, [paidOrders]);

  const metrics = [
    { label: 'Vendas registradas', value: money(revenue), helper: `${paidOrders.length} contas fechadas` },
    { label: 'Contas abertas', value: String(openOrders.length), helper: `${money(openOrders.reduce((s, o) => s + total(o), 0))} em aberto` },
    { label: 'Ticket médio', value: money(ticket), helper: 'Contas já fechadas' },
    { label: 'Produtos vendidos', value: String(soldItems), helper: 'Itens finalizados' },
  ];

  function startOrder(label?: string) {
    const id = crypto.randomUUID();
    const resolvedLabel = (label || orderLabel).trim() || `Comanda #${state.orders.length + 1}`;
    const order: Order = { id, label: resolvedLabel, customer: resolvedLabel, openedAt: new Date().toISOString(), items: [], status: 'open' };
    persist({ ...state, orders: [order, ...state.orders] });
    setOrderLabel('');
    setActiveOrderId(id);
    setScreen('sale');
    cloudCreateOrder(tenantId, userId, order).catch(markCloudError);
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
    const nextOrder = orders.find(o => o.id === activeOrder.id)!;
    const nextItem = nextOrder.items.find(i => i.productId === product.id)!;
    cloudSyncItem(tenantId, nextOrder.id, nextItem, product.id, total(nextOrder), userId).catch(markCloudError);
  }

  function changeQty(productId: string, delta: number) {
    if (!activeOrder) return;
    const orders = state.orders.map((order) => {
      if (order.id !== activeOrder.id) return order;
      return { ...order, items: order.items.map((item) => item.productId === productId ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter((item) => item.qty > 0) };
    });
    persist({ ...state, orders });
    const nextOrder = orders.find(o => o.id === activeOrder.id)!;
    const nextItem = nextOrder.items.find(i => i.productId === productId) || null;
    cloudSyncItem(tenantId, nextOrder.id, nextItem, productId, total(nextOrder), userId).catch(markCloudError);
  }

  function closeOrder() {
    if (!activeOrder || !activeOrder.items.length) return;
    const amount = total(activeOrder);
    persist({ ...state, orders: state.orders.map((order) => order.id === activeOrder.id ? { ...order, status: 'paid' as const } : order) });
    cloudCloseOrder(tenantId, userId, activeOrder, amount, paymentMethod).catch(markCloudError);
    setActiveOrderId(null);
    setPaymentMethod('pix');
    setScreen('orders');
  }

  async function addProduct() {
    const price = Number(newProduct.price.replace(',', '.'));
    if (!newProduct.name.trim() || !price) return;
    const draft = { name: newProduct.name.trim(), price, category: newProduct.category, active: true };
    const cloudProduct = await cloudAddProduct(tenantId, draft).catch(() => null);
    const product: Product = cloudProduct || { id: crypto.randomUUID(), ...draft };
    if (!cloudProduct) markCloudError();
    persist({ ...state, products: [...state.products, product] });
    setNewProduct({ name: '', price: '', category: 'Espetinhos' });
  }

  function saveBusiness() {
    const next = { ...state, onboarded: true };
    persist(next);
    cloudSaveBusiness(tenantId, next.settings).catch(markCloudError);
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
        <div className="trial-card"><span>Operação em nuvem</span><strong>{cloudStatus === 'online' ? 'Online' : cloudStatus === 'loading' ? '...' : 'Cache'}</strong><small>{cloudStatus === 'online' ? 'Dados sincronizados com segurança.' : 'O app preserva a operação localmente.'}</small><button onClick={() => setScreen('reports')}>Ver gerencial</button></div>
      </aside>

      <main>
        <header className="topbar"><div><span className="eyebrow">{state.settings.businessName}</span><h1>{screen === 'dashboard' ? 'Seu negócio em um só lugar' : menu.find((m) => m.key === screen)?.label}</h1><p>Operação rápida para vender sem complicação.</p></div><div className="store-pill"><Store size={18} /> {state.settings.businessName}</div></header>

        {screen === 'dashboard' && <>
          <section className="metrics-grid">{metrics.map((metric) => <article className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.helper}</small></article>)}</section>
          <section className="content-grid"><article className="panel sale-panel"><div className="panel-head"><div><span className="eyebrow">Operação</span><h2>Venda rápida</h2></div><button className="primary" onClick={() => startOrder()}>+ Nova conta</button></div><div className="empty-state"><div className="empty-icon"><ShoppingCart size={28} /></div><h3>{openOrders.length ? `${openOrders.length} conta(s) em andamento` : 'Pronto para vender'}</h3><p>Abra uma conta por cliente, mesa ou comanda e lance produtos com poucos toques.</p><button className="primary" onClick={() => startOrder()}>Começar a vender</button></div></article><article className="panel"><div className="panel-head"><div><span className="eyebrow">Resumo</span><h2>Movimento registrado</h2></div></div><div className="summary-list"><div><span>Contas abertas</span><strong>{openOrders.length}</strong></div><div><span>Contas fechadas</span><strong>{paidOrders.length}</strong></div><div><span>Produtos cadastrados</span><strong>{state.products.length}</strong></div><div className="summary-total"><span>Faturamento</span><strong>{money(revenue)}</strong></div></div></article></section>
        </>}

        {screen === 'sale' && <section className="sale-workspace"><div className="panel"><div className="panel-head"><div><span className="eyebrow">Produtos</span><h2>{activeOrder ? activeOrder.label : 'Abra uma conta'}</h2></div>{!activeOrder && <button className="primary" onClick={() => startOrder()}>+ Abrir conta</button>}</div>{!activeOrder && <div className="quick-order"><input value={orderLabel} onChange={e=>setOrderLabel(e.target.value)} placeholder="Cliente, mesa ou comanda"/><small>Ex.: João, Mesa 4 ou Comanda 18</small></div>}<div className="product-grid">{state.products.filter(p => p.active).map((product) => <button className="product-tile" key={product.id} onClick={() => addItem(product)} disabled={!activeOrder}><span>{product.category}</span><strong>{product.name}</strong><b>{money(product.price)}</b></button>)}</div></div><div className="panel order-panel"><span className="eyebrow">Conta atual</span>{activeOrder ? <><h2>{activeOrder.label}</h2><div className="order-items">{activeOrder.items.length === 0 && <p className="muted">Nenhum item lançado.</p>}{activeOrder.items.map(item => <div className="order-row" key={item.productId}><div><strong>{item.name}</strong><span>{money(item.unitPrice)} cada</span></div><div className="qty"><button onClick={() => changeQty(item.productId, -1)}>-</button><b>{item.qty}</b><button onClick={() => changeQty(item.productId, 1)}>+</button></div><strong>{money(item.qty * item.unitPrice)}</strong></div>)}</div><div className="order-total"><span>Total</span><strong>{money(total(activeOrder))}</strong></div><label className="payment-choice">Forma de pagamento<select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as PaymentMethod)}><option value="pix">PIX</option><option value="cash">Dinheiro</option><option value="credit_card">Cartão de crédito</option><option value="debit_card">Cartão de débito</option><option value="other">Outro</option></select></label><button className="primary full" onClick={closeOrder}>Receber e finalizar</button></> : <div className="empty-state compact"><Receipt size={28}/><p>Abra uma nova conta para iniciar.</p></div>}</div></section>}

        {screen === 'orders' && <section className="panel"><div className="panel-head"><div><span className="eyebrow">Comandas</span><h2>Contas abertas</h2></div><div className="quick-open"><input value={orderLabel} onChange={e=>setOrderLabel(e.target.value)} placeholder="Cliente ou mesa"/><button className="primary" onClick={() => startOrder()}>+ Nova conta</button></div></div><div className="cards-list">{openOrders.length === 0 && <div className="empty-state compact"><Check size={28}/><h3>Nenhuma conta pendente</h3></div>}{openOrders.map(order => <button className="account-card" key={order.id} onClick={() => { setActiveOrderId(order.id); setScreen('sale'); }}><div><strong>{order.label}</strong><span>{order.items.reduce((s, i) => s + i.qty, 0)} itens</span></div><strong>{money(total(order))}</strong></button>)}</div></section>}

        {screen === 'products' && <section className="content-grid"><article className="panel"><div className="panel-head"><div><span className="eyebrow">Cardápio</span><h2>Produtos</h2></div></div><div className="cards-list">{state.products.map(product => <div className="account-card static" key={product.id}><div><strong>{product.name}</strong><span>{product.category}</span></div><strong>{money(product.price)}</strong></div>)}</div></article><article className="panel"><span className="eyebrow">Cadastro rápido</span><h2>Novo produto</h2><div className="form-grid"><label>Produto<input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ex.: Coração" /></label><label>Preço<input value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="10,00" inputMode="decimal" /></label><label>Categoria<select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}><option>Espetinhos</option><option>Bebidas</option><option>Acompanhamentos</option><option>Outros</option></select></label><button className="primary" onClick={addProduct}><Plus size={17}/> Adicionar produto</button></div></article></section>}

        {screen === 'customers' && <section className="panel"><div className="panel-head"><div><span className="eyebrow">Histórico</span><h2>Clientes, mesas e comandas</h2></div></div><div className="cards-list">{customerSummary.length === 0 && <div className="empty-state compact"><Users size={28}/><h3>O histórico começa na primeira venda</h3><p>Identifique a conta pelo nome do cliente ou mesa para acompanhar recorrência e consumo.</p></div>}{customerSummary.map(customer => <div className="account-card static" key={customer.name}><div><strong>{customer.name}</strong><span>{customer.orders} conta(s) fechada(s)</span></div><strong>{money(customer.spent)}</strong></div>)}</div></section>}

        {screen === 'reports' && <><section className="metrics-grid">{metrics.map(metric=><article className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.helper}</small></article>)}</section><section className="content-grid"><article className="panel"><span className="eyebrow">Ranking</span><h2>Produtos mais vendidos</h2><div className="summary-list">{productRanking.length===0&&<p className="muted">Feche vendas para formar o ranking.</p>}{productRanking.slice(0,10).map((p,i)=><div key={p.name}><span>{i+1}. {p.name}</span><strong>{p.qty} un. • {money(p.revenue)}</strong></div>)}</div></article><article className="panel"><span className="eyebrow">Gestão</span><h2>Leitura rápida</h2><div className="summary-list"><div><span>Receita registrada</span><strong>{money(revenue)}</strong></div><div><span>Ticket médio</span><strong>{money(ticket)}</strong></div><div><span>Itens vendidos</span><strong>{soldItems}</strong></div><div><span>Contas em aberto</span><strong>{openOrders.length}</strong></div></div></article></section></>}

        {screen === 'settings' && <section className="content-grid"><article className="panel"><span className="eyebrow">Configuração</span><h2>Seu estabelecimento</h2><div className="form-grid"><label>Nome do negócio<input value={state.settings.businessName} onChange={e => setState({ ...state, settings: { ...state.settings, businessName: e.target.value } })} /></label><label>Endereço<input value={state.settings.address} onChange={e => setState({ ...state, settings: { ...state.settings, address: e.target.value } })} placeholder="Rua, número, bairro" /></label><label>WhatsApp<input value={state.settings.whatsapp} onChange={e => setState({ ...state, settings: { ...state.settings, whatsapp: e.target.value } })} placeholder="(85) 99999-9999" /></label><button className="primary" onClick={saveBusiness}><Check size={17}/> Salvar alterações</button></div></article><article className="panel"><span className="eyebrow">Infraestrutura</span><h2>Status</h2><div className="summary-list"><div><span>Aplicação</span><strong>Ativa</strong></div><div><span>Persistência</span><strong>{cloudStatus === 'online' ? 'Supabase + cache' : 'Cache local'}</strong></div><div><span>Sincronização</span><strong>{cloudStatus === 'online' ? 'Online' : cloudStatus === 'loading' ? 'Conectando' : 'Contingência'}</strong></div><div><span>Ambiente</span><strong>Produção</strong></div></div></article></section>}
      </main>
    </div>
  );
}
