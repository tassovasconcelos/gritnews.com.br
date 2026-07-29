import React, { useEffect } from 'react';
import { ExternalLink, Sparkles, DollarSign } from 'lucide-react';
import { AdCampaign, AdPlacementLocation } from '../../types';
import { getAds, recordAdImpression, recordAdClick, getSiteSettings } from '../../lib/storage';

interface AdBannerProps {
  location: AdPlacementLocation;
  categoryId?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({ location, categoryId, className = '' }) => {
  const settings = getSiteSettings();
  const adClientId = settings.adSenseClientId || 'ca-pub-9694565734615841';

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

  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      // AdSense already initialized or blocked by browser extension
    }
  }, [location, categoryId]);

  if (!activeAd) {
    // Return Google AdSense responsive container with subtle, soft light branding
    return (
      <div className={`bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 sm:p-4 text-center text-xs text-slate-500 shadow-xs ${className}`}>
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#145EDB]" />
            <span>Publicidade Google AdSense</span>
          </div>
          <span className="text-[9px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            Anúncio Programático
          </span>
        </div>

        {/* AdSense ins container */}
        <div className="min-h-[90px] flex items-center justify-center bg-white rounded-xl p-2 border border-[#E2E8F0] my-1 overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client={adClientId}
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        </div>

        <p className="text-[10px] text-slate-400 mt-1">
          Espaço de mídias verificado via Google AdSense & Parcerias B2B
        </p>
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
      <div className={`p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm ${className}`}>
        <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">Publicidade Google AdSense</span>
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
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800";
            }}
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
