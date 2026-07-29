import React, { useEffect, useState } from 'react';
import { Tag, Sparkles, Filter, Calendar, Eye, ArrowRight, TrendingUp } from 'lucide-react';
import { Article, Category } from '../../types';
import { updatePageSEO } from '../../lib/seo';

interface TagViewProps {
  tag: string;
  articles: Article[];
  categories: Category[];
  onSelectArticle: (article: Article) => void;
  onSelectTag: (tag: string) => void;
}

export const TagView: React.FC<TagViewProps> = ({
  tag,
  articles,
  categories,
  onSelectArticle,
  onSelectTag
}) => {
  useEffect(() => {
    updatePageSEO({
      title: `Artigos e Notícias sobre #${tag}`,
      description: `Confira matérias, análises de mercado, novidades e dados atualizados sobre ${tag} no portal GRIT NEWS.`,
      keywords: [tag, 'Notícias', 'Inteligência de Mercado', 'Grit News'],
      canonicalUrl: `https://www.gritnews.com.br/tag/${encodeURIComponent(tag)}`
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tag]);

  // Extract all available tags across articles
  const allTags: string[] = Array.from(
    new Set(articles.flatMap(art => art.tags || []))
  ).filter((t): t is string => Boolean(t));

  const filteredArticles = articles.filter(art =>
    art.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#10233F] via-[#145EDB] to-[#0B2343] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-amber-300 border border-white/20">
            <Tag className="w-3.5 h-3.5" />
            <span>Ecossistema de Tags & SEO</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Tópico: <span className="text-[#FF8500]">#{tag}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
            Explorador de notícias e análises agrupadas por termos estratégicos e palavras-chave em alta no mercado.
          </p>
        </div>
      </div>

      {/* Popular Tags Horizontal Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#10233F]">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#145EDB]" />
            Tags em Destaque no Portal
          </span>
          <span className="text-[10px] text-gray-400 font-normal">{allTags.length} tags indexadas</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {allTags.map((t, idx) => {
            const isSelected = t.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={idx}
                onClick={() => onSelectTag(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#145EDB] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-[#10233F]'
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#10233F]">
            Matérias relacionadas a #{tag} ({filteredArticles.length})
          </h2>
        </div>

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(art => {
              const catObj = categories.find(c => c.id === art.categoryId);
              return (
                <article
                  key={art.id}
                  onClick={() => onSelectArticle(art)}
                  className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col group"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={art.featuredImage}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {catObj && (
                      <span className="absolute top-3 left-3 bg-[#10233F]/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {catObj.name}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm text-[#10233F] group-hover:text-[#145EDB] transition-colors leading-snug line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(art.publishedAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1 text-[#145EDB] font-bold">
                        Ler matéria <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#E2E8F0]">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#10233F]">Nenhuma matéria encontrada para esta tag</h3>
            <p className="text-xs text-gray-500 mt-1">Selecione outra tag acima para explorar as notícias do portal.</p>
          </div>
        )}
      </div>
    </div>
  );
};
