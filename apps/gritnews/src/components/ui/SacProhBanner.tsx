import React, { useState } from 'react';
import { Stethoscope, ExternalLink, Copy, Check, Share2, ShieldCheck, Headphones, MessageSquare, ArrowRight } from 'lucide-react';

interface SacProhBannerProps {
  onNavigateSacProh?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  variant?: 'full' | 'compact';
}

export const SacProhBanner: React.FC<SacProhBannerProps> = ({
  onNavigateSacProh,
  onShowToast,
  variant = 'full'
}) => {
  const [copied, setCopied] = useState(false);
  const sacprohUrl = 'https://sacproh.gritnews.com.br';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sacprohUrl);
    setCopied(true);
    onShowToast('Link do SACPROH copiado com sucesso! (sacproh.gritnews.com.br)');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Conheça o novo Portal SACPROH - Sistema de Atendimento e Ouvidoria ProCirúrgica: ${sacprohUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-5 border border-sky-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600/30 border border-sky-400/40 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-500/30 uppercase tracking-wider">
                  Divulgação Oficial
                </span>
                <span className="text-xs font-mono text-sky-400 font-semibold">sacproh.gritnews.com.br</span>
              </div>
              <h4 className="text-base font-extrabold text-white mt-0.5">Novo Portal SACPROH - Ouvidoria ProCirúrgica</h4>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateSacProh && (
              <button
                onClick={onNavigateSacProh}
                className="flex-1 sm:flex-initial bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Acessar Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="bg-white/10 hover:bg-white/20 text-sky-200 font-bold px-3 py-2 rounded-xl text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copiar Link de Divulgação"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-br from-[#0F172A] via-[#0369A1] to-[#0F172A] text-white rounded-3xl p-6 md:p-8 border border-sky-400/30 shadow-2xl relative overflow-hidden my-8">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column Info */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-200 text-xs font-bold px-3 py-1 rounded-full border border-sky-400/30">
            <ShieldCheck className="w-4 h-4 text-sky-300" />
            <span>Portal Oficial do Ecossistema GRIT</span>
            <span className="bg-sky-400 text-slate-950 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded">
              DIVULGAÇÃO
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
            Novo Portal <span className="text-sky-300">SACPROH</span>: Atendimento & Ouvidoria ProCirúrgica
          </h3>

          <p className="text-sm md:text-base text-sky-100/90 leading-relaxed font-normal">
            Canal exclusivo para clientes, distribuidores e parceiros hospitalares. Acompanhe protocolos de atendimento, abra chamados técnicos, consulte orientações cirúrgicas e fale diretamente com a equipe técnica ProCirúrgica.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <Headphones className="w-5 h-5 text-sky-300 mb-1" />
              <h5 className="text-xs font-extrabold text-white">Atendimento 24/7</h5>
              <p className="text-[11px] text-sky-200/80">Protocolos com rastreio em tempo real</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <MessageSquare className="w-5 h-5 text-emerald-300 mb-1" />
              <h5 className="text-xs font-extrabold text-white">Ouvidoria Direta</h5>
              <p className="text-[11px] text-sky-200/80">Canal direto de solução de demandas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <Stethoscope className="w-5 h-5 text-amber-300 mb-1" />
              <h5 className="text-xs font-extrabold text-white">ProCirúrgica</h5>
              <p className="text-[11px] text-sky-200/80">Produtos cirúrgicos & hospitalares</p>
            </div>
          </div>
        </div>

        {/* Right Column Links & Disclosure Actions */}
        <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-sky-400/40 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-sky-800/50">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">Endereço de Acesso Principal</span>
            <span className="text-xs font-mono bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-700/50">
              SSL Segura
            </span>
          </div>

          <div className="bg-black/40 rounded-xl p-3 border border-sky-500/30 flex items-center justify-between gap-2">
            <div className="truncate text-xs font-mono text-emerald-300 font-bold">
              {sacprohUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {onNavigateSacProh && (
              <button
                onClick={onNavigateSacProh}
                className="w-full bg-gradient-to-r from-sky-400 to-emerald-400 hover:from-sky-300 hover:to-emerald-300 text-slate-950 font-black py-3 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Stethoscope className="w-4 h-4 text-slate-950" />
                <span>Navegar para o Portal SACPROH</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <a
              href={sacprohUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-white/20"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
              <span>Abrir em nova aba (sacproh.gritnews.com.br)</span>
            </a>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                <Share2 className="w-3 h-3" />
                <span>Divulgar no WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="bg-slate-800 hover:bg-slate-700 text-sky-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border border-slate-700"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar Link Divulgação</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
