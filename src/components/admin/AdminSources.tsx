/**
 * ============================================================================
 * CENTRAL DE FONTES HOMOLOGADAS — GRIT NEWS 2.0
 * ============================================================================
 * 
 * Gestão de fontes oficiais, imprensa, agências e instituições.
 * Homologação, avaliação contínua de confiabilidade e bloqueio de fontes duvidosas.
 */

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Plus, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Rss,
  Globe,
  Tag,
  Clock,
  Filter
} from 'lucide-react';
import { NewsSource, SourceType, UserRole } from '../../types';
import { getHomologatedSources, saveHomologatedSource } from '../../lib/gritVerify';

interface AdminSourcesProps {
  currentRole: UserRole;
  currentUserName: string;
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminSources: React.FC<AdminSourcesProps> = ({
  currentRole,
  currentUserName,
  onRefreshData,
  onShowToast
}) => {
  const [sources, setSources] = useState<NewsSource[]>(() => getHomologatedSources());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  
  // Modal de Adicionar/Editar Fonte
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);

  const [formName, setFormName] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formType, setFormType] = useState<SourceType>('FONTE_OFICIAL');
  const [formCategory, setFormCategory] = useState('');
  const [formTrustScore, setFormTrustScore] = useState(90);
  const [formRssUrl, setFormRssUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAllowsAggregation, setFormAllowsAggregation] = useState(true);

  const handleOpenCreateModal = () => {
    setEditingSource(null);
    setFormName('');
    setFormDomain('');
    setFormType('FONTE_OFICIAL');
    setFormCategory('Economia & Finanças');
    setFormTrustScore(90);
    setFormRssUrl('');
    setFormNotes('');
    setFormAllowsAggregation(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (src: NewsSource) => {
    setEditingSource(src);
    setFormName(src.name);
    setFormDomain(src.domain);
    setFormType(src.type);
    setFormCategory(src.category);
    setFormTrustScore(src.trustScore);
    setFormRssUrl(src.rssUrl || '');
    setFormNotes(src.notes || '');
    setFormAllowsAggregation(src.allowsAggregation);
    setIsModalOpen(true);
  };

  const handleSaveSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDomain.trim()) return;

    const newSource: NewsSource = {
      id: editingSource ? editingSource.id : `src_${Date.now()}`,
      name: formName.trim(),
      domain: formDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      type: formType,
      category: formCategory.trim() || 'Geral',
      trustScore: formTrustScore,
      isActive: true,
      allowsAggregation: formAllowsAggregation,
      rssUrl: formRssUrl.trim() || undefined,
      notes: formNotes.trim() || undefined,
      lastVerifiedAt: new Date().toISOString(),
      createdAt: editingSource ? editingSource.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveHomologatedSource(newSource);
    setSources(getHomologatedSources());
    setIsModalOpen(false);
    onShowToast(`Fonte "${newSource.name}" homologada e salva com sucesso!`);
  };

  const handleToggleActive = (src: NewsSource) => {
    const updated = { ...src, isActive: !src.isActive, updatedAt: new Date().toISOString() };
    saveHomologatedSource(updated);
    setSources(getHomologatedSources());
    onShowToast(`Status da fonte "${src.name}" alterado para ${updated.isActive ? 'Ativa' : 'Bloqueada'}.`);
  };

  const filteredSources = sources.filter(src => {
    if (filterType !== 'ALL' && src.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = src.name.toLowerCase().includes(term);
      const matchDomain = src.domain.toLowerCase().includes(term);
      const matchCat = src.category.toLowerCase().includes(term);
      if (!matchName && !matchDomain && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Central de Fontes Homologadas</h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              {sources.filter(s => s.isActive).length} Fontes Ativas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastramento, auditoria de domínio e controle de agregação de fontes de dados primárias.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-[#145EDB] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Homologar Nova Fonte</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Buscar por nome, domínio ou categoria da fonte..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#145EDB]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium"
        >
          <option value="ALL">Todos os Tipos de Fonte</option>
          <option value="FONTE_OFICIAL">Fontes Oficiais / Governamentais</option>
          <option value="AGENCIA_NOTICIAS">Agências de Notícias</option>
          <option value="UNIVERSIDADE">Universidades & Pesquisa</option>
          <option value="IMPRENSA_NACIONAL">Imprensa Nacional</option>
          <option value="IMPRENSA_REGIONAL">Imprensa Regional</option>
          <option value="EMPRESA">Companhias B3 / Empresas</option>
          <option value="FONTE_NAO_HOMOLOGADA">Não Homologadas</option>
        </select>
      </div>

      {/* Tabela de Fontes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Nome / Domínio</th>
              <th className="p-3.5">Tipo de Fonte</th>
              <th className="p-3.5">Setor / Categoria</th>
              <th className="p-3.5 text-center">Trust Rating</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSources.map(src => (
              <tr key={src.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{src.name}</p>
                      <a
                        href={`https://${src.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#145EDB] hover:underline flex items-center gap-1 font-mono"
                      >
                        <Globe className="w-2.5 h-2.5" />
                        <span>{src.domain}</span>
                      </a>
                    </div>
                  </div>
                </td>

                <td className="p-3.5 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    src.type === 'FONTE_OFICIAL' ? 'bg-emerald-100 text-emerald-800' :
                    src.type === 'AGENCIA_NOTICIAS' ? 'bg-blue-100 text-blue-800' :
                    src.type === 'UNIVERSIDADE' ? 'bg-purple-100 text-purple-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {src.type.replace('_', ' ')}
                  </span>
                </td>

                <td className="p-3.5 text-slate-600 font-medium">
                  {src.category}
                </td>

                <td className="p-3.5 text-center whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                    src.trustScore >= 90 ? 'bg-emerald-100 text-emerald-800' :
                    src.trustScore >= 75 ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {src.trustScore}/100
                  </span>
                </td>

                <td className="p-3.5 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(src)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                      src.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                        : 'bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800'
                    }`}
                  >
                    {src.isActive ? 'Ativa (Homologada)' : 'Bloqueada'}
                  </button>
                </td>

                <td className="p-3.5 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleOpenEditModal(src)}
                    className="text-xs font-bold text-[#145EDB] hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                  >
                    Editar Fonte
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar/Editar Fonte */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingSource ? 'Editar Fonte Homologada' : 'Homologar Nova Fonte Primária'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveSource} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Instituição / Veículo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Banco Central do Brasil, FIEC, IBGE..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Domínio Oficial</label>
                  <input
                    type="text"
                    required
                    placeholder="bcb.gov.br"
                    value={formDomain}
                    onChange={e => setFormDomain(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Fonte</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as SourceType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="FONTE_OFICIAL">Fonte Oficial (Governo / Autarquia)</option>
                    <option value="AGENCIA_NOTICIAS">Agência de Notícias Homologada</option>
                    <option value="UNIVERSIDADE">Universidade / Pesquisa</option>
                    <option value="IMPRENSA_NACIONAL">Imprensa Nacional</option>
                    <option value="IMPRENSA_REGIONAL">Imprensa Regional</option>
                    <option value="EMPRESA">Companhia Aberta / B3</option>
                    <option value="BLOG">Blog Setorial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Setor / Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Economia, Saúde, Imóveis..."
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trust Score Base (0 a 100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formTrustScore}
                    onChange={e => setFormTrustScore(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL do Feed RSS ou API (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/rss.xml"
                  value={formRssUrl}
                  onChange={e => setFormRssUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas de Auditoria & Confiabilidade</label>
                <textarea
                  rows={2}
                  placeholder="Observações sobre autoridade institucional, contato de assessoria..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#145EDB] hover:bg-blue-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Fonte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
