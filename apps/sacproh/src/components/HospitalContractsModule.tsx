import React from 'react';
import {
  Building2,
  Phone,
  Award,
  Zap
} from 'lucide-react';
import { SacProhHospitalContract } from '@gritnews/types';

interface HospitalContractsModuleProps {
  contracts: SacProhHospitalContract[];
  onOpenNewTicket: () => void;
}

export const HospitalContractsModule: React.FC<HospitalContractsModuleProps> = ({
  contracts,
  onOpenNewTicket
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Contratos Hospitalares SLA & Parcerias SaaS</h2>
            <p className="text-xs text-slate-400">
              Rede de hospitais atendidos com garantia estendida e suporte dedicado 24h
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contracts.map(contract => (
          <div
            key={contract.id}
            className="bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 space-y-4 shadow-xl transition-all relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  {contract.contractTier}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">{contract.hospitalName}</h3>
                <span className="text-xs text-slate-500 font-mono">CNPJ: {contract.cnpj}</span>
              </div>
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Equipamentos Ativos:</span>
                <strong className="text-white text-sm font-bold">{contract.activeEquipmentsCount} Unidades</strong>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Manutenções no Ano:</span>
                <strong className="text-emerald-400 font-bold">{contract.preventiveMaintenanceCount} Realizadas</strong>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">SLA Emergencial:</span>
                <strong className="text-sky-300 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Até {contract.emergencySlaHours}h Presencial
                </strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div><strong>Responsável Clínico:</strong> {contract.contactPerson}</div>
              <div className="flex items-center gap-1.5 text-sky-300">
                <Phone className="w-3.5 h-3.5" />
                <span>{contract.phone}</span>
              </div>
            </div>

            <button
              onClick={onOpenNewTicket}
              className="w-full bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
            >
              Abrir Chamado para Este Hospital
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
