import React, { useState } from 'react';
import { Mail, Download, ShieldCheck, CheckCircle2, User } from 'lucide-react';
import { Lead, NewsletterSubscriber } from '../../types';

interface AdminLeadsProps {
  leads: Lead[];
  subscribers: NewsletterSubscriber[];
  onShowToast: (msg: string) => void;
}

export const AdminLeads: React.FC<AdminLeadsProps> = ({ leads, subscribers, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'leads'>('subscribers');

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'subscribers') {
      csvContent += "Email,Nome,Setores,Consentimento_LGPD,Data_Inscricao\n";
      subscribers.forEach(s => {
        csvContent += `"${s.email}","${s.name}","${s.sectorInterests.join(';')}",${s.lgpdConsent},"${s.consentTimestamp}"\n`;
      });
    } else {
      csvContent += "Nome,Email,Telefone,Empresa,Setor,Data\n";
      leads.forEach(l => {
        csvContent += `"${l.name}","${l.email}","${l.phone || ''}","${l.company || ''}","${l.sectorInterest}","${l.createdAt}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `grit_news_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exportação de ${activeTab} iniciada em CSV!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B2343]">Gestão de Leads & Newsletter (LGPD)</h1>
          <p className="text-sm text-[#5C6B7A]">Consulte cadastros de newsletter e solicitações de orçamentos B2B</p>
        </div>

        <button
          onClick={exportCSV}
          className="bg-[#22A06B] hover:bg-[#1c875a] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#F7F9FC] p-1.5 rounded-xl border border-[#E2E8F0] w-fit">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'subscribers' ? 'bg-[#145EDB] text-white shadow-xs' : 'text-[#5C6B7A]'
          }`}
        >
          Inscritos na Newsletter ({subscribers.length})
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'leads' ? 'bg-[#145EDB] text-white shadow-xs' : 'text-[#5C6B7A]'
          }`}
        >
          Leads de Orçamento B2B ({leads.length})
        </button>
      </div>

      {activeTab === 'subscribers' ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#0B2343] font-extrabold uppercase">
                <tr>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Interesses Setoriais</th>
                  <th className="p-4">LGPD Consent</th>
                  <th className="p-4">Data Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#10233F]">
                {subscribers.map(s => (
                  <tr key={s.id} className="hover:bg-[#F7F9FC]">
                    <td className="p-4 font-bold text-[#145EDB]">{s.email}</td>
                    <td className="p-4 font-semibold">{s.name}</td>
                    <td className="p-4 text-gray-500 max-w-xs truncate">{s.sectorInterests.join(', ')}</td>
                    <td className="p-4">
                      <span className="bg-[#22A06B]/10 text-[#22A06B] px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3 h-3" />
                        Consentido
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(s.consentTimestamp).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#0B2343] font-extrabold uppercase">
                <tr>
                  <th className="p-4">Lead</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Setor</th>
                  <th className="p-4">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#10233F]">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-[#F7F9FC]">
                    <td className="p-4 font-bold text-[#0B2343]">{l.name}</td>
                    <td className="p-4 text-[#145EDB]">{l.email} <br /><span className="text-[10px] text-gray-400">{l.phone}</span></td>
                    <td className="p-4 font-semibold">{l.company || 'Pessoa Física'}</td>
                    <td className="p-4 text-gray-500">{l.sectorInterest}</td>
                    <td className="p-4 text-gray-500 max-w-xs truncate">{l.message || 'Sem mensagem'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
