import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Eye, 
  HeartPulse, 
  PawPrint, 
  Cpu, 
  Globe, 
  Smile, 
  Lightbulb, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  BarChart3, 
  Calendar, 
  ArrowUpRight, 
  Building2, 
  Feather, 
  CheckCircle2, 
  TrendingDown,
  Share2
} from 'lucide-react';
import { Article, Category, Partner, Offer, AuthorProfile } from '../../types';
import { Badge } from '../ui/Badge';
import { AdBanner } from '../ui/AdBanner';
import { NewsletterBlock } from '../ui/NewsletterBlock';
import { OfferCard } from '../ui/OfferCard';
import { PartnerCard } from '../ui/PartnerCard';
import { AmazonShopSection } from '../ui/AmazonShopSection';
import { ArticleShareActions } from '../ui/ArticleShareActions';
import { EusebioImoveisWidget } from '../home/EusebioImoveisWidget';
import { PlaybookPromoBanner } from '../home/PlaybookPromoBanner';
import { LiveRadarNewsEngine } from '../ui/LiveRadarNewsEngine';
import { useEconomicRadar } from '../../hooks/useEconomicRadar';

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

const ICON_MAP: Record<string, React.ElementType> = {
  HeartPulse,
  PawPrint,
  Cpu,
  Globe,
  TrendingUp,
  Smile,
  Lightbulb,
  Tag,
  Sparkles
};

