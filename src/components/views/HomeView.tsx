import React from 'react';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Database,
  Headphones,
  LineChart,
  Search,
  ShieldCheck,
  Target,
  Users,
  Zap,
  Boxes,
  Flame,
} from 'lucide-react';
import { Article, Category, Partner, Offer, AuthorProfile } from '../../types';
import { GritBrandLogo } from '../ui/GritBrandLogo';

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
    icon: Target,
    title: 'Inteligência Comercial',
    text: 'Prospecção, leads, mercado e oportunidades reais.',
    href: '/solucoes/inteligencia-comercial/',
  },
  {
    icon: Users,
    title: 'Revenue Operations',
    text: 'CRM, pipeline, funil, equipe e performance comercial.',
    href: '/solucoes/vendas-revenue-operations/',
  },
  {
    icon: Headphones,
    title: 'Atendimento & Pós-venda',
    text: 'SAC, SLA, qualidade, assistência e experiência.',
    href: '/solucoes/atendimento-pos-venda/',
  },
  {
    icon: BrainCircuit,
    title: 'Automação & IA',
    text: 'Processos, RPA, agentes e inteligência aplicada.',
    href: '/solucoes/automacao-ia/',
  },
  {
    icon: LineChart,
    title: 'Dados, BI & Performance',
    text: 'Dashboards, análise, relatórios e indicadores.',
    href: '/solucoes/dados-bi/',
  },
  {
    icon: Boxes,
    title: 'Produtos SaaS GRIT',
    text: 'Soluções prontas para você crescer mais rápido.',
    href: '/produtos/',
  },
];

const products = [
  {
    name: 'OportunidadesPro',
    subtitle: 'by GRIT',
    icon: Boxes,
    description: 'Inteligência comercial e Revenue Operations para transformar dados em oportunidades acompanháveis.',
    bullets: ['Gestão de leads e oportunidades', 'Pipeline e forecast de vendas', 'Dashboards e indicadores'],
    href: 'https://oportunidadespro.gritnews.com.br',
  },
  {
    name: 'GRIT SAC 4.0',
    subtitle: 'Atendimento, qualidade e pós-venda',
    icon: Headphones,
    description: 'Centralize atendimentos, reclamações e assistência com rastreabilidade e inteligência.',
    bullets: ['Gestão de SAC e SLA', 'Qualidade, NPS e pesquisas', 'Assistência técnica e CAPA'],
    href: 'https://apps.sacproh.gritnews.com.br',
  },
  {
    name: 'Meu Espetinho',
    subtitle: 'Seu negócio no controle.',
    icon: Flame,
    description: 'Gestão completa para donos de espetinho que querem mais controle e lucro.',
    bullets: ['Estoque e cardápio digital', 'Financeiro e vendas', 'Relatórios e indicadores'],
    href: 'https://meuespetinho.gritnews.com.br',
  },
];

const articleFallbacks = [
  { category: 'INTELIGÊNCIA COMERCIAL', title: 'Como transformar leads em oportunidades reais', icon: Target },
  { category: 'VENDAS', title: 'Pipeline saudável: práticas para previsibilidade', icon: LineChart },
  { category: 'AUTOMAÇÃO', title: 'Automação comercial: por onde começar', icon: Code2 },
  { category: 'ATENDIMENTO', title: 'SLA de atendimento: mais eficiência e satisfação', icon: Headphones },
  { category: 'DADOS E BI', title: 'Dashboards que contam a história do seu negócio', icon: Database },
];

