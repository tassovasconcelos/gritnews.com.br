import React, { useState } from 'react';
import { ThumbsUp, Sparkles, Bookmark, Share2, Check } from 'lucide-react';
import { incrementArticleLikes, toggleBookmark, getBookmarks } from '../../lib/storage';
import { trackEvent } from '../../lib/analytics';

interface RatingReactionsProps {
  articleId: string;
  initialLikes: number;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const RatingReactions: React.FC<RatingReactionsProps> = ({ articleId, initialLikes, onShowToast }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(() => getBookmarks().includes(articleId));
  const [copied, setCopied] = useState(false);

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      setHasLiked(true);
      incrementArticleLikes(articleId);
      trackEvent('article_like', { articleId });
      onShowToast('Obrigado pela sua avaliação!', 'success');
    }
  };

  const handleBookmark = () => {
    const nextState = toggleBookmark(articleId);
    setIsBookmarked(nextState);
    if (nextState) {
      trackEvent('article_bookmark', { articleId });
      onShowToast('Artigo salvo nos seus Favoritos!', 'success');
    } else {
      onShowToast('Artigo removido dos seus Favoritos.', 'info');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      trackEvent('article_share', { articleId });
      onShowToast('Link do artigo copiado para a área de transferência!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl my-8">
      <div className="flex items-center gap-3">
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs ${
            hasLiked
              ? 'bg-[#22A06B] text-white'
              : 'bg-white text-[#10233F] border border-[#E2E8F0] hover:border-[#145EDB] hover:text-[#145EDB]'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{hasLiked ? 'Útil para você' : 'Conteúdo Útil'}</span>
          <span className="bg-gray-100 text-[#0B2343] px-2 py-0.5 rounded-full text-xs font-bold ml-1">
            {likes}
          </span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs ${
            isBookmarked
              ? 'bg-[#145EDB] text-white'
              : 'bg-white text-[#10233F] border border-[#E2E8F0] hover:border-[#145EDB]'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{isBookmarked ? 'Salvo' : 'Salvar'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF8500] hover:bg-[#e07500] text-white transition-all shadow-md"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
        </button>
      </div>
    </div>
  );
};
