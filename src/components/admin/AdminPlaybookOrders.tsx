import React, { useState } from 'react';
import { 
  BookOpen, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Search, 
  MessageCircle, 
  Plus, 
  Trash2, 
  Send, 
  CreditCard, 
  QrCode, 
  X,
  ExternalLink,
  Users,
  Check,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { PlaybookOrder, PlaybookOrderStatus, PlaybookPaymentMethod } from '../../types';
import { getPlaybookOrders, savePlaybookOrders, addPlaybookOrder, updatePlaybookOrder, deletePlaybookOrder, getSiteConfig } from '../../lib/storage';

interface AdminPlaybookOrdersProps {
  onShowToast: (msg: string) => void;
}

export const AdminPlaybookOrders: React.FC<AdminPlaybookOrdersProps> = ({ onShowToast }) => {
  const [orders, setOrders] = useState<PlaybookOrder[]>(() => getPlaybookOrders());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // Modal State for Manual Order Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PlaybookPaymentMethod>('pix');
  const [amount, setAmount] = useState<number>(29.90);
  const [status, setStatus] = useState<PlaybookOrderStatus>('PAID');
  const [notes, setNotes] = useState('');

  const refreshOrders = () => {
    setOrders(getPlaybookOrders());
  };

  const handlePurgeMockData = () => {
    if (window.confirm('Deseja limpar todos os pedidos demonstrativos/falsos e manter apenas pedidos reais?')) {
      const mockIds = new Set(['ord-pb-101', 'ord-pb-102', 'ord-pb-103', 'ord-pb-104']);
      const current = getPlaybookOrders();
      const realOnly = current.filter(o => !mockIds.has(o.id));
      savePlaybookOrders(realOnly);
      setOrders(realOnly);
      onShowToast('Base limpa com sucesso. Apenas registros autênticos preservados!');
    }
  };

  const handleClearAllOrders = () => {
    if (window.confirm('Tem certeza que deseja zerar a lista de pedidos? Esta ação é irreversível.')) {
      savePlaybookOrders([]);
      setOrders([]);
      onShowToast('Lista de pedidos zerada.');
    }
  };

  const handleMarkAsPaid = (order: PlaybookOrder) => {
    const updated: PlaybookOrder = {
      ...order,
      status: 'PAID',
      paidAt: new Date().toISOString(),
      accessSent: true,
      notes: (order.notes ? order.notes + ' • ' : '') + 'Pagamento confirmado manualmente pelo admin.'
    };
    updatePlaybookOrder(updated);
    refreshOrders();
    onShowToast(`Pedido #${order.id} confirmado como PAGO!`);
  };

  const handleSendWhatsAppAccess = (order: PlaybookOrder) => {
    const phoneClean = order.customerPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${order.customerName}! Aqui é da equipe editorial do GRIT NEWS.\n\n` +
      `Seu pedido do *Playbook de Emagrecimento Saudável (Edição 2026)* foi confirmado!\n\n` +
      `📥 *Acesso Imediato ao seu Material & 4 Bônus Exclusivos:*\n` +
      `https://gritnews.com.br/?view=playbook&access=granted&order=${order.id}\n\n` +
      `Qualquer dúvida ou suporte, estamos à disposição por aqui. Tenha excelentes resultados!`
    );

    const whatsappUrl = `https://wa.me/${phoneClean}?text=${message}`;
    window.open(whatsappUrl, '_blank');

    const updated = { ...order, accessSent: true };
    updatePlaybookOrder(updated);
    refreshOrders();
    onShowToast('Janela do WhatsApp aberta e status de envio atualizado.');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o pedido de "${name}"?`)) {
      deletePlaybookOrder(id);
      refreshOrders();
      onShowToast('Pedido excluído com sucesso.');
    }
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      onShowToast('Por favor, informe ao menos nome e e-mail do cliente.');
      return;
    }

    const newOrder: PlaybookOrder = {
      id: `ord-pb-${Date.now().toString().slice(-6)}`,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '+5585999999999',
      paymentMethod,
      amount,
      status,
      accessSent: status === 'PAID',
      createdAt: new Date().toISOString(),
      paidAt: status === 'PAID' ? new Date().toISOString() : undefined,
      notes: notes || 'Venda cadastrada manualmente no painel admin.'
    };

    addPlaybookOrder(newOrder);
    refreshOrders();
    setIsModalOpen(false);
    onShowToast('Pedido manual inserido com sucesso.');

    // Reset Form
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNotes('');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Cliente', 'Email', 'WhatsApp', 'Metodo', 'Valor', 'Status', 'Acesso Enviado', 'Data Criacao', 'Data Pagamento'];
    const rows = orders.map(o => [
      o.id,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerEmail,
      o.customerPhone,
      o.paymentMethod.toUpperCase(),
      o.amount.toFixed(2),
      o.status,
      o.accessSent ? 'SIM' : 'NAO',
      o.createdAt,
      o.paidAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_playbook_gritnews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    onShowToast('Relatório de vendas exportado em CSV.');
  };

  // KPIs
  const paidOrders = orders.filter(o => o.status === 'PAID');
  const pendingOrders = orders.filter(o => o.status === 'PENDING_PIX');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const conversionRate = orders.length > 0 ? Math.round((paidOrders.length / orders.length) * 100) : 0;

  // Filtered
  const filtered = orders.filter(o => {
    const matchesSearch = 
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || o.paymentMethod === filterMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0B2343]">Vendas do Playbook de Emagrecimento</h1>
            <p className="text-xs text-slate-500 font-medium">
              Gestão de pedidos, liberação de acessos, acompanhamento PIX e métricas de conversão do infoproduto
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {orders.some(o => ['ord-pb-101', 'ord-pb-102', 'ord-pb-103', 'ord-pb-104'].includes(o.id)) && (
            <button
              onClick={handlePurgeMockData}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
              title="Remover pedidos demonstrativos gerados como exemplo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover Pedidos Mock</span>
            </button>
          )}

          {orders.length > 0 && (
            <button
              onClick={handleClearAllOrders}
              className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Zerar todos os registros"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Lista</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido Real</span>
          </button>
        </div>
      </div>

      {/* Top Banner PIX Ativo */}
      {(() => {
        const siteConfig = getSiteConfig();
        return (
          <div className="bg-emerald-950/80 text-white p-4 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-emerald-200">
                  Chave PIX Ativa no Checkout: <span className="font-mono text-white bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">{siteConfig.pixKey || 'tassovasconcelos@gmail.com'}</span> ({siteConfig.pixKeyType || 'email'})
                </p>
                <p className="text-slate-300 text-[11px]">
                  Titular: <strong>{siteConfig.pixBeneficiaryName || 'TASSO VASCONCELOS'}</strong> • Cidade: <strong>{siteConfig.pixCity || 'FORTALEZA'}</strong> • Mercado Pago: <strong>{siteConfig.mercadoPagoAccessToken ? 'Integrado' : 'PIX Direto'}</strong>
                </p>
              </div>
            </div>

            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30 font-medium">
              Altere na aba "PIX & Mercado Pago"
            </span>
          </div>
        );
      })()}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Faturamento Bruto</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Total aprovado em conta</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Pedidos Pagos</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{paidOrders.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Acessos liberados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">PIX Pendentes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingOrders.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Aguardando confirmação</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Taxa de Conversão</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-700">{conversionRate}%</p>
          <p className="text-[10px] text-slate-400 mt-1">Checkout vs Pagos</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, e-mail, WhatsApp ou ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#145EDB] focus:outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="all">Todos os Status</option>
          <option value="PAID">Pagos (Aprovados)</option>
          <option value="PENDING_PIX">Pendentes PIX</option>
          <option value="REFUNDED">Reembolsados</option>
        </select>

        <select
          value={filterMethod}
          onChange={e => setFilterMethod(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="all">Todas Formas de Pagamento</option>
          <option value="pix">PIX</option>
          <option value="card">Cartão de Crédito</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-4">ID & Data</th>
                <th className="p-4">Cliente / Contato</th>
                <th className="p-4">Pagamento</th>
                <th className="p-4">Valor</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Acesso</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <p className="font-mono font-bold text-slate-900">{order.id}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </td>

                  <td className="p-4">
                    <p className="font-black text-slate-900">{order.customerName}</p>
                    <p className="text-slate-500 font-medium">{order.customerEmail}</p>
                    <p className="text-slate-400 text-[11px]">{order.customerPhone}</p>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      {order.paymentMethod === 'pix' ? (
                        <>
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>PIX Instantâneo</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>Cartão de Crédito</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="p-4 font-black text-slate-900">
                    R$ {order.amount.toFixed(2)}
                  </td>

                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'PENDING_PIX'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {order.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                      {order.status === 'PENDING_PIX' && <Clock className="w-3 h-3" />}
                      {order.status === 'PAID' ? 'Pago' : order.status === 'PENDING_PIX' ? 'Pendente' : 'Reembolsado'}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      order.accessSent ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {order.accessSent ? 'Liberado' : 'Aguardando'}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status === 'PENDING_PIX' && (
                        <button
                          onClick={() => handleMarkAsPaid(order)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Confirmar Pagamento PIX"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleSendWhatsAppAccess(order)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Enviar Acesso via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(order.id, order.customerName)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir Pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Nenhum Pedido Registrado</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        A base de pedidos está limpa. Todos os dados demonstrativos foram eliminados. Assim que um cliente finalizar o checkout (via PIX ou Mercado Pago) ou você cadastrar um pedido manual, ele aparecerá aqui com dados autênticos.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Lançar Primeiro Pedido Real</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#0B2343]">Cadastrar Pedido Manualmente</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome Completo do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vanessa Guimarães"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-[#145EDB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">E-mail do Cliente *</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@exemplo.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">WhatsApp com DDD</label>
                <input
                  type="text"
                  placeholder="+5585999887766"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Método de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PlaybookPaymentMethod)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="pix">PIX</option>
                    <option value="card">Cartão de Crédito</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status do Pedido</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as PlaybookOrderStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="PAID">Pago (Aprovado)</option>
                    <option value="PENDING_PIX">Pendente PIX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cliente VIP, atendimento via Instagram Direct"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Salvar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
