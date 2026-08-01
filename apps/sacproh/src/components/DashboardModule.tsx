import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { SacProhTicket } from '@gritnews/types';
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Activity, Layers, TrendingUp } from 'lucide-react';

interface DashboardModuleProps {
  tickets: SacProhTicket[];
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  onOpenNewTicket?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Suporte Técnico Equipamentos': '#0284C7',
  'Rastreio & Entrega Centro Cirúrgico': '#E11D48',
  'Troca, Devolução & SAC': '#F59E0B',
  'Faturamento, NFe & Financeiro': '#10B981',
  'Documentação & Registro ANVISA': '#8B5CF6',
  'Cotação Especial OPME & Insumos': '#EC4899'
};

const PRIORITY_COLORS: Record<string, string> = {
  EMERGENCIA_CIRURGICA: '#EF4444',
  ALTA: '#F97316',
  MEDIA: '#EAB308',
  BAIXA: '#3B82F6'
};

const STATUS_COLORS: Record<string, string> = {
  ABERTO: '#3B82F6',
  EM_ANALISE_TECNICA: '#8B5CF6',
  TECNICO_ALOCADO: '#0284C7',
  LOGISTICA_ENTREGA: '#F59E0B',
  CONCLUIDO: '#10B981',
  CANCELADO: '#6B7280'
};

function getResolutionHours(ticket: SacProhTicket): number {
  if (ticket.priority === 'EMERGENCIA_CIRURGICA') return 2;
  if (ticket.priority === 'ALTA') return 6;
  if (ticket.priority === 'MEDIA') return 18;
  return 24;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  tickets,
  onShowToast,
  onOpenNewTicket
}) => {
  const volumeBySector = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(ticket => {
      const cat = ticket.category || 'Outros';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([name, total]) => ({
      name: name.replace(' & ', ' / '),
      fullName: name,
      total,
      fill: CATEGORY_COLORS[name] || '#3B82F6'
    }));
  }, [tickets]);

  const avgResolutionBySector = useMemo(() => {
    const totals: Record<string, { sumHours: number; count: number }> = {};
    tickets.forEach(ticket => {
      const cat = ticket.category || 'Outros';
      if (!totals[cat]) totals[cat] = { sumHours: 0, count: 0 };
      totals[cat].sumHours += getResolutionHours(ticket);
      totals[cat].count += 1;
    });

    return Object.entries(totals).map(([name, data]) => {
      const avgHours = parseFloat((data.sumHours / data.count).toFixed(1));
      return {
        name: name.replace(' & ', ' / ').replace('Suporte Técnico Equipamentos', 'Suporte Equip.'),
        tempoMedioHoras: avgHours,
        totalChamados: data.count,
        color: CATEGORY_COLORS[name] || '#0284C7'
      };
    });
  }, [tickets]);

  const priorityDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      EMERGENCIA_CIRURGICA: 0,
      ALTA: 0,
      MEDIA: 0,
      BAIXA: 0
    };
    tickets.forEach(t => {
      if (counts[t.priority] !== undefined) counts[t.priority]++;
    });

    const labels: Record<string, string> = {
      EMERGENCIA_CIRURGICA: 'Emergência Cirúrgica',
      ALTA: 'Alta Prioridade',
      MEDIA: 'Média Prioridade',
      BAIXA: 'Baixa Prioridade'
    };

    return Object.entries(counts).map(([key, value]) => ({
      name: labels[key] || key,
      value,
      color: PRIORITY_COLORS[key] || '#9CA3AF'
    })).filter(item => item.value > 0);
  }, [tickets]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });

    const labels: Record<string, string> = {
      ABERTO: 'Aberto',
      EM_ANALISE_TECNICA: 'Em Análise',
      TECNICO_ALOCADO: 'Técnico Alocado',
      LOGISTICA_ENTREGA: 'Logística',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado'
    };

    return Object.entries(counts).map(([key, value]) => ({
      name: labels[key] || key,
      value,
      color: STATUS_COLORS[key] || '#9CA3AF'
    }));
  }, [tickets]);

  const totalTickets = tickets.length;
  const emergencyCount = tickets.filter(t => t.priority === 'EMERGENCIA_CIRURGICA').length;
  const inProgressCount = tickets.filter(t => t.status !== 'CONCLUIDO' && t.status !== 'CANCELADO').length;
  const overallAvgHours = useMemo(() => {
    if (tickets.length === 0) return 0;
    const sum = tickets.reduce((acc, t) => acc + getResolutionHours(t), 0);
    return (sum / tickets.length).toFixed(1);
  }, [tickets]);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 border border-sky-800/50 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>SACPROH BI & Telemetria 2026</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard de Chamados & Performance Por Setor
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Métricas em tempo real sobre volume de solicitações hospitalares, tempo médio de resolução (SLA) e distribuição operacional por categoria técnica.
          </p>
        </div>

        {onOpenNewTicket && (
          <button
            onClick={onOpenNewTicket}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Abrir Novo Chamado</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Volume Total</span>
            <div className="text-3xl font-black text-white">{totalTickets}</div>
            <span className="text-[10px] text-sky-400 font-semibold">Chamados Registrados</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-950 border border-rose-900/50 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-rose-400 tracking-wider">Urgência Cirúrgica</span>
            <div className="text-3xl font-black text-rose-500">{emergencyCount}</div>
            <span className="text-[10px] text-rose-300 font-semibold">SLA Prioritário 2 horas</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-500 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-950 border border-amber-900/50 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider">Tempo Médio SLA</span>
            <div className="text-3xl font-black text-amber-400">{overallAvgHours}h</div>
            <span className="text-[10px] text-amber-300 font-semibold">Resolução Média Geral</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-950 border border-emerald-900/50 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider">Em Atendimento</span>
            <div className="text-3xl font-black text-emerald-400">{inProgressCount}</div>
            <span className="text-[10px] text-emerald-300 font-semibold">Equipes Alocadas</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <span>Volume de Chamados por Categoria / Setor</span>
              </h3>
              <p className="text-[11px] text-slate-400">Quantidade total de chamados abertos por área técnica</p>
            </div>
            <span className="text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded">
              Recharts Bar
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeBySector} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="name"
                  stroke="#94A3B8"
                  fontSize={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                  itemStyle={{ color: '#38BDF8', fontWeight: 'bold' }}
                />
                <Bar dataKey="total" name="Total de Chamados" radius={[6, 6, 0, 0]}>
                  {volumeBySector.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Tempo Médio de Resolução (Horas) Por Setor</span>
              </h3>
              <p className="text-[11px] text-slate-400">Tempo estimado até a conclusão técnica da solicitação</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
              SLA (Horas)
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={avgResolutionBySector} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorTempo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="name"
                  stroke="#94A3B8"
                  fontSize={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94A3B8" fontSize={11} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                  formatter={(value: any) => [`${value} horas`, 'Tempo Médio de Resolução']}
                />
                <Area
                  type="monotone"
                  dataKey="tempoMedioHoras"
                  name="Tempo Médio (Horas)"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTempo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Distribuição por Nível de Severidade / Prioridade</span>
            </h3>
            <p className="text-[11px] text-slate-400">Classificação de risco operacional e urgência cirúrgica</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-priority-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Status do Fluxo de Atendimento Operacional</span>
            </h3>
            <p className="text-[11px] text-slate-400">Estágio atual de resolução no funil SACPROH</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
