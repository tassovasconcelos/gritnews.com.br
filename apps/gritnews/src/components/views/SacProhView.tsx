import React from 'react';
import { Stethoscope, ExternalLink, ShieldCheck, ArrowRight, Activity, Wrench, Building2 } from 'lucide-react';
import { SACPROH_DOMAIN } from '@gritnews/config';

interface SacProhViewProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
  onNavigateHome: () => void;
}

export const SacProhView: React.FC<SacProhViewProps> = ({ onNavigateHome }) => {
  const sacprohUrl = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
    ? 'http://localhost:3000?app=sacproh'
    : `https://${SACPROH_DOMAIN}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="bg-slate-950 border border-sky-900/60 p-8 rounded-3xl shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 mx-auto">
          <Stethoscope className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-2xl mx-auto">
          <span className="bg-sky-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            SISTEMA SACPROH
          </span>
          <h1 className="text-3xl font-black text-white">ProCirúrgica SACPROH SaaS</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Portal exclusivo de Suporte Hospitalar, Chamados Técnicos de Engenharia Clínica e Gestão de Contratos de Alta Complexidade.
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href={sacprohUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-xl transition-all cursor-pointer"
          >
            <span>Acessar Portal SACPROH em {SACPROH_DOMAIN}</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onNavigateHome}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors cursor-pointer border border-slate-800"
          >
            Voltar ao GRIT NEWS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
          <Activity className="w-6 h-6 text-sky-400" />
          <h3 className="font-bold text-white text-base">Chamados & Suporte 24/7</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Abertura de chamados com protocolo único e plantão emergencial cirúrgico ativado em até 15 minutos.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
          <Wrench className="w-6 h-6 text-emerald-400" />
          <h3 className="font-bold text-white text-base">Engenharia Clínica & Calibração</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Laudos RDC/ANVISA, certificação de segurança elétrica IEC 60601 e calibração periódica RBC.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
          <Building2 className="w-6 h-6 text-amber-400" />
          <h3 className="font-bold text-white text-base">Gestão de Contratos SLA</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mapeamento de unidades ativas, relatórios de manutenção preventiva e telemetria BI por hospital.
          </p>
        </div>
      </div>
    </div>
  );
};
