/**
 * ============================================================================
 * BANCO DE OPORTUNIDADES COMERCIAIS & B2B — GRIT NEWS 2.0
 * ============================================================================
 * 
 * Mapeamento de oportunidades de negócios reais geradas a partir de notícias
 * validadas (infraestrutura, saúde, imóveis no Eusébio, fornecedores, energia solar).
 */

import React, { useState } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  Building2, 
  MapPin, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Filter, 
  Plus, 
  Search,
  ExternalLink,
  Tag
} from 'lucide-react';
import { GritOpportunity, UserRole } from '../../types';
import { getGritOpportunities } from '../../lib/gritVerify';

interface AdminOpportunitiesProps {
  currentRole: UserRole;
  currentUserName: string;
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminOpportunities: React.FC<AdminOpportunitiesProps> = ({
  currentRole,
  currentUserName,
  onRefreshData,
  onShowToast
}) => {
  const [opportunities, setOpportunities] = useState<GritOpportunity[]>(() => getGritOpportunities());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = opportunities.filter(opp => {
    if (filterType !== 'ALL' && opp.opportunityType !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = opp.originTitle.toLowerCase().includes(term);
      const matchDesc = opp.description.toLowerCase().includes(term);
      const matchTarget = opp.targetIndustry.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchTarget) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Banco de Oportunidades & Inteligência B2B</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              {opportunities.length} Oportunidades Mapeadas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração de valor comercial e prospecção de parceiros a partir de fatos reais do ecossistema econômico.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Pesquisar por pauta de origem, setor alvo ou descrição..."
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
          <option value="ALL">Todos os Segmentos</option>
          <option value="FORNECEDORES">Fornecedores & Cadeia Produtiva</option>
          <option value="IMOBILIARIO">Mercado Imobiliário</option>
          <option value="ENERGIA_SOLAR">Energia Solar & Sustentabilidade</option>
          <option value="TECNOLOGIA">Tecnologia & Inovação</option>
          <option value="PET_CARE">Pet Care & Veterinária</option>
        </select>
      </div>

      {/* Cards de Oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(opp => (
          <div key={opp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="bg-blue-50 text-[#145EDB] border border-blue-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {opp.opportunityType.replace('_', ' ')}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                opp.status === 'LEADS_GERADOS' ? 'bg-emerald-100 text-emerald-800' :
                opp.status === 'EM_PROSPECCAO' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {opp.status.replace('_', ' ')}
              </span>
            </div>

            <h3 className="text-sm font-black text-slate-900 leading-snug">
              {opp.originTitle}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {opp.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Setor Alvo</span>
                <strong className="text-slate-800 text-[11px] block truncate">{opp.targetIndustry}</strong>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Potencial Estimado</span>
                <strong className="text-emerald-700 text-[11px] block">{opp.estimatedMarketValue || 'Sob Consulta'}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{opp.city ? `${opp.city} - ${opp.state}` : 'Brasil'}</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Users className="w-3 h-3 text-slate-400" />
                <span>{opp.potentialPartnersCount} Parceiros Mapeados</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
