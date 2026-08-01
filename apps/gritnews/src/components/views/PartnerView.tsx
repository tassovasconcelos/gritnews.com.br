import React, { useState } from 'react';
import { ArrowLeft, Building2, ExternalLink, ShieldCheck, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Partner, Article, Offer } from '../../types';
import { Badge } from '../ui/Badge';
import { OfferCard } from '../ui/OfferCard';
import { addLead } from '../../lib/storage';

interface PartnerViewProps {
  partner: Partner;
  articles: Article[];
  offers: Offer[];
  onSelectArticle: (article: Article) => void;
  onBackToHome: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string) => void;
}

export const PartnerView: React.FC<PartnerViewProps> = ({
  partner,
  articles,
  offers,
  onSelectArticle,
  onBackToHome,
  onOpenLeadModal,
  onShowToast
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const partnerArticles = articles.filter(a => a.partnerId === partner.id);
  const partnerOffers = offers.filter(o => o.partnerId === partner.id);

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addLead({
      name,
      email,
      phone,
      company,
      sectorInterest: partner.sector,
      partnerId: partner.id,
      message,
      lgpdConsent: true
    });

    setSubmitted(true);
    onShowToast(`Solicitação enviada com sucesso para ${partner.name}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-12">
      <button
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145EDB] hover:text-[#0B2343]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      {/* Partner Cover Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-md">
        {partner.coverImage && (
          <img src={partner.coverImage} alt={partner.name} className="w-full h-48 md:h-64 object-cover" />
        )}

        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={partner.logo}
            alt={partner.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-[#E2E8F0] shadow-md -mt-12 md:-mt-16 bg-white p-2 shrink-0"
          />

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-[#0B2343]">{partner.name}</h1>
                  <Badge variant="orange">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Parceiro {partner.partnershipTier}
                  </Badge>
                </div>
                <p className="text-xs font-bold text-[#145EDB]">{partner.sector}</p>
              </div>

              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer"
                className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 self-center md:self-auto shadow-sm"
              >
                <span>Visitar Website Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-sm text-[#5C6B7A] max-w-3xl leading-relaxed">{partner.description}</p>
          </div>
        </div>
      </div>

      {/* Grid Partner Offers & Sponsored Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          {partnerOffers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-[#0B2343] mb-4">Ofertas de {partner.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partnerOffers.map(o => (
                  <OfferCard key={o.id} offer={o} onOpenLeadModal={onOpenLeadModal} onShowToast={onShowToast} />
                ))}
              </div>
            </div>
          )}

          {partnerArticles.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-[#0B2343] mb-4">Matérias e Case Studies Patrocinados</h3>
              <div className="space-y-4">
                {partnerArticles.map(art => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all"
                  >
                    <img
                      src={art.featuredImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800';
                      }}
                      className="w-24 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#10233F] group-hover:text-[#145EDB] line-clamp-2">
                        {art.title}
                      </h4>
                      <p className="text-xs text-[#5C6B7A] line-clamp-1 mt-1">{art.summary}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF8500] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lead Capture Form for Partner */}
        <div className="lg:col-span-5">
          <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-6 md:p-8 rounded-3xl sticky top-24">
            <h3 className="text-lg font-bold text-[#0B2343] mb-2">
              Solicitar Contato Comercial de {partner.name}
            </h3>
            <p className="text-xs text-[#5C6B7A] mb-6">
              Preencha o formulário e receba proposta personalizada de um especialista.
            </p>

            {submitted ? (
              <div className="bg-[#EAF3FF] p-6 rounded-2xl text-center border border-[#145EDB]/30 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#22A06B] mx-auto" />
                <h4 className="font-bold text-[#0B2343]">Solicitação Enviada!</h4>
                <p className="text-xs text-[#5C6B7A]">
                  A equipe de {partner.name} entrará em contato pelo e-mail <strong>{email}</strong> em até 24h úteis.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Seu Nome Completo *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm"
                />
                <input
                  type="email"
                  required
                  placeholder="Seu E-mail Corporativo *"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm"
                />
                <input
                  type="tel"
                  placeholder="Telefone / WhatsApp"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm"
                />
                <input
                  type="text"
                  placeholder="Nome da sua Empresa"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm"
                />
                <textarea
                  rows={3}
                  placeholder="Como o parceiro pode te ajudar?"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-[#FF8500] hover:bg-[#e07500] text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all cursor-pointer"
                >
                  Enviar para Parceiro
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
