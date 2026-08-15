/**
 * ============================================================================
 * BANCO DE NOTÍCIAS & PAUTAS CANDIDATAS (KANBAN & LISTA) — GRIT NEWS 2.0
 * ============================================================================
 * 
 * Pipeline Editorial Completo:
 * [Descoberta] -> [Em análise] -> [Validando] -> [Pronta para edição] -> 
 * [Aguardando aprovação] -> [Aprovada] -> [Agendada] -> [Publicada] / [Rejeitada]
 */

import React, { useState } from 'react';
import { 
  Columns, 
  List, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Tag,
  Building2,
  Calendar,
  Layers,
  Edit3
} from 'lucide-react';
import { 
  NewsCandidate, 
  CandidateKanbanStatus, 
  VerificationStatus,
  UserRole,
  Category,
  Article
} from '../../types';
import { 
  getNewsCandidates, 
  saveNewsCandidate, 
  deleteNewsCandidate,
  saveCandidateVerification
} from '../../lib/gritVerify';
import { getCategories, saveArticle, getAuthors } from '../../lib/storage';

interface AdminNewsCandidatesProps {
  currentRole: UserRole;
  currentUserName: string;
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
  onOpenArticleEditor?: (articleId?: string) => void;
}

const KANBAN_COLUMNS: { id: CandidateKanbanStatus; title: string; color: string }[] = [
  { id: 'DESCOBERTA', title: 'Descoberta', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { id: 'EM_ANALISE', title: 'Em Análise', color: 'border-blue-300 bg-blue-50 text-blue-800' },
  { id: 'VALIDANDO', title: 'Validando (Grit Verify)', color: 'border-amber-300 bg-amber-50 text-amber-800' },
  { id: 'PRONTA_EDICAO', title: 'Pronta para Edição', color: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
  { id: 'AGUARDANDO_APROVACAO', title: 'Aguardando Aprovação', color: 'border-purple-300 bg-purple-50 text-purple-800' },
  { id: 'APROVADA', title: 'Aprovada', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { id: 'AGENDADA', title: 'Agendada', color: 'border-cyan-300 bg-cyan-50 text-cyan-800' },
  { id: 'PUBLICADA', title: 'Publicada', color: 'border-green-400 bg-green-50 text-green-900' },
  { id: 'REJEITADA', title: 'Rejeitada', color: 'border-rose-300 bg-rose-50 text-rose-800' }
];

export const AdminNewsCandidates: React.FC<AdminNewsCandidatesProps> = ({
  currentRole,
  currentUserName,
  onRefreshData,
  onShowToast
}) => {
  const [candidates, setCandidates] = useState<NewsCandidate[]>(() => getNewsCandidates());
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<NewsCandidate | null>(null);

  // Modal Novo Candidato Manual
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState('c2');

  const categories = getCategories();

  const handleStatusChange = (candId: string, newStatus: CandidateKanbanStatus) => {
    const list = getNewsCandidates();
    const target = list.find(c => c.id === candId);
    if (!target) return;

    target.kanbanStatus = newStatus;
    if (newStatus === 'APROVADA') {
      target.verificationStatus = 'APROVADO_EDITOR';
      target.approvedBy = currentUserName;
      target.approvedAt = new Date().toISOString();
    } else if (newStatus === 'REJEITADA') {
      target.verificationStatus = 'REJEITADO';
    }

    saveNewsCandidate(target, { name: currentUserName, role: currentRole });
    setCandidates(getNewsCandidates());
    onShowToast(`Pauta movida para: ${newStatus.replace('_', ' ')}`);
  };

  const handleConvertToArticle = (cand: NewsCandidate) => {
    // Cria um rascunho de artigo oficial no CMS
    const author = getAuthors()[0];
    const cat = categories.find(c => c.id === cand.categoryId) || categories[0];

    const newArticle: Article = {
      id: `art_${Date.now()}`,
      title: cand.titleSuggested || cand.titleOriginal,
      subtitle: cand.summary,
      summary: cand.summary,
      categoryId: cat.id,
      authorId: author.id,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'DRAFT',
      featuredImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
      viewsCount: 0,
      likesCount: 0,
      sharesCount: 0,
      slug: (cand.titleSuggested || cand.titleOriginal).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      readingTimeMinutes: 4,
      tags: cand.tags,
      blocks: [
        {
          id: 'b1',
          type: 'paragraph',
          content: cand.summary
        },
        {
          id: 'b2',
          type: 'callout',
          content: `**Fonte Primária Homologada:** ${cand.sourceName} (${cand.urlOriginal}) — Verificado com GRIT Trust Score ${cand.trustScore}/100.`
        },
        {
          id: 'b3',
          type: 'paragraph',
          content: 'Aprofundamento editorial com análise setorial e desdobramentos de mercado para a tomada de decisão.'
        }
      ],
      seo: {
        metaTitle: cand.titleSuggested,
        metaDescription: cand.summary,
        keywords: cand.tags
      }
    };

    saveArticle(newArticle);
    
    // Atualiza o candidato para PUBLICADA / AGENDADA
    cand.kanbanStatus = 'PUBLICADA';
    cand.articleId = newArticle.id;
    saveNewsCandidate(cand, { name: currentUserName, role: currentRole });
    setCandidates(getNewsCandidates());

    onShowToast(`Artigo rascunho criado com sucesso no CMS! (ID: ${newArticle.id})`);
  };

  const handleCreateManualCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newCand: NewsCandidate = {
      id: `cand_${Date.now()}`,
      titleOriginal: newTitle,
      titleSuggested: newTitle,
      summary: newSummary || 'Pauta inserida manualmente para apuração jornalística.',
      urlOriginal: newUrl,
      sourceId: 'src_manual',
      sourceName: newSourceName || 'Fonte Externa',
      sourceDomain: newUrl.replace(/^https?:\/\//, '').split('/')[0],
      sourceType: 'IMPRENSA_NACIONAL',
      publishedAtOriginal: new Date().toISOString(),
      capturedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      categoryId: newCategory,
      tags: ['Manual', 'Apuração'],
      trustScore: 78,
      duplicationScore: 0,
      trendingScore: 75,
      relevanceScore: 85,
      opportunityScore: 80,
      seoScore: 82,
      verificationStatus: 'EM_VERIFICACAO',
      kanbanStatus: 'DESCOBERTA',
      corroboratingSourcesCount: 1,
      requiresReview: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveNewsCandidate(newCand, { name: currentUserName, role: currentRole });
    setCandidates(getNewsCandidates());
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewSourceName('');
    setNewSummary('');
    onShowToast('Nova pauta candidata inserida no banco com sucesso!');
  };

  const filteredCandidates = candidates.filter(cand => {
    if (selectedCategory !== 'ALL' && cand.categoryId !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && cand.kanbanStatus !== selectedStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = cand.titleSuggested?.toLowerCase().includes(term) || cand.titleOriginal?.toLowerCase().includes(term);
      const matchSource = cand.sourceName?.toLowerCase().includes(term);
      if (!matchTitle && !matchSource) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Banco de Notícias & Pautas Candidatas</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              {candidates.length} Pautas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fluxo editorial Kanban: Da descoberta automatizada à validação de fatos e aprovação de publicação.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Switch Kanban / Lista */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#145EDB] hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Pauta</span>
          </button>
        </div>
      </div>

      {/* Filtros Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Pesquisar por pauta, fonte ou palavra-chave..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#145EDB]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium"
        >
          <option value="ALL">Todas as Categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium"
        >
          <option value="ALL">Todos os Status</option>
          {KANBAN_COLUMNS.map(col => (
            <option key={col.id} value={col.id}>{col.title}</option>
          ))}
        </select>
      </div>

      {/* MODO 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1700px]">
            {KANBAN_COLUMNS.map(col => {
              const colCandidates = filteredCandidates.filter(c => c.kanbanStatus === col.id);

              return (
                <div
                  key={col.id}
                  className="w-[280px] bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col shrink-0 min-h-[500px]"
                >
                  {/* Col Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-black text-slate-800 tracking-tight">{col.title}</span>
                    <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {colCandidates.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                    {colCandidates.map(cand => (
                      <div
                        key={cand.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-2.5"
                      >
                        {/* Header do Card */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                            {cand.sourceName}
                          </span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            cand.trustScore >= 85 ? 'bg-emerald-100 text-emerald-800' :
                            cand.trustScore >= 60 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            Trust {cand.trustScore}
                          </span>
                        </div>

                        {/* Título */}
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-3">
                          {cand.titleSuggested || cand.titleOriginal}
                        </h4>

                        {/* Metas & Oportunidade */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="flex items-center gap-1 font-semibold text-blue-700">
                            <TrendingUp className="w-3 h-3" />
                            <span>Opp: {cand.opportunityScore}/100</span>
                          </span>
                          <span className="font-mono">
                            {new Date(cand.capturedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100">
                          {col.id !== 'PUBLICADA' && (
                            <button
                              onClick={() => handleConvertToArticle(cand)}
                              title="Transformar em Artigo Rascunho no CMS"
                              className="flex-1 bg-blue-50 hover:bg-[#145EDB] text-[#145EDB] hover:text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Para CMS</span>
                            </button>
                          )}

                          {/* Seletor de Próximo Status */}
                          <select
                            value={cand.kanbanStatus}
                            onChange={e => handleStatusChange(cand.id, e.target.value as CandidateKanbanStatus)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-1 font-bold text-slate-700 max-w-[90px]"
                          >
                            {KANBAN_COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {colCandidates.length === 0 && (
                      <div className="p-6 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-xl">
                        Nenhuma pauta nesta etapa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODO 2: LISTA / TABELA */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Pauta / Título</th>
                <th className="p-3.5">Fonte Primária</th>
                <th className="p-3.5 text-center">Trust Score</th>
                <th className="p-3.5 text-center">Opportunity</th>
                <th className="p-3.5">Status Kanban</th>
                <th className="p-3.5">Captura</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map(cand => (
                <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 max-w-md">
                    <p className="font-bold text-slate-900 leading-snug">{cand.titleSuggested}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">Original: {cand.titleOriginal}</p>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-bold text-slate-800 block">{cand.sourceName}</span>
                    <a
                      href={cand.urlOriginal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#145EDB] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>{cand.sourceDomain}</span>
                    </a>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-lg text-xs font-black ${
                      cand.trustScore >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      cand.trustScore >= 60 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {cand.trustScore}/100
                    </span>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg text-xs">
                      {cand.opportunityScore}/100
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800">
                      {cand.kanbanStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {new Date(cand.capturedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleConvertToArticle(cand)}
                      className="bg-blue-50 hover:bg-[#145EDB] text-[#145EDB] hover:text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Criar Artigo</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar Nova Pauta Manual */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Inserir Nova Pauta para Apuração</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateManualCandidate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título da Notícia / Fato</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novo Hospital Regional inicia operações no Ceará..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Original da Fonte</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Fonte</label>
                  <input
                    type="text"
                    placeholder="Ex: Governo do Estado"
                    value={newSourceName}
                    onChange={e => setNewSourceName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resumo & Fatos Principais</label>
                <textarea
                  rows={3}
                  placeholder="Descreva os dados confirmados para que a redação possa redigir..."
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#145EDB] hover:bg-blue-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Pauta no Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
