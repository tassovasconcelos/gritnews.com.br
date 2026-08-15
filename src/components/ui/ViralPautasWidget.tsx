import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  TrendingUp, 
  Video, 
  Search, 
  MessageCircle, 
  Send, 
  Eye, 
  FilePlus, 
  CheckCircle2, 
  Zap, 
  Instagram, 
  Linkedin, 
  Award,
  PawPrint,
  Scale
} from 'lucide-react';
import { getTrendingTopics, addTrendingTopic, saveArticle, getArticles } from '../../lib/storage';
import { Article } from '../../types';

interface ViralPautasWidgetProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
  onArticleCreated?: (newArticle: Article) => void;
}

export interface DailyViralPauta {
  id: string;
  topic: string;
  category: 'saude' | 'pet' | 'tecnologia' | 'automacao' | 'importacao' | 'juridico';
  targetAudience: string;
  projectedViews: string;
  tiktokHook: string;
  googleSeoTitle: string;
  whatsappMessage: string;
  suggestedTags: string[];
  trendingGrowth: string;
}

const INITIAL_VIRAL_PAUTAS: DailyViralPauta[] = [
  {
    id: 'pauta-1',
    topic: 'História de Reabilitação TenPets: Resgate com Dra. Letícia Karla Viriliza no TikTok',
    category: 'pet',
    targetAudience: 'Tutores, Protetores, TikTok Pet, Instagram Reels',
    projectedViews: '450.000+ views est.',
    tiktokHook: '“Você nunca vai adivinhar o que a veterinária encontrou nesse cãozinho abandonado na BR... Assista até o final!”',
    googleSeoTitle: 'Como o projeto TenPets com Letícia Karla revolucionou a reabilitação de animais resgatados no Brasil',
    whatsappMessage: '🐾 *Causa Animal TenPets*: Veja o caso emocionante de superação e cuidados veterinários liderado por Letícia Karla! Acesse: https://tenpets.gritnews.com.br',
    suggestedTags: ['TenPets', 'LeticiaKarla', 'ResgateAnimal', 'TikTokPets', 'CausaAnimal'],
    trendingGrowth: '+540% engajamento'
  },
  {
    id: 'pauta-2',
    topic: 'Nova Reforma Tributária (IBS/CBS) e Estratégias por Dr. Moacir Rocha',
    category: 'juridico',
    targetAudience: 'Empresários B2B, Contadores, Diretores Financeiros, LinkedIn',
    projectedViews: '180.000+ views est.',
    tiktokHook: '“Sua empresa vai pagar mais imposto em 2026? Entenda o alerta urgente do Dr. Moacir Rocha em 30 segundos!”',
    googleSeoTitle: 'Reforma Tributária 2026: Análise e Diagnóstico de Impacto com Dr. Moacir Rocha (Moacir Rocha Advocacia)',
    whatsappMessage: '⚠️ *ALERTA TRIBUTÁRIO B2B*: Como proteger sua empresa na transição IBS/CBS. Análise completa pelo Dr. Moacir Rocha: https://www.gritnews.com.br/noticia/moacir-rocha-reforma-tributaria',
    suggestedTags: ['MoacirRocha', 'MoacirRochaAdvocacia', 'ReformaTributaria', 'IBSCBS', 'DireitoTributario'],
    trendingGrowth: '+380% pesquisas'
  },
  {
    id: 'pauta-3',
    topic: 'IA e Robótica Diagnóstica em Hospitais Privados: Regulação Anvisa 2026',
    category: 'saude',
    targetAudience: 'Médicos, Gestores Hospitalares, Tech Enthusiasts, Google News',
    projectedViews: '220.000+ views est.',
    tiktokHook: '“Médicos robôs já estão fazendo triagem nos maiores hospitais do Brasil? Descubra o que a Anvisa aprovou!”',
    googleSeoTitle: 'Anvisa regulamenta robôs de triagem e IA diagnóstica nos hospitais brasileiros',
    whatsappMessage: '🏥 *Inovação em Saúde*: Anvisa autoriza primeiros algoritmos de IA autônoma para triagem hospitalar. Confira a matéria: https://www.gritnews.com.br',
    suggestedTags: ['SaudeDigital', 'Anvisa2026', 'IAHospitalar', 'Telemedicina'],
    trendingGrowth: '+290% tendência'
  },
  {
    id: 'pauta-4',
    topic: 'Gêmeos Digitais na Logística: Como Reduzir Fretes B2B em 18%',
    category: 'automacao',
    targetAudience: 'Gerentes de Logística, Armazéns, E-commerce, Indústrias',
    projectedViews: '150.000+ views est.',
    tiktokHook: '“O segredo das gigantes do e-commerce para entregar em 24h pagando metade do frete!”',
    googleSeoTitle: 'Como os Digital Twins reduzem em até 18% o custo logístico no e-commerce brasileiro',
    whatsappMessage: '📦 *Logística 4.0*: Descubra como grandes frotas usam simulação em tempo real para economizar milhões. Ler agora: https://www.gritnews.com.br',
    suggestedTags: ['Logistica40', 'DigitalTwins', 'FreteB2B', 'Automação'],
    trendingGrowth: '+210% pesquisas'
  }
];

