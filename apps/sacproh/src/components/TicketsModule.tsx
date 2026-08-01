import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Activity,
  Wrench,
  Truck,
  CheckCircle2,
  Flame,
  BadgeAlert,
  Building2,
  User,
  Mail,
  Phone,
  Copy,
  Check,
  ChevronRight,
  PlusCircle,
  FileCheck2,
  UserCheck
} from 'lucide-react';
import { SacProhTicket } from '@gritnews/types';

interface TicketsModuleProps {
  tickets: SacProhTicket[];
  protocolSearch: string;
  setProtocolSearch: (val: string) => void;
  onOpenNewTicket: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const TicketsModule: React.FC<TicketsModuleProps> = ({
  tickets,
  protocolSearch,
  setProtocolSearch,
  onOpenNewTicket,
  onShowToast
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SacProhTicket | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedProtocol(code);
    onShowToast(`Protocolo ${code} copiado!`, 'success');
    setTimeout(() => setCopiedProtocol(null), 3000);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.protocolCode.toLowerCase().includes(protocolSearch.toLowerCase()) ||
      t.hospitalName.toLowerCase().includes(protocolSearch.toLowerCase()) ||
      t.requesterName.toLowerCase().includes(protocolSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(protocolSearch.toLowerCase()) ||
      (t.serialNumber && t.serialNumber.toLowerCase().includes(protocolSearch.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: SacProhTicket['status']) => {
    switch (status) {
      case 'ABERTO':
        return <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Registrado</span>;
      case 'EM_ANALISE_TECNICA':
        return <span className="bg-sky-950/80 text-sky-300 border border-sky-500/40 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Activity className="w-3 h-3" /> Análise Técnica</span>;
      case 'TECNICO_ALOCADO':
        return <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Wrench className="w-3 h-3" /> Técnico Alocado</span>;
      case 'LOGISTICA_ENTREGA':
        return <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Truck className="w-3 h-3" /> Em Trânsito</span>;
      case 'CONCLUIDO':
        return <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluído</span>;
      default:
        return <span className="bg-slate-800 text-slate-200 text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: SacProhTicket['priority']) => {
    switch (priority) {
      case 'EMERGENCIA_CIRURGICA':
        return <span className="bg-rose-600 text-white animate-pulse font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> Emergência Cirúrgica</span>;
      case 'ALTA':
        return <span className="bg-orange-500 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded inline-flex items-center gap-1"><BadgeAlert className="w-3 h-3" /> Alta</span>;
      case 'MEDIA':
        return <span className="bg-sky-600 text-white font-medium text-[10px] uppercase px-2 py-0.5 rounded">Média</span>;
      case 'BAIXA':
        return <span className="bg-slate-600 text-white font-medium text-[10px] uppercase px-2 py-0.5 rounded">Baixa</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>Chamados Registrados no SACPROH</span>
          </h2>
          <p className="text-xs text-slate-400">Acompanhe a evolução técnica e suporte presencial aos hospitais</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Todas Categorias</option>
            <option value="Suporte Técnico Equipamentos">Suporte Técnico Equipamentos</option>
            <option value="Rastreio & Entrega Centro Cirúrgico">Rastreio & Entrega</option>
            <option value="Troca, Devolução & SAC">Troca, Devolução & SAC</option>
            <option value="Faturamento, NFe & Financeiro">Faturamento & NFe</option>
            <option value="Documentação & Registro ANVISA">Documentação ANVISA</option>
            <option value="Cotação Especial OPME & Insumos">Cotação OPME</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANALISE_TECNICA">Em Análise</option>
            <option value="TECNICO_ALOCADO">Técnico Alocado</option>
            <option value="LOGISTICA_ENTREGA">Logística / Entrega</option>
            <option value="CONCLUIDO">Concluído</option>
          </select>

          <button
            onClick={onOpenNewTicket}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Chamado</span>
          </button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">Nenhum chamado localizado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não encontramos chamados com o termo de busca ou filtros selecionados. Tente limpar os filtros ou criar um novo protocolo.
          </p>
          <button
            onClick={() => {
              setProtocolSearch('');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="text-xs text-sky-400 font-bold underline cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all space-y-4 shadow-lg group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-sky-400 text-sm bg-sky-950 border border-sky-800/60 px-2.5 py-1 rounded-lg">
                    {ticket.protocolCode}
                  </span>
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  {ticket.subject}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  {ticket.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate"><strong>Hospital:</strong> {ticket.hospitalName}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate"><strong>Solicitante:</strong> {ticket.requesterName}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">{ticket.email}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{ticket.phone}</span>
                </div>
              </div>

              {ticket.assignedTechnician && (
                <div className="flex items-center gap-2 text-xs text-sky-300 bg-sky-950/30 px-3 py-1.5 rounded-lg border border-sky-900/40">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  <span><strong>Técnico Responsável:</strong> {ticket.assignedTechnician} ({ticket.estimatedResolutionTime})</span>
                </div>
              )}

              {ticket.responseNotes && (
                <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-3 text-xs space-y-1">
                  <span className="font-bold text-sky-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Engenharia Clínica SACPROH:</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">{ticket.responseNotes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <button
                  onClick={() => copyToClipboard(ticket.protocolCode)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedProtocol === ticket.protocolCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copiar Protocolo</span>
                </button>

                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-slate-400 block">Protocolo SACPROH</span>
                <span className="font-mono font-black text-xl text-sky-400">{selectedTicket.protocolCode}</span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 block font-bold">Assunto:</span>
                <p className="text-sm font-bold text-white">{selectedTicket.subject}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-bold">Descrição:</span>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div><strong>Hospital:</strong> {selectedTicket.hospitalName}</div>
                <div><strong>Solicitante:</strong> {selectedTicket.requesterName}</div>
                <div><strong>E-mail:</strong> {selectedTicket.email}</div>
                <div><strong>Telefone:</strong> {selectedTicket.phone}</div>
                {selectedTicket.serialNumber && <div><strong>Série/Patrimônio:</strong> {selectedTicket.serialNumber}</div>}
                {selectedTicket.anvisaRegister && <div><strong>ANVISA:</strong> {selectedTicket.anvisaRegister}</div>}
              </div>

              {selectedTicket.responseNotes && (
                <div className="bg-sky-950/50 p-3 rounded-xl border border-sky-800/60 space-y-1">
                  <span className="font-bold text-sky-300">Atualização do Atendimento:</span>
                  <p>{selectedTicket.responseNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={`https://wa.me/5585991234455?text=Olá,%20gostaria%20de%20notícias%20do%20protocolo%20${selectedTicket.protocolCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Falar com Atendente no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
