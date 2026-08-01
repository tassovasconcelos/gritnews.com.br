import React from 'react';
import {
  Stethoscope,
  ShieldCheck,
  MessageSquare,
  ArrowLeft,
  FileText,
  PlusCircle,
  Box,
  Wrench,
  Building2,
  HelpCircle,
  Activity,
  BarChart3
} from 'lucide-react';

export type SacProhTab = 'tickets' | 'dashboard' | 'new-ticket' | 'catalog' | 'maintenance' | 'contracts' | 'faqs';

interface SacProhHeaderProps {
  activeTab: SacProhTab;
  setActiveTab: (tab: SacProhTab) => void;
  ticketsCount: number;
  onNavigateHome?: () => void;
}

export const SacProhHeader: React.FC<SacProhHeaderProps> = ({
  activeTab,
  setActiveTab,
  ticketsCount,
  onNavigateHome
}) => {
  return (
    <header className="bg-slate-950 border-b border-sky-900/50 sticky top-0 z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer"
              title="Voltar ao portal principal GRIT NEWS"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>GRIT NEWS</span>
            </button>
          )}

          {onNavigateHome && <div className="h-4 w-px bg-slate-800 hidden sm:block" />}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-sky-900/40">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">ProCirúrgica</span>
                <span className="bg-sky-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  SACPROH SaaS
                </span>
              </div>
              <p className="text-[11px] text-sky-400 font-medium leading-none">Suporte Hospitalar & Engenharia Clínica</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold">Plantão Centro Cirúrgico 24/7 Ativo</span>
          </div>

          <a
            href="https://wa.me/5585991234455?text=Olá,%20preciso%20de%20atendimento%20urgente%20ProCirúrgica%20SACPROH"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Plantão</span>
          </a>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="bg-slate-900 border-t border-slate-800 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 py-2">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Chamados ({ticketsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Dashboard & Métricas BI</span>
          </button>

          <button
            onClick={() => setActiveTab('new-ticket')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'new-ticket'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Abrir Chamado SACPROH</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Catálogo & ANVISA</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'maintenance'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Engenharia & Calibração</span>
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'contracts'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Contratos Hospitalares SLA</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'faqs'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ & Ajuda</span>
          </button>
        </div>
      </div>
    </header>
  );
};
