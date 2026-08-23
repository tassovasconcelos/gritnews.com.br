import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Boxes, Check, CircleDollarSign, ClipboardList, MessageCircle, Package, Settings, ShieldCheck, ShoppingCart, Smartphone, Store, Users, WalletCards } from 'lucide-react';
import { supabase } from './lib/supabase';
import { track } from './lib/tracking';
import './landing-brand.css';

const modules=[
  [ShoppingCart,'PDV / Vendas','Venda rápido, receba e envie a conta pelo WhatsApp.'],
  [Package,'Produtos','Cadastre produtos, preços, unidades e códigos de barras.'],
  [Boxes,'Estoque','Acompanhe entradas, saídas, mínimo e alertas.'],
  [WalletCards,'Caixa','Abra, acompanhe e feche o caixa com clareza.'],
  [CircleDollarSign,'Despesas','Registre gastos e enxergue melhor seus custos.'],
  [Users,'Clientes / Fiado','Organize contas a receber e facilite a cobrança.'],
  [BarChart3,'Relatórios','Veja vendas, ticket, produtos e indicadores simples.'],
  [Settings,'Configurações','Personalize empresa, usuários e permissões.']
] as const;

function Phone({title,children}:{title:string;children:React.ReactNode}){
  return <div className="sp-phone"><div className="sp-notch"/><div className="sp-screen"><div className="sp-appbar"><span>9:41</span><b>{title}</b><span>•••</span></div>{children}</div></div>
}

