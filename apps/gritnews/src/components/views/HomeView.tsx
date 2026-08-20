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
    document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white text-[#071A2A]">
      <section className="relative overflow-hidden bg-[#061C2D] text-white">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_75%_25%,rgba(255,106,0,.28),transparent_32%),radial-gradient(circle_at_70%_80%,rgba(20,94,219,.22),transparent_34%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28 grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[#FF7A18] text-xs font-black uppercase tracking-[0.18em] mb-6">
              <Sparkles className="w-4 h-4" />
              Inteligência comercial • tecnologia • execução
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.05em] leading-[0.95] mb-7">
              Transformamos complexidade em <span className="text-[#FF6A00]">movimento.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mb-8">
              A GRIT transforma gargalos comerciais e operacionais em processos claros, tecnologia útil e indicadores que orientam a próxima decisão.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button onClick={goToDiagnostic} className="bg-[#FF6A00] hover:bg-[#e65f00] text-white font-extrabold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-950/20">
                Conte seu desafio <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#solucoes" className="border border-white/25 hover:bg-white/10 text-white font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all">
                Explorar soluções <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0" /><span>Diagnóstico antes da ferramenta.</span></div>
              <div className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0" /><span>Implantação antes da promessa.</span></div>
              <div className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0" /><span>Evolução orientada por dados.</span></div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-[#0A263B]/80 backdrop-blur p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div><p className="text-xs text-slate-400 uppercase tracking-widest font-bold">GRIT Intelligence</p><h3 className="text-xl font-black mt-1">Visão integrada do crescimento</h3></div>
                <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/15 flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-[#FF6A00]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {['Aquisição', 'Oportunidades', 'Conversão', 'Recorrência'].map((label, idx) => (
                  <div key={label} className="rounded-2xl bg-[#071A2A] border border-white/5 p-4">
                    <p className="text-[11px] text-slate-400 mb-3">{label}</p>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#FF6A00]" style={{ width: `${48 + idx * 12}%` }} /></div>
                    <p className="text-[10px] text-slate-500 mt-2">Dados reais após integração</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-5 text-[#071A2A]">
                <div className="flex items-center justify-between gap-4"><div><p className="text-xs text-[#6B7780]">Princípio GRIT</p><p className="font-black text-lg mt-1">Medimos antes de prometer.</p></div><BarChart3 className="w-8 h-8 text-[#FF6A00]" /></div>
              </div>
            </div>
          </div>
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
