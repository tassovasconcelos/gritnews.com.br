import React, { useState } from 'react';
import { 
  Feather, 
  Quote, 
  ArrowRight, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  Share2, 
  User, 
  Mail, 
  Bookmark, 
  Clock, 
  Flame,
  ThumbsUp
} from 'lucide-react';
import { Article, AuthorProfile } from '../../types';

interface OpiniaoViewProps {
  articles: Article[];
  authors: AuthorProfile[];
  onSelectArticle: (article: Article) => void;
  onSelectAuthor?: (author: AuthorProfile) => void;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const OpiniaoView: React.FC<OpiniaoViewProps> = ({
  articles,
  authors,
  onSelectArticle,
  onSelectAuthor,
  onShowToast
}) => {
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('todos');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});

  const filteredArticles = articles.filter(a => {
    if (selectedAuthorId === 'todos') return true;
    return a.authorId === selectedAuthorId;
  });

  const handleToggleAudio = (articleId: string) => {
    if (playingAudioId === articleId) {
      setPlayingAudioId(null);
      onShowToast('Reprodução de áudio pausada.', 'info');
    } else {
      setPlayingAudioId(articleId);
      onShowToast('Reproduzindo síntese em áudio do editorial...', 'info');
    }
  };

  const handleLike = (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedArticles(prev => ({ ...prev, [articleId]: !prev[articleId] }));
    onShowToast('Obrigado pelo seu feedback no artigo de opinião!', 'success');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Header Opinião & Colunistas */}
      <div className="bg-gradient-to-br from-[#1C1A27] via-[#2A1B3D] to-[#120F24] text-white pt-10 pb-12 border-b border-purple-900/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Feather className="w-3.5 h-3.5 text-purple-400" />
                <span>Pensamento Crítico & Liderança</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Opinião & Colunas Especializadas
              </h1>
              <p className="text-purple-200 text-sm sm:text-base leading-relaxed">
                Ensaios, reflexões e análises profundas assinadas pelas vozes que moldam os debates sobre negócios, direito, medicina preventiva, tecnologia e bem-estar animal no Brasil.
              </p>
            </div>

            <div className="bg-purple-950/70 border border-purple-700/50 p-4 rounded-2xl flex flex-col gap-2 min-w-[260px] shadow-xl text-xs backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Quote className="w-4 h-4" />
                <span>Linha Editorial Independente</span>
              </div>
              <p className="text-purple-200 text-[11px] leading-relaxed">
                Pluralidade de ideias fundamentada em dados técnicos, evidências científicas e jurisprudência sólida.
              </p>
            </div>
          </div>

          {/* Grid de Colunistas Oficiais */}
          <div className="mt-8 pt-6 border-t border-purple-900/50">
            <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
              Filtre por Colunista Oficial:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
              <button
                onClick={() => setSelectedAuthorId('todos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedAuthorId === 'todos'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                }`}
              >
                Todos os Colunistas ({articles.length})
              </button>

              {authors.map(author => {
                const isSelected = selectedAuthorId === author.id;
                const authorArticlesCount = articles.filter(a => a.authorId === author.id).length;
                return (
                  <button
                    key={author.id}
                    onClick={() => setSelectedAuthorId(author.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-white text-slate-900 font-black border-amber-400 shadow-md'
                        : 'bg-purple-950/60 text-purple-200 border-purple-800/60 hover:bg-purple-900/80'
                    }`}
                  >
                    <img 
                      src={author.avatar} 
                      alt={author.name} 
                      className="w-6 h-6 rounded-full object-cover border border-white/40"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left">
                      <div className="font-bold leading-tight">{author.name}</div>
                      <div className="text-[10px] opacity-75">{authorArticlesCount} artigos</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 relative z-20 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Principal: Artigos de Opinião */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Artigos de Opinião & Ensaios</h2>
                <p className="text-xs text-slate-500">Exibindo {filteredArticles.length} publicações</p>
              </div>
            </div>

            <div className="space-y-5">
              {filteredArticles.map(art => {
                const author = authors.find(a => a.id === art.authorId);
                const isLiked = likedArticles[art.id];
                const isPlaying = playingAudioId === art.id;

                return (
                  <article
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex flex-col gap-4"
                  >
                    {/* Header do Autor do Artigo */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        {author?.avatar ? (
                          <img
                            src={author.avatar}
                            alt={author.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm">
                            {author?.name.charAt(0) || 'G'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm">{author?.name}</h4>
                          <p className="text-[11px] text-slate-500">{author?.roleTitle || 'Colunista Especialista'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAudio(art.id);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isPlaying
                              ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                              : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700'
                          }`}
                          title="Ouvir versão em áudio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isPlaying ? 'Ouvindo...' : 'Áudio'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Corpo do Artigo de Opinião */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-50 text-purple-800 rounded-md">
                          {art.tags[0] || 'Opinião'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {art.readingTimeMinutes} min de leitura
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-purple-700 transition-colors leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {art.summary}
                      </p>
                    </div>

                    {/* Footer com Interações */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={(e) => handleLike(art.id, e)}
                          className={`flex items-center gap-1.5 font-bold transition-colors ${
                            isLiked ? 'text-purple-600' : 'hover:text-slate-900'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{art.likesCount + (isLiked ? 1 : 0)} recomendam</span>
                        </button>
                      </div>

                      <span className="font-bold text-purple-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Ler ensaio completo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Coluna Lateral: Perfis dos Colunistas & Manifesto */}
          <div className="lg:col-span-4 space-y-6">
            {/* Box dos Colunistas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Nosso Conselho Editorial</span>
              </h3>

              <div className="space-y-3">
                {authors.map(aut => (
                  <div 
                    key={aut.id}
                    onClick={() => onSelectAuthor ? onSelectAuthor(aut) : setSelectedAuthorId(aut.id)}
                    className="p-3 bg-slate-50 hover:bg-purple-50/70 border border-slate-200/80 rounded-xl transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img 
                      src={aut.avatar} 
                      alt={aut.name} 
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-xs truncate">{aut.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{aut.roleTitle}</div>
                      <div className="text-[10px] text-purple-700 font-bold mt-0.5">{aut.articlesCount} publicações</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inscrição na Newsletter de Opinião */}
            <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-3">
              <h3 className="font-black text-sm sm:text-base">Newsletter "Pensamento & Negócios"</h3>
              <p className="text-xs text-purple-200 leading-relaxed">
                Toda sexta-feira, uma curadoria com os melhores ensaios dos nossos colunistas diretamente na sua caixa de entrada.
              </p>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  onShowToast('Inscrito com sucesso na newsletter de colunistas!', 'success');
                }} 
                className="space-y-2 pt-2"
              >
                <input
                  type="email"
                  placeholder="Seu melhor e-mail..."
                  className="w-full px-3.5 py-2 text-xs bg-purple-950/80 border border-purple-700 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Inscrever-se Gratuitamente
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
