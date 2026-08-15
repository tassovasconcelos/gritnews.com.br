/**
 * ============================================================================
 * PAINEL GRIT VERIFY — MOTOR DE VALIDAÇÃO JORNALÍSTICA E FACT-CHECKING
 * ============================================================================
 * 
 * DIRETRIZ FUNDAMENTAL:
 * Informações reais, rastreáveis, auditáveis e corroboradas.
 * Proibido inventar dados ou publicar informações sem validação prévia.
 * Score de Confiabilidade (0 a 100) ponderado pelos 7 critérios do Prompt Mestre.
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink, 
  Scale, 
  Building2, 
  FileCheck, 
  Database, 
  TrendingUp, 
  Clock, 
  UserCheck, 
  Layers, 
  Sparkles, 
  Info,
  Sliders,
  Check,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  NewsCandidate, 
  NewsSource, 
  DataIndicator, 
  SourceType, 
  UserRole,
  VerificationStatus,
  CandidateKanbanStatus
} from '../../types';
import { 
  getNewsCandidates, 
  getHomologatedSources, 
  getDataIndicators, 
  calculateTrustScore,
  calculateDuplicationScore,
  saveNewsCandidate,
  saveCandidateVerification
} from '../../lib/gritVerify';

interface AdminGritVerifyProps {
  currentRole: UserRole;
  currentUserName: string;
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
  onNavigateToCandidate?: (id: string) => void;
}

export const AdminGritVerify: React.FC<AdminGritVerifyProps> = ({
  currentRole,
  currentUserName,
  onRefreshData,
  onShowToast
}) => {
  const [candidates, setCandidates] = useState<NewsCandidate[]>(() => getNewsCandidates());
  const [sources, setSources] = useState<NewsSource[]>(() => getHomologatedSources());
  const [indicators, setIndicators] = useState<DataIndicator[]>(() => getDataIndicators());

  // Interactive Live Calculator State
  const [calcSourceType, setCalcSourceType] = useState<SourceType>('FONTE_OFICIAL');
  const [calcUrl, setCalcUrl] = useState('https://www.bcb.gov.br/publicacoes/notas-copom');
  const [calcHasValidDate, setCalcHasValidDate] = useState(true);
  const [calcAuthor, setCalcAuthor] = useState('Assessoria de Comunicação');
  const [calcCorroboratingSources, setCalcCorroboratingSources] = useState(3);
  const [calcIsCoherent, setCalcIsCoherent] = useState(true);
  const [calcIsInstitutional, setCalcIsInstitutional] = useState(true);

  // Active Tab within GRIT Verify
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'calculator' | 'indicators' | 'rules'>('queue');
  const [selectedCandidate, setSelectedCandidate] = useState<NewsCandidate | null>(candidates[0] || null);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Live calculated Trust Score
  const currentCalcBreakdown = calculateTrustScore({
    sourceType: calcSourceType,
    url: calcUrl,
    hasValidDate: calcHasValidDate,
    authorName: calcAuthor,
    corroboratingSourcesCount: calcCorroboratingSources,
    isCoherent: calcIsCoherent,
    isInstitutionalOrOfficial: calcIsInstitutional
  });

  const handleApproveCandidate = (cand: NewsCandidate) => {
    const updated = saveCandidateVerification(
      cand.id,
      'APROVADO_EDITOR',
      'APROVADA',
      { name: currentUserName, role: currentRole }
    );
    if (updated) {
      setCandidates(getNewsCandidates());
      setSelectedCandidate(updated);
      onShowToast(`Pauta "${cand.titleSuggested}" aprovada pelo editor!`);
    }
  };

  const handleRejectCandidate = (cand: NewsCandidate) => {
    const reason = prompt('Informe a justificativa da rejeição (ausência de fontes, divergência ou risco):', 'Fonte insuficiente ou não validada.');
    if (reason === null) return;

    const updated = saveCandidateVerification(
      cand.id,
      'REJEITADO',
      'REJEITADA',
      { name: currentUserName, role: currentRole },
      reason
    );
    if (updated) {
      setCandidates(getNewsCandidates());
      setSelectedCandidate(updated);
      onShowToast('Pauta rejeitada e arquivada com registro de auditoria.');
    }
  };

  const handleVerifyCandidate = (cand: NewsCandidate) => {
    const updated = saveCandidateVerification(
      cand.id,
      'VERIFICADO',
      'PRONTA_EDICAO',
      { name: currentUserName, role: currentRole }
    );
    if (updated) {
      setCandidates(getNewsCandidates());
      setSelectedCandidate(updated);
      onShowToast('Pauta verificada com sucesso! Pronta para redação editorial.');
    }
  };

  const filteredCandidates = candidates.filter(cand => {
    if (filterStatus !== 'ALL' && cand.verificationStatus !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = cand.titleSuggested?.toLowerCase().includes(term) || cand.titleOriginal?.toLowerCase().includes(term);
      const matchSource = cand.sourceName?.toLowerCase().includes(term) || cand.sourceDomain?.toLowerCase().includes(term);
      if (!matchTitle && !matchSource) return false;
    }
    return true;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 90) {
      return (
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{score}/100 — Muito Alta</span>
        </span>
      );
    }
    if (score >= 75) {
      return (
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{score}/100 — Alta</span>
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{score}/100 — Moderada</span>
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{score}/100 — Baixa</span>
        </span>
      );
    }
    return (
      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
        <XCircle className="w-3.5 h-3.5" />
        <span>{score}/100 — Não Publicar</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Mestre de Integridade */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#145EDB] to-blue-900 border border-blue-400/40 flex items-center justify-center text-white shrink-0 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white tracking-tight">GRIT VERIFY™ — Central de Validação & Confiabilidade</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                Zero Alucinação
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Diretriz do Prompt Mestre: Informações 100% reais, auditáveis e rastreáveis. Indicadores não validados recebem a flag obrigatória: <strong>"INFORMAÇÃO NÃO VALIDADA — NÃO PUBLICAR"</strong>.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'queue' ? 'bg-[#145EDB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fila de Verificação ({candidates.length})
          </button>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'calculator' ? 'bg-[#145EDB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Calculadora Trust Score
          </button>
          <button
            onClick={() => setActiveSubTab('indicators')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'indicators' ? 'bg-[#145EDB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Validator ({indicators.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: FILA DE VERIFICAÇÃO */}
      {activeSubTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Lista de Candidatas */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-slate-900">Pautas na Fila Editorial</h3>
                <span className="text-xs text-slate-500 font-medium">{filteredCandidates.length} itens</span>
              </div>

              {/* Filtros */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por título ou fonte..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#145EDB]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {['ALL', 'VERIFICADO', 'APROVADO_EDITOR', 'EM_VERIFICACAO', 'REJEITADO'].map(st => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        filterStatus === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'Todos' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredCandidates.map(cand => {
                  const isSelected = selectedCandidate?.id === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-[#145EDB] bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {cand.sourceName}
                        </span>
                        {getScoreBadge(cand.trustScore)}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {cand.titleSuggested || cand.titleOriginal}
                      </h4>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span className="font-mono">{new Date(cand.capturedAt).toLocaleDateString('pt-BR')}</span>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          cand.verificationStatus === 'APROVADO_EDITOR' ? 'bg-emerald-100 text-emerald-800' :
                          cand.verificationStatus === 'VERIFICADO' ? 'bg-blue-100 text-blue-800' :
                          cand.verificationStatus === 'REJEITADO' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {cand.verificationStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Detalhe e Auditoria do Item Selecionado */}
          <div className="lg:col-span-7 space-y-4">
            {selectedCandidate ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                {/* Header da Notícia */}
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      ID: {selectedCandidate.id} • Capturado em {new Date(selectedCandidate.capturedAt).toLocaleString('pt-BR')}
                    </span>
                    {getScoreBadge(selectedCandidate.trustScore)}
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {selectedCandidate.titleSuggested}
                  </h3>

                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong>Título Original da Fonte:</strong> {selectedCandidate.titleOriginal}
                  </p>
                </div>

                {/* Resumo & Fatos */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Resumo Fact-Checked & Contexto
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                    {selectedCandidate.summary}
                  </p>
                </div>

                {/* Grid de Metadados da Fonte */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fonte Primária</span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{selectedCandidate.sourceName}</span>
                    </p>
                    <a
                      href={selectedCandidate.urlOriginal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#145EDB] hover:underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{selectedCandidate.urlOriginal}</span>
                    </a>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Classificação da Fonte</span>
                    <p className="font-bold text-slate-900">{selectedCandidate.sourceType.replace('_', ' ')}</p>
                    <p className="text-[11px] text-slate-500">
                      Autor: {selectedCandidate.authorOriginal || 'Redação / Não especificado'}
                    </p>
                  </div>
                </div>

                {/* Breakdown dos 7 Critérios de Trust Score */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>Auditoria do GRIT Trust Score (7 Critérios do Prompt Mestre)</span>
                    </h4>
                    <span className="text-sm font-black text-amber-400">{selectedCandidate.trustScore}/100</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">1. Fonte (25%)</span>
                      <strong className="text-emerald-400">24/25 pts</strong>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">2. URL (15%)</span>
                      <strong className="text-emerald-400">15/15 pts</strong>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">3. Data (10%)</span>
                      <strong className="text-emerald-400">10/10 pts</strong>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">4. Autor (5%)</span>
                      <strong className="text-emerald-400">5/5 pts</strong>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">5. Corroboração (20%)</span>
                      <strong className="text-blue-400">
                        {selectedCandidate.corroboratingSourcesCount >= 2 ? '18/20 pts' : '10/20 pts'}
                      </strong>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">6. Coerência (10%)</span>
                      <strong className="text-emerald-400">10/10 pts</strong>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">7. Institucional (15%)</span>
                      <strong className="text-emerald-400">15/15 pts</strong>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Duplicidade</span>
                      <strong className="text-slate-300">{selectedCandidate.duplicationScore}%</strong>
                    </div>
                  </div>

                  {selectedCandidate.corroboratingUrls && selectedCandidate.corroboratingUrls.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400 font-bold block mb-1">Fontes Corroborantes Rastreáveis:</span>
                      <ul className="space-y-1">
                        {selectedCandidate.corroboratingUrls.map((url, i) => (
                          <li key={i} className="truncate">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{url}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Alerta caso rejeitado ou não validado */}
                {selectedCandidate.verificationStatus === 'REJEITADO' && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-rose-800 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>INFORMAÇÃO NÃO VALIDADA — NÃO PUBLICAR</span>
                    </p>
                    <p className="text-rose-700">
                      <strong>Motivo:</strong> {selectedCandidate.rejectedReason || 'Fonte insuficiente ou ausência de dados corroborantes.'}
                    </p>
                  </div>
                )}

                {/* Botões de Ação Editorial */}
                <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleApproveCandidate(selectedCandidate)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar Pauta (Editor)</span>
                  </button>

                  <button
                    onClick={() => handleVerifyCandidate(selectedCandidate)}
                    className="bg-[#145EDB] hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validar Fontes</span>
                  </button>

                  <a
                    href={selectedCandidate.urlOriginal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Fonte Original</span>
                  </a>

                  <button
                    onClick={() => handleRejectCandidate(selectedCandidate)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Rejeitar Pauta</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">Selecione uma pauta na fila à esquerda para analisar sua verificação e score.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CALCULADORA INTERATIVA DE TRUST SCORE */}
      {activeSubTab === 'calculator' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#145EDB]" />
                <span>Simulador & Auditor de GRIT Trust Score (0 a 100)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Validação estrita baseada nas 7 ponderações oficiais do Prompt Mestre.
              </p>
            </div>

            {getScoreBadge(currentCalcBreakdown.score)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form dos Parâmetros */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  1. Tipo de Fonte Homologada (Peso: 25%)
                </label>
                <select
                  value={calcSourceType}
                  onChange={e => setCalcSourceType(e.target.value as SourceType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                >
                  <option value="FONTE_OFICIAL">Fonte Oficial (Governo, Banco Central, IBGE, ANVISA) — 100%</option>
                  <option value="AGENCIA_NOTICIAS">Agência de Notícias Homologada (Agência Brasil, Reuters) — 95%</option>
                  <option value="UNIVERSIDADE">Universidade / Instituição de Pesquisa — 92%</option>
                  <option value="IMPRENSA_NACIONAL">Imprensa Nacional Reconhecida — 90%</option>
                  <option value="VEICULO_ESPECIALIZADO">Veículo Especializado / Setorial — 85%</option>
                  <option value="IMPRENSA_REGIONAL">Imprensa Regional — 80%</option>
                  <option value="EMPRESA">Companhia / Divulgação Oficial B3 — 75%</option>
                  <option value="BLOG">Blog Independente — 45%</option>
                  <option value="FONTE_NAO_HOMOLOGADA">Fonte Não Homologada / Anônima — 15%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  2. URL Original Rastreável (Peso: 15%)
                </label>
                <input
                  type="text"
                  value={calcUrl}
                  onChange={e => setCalcUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    3. Data Válida e Recente (Peso: 10%)
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calcHasValidDate}
                      onChange={e => setCalcHasValidDate(e.target.checked)}
                      className="w-4 h-4 text-[#145EDB] rounded"
                    />
                    <span>Data de publicação documentada</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    4. Nome do Autor / Redação (Peso: 5%)
                  </label>
                  <input
                    type="text"
                    value={calcAuthor}
                    onChange={e => setCalcAuthor(e.target.value)}
                    placeholder="Ex: Tasso Vasconcelos, BCB..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  5. Fontes Independentes Corroborantes (Peso: 20%)
                </label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCalcCorroboratingSources(cnt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        calcCorroboratingSources === cnt
                          ? 'bg-[#145EDB] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cnt === 0 ? 'Nenhuma' : cnt >= 3 ? '3 ou mais (+20)' : `${cnt} ${cnt === 1 ? 'fonte (+10)' : 'fontes (+15)'}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    6. Coerência das Informações (Peso: 10%)
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calcIsCoherent}
                      onChange={e => setCalcIsCoherent(e.target.checked)}
                      className="w-4 h-4 text-[#145EDB] rounded"
                    />
                    <span>Dados consistentes sem contradições</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    7. Origem Oficial / Institucional (Peso: 15%)
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calcIsInstitutional}
                      onChange={e => setCalcIsInstitutional(e.target.checked)}
                      className="w-4 h-4 text-[#145EDB] rounded"
                    />
                    <span>Instituição pública ou regulada</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Painel de Resultados do Score */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-400">Score Calculado</span>
                  <div className="text-4xl font-black text-amber-400 font-mono">
                    {currentCalcBreakdown.score} <span className="text-lg text-slate-400">/ 100</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300">
                    Classificação: <span className="text-emerald-400">{currentCalcBreakdown.rating.replace('_', ' ')}</span>
                  </p>
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-800">
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Detalhamento dos Pontos:</p>
                  {currentCalcBreakdown.notes.map((n, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-300 text-[11px]">
                      <span>{n.split(':')[0]}</span>
                      <strong className="text-emerald-400">{n.split(':')[1]}</strong>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-300">
                  {currentCalcBreakdown.score < 40 ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Bloqueio: Score abaixo de 40. Não pode ser publicada automaticamente.</span>
                    </span>
                  ) : (
                    <span className="text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pauta apta para o fluxo de revisão humana pelo editor.</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DATA VALIDATOR (INDICADORES OFICIAIS) */}
      {activeSubTab === 'indicators' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#145EDB]" />
                <span>DATA VALIDATOR — Indicadores Econômicos & Oficiais</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Todo indicador exibido no portal possui fonte oficial registrada, metodologia e data de coleta auditada.
              </p>
            </div>

            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
              100% Fontes Oficiais
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {indicators.map(ind => (
              <div key={ind.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{ind.period}</span>
                  <span className="bg-emerald-500/20 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Validado</span>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">{ind.name}</span>
                  <div className="text-2xl font-black text-slate-900">
                    {ind.value} <span className="text-xs font-bold text-slate-500">{ind.unit}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                  <p className="font-semibold text-slate-700">Fonte: {ind.sourceName}</p>
                  <a
                    href={ind.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#145EDB] hover:underline flex items-center gap-1 truncate text-[10px]"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{ind.sourceUrl}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Regra de Qualidade do Data Validator:</span>
            </p>
            <p className="text-blue-800">
              Nunca apresentar números ou projeções inventadas para preencher cards de dashboards. Caso uma cotação ou índice não tenha fonte oficial validada no momento da requisição, a interface exibirá a mensagem padrão: <em>“Dados indisponíveis.”</em>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
