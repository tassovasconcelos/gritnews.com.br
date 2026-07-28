import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addSubscriber } from '../../lib/storage';
import { trackEvent } from '../../lib/analytics';
import { INITIAL_CATEGORIES } from '../../data/initialData';

interface NewsletterBlockProps {
  compact?: boolean;
  sourcePage?: string;
  onSuccessToast?: (msg: string) => void;
}

export const NewsletterBlock: React.FC<NewsletterBlockProps> = ({
  compact = false,
  sourcePage = 'Geral',
  onSuccessToast
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Mercado de Saúde', 'Tecnologia e Inteligência Artificial']);
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const toggleSector = (sectorName: string) => {
    if (selectedSectors.includes(sectorName)) {
      if (selectedSectors.length > 1) {
        setSelectedSectors(selectedSectors.filter(s => s !== sectorName));
      }
    } else {
      setSelectedSectors([...selectedSectors, sectorName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Por favor, informe um e-mail corporativo válido.');
      return;
    }
    if (!lgpdConsent) {
      setError('Por favor, confirme o consentimento de dados para prosseguir.');
      return;
    }

    addSubscriber({
      email,
      name: name || 'Leitor GRIT',
      sectorInterests: selectedSectors,
      lgpdConsent: true,
      sourcePage
    });

    trackEvent('newsletter_signup', {
      metadata: { email, sectors: selectedSectors, sourcePage }
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      // safe fallback
    }

    setSubmitted(true);
    if (onSuccessToast) {
      onSuccessToast('Inscrição confirmada na Newsletter da GRIT NEWS!');
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#EAF3FF] border border-[#145EDB]/30 rounded-2xl p-6 text-center animate-fadeIn">
        <div className="w-12 h-12 bg-[#22A06B] text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-xl font-bold text-[#0B2343] mb-1">Inscrição Realizada com Sucesso!</h4>
        <p className="text-sm text-[#5C6B7A] max-w-md mx-auto mb-3">
          Você receberá semanalmente nossas análises de mercado e inteligência setorial diretamente no e-mail <strong className="text-[#10233F]">{email}</strong>.
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22A06B] bg-white px-3 py-1 rounded-full border border-[#22A06B]/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Consentimento registrado conforme LGPD
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-[#0B2343] via-[#0D2A52] to-[#145EDB] text-white rounded-2xl shadow-xl overflow-hidden ${compact ? 'p-6' : 'p-8 md:p-10'}`}>
      <div className="max-w-3xl mx-auto text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-[#FF8500] text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-3">
          <Mail className="w-3.5 h-3.5" />
          <span>Inteligência de Mercado no seu E-mail</span>
        </div>
        <h3 className={`${compact ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold text-white mb-2 leading-tight`}>
          Receba Análises e Oportunidades Estratégicas
        </h3>
        <p className="text-sm md:text-base text-[#EAF3FF] opacity-90 max-w-xl mx-auto">
          Junte-se a mais de 25.000 executivos e receba os principais dados do seu setor semanalmente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
        {!compact && (
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-2 text-left">
              Selecione seus setores de interesse principal:
            </label>
            <div className="flex flex-wrap gap-2 justify-center">
              {INITIAL_CATEGORIES.map(cat => {
                const isSelected = selectedSectors.includes(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSector(cat.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#FF8500] text-white font-bold shadow-xs'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={e => setName(e.target.value)}
            className="px-4 py-3 bg-white text-[#10233F] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8500] placeholder-gray-400 font-medium sm:w-1/3"
          />
          <input
            type="email"
            required
            placeholder="Seu melhor e-mail corporativo *"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setError('');
            }}
            className="flex-1 px-4 py-3 bg-white text-[#10233F] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8500] placeholder-gray-400 font-medium"
          />
          <button
            type="submit"
            className="bg-[#FF8500] hover:bg-[#e07500] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap text-sm cursor-pointer hover:scale-102"
          >
            <span>Assinar Grátis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-xs text-red-300 font-semibold">{error}</p>}

        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-300">
          <input
            type="checkbox"
            id={`lgpd-${sourcePage}`}
            checked={lgpdConsent}
            onChange={e => setLgpdConsent(e.target.checked)}
            className="w-4 h-4 rounded-sm text-[#FF8500] focus:ring-[#FF8500] accent-[#FF8500]"
          />
          <label htmlFor={`lgpd-${sourcePage}`} className="cursor-pointer">
            Concordo em receber conteúdos da GRIT NEWS de acordo com a Política de Privacidade (LGPD).
          </label>
        </div>
      </form>
    </div>
  );
};
