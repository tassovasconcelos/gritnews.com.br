import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, CheckCircle2, AlertCircle, Sparkles, Clock, Calendar, Save, History } from 'lucide-react';
import { Article, ArticleStatus, Category, AuthorProfile, BlockType, ArticleBlock } from '../../types';
import { saveArticle, deleteArticle } from '../../lib/storage';
import { Modal } from '../ui/Modal';

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
  const [blocks, setBlocks] = useState<ArticleBlock[]>([
    { id: 'b-1', type: 'paragraph', content: 'Escreva a introdução da matéria...' }
  ]);

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

  const handleAddBlock = (type: BlockType) => {
    const newBlock: ArticleBlock = {
      id: `b-${Date.now()}`,
      type,
      content: type === 'callout' ? '💡 Destaque especial de mercado...' : type === 'quote' ? '“Citação importante...”' : 'Novo parágrafo...'
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlock = (id: string, newContent: string) => {
    setBlocks(blocks.map(b => (b.id === id ? { ...b, content: newContent } : b)));
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

              {/* Block Editor */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-[#0B2343]">Conteúdo da Matéria em Blocos</h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('paragraph')}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-md font-bold hover:bg-gray-200"
                    >
                      + Parágrafo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('heading2')}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-md font-bold hover:bg-gray-200"
                    >
                      + Título H2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('callout')}
                      className="px-2 py-1 bg-[#EAF3FF] text-[#145EDB] text-xs rounded-md font-bold"
                    >
                      + Destaque
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('ad_slot')}
                      className="px-2 py-1 bg-orange-100 text-[#FF8500] text-xs rounded-md font-bold"
                    >
                      + Anúncio
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {blocks.map((block, i) => (
                    <div key={block.id} className="p-3 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl relative group">
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
                        <span className="uppercase">{block.type}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(block.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          Remover
                        </button>
                      </div>
                      <textarea
                        rows={block.type === 'paragraph' ? 3 : 1}
                        value={block.content}
                        onChange={e => handleUpdateBlock(block.id, e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Controls & SEO Checklist */}
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#0B2343]">Configurações da Publicação</h4>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Categoria</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Autor</label>
                  <select
                    value={authorId}
                    onChange={e => setAuthorId(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  >
                    {authors.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as ArticleStatus)}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  >
                    <option value="DRAFT">Rascunho</option>
                    <option value="IN_REVIEW">Em Revisão</option>
                    <option value="SCHEDULED">Agendado</option>
                    <option value="PUBLISHED">Publicado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B2343] mb-1">URL da Imagem Capa</label>
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={e => setFeaturedImage(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B2343] mb-1">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSponsored}
                      onChange={e => setIsSponsored(e.target.checked)}
                      className="rounded text-[#FF8500]"
                    />
                    <span>Conteúdo Patrocinado</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEvergreen}
                      onChange={e => setIsEvergreen(e.target.checked)}
                      className="rounded text-[#145EDB]"
                    />
                    <span>Atributo Evergreen</span>
                  </label>
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
