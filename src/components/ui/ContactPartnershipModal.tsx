/**
 * ============================================================================
 * MODAL DE CONTATO, PARCERIAS E CANDIDATURA DE EDITORES / PATROCINADORES GRIT
 * ============================================================================
 * 
 * CANAL DIRETO DE ATENDIMENTO B2B E PARCERIAS:
 * E-mail de destino oficial: gritsolucoes@gmail.com
 * 
 * OBJETIVOS DO FORMULÁRIO:
 * 1. Proposta de Parceria Comercial e Patrocínio de Conteúdo
 * 2. Envio de Notícias e Pautas para Publicação
 * 3. Candidatura para ser Editor, Colaborador ou Autor do Ecossistema
 * 4. Candidatura para ser Correspondente Regional GRIT
 * 5. Propostas de Anúncios e Mídias B2B / TenPets
 */

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, User, Building, Phone, Sparkles, MessageSquare, Briefcase, FileText, Globe, PawPrint } from 'lucide-react';
import { Modal } from './Modal';

interface ContactPartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const ContactPartnershipModal: React.FC<ContactPartnershipModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [interestType, setInterestType] = useState<string>('PATROCINADOR');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyOrRole, setCompanyOrRole] = useState('');
  const [cityState, setCityState] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simula envio de e-mail e registro de lead para gritsolucoes@gmail.com
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      onShowToast(`Sua mensagem foi enviada com sucesso para gritsolucoes@gmail.com!`, 'success');
    }, 800);
  };

  const handleReset = () => {
    setSubmittedSuccess(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setCompanyOrRole('');
    setCityState('');
    setMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Contato, Parcerias & Colaboradores GRIT NEWS"
    >
      {submittedSuccess ? (
        <div className="text-center py-6 space-y-4 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0B2343]">Solicitação Enviada com Sucesso!</h3>
            <p className="text-xs text-[#5C6B7A] max-w-md mx-auto leading-relaxed">
              Sua mensagem foi encaminhada diretamente para nossa equipe comercial e editorial no e-mail:
            </p>
            <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-3 rounded-xl font-mono text-xs font-bold text-[#145EDB] max-w-sm mx-auto my-2">
              gritsolucoes@gmail.com
            </div>
            <p className="text-[11px] text-gray-500">
              Retornaremos em até 24 horas úteis com os detalhes da proposta ou procedimento.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="mt-4 bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gradient-to-r from-[#0B2343] to-[#145EDB] text-white p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-extrabold uppercase tracking-wide">Atendimento Direto & Oportunidades</span>
            </div>
            <p className="text-[11px] text-slate-200 font-light">
              Canal oficial de recebimento de propostas comerciais e pautas no e-mail: <strong className="text-amber-300 font-mono">gritsolucoes@gmail.com</strong>
            </p>
          </div>

          {/* Tipo de Interesse */}
          <div>
            <label className="block text-xs font-bold text-[#0B2343] uppercase tracking-wider mb-1.5">
              Qual o seu objetivo de contato? *
            </label>
            <select
              value={interestType}
              onChange={e => setInterestType(e.target.value)}
              className="w-full bg-[#F7F9FC] border border-[#E2E8F0] focus:border-[#145EDB] focus:ring-2 focus:ring-[#145EDB]/30 rounded-xl px-3 py-2.5 text-xs text-[#0B2343] font-medium outline-none"
            >
              <option value="PATROCINADOR">Ser Patrocinador / Anunciante de Conteúdo B2B</option>
              <option value="PARCERIA_AFILIADOS">Parceria de Afiliados e Ofertas Comerciais</option>
              <option value="SER_EDITOR">Candidatar-se a Editor ou Autor Colaborador</option>
              <option value="CORRESPONDENTE">Ser Correspondente Regional de Notícias</option>
              <option value="ENVIAR_PAUTA">Envio de Notícia, Press Release ou Pauta</option>
              <option value="TENPETS">Parceria com o Portal TenPets (Letícia Karla)</option>
            </select>
          </div>

          {/* Nome e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome Completo *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-[#F7F9FC] border border-[#E2E8F0] focus:border-[#145EDB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0B2343] outline-none"
                />
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">E-mail para Retorno *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full bg-[#F7F9FC] border border-[#E2E8F0] focus:border-[#145EDB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0B2343] outline-none"
                />
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Telefone e Empresa / Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">WhatsApp / Telefone *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#F7F9FC] border border-[#E2E8F0] focus:border-[#145EDB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0B2343] outline-none"
                />
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Empresa / Profissão</label>
              <div className="relative">
                <input
                  type="text"
                  value={companyOrRole}
                  onChange={e => setCompanyOrRole(e.target.value)}
                  placeholder="ex: Diretor de Marketing / Jornalista"
                  className="w-full bg-[#F7F9FC] border border-[#E2E8F0] focus:border-[#145EDB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0B2343] outline-none"
                />
                <Building className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Cidade / Estado */}
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Cidade / Estado</label>
            <div className="relative">
              <input
                type="text"
                value={cityState}
                onChange={e => setCityState(e.target.value)}
                placeholder="ex: São Paulo - SP / Rio de Janeiro - RJ"
                className="w-full bg-[#F7F9FC] border border-[#E2E8F0] focus:border-[#145EDB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0B2343] outline-none"
              />
              <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Mensagem / Proposta */}
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Mensagem ou Detalhes da Proposta *</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Descreva sua proposta comercial, ideia de artigo, pauta ou interesse em patrocinar matérias..."
              className="w-full bg-[#F7F9FC] border border-[#E2E8F0] focus:border-[#145EDB] rounded-xl p-3 text-xs text-[#0B2343] outline-none resize-none"
            />
          </div>

          {/* Botão Enviar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#145EDB] to-amber-600 hover:from-blue-700 hover:to-amber-500 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Encaminhando para gritsolucoes@gmail.com...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar para gritsolucoes@gmail.com</span>
              </>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
};
