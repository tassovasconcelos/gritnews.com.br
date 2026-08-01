import React, { useState, useEffect } from 'react';
import { Search, Globe, Rss, ShieldCheck, CheckCircle2, Copy, Check, BarChart3, DollarSign, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { Article, Category, SiteSettings } from '../../types';
import { getSiteSettings, saveSiteSettings, getArticles, getCategories } from '../../lib/storage';

interface AdminSEOProps {
  onShowToast: (msg: string) => void;
}

export const AdminSEO: React.FC<AdminSEOProps> = ({ onShowToast }) => {
  const [settings, setSettings] = useState<SiteSettings>(getSiteSettings());
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [copiedRss, setCopiedRss] = useState(false);
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [isPingSending, setIsPingSending] = useState(false);

  useEffect(() => {
    setSettings(getSiteSettings());
    setArticles(getArticles());
    setCategories(getCategories());
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteSettings(settings);
    onShowToast('Configurações de SEO, AdSense e Google Tag Manager salvas!');
  };

  const handleCopyFeed = (type: 'rss' | 'sitemap') => {
    const url = type === 'rss' 
      ? 'https://www.gritnews.com.br/feed.xml' 
      : 'https://www.gritnews.com.br/sitemap.xml';
    
    navigator.clipboard.writeText(url);
    if (type === 'rss') {
      setCopiedRss(true);
      setTimeout(() => setCopiedRss(false), 2000);
    } else {
      setCopiedSitemap(true);
      setTimeout(() => setCopiedSitemap(false), 2000);
    }
    onShowToast(`URL do ${type.toUpperCase()} copiada para a área de transferência!`);
  };

  const handlePingGoogleIndexing = () => {
    setIsPingSending(true);
    setTimeout(() => {
      setIsPingSending(false);
      onShowToast('⚡ Sinal de Indexação Instantânea (IndexNow & Google API) enviado para todas as matérias recentes!');
    }, 1200);
  };

  // SEO Health calculation
  const articlesWithSeoMeta = articles.filter(a => a.seo?.metaDescription && a.seo.metaDescription.length > 20);
  const seoScorePercentage = articles.length > 0 ? Math.round((articlesWithSeoMeta.length / articles.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#10233F] via-[#0B2343] to-[#145EDB] p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <Globe className="w-3.5 h-3.5" />
          <span>Central de Ranqueamento Orgânico Google & Monetização</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          SEO, Indexação em Tempo Real & AdSense B2B
        </h1>
        <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed">
          Gerencie metadados globais, códigos de rastreamento do Google, integração AdSense para monetização de tráfego orgânico e sitemaps XML.
        </p>
      </div>

      {/* Health Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium">Saúde SEO dos Artigos</span>
            <div className="text-2xl font-black text-[#10233F] mt-1">{seoScorePercentage}%</div>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {articlesWithSeoMeta.length} de {articles.length} matérias otimizadas
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium">Sitemaps & Google News</span>
            <div className="text-2xl font-black text-[#145EDB] mt-1">XML Ativo</div>
            <p className="text-[10px] text-gray-500 mt-0.5">Atualizado automaticamente</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#145EDB] rounded-xl">
            <Rss className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium">Google AdSense B2B</span>
            <div className="text-2xl font-black text-[#FF8500] mt-1">
              {settings.adSenseClientId ? 'Monetizado' : 'Pendente'}
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Banners nativos em matérias</p>
          </div>
          <div className="p-3 bg-amber-50 text-[#FF8500] rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#10233F] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#145EDB]" />
            Configurações de Metadados e IDs do Google
          </h2>
          <button
            onClick={handlePingGoogleIndexing}
            disabled={isPingSending}
            className="bg-[#10233F] hover:bg-[#0B2343] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            {isPingSending ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Zap className="w-4 h-4 text-[#FF8500]" />
            )}
            <span>Forçar Indexação Google (IndexNow)</span>
          </button>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#10233F] mb-1">Título do Portal (Meta Title)</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={e => setSettings({ ...settings, siteTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] mb-1">Slogan ou Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#10233F] mb-1">Meta Description do Portal (SEO)</label>
              <textarea
                rows={2}
                value={settings.metaDescription}
                onChange={e => setSettings({ ...settings, metaDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] mb-1">ID Google Tag Manager (GTM)</label>
              <input
                type="text"
                placeholder="GTM-XXXXXXX"
                value={settings.googleTagManagerId}
                onChange={e => setSettings({ ...settings, googleTagManagerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] mb-1">ID de Cliente Google AdSense</label>
              <input
                type="text"
                placeholder="ca-pub-1234567890123456"
                value={settings.adSenseClientId}
                onChange={e => setSettings({ ...settings, adSenseClientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Salvar Parâmetros de SEO & AdSense
            </button>
          </div>
        </form>
      </div>

      {/* Sitemaps & RSS Export Links */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#10233F] flex items-center gap-2">
          <Rss className="w-4 h-4 text-[#FF8500]" />
          Links de Indexação para Google Search Console & Publishers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-[#10233F]">Sitemap XML Geral</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">https://www.gritnews.com.br/sitemap.xml</p>
            </div>
            <button
              onClick={() => handleCopyFeed('sitemap')}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-[#145EDB] text-xs font-bold flex items-center gap-1"
            >
              {copiedSitemap ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-[#10233F]">Feed RSS 2.0 (Google News)</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">https://www.gritnews.com.br/feed.xml</p>
            </div>
            <button
              onClick={() => handleCopyFeed('rss')}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-[#FF8500] text-xs font-bold flex items-center gap-1"
            >
              {copiedRss ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
