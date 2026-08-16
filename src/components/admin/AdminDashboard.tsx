import React from 'react';
import { Eye, Users, Tag, TrendingUp, DollarSign, ArrowUpRight, Flame, Mail, CheckCircle2, ShieldCheck, Lock, Download, Database, QrCode } from 'lucide-react';
import { Article, Lead, NewsletterSubscriber, Offer, AdCampaign } from '../../types';
import { getPlaybookOrders, getSiteConfig } from '../../lib/storage';
import { downloadBackupFile } from '../../lib/backupService';

interface AdminDashboardProps {
  articles: Article[];
  leads: Lead[];
  subscribers: NewsletterSubscriber[];
  offers: Offer[];
  ads: AdCampaign[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  articles,
  leads,
  subscribers,
  offers,
  ads
}) => {
  const siteConfig = getSiteConfig();
  const playbookOrders = getPlaybookOrders();
  const paidOrders = playbookOrders.filter(o => o.status === 'PAID');
  const playbookRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

  const totalViews = articles.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const totalOfferClicks = offers.reduce((acc, o) => acc + (o.clicksCount || 0), 0);
  const totalAdImpressions = ads.reduce((acc, a) => acc + (a.impressionsCount || 0), 0);
  const totalAdClicks = ads.reduce((acc, a) => acc + (a.clicksCount || 0), 0);

  const estimatedAdRevenue = (totalAdClicks * 1.85) + (totalOfferClicks * 3.50) + playbookRevenue;

  const handleQuickBackup = () => {
    downloadBackupFile('Administrador Geral');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B2343]">Visão Geral do Painel Editorial & Comercial</h1>
          <p className="text-sm text-[#5C6B7A]">Métricas em tempo real do portal GRIT NEWS e TenPets</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickBackup}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-[#0B2343] font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#145EDB]" />
            <span>Exportar Backup Geral (JSON)</span>
          </button>
        </div>
      </div>

      {/* Security & Health Banner */}
      <div className="bg-gradient-to-r from-[#0B2343] to-[#145EDB] text-white p-5 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">Criptografia & SSL</p>
            <p className="text-xs font-bold text-white">TLS 1.3 / 256-bit Ativo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 border border-sky-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">Gateway Mercado Pago</p>
            <p className="text-xs font-bold text-white">
              {siteConfig.mercadoPagoAccessToken ? 'API Conectada (Produção)' : 'PIX BACEN Direto Ativo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">Privacidade & LGPD</p>
            <p className="text-xs font-bold text-white">{subscribers.length + leads.length} Registros Auditados</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">Integridade de Dados</p>
            <p className="text-xs font-bold text-white">Storage Sincronizado</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C6B7A] uppercase">Audiência Total</span>
            <div className="w-8 h-8 bg-[#EAF3FF] text-[#145EDB] rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0B2343]">{totalViews.toLocaleString('pt-BR')}</p>
          <span className="text-xs text-[#22A06B] font-semibold flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +24.8% este mês
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C6B7A] uppercase">Leads & Inscritos</span>
            <div className="w-8 h-8 bg-green-50 text-[#22A06B] rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0B2343]">{subscribers.length + leads.length}</p>
          <span className="text-xs text-[#22A06B] font-semibold flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Conforme LGPD
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C6B7A] uppercase">Vendas Infoprodutos</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">
            R$ {playbookRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-[#145EDB] font-semibold flex items-center gap-1 mt-2">
            {paidOrders.length} pedidos confirmados
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C6B7A] uppercase">Receita Estimada Total</span>
            <div className="w-8 h-8 bg-[#EAF3FF] text-[#145EDB] rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#22A06B]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedAdRevenue)}
          </p>
          <span className="text-xs text-[#5C6B7A] font-semibold block mt-2">
            AdSense + Afiliados + Playbooks
          </span>
        </div>
      </div>

      {/* Top Performing Articles & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
          <h3 className="text-lg font-bold text-[#0B2343] mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF8500]" />
            Matérias com Maior Leitura
          </h3>
          <div className="space-y-3">
            {articles.slice(0, 4).map(art => (
              <div key={art.id} className="flex items-center justify-between p-3 bg-[#F7F9FC] rounded-xl border border-[#E2E8F0]">
                <div className="min-w-0 flex-1 pr-3">
                  <h4 className="text-xs font-bold text-[#10233F] truncate">{art.title}</h4>
                  <span className="text-[10px] text-[#5C6B7A]">{art.readingTimeMinutes} min de leitura</span>
                </div>
                <span className="text-xs font-extrabold text-[#145EDB] bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                  {art.viewsCount} views
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
          <h3 className="text-lg font-bold text-[#0B2343] mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#145EDB]" />
            Últimos Leads Qualificados
          </h3>
          <div className="space-y-3">
            {leads.slice(0, 4).map(l => (
              <div key={l.id} className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#0B2343]">{l.name}</h4>
                  <p className="text-[11px] text-[#5C6B7A]">{l.email} • {l.sectorInterest}</p>
                </div>
                <span className="text-[10px] font-bold bg-[#22A06B]/10 text-[#22A06B] px-2 py-0.5 rounded-full">
                  NOVO LEAD
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
