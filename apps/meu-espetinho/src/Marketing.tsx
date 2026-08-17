import { BarChart3, CheckCircle2, ClipboardList, CreditCard, Headphones, Package, Receipt, ShieldCheck, ShoppingCart, Store, Users, WalletCards, Zap } from 'lucide-react';
import { trackMarketing } from './lib/analytics';
import './marketing.css';

const features = [
  [Zap, 'Venda rápida e simples', 'Registre pedidos em poucos toques, sem complicar a rotina da equipe.'],
  [Receipt, 'Comanda digital', 'Controle por mesa, cliente ou número e feche a conta com histórico completo.'],
  [WalletCards, 'Caixa e recebimentos', 'Dinheiro, PIX, cartão e fiado organizados em um só lugar.'],
  [Users, 'Clientes e fiado', 'Cadastre clientes, acompanhe saldos e registre pagamentos com clareza.'],
  [Package, 'Produtos e estoque opcional', 'Use só o básico ou ative controle de estoque quando fizer sentido para o negócio.'],
  [ClipboardList, 'Lista de compras', 'O sistema analisa as vendas e sugere o que comprar para a próxima semana.'],
  [BarChart3, 'Indicadores fáceis', 'Veja faturamento, ticket médio, produtos vendidos e movimento sem planilhas.'],
  [ShieldCheck, 'Equipe e rastreabilidade', 'Acessos individuais para saber quem abriu, atendeu e fechou cada conta.'],
] as const;

const audiences = [
  ['Espetinhos e churrasquinhos', 'Para quem vende no balcão, em mesas, por comanda ou em eventos.'],
  ['Bares e botecos', 'Controle simples de pedidos, mesas, bebidas, fiado e fechamento de caixa.'],
  ['Trailers e food trucks', 'PDV leve para operar pelo celular, tablet ou computador.'],
  ['Barracas e pequenos restaurantes', 'Organização sem exigir conhecimento técnico ou rotina administrativa complexa.'],
];

const faq = [
  ['Existe sistema para controlar vendas de espetinho pelo celular?', 'Sim. O Meu Espetinho funciona na web e pode ser usado pelo celular, tablet ou computador para registrar vendas, comandas, clientes, recebimentos e acompanhar a operação.'],
  ['O sistema serve para churrasquinho, bar ou trailer?', 'Sim. A operação foi desenhada para pequenos negócios de alimentação, como espetinhos, churrasquinhos, bares, botecos, trailers, barracas e food trucks.'],
  ['Preciso saber controlar estoque para usar?', 'Não. O estoque é opcional. Você pode começar apenas com vendas e comandas. A lista de compras consegue sugerir reposição usando o histórico de vendas e, se quiser, você pode informar o estoque atual.'],
  ['Dá para controlar fiado e clientes?', 'Sim. O sistema registra clientes, valores fiados, pagamentos, histórico e saldo a receber.'],
  ['Consigo imprimir ou enviar a conta ao cliente?', 'Sim. No fechamento é possível gerar comprovante para impressora térmica e também uma imagem para compartilhar ou apresentar ao cliente.'],
  ['Quanto custa o Meu Espetinho?', 'O plano mensal é de R$ 89,00 com até 3 usuários incluídos. O setup inicial é de R$ 199,00 para configuração e implantação assistida.'],
];

function tracked(name:string, params:Record<string,string>={}) { trackMarketing({name,params}); }

