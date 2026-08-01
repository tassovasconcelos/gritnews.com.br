import React from 'react';
import { Eye, Users, Tag, TrendingUp, DollarSign, ArrowUpRight, Flame, Mail, CheckCircle2 } from 'lucide-react';
import { Article, Lead, NewsletterSubscriber, Offer, AdCampaign } from '../../types';

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
  const totalViews = articles.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const totalOfferClicks = offers.reduce((acc, o) => acc + (o.clicksCount || 0), 0);
  const totalAdImpressions = ads.reduce((acc, a) => acc + (a.impressionsCount || 0), 0);
  const totalAdClicks = ads.reduce((acc, a) => acc + (a.clicksCount || 0), 0);

  const estimatedAdRevenue = (totalAdClicks * 1.85) + (totalOfferClicks * 3.50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#0B2343]">Visão Geral do Painel Editorial & Comercial</h1>
        <p className="text-sm text-[#5C6B7A]">Métricas em tempo real do portal GRIT NEWS</p>
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
            <span className="text-xs font-bold text-[#5C6B7A] uppercase">Cliques em Ofertas</span>
            <div className="w-8 h-8 bg-orange-50 text-[#FF8500] rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0B2343]">{totalOfferClicks.toLocaleString('pt-BR')}</p>
          <span className="text-xs text-[#145EDB] font-semibold flex items-center gap-1 mt-2">
            Taxa de Conversão 8.4%
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C6B7A] uppercase">Receita Estimada</span>
            <div className="w-8 h-8 bg-[#EAF3FF] text-[#145EDB] rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#22A06B]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedAdRevenue)}
          </p>
          <span className="text-xs text-[#5C6B7A] font-semibold block mt-2">
            AdSense + Afiliados + Diretos
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
