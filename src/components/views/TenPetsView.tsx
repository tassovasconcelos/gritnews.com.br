import React, { useState } from 'react';
import { 
  Heart, 
  Award, 
  BookOpen, 
  Sparkles, 
  ExternalLink, 
  FileText, 
  ShieldCheck, 
  Video, 
  CheckCircle2, 
  Share2, 
  MessageSquare, 
  Search, 
  PawPrint,
  GraduationCap,
  Scale,
  Send,
  UserCheck,
  Instagram,
  Copy,
  Check,
  DollarSign,
  Gift,
  Home
} from 'lucide-react';
import { TenPetsArticle, TenPetsRescue, TenPetsPartner } from '../../types';
import { getTenPetsArticles, getTenPetsRescues, getTenPetsPartners } from '../../lib/storage';

interface TenPetsViewProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const TenPetsView: React.FC<TenPetsViewProps> = ({ onShowToast }) => {
  const [articles] = useState<TenPetsArticle[]>(getTenPetsArticles());
  const [rescues] = useState<TenPetsRescue[]>(getTenPetsRescues());
  const [partners] = useState<TenPetsPartner[]>(getTenPetsPartners());

  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'rescues' | 'partners'>('all');
  const [selectedArticle, setSelectedArticle] = useState<TenPetsArticle | null>(null);
  const [selectedRescue, setSelectedRescue] = useState<TenPetsRescue | null>(null);
  const [beforeAfterToggle, setBeforeAfterToggle] = useState<Record<string, 'after' | 'before'>>({});

  // Contact / Support form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState<'Apoio Resgate' | 'Dúvida Jurídica Animal' | 'Parceria Clínica' | 'Outro'>('Apoio Resgate');
  const [contactMessage, setContactMessage] = useState('');
  const [pixCopied, setPixCopied] = useState(false);

  const copyPixKey = () => {
    navigator.clipboard.writeText('gritsolucoes@gmail.com');
    setPixCopied(true);
    onShowToast('Chave Pix gritsolucoes@gmail.com copiada para a área de transferência!', 'success');
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactName) {
      onShowToast('Por favor, preencha seu nome e e-mail.', 'info');
      return;
    }

    const emailSubject = encodeURIComponent(`[TenPets Contato] ${contactSubject} - ${contactName}`);
    const emailBody = encodeURIComponent(
      `Nome: ${contactName}\nE-mail: ${contactEmail}\nTelefone/WhatsApp: ${contactPhone}\nAssunto: ${contactSubject}\n\nMensagem:\n${contactMessage}`
    );
    const mailtoUrl = `mailto:gritsolucoes@gmail.com?subject=${emailSubject}&body=${emailBody}`;

    onShowToast('Sua mensagem foi enviada para o e-mail gritsolucoes@gmail.com! Retornaremos em breve.', 'success');
    