export default function Marketing() {
  const signup='/cadastro'; const appUrl='/app'; const consultUrl='/contato?assunto=consultoria';
  return <div className="marketing-page">
    <header className="marketing-nav"><a className="marketing-brand" href="#inicio" aria-label="Meu Espetinho"><img src="/logo-meu-espetinho.svg" alt="Meu Espetinho — Seu negócio no controle"/></a><nav><a href="#recursos">Recursos</a><a href="#para-quem">Para quem é</a><a href="#planos">Plano</a><a href="#duvidas">Dúvidas</a></nav><a className="nav-login" href={appUrl}>Entrar</a><a className="cta small" href={signup} onClick={()=>tracked('start_trial',{source:'header'})}>Começar agora</a></header>
    <main>
      <section className="hero" id="inicio"><div className="hero-copy"><span className="hero-kicker">SISTEMA PARA ESPETINHO • COMANDA DIGITAL • PDV</span><h1>Seu negócio<br/>no <em>controle.</em></h1><p className="hero-main">Vendas, comandas, clientes, fiado, caixa e lista de compras em um sistema simples para quem vende espetinho, churrasquinho e comida de rua.</p><p className="hero-sub">Tecnologia para quem tem <strong>sabor de vencer.</strong></p><div className="hero-actions"><a className="cta" href={signup} onClick={()=>tracked('start_trial',{source:'hero'})}><ShoppingCart size={20}/> Quero organizar meu negócio</a><a className="ghost" href="#como-funciona">Ver como funciona</a></div><div className="trust-row"><span><CheckCircle2/> Fácil para a equipe</span><span><ShieldCheck/> Dados em nuvem</span><span><Headphones/> Implantação assistida</span></div></div><div className="hero-visual" aria-label="Demonstração visual do painel Meu Espetinho"><div className="brand-flame-watermark"></div><div className="mock-window"><div className="mock-head"><img src="/favicon.svg" alt=""/><b>Meu Espetinho</b><small>DEMONSTRAÇÃO DO PAINEL</small></div><div className="mock-layout"><aside><span className="active">Visão geral</span><span>Nova venda</span><span>Comandas</span><span>Clientes</span><span>Lista de compras</span><span>Relatórios</span></aside><div><div className="mock-metrics"><article><small>Vendas</small><strong>Hoje</strong><em>acompanhe em tempo real</em></article><article><small>Comandas</small><strong>Abertas</strong><em>sem papel perdido</em></article><article><small>Clientes</small><strong>Fiado</strong><em>saldo organizado</em></article><article><small>Compras</small><strong>Semana</strong><em>sugestão automática</em></article></div><div className="mock-chart"><div><span style={{height:'28%'}}></span><span style={{height:'45%'}}></span><span style={{height:'62%'}}></span><span style={{height:'88%'}}></span><span style={{height:'70%'}}></span><span style={{height:'52%'}}></span></div><p>Exemplo visual de movimento por horário</p></div></div></div></div></div></section>

      <section className="credibility"><div><strong>Simples para começar</strong><span>Não exige conhecimento de gestão.</span></div><div><strong>Funciona onde você estiver</strong><span>Celular, tablet ou computador.</span></div><div><strong>Cresce com o negócio</strong><span>Recursos opcionais conforme sua rotina.</span></div><div><strong>Suporte próximo</strong><span>Implantação orientada pela GRIT.</span></div></section>

      <section className="positioning" id="para-quem"><div className="section-heading"><span className="section-kicker">FEITO PARA O PEQUENO NEGÓCIO DE ALIMENTAÇÃO</span><h2>Um sistema de gestão que fala a língua de quem está no balcão.</h2><p>Se hoje você usa caderno, papel, calculadora, planilha ou várias ferramentas separadas, o Meu Espetinho reúne o essencial em uma operação fácil de aprender.</p></div><div className="audience-grid">{audiences.map(([title,text])=><article key={title}><Store/><h3>{title}</h3><p>{text}</p></article>)}</div><div className="search-intent-copy"><h3>Controle de vendas, comanda eletrônica e PDV sem complicação.</h3><p>O Meu Espetinho ajuda MEIs e pequenos empreendedores que procuram um <strong>sistema para espetinho</strong>, <strong>sistema para churrasquinho</strong>, <strong>comanda digital para bar</strong>, <strong>PDV para trailer ou food truck</strong>, <strong>controle de fiado</strong>, <strong>controle de caixa</strong> e uma forma simples de organizar as compras da semana.</p></div></section>

      <section className="feature-section" id="recursos"><div className="section-heading"><span className="section-kicker">O ESSENCIAL, BEM FEITO</span><h2>Use o que você precisa. O resto pode esperar.</h2><p>Comece simples e ative mais controle conforme o hábito da sua equipe evoluir.</p></div><div className="feature-strip">{features.map(([Icon,title,text])=><article key={title}><span className="feature-icon"><Icon/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="simple-flow" id="como-funciona"><div><span className="section-kicker">DA VENDA AO FECHAMENTO</span><h2>Quatro passos. Sem burocracia.</h2><p>O fluxo foi desenhado para reduzir cliques e deixar o dono no controle sem travar o atendimento.</p></div><ol><li><b>1</b><span><strong>Abra</strong><small>Mesa, cliente ou comanda livre.</small></span></li><li><b>2</b><span><strong>Venda</strong><small>Escolha os itens e registre em poucos toques.</small></span></li><li><b>3</b><span><strong>Receba</strong><small>Dinheiro, PIX, cartão ou fiado.</small></span></li><li><b>4</b><span><strong>Comprove</strong><small>Imprima ou compartilhe a conta em imagem.</small></span></li></ol></section>

      <section className="shopping-bonus"><div className="bonus-icon"><ClipboardList/></div><div><span className="section-kicker">BÔNUS OPERACIONAL</span><h2>Lista de compras para a semana.</h2><p>O Meu Espetinho olha o que você vendeu e sugere uma reposição. Quem controla estoque pode informar o saldo; quem não controla recebe uma sugestão baseada somente nas vendas. Você edita tudo e ainda adiciona carvão, gelo, molhos, descartáveis ou qualquer outro item.</p></div><a className="ghost dark" href={signup} onClick={()=>tracked('start_trial',{source:'shopping_list'})}>Quero testar</a></section>

      <section className="pricing" id="planos"><div className="pricing-intro"><span className="section-kicker">INVESTIMENTO PREVISÍVEL</span><h2>Profissional para o negócio. Simples para o bolso.</h2><p>Implantação acompanhada e uma mensalidade clara, sem transformar o pequeno empresário em especialista em sistema.</p></div><article className="price-card setup"><span>Implantação</span><strong><small>R$</small>199,00</strong><p>Pagamento único.</p><ul><li>Configuração inicial</li><li>Orientação de uso</li><li>Personalização da operação</li></ul></article><article className="price-card featured"><span>Meu Espetinho</span><strong><small>R$</small>89,00<small>/mês</small></strong><ul><li>Até 3 usuários incluídos</li><li>Vendas e comandas</li><li>Clientes e fiado</li><li>Caixa e relatórios</li><li>Comprovante térmico/imagem</li><li>Lista de compras</li><li>Atualizações contínuas</li></ul><small className="extra-user">Usuário adicional: + R$ 39/mês</small><a className="cta full" href={signup} onClick={()=>tracked('begin_checkout',{source:'pricing'})}>Começar agora</a></article></section>

      <section className="faq" id="duvidas"><div className="section-heading"><span className="section-kicker">DÚVIDAS DE QUEM EMPREENDE</span><h2>Respostas rápidas antes de começar.</h2></div><div className="faq-grid">{faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>

      <section className="consulting" id="consultoria"><div><span className="section-kicker">PRECISA DE ALGO DIFERENTE?</span><h2>A tecnologia acompanha o seu negócio.</h2><p>Se sua operação precisar de um fluxo específico, integração ou novo recurso, a GRIT pode avaliar e desenvolver uma solução sob medida.</p></div><a className="ghost dark" href={consultUrl} onClick={()=>tracked('click_consulting') }><Headphones size={20}/> Falar com a GRIT</a></section>

      <section className="closing-cta"><div><img src="/logo-meu-espetinho.svg" alt="Meu Espetinho"/><h2>Tecnologia para quem tem sabor de vencer.</h2><p>Comece organizando o básico. Cresça com mais controle.</p></div><div className="closing-actions"><a className="cta" href={signup} onClick={()=>tracked('start_trial',{source:'footer'})}>Criar minha conta</a><a className="ghost" href={appUrl}>Já sou cliente</a></div></section>
    </main><footer><div><ShieldCheck/> Meu Espetinho</div><div>Seu negócio no controle.</div><div>Uma solução GRIT</div><div>© 2026</div></footer>
  </div>;
}
