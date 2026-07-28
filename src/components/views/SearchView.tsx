import React, { useState } from 'react';
import { Search, ArrowLeft, ArrowRight, Eye, Filter } from 'lucide-react';
import { Article, Category } from '../../types';

interface SearchViewProps {
  initialQuery: string;
  articles: Article[];
  categories: Category[];
  onSelectArticle: (article: Article) => void;
  onBackToHome: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery,
  articles,
  categories,
  onSelectArticle,
  onBackToHome
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  const results = articles.filter(art => {
    const q = query.toLowerCase().trim();
    const matchesQuery = q === '' ||
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.tags.some(t => t.toLowerCase().includes(q));
    const matchesCat = selectedCatId === null || art.categoryId === selectedCatId;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-12">
      <button
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145EDB] hover:text-[#0B2343]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Feed</span>
      </button>

      {/* Search Header Bar */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-xs space-y-4">
        <h1 className="text-2xl font-black text-[#0B2343]">Busca GRIT NEWS</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquise por palavra-chave, setor, inteligência artificial, saúde..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-base text-[#10233F] focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <span className="text-xs font-bold text-gray-400 shrink-0">Filtrar por Categoria:</span>
          <button
            onClick={() => setSelectedCatId(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              selectedCatId === null ? 'bg-[#0B2343] text-white' : 'bg-[#F7F9FC] text-[#5C6B7A]'
            }`}
          >
            Todas
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(selectedCatId === c.id ? null : c.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                selectedCatId === c.id ? 'bg-[#145EDB] text-white' : 'bg-[#F7F9FC] text-[#5C6B7A]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div>
        <p className="text-sm font-semibold text-[#5C6B7A] mb-4">
          Exibindo <strong>{results.length}</strong> resultado(s) para "{query}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(art => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <img src={art.featuredImage} alt={art.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-2 line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#5C6B7A] line-clamp-2 mb-4">{art.summary}</p>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#145EDB]">
                  <span>Ver matéria</span>
                  <ArrowRight className="w-4 h-4 text-[#FF8500]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl my-8 space-y-3">
            <h3 className="text-lg font-bold text-[#0B2343]">Nenhum artigo localizado</h3>
            <p className="text-sm text-[#5C6B7A]">Experimente buscar por termos mais genéricos como "saúde", "pet" ou "inteligência artificial".</p>
          </div>
        )}
      </div>
    </div>
  );
};
