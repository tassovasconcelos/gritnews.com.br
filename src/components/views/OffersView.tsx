import React, { useState } from 'react';
import { Tag, Search, ArrowLeft, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { Offer, Category } from '../../types';
import { OfferCard } from '../ui/OfferCard';
import { NewsletterBlock } from '../ui/NewsletterBlock';

interface OffersViewProps {
  offers: Offer[];
  categories: Category[];
  onBackToHome: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({
  offers,
  categories,
  onBackToHome,
  onOpenLeadModal,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const offerTypes = [
    { label: 'Todos', value: null },
    { label: 'Softwares & ERP', value: 'PRODUCT' },
    { label: 'Parceiros Afiliados', value: 'AFFILIATE' },
    { label: 'Cursos & Treinamentos', value: 'INFOPRODUCT' },
    { label: 'Orçamentos Especiais', value: 'LEAD_QUOTE' }
  ];

  const filteredOffers = offers.filter(o => {
    const matchesSearch = searchQuery === '' ||
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === null || o.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B2343] via-[#145EDB] to-[#0B2343] text-white py-12 px-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Portal</span>
          </button>

          <div className="flex items-center gap-2 bg-[#FF8500] text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider w-fit">
            <Tag className="w-3.5 h-3.5" />
            <span>Descontos & Oportunidades B2B</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Central de Ofertas e Parceiros GRIT NEWS
          </h1>
          <p className="text-sm md:text-base text-[#EAF3FF] max-w-2xl leading-relaxed">
            Acesse licenças de softwares, consultorias de inteligência de mercado, cursos e equipamentos selecionados com condições especiais para leitores.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search & Type Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs mb-8">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar ofertas, cupons ou produtos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
            <span className="text-xs font-bold text-gray-500 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Tipo:
            </span>
            {offerTypes.map(t => (
              <button
                key={t.label}
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedType === t.value
                    ? 'bg-[#FF8500] text-white shadow-xs'
                    : 'bg-[#F7F9FC] text-[#5C6B7A] hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredOffers.map(offer => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onOpenLeadModal={onOpenLeadModal}
              onShowToast={onShowToast}
            />
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#0B2343] mb-2">Nenhuma oferta encontrada</h3>
            <p className="text-sm text-[#5C6B7A]">Tente alterar seus termos de busca.</p>
          </div>
        )}

        <NewsletterBlock sourcePage="Central de Ofertas" onSuccessToast={onShowToast} />
      </div>
    </div>
  );
};
