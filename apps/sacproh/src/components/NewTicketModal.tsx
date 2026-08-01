import React, { useState } from 'react';
import {
  PlusCircle,
  Building2,
  User,
  Mail,
  Phone,
  Tag,
  Flame,
  Send,
  FileText,
  ShieldAlert,
  Hash
} from 'lucide-react';
import { SacProhTicket, SacProhTicketCategory, SacProhPriority } from '@gritnews/types';

interface NewTicketModalProps {
  onSubmit: (ticket: Omit<SacProhTicket, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  onSubmit,
  onCancel
}) => {
  const [hospitalName, setHospitalName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<SacProhTicketCategory>('Suporte Técnico Equipamentos');
  const [priority, setPriority] = useState<SacProhPriority>('MEDIA');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [anvisaRegister, setAnvisaRegister] = useState('');

  const generateProtocol = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `SACPROH-${new Date().getFullYear()}-${randomNum}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName || !requesterName || !email || !phone || !subject || !description) return;

    const newProtocol = generateProtocol();

    onSubmit({
      protocolCode: newProtocol,
      hospitalName,
      cnpj,
      requesterName,
      email,
      phone,
      category,
      priority,
      subject,
      description,
      serialNumber: serialNumber || undefined,
      anvisaRegister: anvisaRegister || undefined,
      status: priority === 'EMERGENCIA_CIRURGICA' ? 'EM_ANALISE_TECNICA' : 'ABERTO'
    });
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Abrir Chamado Técnico SACPROH</h2>
          <p className="text-xs text-slate-400">Atendimento prioritário hospitalar e engenharia clínica ProCirúrgica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Nome do Hospital ou Clínica *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Hospital São Lucas - Centro Cirúrgico"
              value={hospitalName}
              onChange={e => setHospitalName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-sky-400" />
              <span>CNPJ da Instituição</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 01.234.567/0001-89"
              value={cnpj}
              onChange={e => setCnpj(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Nome do Solicitante *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Eng. Carlos / Dra. Ana"
              value={requesterName}
              onChange={e => setRequesterName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>E-mail Corporativo *</span>
            </label>
            <input
              type="email"
              required
              placeholder="carlos@hospital.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span>Telefone / WhatsApp *</span>
            </label>
            <input
              type="text"
              required
              placeholder="(85) 99123-4455"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span>Categoria do Atendimento *</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as SacProhTicketCategory)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            >
              <option value="Suporte Técnico Equipamentos">Suporte Técnico Equipamentos</option>
              <option value="Rastreio & Entrega Centro Cirúrgico">Rastreio & Entrega Centro Cirúrgico</option>
              <option value="Troca, Devolução & SAC">Troca, Devolução & SAC</option>
              <option value="Faturamento, NFe & Financeiro">Faturamento, NFe & Financeiro</option>
              <option value="Documentação & Registro ANVISA">Documentação & Registro ANVISA</option>
              <option value="Cotação Especial OPME & Insumos">Cotação Especial OPME & Insumos</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Nível de Prioridade *</span>
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as SacProhPriority)}
              className={`w-full border text-white rounded-xl px-3.5 py-2.5 text-xs outline-none font-bold transition-colors ${
                priority === 'EMERGENCIA_CIRURGICA'
                  ? 'bg-rose-950 border-rose-600 text-rose-200'
                  : 'bg-slate-900 border-slate-700 focus:border-sky-500'
              }`}
            >
              <option value="BAIXA">Baixa (Dúvidas gerais / Rotina)</option>
              <option value="MEDIA">Média (Suporte preventivo)</option>
              <option value="ALTA">Alta (Manutenção / Falha sem cirurgia ativa)</option>
              <option value="EMERGENCIA_CIRURGICA">🔥 EMERGÊNCIA CIRÚRGICA (Plantão imediato)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Número de Série / Patrimônio (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: BE300-2025-998"
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Registro ANVISA (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: 80239100042"
              value={anvisaRegister}
              onChange={e => setAnvisaRegister(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Assunto do Chamado *</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Calibração anual do bisturi modelo HighFreq 300W"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">
            Descrição Detalhada do Problema ou Solicitação *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Detalle o estado do equipamento, bloco cirúrgico, horários disponíveis para acesso técnico ou urgência da entrega de insumos..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors resize-none"
          />
        </div>

        {priority === 'EMERGENCIA_CIRURGICA' && (
          <div className="bg-rose-950/80 border border-rose-600/60 p-4 rounded-2xl flex items-start gap-3 text-rose-200 text-xs">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Aviso de Emergência Cirúrgica:</strong>
              Chamados marcados como emergência acionam o bipe direto da equipe de Engenharia Biomédica de plantão em até 15 minutos.
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Gerar Protocolo & Enviar Chamado</span>
          </button>
        </div>
      </form>
    </div>
  );
};
