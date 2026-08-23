import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Boxes, Check, CircleDollarSign, ClipboardList, MessageCircle, Package, Settings, ShieldCheck, ShoppingCart, Smartphone, Store, Users, WalletCards } from 'lucide-react';
import { supabase } from './lib/supabase';
import { track } from './lib/tracking';

const modules=[
  [ShoppingCart,'PDV / Vendas','Lance vendas, feche contas, receba pagamentos e envie a conta pelo WhatsApp.'],
  [Package,'Produtos','Cadastre produtos, preços, unidades e códigos de barras.'],
  [Boxes,'Estoque','Controle entradas, saídas, estoque mínimo e alertas.'],
  [WalletCards,'Caixa','Abra, acompanhe e feche o caixa com mais segurança.'],
  [CircleDollarSign,'Despesas','Registre gastos e acompanhe os custos da operação.'],
  [Users,'Clientes / Fiado','Controle contas a receber e o histórico de cada cliente.'],
  [ClipboardList,'Compras','Organize reposições e sua lista de compras.'],
  [BarChart3,'Relatórios','Acompanhe vendas, ticket, produtos e resultado.'],
  [Settings,'Configurações','Personalize empresa, usuários, permissões e identidade.']
] as const;

function Phone({title,children}:{title:string;children:React.ReactNode}){return <div className="mock-phone"><div className="mock-notch"/><div className="mock-screen"><div className="mock-appbar"><span>9:41</span><b>{title}</b><span>•••</span></div>{children}</div></div>}

