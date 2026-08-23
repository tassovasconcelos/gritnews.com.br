import React, { useState, useEffect } from 'react';
import { Globe, Rss, ShieldCheck, Copy, Check, BarChart3, DollarSign, Zap, RefreshCw } from 'lucide-react';
import { Article, Category, SiteSettings } from '../../types';
import { getSiteSettings, saveSiteSettings, getArticles, getCategories } from '../../lib/storage';
import { AdminControlCenter } from './AdminControlCenter';

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
    const url = type === 'rss' ? 'https://www.gritnews.com.br/feed.xml' : 'https://www.gritnews.com.br/sitemap.xml';
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url);
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
      onShowToast('Solicitação registrada. A submissão oficial dos sitemaps é executada pelo GRIT Control Center via Search Console API.');
    }, 900);
  };

  const articlesWithSeoMeta = articles.filter(a => a.seo?.metaDescription && a.seo.metaDescription.length > 20);
  const seoScorePercentage = articles.length > 0 ? Math.round((articlesWithSeoMeta.length / articles.length) * 100) : 100;

  return (
    <div className="space-y-8">
      <AdminControlCenter />

      <div className="bg-gradient-to-r from-[#10233F] via-[#0B2343] to-[#145EDB] p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <Globe className="w-3.5 h-3.5" />
          <span>Central de Ranqueamento Orgânico Google & Monetização</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">SEO, Search Console & AdSense B2B</h1>
        <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed">
          Gerencie metadados globais, rastreamento, monetização e a descoberta orgânica do portal. A indexação operacional é monitorada pelo Control Center acima.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric label="Saúde SEO dos Artigos" value={`${seoScorePercentage}%`} detail={`${articlesWithSeoMeta.length} de ${articles.length} matérias otimizadas`} icon={<BarChart3 className="w-6 h-6" />} tone="emerald" />
        <Metric label="Sitemaps & Google News" value="XML Ativo" detail={`${categories.length} categorias monitoradas`} icon={<Rss className="w-6 h-6" />} tone="blue" />
        <Metric label="Google AdSense B2B" value={settings.adSenseClientId ? 'Monetizado' : 'Pendente'} detail="Banners nativos em matérias" icon={<DollarSign className="w-6 h-6" />} tone="amber" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#10233F] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#145EDB]" />
            Configurações de Metadados e IDs do Google
          </h2>
          <button onClick={handlePingGoogleIndexing} disabled={isPingSending} className="bg-[#10233F] hover:bg-[#0B2343] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60">
            {isPingSending ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Zap className="w-4 h-4 text-[#FF8500]" />}
            <span>Solicitar atualização de indexação</span>
          </button>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Título do Portal (Meta Title)" value={settings.siteTitle} onChange={value => setSettings({ ...settings, siteTitle: value })} />
            <Field label="Slogan ou Tagline" value={settings.tagline} onChange={value => setSettings({ ...settings, tagline: value })} />
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#10233F] mb-1">Meta Description do Portal (SEO)</label>
              <textarea rows={2} value={settings.metaDescription} onChange={e => setSettings({ ...settings, metaDescription: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]" />
            </div>
            <Field label="ID Google Tag Manager (GTM)" placeholder="GTM-XXXXXXX" value={settings.googleTagManagerId} onChange={value => setSettings({ ...settings, googleTagManagerId: value })} />
            <Field label="ID de Cliente Google AdSense" placeholder="ca-pub-1234567890123456" value={settings.adSenseClientId} onChange={value => setSettings({ ...settings, adSenseClientId: value })} />
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all">Salvar Parâmetros de SEO & AdSense</button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#10233F] flex items-center gap-2"><Rss className="w-4 h-4 text-[#FF8500]" />Links de Indexação para Google Search Console & Publishers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeedCard title="Sitemap XML Geral" url="https://www.gritnews.com.br/sitemap.xml" copied={copiedSitemap} onCopy={() => handleCopyFeed('sitemap')} />
          <FeedCard title="Feed RSS 2.0 (Google News)" url="https://www.gritnews.com.br/feed.xml" copied={copiedRss} onCopy={() => handleCopyFeed('rss')} />
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; placeholder?: string; onChange: (value: string) => void }> = ({ label, value, placeholder, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-[#10233F] mb-1">{label}</label>
    <input type="text" placeholder={placeholder} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]" />
  </div>
);

const FeedCard: React.FC<{ title: string; url: string; copied: boolean; onCopy: () => void }> = ({ title, url, copied, onCopy }) => (
  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3">
    <div className="min-w-0"><h3 className="font-bold text-xs text-[#10233F]">{title}</h3><p className="text-[10px] text-gray-500 mt-0.5 break-all">{url}</p></div>
    <button type="button" onClick={onCopy} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-[#145EDB]">{copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}</button>
  </div>
);

const Metric: React.FC<{ label: string; value: string; detail: string; icon: React.ReactNode; tone: 'emerald' | 'blue' | 'amber' }> = ({ label, value, detail, icon, tone }) => {
  const tones = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-[#145EDB]', amber: 'bg-amber-50 text-[#FF8500]' };
  return <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between gap-3"><div><span className="text-xs text-gray-400 font-medium">{label}</span><div className="text-2xl font-black text-[#10233F] mt-1">{value}</div><p className="text-[10px] text-gray-500 mt-0.5">{detail}</p></div><div className={`p-3 rounded-xl ${tones[tone]}`}>{icon}</div></div>;
};
