import React, { useState } from 'react';
import { TrendingUp, Sparkles, Clock, Eye, HeartPulse, PawPrint, Cpu, Truck, Globe, Smile, Lightbulb, Tag, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { Article, Category, Partner, Offer, AuthorProfile } from '../../types';
import { Badge } from '../ui/Badge';
import { AdBanner } from '../ui/AdBanner';
import { NewsletterBlock } from '../ui/NewsletterBlock';
import { OfferCard } from '../ui/OfferCard';
import { PartnerCard } from '../ui/PartnerCard';
import { AmazonShopSection } from '../ui/AmazonShopSection';
import { ArticleShareActions } from '../ui/ArticleShareActions';
import { SacProhBanner } from '../ui/SacProhBanner';

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
  onNavigateSacProh?: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  HeartPulse,
  PawPrint,
  Cpu,
  Truck,
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
  authors,
  onSelectArticle,
  onSelectCategory,
  onSelectPartner,
  onSelectAuthor,
  onNavigateOffers,
  onNavigateSacProh,
  onOpenLeadModal,
  onShowToast
}) => {
  const [trendingPeriod, setTrendingPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  const featuredHero = articles[0] || articles[0];
  const sideHeadlines = articles.slice(1, 4);
  const trendingArticles = articles.slice().sort((a, b) => b.viewsCount - a.viewsCount);
  const featuredOffers = offers.slice(0, 3);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      {featuredHero && (
        <section className="bg-white border-b border-[#E2E8F0] pt-6 pb-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Main Featured Article */}
              <div
                onClick={() => onSelectArticle(featuredHero)}
                className="lg:col-span-8 group cursor-pointer bg-white rounded-3xl overflow-hidden border border-[#E2E8F0] hover:border-[#145EDB] hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <div className="relative h-72 md:h-96 overflow-hidden bg-gray-100">
                  <img
                    src={featuredHero.featuredImage}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B2343]/90 via-[#0B2343]/30 to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant="orange" size="lg">
                      DESTAQUE PRINCIPAL
                    </Badge>
                    {featuredHero.isEvergreen && (
                      <Badge variant="navy" size="lg">
                        EVERGREEN
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-3 text-xs text-[#EAF3FF] mb-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredHero.readingTimeMinutes} min de leitura
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {featuredHero.viewsCount} acessos
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-white group-hover:text-[#EAF3FF] transition-colors mb-2">
                      {featuredHero.title}
                    </h1>
                  </div>
                </div>

                <div className="p-6 bg-white flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[#5C6B7A] text-base leading-relaxed mb-4">
                      {featuredHero.subtitle}
                    </p>
                    <div className="flex items-center justify-between text-xs font-bold text-[#145EDB] mb-4">
                      <span>Ler matéria completa com dados de mercado</span>
                      <ArrowRight className="w-4 h-4 text-[#FF8500] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <ArticleShareActions article={featuredHero} onShowToast={onShowToast} variant="card" />
                </div>
              </div>

              {/* Side Breaking Headlines */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#FF8500]" />
                    <h3 className="text-lg font-bold text-[#0B2343]">Em Destaque Agora</h3>
                  </div>
                  <span className="text-xs text-[#5C6B7A] font-semibold">Mercados Vivos</span>
                </div>

                <div className="space-y-4 flex-1">
                  {sideHeadlines.map(art => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArticle(art)}
                      className="group cursor-pointer p-4 bg-[#F7F9FC] hover:bg-[#EAF3FF] rounded-2xl border border-[#E2E8F0] hover:border-[#145EDB] transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="primary" size="sm">
                          {categories.find(c => c.id === art.categoryId)?.name || 'Grit News'}
                        </Badge>
                        <span className="text-[11px] text-[#5C6B7A]">
                          {art.readingTimeMinutes} min
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                    </div>
                  ))}
                </div>

                {/* Trust Seal Card */}
                <div className="p-4 bg-gradient-to-r from-[#0B2343] to-[#145EDB] text-white rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
                    <span className="text-xs font-bold text-[#EAF3FF]">Garantia Editorial GRIT NEWS</span>
                  </div>
                  <p className="text-xs text-gray-200">
                    Artigos revisados por especialistas de mercado, fontes verificadas e conformidade com as diretrizes E-E-A-T do Google.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid Bar */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2343]">Categorias Estratégicas</h2>
            <p className="text-sm text-[#5C6B7A]">Explore inteligência de mercado setor por setor</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(cat => {
            const IconComp = ICON_MAP[cat.iconName] || Tag;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-2xl p-4 hover:shadow-md transition-all text-center flex flex-col items-center justify-between"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${cat.color}15` }}
                >
                  <IconComp className="w-6 h-6" style={{ color: cat.color }} />
                </div>
                <h4 className="text-sm font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-1 line-clamp-1">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-[#5C6B7A] line-clamp-1">{cat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ad Placement Top */}
      <section className="max-w-7xl mx-auto px-4">
        <AdBanner location="HOME_BETWEEN_BLOCKS" />
      </section>

      {/* Trending & Period Filters Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2343] flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#145EDB]" />
              Notícias Mais Lidas & Análises em Alta
            </h2>
            <p className="text-sm text-[#5C6B7A]">
              O que os tomadores de decisão estão lendo agora
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F7F9FC] p-1 rounded-xl border border-[#E2E8F0]">
            {(['24h', '7d', '30d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setTrendingPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  trendingPeriod === period
                    ? 'bg-[#145EDB] text-white shadow-xs'
                    : 'text-[#5C6B7A] hover:text-[#0B2343]'
                }`}
              >
                {period === '24h' && 'Últimas 24h'}
                {period === '7d' && 'Esta Semana'}
                {period === '30d' && 'Este Mês'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingArticles.slice(0, 6).map((art, idx) => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={art.featuredImage}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute top-3 left-3 bg-[#0B2343] text-white text-xs font-extrabold w-7 h-7 rounded-full flex items-center justify-center border border-white/30">
                  #{idx + 1}
                </div>
                {art.isSponsored && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="orange" size="sm">
                      PATROCINADO
                    </Badge>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-[#5C6B7A]">
                    <span className="font-semibold text-[#145EDB]">{art.readingTimeMinutes} min</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {art.viewsCount} leituras
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-2 line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#5C6B7A] line-clamp-2 mb-4">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#145EDB]">
                    <span>Continuar lendo</span>
                    <ArrowRight className="w-4 h-4 text-[#FF8500] group-hover:translate-x-1 transition-transform" />
                  </div>
                  <ArticleShareActions article={art} onShowToast={onShowToast} variant="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Curiosidades & Tendências Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 font-extrabold px-3 py-1 rounded-full text-xs mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Seção Curiosidades & Viagens</span>
            </div>
            <h2 className="text-2xl font-bold text-[#0B2343]">Curiosidades, Cartões Black & Aviação</h2>
            <p className="text-sm text-[#5C6B7A]">Guias práticos, bastidores do setor aéreo e estratégias para voar melhor</p>
          </div>
          <button
            onClick={() => onSelectCategory('curiosidades')}
            className="text-xs font-bold text-[#145EDB] hover:text-[#0B2343] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver tudo em Curiosidades</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.filter(a => a.categoryId === 'cat-curiosidades').map(art => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-purple-500 rounded-3xl overflow-hidden hover:shadow-xl transition-all flex flex-col md:flex-row"
            >
              <div className="relative md:w-2/5 h-48 md:h-auto overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={art.featuredImage}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="navy" size="sm">
                    CURIOSIDADES
                  </Badge>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="font-bold text-purple-600">{art.readingTimeMinutes} min de leitura</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {art.viewsCount} acessos
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0B2343] group-hover:text-purple-700 transition-colors mb-2 line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#5C6B7A] line-clamp-2 mb-4">
                    {art.summary}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-purple-600 mb-2">
                    <span>Ler artigo completo</span>
                    <ArrowRight className="w-4 h-4 text-[#FF8500] group-hover:translate-x-1 transition-transform" />
                  </div>
                  <ArticleShareActions article={art} onShowToast={onShowToast} variant="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Amazon Products Showcase Section - Tasso Vasconcelos */}
      <div className="max-w-7xl mx-auto px-4">
        <AmazonShopSection onShowToast={onShowToast} />
      </div>

      {/* SACPROH Official Ecosystem & Disclosure Banner */}
      <div className="max-w-7xl mx-auto px-4">
        <SacProhBanner onNavigateSacProh={onNavigateSacProh} onShowToast={onShowToast} />
      </div>

      {/* Featured B2B Offers Section */}
      <section className="bg-[#F7F9FC] py-12 border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#FF8500]/10 text-[#FF8500] font-bold px-3 py-1 rounded-full text-xs mb-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Oportunidades & Vantagens Exclusivas</span>
              </div>
              <h2 className="text-2xl font-bold text-[#0B2343]">Central de Ofertas B2B GRIT NEWS</h2>
              <p className="text-sm text-[#5C6B7A]">Softwares, treinamentos e consultorias com cupons e condições especiais</p>
            </div>

            <button
              onClick={onNavigateOffers}
              className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <span>Ver Todas as Ofertas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
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

      {/* Strategic Partners Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2343]">Parceiros Estratégicos GRIT</h2>
            <p className="text-sm text-[#5C6B7A]">Empresas líderes que impulsionam o ecossistema de inovação</p>
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

      {/* Newsletter Capture Section */}
      <section className="max-w-7xl mx-auto px-4">
        <NewsletterBlock sourcePage="Home" onSuccessToast={onShowToast} />
      </section>
    </div>
  );
};
