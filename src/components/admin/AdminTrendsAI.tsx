import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Send, CheckCircle2, RefreshCw, Globe, ArrowRight, Layers, FileText, Search, Zap, Check } from 'lucide-react';
import { TrendingTopic, Article, Category } from '../../types';
import { getTrendingTopics, addTrendingTopic, updateTrendingTopicStatus, saveArticle, getCategories } from '../../lib/storage';
import { ViralPautasWidget } from '../ui/ViralPautasWidget';

interface AdminTrendsAIProps {
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminTrendsAI: React.FC<AdminTrendsAIProps> = ({ onRefreshData, onShowToast }) => {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  
  // Draft preview modal state
  const [previewArticle, setPreviewArticle] = useState<Partial<Article> | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrends(getTrendingTopics());
    setCategories(getCategories());
  };

  const handleAddCustomTrend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyword.trim()) return;

    const newTrend = addTrendingTopic({
      topic: customKeyword.trim(),
      category: 'tecnologia',
      searchVolume: `${Math.floor(15 + Math.random() * 65)}.${Math.floor(Math.random() * 9)}K pesquisas/mês`,
      growthRate: `+${Math.floor(120 + Math.random() * 300)}% este mês`,
      status: 'TRENDING',
      suggestedTitle: `Inovação e Tendências em ${customKeyword.trim()}: Impactos para o Setor em 2026`,
      summary: `Análise profunda sobre os avanços recentes em ${customKeyword.trim()} e oportunidades estratégicas de mercado.`,
      keywords: [customKeyword.trim(), 'Inovação', 'Mercado 2026', 'Inovação Tecnológica']
    });

    setTrends(getTrendingTopics());
    setCustomKeyword('');
    onShowToast(`Nova pauta "${newTrend.topic}" adicionada ao radar de tendências!`);
  };

  const handleGenerateAIDraft = async (topic: TrendingTopic) => {
    setIsGenerating(topic.id);
    onShowToast(`Analisando buscas e gerando rascunho com IA para "${topic.topic}"...`);

    // Simulate AI generation with rich structured content mapped to categories
    setTimeout(() => {
      const catObj = categories.find(c => c.slug === topic.category) || categories[0];
      
      const imageMap: Record<string, string> = {
        saude: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
        pet: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200',
        tecnologia: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200',
        automacao: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
        importacao: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=1200'
      };

      const selectedImg = imageMap[topic.category] || imageMap.tecnologia;

      const generatedDraft: Partial<Article> = {
        title: topic.suggestedTitle,
        subtitle: `Como as pesquisas crescentes sobre "${topic.topic}" refletem transformações na tomada de decisão dos gestores.`,
        summary: topic.summary,
        categoryId: catObj?.id || 'cat-tech',
        status: 'DRAFT',
        featuredImage: selectedImg,
        readingTimeMinutes: 5,
        authorId: 'author-tasso',
        tags: topic.keywords,
        seo: {
          metaTitle: topic.suggestedTitle,
          metaDescription: topic.summary,
          keywords: topic.keywords
        },
        blocks: [
          {
            id: 'b1',
            type: 'paragraph',
            content: `A recente arrancada nos volumes de busca sobre **${topic.topic}** reflete uma movimentação expressiva na inteligência de mercado brasileira. Executivos e tomada de decisão no B2B têm buscado alternativas para maximizar eficiência, otimizar custos operacionais e mitigar gargalos.`
          },
          {
            id: 'b2',
            type: 'heading2',
            content: 'Principais Vetores de Crescimento e Oportunidades'
          },
          {
            id: 'b3',
            type: 'paragraph',
            content: `Segundo dados monitorados pelo portal Grit News, a demanda por soluções em **${topic.keywords.join(', ')}** teve um salto de **${topic.growthRate}**. Esse padrão é sustentado por três pilares fundamentais: adoção tecnológica, regulamentação atualizada e demandas por sustentabilidade e rastreabilidade.`
          },
          {
            id: 'b4',
            type: 'callout',
            content: `💡 **Destaque Estratégico GRIT:** Empresas que adotam essas inovações nos primeiros trimestres obtêm até 35% a mais de vantagem competitiva em negociações e retenção de fornecedores.`
          }
        ]
      };

      setPreviewArticle(generatedDraft);
      setActiveTopicId(topic.id);
      setIsGenerating(null);
    }, 1200);
  };

  const handlePublishToPortal = () => {
    if (!previewArticle) return;

    const newArticle: Article = {
      id: 'art_ai_' + Date.now(),
      title: previewArticle.title || 'Nova Notícia de Tendência',
      slug: (previewArticle.title || 'noticia').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      subtitle: previewArticle.subtitle || '',
      summary: previewArticle.summary || '',
      categoryId: previewArticle.categoryId || 'cat-tech',
      tags: previewArticle.tags || ['Tendência', 'IA'],
      authorId: previewArticle.authorId || 'author-tasso',
      status: 'PUBLISHED',
      featuredImage: previewArticle.featuredImage || '',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readingTimeMinutes: 5,
      viewsCount: 1420,
      likesCount: 89,
      sharesCount: 34,
      blocks: previewArticle.blocks || [],
      seo: previewArticle.seo || {
        metaTitle: previewArticle.title || '',
        metaDescription: previewArticle.summary || '',
        keywords: previewArticle.tags || []
      }
    };

    saveArticle(newArticle);
    if (activeTopicId) {
      updateTrendingTopicStatus(activeTopicId, 'PUBLISHED', newArticle.id);
    }

    loadData();
    setPreviewArticle(null);
    setActiveTopicId(null);
    onRefreshData();
    onShowToast('🚀 Notícia gerada por IA publicada com SUCESSO no Portal Grit News!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B2343] via-[#10233F] to-[#145EDB] p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Automação de Conteúdo & Buscas em Tempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Radar de Tendências & Gerador de Notícias com IA
          </h1>
          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
            Monitore automaticamente os termos mais buscados nos motores de busca (Google/Bing) para as verticais do portal. Gere matérias completas com IA e publique direto no Grit News em 1 clique.
          </p>
        </div>
      </div>

      {/* Add Custom Search Keyword Form */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#10233F] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#145EDB]" />
            Adicionar Novo Tema para Monitoramento de Busca
          </h2>
          <span className="text-[10px] bg-blue-50 text-[#145EDB] font-bold px-2 py-0.5 rounded-full">
            Indexador Ativo
          </span>
        </div>

        <form onSubmit={handleAddCustomTrend} className="flex gap-2">
          <input
            type="text"
            placeholder="Digite um termo estratégico (Ex: 'Robótica Colaborativa na Logística', 'Inovações em Telemedicina')"
            value={customKeyword}
            onChange={e => setCustomKeyword(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
          />
          <button
            type="submit"
            className="bg-[#10233F] hover:bg-[#0B2343] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FF8500]" />
            <span>Rastrear Termo</span>
          </button>
        </form>
      </div>

      {/* Trends List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#10233F] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Principais Pautas e Buscas em Alta nas Verticais GRIT
          </h3>
          <span className="text-xs text-gray-400">Atualizado continuamente</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trends.map(item => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase bg-[#145EDB]/10 text-[#145EDB] px-2.5 py-1 rounded-md">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{item.growthRate}</span>
                  </div>
                </div>

                <h4 className="font-black text-sm text-[#10233F] leading-snug">{item.topic}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{item.summary}</p>

                <div className="flex items-center justify-between pt-2 text-[10px] text-gray-400 border-t border-gray-100">
                  <span>Volume: <strong className="text-gray-700">{item.searchVolume}</strong></span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    item.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'PUBLISHED' ? 'Publicada no Portal' : 'Pauta em Alta'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleGenerateAIDraft(item)}
                disabled={isGenerating === item.id}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  item.status === 'PUBLISHED'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-[#145EDB] hover:bg-[#0f4bb3] text-white shadow-md'
                }`}
              >
                {isGenerating === item.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Sintetizando Matéria com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#FF8500]" />
                    <span>Gerar Rascunho com IA & Visualizar</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 1M Views Strategy Widget Section */}
      <div className="pt-6">
        <ViralPautasWidget
          onShowToast={(msg) => onShowToast(msg)}
          onArticleCreated={() => onRefreshData()}
        />
      </div>

      {/* AI Generated Article Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#10233F]">Pré-visualização da Matéria Gerada por IA</h3>
                  <p className="text-xs text-gray-500">Revise os blocos estruturados antes de publicar no portal</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewArticle(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Article Card Preview */}
            <div className="space-y-4 border border-gray-200 p-5 rounded-2xl bg-[#F8FAFC]">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-200">
                <img src={previewArticle.featuredImage} alt="Capa" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold bg-[#145EDB] text-white px-2 py-0.5 rounded uppercase">
                  Notícia Autogerada
                </span>
                <h2 className="text-lg font-black text-[#10233F] leading-tight">{previewArticle.title}</h2>
                <p className="text-xs font-medium text-gray-600 italic">{previewArticle.subtitle}</p>
              </div>

              {/* Blocks rendering */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                {previewArticle.blocks?.map((blk, idx) => (
                  <div key={idx} className="text-xs text-gray-700 leading-relaxed">
                    {blk.type === 'heading2' && <h3 className="font-bold text-sm text-[#10233F] mt-2">{blk.content}</h3>}
                    {blk.type === 'paragraph' && <p>{blk.content}</p>}
                    {blk.type === 'callout' && (
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-amber-900 font-medium my-2">
                        {blk.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Descartar Rascunho
              </button>

              <button
                onClick={handlePublishToPortal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Publicar Imensamente no Portal Grit News</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