export const HomeView: React.FC<HomeViewProps> = ({
  articles,
  categories,
  partners,
  offers,
  authors = [],
  onSelectArticle,
  onSelectCategory,
  onSelectPartner,
  onSelectAuthor,
  onNavigateOffers,
  onNavigateImoveis,
  onNavigatePlaybook,
  onNavigateRadar,
  onNavigateTenPets,
  onNavigateOpiniao,
  onNavigateFato,
  onOpenLeadModal,
  onShowToast
}) => {
  const [trendingPeriod, setTrendingPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const { summary: radarSummary, syncStatus } = useEconomicRadar();

  // Featured Lead Story + Side Stories
  const featuredHero = articles[0] || articles[0];
  const sideHeadlines = articles.slice(1, 4);
  const secondaryHeadlines = articles.slice(4, 7);
  const trendingArticles = articles.slice().sort((a, b) => b.viewsCount - a.viewsCount);
  const featuredOffers = offers.slice(0, 3);

  // Curated category buckets
  const techArticles = articles.filter(a => a.categoryId === 'cat-tecnologia-ia' || a.tags.includes('IA'));
  const businessArticles = articles.filter(a => a.categoryId === 'cat-negocios' || a.categoryId === 'cat-mercados');
  const petArticles = articles.filter(a => a.categoryId === 'cat-pet' || a.tags.includes('TenPets'));
  const curiosityArticles = articles.filter(a => a.categoryId === 'cat-curiosidades' || a.tags.includes('Viagens'));

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900 space-y-10 pb-16">
      
      {/* 1. LEAD EDITORIAL HERO SECTION (World-Class Broadsheet Grid) */}
      {featuredHero && (
        <section className="bg-white border-b border-slate-200 pt-6 pb-10">
          <div className="max-w-7xl mx-auto px-4">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* MAIN LEAD STORY (Cols 1 to 8): Clean high-contrast typography & 16:9 imagery */}
              <article 
                onClick={() => onSelectArticle(featuredHero)}
                className="lg:col-span-8 group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Category Kicker & Meta Tag */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold text-[#FF8A00] tracking-wider uppercase">
                      {categories.find(c => c.id === featuredHero.categoryId)?.name || 'Cibersegurança & IA'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      Investigação Especial
                    </span>
                    {featuredHero.isEvergreen && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Guia Evergreen
                        </span>
                      </>
                    )}
                  </div>

                  {/* Master Headline */}
                  <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-slate-900 leading-[1.18] tracking-tight group-hover:text-[#146EF5] transition-colors mb-3">
                    {featuredHero.title}
                  </h1>

                  {/* Subheadline (Deck) */}
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal mb-4">
                    {featuredHero.subtitle || featuredHero.summary}
                  </p>

                  {/* Byline & Read Metrics */}
                  <div className="flex items-center justify-between gap-4 py-2.5 border-y border-slate-100 mb-5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">Redação GRIT NEWS</span>
                      <span>•</span>
                      <span>16 de Agosto de 2026</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {featuredHero.readingTimeMinutes} min de leitura
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {featuredHero.viewsCount} visualizações
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Featured Photo (16:9 aspect ratio, crisp presentation) */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/9] shadow-xs">
                  <img
                    src={featuredHero.featuredImage}
                    alt={featuredHero.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200';
                    }}
                  />
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md">
                    Foto: GRIT Imagens / Divulgação
                  </div>
                </div>

                {/* Read more indicator & Share actions */}
                <div className="mt-4 pt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#146EF5] group-hover:underline">
                    <span>Ler reportagem completa</span>
                    <ArrowRight className="w-4 h-4 text-[#FF8A00] group-hover:translate-x-1 transition-transform" />
                  </span>
                  <ArticleShareActions article={featuredHero} onShowToast={onShowToast} variant="card" />
                </div>
              </article>

              {/* SIDE COLUMN: "Em Destaque Agora" (Cols 9 to 12) */}
              <aside className="lg:col-span-4 flex flex-col space-y-6 lg:pl-4 lg:border-l lg:border-slate-200">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A00] animate-pulse" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Em Destaque Agora
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    Tempo Real
                  </span>
                </div>

                {/* Curated Side Stories with Hairline Rules */}
                <div className="divide-y divide-slate-200">
                  {sideHeadlines.map((art, idx) => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArticle(art)}
                      className="group cursor-pointer py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#146EF5]">
                          {categories.find(c => c.id === art.categoryId)?.name || 'Análise'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {art.readingTimeMinutes} min
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#146EF5] transition-colors leading-snug line-clamp-2">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-normal leading-relaxed">
                        {art.summary}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Editorial Trust & E-E-A-T Guarantee Seal */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Compromisso Editorial GRIT
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Jornalismo técnico com checagem rigorosa de fontes, análise de dados e total independência editorial em conformidade com as diretrizes E-E-A-T.
                  </p>
                </div>

                {/* Quick Shortcuts to Hubs */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Canais Especializados
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={onNavigateTenPets}
                      className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                          TenPets
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Resgates & Veterinária</p>
                    </button>

                    {onNavigateImoveis && (
                      <button
                        onClick={onNavigateImoveis}
                        className="p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                            Eusébio Imóveis
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Alto Padrão & Lotes</p>
                      </button>
                    )}
                  </div>
                </div>

              </aside>

            </div>

          </div>
        </section>
      )}

      {/* 2. MARKET PULSE / RADAR ECONÔMICO BAR (Interactive Summary) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Radar Econômico & Mercados
                </h3>
                <p className="text-xs text-slate-500">Indicadores financeiros e inteligência de negócios</p>
              </div>
            </div>

            {onNavigateRadar && (
              <button
                onClick={onNavigateRadar}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#146EF5] hover:text-[#0D182A] transition-colors cursor-pointer"
              >
                <span>Ver cotações completas e gráficos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Dólar Comercial</span>
                <span className="text-[9px] font-mono text-slate-400">PTAX / UOL</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-slate-900">{radarSummary.dolarComercial}</span>
                <span className={`text-xs font-bold ${radarSummary.dolarPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {radarSummary.dolarVariacao}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Dólar Turismo</span>
                <span className="text-[9px] font-mono text-slate-400">Varejo / UOL</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-slate-900">{radarSummary.dolarTurismo}</span>
                <span className="text-xs font-bold text-emerald-600">
                  {radarSummary.dolarTurismoVariacao}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Euro Comercial</span>
                <span className="text-[9px] font-mono text-slate-400">BCE / UOL</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-slate-900">{radarSummary.euroComercial}</span>
                <span className="text-xs font-bold text-emerald-600">
                  {radarSummary.euroVariacao}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Ibovespa</span>
                <span className="text-[9px] font-mono text-slate-400">B3 S.A.</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-slate-900">{radarSummary.ibovespa}</span>
                <span className={`text-xs font-bold ${radarSummary.ibovespaPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {radarSummary.ibovespaVariacao}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Taxa Selic Meta</span>
                <span className="text-[9px] font-mono text-slate-400">Copom / BCB</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-slate-900">{radarSummary.selicMeta}</span>
                <span className="text-xs font-bold text-blue-600">CDI {radarSummary.cdiOver}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 LIVE RADAR AUTOMATED WIRE (Continuous News Feed with Source Attribution) */}
      <section className="max-w-7xl mx-auto px-4">
        <LiveRadarNewsEngine 
          variant="widget" 
          onNavigateRadar={onNavigateRadar}
        />
      </section>

      {/* 3. TRENDING & MOST READ ARTICLES (Clean 3-Column Editorial Grid with Numbering) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#146EF5]" />
              Mais Lidas & Em Alta na Semana
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              O que os tomadores de decisão e leitores estratégicos estão acompanhando
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            {(['24h', '7d', '30d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setTrendingPeriod(period)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  trendingPeriod === period
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period === '24h' && '24 Horas'}
                {period === '7d' && 'Esta Semana'}
                {period === '30d' && 'Este Mês'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingArticles.slice(0, 6).map((art, idx) => (
            <article
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer bg-white border border-slate-200 hover:border-slate-400 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={art.featuredImage}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-slate-900 text-white text-xs font-black w-6 h-6 rounded-md flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </div>
                  {art.isSponsored && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        Patrocinado
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                    <span className="font-bold text-[#146EF5]">
                      {categories.find(c => c.id === art.categoryId)?.name || 'Grit News'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {art.readingTimeMinutes} min
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#146EF5] transition-colors leading-snug line-clamp-2 mb-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#146EF5]">
                <span className="group-hover:underline inline-flex items-center gap-1">
                  Continuar lendo <ArrowRight className="w-3 h-3" />
                </span>
                <ArticleShareActions article={art} onShowToast={onShowToast} variant="compact" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. SECTIONS SHOWCASE (Curiosidades & Guias de Aviação / Cartões Black) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Especiais do Consumidor</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Curiosidades, Cartões Black & Aviação
            </h2>
          </div>
          <button
            onClick={() => onSelectCategory('cat-curiosidades')}
            className="text-xs font-bold text-[#146EF5] hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.filter(a => a.categoryId === 'cat-curiosidades').slice(0, 2).map(art => (
            <article
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer bg-white border border-slate-200 hover:border-purple-400 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col sm:flex-row"
            >
              <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={art.featuredImage}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800';
                  }}
                />
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="font-bold text-purple-700">{art.readingTimeMinutes} min de leitura</span>
                    <span>•</span>
                    <span>{art.viewsCount} leituras</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors leading-snug line-clamp-2 mb-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs font-bold text-purple-700">
                  <span className="group-hover:underline inline-flex items-center gap-1">
                    Ler artigo <ArrowRight className="w-3 h-3" />
                  </span>
                  <ArticleShareActions article={art} onShowToast={onShowToast} variant="compact" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. INFOPRODUTO EDITORIAL: PLAYBOOK DE EMAGRECIMENTO */}
      {onNavigatePlaybook && (
        <section className="max-w-7xl mx-auto px-4">
          <PlaybookPromoBanner onNavigatePlaybook={onNavigatePlaybook} />
        </section>
      )}

      {/* 6. RADAR IMOBILIÁRIO EUSÉBIO & ALPHAVILLE */}
      {onNavigateImoveis && (
        <section className="max-w-7xl mx-auto px-4">
          <EusebioImoveisWidget 
            onNavigateImoveis={onNavigateImoveis} 
            onShowToast={onShowToast} 
          />
        </section>
      )}

      {/* 7. AMAZON & MERCADO LIVRE CURATED SHOPPING */}
      <section className="max-w-7xl mx-auto px-4">
        <AmazonShopSection onShowToast={onShowToast} />
      </section>

      {/* 8. CENTRAL DE OFERTAS B2B */}
      <section className="bg-slate-100 py-10 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Oportunidades & Cupons</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Central de Ofertas & Soluções B2B
              </h2>
            </div>

            {onNavigateOffers && (
              <button
                onClick={onNavigateOffers}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>Ver Todas as Ofertas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredOffers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onOpenLeadModal={onOpenLeadModal}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 9. PARCEIROS ESTRATÉGICOS GRIT */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Parceiros & Empresas Apoiadoras
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Marcas líderes que impulsionam o ecossistema de conteúdo e tecnologia
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map(partner => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onSelectPartner={onSelectPartner}
            />
          ))}
        </div>
      </section>

      {/* 10. NEWSLETTER CAPTURE */}
      <section className="max-w-7xl mx-auto px-4">
        <NewsletterBlock sourcePage="Home" onSuccessToast={onShowToast} />
      </section>

    </div>
  );
};
