import React from 'react';
import { 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  BookOpen, 
  HeartPulse 
} from 'lucide-react';

interface PlaybookPromoBannerProps {
  onNavigatePlaybook: () => void;
}

export const PlaybookPromoBanner: React.FC<PlaybookPromoBannerProps> = ({ onNavigatePlaybook }) => {
  return (
    <section className="bg-gradient-to-br from-emerald-950 via-slate-900 to-[#0B2343] text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl border border-emerald-500/20">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Copy & Features */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Infoproduto Editorial GRIT Saúde</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>Edição Oficial 2026</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            Playbook de Emagrecimento Saudável: <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Ciência, Rotina Prática & Queima de Gordura Real
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            O método passo a passo estruturado pela curadoria de saúde do GRIT NEWS para secar sem dietas malucas, recuperando energia metabólica, sono profundo e vitalidade duradoura.
          </p>

          {/* Key Deliverables Checkpoints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Protocolo de 30 Dias sem passar fome</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Guia de Chás & Fitoterápicos Seguros</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lista de Compras Econômica para Feira/Supermercado</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>4 Bônus Exclusivos + Acesso Vitalício</span>
            </div>
          </div>
        </div>

        {/* Right CTA / Offer Box */}
        <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center space-y-4 shadow-xl">
          <div className="inline-block p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30">
            <BookOpen className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs text-slate-400 line-through font-bold">De R$ 97,00</span>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span className="text-xs text-emerald-400 font-bold">Por apenas</span>
              <span className="text-3xl sm:text-4xl font-black text-white">R$ 29,90</span>
            </div>
            <p className="text-[11px] text-emerald-300 font-bold mt-1">Pagamento Único • Liberação Imediata</p>
          </div>

          <button
            onClick={onNavigatePlaybook}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/40 cursor-pointer"
          >
            <span>Conhecer o Playbook</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-medium pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Garantia Incondicional 7 Dias
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Download em PDF
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
