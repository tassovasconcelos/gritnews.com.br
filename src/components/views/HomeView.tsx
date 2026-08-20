import React from 'react';
import { ArrowRight } from 'lucide-react';
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
  onNavigateImoveis?: () => void;
  onNavigatePlaybook?: () => void;
  onNavigateRadar?: () => void;
  onNavigateTenPets?: () => void;
  onNavigateOpiniao?: () => void;
  onNavigateFato?: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

const solutionCards = [
  {
    icon: '/brand/grit/icons/grit-icon-inteligencia.svg',
    title: 'Inteligência Comercial',
    text: 'Prospecção, leads, mercado e oportunidades reais.',
    href: '/solucoes/inteligencia-comercial/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-vendas.svg',
    title: 'Revenue Operations',
    text: 'CRM, pipeline, funil, equipe e performance comercial.',
    href: '/solucoes/vendas-revenue-operations/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-atendimento.svg',
    title: 'Atendimento & Pós-venda',
    text: 'SAC, SLA, qualidade, assistência e experiência.',
    href: '/solucoes/atendimento-pos-venda/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-tecnologia.svg',
    title: 'Automação & IA',
    text: 'Processos, RPA, agentes e inteligência aplicada.',
    href: '/solucoes/automacao-ia/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-dados-bi.svg',
    title: 'Dados, BI & Performance',
    text: 'Dashboards, análise, relatórios e indicadores.',
    href: '/solucoes/dados-bi/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-crescimento.svg',
    title: 'Produtos SaaS GRIT',
    text: 'Soluções prontas para você crescer mais rápido.',
    href: '/produtos/',
  },
];

const products = [
  {
    name: 'OportunidadesPro',
    subtitle: 'by GRIT',
    icon: '/brand/grit/icons/grit-icon-inteligencia.svg',
    description: 'Inteligência comercial e Revenue Operations para transformar dados em oportunidades acompanháveis.',
    bullets: ['Gestão de leads e oportunidades', 'Pipeline e forecast de vendas', 'Dashboards e indicadores'],
    href: 'https://oportunidadespro.gritnews.com.br',
  },
  {
    name: 'GRIT SAC 4.0',
    subtitle: 'Atendimento, qualidade e pós-venda',
    icon: '/brand/grit/icons/grit-icon-atendimento.svg',
    description: 'Centralize atendimentos, reclamações e assistência com rastreabilidade e inteligência.',
    bullets: ['Gestão de SAC e SLA', 'Qualidade, NPS e pesquisas', 'Assistência técnica e CAPA'],
    href: 'https://apps.sacproh.gritnews.com.br',
  },
  {
    name: 'Meu Espetinho',
    subtitle: 'Seu negócio no controle.',
    icon: '/brand/grit/icons/grit-icon-financeiro.svg',
    description: 'Gestão completa para donos de espetinho que querem mais controle e lucro.',
    bullets: ['Estoque e cardápio digital', 'Financeiro e vendas', 'Relatórios e indicadores'],
    href: 'https://meuespetinho.gritnews.com.br',
  },
];

const articleFallbacks = [
  { category: 'INTELIGÊNCIA COMERCIAL', title: 'Como transformar leads em oportunidades reais', icon: 'inteligencia' },
  { category: 'VENDAS', title: 'Pipeline saudável: práticas para previsibilidade', icon: 'vendas' },
  { category: 'AUTOMAÇÃO', title: 'Automação comercial: por onde começar', icon: 'tecnologia' },
  { category: 'ATENDIMENTO', title: 'SLA de atendimento: mais eficiência e satisfação', icon: 'atendimento' },
  { category: 'DADOS E BI', title: 'Dashboards que contam a história do seu negócio', icon: 'dados-bi' },
];

const BrandSeal: React.FC = () => (
  <img src="/brand/grit/seal/grit-carimbo-oficial.svg" alt="Selo oficial GRIT Soluções e Negócios" className="w-32 h-32 md:w-36 md:h-36 object-contain" />
);

