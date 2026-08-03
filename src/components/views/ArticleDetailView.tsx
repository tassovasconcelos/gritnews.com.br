import React, { useState, useEffect } from 'react';
import { Clock, Eye, Calendar, User, ArrowLeft, Volume2, VolumeX, Sparkles, MessageSquare, ShieldCheck, Tag, ExternalLink, Send, Printer, Download, FileText, BookOpen } from 'lucide-react';
import { Article, AuthorProfile, Category, Comment, Offer } from '../../types';
import { Badge } from '../ui/Badge';
import { ReadingProgressBar } from '../ui/ReadingProgressBar';
import { TableOfContents } from '../ui/TableOfContents';
import { RatingReactions } from '../ui/RatingReactions';
import { ArticleShareActions } from '../ui/ArticleShareActions';
import { AdBanner } from '../ui/AdBanner';
import { OfferCard } from '../ui/OfferCard';
import { PdfReportageModal } from '../ui/PdfReportageModal';
import { incrementArticleViews, getComments, addComment, getOffers, getArticles } from '../../lib/storage';
import { trackEvent } from '../../lib/analytics';
import { updatePageSEO, injectArticleSchema } from '../../lib/seo';

function formatEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('watch?v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtube.com/shorts/')) {
    const videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
}

function renderFormattedText(
  text: string,
  onSelectArticleBySlug?: (slug: string) => void
) {
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <br key={lineIdx} />;

        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
        const cleanLine = isBullet ? line.trim().substring(1).trim() : line;

        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const elements: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(cleanLine)) !== null) {
          const [fullMatch, label, url] = match;
          const matchIndex = match.index;

          if (matchIndex > lastIndex) {
            elements.push(cleanLine.substring(lastIndex, matchIndex));
          }

          const isInternal = url.startsWith('/?') || url.startsWith('/') || url.includes('gritnews.com.br/?artigo=');

          elements.push(
            <a
              key={matchIndex}
              href={url}
              target={isInternal ? '_self' : '_blank'}
              rel={isInternal ? undefined : 'noopener noreferrer'}
              className="text-[#145EDB] hover:text-[#0B2343] underline font-bold transition-colors cursor-pointer"
              onClick={(e) => {
                if (isInternal && onSelectArticleBySlug) {
                  e.preventDefault();
                  const targetSlug = url.includes('artigo=')
                    ? url.split('artigo=')[1]?.split('&')[0]
                    : url.split('/').pop();
                  if (targetSlug) onSelectArticleBySlug(targetSlug);
                }
              }}
            >
              {label}
            </a>
          );

          lastIndex = matchIndex + fullMatch.length;
        }

        if (lastIndex < cleanLine.length) {
          elements.push(cleanLine.substring(lastIndex));
        }

        const formattedLine = elements.map((elem, elemIdx) => {
          if (typeof elem !== 'string') return elem;

          const parts = elem.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
          return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-extrabold text-[#0B2343]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx} className="italic text-[#0B2343]">{part.slice(1, -1)}</em>;
            }
            return part;
          });
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 my-1 pl-2">
              <span className="text-[#145EDB] font-bold">•</span>
              <span>{formattedLine}</span>
            </div>
          );
        }

        return (
          <React.Fragment key={lineIdx}>
            {formattedLine}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
}

interface ArticleDetailViewProps {
  article: Article;
  author?: AuthorProfile;
  category?: Category;
  relatedArticles: Article[];
  onSelectArticle: (article: Article) => void;
  onSelectAuthor: (author: AuthorProfile) => void;
  onBackToHome: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  onSelectTag?: (tag: string) => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  author,
  category,
  relatedArticles,
  onSelectArticle,
  onSelectAuthor,
  onBackToHome,
  onOpenLeadModal,
  onShowToast,
  onSelectTag
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  const allOffers = getOffers();

