import React, { useState } from 'react';
import { Tag, Search, ArrowLeft, ShieldAlert, Sparkles, Filter, ShoppingBag, ArrowRight, Check, Zap } from 'lucide-react';
import { Offer, Category } from '../../types';
import { OfferCard } from '../ui/OfferCard';
import { NewsletterBlock } from '../ui/NewsletterBlock';
import { AmazonShopSection } from '../ui/AmazonShopSection';
import { COMMERCIAL_PRODUCTS } from '../../data/commercialProducts';

interface OffersViewProps {
  offers: Offer[];
  categories: Category[];
  onBackToHome: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string) => void;
  onNavigateCheckout?: (productId?: string) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({
  offers,
  categories,
  onBackToHome,
  onOpenLeadModal,
  onShowToast,
  onNavigateCheckout
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Portal</span>
          </button>

          <div className="flex items-center gap-2 bg-[#FF8500] text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider w-fit">
            <Tag className="w-3.5 h-3.5" />
            <span>Descontos & Oportunidades Comerciais</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Central de Produtos, Serviços e Ofertas GRIT NEWS
          </h1>
          <p className="text-sm md:text-base text-[#EAF3FF] max-w-2xl leading-relaxed">
            Adquira produtos digitais, planos publicitários, pacotes imobiliários e licenças com fechamento centralizado pelo Mercado Pago e PIX oficial.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-10">
        
        {/* SEÇÃO ESPECIAL: PRODUTOS PRÓPRIOS COM CHECKOUT MERCADO PAGO */}
        {onNavigateCheckout && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Produtos & Serviços Nativos GRIT</span>
                </div>
                <h2 className="text-2xl font-black text-[#0B2343]">
                  Compre com Fechamento Oficial Mercado Pago
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Pague com PIX com desconto instantâneo ou parcele em até 12x no cartão de crédito com segurança máxima.
                </p>
              </div>

              <button
                onClick={() => onNavigateCheckout()}
                className="px-5 py-3 bg-[#0B2343] hover:bg-[#145EDB] text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <span>Ver Todos no Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {COMMERCIAL_PRODUCTS.slice(0, 3).map(prod => (
                <div
                  key={prod.id}
                  className="bg-[#F7F9FC] border border-slate-200 hover:border-[#145EDB] rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md group"
                >
                  <div className="space-y-3">
                    {prod.image && (
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-full h-36 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase bg-white px-2 py-0.5 rounded text-[#145EDB] border border-slate-200">
                        {prod.category}
                      </span>
                      {prod.badge && (
                        <span className="text-[10px] font-extrabold uppercase bg-[#FF8500]/10 text-[#FF8500] px-2 py-0.5 rounded">
                          {prod.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-[#0B2343] group-hover:text-[#145EDB] transition-colors line-clamp-1">
                      {prod.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {prod.subtitle}
                    </p>

                    <div className="space-y-1 pt-1">
                      {prod.benefits.slice(0, 2).map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="line-clamp-1">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      {prod.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through block">
                          R$ {prod.originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-base font-black text-[#0B2343]">
                        R$ {prod.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigateCheckout(prod.id)}
                      className="px-3.5 py-2 bg-[#FF8500] hover:bg-[#e07500] text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Comprar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Type Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar ofertas parceiras, cupons ou produtos..."
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Amazon Shop Section */}
        <AmazonShopSection onShowToast={onShowToast} />

        <NewsletterBlock sourcePage="Central de Ofertas" onSuccessToast={onShowToast} />
      </div>
    </div>
  );
};
