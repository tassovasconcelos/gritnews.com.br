import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, CheckCircle2, AlertCircle, Sparkles, Clock, Calendar, Save, History, Image as ImageIcon, Video as VideoIcon, Film, Upload, FileImage, ArrowUp, ArrowDown, HelpCircle, Info, Layers } from 'lucide-react';
import { Article, ArticleStatus, Category, AuthorProfile, BlockType, ArticleBlock } from '../../types';
import { saveArticle, deleteArticle, getMediaAssets } from '../../lib/storage';
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
  const [showGuide, setShowGuide] = useState(true);
  const [blocks, setBlocks] = useState<ArticleBlock[]>([
    { id: 'b-1', type: 'paragraph', content: 'Escreva a introdução da matéria...' }
  ]);

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
    setCategoryId(categories[0]?.id || '');
    setAuthorId(authors[0]?.id || '');
    setFeaturedImage('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200');
    setStatus('PUBLISHED');
    setTagsInput('Inovação, Mercado');
    setIsSponsored(false);
    setIsEvergreen(false);
    setIsUrgent(false);
    setBlocks([{ id: 'b-1', type: 'paragraph', content: 'Introdução do artigo...' }]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setTitle(art.title);
    setSubtitle(art.subtitle);
    setSummary(art.summary);
    setCategoryId(art.categoryId);
    setAuthorId(art.authorId);
    setFeaturedImage(art.featuredImage);
    setStatus(art.status);
    setTagsInput(art.tags.join(', '));
    setIsSponsored(art.isSponsored || false);
    setIsEvergreen(art.isEvergreen || false);
    setIsUrgent(art.isUrgent || false);
    setBlocks(art.blocks && art.blocks.length > 0 ? art.blocks : [{ id: 'b-1', type: 'paragraph', content: art.summary }]);
    setIsModalOpen(true);
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
        type === 'image' ? '/images/vida_foto_1_resgate.svg' :
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
      blocks,
      seo: {
        metaTitle: `${title} | GRIT NEWS`,
        metaDescription: summary || subtitle,
        keywords: tagsArr
      }
    };

    saveArticle(articleToSave);
    setIsModalOpen(false);
    onRefresh();
    onShowToast(`Matéria "${title}" salva com sucesso!`);
  };

  // SEO Score calculation
  const titleLengthOk = title.length >= 30 && title.length <= 70;
  const summaryOk = summary.length >= 50 && summary.length <= 160;
  const hasImage = Boolean(featuredImage);
  const blocksCountOk = blocks.length >= 3;
  const seoScore = [titleLengthOk, summaryOk, hasImage, blocksCountOk].filter(Boolean).length * 25;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B2343]">CMS Editorial - Gerenciador de Artigos</h1>
          <p className="text-sm text-[#5C6B7A]">Crie, edite, revise e agende publicações no portal</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Matéria</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#0B2343] font-extrabold uppercase">
              <tr>
                <th className="p-4">Título</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Status</th>
                <th className="p-4">Visualizações</th>
                <th className="p-4">Publicado em</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#10233F]">
              {articles.map(art => {
                const catName = categories.find(c => c.id === art.categoryId)?.name || 'Geral';
                return (
                  <tr key={art.id} className="hover:bg-[#F7F9FC] transition-colors">
                    <td className="p-4 max-w-xs">
                      <p className="font-bold text-[#0B2343] truncate">{art.title}</p>
                      <p className="text-[11px] text-[#5C6B7A] truncate">{art.subtitle}</p>
                    </td>
                    <td className="p-4 font-semibold text-[#145EDB]">{catName}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        art.status === 'PUBLISHED' ? 'bg-[#22A06B]/10 text-[#22A06B]' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold">{art.viewsCount}</td>
                    <td className="p-4 text-gray-400">
                      {new Date(art.publishedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(art)}
                          className="p-1.5 text-[#145EDB] hover:bg-[#EAF3FF] rounded-lg"
                          title="Editar"
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
        title={editingArticle ? 'Editar Matéria CMS' : 'Criar Nova Matéria'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B2343] mb-1">Título da Matéria *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título com palavra-chave principal..."
                  className="w-full px-4 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0B2343]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2343] mb-1">Subtítulo / Linha fina *</label>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="Resumo explicativo para a linha fina..."
                  className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2343] mb-1">Resumo Executivo (Meta Description)</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Resumo de até 150 caracteres..."
                  className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
                />
              </div>

              {/* Block Editor & Media Manager */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#0B2343] flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-[#145EDB]" />
                    <span>Conteúdo do Artigo por Blocos ({blocks.length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] text-[#145EDB] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showGuide ? 'Ocultar Guia de Publicação' : 'Como publicar Fotos & Vídeos?'}</span>
                  </button>
                </div>

                {/* Step-by-step Publishing Instructions Banner */}
                {showGuide && (
                  <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-950 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-sky-900 border-b border-sky-200/80 pb-2">
                      <Info className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Guia Prático: Como Inserir e Renderizar Fotos & Vídeos em cada Bloco</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-sky-100 space-y-1">
                        <p className="font-bold text-sky-900 flex items-center gap-1">
                          <Upload className="w-3 h-3 text-sky-600" />
                          <span>1. Upload Direto</span>
                        </p>
                        <p className="text-slate-600 leading-snug">
                          Clique em <strong>"Upload Foto"</strong> ou <strong>"Upload Vídeo"</strong> em qualquer bloco para enviar arquivos do seu celular ou computador. Ele é renderizado instantaneamente!
                        </p>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-sky-100 space-y-1">
                        <p className="font-bold text-sky-900 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-emerald-600" />
                          <span>2. Fotos Locais do Projeto</span>
                        </p>
                        <p className="text-slate-600 leading-snug">
                          Adicione suas fotos na pasta <code className="bg-slate-100 px-1 rounded text-[10px]">/public/images/</code> ou vídeos em <code className="bg-slate-100 px-1 rounded text-[10px]">/public/videos/</code> e digite <code className="bg-slate-100 px-1 rounded text-[10px]">/images/nome.jpg</code>.
                        </p>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-sky-100 space-y-1">
                        <p className="font-bold text-sky-900 flex items-center gap-1">
                          <VideoIcon className="w-3 h-3 text-purple-600" />
                          <span>3. YouTube, Vimeo ou CDN</span>
                        </p>
                        <p className="text-slate-600 leading-snug">
                          Cole links de vídeos do YouTube (<code className="bg-slate-100 px-1 rounded text-[10px]">youtube.com/watch?v=...</code>) ou imagens da sua hospedagem Hostinger/Unsplash.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Block Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 bg-[#F7F9FC] p-2 rounded-xl border border-[#E2E8F0]">
                  <span className="text-[11px] font-bold text-gray-500 mr-1">Inserir:</span>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('paragraph')}
                    className="px-2.5 py-1.5 bg-white text-slate-800 text-xs rounded-lg font-bold border border-slate-200 hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    + Parágrafo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('heading2')}
                    className="px-2.5 py-1.5 bg-white text-slate-800 text-xs rounded-lg font-bold border border-slate-200 hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    + Título H2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('image')}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>+ Bloco Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('video')}
                    className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
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

                {/* Article Photos Quick Picker */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[#10233F] flex items-center gap-1.5">
                      📸 Fotos do Acervo TenPets & Matérias para Inserir num Clique:
                    </span>
                    <span className="text-[10px] text-amber-800">Clique no botão para criar o bloco da foto</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { title: '1. Resgate na Praça', url: '/images/vida_foto_1_resgate.svg' },
                      { title: '2. Quarto de Hospital', url: '/images/vida_foto_2_quarto_hospital.svg' },
                      { title: '3. Acupuntura & Lacinhos', url: '/images/vida_foto_3_acupuntura_lacinhos.svg' },
                      { title: '4. Fisioterapia Dra. Renata', url: '/images/vida_foto_4_fisioterapia_dra_renata.svg' },
                      { title: '5. Bandana Floral', url: '/images/vida_foto_5_bandana_floral.svg' },
                      { title: '6. Sorriso Varanda', url: '/images/vida_foto_6_sorriso_varanda.svg' },
                      { title: '7. Princesa Coroa', url: '/images/vida_foto_7_princesa_coroa.svg' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddBlock('image', p.url, `📷 ${p.title}`)}
                        className="bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <img src={p.url} alt={p.title} className="w-4 h-4 rounded object-cover" />
                        <span>+ {p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Render Blocks with Live Media & Controls */}
                <div className="space-y-3">
                  {blocks.map((block, idx) => (
                    <div key={block.id} className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 shadow-2xs hover:border-[#145EDB]/40 transition-colors">
                      {/* Block Controls Header */}
                      <div className="flex items-center justify-between text-xs font-bold border-b border-[#E2E8F0] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            block.type === 'image' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            block.type === 'video' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                            block.type === 'heading2' ? 'bg-blue-100 text-blue-800' :
                            block.type === 'callout' ? 'bg-sky-100 text-sky-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {block.type === 'image' ? '📷 Bloco de Imagem' :
                             block.type === 'video' ? '🎥 Bloco de Vídeo' :
                             block.type === 'heading2' ? '📌 Título H2' :
                             block.type === 'callout' ? '💡 Destaque' :
                             block.type === 'quote' ? '💬 Citação' : '📝 Parágrafo'}
                          </span>
                        </div>

                        {/* Action Buttons: Move Up, Move Down, Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-gray-500 hover:text-[#145EDB] disabled:opacity-30 cursor-pointer"
                            title="Mover para Cima"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(idx, 'down')}
                            disabled={idx === blocks.length - 1}
                            className="p-1 text-gray-500 hover:text-[#145EDB] disabled:opacity-30 cursor-pointer"
                            title="Mover para Baixo"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(block.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded font-bold cursor-pointer ml-1"
                            title="Remover Bloco"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Block Specific Input & Live Visual Render */}
                      {block.type === 'image' ? (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <input
                              type="text"
                              value={block.content}
                              onChange={e => handleUpdateBlock(block.id, e.target.value)}
                              placeholder="Caminho da Imagem (/images/exemplo.jpg ou https://...)"
                              className="w-full sm:flex-1 p-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono"
                            />

                            <label className="w-full sm:w-auto bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (evt) => {
                                      if (evt.target?.result) {
                                        handleUpdateBlock(block.id, evt.target.result as string);
                                        onShowToast('Foto carregada e inserida no bloco com sucesso!');
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
                            placeholder="Legenda da imagem (ex: 📷 Foto do resgate realizado em 2026...)"
                            className="w-full p-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs italic"
                          />

                          {/* Rendered Image Preview in Article Format */}
                          {block.content && (
                            <div className="bg-slate-900 p-2 rounded-2xl border border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold px-1">
                                <span>Visualização Formatada da Imagem no Artigo</span>
                                <span className="text-slate-400">Renderização em Tempo Real</span>
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
                              placeholder="URL do Vídeo (YouTube embed, Vimeo, MP4 ou /videos/nome.mp4)"
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
                                        onShowToast('Vídeo real carregado no bloco do artigo!');
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
                            placeholder="Legenda do vídeo (ex: 🎥 Registro em vídeo do procedimento...)"
                            className="w-full p-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs italic"
                          />

                          {/* Rendered Video Preview in Article Format */}
                          {block.content && (
                            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1.5 text-white">
                              <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold px-1">
                                <span>Visualização Formatada do Vídeo no Artigo</span>
                                <span className="text-slate-400">Player em Tempo Real</span>
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
                  <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Autor *</label>
                  <select
                    value={authorId}
                    onChange={e => setAuthorId(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold"
                  >
                    {authors.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Status da Matéria</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as ArticleStatus)}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold"
                  >
                    <option value="DRAFT">Rascunho</option>
                    <option value="IN_REVIEW">Em Revisão</option>
                    <option value="SCHEDULED">Agendado</option>
                    <option value="PUBLISHED">Publicado</option>
                  </select>
                </div>

                {/* Cover Image Manager with Upload & Preview */}
                <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-[#0B2343]">Imagem de Capa do Artigo *</label>
                    <label className="text-[10px] text-[#145EDB] hover:underline font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload Capa</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setFeaturedImage(evt.target.result as string);
                                onShowToast('Nova foto de capa definida!');
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
                    value={featuredImage}
                    onChange={e => setFeaturedImage(e.target.value)}
                    placeholder="URL da Capa (/images/... ou https://...)"
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-mono"
                  />

                  {featuredImage && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                      <img
                        src={featuredImage}
                        alt="Capa Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800";
                        }}
                      />
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

                {/* Spotlight & Placement Controls */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
                  <label className="block text-[11px] font-extrabold text-[#0B2343] uppercase tracking-wide">
                    🎯 Posição de Publicação & Destaque
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
                        <span className="block font-bold">📌 Manchete Principal da Capa (Top Hero)</span>
                        <span className="text-[10px] text-slate-500 font-normal">Exibição no topo da Home com badge de destaque e card expandido.</span>
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
                        <span className="block font-bold">⭐ Destaque Secundário / Carrossel</span>
                        <span className="text-[10px] text-slate-500 font-normal">Matéria de destaque em carrosséis e barras laterais nobres.</span>
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
                        <span className="text-[10px] text-slate-500 font-normal">Sinaliza selo de parceiro/patrocinado.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO Checklist Card */}
              <div className="p-4 bg-[#EAF3FF] border border-[#145EDB]/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B2343]">Score SEO & E-E-A-T:</span>
                  <span className="text-sm font-black text-[#145EDB]">{seoScore}/100</span>
                </div>
                <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                  <div className="bg-[#145EDB] h-full" style={{ width: `${seoScore}%` }} />
                </div>
                <ul className="text-[11px] space-y-1 text-[#5C6B7A] pt-1">
                  <li className={titleLengthOk ? 'text-[#22A06B] font-bold' : ''}>
                    • Título entre 30 e 70 caracteres
                  </li>
                  <li className={summaryOk ? 'text-[#22A06B] font-bold' : ''}>
                    • Resumo/Meta description preenchido
                  </li>
                  <li className={hasImage ? 'text-[#22A06B] font-bold' : ''}>
                    • Imagem em alta resolução definida
                  </li>
                  <li className={blocksCountOk ? 'text-[#22A06B] font-bold' : ''}>
                    • Mínimo de 3 blocos de conteúdo
                  </li>
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
              <span>Salvar e Publicar Matéria</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
