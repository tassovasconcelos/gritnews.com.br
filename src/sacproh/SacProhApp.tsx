import React, { useState, useEffect } from 'react';
import { SacProhHeader, SacProhTab } from './components/SacProhHeader';
import { TicketsModule } from './components/TicketsModule';
import { DashboardModule } from './components/DashboardModule';
import { NewTicketModal } from './components/NewTicketModal';
import { CatalogModule } from './components/CatalogModule';
import { EngineeringModule } from './components/EngineeringModule';
import { HospitalContractsModule } from './components/HospitalContractsModule';
import { SacProhTicket, SacProhProduct, SacProhHospitalContract, SacProhFaq } from './types';
import {
  INITIAL_SACPROH_PRODUCTS,
  INITIAL_SACPROH_TICKETS,
  INITIAL_SACPROH_CONTRACTS,
  INITIAL_SACPROH_FAQS
} from './data';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare, PhoneCall, ShieldCheck } from 'lucide-react';

interface SacProhAppProps {
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  onNavigateHome?: () => void;
}

export const SacProhApp: React.FC<SacProhAppProps> = ({
  onShowToast,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<SacProhTab>('tickets');
  const [tickets, setTickets] = useState<SacProhTicket[]>(() => {
    const saved = localStorage.getItem('sacproh_tickets');
    return saved ? JSON.parse(saved) : INITIAL_SACPROH_TICKETS;
  });
  const [products] = useState<SacProhProduct[]>(INITIAL_SACPROH_PRODUCTS);
  const [contracts] = useState<SacProhHospitalContract[]>(INITIAL_SACPROH_CONTRACTS);
  const [faqs] = useState<SacProhFaq[]>(INITIAL_SACPROH_FAQS);
  const [protocolSearch, setProtocolSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  useEffect(() => {
    localStorage.setItem('sacproh_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const handleCreateTicket = (ticketData: Omit<SacProhTicket, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTicket: SacProhTicket = {
      ...ticketData,
      id: `ticket-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };

    setTickets(prev => [newTicket, ...prev]);
    onShowToast(`Chamado ${newTicket.protocolCode} aberto com sucesso!`, 'success');
    setActiveTab('tickets');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <SacProhHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ticketsCount={tickets.length}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {activeTab === 'tickets' && (
          <TicketsModule
            tickets={tickets}
            protocolSearch={protocolSearch}
            setProtocolSearch={setProtocolSearch}
            onOpenNewTicket={() => setActiveTab('new-ticket')}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardModule
            tickets={tickets}
            onShowToast={onShowToast}
            onOpenNewTicket={() => setActiveTab('new-ticket')}
          />
        )}

        {activeTab === 'new-ticket' && (
          <NewTicketModal
            onSubmit={handleCreateTicket}
            onCancel={() => setActiveTab('tickets')}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogModule
            products={products}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'maintenance' && (
          <EngineeringModule
            onShowToast={onShowToast}
            onOpenNewTicket={() => setActiveTab('new-ticket')}
          />
        )}

        {activeTab === 'contracts' && (
          <HospitalContractsModule
            contracts={contracts}
            onOpenNewTicket={() => setActiveTab('new-ticket')}
          />
        )}

        {activeTab === 'faqs' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <span>Central de Dúvidas & Suporte Regulatório SACPROH</span>
              </h2>
              <p className="text-xs text-slate-400">
                Respostas rápidas sobre calibração, normas ANVISA, assistência cirúrgica e logística expressa
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map(faq => (
                <div
                  key={faq.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
                >
                  <button
                    onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        {faq.category}
                      </span>
                      <span className="font-bold text-white text-sm">{faq.question}</span>
                    </div>
                    {openFaqId === faq.id ? (
                      <ChevronUp className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {openFaqId === faq.id && (
                    <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 bg-slate-900/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-sky-950 via-slate-950 to-slate-950 border border-sky-800/60 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
              <div>
                <h3 className="font-black text-white text-base">Ainda necessita de suporte técnico imediato?</h3>
                <p className="text-xs text-slate-400">Nossa central cirúrgica está à disposição 24 horas por dia.</p>
              </div>

              <a
                href="https://wa.me/5585991234455?text=Olá,%20preciso%20de%20ajuda%20com%20suporte%20SACPROH"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chamar Plantão no WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 ProCirúrgica Hospitalar & SACPROH SaaS. Todos os direitos reservados.
          </span>
          <span className="text-sky-400 font-mono text-[11px]">
            Conformidade ANVISA RDC 50 & ISO 13485
          </span>
        </div>
      </footer>
    </div>
  );
};
