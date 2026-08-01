import React from 'react';
import { Building2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Partner } from '../../types';
import { Badge } from './Badge';

interface PartnerCardProps {
  partner: Partner;
  onSelectPartner?: (partner: Partner) => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onSelectPartner }) => {
  return (
    <div
      onClick={() => onSelectPartner && onSelectPartner(partner)}
      className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#145EDB] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <img
            src={partner.logo}
            alt={partner.name}
            className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] group-hover:scale-105 transition-transform"
          />
          <Badge variant={partner.partnershipTier === 'PREMIUM' ? 'orange' : 'primary'}>
            <ShieldCheck className="w-3 h-3 mr-1" />
            Parceiro {partner.partnershipTier}
          </Badge>
        </div>

        <h4 className="text-lg font-bold text-[#0B2343] group-hover:text-[#145EDB] transition-colors mb-1">
          {partner.name}
        </h4>
        <p className="text-xs font-semibold text-[#145EDB] mb-2">{partner.sector}</p>
        <p className="text-sm text-[#5C6B7A] line-clamp-2 mb-4">{partner.description}</p>
      </div>

      <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#10233F]">
        <span className="flex items-center gap-1 text-[#5C6B7A]">
          <Building2 className="w-3.5 h-3.5 text-[#145EDB]" />
          Ver perfil e matérias
        </span>
        <ExternalLink className="w-4 h-4 text-[#FF8500] group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
