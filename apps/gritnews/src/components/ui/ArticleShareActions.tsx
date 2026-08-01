import React, { useState, useEffect } from 'react';
import { Share2, Heart, Bookmark, Copy, Check, MessageCircle, Linkedin, Twitter, Printer, FileText } from 'lucide-react';
import { Article } from '../../types';
import { toggleBookmark, isBookmarked, incrementArticleLikes, incrementArticleShares } from '../../lib/storage';

interface ArticleShareActionsProps {
  article: Article;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  variant?: 'card' | 'bar' | 'compact';
  className?: string;
}

export const ArticleShareActions: React.FC<ArticleShareActionsProps> = ({
  article,
  onShowToast,
  variant = 'card',
  className = ''
}) => {
  const [likes, setLikes] = useState(article.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const articleUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?artigo=${article.slug || article.id}`
    : `https://www.gritnews.com.br/?artigo=${article.slug || article.id}`;

  const shareText = `*${article.title}*\n\nLeia a reportagem completa no GRIT NEWS: ${articleUrl}`;

  useEffect(() => {
    setSaved(isBookmarked(article.id));
    // Check if user already liked this article in session
    const likedArticles = JSON.parse(sessionStorage.getItem('grit_liked_articles') || '[]');
    if (likedArticles.includes(article.id)) {
      setHasLiked(true);
    }
  }, [article.id]);

  const handleDownloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowToast('Aguarde... preparando a reportagem em versão PDF / Impressão.', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) {
      onShowToast('Você já curtiu esta notícia!', 'info');
      return;
    }

    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);
    incrementArticleLikes(article.id);

    const likedArticles = JSON.parse(sessionStorage.getItem('grit_liked_articles') || '[]');
    likedArticles.push(article.id);
    sessionStorage.setItem('grit_liked_articles', JSON.stringify(likedArticles));

    onShowToast('Obrigado pelo apoio! Notícia curtida.', 'success');
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowSaved = toggleBookmark(article.id);
    setSaved(isNowSaved);
    if (isNowSaved) {
      onShowToast('Notícia salva nos seus Marcadores!', 'success');
    } else {
      onShowToast('Notícia removida dos Marcadores.', 'info');
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    incrementArticleShares(article.id);
    onShowToast('Link da notícia copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementArticleShares(article.id);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementArticleShares(article.id);
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementArticleShares(article.id);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 text-slate-500 ${className}`} onClick={e => e.stopPropagation()}>
        <button
          onClick={handleLike}
          title="Curtir Notícia"
          className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold ${
            hasLiked ? 'text-rose-600 bg-rose-50' : 'hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
          <span>{likes}</span>
        </button>

        <button
          onClick={shareWhatsApp}
          title="Compartilhar no WhatsApp"
          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleCopyLink}
          title="Copiar Link"
          className="p-1.5 rounded-lg hover:bg-blue-50 text-[#145EDB] transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleBookmark}
          title="Salvar Notícia"
          className={`p-1.5 rounded-lg transition-all ${
            saved ? 'text-amber-600 bg-amber-50' : 'hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-amber-600 text-amber-600' : ''}`} />
        </button>
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] ${className}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
              hasLiked
                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-white' : ''}`} />
            <span>{likes} Curtidas</span>
          </button>

          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
              saved
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-600'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-slate-950' : ''}`} />
            <span>{saved ? 'Salvo' : 'Salvar'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Compartilhar:</span>
          
          <button
            onClick={shareWhatsApp}
            title="Compartilhar no WhatsApp"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={shareLinkedIn}
            title="Compartilhar no LinkedIn"
            className="p-2 bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-xl transition-all shadow-xs"
          >
            <Linkedin className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={shareTwitter}
            title="Compartilhar no X (Twitter)"
            className="p-2 bg-slate-900 hover:bg-black text-white rounded-xl transition-all shadow-xs"
          >
            <Twitter className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLink}
            title="Copiar Link"
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            title="Baixar ou Imprimir Reportagem em PDF"
            className="flex items-center gap-1.5 bg-[#0B2343] hover:bg-[#145EDB] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`flex items-center justify-between pt-3 border-t border-[#E2E8F0] ${className}`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            hasLiked ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
          <span>{likes}</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
            saved ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title={saved ? 'Remover dos Marcadores' : 'Salvar Notícia'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-amber-600 text-amber-600' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={shareWhatsApp}
          title="Compartilhar no WhatsApp"
          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={shareLinkedIn}
          title="Compartilhar no LinkedIn"
          className="p-1.5 rounded-lg text-[#0A66C2] hover:bg-blue-50 transition-all"
        >
          <Linkedin className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleCopyLink}
          title="Copiar Link da Notícia"
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
