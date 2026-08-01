import React from 'react';
import {
  Wrench,
  ShieldCheck,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

interface EngineeringModuleProps {
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  onOpenNewTicket: () => void;
}

export const EngineeringModule: React.FC<EngineeringModuleProps> = ({
  onShowToast,
  onOpenNewTicket
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Engenharia Clínica & Calibração RBC/ANVISA</h2>
              <p className="text-xs text-slate-400">
                Gestão da segurança de equipamentos médico-hospitalares do centro cirúrgico
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewTicket}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar Calibração Anual</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">Calibrações em Dia</span>
            <span className="text-2xl font-black text-emerald-400">98.4%</span>
            <span className="text-[10px] text-slate-500 block">Em conformidade RDC 50 ANVISA</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">SLA Médio de Atendimento</span>
            <span className="text-2xl font-black text-sky-400">1.8 Horas</span>
            <span className="text-[10px] text-slate-500 block">Plantão de Emergência Ativo</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">Certificados Aferidos (RBC)</span>
            <span className="text-2xl font-black text-purple-400">1.240+</span>
            <span className="text-[10px] text-slate-500 block">Laudos assinados por Engenheiro Biomédico</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">Equipe Técnica Alocada</span>
            <span className="text-2xl font-black text-amber-400">24 Especialistas</span>
            <span className="text-[10px] text-slate-500 block">Treinados nas fábricas matrizes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Manutenção Preventiva Programada</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Testes elétricos, troca de baterias de suporte e aferição da saída de potência dos bisturis e geradores eletrocirúrgicos antes de falhas operacionais.
          </p>
          <button
            onClick={() => onShowToast('Solitação de plano preventivo anual enviada!', 'success')}
            className="text-xs text-sky-400 font-bold underline cursor-pointer"
          >
            Solicitar Cronograma Anual
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Laudos Técnicos RDC & Rastreabilidade</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Emissão instantânea de Laudo de Segurança Elétrica (IEC 60601-1) e calibração de fluxo de gases e autoclaves para auditorias de acreditação ONA/JCI.
          </p>
          <button
            onClick={() => onShowToast('Acesse o portal de laudos na aba de chamados.', 'info')}
            className="text-xs text-emerald-400 font-bold underline cursor-pointer"
          >
            Baixar Modelos de Certificado
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Treinamento Operacional ao Corpo Médico</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Workshop presencial ou online para enfermeiros de bloco cirúrgico e instrumentadores referente ao uso correto e higienização do instrumental.
          </p>
          <button
            onClick={() => onShowToast('Treinamento agendado junto ao SACPROH.', 'success')}
            className="text-xs text-purple-400 font-bold underline cursor-pointer"
          >
            Agendar Treinamento para Equipe
          </button>
        </div>
      </div>
    </div>
  );
};
