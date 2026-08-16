import { BarChart3, CheckCircle2, Flame, Package, Receipt, ShieldCheck, ShoppingCart, Store, Users, WalletCards, Zap } from 'lucide-react';

const features = [
  [Zap, 'PDV rápido', 'Venda em segundos com poucos toques.'],
  [Receipt, 'Comandas', 'Controle por cliente, mesa ou número.'],
  [Package, 'Produtos', 'Preços, categorias e cardápio organizado.'],
  [BarChart3, 'Relatórios', 'Saiba o que vende mais e quando.'],
  [WalletCards, 'Caixa', 'Entradas, saídas e fechamento.'],
  [Users, 'Clientes', 'Histórico e recorrência de consumo.'],
  [ShieldCheck, 'Usuários', 'Permissões e segurança por função.'],
  [Store, 'Personalização', 'Sua logo, endereço e identidade.'],
] as const;

const benefits = [
  'Lançamento rápido de vendas',
  'Controle de contas abertas',
  'Fechamento por forma de pagamento',
  'Histórico de consumo por cliente',
  'Relatórios e indicadores gerenciais',
  'Funcionários com permissões',
  'Personalização com sua marca',
  'Funciona em celular, tablet e computador',
];

export default function Marketing() {
  const appUrl = '/app';
  return <div className="marketing-page">
    <header className="marketing-nav">
      <a className="marketing-brand" href="#inicio"><img src="/logo-meu-espetinho.svg" alt="Meu Espetinho" /></a>
      <nav><a href="#recursos">Funcionalidades</a><a href="#beneficios">Benefícios</a><a href="#planos">Planos</a></nav>
      <a className="cta small" href={appUrl}>Acessar app</a>
    </header>

    <main>
      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="hero-logo"><img src="/logo-meu-espetinho.svg" alt="Meu Espetinho — seu negócio no controle" /></div>
          <span className="hero-kicker">Gestão simples para quem vive de vender</span>
          <h1>Seu espetinho organizado.<br/><em>Seu lucro na mão.</em></h1>
          <p>Controle vendas, comandas, produtos, caixa, clientes e relatórios em um sistema feito para espetinhos, trailers, barracas e pequenos negócios de alimentação.</p>
          <div className="hero-actions"><a className="cta" href={appUrl}><ShoppingCart size={20}/> Começar agora</a><a className="ghost" href="#planos">Ver planos</a></div>
          <div className="hero-badges"><span><CheckCircle2/> 3 dias grátis</span><span><CheckCircle2/> Ativação R$ 199</span><span><CheckCircle2/> Mensalidade R$ 89</span></div>
        </div>
        <div className="hero-visual" aria-label="Prévia do dashboard Meu Espetinho">
          <div className="glow"></div>
          <div className="mock-window">
            <div className="mock-head"><span></span><span></span><span></span><b>Dashboard</b></div>
            <div className="mock-metrics"><article><small>Faturamento hoje</small><strong>R$ 2.840,00</strong><em>+12%</em></article><article><small>Pedidos</small><strong>137</strong><em>+9%</em></article><article><small>Ticket médio</small><strong>R$ 20,73</strong></article><article><small>Contas abertas</small><strong>9 / R$ 416</strong></article></div>
            <div className="mock-chart"><div><span style={{height:'28%'}}></span><span style={{height:'45%'}}></span><span style={{height:'62%'}}></span><span style={{height:'88%'}}></span><span style={{height:'70%'}}></span><span style={{height:'52%'}}></span></div><p>Vendas por horário</p></div>
          </div>
          <div className="skewer-card"><Flame/><div><b>Controle que dá resultado</b><span>Venda rápido. Feche certo. Decida com dados.</span></div></div>
        </div>
      </section>

      <section className="feature-strip" id="recursos">{features.map(([Icon,title,text])=><article key={title}><Icon/><h3>{title}</h3><p>{text}</p></article>)}</section>

      <section className="benefits" id="beneficios">
        <div><span className="section-kicker">Tudo em um só lugar</span><h2>Menos confusão.<br/><em>Mais controle.</em></h2><p>O Meu Espetinho acompanha sua operação do primeiro pedido ao fechamento do caixa e transforma a rotina em informação para decidir melhor.</p><div className="benefit-list">{benefits.map(item=><span key={item}><CheckCircle2/> {item}</span>)}</div></div>
        <div className="report-card"><span>Visão gerencial</span><h3>Controle é lucrar.</h3><p>Veja rapidamente faturamento, ticket médio, produtos vendidos e contas em aberto.</p><div className="report-grid"><b>+ organização<small>operação clara</small></b><b>- erros<small>fechamento seguro</small></b><b>+ vendas<small>atendimento rápido</small></b><b>+ lucro<small>dados na mão</small></b></div></div>
      </section>

      <section className="pricing" id="planos">
        <div className="pricing-intro"><span className="section-kicker">Planos e preços</span><h2>Um investimento pequeno para organizar um negócio inteiro.</h2><p>Comece por 3 dias sem compromisso. Depois, mantenha seu Meu Espetinho ativo com um plano simples e transparente.</p></div>
        <article className="price-card light"><span>Ativação única</span><strong><small>R$</small>199,00</strong><ul><li>Configuração inicial</li><li>Personalização da sua marca</li><li>Treinamento inicial</li><li>Suporte na implantação</li></ul></article>
        <article className="price-card featured"><span>Plano mensal</span><strong><small>R$</small>89,00<small>/mês</small></strong><ul><li>Sistema completo</li><li>Usuários e permissões</li><li>Relatórios gerenciais</li><li>Atualizações gratuitas</li><li>Backup em nuvem</li></ul><a className="cta full" href={appUrl}>Começar agora</a></article>
        <article className="price-card trial"><span>Teste grátis</span><strong>3 dias</strong><p>Experimente sem compromisso e conheça a rotina do sistema antes de assinar.</p><a className="cta green full" href={appUrl}>Testar grátis</a></article>
      </section>

      <section className="closing-cta"><div><img src="/logo-meu-espetinho.svg" alt="Meu Espetinho"/><h2>Comece agora e coloque seu negócio no controle.</h2><p>Organização, agilidade e informação para vender melhor todos os dias.</p></div><a className="cta" href={appUrl}>Quero meu sistema agora</a></section>
    </main>
    <footer><div><ShieldCheck/> Dados protegidos</div><div>Suporte especializado</div><div>Atualizações contínuas</div><div>© 2026 Meu Espetinho · Desenvolvido por GRIT</div></footer>
  </div>;
}