export const HomeView: React.FC<HomeViewProps> = ({
  articles,
  onSelectArticle,
}) => {
  const featuredArticles = articles.slice(0, 5);
  const goToDiagnostic = () => document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="bg-[#F7F5F3] text-[#1B2F42]">
      <section className="relative overflow-hidden bg-[#0A1930] text-white border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_48%,rgba(251,122,24,.17),transparent_28%),linear-gradient(115deg,#0A1930_0%,#0A1930_54%,#1B2F42_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[58%] opacity-70 hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,106,0,.07)_50%,transparent_78%)]" />
          <div className="absolute left-[16%] top-[54%] w-[70%] h-px bg-gradient-to-r from-transparent via-[#FB7A18] to-[#FB7A18] rotate-[-24deg]" />
          {['processos','tecnologia','performance'].map((name, index) => (
            <div key={name} className="absolute w-16 h-16 rounded-2xl border border-white/15 bg-[#0A1930] grid place-items-center" style={{ left: `${28 + index * 20}%`, top: `${46 - index * 10}%` }}>
              <img src={`/brand/grit/icons/grit-icon-${name}.svg`} alt="" className="w-11 h-11" />
            </div>
          ))}
          <img src="/brand/grit/logos/grit-simbolo-fundo-navy.svg" alt="" className="absolute right-[4%] top-[10%] w-44 h-44 object-contain opacity-90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-10 lg:pt-20 lg:pb-12 min-h-[560px] flex items-center">
          <div className="w-full lg:w-[55%]">
            <p className="text-[#FB7A18] text-xs md:text-sm font-semibold uppercase tracking-[0.18em] mb-5">Inteligência • Tecnologia • Execução • Resultados</p>
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-[-0.055em] leading-[0.97] max-w-3xl">
              Seu processo pode ser mais <span className="text-[#FB7A18]">inteligente.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
              Transformamos desafios comerciais e operacionais em processos claros, tecnologia útil e indicadores que orientam a próxima decisão.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={goToDiagnostic} className="bg-[#FB7A18] hover:bg-[#e66b0b] text-white font-bold px-7 py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                Conte seu desafio <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#solucoes" className="border border-white/45 hover:bg-white/10 text-white font-bold px-7 py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                Explorar soluções <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-9 max-w-2xl text-xs text-slate-300">
              {[['estrategia','Diagnóstico','antes da ferramenta'],['processos','Execução','com método'],['tecnologia','Tecnologia','com propósito'],['performance','Resultado','como compromisso']].map(([icon,title,text]) => <div key={title}><img src={`/brand/grit/icons/grit-icon-${icon}.svg`} alt="" className="w-8 h-8 mb-2 brightness-0 invert" /><b className="text-white block">{title}</b><span>{text}</span></div>)}
            </div>
          </div>
          <div className="hidden lg:block absolute right-8 bottom-8"><BrandSeal /></div>
        </div>
      </section>

      <section id="solucoes" className="bg-white border-b border-[#E3E7EA]">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {solutionCards.map(({ icon, title, text, href }, index) => (
            <a href={href} key={title} className={`group px-5 py-8 text-center hover:bg-[#FFF8F2] transition-colors ${index > 0 ? 'lg:border-l border-[#E3E7EA]' : ''}`}>
              <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center text-[#071B2C] mb-4 group-hover:scale-105 transition-transform">
                <img src={icon} alt="" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="font-black text-[17px] leading-tight min-h-[42px]">{title}</h2>
              <p className="mt-3 text-xs text-[#5D6873] leading-relaxed min-h-[48px]">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#FB7A18]">Saiba mais <ArrowRight className="w-3.5 h-3.5" /></span>
            </a>
          ))}
        </div>
      </section>

      <section id="metodo" className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-10 items-center">
          <div><p className="text-[#FB7A18] text-xs font-semibold tracking-[.2em] uppercase">Método GRIT</p><h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-.04em]">Clareza antes da ferramenta. Método antes da entrega.</h2><p className="mt-5 text-[#5B6B7A] leading-relaxed">Conectamos estratégia, processos, tecnologia e análise para transformar o desafio real do negócio em execução mensurável.</p></div>
          <div className="grid sm:grid-cols-2 gap-4">{[['estrategia','Diagnosticar','Entender contexto, gargalos e prioridades.'],['processos','Estruturar','Organizar fluxo, responsabilidades e indicadores.'],['tecnologia','Implementar','Aplicar tecnologia útil ao processo.'],['analise','Medir e evoluir','Acompanhar resultados e orientar a próxima decisão.']].map(([icon,title,text], index)=><article key={title} className="bg-white border border-[#1B2F42]/10 rounded-xl p-6"><span className="text-[#FB7A18] text-xs font-semibold">0{index+1}</span><img src={`/brand/grit/icons/grit-icon-${icon}.svg`} alt="" className="w-12 h-12 my-4"/><h3 className="font-bold text-xl">{title}</h3><p className="mt-2 text-sm text-[#5B6B7A]">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="produtos" className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="rounded-xl bg-[#0A1930] border border-[#1B2F42] p-5 md:p-7 shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="h-px w-10 bg-[#FF6A00]" />
            <p className="text-white text-sm font-black tracking-[0.12em]">NOSSOS PRODUTOS SAAS</p>
            <span className="h-px w-10 bg-[#FF6A00]" />
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {products.map(({ name, subtitle, icon, description, bullets, href }) => (
              <article key={name} className="rounded-xl border border-white/10 bg-[#0A1F31] p-6 text-white flex flex-col min-h-[280px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl border border-white/10 bg-white grid place-items-center"><img src={icon} alt="" className="w-11 h-11" /></div>
                  <div><h3 className="text-xl font-black">{name}</h3><p className="text-sm text-slate-300">{subtitle}</p></div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed mb-4">{description}</p>
                <ul className="space-y-2 text-sm text-slate-200 mb-5">{bullets.map(item => <li key={item}>• {item}</li>)}</ul>
                <a href={href} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 text-[#FB7A18] font-bold text-sm">Conheça {name} <ArrowRight className="w-4 h-4" /></a>
              </article>
            ))}
          </div>
          <div className="flex justify-center mt-4"><a href="/produtos/" className="min-w-[280px] text-center border border-[#FF6A00] text-[#FF6A00] px-5 py-3 rounded-md font-extrabold text-sm hover:bg-[#FF6A00] hover:text-white transition-colors">Ver todos os produtos →</a></div>
        </div>
      </section>

      <section id="insights" className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div><p className="text-[#FF6A00] text-xs font-black tracking-widest">GRIT INSIGHTS</p><h2 className="text-2xl md:text-3xl font-black tracking-[-0.03em]">Conteúdo que gera inteligência e impulsiona resultados.</h2></div>
          <a href="/insights/" className="hidden sm:inline-flex items-center gap-2 text-[#FF6A00] font-extrabold text-sm">Ver todos os artigos <ArrowRight className="w-4 h-4" /></a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(featuredArticles.length ? featuredArticles : articleFallbacks).slice(0, 5).map((item: any, index) => {
            const article = featuredArticles[index];
            const fallbackIcon = articleFallbacks[index]?.icon || 'analise';
            return (
              <button key={article?.id || item.title} onClick={() => article && onSelectArticle(article)} className="text-left bg-white border border-[#E3E7EA] rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="h-28 bg-gradient-to-br from-[#F7F5F3] to-[#E8EDF0] grid place-items-center"><img src={`/brand/grit/icons/grit-icon-${fallbackIcon}.svg`} alt="" className="w-12 h-12" /></div>
                <div className="p-4">
                  <p className="text-[9px] text-[#FF6A00] font-black tracking-wide mb-2">{article?.category?.name?.toUpperCase?.() || articleFallbacks[index]?.category}</p>
                  <h3 className="font-black leading-snug line-clamp-3">{article?.title || articleFallbacks[index]?.title}</h3>
                  <p className="mt-4 text-xs text-[#6A7480]">Leitura estratégica • GRIT Insights</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="diagnostico" className="bg-[#1B2F42] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-5">
          {[['estrategia','Metodologia própria GRIT','Diagnóstico que revela o que realmente importa.'],['crescimento','Soluções para PMEs e grandes empresas','Do tamanho do seu desafio.'],['tecnologia','Tecnologia com propósito e resultado','Ferramentas que geram valor real.'],['seguranca','Segurança e governança de dados','Proteção, conformidade e confiança.']].map(([icon,title,text])=><div key={title} className="flex gap-3"><img src={`/brand/grit/icons/grit-icon-${icon}.svg`} alt="" className="w-9 h-9 shrink-0 brightness-0 invert"/><div><b className="block">{title}</b><span className="text-sm text-slate-300">{text}</span></div></div>)}
        </div>
      </section>
    </div>
  );
};