    try {
      window.location.href = mailtoUrl;
    } catch (err) {
      // Fallback
    }

    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactMessage('');
  };

  const toggleImageMode = (rescueId: string) => {
    setBeforeAfterToggle(prev => ({
      ...prev,
      [rescueId]: prev[rescueId] === 'before' ? 'after' : 'before'
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16 transition-colors">
      {/* Subdomain Header Bar */}
      <div className="bg-amber-600 text-white text-xs py-2 px-4 text-center font-medium shadow-inner flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <PawPrint className="w-4 h-4 animate-bounce" />
          <span>Subdomínio Oficial: <strong>tenpets.gritnews.com.br</strong></span>
        </div>
        <span>•</span>
        <a
          href="https://www.instagram.com/tenpets_"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-amber-100 px-3 py-1 rounded-full text-xs font-bold transition-all border border-amber-500 shadow-sm"
        >
          <Instagram className="w-3.5 h-3.5 text-rose-300" />
          <span>Instagram @tenpets_</span>
          <ExternalLink className="w-3 h-3 text-amber-300" />
        </a>
      </div>

      {/* Hero Section with Official Branding & Letícia Karla Profile */}
      <section className="bg-gradient-to-br from-amber-800 via-amber-900 to-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-xl relative overflow-hidden">
        {/* Background Subtle Image Overlay */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <img
            src="/src/assets/images/tenpets_hero_banner_1785288987038.jpg"
            alt="TenPets Hero"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1600";
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Official TenPets Logo Emblem */}
              <div className="flex items-center gap-2.5 bg-white/10 border border-amber-400/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg">
                <img
                  src="/src/assets/images/tenpets_official_logo_1785288965710.jpg"
                  alt="TenPets Logo"
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-amber-400/60"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300";
                  }}
                />
                <span className="font-extrabold text-amber-300 tracking-wide text-sm">TenPets</span>
              </div>

              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Medicina Veterinária & Direito Animal</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ciência Veterinária, Proteção Animal & Direitos Pet
            </h1>

            <p className="text-slate-200 text-base sm:text-lg leading-relaxed font-light">
              Espaço oficial de pesquisas científicas veterinárias, cases jurídicos em defesa dos animais e relatos de reabilitação e resgate produzidos e assinados por <strong>Letícia Karla</strong>.
            </p>

            {/* Badges of Letícia Karla */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium text-amber-100 shadow-xs">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                Estudante de Medicina Veterinária
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium text-amber-100 shadow-xs">
                <Heart className="w-4 h-4 text-rose-400" />
                Protetora de Animais
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium text-amber-100 shadow-xs">
                <BookOpen className="w-4 h-4 text-emerald-300" />
                Escritora de Artigos Científicos
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium text-amber-100 shadow-xs">
                <Scale className="w-4 h-4 text-sky-300" />
                Advogada em Direito Animal
              </span>
            </div>

            {/* Navigation Quick Filter */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Todos os Conteúdos
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'articles'
                    ? 'bg-amber-500 text-slate-950 shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Artigos Científicos ({articles.length})
              </button>
              <button
                onClick={() => setActiveTab('rescues')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rescues'
                    ? 'bg-amber-500 text-slate-950 shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Casos de Resgate ({rescues.length})
              </button>
              <button
                onClick={() => setActiveTab('partners')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'partners'
                    ? 'bg-amber-500 text-slate-950 shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Rede de Parceiros ({partners.length})
              </button>
            </div>
          </div>

          {/* Author Card Profile Letícia Karla */}
          <div className="lg:col-span-4 bg-white/10 border border-amber-400/40 backdrop-blur-2xl rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/30 rounded-full blur-2xl"></div>
            <div className="relative z-10 space-y-4">
              
              {/* Photo Letícia Karla */}
              <div className="w-28 h-28 mx-auto rounded-full ring-4 ring-amber-400/70 p-1 overflow-hidden shadow-2xl bg-slate-900 transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/src/assets/images/leticia_karla_profile_1785288976216.jpg"
                  alt="Letícia Karla"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400";
                  }}
                />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center justify-center gap-1.5">
                  <span>Letícia Karla</span>
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-amber-300 font-medium mt-1 leading-snug">
                  Estudante de Medicina Veterinária • Protetora • Escritora • Advogada
                </p>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-light italic bg-black/20 p-3 rounded-2xl border border-white/10">
                "A verdadeira compaixão une a precisão da ciência médica à justiça do Direito para transformar a vida dos animais."
              </p>

              {/* Instagram Official @tenpets_ button */}
              <a
                href="https://www.instagram.com/tenpets_"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xl transition-all hover:scale-[1.02]"
              >
                <Instagram className="w-4 h-4" />
                <span>Siga @tenpets_ no Instagram</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <div className="pt-2 border-t border-white/10 flex justify-around text-center text-xs">
                <div>
                  <span className="block font-bold text-lg text-amber-300">100%</span>
                  <span className="text-slate-300 text-[10px]">Científico & Legal</span>
                </div>
                <div>
                  <span className="block font-bold text-lg text-amber-300">+50</span>
                  <span className="text-slate-300 text-[10px]">Casos de Reabilitação</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        
        {/* INSTAGRAM OFFICIAL SHOWCASE @tenpets_ */}
        <section className="bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-rose-500/80 p-0.5 bg-slate-900 shrink-0 shadow-xl">
                <img
                  src="/src/assets/images/tenpets_official_logo_1785288965710.jpg"
                  alt="@tenpets_"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white">@tenpets_</h3>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Instagram Oficial
                  </span>
                </div>
                <p className="text-xs text-amber-200 mt-1">
                  Ciência Veterinária • Direito Animal • Proteção & Resgates com Letícia Karla
                </p>
              </div>
            </div>

            <a
              href="https://www.instagram.com/tenpets_"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg hover:scale-105 shrink-0"
            >
              <Instagram className="w-4 h-4" />
              <span>Acessar @tenpets_ no Instagram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Instagram Post Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <a
              href="https://www.instagram.com/tenpets_"
              target="_blank"
              rel="noreferrer"
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-all group"
            >
              <div className="relative h-44 overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600"
                  alt="Post Instagram Dermatologia Vet"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-amber-300 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-rose-400" />
                  <span>Post Vet</span>
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] text-amber-300 font-mono">Dermatologia & Imunologia</span>
                <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                  Entenda como a imunoterapia monoclonal melhora a qualidade de vida de cães com dermatite.
                </p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/tenpets_"
              target="_blank"
              rel="noreferrer"
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-all group"
            >
              <div className="relative h-44 overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600"
                  alt="Post Instagram Resgate Thor"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-emerald-300 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>Resgate</span>
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] text-emerald-300 font-mono">Reabilitação Thor</span>
                <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                  De sobrevivente de atropelamento a campeão do afeto: veja a jornada do Valente Thor.
                </p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/tenpets_"
              target="_blank"
              rel="noreferrer"
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-all group"
            >
              <div className="relative h-44 overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600"
                  alt="Post Instagram Direito Animal"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-sky-300 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Scale className="w-3 h-3 text-sky-400" />
                  <span>Direito Pet</span>
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] text-sky-300 font-mono">Direito Animal com Letícia Karla</span>
                <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                  Como funciona a tutela de urgência e a Lei Sansão no resgate judicial de animais vitimados.
                </p>
              </div>
            </a>
          </div>
        </section>

        {/* SECTION 1: Scientific Articles & Publications */}
        {(activeTab === 'all' || activeTab === 'articles') && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Produção Científica & Jurídica</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Artigos e Pesquisas Publicadas por Letícia Karla
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Revisão por pares & Casos Clínicos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {articles.map(art => (
                <div
                  key={art.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-52 overflow-hidden bg-slate-900">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md uppercase">
                        {art.category}
                      </div>
                      {art.doi && (
                        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/30">
                          DOI: {art.doi}
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Autora: {art.authorName}</span>
                        <span>•</span>
                        <span>{new Date(art.publishedAt).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {art.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {art.tags?.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-700/50 mt-4 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedArticle(art)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ler Artigo Completo</span>
                    </button>

                    {art.pdfUrl && (
                      <a
                        href={art.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>PDF Oficial</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: Romantic Stories of Rescue & Success (Casos de Resgate) */}
        {(activeTab === 'all' || activeTab === 'rescues') && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <Heart className="w-4 h-4" />
                  <span>Histórias de Amor & Recuperação</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Cases de Resgate & Histórias Romanceadas de Vitória
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe fotos Antes/Depois e reabilitação veterinária
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {rescues.map(rescue => {
                const currentMode = beforeAfterToggle[rescue.id] || 'after';
                const displayedImage = currentMode === 'before' ? rescue.beforeImageUrl : rescue.afterImageUrl;

                return (
                  <div
                    key={rescue.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Viewer with Before / After Toggle */}
                      <div className="relative h-64 overflow-hidden bg-slate-950 group">
                        <img
                          src={displayedImage}
                          alt={rescue.animalName}
                          className="w-full h-full object-cover transition-all duration-500"
                        />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                            {rescue.status.replace('_', ' ')}
                          </span>
                          <span className="bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-medium px-2 py-1 rounded-full">
                            {rescue.species} • {rescue.breed || 'SRD'}
                          </span>
                        </div>

                        {/* Before / After Switch Button */}
                        <div className="absolute bottom-3 right-3 flex items-center bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-lg p-1 shadow-xl">
                          <button
                            onClick={() => toggleImageMode(rescue.id)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                              currentMode === 'before'
                                ? 'bg-rose-600 text-white shadow'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            Antes
                          </button>
                          <button
                            onClick={() => toggleImageMode(rescue.id)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                              currentMode === 'after'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            Depois (Recuperado)
                          </button>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {rescue.animalName}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            Resgatado em: {new Date(rescue.rescueDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 italic">
                          "{rescue.title}"
                        </p>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                          {rescue.romanticStory}
                        </p>

                        {/* Vet Care Highlights */}
                        {rescue.vetCareNotes && (
                          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Tratamento e Cuidados Médicos:
                            </span>
                            <p className="italic text-[11px] leading-relaxed">{rescue.vetCareNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions & Sponsorship Goal */}
                    <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-700/50 mt-2 space-y-4">
                      {rescue.sponsorGoal && rescue.sponsorGoal > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span>Custos Médicos & Reabilitação:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              R$ {rescue.currentSponsorTotal?.toLocaleString('pt-BR')} / R$ {rescue.sponsorGoal?.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((rescue.currentSponsorTotal || 0) / rescue.sponsorGoal) * 100
                                )}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => setSelectedRescue(rescue)}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ler História Romanceada</span>
                        </button>

                        {rescue.videoUrl && (
                          <a
                            href={rescue.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white p-2.5 rounded-xl transition-colors"
                            title="Assistir Vídeo do Resgate"
                          >
                            <Video className="w-4 h-4 text-rose-500" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 3: Partners Network (Rede de Apoio e Clínicas) */}
        {(activeTab === 'all' || activeTab === 'partners') && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Rede Credenciada & ONGs</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Parceiros e Apoiadores Estratégicos TenPets
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map(p => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h4>
                        <span className="inline-block bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5">
                          {p.type}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {p.description}
                    </p>

                    {p.discountBenefit && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-2.5 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{p.discountBenefit}</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={p.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold py-2 rounded-xl transition-colors"
                  >
                    Conhecer Parceiro
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: SEJA DOADOR E APOIE A CAUSA ANIMAL */}
        <section className="bg-gradient-to-br from-rose-900 via-slate-900 to-amber-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-rose-500/30">
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/40 px-4 py-1.5 rounded-full text-xs font-black text-rose-300">
                <Heart className="w-4 h-4 text-rose-400 fill-current animate-pulse" />
                <span>TenPets Causa Animal & Reabilitação</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Seja Doador e Transforme Vidas Resgatadas
              </h2>
              <p className="text-slate-200 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-light">
                Cada centavo doado é investido integralmente no atendimento veterinário de urgência, exames laboratoriais, ração de alta qualidade e proteção jurídica de animais vulneráveis.
              </p>
            </div>

            {/* PIX BOX CARD */}
            <div className="bg-white/10 backdrop-blur-md border border-amber-400/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">
                Chave Pix Oficial para Doações Diretas
              </span>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-slate-950/80 border border-amber-400/30 p-4 rounded-2xl max-w-md mx-auto">
                <span className="font-mono text-base sm:text-lg font-black text-amber-300 break-all">
                  gritsolucoes@gmail.com
                </span>
                <button
                  onClick={copyPixKey}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {pixCopied ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Pix</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-300 font-light">
                Titular: GRIT NEWS / TenPets Proteção Animal • Banco/Instituição: Chave Pix E-mail
              </p>
            </div>

            {/* 4 MODALIDADES DE APOIO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 hover:border-amber-400/40 p-5 rounded-2xl space-y-2 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Doação Financeira</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Contribua com qualquer valor via Pix para custear cirurgias, medicamentos e procedimentos de emergência.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 hover:border-amber-400/40 p-5 rounded-2xl space-y-2 transition-all">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Ração & Insumos</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Doe sacos de ração super premium, tapetes higiênicos, soro, vermífugos e pomadas cicatrizantes.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 hover:border-amber-400/40 p-5 rounded-2xl space-y-2 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Apadrinhamento</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apadrinhe o tratamento mensal de um cão ou gato específico até que esteja pronto para adoção.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 hover:border-amber-400/40 p-5 rounded-2xl space-y-2 transition-all">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Lar Temporário</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ofereça abrigo temporário seguro em sua residência durante a fase de recuperação pós-operatória.
                </p>
              </div>
            </div>

            {/* COST TRANSPARENCY CARD */}
            <div className="bg-slate-950/70 border border-white/10 p-6 rounded-2xl space-y-3 text-xs">
              <h4 className="font-extrabold text-amber-300 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Transparência de Custos Médicos e Insumos:</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block font-black text-white text-sm">R$ 80</span>
                  <span className="text-[10px] text-slate-400">Vacina V10 / Antirrábica</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block font-black text-white text-sm">R$ 120</span>
                  <span className="text-[10px] text-slate-400">Consulta + Hemograma</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block font-black text-white text-sm">R$ 180</span>
                  <span className="text-[10px] text-slate-400">Saco Ração 15kg</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block font-black text-white text-sm">R$ 250</span>
                  <span className="text-[10px] text-slate-400">Castração & Pós-Op</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 5: Contact & Support Form for Letícia Karla */}
        <section className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-amber-500/20">
          <div className="max-w-3xl mx-auto space-y-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Fale com a Protetora e Advogada Letícia Karla</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Sua Parceria ou Dúvida Pode Salvar Vidas
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Deseja indicar um caso clínico veterinário, solicitar apoio jurídico animal, oferecer abrigo temporário ou apadrinhar um resgatado? Preencha o formulário abaixo para contato direto.
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-4 text-left bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Seu Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="Ex: Maria Oliveira"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-mail para Retorno *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="maria@exemplo.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assunto do Contato</label>
                  <select
                    value={contactSubject}
                    onChange={e => setContactSubject(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Apoio Resgate">Apoio a Caso de Resgate</option>
                    <option value="Dúvida Jurídica Animal">Dúvida Jurídica em Direito Animal</option>
                    <option value="Parceria Clínica">Parceria Clínica / Laboratório</option>
                    <option value="Outro">Outro Assunto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sua Mensagem</label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Escreva detalhes da sua mensagem, história ou solicitação..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Mensagem para TenPets</span>
              </button>
            </form>
          </div>
        </section>

      </main>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                  {selectedArticle.category}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {selectedArticle.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Publicado por {selectedArticle.authorName} em {new Date(selectedArticle.publishedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
              {selectedArticle.content}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between items-center">
              {selectedArticle.pdfUrl && (
                <a
                  href={selectedArticle.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Baixar Artigo em PDF</span>
                </a>
              )}
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-slate-300 transition-colors ml-auto"
              >
                Fechar Leitura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCUE ROMANTIC STORY MODAL */}
      {selectedRescue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                  {selectedRescue.animalName} • {selectedRescue.status.replace('_', ' ')}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {selectedRescue.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRescue(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Before vs After Images Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-center">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Antes do Resgate</span>
                <img src={selectedRescue.beforeImageUrl} alt="Antes" className="w-full h-44 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Depois (Recuperado)</span>
                <img src={selectedRescue.afterImageUrl} alt="Depois" className="w-full h-44 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">A História Romanceada:</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line italic bg-amber-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-amber-200/50 dark:border-slate-700">
                {selectedRescue.romanticStory}
              </p>
            </div>

            {selectedRescue.vetCareNotes && (
              <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-amber-600 dark:text-amber-400 block">Prontuário Veterinário & Procedimentos:</span>
                <p>{selectedRescue.vetCareNotes}</p>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedRescue(null)}
                className="bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-xl hover:bg-amber-700 transition-colors"
              >
                Fechar História
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
