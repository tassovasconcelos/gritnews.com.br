import React, { useState } from 'react';
import {
  ShieldCheck,
  Stethoscope,
  Wrench,
  FileText,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  Download,
  Building2,
  User,
  Mail,
  Phone,
  Tag,
  ArrowRight,
  ChevronRight,
  Copy,
  Check,
  FileCheck2,
  ExternalLink,
  Activity,
  Send,
  HelpCircle,
  ArrowLeft,
  Flame,
  Truck,
  Box,
  BadgeAlert
} from 'lucide-react';
import { SacProhTicket, SacProhTicketCategory, SacProhProduct, SacProhFaq } from '../../types';
import { getSacProhTickets, addSacProhTicket, getSacProhProducts, getSacProhFaqs } from '../../lib/storage';

interface SacProhViewProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
  onNavigateHome: () => void;
}

export const SacProhView: React.FC<SacProhViewProps> = ({ onShowToast, onNavigateHome }) => {
  const [tickets, setTickets] = useState<SacProhTicket[]>(getSacProhTickets());
  const [products] = useState<SacProhProduct[]>(getSacProhProducts());
  const [faqs] = useState<SacProhFaq[]>(getSacProhFaqs());

  const [activeTab, setActiveTab] = useState<'tickets' | 'new-ticket' | 'catalog' | 'maintenance' | 'faqs'>('tickets');
  const [protocolSearch, setProtocolSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SacProhTicket | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');

  // New Ticket Form State
  const [formRequesterName, setFormRequesterName] = useState('');
  const [formHospitalName, setFormHospitalName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState<SacProhTicketCategory>('Suporte Técnico Equipamentos');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formAnvisaRegister, setFormAnvisaRegister] = useState('');
  const [formPriority, setFormPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA_CIRURGICA'>('MEDIA');
  const [createdTicketResult, setCreatedTicketResult] = useState<SacProhTicket | null>(null);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRequesterName || !formHospitalName || !formEmail || !formSubject || !formDescription) {
      onShowToast('Por favor, preencha todos os campos obrigatórios (*)', 'info');
      return;
    }

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newProtocol = `SACPROH-${new Date().getFullYear()}-${randomDigits}`;

    const newTicket: SacProhTicket = {
      id: `ticket-${Date.now()}`,
      protocolCode: newProtocol,
      requesterName: formRequesterName,
      hospitalName: formHospitalName,
      email: formEmail,
      phone: formPhone,
      category: formCategory,
      subject: formSubject,
      description: formDescription,
      serialNumber: formSerialNumber || undefined,
      anvisaRegister: formAnvisaRegister || undefined,
      status: 'ABERTO',
      priority: formPriority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseNotes: 'Chamado registrado com sucesso. Nossa equipe de Engenharia Clínica e SACPROH analisará a solicitação em instantes.'
    };

    addSacProhTicket(newTicket);
    setTickets(getSacProhTickets());
    setCreatedTicketResult(newTicket);

    // Reset Form
    setFormRequesterName('');
    setFormHospitalName('');
    setFormEmail('');
    setFormPhone('');
    setFormSubject('');
    setFormDescription('');
    setFormSerialNumber('');
    setFormAnvisaRegister('');
    setFormPriority('MEDIA');

    onShowToast(`Protocolo ${newProtocol} gerado com sucesso!`, 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedProtocol(text);
    onShowToast(`Protocolo ${text} copiado para a área de transferência!`, 'success');
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

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.anvisaRegister.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(productSearch.toLowerCase());

    const matchesCategory = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: SacProhTicket['status']) => {
    switch (status) {
      case 'ABERTO':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Registrado</span>;
      case 'EM_ANALISE_TECNICA':
        return <span className="bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Activity className="w-3 h-3" /> Análise Técnica</span>;
      case 'TECNICO_ALOCADO':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Wrench className="w-3 h-3" /> Técnico Alocado</span>;
      case 'LOGISTICA_ENTREGA':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Truck className="w-3 h-3" /> Em Trânsito</span>;
      case 'CONCLUIDO':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluído</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: SacProhTicket['priority']) => {
    switch (priority) {
      case 'EMERGENCIA_CIRURGICA':
        return <span className="bg-rose-600 text-white animate-pulse font-black text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> Emergência Cirúrgica</span>;
      case 'ALTA':
        return <span className="bg-orange-500 text-white font-bold text-[11px] uppercase px-2 py-0.5 rounded inline-flex items-center gap-1"><BadgeAlert className="w-3 h-3" /> Alta</span>;
      case 'MEDIA':
        return <span className="bg-sky-600 text-white font-medium text-[11px] uppercase px-2 py-0.5 rounded">Média</span>;
      case 'BAIXA':
        return <span className="bg-slate-500 text-white font-medium text-[11px] uppercase px-2 py-0.5 rounded">Baixa</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Top Header Navigation */}
      <div className="bg-slate-950 border-b border-sky-900/50 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
              title="Voltar ao GRIT NEWS"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>GRIT NEWS</span>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-sky-900/40">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-white">ProCirúrgica</span>
                  <span className="bg-sky-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">SACPROH</span>
                </div>
                <p className="text-[11px] text-sky-400 font-medium leading-none">Suporte Hospitalar & Engenharia Clínica</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-bold">Plantão Centro Cirúrgico 24/7 Ativo</span>
            </div>

            <a
              href="https://wa.me/5585991234455?text=Olá,%20preciso%20de%20atendimento%20urgente%20ProCirúrgica%20SACPROH"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Plantão</span>
            </a>
          </div>
        </div>

        {/* Subnav Tabs */}
        <div className="bg-slate-900 border-t border-slate-800 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Central de Chamados ({tickets.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('new-ticket');
                setCreatedTicketResult(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'new-ticket'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Abrir Novo Chamado SACPROH</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Catálogo Técnico & ANVISA</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Assistência Técnica & Calibração</span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'faqs'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Central de Ajuda & FAQ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-bold px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>ProCirúrgica Hospitalar • Soluções Cirúrgicas de Alta Precisão</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            SACPROH — Serviço de Atendimento & Suporte Hospitalar
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            Plataforma unificada para rastreamento de protocolos, suporte técnico a bisturis e autoclaves, emissão de laudos ANVISA e atendimento prioritário para centros cirúrgicos.
          </p>

          {/* Quick Protocol Tracker */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-slate-950 border border-sky-500/40 rounded-2xl p-1.5 shadow-2xl focus-within:border-sky-400 transition-all">
              <Search className="w-5 h-5 text-sky-400 ml-3" />
              <input
                type="text"
                value={protocolSearch}
                onChange={e => {
                  setProtocolSearch(e.target.value);
                  if (activeTab !== 'tickets') setActiveTab('tickets');
                }}
                placeholder="Consulte seu protocolo ex: SACPROH-2026-8942 ou hospital..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setActiveTab('tickets')}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <span>Consultar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-400 text-[11px] mt-2">
              Dica: Digite o número do protocolo, nome do hospital ou número de série do equipamento.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        {/* TAB 1: Central de Chamados */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
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
                  onClick={() => {
                    setActiveTab('new-ticket');
                    setCreatedTicketResult(null);
                  }}
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
                        <span>Aberto em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')} às {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                        {ticket.subject}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
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

                    {ticket.responseNotes && (
                      <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-sky-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Atualização da Engenharia Clínica SACPROH:</span>
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
                        <span>Ver Detalhes Completos</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Abrir Novo Chamado */}
        {activeTab === 'new-ticket' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
              <div>
                <span className="bg-sky-950 border border-sky-800 text-sky-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Formulário Oficial de Abertura SACPROH
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Abertura de Chamado Hospitalar & Suporte Técnico
                </h2>
                <p className="text-xs text-slate-400">
                  Preencha os dados abaixo. Nosso sistema gera um número de protocolo imediato para rastreamento pela Engenharia Clínica ProCirúrgica.
                </p>
              </div>

              {createdTicketResult && (
                <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 text-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white">Chamado Registrado com Sucesso!</h3>
                      <p className="text-xs text-emerald-300">Guarde o número de protocolo para acompanhamento</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Código de Protocolo:</span>
                      <span className="text-xl font-mono font-black text-emerald-400">{createdTicketResult.protocolCode}</span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(createdTicketResult.protocolCode)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => {
                        setActiveTab('tickets');
                        setProtocolSearch(createdTicketResult.protocolCode);
                      }}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                    >
                      Ver na Lista de Chamados
                    </button>

                    <a
                      href={`https://wa.me/5585991234455?text=Olá,%20acabei%20de%20gerar%20o%20protocolo%20${createdTicketResult.protocolCode}%20pelo%20SACPROH%20referente%20a:%20${encodeURIComponent(createdTicketResult.subject)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Notificar Técnico via WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nome do Solicitante *
                    </label>
                    <input
                      type="text"
                      required
                      value={formRequesterName}
                      onChange={e => setFormRequesterName(e.target.value)}
                      placeholder="Ex: Dr. Roberto / Eng. Carlos"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Hospital / Instituição *
                    </label>
                    <input
                      type="text"
                      required
                      value={formHospitalName}
                      onChange={e => setFormHospitalName(e.target.value)}
                      placeholder="Ex: Hospital São Lucas / Clínica Santa Maria"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      E-mail Institucional *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="seu.email@hospital.com.br"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Telefone / WhatsApp com DDD
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="(85) 99999-0000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Categoria do Atendimento *
                    </label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value as SacProhTicketCategory)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Suporte Técnico Equipamentos">Suporte Técnico Equipamentos</option>
                      <option value="Rastreio & Entrega Centro Cirúrgico">Rastreio & Entrega Centro Cirúrgico</option>
                      <option value="Troca, Devolução & SAC">Troca, Devolução & SAC</option>
                      <option value="Faturamento, NFe & Financeiro">Faturamento, NFe & Financeiro</option>
                      <option value="Documentação & Registro ANVISA">Documentação & Registro ANVISA</option>
                      <option value="Cotação Especial OPME & Insumos">Cotação Especial OPME & Insumos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nível de Prioridade
                    </label>
                    <select
                      value={formPriority}
                      onChange={e => setFormPriority(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="BAIXA">Baixa (Dúvida Geral / Consulta)</option>
                      <option value="MEDIA">Média (Acompanhamento Regular)</option>
                      <option value="ALTA">Alta (Manutenção Programada Proxima)</option>
                      <option value="EMERGENCIA_CIRURGICA">🔥 Emergência Cirúrgica em Andamento</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      N° de Série ou Patrimônio (Se houver)
                    </label>
                    <input
                      type="text"
                      value={formSerialNumber}
                      onChange={e => setFormSerialNumber(e.target.value)}
                      placeholder="Ex: BE300-2025-998"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Registro ANVISA (Se houver)
                    </label>
                    <input
                      type="text"
                      value={formAnvisaRegister}
                      onChange={e => setFormAnvisaRegister(e.target.value)}
                      placeholder="Ex: 80239100042"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Assunto do Chamado *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    placeholder="Ex: Solicitação de calibração para bisturi de alta frequência"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Descrição Detalhada do Problema / Solicitação *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Descreva detalhadamente a necessidade, o comportamento do equipamento ou urgência do procedimento cirúrgico..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gerar Protocolo & Enviar ao SACPROH</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Catálogo Técnico & ANVISA */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-sky-400" />
                  <span>Catálogo Técnico de Equipamentos & Registros ANVISA</span>
                </h2>
                <p className="text-xs text-slate-400">Consulte especificações, laudos de qualidade e baixe manuais técnicos</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar equipamento ou ANVISA..."
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 w-full sm:w-48"
                />

                <select
                  value={productCategoryFilter}
                  onChange={e => setProductCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">Todas Categorias</option>
                  <option value="Equipamentos Cirúrgicos">Equipamentos Cirúrgicos</option>
                  <option value="OPME & Próteses">OPME & Próteses</option>
                  <option value="Instrumental Cirúrgico">Instrumental Cirúrgico</option>
                  <option value="Insumos & Esterilização">Insumos & Esterilização</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-900">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-sky-400">
                      CÓD: {product.code}
                    </div>
                    <div className="absolute top-3 right-3 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 px-2.5 py-1 rounded-md text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>ANVISA: {product.anvisaRegister}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="text-base font-bold text-white leading-snug group-hover:text-sky-300 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {product.technicalDataSheet && (
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 font-mono">
                        {product.technicalDataSheet}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Garantia: <strong>{product.warrantyMonths} meses</strong></span>

                      <button
                        onClick={() => {
                          setActiveTab('new-ticket');
                          setFormSubject(`Suporte / Consulta sobre ${product.name} (CÓD: ${product.code})`);
                          setFormSerialNumber(product.code);
                          setFormAnvisaRegister(product.anvisaRegister);
                          setCreatedTicketResult(null);
                        }}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Solicitar Suporte</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Assistência Técnica & Calibração */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Engenharia Clínica & Calibração Autorizada</h2>
                  <p className="text-xs text-slate-400">Conformidade com a RDC N° 50 e NBR IEC 60601 para segurança no centro cirúrgico</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <Activity className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Calibração Rastreada RBC</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Aferição de potência em bisturis e ciclos de esterilização com emissão de certificado técnico com padrão RBC/INMETRO.
                  </p>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <ShieldCheck className="w-6 h-6 text-sky-400" />
                  <h3 className="font-bold text-sm text-white">Peças Originais ProCirúrgica</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Substituição de placas de alta frequência, gaxetas de autoclaves e cabos bipolares com componentes originais de fábrica.
                  </p>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <Truck className="w-6 h-6 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Logística Reversa Expressa</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Retirada do equipamento em até 24h na instituição hospitalar com fornecimento de equipamento backup durante o reparo.
                  </p>
                </div>
              </div>

              {/* Technical Support Centers */}
              <div className="pt-4 space-y-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-400" />
                  <span>Centros Regionais de Assistência Técnica ProCirúrgica</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-sky-300 block text-sm">Hub Nordeste (Fortaleza / Ceará)</strong>
                    <p>Av. Santos Dumont, 2800 • Aldeota • Fortaleza/CE</p>
                    <p className="text-slate-400">Atendimento Engenharia: (85) 3211-9900</p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-sky-300 block text-sm">Hub Sudeste (São Paulo / SP)</strong>
                    <p>Av. Paulista, 1100 • Bela Vista • São Paulo/SP</p>
                    <p className="text-slate-400">Atendimento Engenharia: (11) 3090-8800</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FAQs & Central de Ajuda */}
        {activeTab === 'faqs' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-sky-400" />
                  <span>Perguntas Frequentes — SACPROH</span>
                </h2>
                <p className="text-xs text-slate-400">Respostas rápidas sobre prazos de garantia, laudos ANVISA e atendimento de emergência</p>
              </div>

              <div className="space-y-4">
                {faqs.map(faq => (
                  <div key={faq.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">{faq.category}</span>
                    <h3 className="font-bold text-sm text-white">{faq.question}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-sky-950 to-slate-900 border border-sky-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-base">Ainda tem dúvidas ou precisa de cotação hospitalar?</h3>
                  <p className="text-xs text-slate-300">Nossa equipe comercial B2B e de Engenharia está online para ajudar.</p>
                </div>

                <a
                  href="https://wa.me/5585991234455?text=Olá,%20gostaria%20de%20falar%20com%20um%20especialista%20ProCirúrgica%20SACPROH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar com Atendente</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal for Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-sm font-black text-sky-400">{selectedTicket.protocolCode}</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedTicket.subject}</h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div><strong>Status:</strong> {getStatusBadge(selectedTicket.status)}</div>
                <div><strong>Prioridade:</strong> {getPriorityBadge(selectedTicket.priority)}</div>
                <div><strong>Hospital:</strong> {selectedTicket.hospitalName}</div>
                <div><strong>Solicitante:</strong> {selectedTicket.requesterName}</div>
              </div>

              <div>
                <strong className="text-slate-400 block mb-1">Descrição:</strong>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed text-slate-200">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.responseNotes && (
                <div>
                  <strong className="text-sky-400 block mb-1">Notas do Técnico SACPROH:</strong>
                  <p className="bg-sky-950/50 p-3 rounded-xl border border-sky-800/80 text-sky-100 leading-relaxed">
                    {selectedTicket.responseNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTicket(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
