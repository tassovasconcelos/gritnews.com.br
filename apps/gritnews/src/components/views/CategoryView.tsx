import React, { useState } from 'react';
import { Search, ArrowLeft, ArrowRight, Eye, Tag, Sparkles, Filter } from 'lucide-react';
import { Article, Category, Offer } from '../../types';
import { Badge } from '../ui/Badge';
import { AdBanner } from '../ui/AdBanner';
import { OfferCard } from '../ui/OfferCard';
import { NewsletterBlock } from '../ui/NewsletterBlock';
import { ArticleShareActions } from '../ui/ArticleShareActions';

interface CategoryViewProps {
  category: Category;
  articles: Article[];
  offers: Offer[];
  onSelectArticle: (article: Article) => void;
  onBackToHome: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  articles,
  offers,
  onSelectArticle,
  onBackToHome,
  onOpenLeadModal,
  onShowToast
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const categoryArticles = articles.filter(a => a.categoryId === category.id);
  const categoryOffers = offers.filter(o => o.categoryId === category.id);

  // Collect all unique tags for filter
  const allTags = Array.from(new Set(categoryArticles.flatMap(a => a.tags)));

  const filteredArticles = categoryArticles.filter(art => {
    const matchesQuery = filterQuery === '' ||
      art.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesTag = selectedTag === null || art.tags.includes(selectedTag);
    return matchesQuery && matchesTag;
  });

  const featuredInCat = categoryArticles[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Category Header Banner */}
      <div
        className="text-white py-12 px-6 rounded-3xl shadow-lg relative overflow-hidden"
        style={{ backgroundColor: category.color }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para todas as notícias</span>
            </button>
            <h1 className="text-3xl md:text-5xl font-black text-white">{category.name}</h1>
            <p className="text-sm md:text-base text-white/90 leading-relaxed">{category.description}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs text-white max-w-xs">
            <span className="font-bold text-white uppercase block mb-1">Estatísticas da Seção</span>
            <div className="flex items-center justify-between py-1 border-b border-white/10">
              <span>Matérias Publicadas:</span>
              <strong className="font-bold">{categoryArticles.length}</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Ofertas Ativas:</span>
              <strong className="font-bold">{categoryOffers.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search & Tag Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs mb-8">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={`Filtrar matérias de ${category.name}...`}
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
              <span className="text-xs font-bold text-gray-500 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Tags:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedTag === null ? 'bg-[#0B2343] text-white' : 'bg-[#F7F9FC] text-[#5C6B7A]'
                }`}
              >
                Todas
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    selectedTag === tag ? 'bg-[#145EDB] text-white' : 'bg-[#F7F9FC] text-[#5C6B7A] hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Featured in Category */}
        {featuredInCat && !filterQuery && !selectedTag && (
          <div
            onClick={() => onSelectArticle(featuredInCat)}
            className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all mb-10 grid grid-cols-1 md:grid-cols-12"
          >
            <div className="md:col-span-7 relative h-64 md:h-80 overflow-hidden bg-gray-100">
              <img
                src={featuredInCat.featuredImage}
                alt=""
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <Badge variant="orange" size="md">Destaque da Categoria</Badge>
              </div>
            </div>

            <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#5C6B7A] mb-2 font-semibold">
                  <span>{featuredInCat.readingTimeMinutes} min de leitura</span>
                  <span>•</span>
                  <span>{featuredInCat.viewsCount} acessos</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-3">
                  {featuredInCat.title}
                </h3>
                <p className="text-sm text-[#5C6B7A] line-clamp-3 mb-4">
                  {featuredInCat.subtitle}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#145EDB] pt-4 border-t border-[#E2E8F0] mb-2">
                  <span>Ler matéria completa</span>
                  <ArrowRight className="w-4 h-4 text-[#FF8500] group-hover:translate-x-1 transition-transform" />
                </div>
                <ArticleShareActions article={featuredInCat} onShowToast={onShowToast} variant="card" />
              </div>
            </div>
          </div>
        )}

        {/* Main Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredArticles.map(art => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={art.featuredImage}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-[#5C6B7A]">
                    <span className="font-semibold text-[#145EDB]">{art.readingTimeMinutes} min</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {art.viewsCount}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-2 line-clamp-2">
                    {art.title}
                  </h4>
                  <p className="text-xs text-[#5C6B7A] line-clamp-2 mb-4">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#145EDB]">
                    <span>Ver artigo</span>
                    <ArrowRight className="w-4 h-4 text-[#FF8500] group-hover:translate-x-1 transition-transform" />
                  </div>
                  <ArticleShareActions article={art} onShowToast={onShowToast} variant="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0] my-8">
            <h3 className="text-lg font-bold text-[#0B2343] mb-2">Nenhum artigo encontrado</h3>
            <p className="text-sm text-[#5C6B7A] mb-4">Tente limpar os filtros de busca ou escolher outra tag.</p>
            <button
              onClick={() => {
                setFilterQuery('');
                setSelectedTag(null);
              }}
              className="bg-[#145EDB] text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Category Specific Offers */}
        {categoryOffers.length > 0 && (
          <div className="my-12 p-8 bg-[#F7F9FC] rounded-3xl border border-[#E2E8F0]">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#0B2343]">Ofertas de {category.name}</h3>
              <p className="text-sm text-[#5C6B7A]">Oportunidades com descontos selecionados para este setor</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryOffers.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onOpenLeadModal={onOpenLeadModal}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ad Placement Category */}
        <AdBanner location="CATEGORY_TOP" categoryId={category.id} className="my-8" />

        {/* Category Newsletter */}
        <NewsletterBlock sourcePage={`Categoria ${category.name}`} onSuccessToast={onShowToast} />
      </div>
    </div>
  );
};
