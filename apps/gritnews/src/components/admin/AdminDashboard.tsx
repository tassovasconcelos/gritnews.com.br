import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  ExternalLink,
  MousePointerClick,
  Search,
  Target,
  Users,
  WifiOff
} from 'lucide-react';
import { Article, Lead, NewsletterSubscriber, Offer, AdCampaign } from '../../types';
import { performanceIntegrations, performanceProjects } from '../../lib/performance';

interface AdminDashboardProps {
  articles: Article[];
  leads: Lead[];
  subscribers: NewsletterSubscriber[];
  offers: Offer[];
  ads: AdCampaign[];
}

const statusLabel = {
  connected: 'Conectado',
  pending: 'Integração pendente',
  error: 'Erro de sincronização',
  unavailable: 'Indisponível'
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  articles,
  leads,
  subscribers,
  offers,
  ads
}) => {
  const [projectId, setProjectId] = useState('all');
  const [period, setPeriod] = useState('30d');

  const internalMetrics = useMemo(() => {
    const views = articles.reduce((acc, article) => acc + (article.viewsCount || 0), 0);
    const offerClicks = offers.reduce((acc, offer) => acc + (offer.clicksCount || 0), 0);
    const adImpressions = ads.reduce((acc, ad) => acc + (ad.impressionsCount || 0), 0);
    const adClicks = ads.reduce((acc, ad) => acc + (ad.clicksCount || 0), 0);

    return {
      views,
      leads: leads.length,
      subscribers: subscribers.length,
      offerClicks,
      adImpressions,
      adClicks
    };
  }, [articles, leads, subscribers, offers, ads]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-[#145EDB]" />
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#145EDB]">GRIT Performance Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0B2343]">Performance 360º</h1>
          <p className="text-sm text-[#5C6B7A] mt-1 max-w-3xl">
            Visão unificada de audiência, aquisição, leads e integrações. Nenhuma métrica externa é exibida como real enquanto a fonte oficial não estiver conectada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="text-xs font-bold text-[#5C6B7A]">
            Produto
            <select
              value={projectId}
              onChange={event => setProjectId(event.target.value)}
              className="mt-1 block min-w-52 bg-white border border-[#CBD5E1] rounded-xl px-3 py-2.5 text-sm text-[#0B2343]"
            >
              <option value="all">Todos os produtos</option>
              {performanceProjects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold text-[#5C6B7A]">
            Período
            <select
              value={period}
              onChange={event => setPeriod(event.target.value)}
              className="mt-1 block min-w-36 bg-white border border-[#CBD5E1] rounded-xl px-3 py-2.5 text-sm text-[#0B2343]"
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="90d">90 dias</option>
            </select>
          </label>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Clock3 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-extrabold text-amber-900">Modo de dados auditáveis ativo</p>
          <p className="text-xs text-amber-800 mt-1">
            Os números abaixo vêm do armazenamento interno atual do GRIT News. GA4, Search Console, Instagram, Facebook e Meta Ads permanecem sem números até a autenticação oficial das APIs.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-black text-[#0B2343]">Indicadores internos disponíveis</h2>
            <p className="text-xs text-[#64748B]">Fonte: registros atuais do GRIT News · sem estimativas de crescimento ou receita.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Fonte interna</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard icon={Eye} label="Visualizações registradas" value={internalMetrics.views} note="Soma de views dos artigos" />
          <MetricCard icon={Users} label="Leads" value={internalMetrics.leads} note="Registros de leads disponíveis" />
          <MetricCard icon={Target} label="Newsletter" value={internalMetrics.subscribers} note="Inscritos registrados" />
          <MetricCard icon={MousePointerClick} label="Cliques em ofertas" value={internalMetrics.offerClicks} note="Cliques internos registrados" />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#145EDB]" />
            <div>
              <h2 className="text-base font-black text-[#0B2343]">Fontes de performance</h2>
              <p className="text-xs text-[#64748B]">Cada conector informa seu estado antes de qualquer KPI ser exibido.</p>
            </div>
          </div>

          <div className="space-y-3">
            {performanceIntegrations.map(integration => {
              const connected = integration.status === 'connected';
              return (
                <div key={integration.id} className="border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {connected ? <CheckCircle2 className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#0B2343]">{integration.name}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{integration.description}</p>
                    </div>
                  </div>
                  <div className="md:text-right shrink-0">
                    <span className={`inline-flex text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${connected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      {statusLabel[integration.status]}
                    </span>
                    <p className="text-[10px] text-[#94A3B8] mt-1">Atualização: {integration.freshness}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0B2343] text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-amber-300" />
            <h2 className="text-base font-black">KPIs externos</h2>
          </div>
          <div className="space-y-3">
            {[
              'Usuários ativos agora (GA4)',
              'Sessões e aquisição (GA4)',
              'Cliques / CTR / posição (Search Console)',
              'Seguidores / alcance (Meta)',
              'Investimento / CPL / CAC / ROAS (Ads)'
            ].map(label => (
              <div key={label} className="bg-white/10 border border-white/10 rounded-xl p-3">
                <p className="text-[11px] text-slate-300">{label}</p>
                <p className="text-xl font-black mt-1">—</p>
                <p className="text-[10px] text-amber-300 mt-1">Aguardando fonte oficial</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-black text-[#0B2343]">Produtos monitorados</h2>
            <p className="text-xs text-[#64748B]">Catálogo central que receberá IDs de GA4, Search Console e Meta sem expor tokens no navegador.</p>
          </div>
          <span className="text-xs font-bold text-[#145EDB]">{period.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {performanceProjects
            .filter(project => projectId === 'all' || project.id === projectId)
            .map(project => (
              <div key={project.id} className="border border-[#E2E8F0] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[#0B2343]">{project.name}</p>
                    <p className="text-xs text-[#64748B] mt-1 break-all">{project.host}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${project.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {project.status === 'live' ? 'Publicado' : 'Planejado'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Performance externa</span>
                  <span className="font-bold text-amber-700">Pendente</span>
                </div>
              </div>
            ))}
        </div>
      </section>

      <div className="text-[11px] text-[#64748B] flex items-center gap-2">
        <ExternalLink className="w-3.5 h-3.5" />
        O próximo passo técnico é alimentar este painel por endpoints server-side /api/performance, com credenciais mantidas fora do frontend.
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, note }) => (
  <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-[#5C6B7A] uppercase">{label}</span>
      <div className="w-9 h-9 bg-[#EAF3FF] text-[#145EDB] rounded-xl flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-3xl font-black text-[#0B2343] mt-3">{value.toLocaleString('pt-BR')}</p>
    <p className="text-[11px] text-[#64748B] mt-1">{note}</p>
  </div>
);