export default function Landing() {
  const [form, setForm] = useState({ name:'', business_name:'', whatsapp:'', email:'', city:'' });
  const [status, setStatus] = useState('');
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g,'');
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Quero conhecer o Sr. Padeiro e testar a gestão pelo celular.')}` : '#lead';
  const whatsappClick=()=>track('whatsapp_click',{placement:'landing',configured:Boolean(whatsappNumber)});

  async function submit(e: FormEvent) {
    e.preventDefault(); setStatus('Enviando...');
    const { error } = await supabase.from('leads').insert({...form,product:'sr-padeiro',source:params.get('utm_source')||'landing',medium:params.get('utm_medium'),campaign:params.get('utm_campaign')||'srp_landing_launch',content:params.get('utm_content'),utm_term:params.get('utm_term'),gclid:params.get('gclid'),fbclid:params.get('fbclid'),landing_page:window.location.href,consent_lgpd:true,consent_at:new Date().toISOString(),status:'new'});
    if(error)return setStatus('Não foi possível enviar agora. Tente novamente.');
    track('lead_generated',{source:params.get('utm_source')||'landing',campaign:params.get('utm_campaign')||'srp_landing_launch'});
    setStatus('Recebemos seus dados. Vamos falar com você!'); setForm({name:'',business_name:'',whatsapp:'',email:'',city:''});
  }

  return <div className="landing brand-landing">
    <header className="lp-nav"><a className="lp-logo" href="#inicio"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/></a><nav><a href="#beneficios">Benefícios</a><a href="#modulos">Módulos</a><a href="#como-funciona">Como funciona</a><a href="#lead">Teste grátis</a><a className="btn-dark" href="/login">Entrar</a></nav></header>
    <main>
      <section id="inicio" className="brand-hero">
        <div className="hero-copy"><span className="brand-kicker">FEITO PARA PADARIAS, MERCADINHOS E CONVENIÊNCIAS</span><h1>Simples para quem vende.<br/><em>Poderoso para quem administra.</em></h1><p>Venda, organize o caixa, controle estoque, despesas, clientes e resultados direto pelo celular. Sem complicar a rotina de quem precisa trabalhar rápido.</p><div className="hero-checks"><span><Check/>Simples de usar</span><span><Check/>Tudo no celular</span><span><Check/>Controle por perfil</span></div><div className="lp-actions"><a className="btn-orange" href="#lead">Teste grátis por 7 dias <ArrowRight size={18}/></a><a className="btn-outline" href={whatsappHref} onClick={whatsappClick}><MessageCircle size={18}/> Falar no WhatsApp</a></div><small>Sem cartão de crédito para iniciar o teste.</small></div>
        <div className="hero-visual"><div className="bakery-glow"/><Phone title="Sr. Padeiro"><div className="ui-greeting">Bom dia, João! 👋</div><div className="ui-sales"><span>Hoje</span><strong>R$ 2.847,50</strong><small>Vendas • exemplo de interface</small></div><div className="ui-tiles"><div><span>Caixa</span><b>R$ 642,00</b></div><div><span>Estoque</span><b className="orange-text">8 alertas</b></div></div><button className="ui-sale-btn">+ NOVA VENDA</button><div className="ui-summary"><b>Resumo do dia</b><span>Vendas <strong>R$ 2.847,50</strong></span><span>Transações <strong>126</strong></span><span>Ticket médio <strong>R$ 22,60</strong></span></div></Phone><div className="hero-benefits"><b>Benefícios que geram resultado</b><span><ShoppingCart/>PDV rápido e fácil</span><span><Boxes/>Estoque inteligente</span><span><ClipboardList/>Lista de compras</span><span><WalletCards/>Caixa simplificado</span></div></div>
      </section>

      <section className="trust-strip"><div><ShieldCheck/><b>Seguro e confiável</b><span>Dados protegidos e acesso por perfil.</span></div><div><Smartphone/><b>Feito para celular</b><span>Use no balcão, estoque ou fora da loja.</span></div><div><Store/><b>Sua marca</b><span>Logo, nome e identidade do seu negócio.</span></div><div><BarChart3/><b>Controle de verdade</b><span>Operação simples com visão gerencial.</span></div></section>

      <section id="beneficios" className="brand-section benefits-section"><div className="section-heading"><span>OBJETIVIDADE NO DIA A DIA</span><h2>Menos papel. Menos perdas. Mais controle.</h2><p>O Sr. Padeiro foi pensado para resolver a rotina sem transformar seu negócio em um ERP complicado.</p></div><div className="benefit-cards"><article><ShoppingCart/><h3>Venda em poucos toques</h3><p>Escolha os produtos, defina quantidade ou peso, receba e finalize.</p></article><article><Boxes/><h3>Saiba o que está acabando</h3><p>Estoque mínimo e alertas ajudam a evitar ruptura e compra no improviso.</p></article><article><WalletCards/><h3>Caixa sob controle</h3><p>Abertura, acompanhamento e fechamento com visão clara dos recebimentos.</p></article><article><Users/><h3>Fiado organizado</h3><p>Controle quem deve, quanto deve e facilite a cobrança pelo WhatsApp.</p></article></div></section>

      <section id="modulos" className="brand-section modules-section"><div className="section-heading"><span>MÓDULOS DO SISTEMA</span><h2>Completo para controlar. Simples para operar.</h2></div><div className="module-grid">{modules.map(([Icon,title,text])=><article key={title}><Icon/><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section id="como-funciona" className="brand-section flow-section"><div className="section-heading"><span>PDV COMPLETO E SIMPLES</span><h2>Da venda à conta em quatro passos.</h2></div><div className="phone-flow">
        <div><Phone title="Nova venda"><div className="mock-search">⌕ Buscar produto</div><div className="mock-list"><span>🥖 Pão francês <b>R$ 1,00</b></span><span>☕ Café <b>R$ 4,00</b></span><span>🥛 Leite 1L <b>R$ 4,89</b></span><span>🍰 Bolo <b>R$ 6,00</b></span></div><button className="mock-bottom">Ver carrinho (2)</button></Phone><b>1. Escolha</b><p>Busque produtos ou use o código de barras.</p></div>
        <div><Phone title="Pagamento"><div className="pay-total">Total <strong>R$ 14,00</strong></div><div className="pay-list"><span>▣ PIX</span><span>▤ Cartão</span><span>◉ Dinheiro</span><span>◎ Fiado</span></div><button className="mock-bottom">Finalizar venda</button></Phone><b>2. Pagamento</b><p>PIX, cartão, dinheiro ou fiado.</p></div>
        <div><Phone title="Conta"><div className="receipt-card"><b>PADARIA PÃO QUENTE</b><span>Pão francês (10x) R$ 10,00</span><span>Café (1x) R$ 4,00</span><strong>TOTAL R$ 14,00</strong></div><button className="whatsapp-btn">Enviar por WhatsApp</button><button className="save-btn">Salvar imagem</button></Phone><b>3. Conta</b><p>Envie pelo WhatsApp ou salve como imagem.</p></div>
        <div><Phone title="Resumo"><div className="ui-sales"><span>Hoje</span><strong>R$ 4.820,00</strong><small>Exemplo visual</small></div><div className="ui-tiles"><div><span>Vendas</span><b>126</b></div><div><span>Ticket</span><b>R$ 38,25</b></div></div><div className="mini-chart"><i/><i/><i/><i/><i/><i/><i/></div></Phone><b>4. Acompanhe</b><p>Veja o resultado sem sair do celular.</p></div>
      </div></section>

      <section className="brand-section control-section"><div className="permissions-panel"><span>PERFIS E PERMISSÕES</span><h2>Cada usuário acessa apenas o que precisa.</h2><div className="permission-list"><div><b>Super Admin GRIT</b><p>Gestão central de clientes, acessos, trial, permuta e operação.</p></div><div><b>Dono / Gestor</b><p>Visão completa, usuários, caixa, estoque, relatórios e configurações.</p></div><div><b>Caixa / Operador</b><p>Vendas e caixa, sem acesso desnecessário às áreas gerenciais.</p></div><div><b>Estoquista</b><p>Produtos, entradas, saídas e inventário.</p></div><div><b>Consulta</b><p>Somente informações e relatórios autorizados.</p></div></div></div><div className="dashboard-preview"><div className="dash-side"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/><span>Início</span><span>Vendas</span><span>Produtos</span><span>Estoque</span><span>Caixa</span><span>Clientes</span><span>Relatórios</span></div><div className="dash-main"><span className="brand-kicker">VISÃO GERENCIAL</span><h3>Seu negócio em tempo real.</h3><div className="dash-kpis"><div><span>Vendas hoje</span><b>R$ 4.820,00</b></div><div><span>Transações</span><b>126</b></div><div><span>Ticket médio</span><b>R$ 38,25</b></div><div><span>Estoque</span><b className="orange-text">8 alertas</b></div></div><div className="dash-chart"><i/><i/><i/><i/><i/><i/><i/></div><small>Valores ilustrativos para demonstrar a interface.</small></div></div></section>

      <section className="brand-section brand-custom"><div><span> SUA MARCA, SEU NEGÓCIO </span><h2>O sistema também pode ter a identidade da sua empresa.</h2><p>Personalize nome, logo e cor principal. Sua equipe opera o Sr. Padeiro com a cara do seu negócio.</p><div className="color-dots"><i/><i/><i/><i/><i/></div></div><Phone title="Padaria Pão Quente"><div className="ui-greeting">Bom dia! 👋</div><div className="ui-sales"><span>Resumo</span><strong>R$ 4.820,00</strong><small>Exemplo de personalização</small></div><div className="ui-tiles"><div><span>Caixa</span><b>R$ 642</b></div><div><span>Estoque</span><b>8 alertas</b></div></div></Phone></section>

      <section id="lead" className="lead-section premium-lead"><div><span className="brand-kicker">COMECE AGORA</span><h2>Teste o Sr. Padeiro no seu negócio.</h2><p>Conheça uma operação simples, rápida e mobile, com controle avançado para quem administra.</p><ul><li>7 dias para testar</li><li>Sem cartão de crédito para começar</li><li>Suporte de implantação</li><li>Acesso pelo celular</li></ul></div><form onSubmit={submit} className="lead-form"><input required placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="Nome do negócio" value={form.business_name} onChange={e=>setForm({...form,business_name:e.target.value})}/><input required placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/><input type="email" placeholder="E-mail" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Cidade" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><label className="consent"><input type="checkbox" required/> Autorizo contato sobre o Sr. Padeiro e li a política de privacidade.</label><button className="btn-orange">Quero testar <ArrowRight size={18}/></button>{status&&<p>{status}</p>}</form></section>
    </main>
    <a className="whatsapp-float" href={whatsappHref} onClick={whatsappClick} aria-label="Falar no WhatsApp"><MessageCircle/></a>
    <footer className="brand-footer"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/><div><b>Simples de usar</b><span>Completo para controlar</span></div><div><b>Seguro e confiável</b><span>Na palma da mão</span></div><a className="btn-orange" href="#lead">Teste grátis por 7 dias</a></footer>
  </div>
}