import React from 'react';
import { Tag, ExternalLink, ShieldAlert, ArrowUpRight, Copy, Check } from 'lucide-react';
import { Offer } from '../../types';
import { Badge } from './Badge';
import { incrementOfferClicks } from '../../lib/storage';
import { trackEvent } from '../../lib/analytics';

interface OfferCardProps {
  offer: Offer;
  onOpenLeadModal?: (offer: Offer) => void;
  onShowToast?: (msg: string) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onOpenLeadModal, onShowToast }) => {
  const [copiedCoupon, setCopiedCoupon] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    incrementOfferClicks(offer.id);
    trackEvent('offer_click', { offerId: offer.id });

    if (offer.type === 'LEAD_QUOTE' && onOpenLeadModal) {
      e.preventDefault();
      onOpenLeadModal(offer);
    }
  };

  const copyCoupon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (offer.couponCode && navigator.clipboard) {
      navigator.clipboard.writeText(offer.couponCode);
      setCopiedCoupon(true);
      if (onShowToast) onShowToast(`Cupom ${offer.couponCode} copiado!`);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const formattedPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="group bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:border-[#145EDB] hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={offer.image}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {offer.badgeText && (
          <div className="absolute top-3 left-3">
            <Badge variant="orange" size="md">
              {offer.badgeText}
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-[#0B2343] border border-[#E2E8F0]">
          {offer.type === 'AFFILIATE' && 'Parceiro Afiliado'}
          {offer.type === 'INFOPRODUCT' && 'Infoproduto'}
          {offer.type === 'PRODUCT' && 'Produto B2B'}
          {offer.type === 'LEAD_QUOTE' && 'Orçamento Especial'}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h4 className="text-lg font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-2 line-clamp-2">
          {offer.title}
        </h4>
        <p className="text-sm text-[#5C6B7A] line-clamp-2 mb-4 flex-1">
          {offer.shortDescription}
        </p>

        {offer.couponCode && (
          <div className="mb-4 bg-[#F7F9FC] border border-dashed border-[#145EDB] rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#FF8500]" />
              <span className="text-xs font-bold text-[#0B2343]">Cupom: {offer.couponCode}</span>
            </div>
            <button
              onClick={copyCoupon}
              className="text-xs font-bold text-[#145EDB] hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-[#E2E8F0]"
            >
              {copiedCoupon ? <Check className="w-3.5 h-3.5 text-[#22A06B]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCoupon ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] mt-auto">
          <div>
            {offer.originalPrice && (
              <span className="text-xs text-gray-400 line-through block font-medium">
                {formattedPrice(offer.originalPrice)}
              </span>
            )}
            <span className="text-lg font-extrabold text-[#0B2343]">
              {offer.promoPrice ? formattedPrice(offer.promoPrice) : 'Sob Consulta'}
            </span>
          </div>

          <a
            href={offer.affiliateUrl}
            target={offer.type === 'LEAD_QUOTE' ? '_self' : '_blank'}
            rel="noopener noreferrer"
            onClick={handleClick}
            className="bg-[#FF8500] hover:bg-[#e07500] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md group-hover:translate-x-0.5"
          >
            <span>{offer.type === 'LEAD_QUOTE' ? 'Solicitar' : 'Aproveitar'}</span>
            {offer.type === 'LEAD_QUOTE' ? <ArrowUpRight className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
          </a>
        </div>

        {offer.type === 'AFFILIATE' && (
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-gray-400" />
            Link de comissionamento de parceiro
          </p>
        )}
      </div>
    </div>
  );
};
