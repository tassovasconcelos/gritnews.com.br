import React, { useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { AdCampaign, AdPlacementLocation } from '../../types';
import { getAds, recordAdImpression, recordAdClick } from '../../lib/storage';

interface AdBannerProps {
  location: AdPlacementLocation;
  categoryId?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ location, categoryId, className = '' }) => {
  const ads = getAds().filter(a => a.status === 'ACTIVE' && a.location === location);
  
  // Filter by category if specified
  const eligibleAds = categoryId 
    ? ads.filter(a => !a.categoryId || a.categoryId === categoryId) 
    : ads;

  const activeAd: AdCampaign | undefined = eligibleAds[0] || ads[0];

  useEffect(() => {
    if (activeAd) {
      recordAdImpression(activeAd.id);
    }
  }, [activeAd?.id]);

  if (!activeAd) {
    // Return fallback AdSense simulation slot or empty
    return (
      <div className={`p-4 bg-[#F7F9FC] border border-dashed border-[#E2E8F0] rounded-xl text-center text-xs text-[#5C6B7A] ${className}`}>
        <div className="flex items-center justify-center gap-1.5 font-medium text-gray-500 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#145EDB]" />
          <span>Publicidade GRIT NEWS</span>
        </div>
        <p>Espaço reservado para campanhas parceiras ou Google AdSense</p>
      </div>
    );
  }

  const handleClick = () => {
    recordAdClick(activeAd.id);
    if (activeAd.targetUrl) {
      window.open(activeAd.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (activeAd.type === 'ADSENSE_CODE' && activeAd.codeSnippet) {
    return (
      <div className={`p-2 bg-white rounded-xl border border-[#E2E8F0] text-center ${className}`}>
        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Publicidade</span>
        <div dangerouslySetInnerHTML={{ __html: activeAd.codeSnippet }} />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative overflow-hidden bg-gradient-to-r from-[#0B2343] to-[#145EDB] text-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-[#145EDB]/20 ${className}`}
    >
      <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider flex items-center gap-1">
        <span>Patrocinado</span>
        <ExternalLink className="w-3 h-3" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {activeAd.imageUrl && (
          <img
            src={activeAd.imageUrl}
            alt={activeAd.headline || activeAd.name}
            className="w-full md:w-48 h-32 object-cover rounded-xl border border-white/20 group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="flex-1">
          <p className="text-xs text-[#EAF3FF] font-semibold mb-1 uppercase tracking-wide">
            {activeAd.advertiserName}
          </p>
          <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#EAF3FF] transition-colors leading-tight">
            {activeAd.headline || activeAd.name}
          </h4>
          {activeAd.bodyText && (
            <p className="text-sm text-gray-200 line-clamp-2">{activeAd.bodyText}</p>
          )}
        </div>
        <div className="shrink-0">
          <button className="bg-[#FF8500] hover:bg-[#e07500] text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center gap-2 group-hover:translate-x-1">
            <span>Saiba Mais</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
