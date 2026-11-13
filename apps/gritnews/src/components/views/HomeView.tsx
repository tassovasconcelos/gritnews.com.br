import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Database,
  LineChart,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow
} from 'lucide-react';
import { Article, Category, Partner, Offer, AuthorProfile } from '../../types';

interface HomeViewProps {
  articles: Article[];
  categories: Category[];
  partners: Partner[];
  offers: Offer[];
  authors?: AuthorProfile[];
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (slug: string) => void;
  onSelectPartner: (partner: Partner) => void;
  onSelectAuthor?: (author: AuthorProfile) => void;
  onNavigateOffers?: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

const solutions = [
  {
    icon: Target,
    kicker: 'GROWTH',
    title: 'Inteligência Comercial',
    text: 'Prospecção, qualificação, CRM, cadências, WhatsApp, indicadores e organização do funil comercial.'
  },
  {
    icon: LineChart,
    kicker: 'REVENUE OPS',
    title: 'Vendas & Oportunidades',
    text: 'Pipeline, próxima ação, produtividade, territórios, forecast e gestão de oportunidades com mais visibilidade.'
  },
  {
    icon: Users,
    kicker: 'CUSTOMER',
    title: 'Atendimento & Pós-venda',
    text: 'SLA, protocolos, SAC, assistência técnica, qualidade, satisfação, retenção e inteligência sobre a experiência do cliente.'
  },
  {
    icon: Bot,
    kicker: 'AUTOMAÇÃO',
    title: 'Automação & IA',
    text: 'Automatizamos o repetitivo, organizamos informação e usamos IA para apoiar decisões sem retirar a responsabilidade humana.'
  },
  {
    icon: Database,
    kicker: 'DATA',
    title: 'Dados, BI & Performance',
    text: 'Dashboards, integrações, análise de dados e indicadores que conectam atividade operacional a decisão gerencial.'
  },
  {
    icon: Rocket,
    kicker: 'SAAS',
    title: 'Produtos GRIT',
    text: 'Soluções recorrentes nascidas de dores reais e preparadas para evoluir por segmento, maturidade e uso.'
  }
];

const products = [
  {
    name: 'OportunidadesPro',
    category: 'Revenue Operations',
    description: 'Gestão de oportunidades, performance de marketing e acompanhamento comercial em uma operação orientada por dados.',
    href: 'https://oportunidadespro.gritnews.com.br',
    cta: 'Conhecer OportunidadesPro'
  },
  {
    name: 'GRIT SAC 4.0',
    category: 'Atendimento & Pós-venda',
    description: 'SAC, qualidade, assistência técnica, protocolos, acompanhamento e visão gerencial em um fluxo rastreável.',
    href: 'https://apps.sacproh.gritnews.com.br',
    cta: 'Conhecer SAC 4.0'
  },
  {
    name: 'Meu Espetinho',
    category: 'SaaS para pequenos negócios',
    description: 'Gestão simples para pedidos, mesas, caixa, clientes e resultados, criada para a realidade de pequenos negócios de alimentação.',
    href: 'https://meuespetinho.gritnews.com.br',
    cta: 'Conhecer Meu Espetinho'
  }
];

const method = [
  ['01', 'Diagnóstico', 'Entendemos processo, gargalos, maturidade, objetivo e indicadores antes de indicar tecnologia.'],
  ['02', 'Desenho', 'Estruturamos fluxo futuro, prioridades, papéis, dados e ferramentas necessárias.'],
  ['03', 'Implantação', 'Configuramos integrações, regras, automações e o ambiente necessário para a operação.'],
  ['04', 'Ativação', 'Treinamos o time, acompanhamos adoção e transformamos a solução em rotina real.'],
  ['05', 'Evolução', 'Medimos, aprendemos e priorizamos novos ganhos de produtividade, inteligência e receita.']
];

export const HomeView: React.FC<HomeViewProps> = ({
  articles,
  categories,
  onSelectArticle,
  onSelectCategory,
  onShowToast
}) => {
  const featuredArticles = articles.slice(0, 3);

  const goToDiagnostic = () => {
    document.getElementById('captar')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white text-[#071A2A]">
      <section id="inicio" className="relative overflow-hidden bg-[#081A30] text-white">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_73%_10%,rgba(251,122,24,.14),transparent_43%),linear-gradient(125deg,#081A30,#14334D)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 lg:py-20 grid lg:grid-cols-[1fr_.96fr] gap-9 lg:gap-12 items-start">
          <div className="lg:pt-8">
            <p className="text-[#FF9B4B] text-xs md:text-sm font-black uppercase tracking-[0.12em] mb-5">GRIT Soluções e Negócios • Impulsionando o crescimento</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[66px] font-black tracking-[-.055em] leading-[1.04] max-w-2xl">
              Empresário, sua empresa merece <span className="text-[#FB7A18]">crescer sem depender de você para tudo.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-200 leading-relaxed mt-6 max-w-xl">
              Clientes perdidos no WhatsApp? Estoque sem controle? Vendas sem acompanhamento?
              Transformamos esses desafios em gestão, tecnologia, automação e inteligência artificial útil para sua empresa.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href="#captar" className="bg-[#FB7A18] hover:bg-[#ff9a49] text-[#10243A] font-extrabold px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                Quero melhorar meu negócio <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/solucoes/" className="border border-white/40 hover:bg-white/10 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                Conhecer as soluções <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="flex flex-wrap gap-2 mt-7">
              {['Padarias e conveniências', 'Bares e restaurantes', 'Lojas e e-commerce', 'Escritórios e serviços'].map((label) => (
                <a key={label} href="#captar" className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-slate-200 hover:border-[#FB7A18]">{label}</a>
              ))}
            </div>
            <p className="mt-7 text-xs text-slate-300">✓ Conversa inicial sem compromisso &nbsp; ✓ Soluções prontas e personalizadas &nbsp; ✓ Atendimento humano</p>
          </div>
          <form id="captar" method="POST" action="https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/commercial-lead"
            className="bg-white text-[#142B42] rounded-[26px] shadow-2xl overflow-hidden border border-white/20" aria-label="Solicitar atendimento GRIT">
            <div className="bg-[#FFF5E9] px-6 py-6">
              <span className="inline-block bg-[#FFE6CA] text-[#A34C0C] rounded-full px-3 py-1 text-xs font-extrabold">Diagnóstico inicial para o seu negócio</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-[-.035em] leading-tight mt-3">Diga o que sua empresa precisa. <span className="text-[#DA6817]">A GRIT ajuda a encontrar o caminho.</span></h2>
              <p className="text-sm text-[#596C7E] mt-2">Leva cerca de um minuto. O contato será feito sobre a solução escolhida.</p>
            </div>
            <div className="px-6 py-6 space-y-3">
              <input type="hidden" name="source" value="grit-home" />
              <input type="hidden" name="medium" value="site" />
              <input type="hidden" name="campaign" value="grit-home-conversao-pme" />
              <input type="hidden" name="source_type" value="grit_landing_segment" />
              <input type="hidden" name="source_form_id" value="grit-solucoes-360" />
              <input type="hidden" name="privacy_notice_url" value="https://gritnews.com.br/solucoes/privacidade.html" />
              <input type="hidden" name="consent_version" value="grit-home-2026-11" />
              <input type="hidden" name="landing_page" value="https://gritnews.com.br/" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-extrabold">Seu nome *
                  <input name="name" required maxLength={120} autoComplete="name" placeholder="Como podemos chamar você?"
                    className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]" />
                </label>
                <label className="block text-xs font-extrabold">WhatsApp com DDD *
                  <input name="whatsapp" required type="tel" inputMode="tel" maxLength={22} autoComplete="tel" placeholder="(85) 99999-9999"
                    className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]" />
                </label>
              </div>
              <label className="block text-xs font-extrabold">Qual é o seu negócio? *
                <select name="segment" required defaultValue="" className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]">
                  <option value="" disabled>Selecione seu segmento</option>
                  <option value="padaria">Padaria e confeitaria</option>
                  <option value="mercadinho">Mercadinho e conveniência</option>
                  <option value="alimentacao">Espetinho, hamburgueria, bar ou restaurante</option>
                  <option value="varejo">Lojas e varejo</option>
                  <option value="ecommerce">E-commerce e loja virtual</option>
                  <option value="juridico">Escritório de advocacia</option>
                  <option value="saude">Saúde e equipamentos</option>
                  <option value="servicos">Prestação de serviços</option>
                  <option value="outro">Outro segmento</option>
                </select>
              </label>
              <label className="block text-xs font-extrabold">Qual solução mais interessa? *
                <select name="product" required defaultValue="diagnostico" className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]">
                  <option value="diagnostico">Quero uma recomendação da GRIT</option>
                  <option value="sr-padeiro">Sr. Padeiro — padarias</option>
                  <option value="meu-espetinho">Meu Espetinho — alimentação</option>
                  <option value="sac-4-0">SAC 4.0 — atendimento</option>
                  <option value="crm-ia">CRM, prospecção e IA</option>
                  <option value="ecommerce">Gestão de e-commerce</option>
                  <option value="marca-site">Sites e landing pages</option>
                  <option value="branding">Logomarca e identidade visual</option>
                  <option value="juridico">Soluções para escritórios jurídicos</option>
                  <option value="consultoria">Consultoria e automação</option>
                  <option value="bi">Indicadores, dados e BI</option>
                  <option value="propostas">Propostas comerciais</option>
                </select>
              </label>
              <label className="block text-xs font-extrabold">O que mais precisa melhorar?
                <textarea name="message" maxLength={600} rows={2} placeholder="Ex.: preciso vender mais e organizar meus clientes"
                  className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]" />
              </label>
              <div className="absolute -left-[9999px]" aria-hidden="true"><label htmlFor="grit-website-honey">Não preencher</label><input id="grit-website-honey" name="website" tabIndex={-1} autoComplete="off" /></div>
              <label className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                <input type="checkbox" name="consent_lgpd" value="true" required className="mt-1 accent-[#FB7A18]" />
                <span>Autorizo a GRIT a entrar em contato pelo WhatsApp sobre esta solicitação e estou ciente da <a href="/solucoes/privacidade.html" target="_blank" rel="noopener noreferrer" className="underline text-[#AD520C]">política de privacidade</a>. *</span>
              </label>
              <button type="submit" className="w-full min-h-14 bg-[#FB7A18] hover:bg-[#ff9b4b] text-[#081A30] font-black rounded-xl px-4 py-3 flex justify-center items-center gap-2">
                Quero receber o contato da GRIT <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-[11px] text-center text-slate-500">Sem obrigação de contratar. Atendimento comercial com seus dados protegidos.</p>
            </div>
          </form>
        </div>
      </section>
      <section className="bg-[#F4F7FA] border-b border-slate-200 py-10" aria-label="Projetos e experiências GRIT">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-[#D46414] uppercase font-black tracking-[.15em]">Experiência aplicada • Projetos e negócios reais</p>
          <h2 className="text-2xl md:text-3xl font-black text-[#10273D] mt-2 mb-6">Tecnologia que entende o dia a dia do empresário.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><strong className="text-[#17354E] text-sm">Distribuidora Prohospital</strong><span className="text-xs text-slate-500 mt-2">Distribuição B2B e gestão comercial</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><strong className="text-[#17354E] text-sm">Shopping Prohospital</strong><span className="text-xs text-slate-500 mt-2">Varejo e soluções operacionais</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/sr-padeiro.svg" alt="Sr. Padeiro" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Padarias e conveniências</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/meu-espetinho.svg" alt="Meu Espetinho" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Bares e alimentação</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/tenpets-oficial-usuario.webp" alt="TenPets" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Projeto de e-commerce</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/moacir-rocha-oficial-usuario.webp" alt="Dr. Moacir Rocha" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Tecnologia jurídica</span></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Referências a projetos e experiências. Não representam depoimentos, aval formal ou resultados atribuídos a terceiros.</p>
        </div>
      </section>

      <section id="solucoes" className="max-w-7xl mx-auto px-4 py-20 lg:py-24">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-10 items-end mb-10">
          <div><p className="text-[#FF6A00] text-xs font-black uppercase tracking-[0.18em] mb-3">Soluções GRIT</p><h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] leading-tight">Do primeiro sinal à receita.</h2></div>
          <p className="text-[#5C6B7A] text-lg leading-relaxed">Começamos pelo problema. A solução pode combinar consultoria, processo, CRM, dados, automação, IA, SaaS e acompanhamento conforme a maturidade da operação.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solutions.map(item => {
            const Icon = item.icon;
            return <article key={item.title} className="group rounded-3xl border border-[#E2E8F0] bg-white p-7 hover:border-[#FF6A00]/50 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#061C2D] flex items-center justify-center mb-7 group-hover:bg-[#FF6A00] transition-colors"><Icon className="w-5 h-5 text-white" /></div>
              <p className="text-[11px] text-[#FF6A00] font-black tracking-widest mb-2">{item.kicker}</p><h3 className="text-xl font-black mb-3">{item.title}</h3><p className="text-sm text-[#5C6B7A] leading-relaxed">{item.text}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="bg-[#F5F7F9] border-y border-[#E2E8F0] py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-5">
          <div className="rounded-[2rem] bg-[#061C2D] text-white p-8 lg:p-10"><p className="text-[#FF6A00] text-xs font-black tracking-widest mb-4">O QUE ENCONTRAMOS</p><h2 className="text-3xl md:text-4xl font-black tracking-[-0.04em] mb-5">Operação ocupada. Gestão sem visibilidade.</h2><p className="text-slate-300 leading-relaxed">Leads dispersos, vendas manuais, atendimento sem rastreio, decisões em planilhas e equipes enxutas sobrecarregadas.</p></div>
          <div className="rounded-[2rem] bg-white border border-[#E2E8F0] p-8 lg:p-10"><p className="text-[#FF6A00] text-xs font-black tracking-widest mb-4">O QUE CONSTRUÍMOS</p><h2 className="text-3xl md:text-4xl font-black tracking-[-0.04em] mb-5">Processo claro. Tecnologia útil. Próxima ação visível.</h2><p className="text-[#5C6B7A] leading-relaxed">A GRIT organiza o fluxo, conecta ferramentas e cria indicadores para transformar atividade em gestão e gestão em evolução.</p></div>
        </div>
      </section>

      <section id="metodo" className="bg-[#061C2D] text-white py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4"><div className="max-w-3xl mb-10"><p className="text-[#FF6A00] text-xs font-black tracking-widest mb-3">MÉTODO GRIT</p><h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mb-5">Perguntamos antes de automatizar.</h2><p className="text-slate-300 text-lg">Mapeamos antes de integrar. Implantamos antes de celebrar. Medimos antes de prometer.</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">{method.map(([num, title, text]) => <article key={num} className="rounded-2xl bg-[#0A2A42] border border-white/10 p-6"><span className="text-3xl font-black text-[#FF6A00]">{num}</span><h3 className="text-lg font-black mt-6 mb-3">{title}</h3><p className="text-sm text-slate-300 leading-relaxed">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="produtos" className="max-w-7xl mx-auto px-4 py-20 lg:py-24">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-10 items-end mb-10"><div><p className="text-[#FF6A00] text-xs font-black tracking-widest mb-3">ECOSSISTEMA DE APLICATIVOS</p><h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Dores repetidas podem virar produtos.</h2></div><p className="text-[#5C6B7A] text-lg">Preservamos os ativos existentes e os conectamos a uma arquitetura de inteligência, aquisição e recorrência.</p></div>
        <div className="grid lg:grid-cols-3 gap-4">{products.map(product => <article key={product.name} className="rounded-3xl border border-[#E2E8F0] overflow-hidden bg-white flex flex-col"><div className="h-2 bg-[#FF6A00]"/><div className="p-7 flex-1 flex flex-col"><p className="text-[11px] text-[#FF6A00] font-black tracking-widest mb-3">{product.category.toUpperCase()}</p><h3 className="text-2xl font-black mb-4">{product.name}</h3><p className="text-sm text-[#5C6B7A] leading-relaxed mb-7">{product.description}</p><a href={product.href} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 font-black text-[#061C2D] hover:text-[#FF6A00] transition-colors">{product.cta}<ArrowRight className="w-4 h-4"/></a></div></article>)}</div>
      </section>

      <section id="insights" className="bg-[#F5F7F9] border-y border-[#E2E8F0] py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4"><div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"><div><p className="text-[#FF6A00] text-xs font-black tracking-widest mb-3">GRIT INSIGHTS</p><h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Conteúdo que gera contexto e oportunidade.</h2></div><button onClick={() => categories[0] && onSelectCategory(categories[0].slug)} className="text-sm font-black text-[#061C2D] inline-flex items-center gap-2">Explorar inteligência <ArrowRight className="w-4 h-4"/></button></div>
          {featuredArticles.length > 0 ? <div className="grid lg:grid-cols-3 gap-4">{featuredArticles.map(article => <article key={article.id} onClick={() => onSelectArticle(article)} className="cursor-pointer rounded-3xl bg-white border border-[#E2E8F0] overflow-hidden hover:shadow-xl transition-all group"><div className="h-48 bg-[#0A2A42] overflow-hidden">{article.featuredImage && <img src={article.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>}</div><div className="p-6"><p className="text-[11px] text-[#FF6A00] font-black tracking-widest mb-3">INSIGHT</p><h3 className="font-black text-lg leading-snug mb-3 line-clamp-2">{article.title}</h3><p className="text-sm text-[#5C6B7A] line-clamp-2">{article.summary || article.subtitle}</p></div></article>)}</div> : <div className="rounded-3xl bg-white border border-[#E2E8F0] p-8"><p className="text-[#5C6B7A]">O hub editorial está preparado para receber artigos conectados aos clusters de inteligência comercial, vendas, atendimento, SaaS, automação, IA, dados e gestão PME.</p></div>}
        </div>
      </section>

      <section id="diagnostico" className="max-w-7xl mx-auto px-4 py-20 lg:py-24">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#FF6A00] to-[#FF8128] p-8 md:p-12 lg:p-14 grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
          <div><p className="text-[#061C2D] text-xs font-black tracking-widest mb-3">DIAGNÓSTICO GRIT</p><h2 className="text-4xl md:text-5xl text-[#061C2D] font-black tracking-[-0.04em] mb-5">Conte onde a operação trava.</h2><p className="text-[#5A2A0B] text-lg leading-relaxed">Uma conversa objetiva para organizar o problema, identificar prioridades e desenhar um próximo passo executável.</p></div>
          <div className="rounded-3xl bg-white p-7 shadow-xl"><div className="flex items-start gap-3 mb-5"><ShieldCheck className="w-6 h-6 text-[#FF6A00] shrink-0"/><div><p className="font-black">Sem promessa genérica.</p><p className="text-sm text-[#5C6B7A] mt-1">Começamos pelo processo real e pelo resultado que precisa ser melhorado.</p></div></div><a href="mailto:gritsolucoes@gmail.com?subject=Diagnóstico%20GRIT" onClick={() => onShowToast('Abrindo seu e-mail para iniciar o diagnóstico GRIT.', 'info')} className="w-full bg-[#061C2D] hover:bg-[#0A2A42] text-white font-black px-6 py-4 rounded-xl flex items-center justify-center gap-2">Solicitar diagnóstico <ArrowRight className="w-4 h-4"/></a></div>
        </div>
      </section>
    </div>
  );
};
