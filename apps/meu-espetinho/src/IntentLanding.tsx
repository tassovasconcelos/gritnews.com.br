import { CheckCircle2, ClipboardList, CreditCard, Headphones, Receipt, ShieldCheck, ShoppingCart, Store, WalletCards } from 'lucide-react';
import { trackMarketing } from './lib/analytics';
import './marketing.css';

type IntentKey='espetinho'|'churrasquinho'|'comanda'|'fiado'|'bar';

type IntentConfig={
  kicker:string;
  title:string;
  lead:string;
  pain:string;
  benefits:string[];
  searchTerms:string[];
  faq:[string,string][];
};

const configs:Record<IntentKey,IntentConfig>={
  espetinho:{
    kicker:'SISTEMA PARA ESPETINHO',
    title:'O sistema simples para quem vende espetinho.',
    lead:'Registre pedidos, controle comandas, clientes, fiado e caixa e feche a conta sem depender de papel, calculadora ou planilha.',
    pain:'Feito para a rotina real do espetinho: atendimento rápido, mesa ou balcão, PIX, cartão, dinheiro, fiado e conta pronta para imprimir ou enviar.',
    benefits:['Venda rápida pelo celular','Comanda por mesa, cliente ou número','Controle de fiado e recebimentos','Comprovante térmico ou em imagem','Lista de compras baseada nas vendas','Estoque opcional — só usa quem quiser'],
    searchTerms:['sistema para espetinho','PDV para espetinho','aplicativo para espetinho','controle de vendas de espetinho','gestão para espetinho'],
    faq:[['Preciso saber informática para usar?','Não. O Meu Espetinho foi desenhado para pequenos negócios e equipes que precisam aprender rápido.'],['Funciona no celular?','Sim. Pode ser usado no celular, tablet ou computador com internet.'],['Consigo imprimir a conta?','Sim. A conta fechada pode ser impressa em térmica ou compartilhada como imagem.']],
  },
  churrasquinho:{
    kicker:'SISTEMA PARA CHURRASQUINHO',
    title:'Mais controle no churrasquinho, sem complicar o atendimento.',
    lead:'Organize pedidos, mesas, recebimentos e clientes em uma operação leve para quem vende churrasco, espetos e bebidas.',
    pain:'Troque papel solto e contas de cabeça por uma comanda simples, histórico de venda e fechamento claro no fim do atendimento.',
    benefits:['Pedidos em poucos toques','Mesas e comandas organizadas','Caixa com dinheiro, PIX e cartão','Fiado com histórico por cliente','Lista semanal de reposição','Relatórios fáceis para o dono'],
    searchTerms:['sistema para churrasquinho','comanda para churrasquinho','PDV churrasquinho','controle de vendas churrasquinho','sistema simples para churrasco'],
    faq:[['Serve para bebidas também?','Sim. Cadastre espetos, porções, bebidas e qualquer item vendido no negócio.'],['Dá para usar em evento?','Sim. O sistema funciona em operações de balcão, mesa e eventos, desde que haja acesso à internet.'],['Preciso controlar estoque?','Não. O estoque é opcional e pode ser ativado quando fizer sentido.']],
  },
  comanda:{
    kicker:'COMANDA DIGITAL PARA ESPETINHO E BAR',
    title:'A comanda não some. A conta fecha certo.',
    lead:'Abra a mesa ou cliente, registre itens e acompanhe tudo até o pagamento. Menos papel perdido, menos conta refeita e mais agilidade.',
    pain:'A equipe vê a mesma operação e o dono acompanha quem abriu, atendeu e fechou cada conta.',
    benefits:['Comanda por mesa ou cliente','Inclusão rápida de itens','Histórico completo da conta','Fechamento em dinheiro, PIX, cartão ou fiado','Comprovante pronto para o cliente','Acesso individual da equipe'],
    searchTerms:['comanda digital','comanda eletrônica para bar','comanda para espetinho','sistema de comandas','comanda pelo celular'],
    faq:[['Preciso de equipamento especial?','Não. Você pode começar usando celulares, tablet ou computador que já possui.'],['A conta pode ser enviada por WhatsApp?','O sistema gera uma imagem da conta para compartilhar pelo celular.'],['Cada funcionário pode ter acesso?','Sim. O plano inclui usuários e permite rastrear a operação por acesso.']],
  },
  fiado:{
    kicker:'CONTROLE DE FIADO E CAIXA',
    title:'Saiba quem ficou devendo — e quanto ainda falta receber.',
    lead:'Cadastre o cliente, registre o valor fiado e acompanhe pagamentos e saldo sem depender de caderno ou memória.',
    pain:'O fiado continua simples para o cliente, mas passa a ser organizado para o dono.',
    benefits:['Saldo por cliente','Histórico de compras e pagamentos','Registro de recebimentos','Caixa separado por forma de pagamento','Consulta rápida pelo celular','Mais clareza no fechamento'],
    searchTerms:['controle de fiado','aplicativo para controlar fiado','caderneta de fiado digital','controle de caixa pequeno negócio','fiado para bar'],
    faq:[['Posso registrar pagamento parcial?','Sim. O histórico permite acompanhar recebimentos e saldo remanescente.'],['Serve só para espetinho?','Não. Também atende bares, botecos, trailers e pequenos negócios de alimentação.'],['Consigo consultar o saldo do cliente rápido?','Sim. A ficha do cliente mantém o histórico e o saldo em um único lugar.']],
  },
  bar:{
    kicker:'SISTEMA SIMPLES PARA BAR PEQUENO',
    title:'Comanda, caixa e fiado para o bar pequeno funcionar melhor.',
    lead:'Um sistema leve para bares, botecos, trailers e operações enxutas que querem organização sem implantar um ERP complicado.',
    pain:'Comece por vendas e comandas. Use clientes, fiado, lista de compras e estoque somente quando precisar.',
    benefits:['PDV simples para balcão e mesas','Comanda eletrônica','Controle de caixa','Clientes e fiado','Lista de compras da semana','Recursos opcionais conforme o negócio cresce'],
    searchTerms:['sistema para bar pequeno','PDV para bar','sistema simples para boteco','comanda digital para bar','sistema para trailer'],
    faq:[['É indicado para MEI?','Sim. A proposta é justamente oferecer uma operação simples e acessível para pequenos empreendedores.'],['Preciso implantar tudo de uma vez?','Não. Comece com o essencial e adote outros controles aos poucos.'],['Funciona para trailer e food truck?','Sim. A operação web pode ser usada em celular, tablet ou computador.']],
  },
};