const BrandSeal: React.FC = () => (
  <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full border-2 border-white/75 grid place-items-center bg-[#061C2D]/90 shadow-[0_0_40px_rgba(255,106,0,.24)]">
    <div className="absolute inset-2 rounded-full border border-white/50" />
    <div className="absolute inset-0 grid place-items-center text-[8px] md:text-[9px] font-black tracking-[0.14em] text-white/90 [transform:rotate(-10deg)]">
      GRIT SOLUÇÕES E NEGÓCIOS
    </div>
    <div className="relative z-10 flex flex-col items-center mt-4">
      <GritBrandLogo variant="icon" size="sm" />
      <span className="text-2xl font-black tracking-[-0.05em] mt-1">grit</span>
      <span className="text-[7px] font-bold tracking-[0.14em] text-white/70">SOLUÇÕES E NEGÓCIOS</span>
    </div>
  </div>
);

export const HomeView: React.FC<HomeViewProps> = ({
  articles,
  onSelectArticle,
}) => {
  const featuredArticles = articles.slice(0, 5);
  const goToDiagnostic = () => document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="bg-[#F7F7F5] text-[#071A2A]">
      <section className="relative overflow-hidden bg-[#061C2D] text-white border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_48%,rgba(255,106,0,.24),transparent_30%),linear-gradient(115deg,#061C2D_0%,#061C2D_48%,#071A2A_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[58%] opacity-70 hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,106,0,.07)_50%,transparent_78%)]" />
          <div className="absolute left-[16%] top-[54%] w-[70%] h-1 bg-gradient-to-r from-transparent via-[#FF6A00] to-[#FFB15F] rotate-[-24deg] shadow-[0_0_24px_#FF6A00]" />
          <div className="absolute left-[28%] top-[46%] w-14 h-14 rounded-full border border-[#FF7A18] bg-[#0A1F31] grid place-items-center shadow-[0_0_30px_rgba(255,106,0,.3)]"><Search className="w-7 h-7 text-white" /></div>
          <div className="absolute left-[48%] top-[37%] w-14 h-14 rounded-full border border-[#FF7A18] bg-[#0A1F31] grid place-items-center shadow-[0_0_30px_rgba(255,106,0,.3)]"><Code2 className="w-7 h-7 text-white" /></div>
          <div className="absolute left-[67%] top-[25%] w-14 h-14 rounded-full border border-[#FF7A18] bg-[#0A1F31] grid place-items-center shadow-[0_0_30px_rgba(255,106,0,.3)]"><BarChart3 className="w-7 h-7 text-white" /></div>
          <div className="absolute right-[8%] top-[15%] text-[12rem] font-black text-[#FF6A00] leading-none rotate-[-10deg] drop-shadow-[0_0_18px_rgba(255,106,0,.5)]">↗</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-10 lg:pt-20 lg:pb-12 min-h-[560px] flex items-center">
          <div className="w-full lg:w-[55%]">
            <p className="text-[#FF6A00] text-xs md:text-sm font-black uppercase tracking-[0.18em] mb-5">Inteligência • Tecnologia • Execução • Resultados</p>
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-[-0.055em] leading-[0.97] max-w-3xl">
              Seu processo pode ser mais <span className="text-[#FF6A00]">inteligente.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
              Transformamos desafios comerciais e operacionais em processos claros, tecnologia útil e indicadores que orientam a próxima decisão.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={goToDiagnostic} className="bg-[#FF6A00] hover:bg-[#e95f00] text-white font-extrabold px-7 py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                Conte seu desafio <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#solucoes" className="border border-white/45 hover:bg-white/10 text-white font-bold px-7 py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                Explorar soluções <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-9 max-w-2xl text-xs text-slate-300">
              <div><CheckCircle2 className="w-5 h-5 text-[#FF6A00] mb-2" /><b className="text-white block">Diagnóstico</b><span>antes da ferramenta</span></div>
              <div><Zap className="w-5 h-5 text-[#FF6A00] mb-2" /><b className="text-white block">Execução</b><span>com método</span></div>
              <div><LineChart className="w-5 h-5 text-[#FF6A00] mb-2" /><b className="text-white block">Tecnologia</b><span>com propósito</span></div>
              <div><ShieldCheck className="w-5 h-5 text-[#FF6A00] mb-2" /><b className="text-white block">Resultado</b><span>como compromisso</span></div>
            </div>
          </div>
          <div className="hidden lg:block absolute right-8 bottom-8"><BrandSeal /></div>
        </div>
      </section>

      <section id="solucoes" className="bg-white border-b border-[#E3E7EA]">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {solutionCards.map(({ icon: Icon, title, text, href }, index) => (
            <a href={href} key={title} className={`group px-5 py-8 text-center hover:bg-[#FFF8F2] transition-colors ${index > 0 ? 'lg:border-l border-[#E3E7EA]' : ''}`}>
              <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center text-[#071B2C] mb-4 group-hover:scale-105 transition-transform">
                <Icon className="w-10 h-10 stroke-[2.2]" />
              </div>
              <h2 className="font-black text-[17px] leading-tight min-h-[42px]">{title}</h2>
              <p className="mt-3 text-xs text-[#5D6873] leading-relaxed min-h-[48px]">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#FF6A00]">Saiba mais <ArrowRight className="w-3.5 h-3.5" /></span>
            </a>
          ))}
        </div>
      </section>

      <section id="produtos" className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="rounded-xl bg-[#061C2D] border border-[#0C2A40] p-5 md:p-7 shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="h-px w-10 bg-[#FF6A00]" />
            <p className="text-white text-sm font-black tracking-[0.12em]">NOSSOS PRODUTOS SAAS</p>
            <span className="h-px w-10 bg-[#FF6A00]" />
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {products.map(({ name, subtitle, icon: Icon, description, bullets, href }) => (
              <article key={name} className="rounded-xl border border-white/10 bg-[#0A1F31] p-6 text-white flex flex-col min-h-[280px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl border border-white/10 bg-[#071A2A] grid place-items-center"><Icon className="w-7 h-7 text-[#FF6A00]" /></div>
                  <div><h3 className="text-xl font-black">{name}</h3><p className="text-sm text-slate-300">{subtitle}</p></div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed mb-4">{description}</p>
                <ul className="space-y-2 text-sm text-slate-200 mb-5">{bullets.map(item => <li key={item}>• {item}</li>)}</ul>
                <a href={href} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 text-[#FF6A00] font-extrabold text-sm">Conheça {name} <ArrowRight className="w-4 h-4" /></a>
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
            const FallbackIcon = articleFallbacks[index]?.icon || Target;
            return (
              <button key={article?.id || item.title} onClick={() => article && onSelectArticle(article)} className="text-left bg-white border border-[#E3E7EA] rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="h-28 bg-gradient-to-br from-[#E8EDF0] to-[#C8D0D7] grid place-items-center"><FallbackIcon className="w-10 h-10 text-[#071B2C]/70" /></div>
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

      <section id="diagnostico" className="bg-[#071A2A] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-5">
          <div className="flex gap-3"><Target className="w-6 h-6 text-[#FF6A00] shrink-0"/><div><b className="block">Metodologia própria GRIT</b><span className="text-sm text-slate-400">Diagnóstico que revela o que realmente importa.</span></div></div>
          <div className="flex gap-3"><Boxes className="w-6 h-6 text-[#FF6A00] shrink-0"/><div><b className="block">Soluções para PMEs e grandes empresas</b><span className="text-sm text-slate-400">Do tamanho do seu desafio.</span></div></div>
          <div className="flex gap-3"><BrainCircuit className="w-6 h-6 text-[#FF6A00] shrink-0"/><div><b className="block">Tecnologia com propósito e resultado</b><span className="text-sm text-slate-400">Ferramentas que geram valor real.</span></div></div>
          <div className="flex gap-3"><ShieldCheck className="w-6 h-6 text-[#FF6A00] shrink-0"/><div><b className="block">Segurança e governança de dados</b><span className="text-sm text-slate-400">Proteção, conformidade e confiança.</span></div></div>
        </div>
      </section>
    </div>
  );
};