export const ViralPautasWidget: React.FC<ViralPautasWidgetProps> = ({ onShowToast, onArticleCreated }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishedPautaIds, setPublishedPautaIds] = useState<string[]>([]);

  const filteredPautas = selectedCategory === 'all' 
    ? INITIAL_VIRAL_PAUTAS 
    : INITIAL_VIRAL_PAUTAS.filter(p => p.category === selectedCategory);

  const copyText = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${label}`);
    onShowToast(`${label} copiado para a área de transferência!`, 'success');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const publishAsArticle = (pauta: DailyViralPauta) => {
    const slug = pauta.topic
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newArticle: Article = {
      id: `art-viral-${Date.now()}`,
      title: pauta.googleSeoTitle,
      slug,
      subtitle: pauta.topic,
      summary: `${pauta.googleSeoTitle}. Pauta diária otimizada para engajamento em massa no TikTok, Meta e Google Search.`,
      categoryId: pauta.category === 'pet' ? 'cat-pet' : pauta.category === 'juridico' ? 'cat-negocios' : 'cat-tech',
      tags: pauta.suggestedTags,
      authorId: pauta.category === 'pet' ? 'author-leticia' : 'author-tasso',
      status: 'PUBLISHED',
      featuredImage: pauta.category === 'pet' 
        ? 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200'
        : pauta.category === 'juridico'
        ? 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200'
        : 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readingTimeMinutes: 4,
      viewsCount: 1250,
      likesCount: 88,
      sharesCount: 142,
      isEvergreen: true,
      blocks: [
        {
          id: 'b1',
          type: 'paragraph',
          content: pauta.googleSeoTitle
        },
        {
          id: 'b2',
          type: 'heading2',
          content: 'Por que este assunto está dominando as redes e os motores de busca'
        },
        {
          id: 'b3',
          type: 'paragraph',
          content: `Com um crescimento de ${pauta.trendingGrowth} e estimativa de atração de mais de ${pauta.projectedViews}, esta pauta destaca os avanços estratégicos no setor de ${pauta.category.toUpperCase()}. O GRIT NEWS acompanha os bastidores e os dados oficiais do segmento.`
        },
        {
          id: 'b4',
          type: 'callout',
          content: `Hook Recomendado para Redes Sociais: "${pauta.tiktokHook}"`
        }
      ],
      seo: {
        metaTitle: `${pauta.googleSeoTitle} | GRIT NEWS`,
        metaDescription: pauta.topic,
        keywords: pauta.suggestedTags
      }
    };

    saveArticle(newArticle);
    setPublishedPautaIds(prev => [...prev, pauta.id]);
    onShowToast(`Matéria "${pauta.googleSeoTitle.slice(0, 35)}..." publicada com sucesso no feed!`, 'success');
    if (onArticleCreated) onArticleCreated(newArticle);
  };

  return (
    <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-500/30 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              <Flame className="w-4 h-4 fill-current" />
              <span>Estratégia 1 Milhão de Views</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Pautas Diárias Virais (TikTok, Meta & Google)</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Conteúdos de altíssimo potencial de engajamento pré-formatados com ganchos para vídeos curtos (TikTok/Reels), títulos SEO para Google News e mensagens para listas de transmissão WhatsApp.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-amber-400/30 p-3 rounded-2xl text-center shrink-0">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-widest block">Meta do Ecossistema</span>
            <span className="text-xl font-black text-white block">1.000.000+</span>
            <span className="text-[10px] text-slate-300">Visualizações Mensais</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            Todas as Pautas Virais
          </button>
          <button
            onClick={() => setSelectedCategory('pet')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'pet'
                ? 'bg-rose-500 text-white shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <PawPrint className="w-3.5 h-3.5" />
            <span>TenPets Causa Animal</span>
          </button>
          <button
            onClick={() => setSelectedCategory('juridico')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'juridico'
                ? 'bg-sky-500 text-slate-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Moacir Rocha Direito/Fiscal</span>
          </button>
          <button
            onClick={() => setSelectedCategory('saude')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'saude'
                ? 'bg-emerald-500 text-slate-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            Saúde & IA Hospitalar
          </button>
          <button
            onClick={() => setSelectedCategory('automacao')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'automacao'
                ? 'bg-purple-500 text-white shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            Automação Logística
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {filteredPautas.map(pauta => {
            const isPublished = publishedPautaIds.includes(pauta.id);

            return (
              <div
                key={pauta.id}
                className="bg-white/5 border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 space-y-4 transition-all hover:bg-white/[0.07] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px]">
                      {pauta.category.toUpperCase()} • {pauta.trendingGrowth}
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {pauta.projectedViews}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white leading-snug">
                    {pauta.topic}
                  </h3>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    <strong>Público Alvo:</strong> {pauta.targetAudience}
                  </p>

                  {/* 1. TikTok / Reels Video Hook */}
                  <div className="bg-slate-950/80 border border-pink-500/30 p-3 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-pink-400">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        <span>Gancho Viral TikTok / Instagram Reels:</span>
                      </span>
                      <button
                        onClick={() => copyText(pauta.id, pauta.tiktokHook, 'Hook TikTok')}
                        className="text-[10px] bg-pink-500/20 hover:bg-pink-500/40 text-pink-200 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `${pauta.id}-Hook TikTok` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === `${pauta.id}-Hook TikTok` ? 'Copiado' : 'Copiar Hook'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-pink-100 font-mono italic bg-black/40 p-2 rounded border border-white/5">
                      {pauta.tiktokHook}
                    </p>
                  </div>

                  {/* 2. Google News / SEO Title */}
                  <div className="bg-slate-950/80 border border-sky-500/30 p-3 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                      <span className="flex items-center gap-1">
                        <Search className="w-3.5 h-3.5" />
                        <span>Título Otimizado Google News & Search:</span>
                      </span>
                      <button
                        onClick={() => copyText(pauta.id, pauta.googleSeoTitle, 'Título SEO')}
                        className="text-[10px] bg-sky-500/20 hover:bg-sky-500/40 text-sky-200 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `${pauta.id}-Título SEO` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === `${pauta.id}-Título SEO` ? 'Copiado' : 'Copiar SEO'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-sky-100 font-semibold leading-snug">
                      {pauta.googleSeoTitle}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {pauta.suggestedTags.map((tag, idx) => (
                      <span key={idx} className="bg-white/10 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    onClick={() => copyText(pauta.id, pauta.whatsappMessage, 'Mensagem WhatsApp')}
                    className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiar Whats/Zap</span>
                  </button>

                  <button
                    onClick={() => publishAsArticle(pauta)}
                    disabled={isPublished}
                    className={`flex-1 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      isPublished
                        ? 'bg-emerald-800 text-emerald-200 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    }`}
                  >
                    {isPublished ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Matéria Publicada!</span>
                      </>
                    ) : (
                      <>
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Publicar Matéria com IA</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