export function getIntentFromPath(path:string):IntentKey|null{
  if(path.startsWith('/sistema-para-espetinho')) return 'espetinho';
  if(path.startsWith('/sistema-para-churrasquinho')) return 'churrasquinho';
  if(path.startsWith('/comanda-digital-para-espetinho')) return 'comanda';
  if(path.startsWith('/controle-de-fiado')) return 'fiado';
  if(path.startsWith('/sistema-para-bar-pequeno')) return 'bar';
  return null;
}

export default function IntentLanding({intent}:{intent:IntentKey}){
  const c=configs[intent];
  const signup='/cadastro';
  const track=(source:string)=>trackMarketing({name:'start_trial',params:{source,intent}});
  return <div className="marketing-page">
    <header className="marketing-nav"><a className="marketing-brand" href="/"><img src="/logo-meu-espetinho-v3.svg" alt="Meu Espetinho — Seu negócio no controle"/></a><nav><a href="#beneficios">Benefícios</a><a href="#duvidas">Dúvidas</a><a href="/">Conhecer a plataforma</a></nav><a className="nav-login" href="/app">Entrar</a><a className="cta small" href={signup} onClick={()=>track('intent_header')}>Começar agora</a></header>
    <main>
      <section className="hero"><div className="hero-copy"><span className="hero-kicker">{c.kicker}</span><h1>{c.title}</h1><p className="hero-main">{c.lead}</p><p className="hero-sub">{c.pain}</p><div className="hero-actions"><a className="cta" href={signup} onClick={()=>track('intent_hero')}><ShoppingCart size={20}/> Quero organizar meu negócio</a><a className="ghost" href="#beneficios">Ver como ajuda</a></div><div className="trust-row"><span><CheckCircle2/> Fácil de usar</span><span><ShieldCheck/> Dados em nuvem</span><span><Headphones/> Implantação assistida</span></div></div><div className="hero-visual"><div className="mock-window"><div className="mock-head"><img src="/favicon-v3.svg" alt=""/><b>Meu Espetinho</b><small>OPERAÇÃO SIMPLES</small></div><div className="mock-layout"><aside><span className="active">Nova venda</span><span>Comandas</span><span>Clientes</span><span>Caixa</span><span>Compras</span></aside><div><div className="mock-metrics"><article><Receipt/><small>Conta</small><strong>Organizada</strong></article><article><WalletCards/><small>Recebimento</small><strong>Registrado</strong></article><article><ClipboardList/><small>Compras</small><strong>Planejadas</strong></article><article><Store/><small>Negócio</small><strong>No controle</strong></article></div></div></div></div></div></section>
      <section className="credibility"><div><strong>Feito para PME</strong><span>Sem linguagem de ERP.</span></div><div><strong>Comece pelo básico</strong><span>Recursos extras são opcionais.</span></div><div><strong>Use no que já tem</strong><span>Celular, tablet ou computador.</span></div><div><strong>Ajuda para começar</strong><span>Implantação assistida.</span></div></section>
      <section className="feature-section" id="beneficios"><div className="section-heading"><span className="section-kicker">MENOS COMPLICAÇÃO, MAIS CONTROLE</span><h2>O essencial para atender, receber e acompanhar.</h2><p>Sem exigir que o pequeno empresário vire especialista em sistema.</p></div><div className="feature-strip">{c.benefits.map((b,i)=>{const icons=[Receipt,CreditCard,WalletCards,ClipboardList,Store,ShieldCheck];const Icon=icons[i%icons.length];return <article key={b}><span className="feature-icon"><Icon/></span><h3>{b}</h3><p>Um recurso direto para resolver uma tarefa do dia a dia.</p></article>})}</div></section>
      <section className="positioning"><div className="section-heading"><span className="section-kicker">O QUE QUEM EMPREENDE PROCURA</span><h2>Uma solução específica para a rotina do pequeno negócio.</h2><p>O Meu Espetinho reúne em uma única plataforma o que normalmente fica espalhado entre papel, calculadora, planilha e aplicativos separados.</p></div><div className="search-intent-copy"><h3>Buscas relacionadas</h3><p>{c.searchTerms.map((t,i)=><span key={t}>{i?', ':''}<strong>{t}</strong></span>)}</p></div></section>
      <section className="pricing"><div className="pricing-intro"><span className="section-kicker">PLANO SIMPLES</span><h2>Comece sem montar uma operação de TI.</h2><p>Até 3 usuários, implantação acompanhada e acesso pela web.</p></div><article className="price-card setup"><span>Implantação</span><strong><small>R$</small>199,00</strong><p>Pagamento único.</p><ul><li>Configuração inicial</li><li>Orientação de uso</li><li>Personalização da operação</li></ul></article><article className="price-card featured"><span>Meu Espetinho</span><strong><small>R$</small>89,00<small>/mês</small></strong><ul><li>Até 3 usuários</li><li>Vendas e comandas</li><li>Clientes e fiado</li><li>Caixa e indicadores</li><li>Comprovante térmico/imagem</li><li>Lista de compras</li></ul><a className="cta full" href={signup} onClick={()=>track('intent_pricing')}>Criar minha conta</a></article></section>
      <section className="faq" id="duvidas"><div className="section-heading"><span className="section-kicker">DÚVIDAS RÁPIDAS</span><h2>Antes de começar.</h2></div><div className="faq-grid">{c.faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
      <section className="closing-cta"><div><img src="/logo-meu-espetinho-v3.svg" alt="Meu Espetinho"/><h2>Seu negócio no controle.</h2><p>Comece simples. Evolua no seu ritmo.</p></div><div className="closing-actions"><a className="cta" href={signup} onClick={()=>track('intent_footer')}>Começar agora</a><a className="ghost" href="/">Ver a página principal</a></div></section>
    </main><footer><div><ShieldCheck/> Meu Espetinho</div><div>Seu negócio no controle.</div><div>Uma solução GRIT</div><div>© 2026</div></footer>
  </div>;
}