export default function Landing(){
  const [form,setForm]=useState({name:'',business_name:'',whatsapp:'',email:'',city:''});
  const [status,setStatus]=useState('');
  const params=useMemo(()=>new URLSearchParams(window.location.search),[]);
  const whatsappNumber=(import.meta.env.VITE_WHATSAPP_NUMBER||'').replace(/\D/g,'');
  const whatsappHref=whatsappNumber?`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Quero conhecer o Sr. Padeiro e testar por 7 dias.')}`:'#lead';
  const whatsappClick=()=>track('whatsapp_click',{placement:'landing',configured:Boolean(whatsappNumber)});

  async function submit(e:FormEvent){
    e.preventDefault(); setStatus('Enviando...');
    const {error}=await supabase.from('leads').insert({...form,product:'sr-padeiro',source:params.get('utm_source')||'landing',medium:params.get('utm_medium'),campaign:params.get('utm_campaign')||'srp_landing_v2',content:params.get('utm_content'),utm_term:params.get('utm_term'),gclid:params.get('gclid'),fbclid:params.get('fbclid'),landing_page:window.location.href,consent_lgpd:true,consent_at:new Date().toISOString(),status:'new'});
    if(error)return setStatus('Não foi possível enviar agora. Tente novamente.');
    track('lead_generated',{source:params.get('utm_source')||'landing',campaign:params.get('utm_campaign')||'srp_landing_v2'});
    setStatus('Recebemos seus dados. Vamos falar com você!');
    setForm({name:'',business_name:'',whatsapp:'',email:'',city:''});
  }

  return <div className="sp-landing">
    <header className="sp-header"><div className="sp-header-inner"><a className="sp-logo" href="#inicio"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/></a><nav><a href="#beneficios">Benefícios</a><a href="#modulos">Módulos</a><a href="#como-funciona">Como funciona</a><a href="#lead">Teste grátis</a></nav><div className="sp-header-actions"><a className="sp-whatsapp-link" href={whatsappHref} onClick={whatsappClick}><MessageCircle size={17}/> WhatsApp</a><a className="sp-primary small" href="#lead">Teste grátis 7 dias</a></div></div></header>

    <main>
      <section id="inicio" className="sp-hero"><div className="sp-container sp-hero-grid"><div className="sp-hero-copy"><span className="sp-eyebrow">GESTÃO SIMPLES PARA O PEQUENO NEGÓCIO</span><h1>Simples para quem vende.<br/><em>Poderoso para quem administra.</em></h1><p>Venda, controle estoque, caixa, despesas e fiado direto pelo celular. Rápido para a equipe. Claro para quem precisa tomar decisão.</p><div className="sp-checks"><span><Check/>Rápido e fácil de usar</span><span><Check/>Funciona no celular</span><span><Check/>Perfis e permissões</span><span><Check/>Relatórios objetivos</span></div><div className="sp-hero-actions"><a className="sp-primary" href="#lead">Teste grátis por 7 dias <ArrowRight size={18}/></a><a className="sp-secondary" href={whatsappHref} onClick={whatsappClick}><MessageCircle size={18}/> Falar no WhatsApp</a></div><small>Sem cartão de crédito para começar.</small></div>
        <div className="sp-hero-visual"><div className="sp-bakery-bg"/><Phone title="Sr. Padeiro"><div className="sp-greeting">Bom dia, João! 👋</div><div className="sp-kpi-main"><span>Vendas de hoje</span><strong>R$ 2.847,50</strong><small>Exemplo de interface</small></div><div className="sp-kpi-row"><div><span>Caixa</span><b>R$ 642,00</b></div><div><span>Estoque</span><b className="sp-orange">8 alertas</b></div></div><button className="sp-sale-button">+ NOVA VENDA</button><div className="sp-summary"><b>Resumo do dia</b><span>Vendas <strong>R$ 2.847,50</strong></span><span>Transações <strong>126</strong></span><span>Ticket médio <strong>R$ 22,60</strong></span></div></Phone><div className="sp-benefit-card"><b>O que você ganha</b><span><ShoppingCart/>PDV rápido</span><span><Boxes/>Estoque sob controle</span><span><ClipboardList/>Compras organizadas</span><span><WalletCards/>Caixa simples</span></div></div></div></section>

      <section className="sp-dark-strip"><div className="sp-container sp-dark-grid"><div><ShoppingCart/><b>PDV rápido e fácil</b><span>Venda em poucos toques.</span></div><div><Boxes/><b>Estoque inteligente</b><span>Saiba o que está acabando.</span></div><div><ClipboardList/><b>Compras organizadas</b><span>Reponha com mais segurança.</span></div><div><WalletCards/><b>Controle completo</b><span>Caixa, despesas e clientes.</span></div><div><BarChart3/><b>Visão gerencial</b><span>Indicadores simples e úteis.</span></div></div></section>

      <section id="beneficios" className="sp-section"><div className="sp-container"><div className="sp-section-head"><span>BENEFÍCIOS</span><h2>Mais controle sem complicar a rotina.</h2><p>O Sr. Padeiro foi pensado para padarias, mercadinhos, mercearias e conveniências que precisam trabalhar rápido e enxergar melhor o negócio.</p></div><div className="sp-benefits-grid"><article><Smartphone/><h3>Tudo no celular</h3><p>Venda no balcão e acompanhe o negócio de onde estiver.</p></article><article><Boxes/><h3>Menos ruptura</h3><p>Alertas de estoque ajudam a evitar produto faltando.</p></article><article><CircleDollarSign/><h3>Custos visíveis</h3><p>Registre despesas e tenha mais clareza sobre a operação.</p></article><article><Users/><h3>Fiado organizado</h3><p>Controle quem deve e facilite o contato pelo WhatsApp.</p></article></div></div></section>

      <section id="modulos" className="sp-section sp-soft"><div className="sp-container"><div className="sp-section-head"><span>MÓDULOS</span><h2>Completo para controlar. Simples para operar.</h2></div><div className="sp-modules-grid">{modules.map(([Icon,title,text])=><article key={title}><Icon/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section id="como-funciona" className="sp-section"><div className="sp-container"><div className="sp-section-head"><span>COMO FUNCIONA</span><h2>Da venda ao acompanhamento em poucos passos.</h2></div><div className="sp-flow-grid"><div><span className="sp-step">1</span><Phone title="Nova venda"><div className="sp-search">Buscar produto</div><div className="sp-products"><span>🥖 Pão francês <b>R$ 1,00</b></span><span>☕ Café <b>R$ 4,00</b></span><span>🥛 Leite 1L <b>R$ 4,89</b></span><span>🍰 Bolo <b>R$ 6,00</b></span></div><button className="sp-phone-action">Ver carrinho</button></Phone><h3>Venda</h3><p>Escolha produtos e quantidades.</p></div><div><span className="sp-step">2</span><Phone title="Pagamento"><div className="sp-payment-total"><span>Total</span><strong>R$ 14,00</strong></div><div className="sp-payment-list"><span>PIX</span><span>Cartão</span><span>Dinheiro</span><span>Fiado</span></div><button className="sp-phone-action">Finalizar venda</button></Phone><h3>Pagamento</h3><p>Receba da forma que o cliente preferir.</p></div><div><span className="sp-step">3</span><Phone title="Conta"><div className="sp-receipt"><b>PADARIA PÃO QUENTE</b><span>Pão francês — R$ 10,00</span><span>Café — R$ 4,00</span><strong>TOTAL R$ 14,00</strong></div><button className="sp-wa-button">Enviar por WhatsApp</button><button className="sp-save-button">Salvar imagem</button></Phone><h3>Conta</h3><p>Envie por WhatsApp ou salve como imagem.</p></div><div><span className="sp-step">4</span><Phone title="Gestão"><div className="sp-kpi-main"><span>Hoje</span><strong>R$ 4.820,00</strong><small>Exemplo de interface</small></div><div className="sp-mini-chart"><i/><i/><i/><i/><i/><i/><i/></div></Phone><h3>Gestão</h3><p>Acompanhe o resultado sem sair do celular.</p></div></div></div></section>

      <section className="sp-section sp-control"><div className="sp-container sp-control-grid"><div className="sp-control-copy"><span>CONTROLE AVANÇADO</span><h2>O sistema cresce com o seu negócio.</h2><ul><li><Check/>Perfis e permissões por usuário</li><li><Check/>Dono, gestor, caixa, estoque e consulta</li><li><Check/>Logo e cor do estabelecimento</li><li><Check/>Multi-loja preparado na arquitetura</li><li><Check/>Super Admin para liberar trial, permuta e acessos</li></ul></div><div className="sp-dashboard"><div className="sp-dashboard-side"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/><span>Início</span><span>Vendas</span><span>Produtos</span><span>Estoque</span><span>Caixa</span><span>Clientes</span></div><div className="sp-dashboard-main"><span>VISÃO DO NEGÓCIO</span><h3>Informação clara para decidir melhor.</h3><div className="sp-dashboard-kpis"><div><span>Vendas hoje</span><b>R$ 4.820,00</b></div><div><span>Transações</span><b>126</b></div><div><span>Ticket médio</span><b>R$ 38,25</b></div><div><span>Estoque</span><b className="sp-orange">8 alertas</b></div></div><small>Valores ilustrativos para demonstrar a interface.</small></div></div></div></section>

      <section className="sp-section sp-brand-section"><div className="sp-container sp-brand-grid"><div><span>SUA MARCA, SEU NEGÓCIO</span><h2>Personalize o Sr. Padeiro com a identidade da sua empresa.</h2><p>Nome, logo e cor principal aparecem para a equipe, deixando a operação mais profissional e familiar.</p><div className="sp-brand-bullets"><span><Store/>Logo da empresa</span><span><Settings/>Cor principal</span><span><ShieldCheck/>Perfis e segurança</span></div></div><Phone title="Padaria Pão Quente"><div className="sp-greeting">Bom dia! 👋</div><div className="sp-kpi-main"><span>Resumo de hoje</span><strong>R$ 4.820,00</strong><small>Exemplo de personalização</small></div><div className="sp-kpi-row"><div><span>Caixa</span><b>R$ 642</b></div><div><span>Estoque</span><b>8 alertas</b></div></div></Phone></div></section>

      <section id="lead" className="sp-lead"><div className="sp-container sp-lead-grid"><div><span>COMECE AGORA</span><h2>Teste o Sr. Padeiro no seu negócio.</h2><p>Conheça uma gestão simples, rápida e mobile, com controle avançado para quem administra.</p><ul><li><Check/>7 dias para testar</li><li><Check/>Sem cartão de crédito para começar</li><li><Check/>Acesso pelo celular</li><li><Check/>Acompanhamento de implantação</li></ul></div><form onSubmit={submit} className="sp-lead-form"><input required placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="Nome do negócio" value={form.business_name} onChange={e=>setForm({...form,business_name:e.target.value})}/><input required placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/><input type="email" placeholder="E-mail" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Cidade" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><label><input type="checkbox" required/> Autorizo contato sobre o Sr. Padeiro.</label><button className="sp-primary">Quero testar <ArrowRight size={18}/></button>{status&&<p>{status}</p>}</form></div></section>
    </main>

    <a className="sp-float" href={whatsappHref} onClick={whatsappClick} aria-label="Falar no WhatsApp"><MessageCircle/></a>
    <footer className="sp-footer"><div className="sp-container sp-footer-grid"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/><div><b>Simples de usar</b><span>Completo para controlar</span></div><div><b>Seguro e confiável</b><span>Na palma da mão</span></div><a className="sp-primary small" href="#lead">Teste grátis por 7 dias</a></div></footer>
  </div>
}
