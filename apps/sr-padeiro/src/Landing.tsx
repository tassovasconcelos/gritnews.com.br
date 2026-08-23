import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Boxes, MessageCircle, ShieldCheck, Smartphone, Store, WalletCards } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function Landing() {
  const [form, setForm] = useState({ name:'', business_name:'', whatsapp:'', email:'', city:'' });
  const [status, setStatus] = useState('');
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g,'');
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Quero conhecer o Sr. Padeiro e testar a gestão pelo celular.')}` : '#lead';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('Enviando...');
    const { error } = await supabase.from('leads').insert({
      ...form,
      product:'sr-padeiro',
      source: params.get('utm_source') || 'landing',
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign') || 'srp_landing_launch',
      content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      gclid: params.get('gclid'),
      fbclid: params.get('fbclid'),
      landing_page: window.location.href,
      consent_lgpd: true,
      consent_at: new Date().toISOString(),
      status:'new'
    });
    if (error) return setStatus('Não foi possível enviar agora. Tente novamente.');
    setStatus('Recebemos seus dados. Vamos falar com você!');
    setForm({ name:'', business_name:'', whatsapp:'', email:'', city:'' });
  }

  return <div className="landing">
    <header className="lp-nav"><div className="lp-brand"><div className="brand-mark">SP</div><strong>Sr. Padeiro</strong></div><nav><a href="#beneficios">Benefícios</a><a href="#lead">Teste</a><a className="btn-dark" href="/login">Entrar</a></nav></header>
    <main>
      <section className="lp-hero">
        <div><span className="pill">Gestão simples para pequenos negócios</span><h1>Seu negócio na palma da mão.</h1><p>Venda, controle caixa, estoque, despesas, clientes e resultados direto pelo celular — simples para operar e completo para administrar.</p><div className="lp-actions"><a className="btn-orange" href="#lead">Começar teste grátis <ArrowRight size={18}/></a><a className="btn-outline" href={whatsappHref}><MessageCircle size={18}/> Falar no WhatsApp</a></div><small>Teste inicial de 7 dias. Sem cartão de crédito.</small></div>
        <div className="phone-demo"><div className="phone-top">Sr. Padeiro</div><div className="phone-card"><span>Vendas de hoje</span><strong>R$ 2.847,50</strong></div><div className="phone-grid"><div><WalletCards/><span>Caixa</span><b>R$ 642</b></div><div><Boxes/><span>Estoque</span><b>8 alertas</b></div></div><button>+ NOVA VENDA</button></div>
      </section>

      <section id="beneficios" className="lp-section"><div className="section-heading"><span>Objetivo no dia a dia</span><h2>Menos complicação. Mais controle.</h2></div><div className="feature-grid">
        <article><Smartphone/><h3>Feito para celular</h3><p>Operação rápida para quem está no balcão, no caixa ou fora da loja.</p></article>
        <article><Store/><h3>PDV simples</h3><p>Lance a venda, feche a conta e compartilhe por WhatsApp ou salve como imagem.</p></article>
        <article><Boxes/><h3>Estoque inteligente</h3><p>Entradas, saídas, mínimo e alertas sem transformar sua rotina em um ERP complicado.</p></article>
        <article><BarChart3/><h3>Controle avançado</h3><p>Vendas, ticket, caixa, produtos, fiado e indicadores claros para quem administra.</p></article>
        <article><ShieldCheck/><h3>Perfis e permissões</h3><p>Operador, caixa, estoque, gestor e consulta: cada pessoa vê apenas o que precisa.</p></article>
        <article><Store/><h3>Sua marca</h3><p>Personalize logo, cores e nome do estabelecimento para uma experiência própria.</p></article>
      </div></section>

      <section className="lp-split"><div><span className="pill">Simples para vender</span><h2>Do pedido à conta em poucos toques.</h2><ol><li>Escolha os produtos.</li><li>Defina quantidade ou peso.</li><li>Receba em PIX, dinheiro, cartão ou fiado.</li><li>Envie a conta pelo WhatsApp ou salve como imagem.</li></ol></div><div className="admin-highlight"><strong>Poderoso para administrar</strong><p>Controle de usuários, permissões, estoque, caixa, clientes, compras, despesas e relatórios.</p><div className="mini-kpis"><div><b>126</b><span>vendas</span></div><div><b>R$ 38,25</b><span>ticket</span></div><div><b>8</b><span>alertas</span></div></div></div></section>

      <section id="lead" className="lead-section"><div><span className="pill">Primeiros clientes</span><h2>Conheça o Sr. Padeiro</h2><p>Preencha seus dados e receba acesso para testar a operação no seu negócio.</p></div><form onSubmit={submit} className="lead-form"><input required placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="Nome do negócio" value={form.business_name} onChange={e=>setForm({...form,business_name:e.target.value})}/><input required placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/><input type="email" placeholder="E-mail" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Cidade" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><label className="consent"><input type="checkbox" required/> Autorizo contato sobre o Sr. Padeiro e li a política de privacidade.</label><button className="btn-orange">Quero testar <ArrowRight size={18}/></button>{status && <p>{status}</p>}</form></section>
    </main>
    <a className="whatsapp-float" href={whatsappHref} aria-label="Falar no WhatsApp"><MessageCircle/></a>
    <footer><strong>Sr. Padeiro</strong><span>Seu negócio na palma da mão.</span><a href="/login">Acessar app</a></footer>
  </div>
}