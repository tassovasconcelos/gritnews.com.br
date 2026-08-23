import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, RefreshCw, Server, ShieldCheck, WifiOff } from 'lucide-react';

type SiteStatus = 'healthy' | 'warning' | 'down' | 'pending' | 'domain_pending';

type SiteMonitor = {
  id: string;
  name: string;
  status: SiteStatus;
  http_status: number | null;
  response_ms: number | null;
  ssl_days: number | null;
  issues: string[];
};

type MonitorPayload = {
  generated_at: string;
  summary: Record<string, number>;
  sites: SiteMonitor[];
};

const statusLabel: Record<SiteStatus, string> = {
  healthy: 'Saudável',
  warning: 'Atenção',
  down: 'Indisponível',
  pending: 'Pendente',
  domain_pending: 'Domínio pendente'
};

const statusClass: Record<SiteStatus, string> = {
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  down: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  domain_pending: 'bg-blue-50 text-blue-700 border-blue-200'
};

export const AdminControlCenter: React.FC = () => {
  const [data, setData] = useState<MonitorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/control-center/status.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as MonitorPayload;
      setData(payload);
    } catch (err) {
      setError(`Não foi possível carregar a telemetria central (${err instanceof Error ? err.message : 'erro desconhecido'}).`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const metrics = useMemo(() => {
    const sites = data?.sites ?? [];
    const online = sites.filter(site => site.http_status && site.http_status >= 200 && site.http_status < 400).length;
    const average = sites.filter(site => typeof site.response_ms === 'number');
    const avgMs = average.length ? Math.round(average.reduce((sum, site) => sum + (site.response_ms ?? 0), 0) / average.length) : 0;
    const alerts = sites.reduce((sum, site) => sum + site.issues.length, 0);
    return { total: sites.length, online, avgMs, alerts };
  }, [data]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#145EDB]">
            <Activity className="h-4 w-4" />
            GRIT Control Center
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#10233F]">Saúde dos projetos e indexação</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
            Monitor central de disponibilidade, resposta HTTP, SSL, alertas de segurança e prontidão de SEO dos projetos publicados.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10233F] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#145EDB] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar painel
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Server} label="Projetos" value={metrics.total} hint="inventariados" />
        <MetricCard icon={CheckCircle2} label="Online" value={metrics.online} hint="HTTP 2xx/3xx" />
        <MetricCard icon={Clock3} label="Resposta média" value={`${metrics.avgMs} ms`} hint="última coleta" />
        <MetricCard icon={AlertTriangle} label="Alertas" value={metrics.alerts} hint="SEO + segurança" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Projeto</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">HTTP</th>
                <th className="px-4 py-3">Resposta</th>
                <th className="px-4 py-3">SSL</th>
                <th className="px-4 py-3">Pendências</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.sites ?? []).map(site => (
                <tr key={site.id} className="align-top">
                  <td className="px-4 py-4 font-bold text-[#10233F]">{site.name}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass[site.status]}`}>
                      {statusLabel[site.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-600">{site.http_status ?? '—'}</td>
                  <td className="px-4 py-4 font-mono text-slate-600">{site.response_ms != null ? `${site.response_ms} ms` : '—'}</td>
                  <td className="px-4 py-4 text-slate-600">{site.ssl_days != null ? `${site.ssl_days} dias` : '—'}</td>
                  <td className="max-w-sm px-4 py-4 text-slate-600">
                    {site.issues.length ? (
                      <ul className="space-y-1.5">
                        {site.issues.map((issue, index) => <li key={`${site.id}-${index}`} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /><span>{issue}</span></li>)}
                      </ul>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> Sem alertas</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !data?.sites?.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500"><WifiOff className="mx-auto mb-2 h-5 w-5" />Nenhuma telemetria disponível.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[11px] text-blue-800 sm:flex-row sm:items-center sm:justify-between">
        <span>Atualização automática do backend: a cada 6 horas. O painel também tenta recarregar a cada 60 segundos.</span>
        <span className="font-mono font-bold">Última coleta: {data?.generated_at ? new Date(data.generated_at).toLocaleString('pt-BR') : 'carregando...'}</span>
      </div>
    </section>
  );
};

const MetricCard: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; hint: string }> = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-xl font-black text-[#10233F]">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>
      </div>
      <div className="rounded-xl bg-blue-50 p-2 text-[#145EDB]"><Icon className="h-4 w-4" /></div>
    </div>
  </div>
);
