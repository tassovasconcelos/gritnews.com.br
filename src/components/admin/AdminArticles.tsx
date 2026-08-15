import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, CheckCircle2, AlertCircle, Sparkles, Clock, Calendar, 
  Save, History, Image as ImageIcon, Video as VideoIcon, Film, Upload, FileImage, 
  ArrowUp, ArrowDown, HelpCircle, Info, Layers, UserPlus, Share2, Copy, Search, 
  Filter, ExternalLink, Check, RefreshCw, MessageCircle, Linkedin, Twitter, FileText, FileCheck
} from 'lucide-react';
import { Article, ArticleStatus, Category, AuthorProfile, BlockType, ArticleBlock, MediaAsset } from '../../types';
import { saveArticle, deleteArticle, getMediaAssets, addMediaAsset, saveAuthor, compressImageFile } from '../../lib/storage';
import { extractPdfContent } from '../../lib/pdfExtractor';
import { Modal } from '../ui/Modal';

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

interface AdminArticlesProps {
  articles: Article[];
  categories: Category[];
  authors: AuthorProfile[];
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminArticles: React.FC<AdminArticlesProps> = ({
  articles,
  categories,
  authors,
  onRefresh,
  onShowToast
}) => {
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'social'>('editor');

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [authorId, setAuthorId] = useState(authors[0]?.id || '');
  const [featuredImage, setFeaturedImage] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('PUBLISHED');
  const [tagsInput, setTagsInput] = useState('');
  const [isSponsored, setIsSponsored] = useState(false);
  const [isEvergreen, setIsEvergreen] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<ArticleBlock[]>([
    { id: 'b-1', type: 'paragraph', content: 'Escreva a introdução da matéria...' }
  ]);

  // Media Picker Modal State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'featured' | string | null>(null);
  const [mediaPickerCategory, setMediaPickerCategory] = useState<string>('ALL');
  const [mediaPickerSearch, setMediaPickerSearch] = useState<string>('');

  // New Author Modal State
  const [isNewAuthorOpen, setIsNewAuthorOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorRole, setNewAuthorRole] = useState('Redator Sênior');
  const [newAuthorAvatar, setNewAuthorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [newAuthorBio, setNewAuthorBio] = useState('Jornalista especializado na cobertura de mercado, tecnologia e grandes reportagens.');
  const [newAuthorEmail, setNewAuthorEmail] = useState('');

  // Social Share copied state
  const [copiedShareChannel, setCopiedShareChannel] = useState<string | null>(null);

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
  };

  const handleOpenNew = () => {
    setEditingArticle(null);
    setTitle('');
    setSubtitle('');
    setSummary('');
    setPdfUrl('');
    setPdfFileName('');
    setExtractedImages([]);
    setCategoryId(categories[0]?.id || '');
    setAuthorId(authors[0]?.id || '');
    setFeaturedImage('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200');
    setStatus('PUBLISHED');
    setTagsInput('Inovação, Mercado, GritNews');
    setIsSponsored(false);
    setIsEvergreen(false);
    setIsUrgent(false);
    setBlocks([{ id: 'b-1', type: 'paragraph', content: 'Introdução da matéria...' }]);
    setActiveTab('editor');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setTitle(art.title);
    setSubtitle(art.subtitle);
    setSummary(art.summary);
    setPdfUrl(art.pdfUrl || '');
    setPdfFileName(art.pdfUrl ? 'documento-anexo.pdf' : '');
    setExtractedImages([]);
    setCategoryId(art.categoryId);
    setAuthorId(art.authorId);
    setFeaturedImage(art.featuredImage);
    setStatus(art.status);
    setTagsInput(art.tags.join(', '));
    setIsSponsored(art.isSponsored || false);
    setIsEvergreen(art.isEvergreen || false);
    setIsUrgent(art.isUrgent || false);
    setBlocks(art.blocks && art.blocks.length > 0 ? art.blocks : [{ id: 'b-1', type: 'paragraph', content: art.summary }]);
    setActiveTab('editor');
    setIsModalOpen(true);
  };

  const handleUploadPdfAndGenerateArticle = async (file: File) => {
    if (!file) return;
    setIsProcessingPdf(true);
    onShowToast(`Anexando, extraindo imagens e processando o PDF "${file.name}"...`, 'info');

    try {
      const extracted = await extractPdfContent(file);

      // Store PDF url reference and file name
      setPdfUrl(extracted.pdfDataUrl);
      setPdfFileName(file.name);
      setExtractedImages(extracted.pageImages || []);

      // Add extracted page images to Acervo / Media Assets
      if (extracted.pageImages && extracted.pageImages.length > 0) {
        extracted.pageImages.forEach((imgUrl, idx) => {
          addMediaAsset({
            title: `PDF ${file.name} - Imagem/Página ${idx + 1}`,
            url: imgUrl,
            altText: `Página ${idx + 1} extraída do documento PDF ${file.name}`,
            category: 'pdf',
            source: 'upload',
            tags: ['pdf', 'extraido', 'documento', file.name]
          });
        });

        // Set featured image to the 1st extracted PDF image if available!
        if (extracted.pageImages[0]) {
          setFeaturedImage(extracted.pageImages[0]);
        }
      }

      // Populate article fields
      setTitle(extracted.title);
      setSubtitle(extracted.subtitle);
      setSummary(extracted.summary);
      setBlocks(extracted.blocks);

      // Open editor modal if not already opened
      setActiveTab('editor');
      setIsModalOpen(true);

      setIsProcessingPdf(false);
      onShowToast(`PDF "${file.name}" processado com sucesso! ${extracted.pageImages.length} imagem(ns) extraída(s).`, 'success');
    } catch (err) {
      console.error('Erro ao ler arquivo PDF:', err);
      setIsProcessingPdf(false);
      onShowToast('Ocorreu um erro ao processar o arquivo PDF. Tente um arquivo menor ou em formato PDF padrão.', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta matéria?')) {
      deleteArticle(id);
      onRefresh();
      onShowToast('Matéria excluída.');
    }
  };

  const handleAddBlock = (type: BlockType, contentOverride?: string, captionOverride?: string) => {
    const newBlock: ArticleBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      content: contentOverride || (
        type === 'callout' ? '💡 Destaque especial de mercado...' :
        type === 'quote' ? '“Citação importante...”' :
        type === 'image' ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200' :
        type === 'video' ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' :
        'Novo parágrafo...'
      ),
      caption: captionOverride || (type === 'image' ? '📷 Legenda da foto...' : type === 'video' ? '🎥 Legenda do vídeo...' : undefined)
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleUpdateBlock = (id: string, newContent: string) => {
    setBlocks(blocks.map(b => (b.id === id ? { ...b, content: newContent } : b)));
  };

  const handleUpdateBlockCaption = (id: string, newCaption: string) => {
    setBlocks(blocks.map(b => (b.id === id ? { ...b, caption: newCaption } : b)));
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  // Open Media Picker for a block or cover image
  const handleOpenMediaPicker = (target: 'featured' | string) => {
    setMediaPickerTarget(target);
    setIsMediaPickerOpen(true);
  };

  const handleSelectMediaAsset = (asset: MediaAsset) => {
    if (mediaPickerTarget === 'featured') {
      setFeaturedImage(asset.url);
      onShowToast(`Capa atualizada com "${asset.title}"`);
    } else if (mediaPickerTarget) {
      handleUpdateBlock(mediaPickerTarget, asset.url);
      handleUpdateBlockCaption(mediaPickerTarget, `📷 ${asset.title}`);
      onShowToast(`Imagem inserida no bloco com sucesso!`);
    }
    setIsMediaPickerOpen(false);
  };

  // Create new author profile
  const handleSaveNewAuthor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthorName) return;

    const newAuthor: AuthorProfile = {
      id: `author-${Date.now()}`,
      name: newAuthorName,
      roleTitle: newAuthorRole,
      avatar: newAuthorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      bio: newAuthorBio,
      specialties: ['Jornalismo', 'Negócios'],
      email: newAuthorEmail || `${newAuthorName.toLowerCase().replace(/\s+/g, '.')}@gritnews.com.br`,
      followersCount: 120,
      articlesCount: 1
    };

    saveAuthor(newAuthor);
    onRefresh();
    setAuthorId(newAuthor.id);
    setIsNewAuthorOpen(false);
    onShowToast(`Novo editor "${newAuthorName}" cadastrado com sucesso!`);
    
    // Reset author form
    setNewAuthorName('');
    setNewAuthorRole('Redator Sênior');
    setNewAuthorBio('');
    setNewAuthorEmail('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const tagsArr = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const articleToSave: Article = {
      id: editingArticle ? editingArticle.id : `art-${Date.now()}`,
      title,
      slug,
      subtitle,
      summary,
      categoryId,
      tags: tagsArr,
      authorId,
      status,
      featuredImage,
      publishedAt: editingArticle ? editingArticle.publishedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readingTimeMinutes: Math.max(3, Math.ceil(blocks.length * 1.5)),
      viewsCount: editingArticle ? editingArticle.viewsCount : 0,
      likesCount: editingArticle ? editingArticle.likesCount : 0,
      sharesCount: editingArticle ? editingArticle.sharesCount : 0,
      isSponsored,
      isEvergreen,
      isUrgent,
      pdfUrl: pdfUrl || undefined,
      blocks,
      seo: {
        metaTitle: `${title} | GRIT NEWS`,
        metaDescription: summary || subtitle,
        keywords: tagsArr,
        canonicalUrl: `https://www.gritnews.com.br/?artigo=${slug}`
      }
    };

    saveArticle(articleToSave);
    setIsModalOpen(false);
    onRefresh();
    onShowToast(`Matéria "${title}" salva com sucesso no ecossistema GRIT NEWS!`);
  };

  // Calculate article canonical URL
  const currentSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'nova-materia';

  const canonicalUrl = `https://www.gritnews.com.br/?artigo=${currentSlug}`;

  // Copy share snippet to clipboard
  const handleCopyShareText = (text: string, channel: string) => {
    navigator.clipboard.writeText(text);
    setCopiedShareChannel(channel);
    onShowToast(`Post formatado para ${channel} copiado!`);
    setTimeout(() => setCopiedShareChannel(null), 2500);
  };

  // SEO Score calculation
  const titleLengthOk = title.length >= 30 && title.length <= 70;
  const summaryOk = summary.length >= 50 && summary.length <= 160;
  const hasImage = Boolean(featuredImage);
  const blocksCountOk = blocks.length >= 3;
  const seoScore = [titleLengthOk, summaryOk, hasImage, blocksCountOk].filter(Boolean).length * 25;

  const allMediaAssets = getMediaAssets();
  const filteredMediaAssets = allMediaAssets.filter(m => {
    const matchesCat = mediaPickerCategory === 'ALL' || m.category === mediaPickerCategory;
    const matchesSearch = m.title.toLowerCase().includes(mediaPickerSearch.toLowerCase()) ||
                          m.tags.some(t => t.toLowerCase().includes(mediaPickerSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B2343]">CMS Editorial - Gerenciador de Artigos</h1>
          <p className="text-sm text-[#5C6B7A]">Crie, diagrame por blocos, ilustre e publique matérias em gritnews.com.br</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-slate-950" />
            <span>{isProcessingPdf ? 'Processando PDF...' : '📄 Anexar PDF & Gerar Matéria'}</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              disabled={isProcessingPdf}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadPdfAndGenerateArticle(file);
                }
              }}
            />
          </label>

          <button
            onClick={handleOpenNew}
            className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Matéria</span>
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#0B2343] font-extrabold uppercase">
              <tr>
                <th className="p-4">Título & Capa</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Autor / Editor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Curtidas Real</th>
                <th className="p-4">Acessos</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#10233F]">
              {articles.map(art => {
                const catName = categories.find(c => c.id === art.categoryId)?.name || 'Geral';
                const author = authors.find(a => a.id === art.authorId);
                const artUrl = `https://www.gritnews.com.br/?artigo=${art.slug || art.id}`;

                return (
                  <tr key={art.id} className="hover:bg-[#F7F9FC] transition-colors">
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={art.featuredImage} 
                          alt={art.title} 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=200'; }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#0B2343] truncate" title={art.title}>{art.title}</p>
                          <p className="text-[11px] text-[#5C6B7A] truncate">{art.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-[#145EDB]">{catName}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {author?.avatar && (
                          <img src={author.avatar} alt={author.name} className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span className="font-medium text-slate-700">{author?.name || 'Redação GRIT'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        art.status === 'PUBLISHED' ? 'bg-[#22A06B]/10 text-[#22A06B]' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {art.likesCount} <span className="text-[10px] text-gray-400 font-normal">curtidas</span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{art.viewsCount}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(artUrl);
                            onShowToast('Link da matéria copiado para compartilhamento!');
                          }}
                          className="p-1.5 text-gray-500 hover:text-[#145EDB] hover:bg-[#EAF3FF] rounded-lg"
                          title="Copiar Link gritnews.com.br"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(art)}
                          className="p-1.5 text-[#145EDB] hover:bg-[#EAF3FF] rounded-lg"
                          title="Editar Diagramação"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArticle ? 'Editar Diagramação e Conteúdo da Matéria' : 'Criar Nova Matéria no CMS'}
        maxWidth="5xl"
      >
        <div className="space-y-4">
          {/* Modal Header Tabs */}
          <div className="flex border-b border-[#E2E8F0] gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('editor')}
              className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'editor' ? 'border-[#145EDB] text-[#145EDB]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>📝 Diagramação por Blocos & Texto</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview' ? 'border-[#145EDB] text-[#145EDB]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>👁️ Visualizar Diagramação no Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('social')}
              className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'social' ? 'border-[#145EDB] text-[#145EDB]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>🚀 Engajamento & Redes Sociais</span>
            </button>
          </div>

          {activeTab === 'editor' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  {/* PDF Upload & Auto-Article Generator Box */}
                  <div className="bg-gradient-to-r from-[#0B2343] via-[#0F325E] to-[#145EDB] p-4 rounded-2xl text-white shadow-lg space-y-3 border border-amber-400/30">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
                            <span>Anexar PDF e Gerar Matéria</span>
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full uppercase">
                              Recurso Inteligente
                            </span>
                          </h4>
                          <p className="text-xs text-slate-200">
                            Envie qualquer PDF (reportagem, documento, estudo). O sistema anexa o PDF ao artigo e estrutura a matéria automaticamente!
                          </p>
                        </div>
                      </div>

                      <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer shrink-0 flex items-center justify-center gap-2 shadow-md transition-all">
                        <Upload className="w-4 h-4" />
                        <span>{isProcessingPdf ? 'Processando PDF...' : 'Anexar e Gerar por PDF'}</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          disabled={isProcessingPdf}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadPdfAndGenerateArticle(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {pdfUrl && (
                      <div className="space-y-3">
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden text-slate-200 font-mono">
                            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">PDF Anexado ao Artigo: <strong>{pdfFileName || 'documento.pdf'}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-300 hover:underline text-[11px] font-bold"
                            >
                              Visualizar PDF
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setPdfUrl('');
                                setPdfFileName('');
                                setExtractedImages([]);
                                onShowToast('PDF anexo removido.');
                              }}
                              className="text-red-400 hover:text-red-300 text-[11px] font-bold cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        {extractedImages.length > 0 && (
                          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>{extractedImages.length} Imagens Extraídas do PDF:</span>
                              </span>
                              <span className="text-[11px] text-slate-400">Clique para definir como Capa ou Inserir no Texto</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {extractedImages.map((img, idx) => (
                                <div key={idx} className="group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 hover:border-amber-400 transition-all">
                                  <img
                                    src={img}
                                    alt={`Página ${idx + 1}`}
                                    className="w-full h-20 object-cover"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 p-1 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFeaturedImage(img);
                                        onShowToast(`Página ${idx + 1} definida como Capa da Matéria!`);
                                      }}
                                      className="w-full text-[9px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-1 px-1 rounded text-center cursor-pointer"
                                    >
                                      ⭐ Capa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleAddBlock('image', img, `📸 Registro do Documento — Página ${idx + 1}`);
                                        onShowToast(`Imagem da Página ${idx + 1} inserida nos blocos!`);
                                      }}
                                      className="w-full text-[9px] bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold py-1 px-1 rounded text-center cursor-pointer"
                                    >
                                      ➕ Bloco
                                    </button>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 text-[9px] text-slate-300 font-mono text-center py-0.5">
                                    Pág {idx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B2343] mb-1">Título Principal da Matéria *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Título de alto impacto jornalístico..."
                      className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0B2343]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B2343] mb-1">Subtítulo / Linha Fina</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      placeholder="Linha fina complementando o título..."
                      className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs text-[#0B2343]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B2343] mb-1">Resumo do Lead (Para Capa e SEO)</label>
                    <textarea
                      rows={2}
                      value={summary}
                      onChange={e => setSummary(e.target.value)}
                      placeholder="Resumo claro da notícia exibido nos cards da home e no meta description..."
                      className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs text-[#0B2343]"
                    />
                  </div>

                  {/* Visual Diagramming Builder Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                      <div>
                        <h3 className="text-xs font-black text-[#0B2343] uppercase tracking-wide flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#145EDB]" />
                          <span>Diagramação por Blocos do Artigo ({blocks.length} blocos)</span>
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Identifique e altere o conteúdo, fotos e mídias de cada bloco da matéria.
                        </p>
                      </div>

                      {/* Add Block Toolbar */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddBlock('paragraph')}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-lg font-bold cursor-pointer"
                        >
                          + Parágrafo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('heading2')}
                          className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs rounded-lg font-bold cursor-pointer"
                        >
                          + Título H2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('image')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>+ Bloco Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('video')}
                          className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <VideoIcon className="w-3.5 h-3.5" />
                          <span>+ Bloco Vídeo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('callout')}
                          className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs rounded-lg font-bold cursor-pointer"
                        >
                          + Destaque
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('quote')}
                          className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs rounded-lg font-bold cursor-pointer"
                        >
                          + Citação
                        </button>
                      </div>
                    </div>

                    {/* Quick Photo Acervo Bar */}
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#10233F] flex items-center gap-1.5">
                          📸 Fotos Reais do Acervo (Vida & Notícias) para Inserir num Clique:
                        </span>
                        <span className="text-[10px] text-amber-800 font-medium">Clique para adicionar ao artigo ou definir como capa</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { title: '1. Resgate na Praça', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200' },
                          { title: '2. Quarto de Hospital', url: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=1200' },
                          { title: '3. Acupuntura & Lacinhos', url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200' },
                          { title: '4. Fisioterapia Dra. Renata', url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200' },
                          { title: '5. Bandana Floral', url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=1200' },
                          { title: '6. Sorriso Varanda', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200' },
                          { title: '7. Princesa Coroa', url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1200' },
                        ].map((p, idx) => (
                          <div key={idx} className="bg-white text-slate-800 border border-amber-300 rounded-lg p-1 text-[11px] font-bold shadow-2xs flex items-center gap-1.5">
                            <img src={p.url} alt={p.title} className="w-5 h-5 rounded object-cover" />
                            <span className="truncate max-w-[110px]">{p.title}</span>
                            <div className="flex items-center gap-1 pl-1 border-l border-amber-200">
                              <button
                                type="button"
                                onClick={() => handleAddBlock('image', p.url, `📷 ${p.title}`)}
                                className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold cursor-pointer"
                                title="Inserir como bloco de imagem"
                              >
                                + Bloco
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFeaturedImage(p.url);
                                  onShowToast(`Capa definida para "${p.title}"`);
                                }}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold cursor-pointer"
                                title="Definir como imagem de capa"
                              >
                                📌 Capa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rendered Blocks List */}
                    <div className="space-y-3">
                      {blocks.map((block, idx) => (
                        <div key={block.id} className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 shadow-2xs hover:border-[#145EDB]/40 transition-colors">
                          {/* Block Controls Header */}
                          <div className="flex items-center justify-between text-xs font-bold border-b border-[#E2E8F0] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                block.type === 'image' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                block.type === 'video' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                                block.type === 'heading2' ? 'bg-blue-100 text-blue-800' :
                                block.type === 'callout' ? 'bg-sky-100 text-sky-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {block.type === 'image' ? '📷 Bloco de Imagem Diagramada' :
                                 block.type === 'video' ? '🎥 Bloco de Vídeo Embed' :
                                 block.type === 'heading2' ? '📌 Título H2 de Seção' :
                                 block.type === 'callout' ? '💡 Chamada de Destaque' :
                                 block.type === 'quote' ? '💬 Citação em Aspas' : '📝 Parágrafo de Texto'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveBlock(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-gray-500 hover:text-[#145EDB] disabled:opacity-30 cursor-pointer"
                                title="Mover Bloco para Cima"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveBlock(idx, 'down')}
                                disabled={idx === blocks.length - 1}
                                className="p-1 text-gray-500 hover:text-[#145EDB] disabled:opacity-30 cursor-pointer"
                                title="Mover Bloco para Baixo"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveBlock(block.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded font-bold cursor-pointer ml-1"
                                title="Excluir Bloco"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Image Block Controls */}
                          {block.type === 'image' ? (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row gap-2 items-center">
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={e => handleUpdateBlock(block.id, e.target.value)}
                                  placeholder="URL ou Caminho da Imagem (https://...)"
                                  className="w-full sm:flex-1 p-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleOpenMediaPicker(block.id)}
                                  className="w-full sm:w-auto bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>Acervo</span>
                                </button>

                                <label className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-2xs">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        onShowToast('Otimizando e enviando imagem...', 'info');
                                        const dataUrl = await compressImageFile(file);
                                        if (dataUrl) {
                                          handleUpdateBlock(block.id, dataUrl);
                                          const fileTitle = file.name.replace(/\.[^/.]+$/, '');
                                          if (!block.caption || block.caption === '📷 Legenda da foto...') {
                                            handleUpdateBlockCaption(block.id, `📷 Foto: ${fileTitle}`);
                                          }
                                          addMediaAsset({
                                            title: fileTitle,
                                            url: dataUrl,
                                            altText: fileTitle,
                                            category: 'artigo',
                                            source: 'upload',
                                            tags: ['artigo', 'upload', 'foto']
                                          });
                                          onShowToast('Foto enviada, otimizada e salva no acervo!');
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              <input
                                type="text"
                                value={block.caption || ''}
                                onChange={e => handleUpdateBlockCaption(block.id, e.target.value)}
                                placeholder="Legenda da imagem (ex: 📷 Foto do resgate da Husky Vida...)"
                                className="w-full p-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs italic"
                              />

                              {/* Rendered Image Live Preview */}
                              {block.content && (
                                <div className="bg-slate-900 p-2.5 rounded-2xl border border-slate-700 space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold px-1">
                                    <span>Visualização Formatada do Bloco de Imagem</span>
                                    <span className="text-slate-400">Renderização no Artigo</span>
                                  </div>
                                  <div className="relative aspect-video max-h-52 w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                                    <img
                                      src={block.content}
                                      alt="Preview"
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800";
                                      }}
                                    />
                                  </div>
                                  {block.caption && (
                                    <p className="text-[11px] text-slate-300 italic text-center px-2">
                                      {block.caption}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : block.type === 'video' ? (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row gap-2 items-center">
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={e => handleUpdateBlock(block.id, e.target.value)}
                                  placeholder="URL do Vídeo (YouTube embed, Vimeo, MP4)"
                                  className="w-full sm:flex-1 p-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono"
                                />

                                <label className="w-full sm:w-auto bg-purple-900 hover:bg-purple-950 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-2xs">
                                  <Film className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Upload Vídeo</span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (evt) => {
                                          if (evt.target?.result) {
                                            handleUpdateBlock(block.id, evt.target.result as string);
                                            onShowToast('Vídeo carregado no bloco do artigo!');
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              <input
                                type="text"
                                value={block.caption || ''}
                                onChange={e => handleUpdateBlockCaption(block.id, e.target.value)}
                                placeholder="Legenda do vídeo..."
                                className="w-full p-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs italic"
                              />

                              {block.content && (
                                <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1.5 text-white">
                                  <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold px-1">
                                    <span>Visualização Formatada do Vídeo</span>
                                  </div>
                                  <div className="relative aspect-video max-h-56 w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                                    {block.content.includes('youtube') || block.content.includes('vimeo') || block.content.includes('embed') || block.content.includes('youtu.be') ? (
                                      <iframe
                                        src={formatEmbedUrl(block.content)}
                                        title="Preview Vídeo"
                                        className="w-full h-full border-0"
                                        allowFullScreen
                                      />
                                    ) : (
                                      <video src={block.content} controls className="w-full h-full object-contain" />
                                    )}
                                  </div>
                                  {block.caption && (
                                    <p className="text-[11px] text-slate-300 italic text-center px-2">
                                      {block.caption}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <textarea
                              rows={block.type === 'paragraph' ? 3 : block.type === 'heading2' ? 1 : 2}
                              value={block.content}
                              onChange={e => handleUpdateBlock(block.id, e.target.value)}
                              placeholder={block.type === 'heading2' ? 'Título H2 da Seção...' : 'Digite o conteúdo do texto...'}
                              className={`w-full p-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs ${
                                block.type === 'heading2' ? 'font-black text-slate-900 text-sm' :
                                block.type === 'callout' ? 'bg-sky-50/60 border-sky-200 text-sky-900 font-medium' :
                                block.type === 'quote' ? 'italic font-serif border-amber-200 bg-amber-50/50' : 'text-slate-800'
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Controls & Cover Manager */}
                <div className="space-y-4">
                  <div className="p-4 bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-bold uppercase text-[#0B2343] border-b border-[#E2E8F0] pb-2">Configurações & Capa</h4>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Categoria *</label>
                      <select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-[#0B2343]">Autor / Editor Responsável *</label>
                        <button
                          type="button"
                          onClick={() => setIsNewAuthorOpen(true)}
                          className="text-[10px] text-[#145EDB] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Novo Editor</span>
                        </button>
                      </div>
                      <select
                        value={authorId}
                        onChange={e => setAuthorId(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold"
                      >
                        {authors.map(a => (
                          <option key={a.id} value={a.id}>{a.name} — {a.roleTitle}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-[#0B2343]">Imagem de Capa (Featured Image) *</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenMediaPicker('featured')}
                            className="text-[10px] text-[#145EDB] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Acervo</span>
                          </button>
                          <label className="text-[10px] text-[#22A06B] bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                            <Upload className="w-3 h-3" />
                            <span>Upload Capa</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onShowToast('Otimizando foto de capa...', 'info');
                                  const dataUrl = await compressImageFile(file);
                                  if (dataUrl) {
                                    setFeaturedImage(dataUrl);
                                    const fileTitle = file.name.replace(/\.[^/.]+$/, '');
                                    addMediaAsset({
                                      title: `Capa: ${fileTitle}`,
                                      url: dataUrl,
                                      altText: fileTitle,
                                      category: 'capa',
                                      source: 'upload',
                                      tags: ['capa', 'upload']
                                    });
                                    onShowToast('Foto de capa enviada, otimizada e salva no acervo!');
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={featuredImage}
                        onChange={e => setFeaturedImage(e.target.value)}
                        placeholder="URL ou Base64 da Capa (https://...)"
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-mono"
                      />

                      {featuredImage && (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs mt-2 group">
                          <img
                            src={featuredImage}
                            alt="Capa Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFeaturedImage('')}
                            className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            Remover Capa
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Tags (separadas por vírgula)</label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={e => setTagsInput(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
                      />
                    </div>

                    {/* Spotlight Controls */}
                    <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
                      <label className="block text-[11px] font-extrabold text-[#0B2343] uppercase tracking-wide">
                        🎯 Posição de Destaque
                      </label>

                      <div className="space-y-1.5 text-xs">
                        <label className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                          isUrgent ? 'bg-red-50 border-red-300 text-red-950 font-bold' : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isUrgent}
                            onChange={e => setIsUrgent(e.target.checked)}
                            className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <span className="block font-bold">📌 Manchete Principal Top Hero</span>
                            <span className="text-[10px] text-slate-500 font-normal">Destaque máximo na Home.</span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                          isEvergreen ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold' : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isEvergreen}
                            onChange={e => setIsEvergreen(e.target.checked)}
                            className="mt-0.5 rounded text-[#145EDB] focus:ring-[#145EDB]"
                          />
                          <div>
                            <span className="block font-bold">⭐ Destaque Secundário</span>
                            <span className="text-[10px] text-slate-500 font-normal">Carrosséis nobres do portal.</span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                          isSponsored ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold' : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isSponsored}
                            onChange={e => setIsSponsored(e.target.checked)}
                            className="mt-0.5 rounded text-[#FF8500] focus:ring-[#FF8500]"
                          />
                          <div>
                            <span className="block font-bold">🤝 Conteúdo Patrocinado</span>
                            <span className="text-[10px] text-slate-500 font-normal">Sinaliza selo de marca.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* SEO Score */}
                  <div className="p-4 bg-[#EAF3FF] border border-[#145EDB]/30 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2343]">Score SEO & Qualidade:</span>
                      <span className="text-sm font-black text-[#145EDB]">{seoScore}/100</span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                      <div className="bg-[#145EDB] h-full" style={{ width: `${seoScore}%` }} />
                    </div>
                    <ul className="text-[11px] space-y-1 text-[#5C6B7A] pt-1">
                      <li className={titleLengthOk ? 'text-[#22A06B] font-bold' : ''}>• Título ideal (30-70 chars)</li>
                      <li className={summaryOk ? 'text-[#22A06B] font-bold' : ''}>• Lead/Resumo preenchido</li>
                      <li className={hasImage ? 'text-[#22A06B] font-bold' : ''}>• Foto de capa configurada</li>
                      <li className={blocksCountOk ? 'text-[#22A06B] font-bold' : ''}>• Mínimo 3 blocos diagramados</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#5C6B7A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar e Publicar em gritnews.com.br</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Live Article Diagram Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Simulação de Diagramação Real em gritnews.com.br
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{canonicalUrl}</span>
              </div>

              {/* Simulated Article Layout */}
              <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-extrabold text-[#145EDB] uppercase tracking-wide">
                    {categories.find(c => c.id === categoryId)?.name || 'Categoria'}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#10233F] mt-1 leading-tight">
                    {title || 'Título da Matéria'}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{subtitle}</p>
                  )}
                </div>

                {featuredImage && (
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img src={featuredImage} alt={title} className="w-full h-auto object-cover max-h-96" />
                  </div>
                )}

                {/* Blocks Output Simulation */}
                <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                  {blocks.map((block, idx) => (
                    <div key={block.id || idx}>
                      {block.type === 'heading2' && (
                        <h2 className="text-lg font-black text-[#10233F] mt-6 mb-2">{block.content}</h2>
                      )}
                      {block.type === 'paragraph' && (
                        <p className="whitespace-pre-line text-slate-700">{block.content}</p>
                      )}
                      {block.type === 'image' && block.content && (
                        <figure className="my-4 space-y-2">
                          <img src={block.content} alt={block.caption || 'Foto'} className="w-full rounded-xl border border-slate-200 max-h-96 object-cover" />
                          {block.caption && (
                            <figcaption className="text-xs text-slate-500 italic text-center">{block.caption}</figcaption>
                          )}
                        </figure>
                      )}
                      {block.type === 'callout' && (
                        <div className="p-4 bg-sky-50 border-l-4 border-[#145EDB] rounded-r-xl text-sky-950 font-medium my-4">
                          {block.content}
                        </div>
                      )}
                      {block.type === 'quote' && (
                        <blockquote className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl italic font-serif text-amber-950 my-4">
                          {block.content}
                        </blockquote>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Social Media & Engagement Generator */}
          {activeTab === 'social' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-black text-[#10233F] flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#145EDB]" />
                    Central de Engajamento & Divulgação Multicanal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Textos pré-formatados com a URL oficial gritnews.com.br para amplificar leituras e repercussão.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#145EDB] font-bold bg-blue-100 px-3 py-1 rounded-full">
                  gritnews.com.br
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WhatsApp Channel */}
                <div className="p-4 bg-white border border-emerald-200 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp & Grupos B2B
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyShareText(`📰 *${title}*\n\n${summary}\n\nLeia completa no GRIT NEWS:\n${canonicalUrl}`, 'WhatsApp')}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedShareChannel === 'WhatsApp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedShareChannel === 'WhatsApp' ? 'Copiado!' : 'Copiar Text'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 text-emerald-300 rounded-xl text-[11px] whitespace-pre-wrap font-mono">
                    {`📰 *${title || 'Título'}*\n\n${summary || 'Resumo da notícia...'}\n\nLeia completa no GRIT NEWS:\n${canonicalUrl}`}
                  </pre>
                </div>

                {/* LinkedIn Channel */}
                <div className="p-4 bg-white border border-blue-200 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <Linkedin className="w-4 h-4 text-[#0077B5]" /> LinkedIn & Artigo Corporativo
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyShareText(`🚀 ${title}\n\n${subtitle || summary}\n\nConfira a análise em profundidade no GRIT NEWS:\n${canonicalUrl}\n\n#GritNews #Mercado #Inovacao`, 'LinkedIn')}
                      className="px-2.5 py-1 bg-[#0077B5] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedShareChannel === 'LinkedIn' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedShareChannel === 'LinkedIn' ? 'Copiado!' : 'Copiar Text'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 text-sky-300 rounded-xl text-[11px] whitespace-pre-wrap font-mono">
                    {`🚀 ${title || 'Título'}\n\n${subtitle || summary || 'Lead da matéria...'}\n\nConfira no GRIT NEWS:\n${canonicalUrl}\n\n#GritNews #Mercado`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Media Picker Selector Modal */}
      <Modal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        title="Seletor & Upload de Fotos do Acervo GRIT NEWS"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          {/* Quick Upload or Paste Bar inside Picker */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
            <span className="text-xs font-extrabold text-[#0B2343] flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#145EDB]" />
              Enviar Nova Imagem do Seu Dispositivo para o Acervo:
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0">
                <Upload className="w-4 h-4" />
                <span>Escolher Arquivo do Dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onShowToast('Otimizando e enviando imagem...', 'info');
                      const dataUrl = await compressImageFile(file);
                      if (dataUrl) {
                        const fileTitle = file.name.replace(/\.[^/.]+$/, '');
                        const created = addMediaAsset({
                          title: fileTitle,
                          url: dataUrl,
                          altText: fileTitle,
                          category: 'upload',
                          source: 'upload',
                          tags: ['upload', 'acervo']
                        });
                        handleSelectMediaAsset(created);
                        onShowToast(`Imagem "${fileTitle}" enviada, otimizada e selecionada!`);
                      }
                    }
                  }}
                />
              </label>

              <div className="flex-1 flex gap-1">
                <input
                  type="text"
                  placeholder="Ou cole uma URL direta da foto (https://...)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const url = e.currentTarget.value;
                      const created = addMediaAsset({
                        title: 'Foto via URL',
                        url,
                        altText: 'Foto via URL',
                        category: 'externa',
                        source: 'unsplash',
                        tags: ['url']
                      });
                      handleSelectMediaAsset(created);
                      onShowToast('Foto via URL inserida!');
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={mediaPickerSearch}
                onChange={e => setMediaPickerSearch(e.target.value)}
                placeholder="Buscar foto por nome ou tag..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {['ALL', 'pet', 'saude', 'esportes', 'tecnologia', 'automacao', 'importacao', 'negocios', 'upload'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setMediaPickerCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                    mediaPickerCategory === cat ? 'bg-[#145EDB] text-white' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
            {filteredMediaAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => handleSelectMediaAsset(asset)}
                className="group relative bg-white border border-slate-200 hover:border-[#145EDB] rounded-xl overflow-hidden shadow-2xs cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="aspect-video w-full bg-slate-900 overflow-hidden">
                  <img src={asset.url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-2 space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-900 truncate" title={asset.title}>{asset.title}</p>
                  <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-[#145EDB] text-[9px] font-extrabold uppercase rounded">
                    {asset.category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-[#145EDB]/80 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>+ Inserir Foto</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* New Author Creator Modal */}
      <Modal
        isOpen={isNewAuthorOpen}
        onClose={() => setIsNewAuthorOpen(false)}
        title="Cadastrar Novo Redator / Editor"
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewAuthor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome Completo do Autor *</label>
            <input
              type="text"
              required
              value={newAuthorName}
              onChange={e => setNewAuthorName(e.target.value)}
              placeholder="Ex: Tasso Vasconcelos"
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Cargo / Especialidade *</label>
            <input
              type="text"
              required
              value={newAuthorRole}
              onChange={e => setNewAuthorRole(e.target.value)}
              placeholder="Ex: Editor Executivo, Repórter Especial"
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">URL do Avatar</label>
            <input
              type="text"
              value={newAuthorAvatar}
              onChange={e => setNewAuthorAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">E-mail Profissional</label>
            <input
              type="email"
              value={newAuthorEmail}
              onChange={e => setNewAuthorEmail(e.target.value)}
              placeholder="redacao@gritnews.com.br"
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Biografia Curta</label>
            <textarea
              rows={2}
              value={newAuthorBio}
              onChange={e => setNewAuthorBio(e.target.value)}
              placeholder="Jornalista cobrindo inovação e mercado..."
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewAuthorOpen(false)}
              className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-xs font-bold text-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastrar Editor</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
