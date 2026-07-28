import React from 'react';
import { Bookmark, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Article } from '../../types';
import { getBookmarks, toggleBookmark } from '../../lib/storage';

interface BookmarksViewProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  articles,
  onSelectArticle,
  onBackToHome,
  onShowToast
}) => {
  const [bookmarkIds, setBookmarkIds] = React.useState<string[]>(() => getBookmarks());

  const savedArticles = articles.filter(a => bookmarkIds.includes(a.id));

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleBookmark(id);
    setBookmarkIds(getBookmarks());
    onShowToast('Artigo removido dos seus salvos.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-12">
      <button
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145EDB] hover:text-[#0B2343]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Portal</span>
      </button>

      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EAF3FF] text-[#145EDB] rounded-xl flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0B2343]">Artigos Salvos para Leitura</h1>
            <p className="text-sm text-[#5C6B7A]">Sua biblioteca pessoal de matérias e análises salvas</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-[#145EDB] text-white px-3 py-1 rounded-full">
          {savedArticles.length} salvo(s)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedArticles.map(art => (
          <div
            key={art.id}
            onClick={() => onSelectArticle(art)}
            className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div className="relative">
              <img src={art.featuredImage} alt={art.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
              <button
                onClick={e => handleRemove(e, art.id)}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-500 hover:text-white text-gray-600 rounded-full shadow-md transition-colors"
                title="Remover dos salvos"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-2 line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs text-[#5C6B7A] line-clamp-2 mb-4">{art.summary}</p>
              </div>
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#145EDB]">
                <span>Continuar leitura</span>
                <ArrowRight className="w-4 h-4 text-[#FF8500]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {savedArticles.length === 0 && (
        <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl space-y-3">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#0B2343]">Sua lista de salvos está vazia</h3>
          <p className="text-sm text-[#5C6B7A]">
            Clique no botão "Salvar" ao ler qualquer artigo do GRIT NEWS para guardar matérias nesta lista.
          </p>
        </div>
      )}
    </div>
  );
};
