/**
 * ============================================================================
 * PAINEL DE AUDITORIA & SEGURANÇA (AUDIT LOGS) — GRIT NEWS 2.0
 * ============================================================================
 * 
 * Rastreabilidade total: quem, quando, o quê, antes/depois, IP e status.
 * Em conformidade com as diretrizes de governança e LGPD do Prompt Mestre.
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  FileText, 
  Activity,
  Layers,
  Lock,
  RefreshCw
} from 'lucide-react';
import { AuditLog, AuditActionType, UserRole } from '../../types';
import { getAuditLogs, recordAuditLog } from '../../lib/gritVerify';

interface AdminAuditLogsProps {
  currentRole: UserRole;
  currentUserName: string;
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({
  currentRole,
  currentUserName,
  onRefreshData,
  onShowToast
}) => {
  const [logs, setLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `grit_news_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    recordAuditLog({
      userId: currentUserName.toLowerCase().replace(/\s+/g, '_'),
      userName: currentUserName,
      userRole: currentRole,
      action: 'EXPORT',
      entityType: 'settings',
      entityId: 'audit_export',
      entityTitle: 'Exportação de Logs de Auditoria',
      notes: `Exportados ${logs.length} registros em formato JSON para auditoria externa.`
    });

    setLogs(getAuditLogs());
    onShowToast('Arquivo de logs de auditoria exportado com sucesso!');
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (filterEntity !== 'ALL' && log.entityType !== filterEntity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchUser = log.userName.toLowerCase().includes(term);
      const matchTitle = log.entityTitle?.toLowerCase().includes(term);
      const matchNotes = log.notes?.toLowerCase().includes(term);
      if (!matchUser && !matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'APPROVE':
      case 'PUBLISH':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">{action}</span>;
      case 'REJECT':
      case 'DELETE':
        return <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">{action}</span>;
      case 'CREATE':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">{action}</span>;
      case 'UPDATE':
      case 'VERIFY':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">{action}</span>;
      case 'LOGIN':
      case 'LOGOUT':
        return <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">{action}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Trilha de Auditoria & Segurança (Audit Logs)</h2>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              {logs.length} Eventos Gravados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro imutável de todas as ações editoriais, aprovações, publicações e acessos administrativos.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório Audit (JSON)</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Filtrar por usuário, título da entidade ou ação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#145EDB]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium"
        >
          <option value="ALL">Todas as Ações</option>
          <option value="LOGIN">LOGIN</option>
          <option value="APPROVE">APPROVE (Aprovação)</option>
          <option value="REJECT">REJECT (Rejeição)</option>
          <option value="VERIFY">VERIFY (Verificação)</option>
          <option value="CREATE">CREATE (Criação)</option>
          <option value="UPDATE">UPDATE (Edição)</option>
          <option value="DELETE">DELETE (Exclusão)</option>
          <option value="EXPORT">EXPORT (Exportação)</option>
        </select>

        <select
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium"
        >
          <option value="ALL">Todas as Entidades</option>
          <option value="candidate">Pautas Candidatas</option>
          <option value="article">Artigos do Portal</option>
          <option value="source">Fontes Homologadas</option>
          <option value="lead">Leads & Propostas</option>
          <option value="user">Sessões de Usuário</option>
          <option value="settings">Configurações</option>
        </select>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Data / Hora</th>
              <th className="p-3.5">Usuário (RBAC)</th>
              <th className="p-3.5">Ação</th>
              <th className="p-3.5">Entidade / Objeto</th>
              <th className="p-3.5">Origem / IP</th>
              <th className="p-3.5">Detalhes & Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </td>

                <td className="p-3.5 whitespace-nowrap">
                  <span className="font-bold text-slate-900 block">{log.userName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.userRole}</span>
                </td>

                <td className="p-3.5 whitespace-nowrap">
                  {getActionBadge(log.action)}
                </td>

                <td className="p-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{log.entityType}</span>
                  <span className="font-bold text-slate-800 leading-snug">{log.entityTitle || log.entityId}</span>
                </td>

                <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                  {log.ipAddress || '127.0.0.1 (Sessão Segura)'}
                </td>

                <td className="p-3.5 text-slate-600 text-[11px]">
                  {log.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
