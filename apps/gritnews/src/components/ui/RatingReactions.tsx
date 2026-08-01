import React, { useState } from 'react';
import { ThumbsUp, Sparkles, Bookmark, Share2, Check, MessageCircle, Linkedin, Twitter, Facebook, Video, Copy } from 'lucide-react';
import { incrementArticleLikes, incrementArticleShares, toggleBookmark, getBookmarks } from '../../lib/storage';
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
  const [copiedTikTok, setCopiedTikTok] = useState(false);

  const currentUrl = window.location.href;
  const pageTitle = document.title || 'GRIT NEWS - Notícia de Impacto';

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

  const handleShareCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      incrementArticleShares(articleId);
      trackEvent('article_share', { articleId, metadata: { channel: 'copy_link' } });
      onShowToast('Link do artigo copiado para a área de transferência!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`📰 *${pageTitle}*\nConfira esta análise no GRIT NEWS:\n${currentUrl}`);
    incrementArticleShares(articleId);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    trackEvent('article_share', { articleId, metadata: { channel: 'whatsapp' } });
  };

  const shareLinkedIn = () => {
    incrementArticleShares(articleId);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank');
    trackEvent('article_share', { articleId, metadata: { channel: 'linkedin' } });
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Confira no GRIT NEWS: ${pageTitle}`);
    incrementArticleShares(articleId);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`, '_blank');
    trackEvent('article_share', { articleId, metadata: { channel: 'twitter' } });
  };

  const shareFacebook = () => {
    incrementArticleShares(articleId);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
    trackEvent('article_share', { articleId, metadata: { channel: 'facebook' } });
  };

  const copyTikTokCaption = () => {
    const tiktokCaption = `“${pageTitle}” 🚀 Leia a matéria completa no link do perfil da GRIT NEWS! #GritNews #NoticiasB2B #Negocios2026 #InteligenciaDeMercado #Viral ${currentUrl}`;
    navigator.clipboard.writeText(tiktokCaption);
    setCopiedTikTok(true);
    incrementArticleShares(articleId);
    trackEvent('article_share', { articleId, metadata: { channel: 'tiktok_caption' } });
    onShowToast('Legenda e link para TikTok/Reels copiados!', 'success');
    setTimeout(() => setCopiedTikTok(false), 3000);
  };

  return (
    <div className="space-y-4 my-8">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer ${
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
            onClick={handleShareCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF8500] hover:bg-[#e07500] text-white transition-all shadow-md cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copiado!' : 'Compartilhar Link'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Channel Viral Distribution Bar (WhatsApp, TikTok, Meta, LinkedIn) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span className="font-extrabold text-amber-300 flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Impulsione e Engaje nas Redes Sociais:</span>
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={shareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Compartilhar no WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={copyTikTokCaption}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Copiar Legenda para TikTok e Instagram Reels"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{copiedTikTok ? 'Legenda Copiada!' : 'TikTok/Reels'}</span>
          </button>

          <button
            onClick={shareLinkedIn}
            className="bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Compartilhar no LinkedIn"
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </button>

          <button
            onClick={shareFacebook}
            className="bg-[#1877F2] hover:bg-[#125ec2] text-white font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Compartilhar no Facebook/Meta"
          >
            <Facebook className="w-3.5 h-3.5" />
            <span>Meta</span>
          </button>

          <button
            onClick={shareTwitter}
            className="bg-black hover:bg-slate-800 text-white border border-white/20 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Compartilhar no X (Twitter)"
          >
            <Twitter className="w-3.5 h-3.5" />
            <span>X</span>
          </button>
        </div>
      </div>
    </div>
  );
};