  useEffect(() => {
    incrementArticleViews(article.id);
    trackEvent('article_view', { articleId: article.id, categorySlug: category?.slug });
    setComments(getComments(article.id));

    // Dynamic SEO Metadata Injection for Google Search Crawlers
    updatePageSEO({
      title: article.seo?.metaTitle || article.title,
      description: article.seo?.metaDescription || article.summary || article.subtitle,
      keywords: article.tags || ['GRIT NEWS', category?.name || 'Notícias'],
      canonicalUrl: `https://www.gritnews.com.br/?artigo=${article.slug || article.id}`,
      imageUrl: article.featuredImage,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authorName: author?.name || 'Redação Grit News',
      categoryName: category?.name || 'Geral'
    });

    // Inject Schema.org NewsArticle JSON-LD
    injectArticleSchema(article, category, author);
  }, [article.id]);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      onShowToast('Sintetizador de áudio não suportado no navegador.', 'info');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = `${article.title}. ${article.subtitle}. ${article.blocks.map(b => b.content).join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead.replace(/[*#]/g, ''));
      utterance.lang = 'pt-BR';
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      trackEvent('article_audio_play', { articleId: article.id });
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentEmail || !commentText) return;

    addComment({
      articleId: article.id,
      authorName: commentName,
      authorEmail: commentEmail,
      content: commentText
    });

    setCommentSubmitted(true);
    setCommentText('');
    setComments(getComments(article.id));
    onShowToast('Comentário enviado com sucesso e encaminhado para moderação editorial!', 'success');
  };

  const fontSizeClasses = {
    normal: 'text-base leading-relaxed',
    large: 'text-lg leading-relaxed',
    xlarge: 'text-xl leading-relaxed'
  };

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="pb-16 bg-white min-h-screen">
      <ReadingProgressBar />

      <article className="max-w-4xl mx-auto px-4 pt-6">
        {/* Navigation back */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145EDB] hover:text-[#0B2343] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Feed do GRIT NEWS</span>
        </button>

        {/* Article Meta Header */}
        <header className="mb-8 space-y-4 border-b border-[#E2E8F0] pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <Badge variant="primary" size="lg" style={{ borderColor: category.color }}>
                {category.name}
              </Badge>
            )}
            {article.isSponsored && <Badge variant="orange" size="lg">CONTEÚDO PATROCINADO</Badge>}
            {article.isEvergreen && <Badge variant="navy" size="lg">CONTEÚDO EVERGREEN</Badge>}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#10233F] leading-tight tracking-tight">
            {article.title}
          </h1>

          <p className="text-lg md:text-xl text-[#5C6B7A] font-medium leading-relaxed">
            {article.subtitle}
          </p>

          {/* Author & Audio Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0] bg-[#F7F9FC] p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              {author && (
                <img
                  src={author.avatar}
                  alt={author.name}
                  onClick={() => onSelectAuthor(author)}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#145EDB] cursor-pointer hover:scale-105 transition-transform"
                />
              )}
              <div>
                <span
                  onClick={() => author && onSelectAuthor(author)}
                  className="font-bold text-[#0B2343] hover:text-[#145EDB] cursor-pointer text-sm block"
                >
                  {author ? author.name : 'Redação GRIT NEWS'}
                </span>
                <div className="flex items-center gap-2 text-xs text-[#5C6B7A]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#145EDB]" />
                    {article.readingTimeMinutes} min de leitura
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Reader Options */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={toggleSpeech}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  isSpeaking
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white text-[#0B2343] border border-[#E2E8F0] hover:border-[#145EDB]'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#145EDB]" />}
                <span>{isSpeaking ? 'Parar Áudio' : 'Ouvir Artigo'}</span>
              </button>

              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 transition-all shadow-sm cursor-pointer"
                title="Abrir Revista & Baixar PDF (16 Páginas)"
              >
                <FileText className="w-3.5 h-3.5 text-slate-950" />
                <span>Edição PDF (16 pág)</span>
              </button>

              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl p-1 text-xs font-bold text-[#0B2343]">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-0.5 rounded-md ${fontSize === 'normal' ? 'bg-[#145EDB] text-white' : 'hover:bg-gray-100'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-0.5 rounded-md ${fontSize === 'large' ? 'bg-[#145EDB] text-white' : 'hover:bg-gray-100'}`}
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          {/* Share & Interactions Bar Top */}
          <ArticleShareActions article={article} onShowToast={onShowToast} variant="bar" className="mt-4" />

          {/* Special PDF Edition Download Callout Box */}
          <div className="mt-4 p-4 bg-gradient-to-r from-[#0B2343] to-[#102D54] rounded-2xl border border-amber-500/30 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                  <span>Edição Especial em PDF — Revista Digital (16 Páginas)</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Baixe a diagramação fiel da reportagem “A Vida da Vida” com todas as fotos, capítulos e ficha técnica.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="flex-1 sm:flex-none bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Leitor Digital</span>
              </button>
              <a
                href="/artigo-vida-especial.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-600 transition-all"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Baixar PDF</span>
              </a>
            </div>
          </div>
        </header>

        {/* Hero Featured Image */}
        <div className="mb-8">
          <img
            src={article.featuredImage}
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200';
            }}
            className="w-full h-80 sm:h-96 md:h-[450px] object-cover rounded-3xl shadow-md border border-[#E2E8F0]"
          />
          {article.imageCaption && (
            <p className="text-xs text-[#5C6B7A] mt-2 italic text-center">
              {article.imageCaption}
            </p>
          )}
        </div>

        {/* Automatic Table of Contents */}
        <TableOfContents blocks={article.blocks} />

        {/* Main Article Body Blocks */}
        <div className={`space-y-6 text-[#10233F] ${fontSizeClasses[fontSize]}`}>
          {article.blocks.map(block => {
            if (block.type === 'paragraph') {
              return (
                <p key={block.id} className="leading-relaxed">
                  {renderFormattedText(block.content, (slug) => {
                    const found = relatedArticles.find(a => a.slug === slug || a.id === slug) || getArticles().find(a => a.slug === slug || a.id === slug);
                    if (found) onSelectArticle(found);
                  })}
                </p>
              );
            }
            if (block.type === 'heading2') {
              const headingId = `heading-${block.id}`;
              return (
                <h2
                  id={headingId}
                  key={block.id}
                  className="text-2xl sm:text-3xl font-extrabold text-[#0B2343] mt-8 mb-4 border-l-4 border-l-[#145EDB] pl-4 scroll-mt-24"
                >
                  {block.content.replace(/\*\*/g, '')}
                </h2>
              );
            }
            if (block.type === 'heading3') {
              const headingId = `heading-${block.id}`;
              return (
                <h3
                  id={headingId}
                  key={block.id}
                  className="text-xl sm:text-2xl font-bold text-[#0B2343] mt-6 mb-3 scroll-mt-24"
                >
                  {block.content.replace(/\*\*/g, '')}
                </h3>
              );
            }
            if (block.type === 'callout') {
              return (
                <div key={block.id} className="bg-[#EAF3FF] border-l-4 border-l-[#145EDB] p-5 rounded-r-2xl my-6 text-sm md:text-base font-medium text-[#0B2343] shadow-xs">
                  {renderFormattedText(block.content, (slug) => {
                    const found = relatedArticles.find(a => a.slug === slug || a.id === slug) || getArticles().find(a => a.slug === slug || a.id === slug);
                    if (found) onSelectArticle(found);
                  })}
                </div>
              );
            }
            if (block.type === 'quote') {
              return (
                <blockquote key={block.id} className="border-l-4 border-l-[#FF8500] pl-6 my-8 italic text-lg text-[#0B2343] font-semibold bg-amber-50/50 p-4 rounded-r-2xl">
                  {renderFormattedText(block.content, (slug) => {
                    const found = relatedArticles.find(a => a.slug === slug || a.id === slug) || getArticles().find(a => a.slug === slug || a.id === slug);
                    if (found) onSelectArticle(found);
                  })}
                </blockquote>
              );
            }
            if (block.type === 'image') {
              return (
                <figure key={block.id} className="my-8 space-y-2.5">
                  <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] shadow-md bg-gray-50 group">
                    <img
                      src={block.content}
                      alt={block.caption || 'Imagem do artigo'}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[550px] object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="text-xs md:text-sm text-[#5C6B7A] italic text-center px-4 font-medium flex items-center justify-center gap-1.5">
                      <span>📸</span>
                      <span>{block.caption}</span>
                    </figcaption>
                  )}
                </figure>
              );
            }
            if (block.type === 'video') {
              return (
                <figure key={block.id} className="my-8 space-y-2.5">
                  <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] shadow-xl bg-slate-950 relative group p-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-t-2xl text-xs font-bold border-b border-slate-800">
                      <span className="flex items-center gap-2 text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        🎥 Registro e Documentário em Vídeo Real
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">TenPets & GRIT NEWS Documentaries</span>
                    </div>
                    {block.content.includes('youtube') || block.content.includes('vimeo') || block.content.includes('embed') || block.content.includes('youtu.be') ? (
                      <div className="aspect-video w-full rounded-b-2xl overflow-hidden">
                        <iframe
                          src={formatEmbedUrl(block.content)}
                          title={block.caption || 'Vídeo do artigo'}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        src={block.content}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-auto max-h-[500px] mx-auto rounded-b-2xl object-contain bg-black"
                      />
                    )}
                  </div>
                  {block.caption && (
                    <figcaption className="text-xs md:text-sm text-[#5C6B7A] italic text-center px-4 font-medium flex items-center justify-center gap-1.5">
                      <span>📹</span>
                      <span>{block.caption}</span>
                    </figcaption>
                  )}
                </figure>
              );
            }
            if (block.type === 'product_card') {
              const offerObj = allOffers.find(o => o.slug === block.content || o.id === block.content) || allOffers[0];
              if (offerObj) {
                return (
                  <div key={block.id} className="my-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FF8500] block mb-2">
                      💡 Solução de Mercado Recomendada
                    </span>
                    <OfferCard offer={offerObj} onOpenLeadModal={onOpenLeadModal} onShowToast={onShowToast} />
                  </div>
                );
              }
            }
            if (block.type === 'ad_slot') {
              return <AdBanner key={block.id} location="IN_ARTICLE" categoryId={category?.id} className="my-8" />;
            }
            return null;
          })}
        </div>

        {/* Rating and Share Reactions */}
        <RatingReactions
          articleId={article.id}
          initialLikes={article.likesCount}
          onShowToast={onShowToast}
        />

        {/* Article Tags Cloud & SEO Taxonomy */}
        {article.tags && article.tags.length > 0 && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-2xl my-8 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#10233F]">
              <Tag className="w-4 h-4 text-[#145EDB]" />
              <span>Tags & Palavras-Chave de Indexação:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((t, i) => (
                <button
                  key={i}
                  onClick={() => onSelectTag && onSelectTag(t)}
                  className="bg-white hover:bg-[#145EDB] hover:text-white text-[#10233F] border border-[#E2E8F0] text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xl shadow-black/5"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Share & Reactions Bar */}
        <div className="my-8 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-[#0B2343] mb-2">Gostou da reportagem? Compartilhe e avalie:</h4>
            <ArticleShareActions article={article} onShowToast={onShowToast} variant="bar" />
          </div>
          <RatingReactions articleId={article.id} initialLikes={article.likesCount || 0} onShowToast={onShowToast} />
        </div>

        {/* Author Bio Card */}
        {author && (
          <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-3xl p-6 md:p-8 my-10 flex flex-col md:flex-row items-center gap-6">
            <img
              src={author.avatar}
              alt=""
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
              }}
              className="w-20 h-20 rounded-full object-cover border-4 border-[#145EDB] shadow-md shrink-0"
            />
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0B2343]">{author.name}</h3>
                  <p className="text-xs font-semibold text-[#145EDB]">{author.roleTitle}</p>
                </div>
                <button
                  onClick={() => onSelectAuthor(author)}
                  className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all self-center md:self-auto"
                >
                  Ver todos os artigos do autor
                </button>
              </div>
              <p className="text-sm text-[#5C6B7A] leading-relaxed">{author.bio}</p>
              <div className="flex flex-wrap gap-1.5 pt-2 justify-center md:justify-start">
                {author.specialties.map(s => (
                  <span key={s} className="bg-white text-[#10233F] border border-[#E2E8F0] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Moderated Comments Section */}
        <section className="my-12 pt-8 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-6 h-6 text-[#145EDB]" />
            <h3 className="text-2xl font-bold text-[#0B2343]">Comentários ({comments.length})</h3>
          </div>

          <form onSubmit={handleCommentSubmit} className="bg-[#F7F9FC] border border-[#E2E8F0] p-6 rounded-2xl mb-8 space-y-4">
            <h4 className="text-sm font-bold text-[#0B2343]">Deixe sua opinião sobre este assunto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Seu nome completo"
                value={commentName}
                onChange={e => setCommentName(e.target.value)}
                className="px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
              />
              <input
                type="email"
                required
                placeholder="Seu e-mail corporativo"
                value={commentEmail}
                onChange={e => setCommentEmail(e.target.value)}
                className="px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
              />
            </div>
            <textarea
              required
              rows={3}
              placeholder="Escreva seu comentário respeitando a política de privacidade..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
            />
            <button
              type="submit"
              className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Comentário para Moderação</span>
            </button>
          </form>

          {/* Approved Comments List */}
          <div className="space-y-4">
            {comments.map(c => (
              <div key={c.id} className="p-4 bg-white border border-[#E2E8F0] rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-[#0B2343]">{c.authorName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-[#5C6B7A]">{c.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="my-12 pt-8 border-t border-[#E2E8F0]">
            <h3 className="text-2xl font-bold text-[#0B2343] mb-6">Matérias Relacionadas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel)}
                  className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <img
                    src={rel.featuredImage}
                    alt={rel.title}
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* PDF Reader Modal */}
        <PdfReportageModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          onShowToast={onShowToast}
        />
      </article>
    </div>
  );
};
