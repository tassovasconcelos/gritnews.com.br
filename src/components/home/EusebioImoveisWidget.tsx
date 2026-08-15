import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle 
} from 'lucide-react';
import { EusebioProperty } from '../../types';
import { getEusebioProperties } from '../../lib/storage';

interface EusebioImoveisWidgetProps {
  onNavigateImoveis: () => void;
  onShowToast: (msg: string) => void;
}

export const EusebioImoveisWidget: React.FC<EusebioImoveisWidgetProps> = ({ 
  onNavigateImoveis,
  onShowToast 
}) => {
  const [properties] = useState<EusebioProperty[]>(() => {
    const all = getEusebioProperties();
    return all.filter(p => p.featured).slice(0, 3);
  });

  const handleOpenWhatsApp = (prop: EusebioProperty, e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneClean = prop.realtor.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${prop.realtor.name}! Vi o anúncio do imóvel "${prop.title}" (R$ ${prop.price.toLocaleString('pt-BR')}) no portal GRIT NEWS e gostaria de agendar uma visita ou receber mais informações.`
    );
    window.open(`https://wa.me/${phoneClean}?text=${message}`, '_blank');
    onShowToast('Redirecionando para o WhatsApp do corretor credenciado...');
  };

  return (
    <section className="bg-gradient-to-br from-[#0B2343] via-[#0E2D55] to-[#145EDB] text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-xl border border-white/10">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Radar Imobiliário Eusébio 2026</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
            Imóveis de Alto Padrão no Eusébio & Alphaville
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Casas em condomínio fechado, lotes exclusivos e oportunidades na região com maior valorização imobiliária do Ceará.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              onNavigateImoveis();
              setTimeout(() => {
                const target = document.getElementById('roi-calculator-section');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
          >
            <span>Simulador de ROI</span>
          </button>

          <button
            onClick={onNavigateImoveis}
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
          >
            <span>Ver Imóveis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties.map(prop => (
          <div
            key={prop.id}
            onClick={onNavigateImoveis}
            className="group cursor-pointer bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 hover:border-emerald-400/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 overflow-hidden bg-slate-900">
                <img
                  src={prop.images[0]}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm">
                    {prop.purpose === 'venda' ? 'Venda' : 'Locação'}
                  </span>
                  {prop.verified && (
                    <span className="px-2 py-1 bg-[#0B2343]/80 backdrop-blur-xs text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-400/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verificado</span>
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{prop.neighborhood}</span>
                  </p>
                  <p className="text-xl font-black text-white mt-0.5">
                    R$ {prop.price.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-emerald-300 transition-colors">
                  {prop.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1.5 leading-relaxed">
                  {prop.description}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.bedrooms} qts ({prop.suites} st)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.garageSpots} vagas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.areaTotal}m²</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={(e) => handleOpenWhatsApp(prop, e)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com Corretor no WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
