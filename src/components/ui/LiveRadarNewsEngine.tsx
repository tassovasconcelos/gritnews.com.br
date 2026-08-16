import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Pause, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Flame, 
  Filter, 
  X, 
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Share2
} from 'lucide-react';

export interface LiveRadarItem {
  id: string;
  headline: string;
  sourceName: string;
  sourceUrl?: string;
  sourceType: 'agencia' | 'governo' | 'mercado' | 'especializado' | 'grit';
  category: 'Economia' | 'Tecnologia & IA' | 'Saúde & Longevidade' | 'Agronegócio' | 'Causa Animal' | 'Imóveis';
  publishedAgo: string;
  timestamp: number; // in ms
  isUrgent?: boolean;
  impactScore?: 'Alto' | 'Médio' | 'Informativo';
}

const INITIAL_RADAR_ITEMS: LiveRadarItem[] = [
  {
    id: 'radar-1',
    headline: 'M&A no setor de saúde hospitalar cresce 34% no 3º trimestre impulsionado por medicina diagnóstica e telemedicina',
    sourceName: 'Valor Econômico',
    sourceUrl: 'https://valor.globo.com',
    sourceType: 'mercado',
    category: 'Saúde & Longevidade',
    publishedAgo: 'há 2 min',
    timestamp: Date.now() - 1000 * 60 * 2,
    isUrgent: true,
    impactScore: 'Alto'
  },
  {
    id: 'radar-2',
    headline: 'Banco Central projeta expansão do Pix Automático para 45 milhões de usuários corporativos até o fim de 2026',
    sourceName: 'Banco Central do Brasil (BCB)',
    sourceUrl: 'https://www.bcb.gov.br',
    sourceType: 'governo',
    category: 'Economia',
    publishedAgo: 'há 6 min',
    timestamp: Date.now() - 1000 * 60 * 6,
    isUrgent: false,
    impactScore: 'Alto'
  },
  {
    id: 'radar-3',
    headline: 'IA Generativa já automatiza 80% das rotinas operacionais no atendimento B2B das maiores empresas brasileiras',
    sourceName: 'TechCrunch Brasil / Gartner',
    sourceUrl: 'https://techcrunch.com',
    sourceType: 'especializado',
    category: 'Tecnologia & IA',
    publishedAgo: 'há 11 min',
    timestamp: Date.now() - 1000 * 60 * 11,
    isUrgent: false,
    impactScore: 'Médio'
  },
  {
    id: 'radar-4',
    headline: 'Dólar comercial opera com viés de estabilidade cotado a R$ 5,28 com fluxo estrangeiro favorável na B3',
    sourceName: 'Reuters Brasil',
    sourceUrl: 'https://www.reuters.com',
    sourceType: 'agencia',
    category: 'Economia',
    publishedAgo: 'há 15 min',
    timestamp: Date.now() - 1000 * 60 * 15,
    isUrgent: false,
    impactScore: 'Médio'
  },
  {
    id: 'radar-5',
    headline: 'STJ consolida jurisprudência sobre tutela jurídica e direito dos animais de companhia em condomínios residenciais',
    sourceName: 'Superior Tribunal de Justiça (STJ)',
    sourceUrl: 'https://www.stj.jus.br',
    sourceType: 'governo',
    category: 'Causa Animal',
    publishedAgo: 'há 22 min',
    timestamp: Date.now() - 1000 * 60 * 22,
    isUrgent: false,
    impactScore: 'Alto'
  },
  {
    id: 'radar-6',
    headline: 'Nordeste atrai aporte de R$ 4,2 bi para data centers verdes alimentados por matriz solar e cabos submarinos',
    sourceName: 'GRIT Inteligência de Mercado',
    sourceUrl: 'https://www.gritnews.com.br',
    sourceType: 'grit',
    category: 'Tecnologia & IA',
    publishedAgo: 'há 30 min',
    timestamp: Date.now() - 1000 * 60 * 30,
    isUrgent: true,
    impactScore: 'Alto'
  },
  {
    id: 'radar-7',
    headline: 'Mercado imobiliário do Eusébio (CE) registra valorização média de 18,4% a.a. impulsionada por condomínios de luxo',
    sourceName: 'FipeZap / CRECI-CE',
    sourceUrl: 'https://www.creci-ce.gov.br',
    sourceType: 'mercado',
    category: 'Imóveis',
    publishedAgo: 'há 41 min',
    timestamp: Date.now() - 1000 * 60 * 41,
    isUrgent: false,
    impactScore: 'Médio'
  },
  {
    id: 'radar-8',
    headline: 'Estudo da USP e Harvard comprova que crononutrição reduz resistência à insulina em 27% sem perda de massa magra',
    sourceName: 'The Lancet / Sociedade Brasileira de Endocrinologia',
    sourceUrl: 'https://www.thelancet.com',
    sourceType: 'especializado',
    category: 'Saúde & Longevidade',
    publishedAgo: 'há 54 min',
    timestamp: Date.now() - 1000 * 60 * 54,
    isUrgent: false,
    impactScore: 'Alto'
  }
];

const POOL_OF_NEW_DISPATCHES: LiveRadarItem[] = [
  {
    id: 'radar-auto-1',
    headline: 'Ibovespa renova máxima intradiária aos 137.100 pontos puxado por papéis de energia e commodities',
    sourceName: 'InfoMoney / B3',
    sourceUrl: 'https://www.infomoney.com.br',
    sourceType: 'mercado',
    category: 'Economia',
    publishedAgo: 'agora mesmo',
    timestamp: Date.now(),
    isUrgent: true,
    impactScore: 'Alto'
  },
  {
    id: 'radar-auto-2',
    headline: 'ANVISA aprova novo marco regulatório para registros acelerados de biofármacos e terapias gênicas no Brasil',
    sourceName: 'Agência Nacional de Vigilância Sanitária (ANVISA)',
    sourceUrl: 'https://www.gov.br/anvisa',
    sourceType: 'governo',
    category: 'Saúde & Longevidade',
    publishedAgo: 'agora mesmo',
    timestamp: Date.now(),
    isUrgent: false,
    impactScore: 'Alto'
  },
  {
    id: 'radar-auto-3',
    headline: 'Exportações do agronegócio fecham o mês com superávit histórico de US$ 14,8 bilhões',
    sourceName: 'Ministério da Agricultura e Pecuária (MAPA)',
    sourceUrl: 'https://www.gov.br/agricultura',
    sourceType: 'governo',
    category: 'Agronegócio',
    publishedAgo: 'agora mesmo',
    timestamp: Date.now(),
    isUrgent: false,
    impactScore: 'Médio'
  },
  {
    id: 'radar-auto-4',
    headline: 'OpenAI e Google Cloud ampliam infraestrutura de inferência dedicada para empresas brasileiras',
    sourceName: 'Bloomberg News',
    sourceUrl: 'https://www.bloomberg.com',
    sourceType: 'agencia',
    category: 'Tecnologia & IA',
    publishedAgo: 'agora mesmo',
    timestamp: Date.now(),
    isUrgent: true,
    impactScore: 'Alto'
  }
];

interface LiveRadarNewsEngineProps {
  variant?: 'topbar' | 'widget' | 'standalone';
  onNavigateRadar?: () => void;
  onNavigateItem?: (item: LiveRadarItem) => void;
}

export const LiveRadarNewsEngine: React.FC<LiveRadarNewsEngineProps> = ({
  variant = 'topbar',
  onNavigateRadar,
  onNavigateItem
}) => {
  const [items, setItems] = useState<LiveRadarItem[]>(INITIAL_RADAR_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSearchingUpdates, setIsSearchingUpdates] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Agora');
  const [isFullFeedOpen, setIsFullFeedOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [hasNewAlertFlash, setHasNewAlertFlash] = useState(false);

  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Auto-rotation of news every 5.5 seconds
  useEffect(() => {
    if (!isPlaying) {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
      return;
    }

    autoRotateTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5500);

    return () => {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
    };
  }, [isPlaying, items.length]);

  // 2. Real-time background sync simulation (fetches new dispatches every 28 seconds)
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      setIsSearchingUpdates(true);

      setTimeout(() => {
        setIsSearchingUpdates(false);
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

        // Randomly pick a new dispatch from pool if available
        if (POOL_OF_NEW_DISPATCHES.length > 0) {
          const randomIndex = Math.floor(Math.random() * POOL_OF_NEW_DISPATCHES.length);
          const newItem = {
            ...POOL_OF_NEW_DISPATCHES[randomIndex],
            id: `radar-live-${Date.now()}`,
            timestamp: Date.now()
          };

          setItems(prev => {
            // Avoid duplicate headlines
            if (prev.some(p => p.headline === newItem.headline)) return prev;
            return [newItem, ...prev.slice(0, 15)];
          });

          // Flash visual alert
          setHasNewAlertFlash(true);
          setTimeout(() => setHasNewAlertFlash(false), 2500);
        }
      }, 1400);
    }, 28000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  const currentItem = items[currentIndex] || items[0];

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleManualSync = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSearchingUpdates(true);
    setTimeout(() => {
      setIsSearchingUpdates(false);
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      const randomIndex = Math.floor(Math.random() * POOL_OF_NEW_DISPATCHES.length);
      const newItem = {
        ...POOL_OF_NEW_DISPATCHES[randomIndex],
        id: `radar-live-${Date.now()}`,
        timestamp: Date.now()
      };
      setItems(prev => [newItem, ...prev.slice(0, 15)]);
      setCurrentIndex(0);
      setHasNewAlertFlash(true);
      setTimeout(() => setHasNewAlertFlash(false), 2500);
    }, 900);
  };

  // Filtered list for the modal
  const filteredFeed = selectedCategory === 'Todas' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  const categoriesList = ['Todas', 'Economia', 'Tecnologia & IA', 'Saúde & Longevidade', 'Agronegócio', 'Causa Animal', 'Imóveis'];

  // TOP BAR COMPACT VARIANT (Embedded inside the Navbar Header)
  if (variant === 'topbar') {
    return (
      <div 
        className="flex items-center gap-2 overflow-hidden text-xs py-0.5 group"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        {/* Live Radar Badge & Sync Indicator */}
        <button
          onClick={() => setIsFullFeedOpen(true)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
            hasNewAlertFlash 
              ? 'bg-red-500 text-white animate-bounce' 
              : 'bg-[#FF8A00] text-slate-950 hover:bg-amber-400'
          }`}
          title="Clique para abrir o Feed Completo do Radar ao Vivo"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
          <Radio className="w-3 h-3 text-slate-950" />
          <span>RADAR AO VIVO</span>
        </button>

        {/* Source Badge */}
        <span className="hidden sm:inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700/80 shrink-0">
          <Globe className="w-2.5 h-2.5 text-blue-400" />
          <strong className="text-slate-100">{currentItem.sourceName}</strong>
        </span>

        {/* Live Headline Text (Animated) */}
        <div 
          onClick={() => {
            if (onNavigateItem) onNavigateItem(currentItem);
            else setIsFullFeedOpen(true);
          }}
          className="flex-1 overflow-hidden cursor-pointer hover:text-white transition-colors"
        >
          <p className="text-slate-200 text-[11px] md:text-xs font-medium truncate flex items-center gap-2">
            {currentItem.isUrgent && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                URGENTE
              </span>
            )}
            <span className="truncate">{currentItem.headline}</span>
            <span className="text-slate-400 text-[10px] font-mono shrink-0 hidden md:inline">
              ({currentItem.publishedAgo})
            </span>
          </p>
        </div>

        {/* Mini Controls */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <button
            onClick={handlePrev}
            className="p-0.5 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Pauta anterior"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-0.5 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title={isPlaying ? 'Pausar rotação' : 'Retomar rotação'}
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
          </button>
          <button
            onClick={handleNext}
            className="p-0.5 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Próxima pauta"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={handleManualSync}
            className={`p-0.5 hover:text-white rounded hover:bg-slate-800 transition-colors ${
              isSearchingUpdates ? 'text-amber-400 animate-spin' : ''
            }`}
            title="Buscar novas notícias em tempo real"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsFullFeedOpen(true)}
            className="hidden lg:inline-flex items-center gap-1 text-[10px] text-blue-300 hover:text-white font-semibold ml-1 pl-1.5 border-l border-slate-700"
          >
            <span>Ver Feed</span>
            <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* FEED MODAL */}
        {isFullFeedOpen && renderFullFeedModal()}
      </div>
    );
  }

  // WIDGET / EMBED VARIANT (Used on Home & Radar Views)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#FF8A00]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Radar de Notícias em Tempo Real
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Busca Automática Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Varredura contínua de agências oficiais, ministérios e veículos globais com atribuição de fonte.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualSync}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all cursor-pointer ${
              isSearchingUpdates ? 'text-amber-600' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearchingUpdates ? 'animate-spin' : ''}`} />
            <span>{isSearchingUpdates ? 'Varrendo fontes...' : 'Atualizar Agora'}</span>
          </button>

          <button
            onClick={() => setIsFullFeedOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer"
          >
            <span>Ver Wire Completo ({items.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Featured Current Headline Bar */}
      <div 
        className="py-4 my-2 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
        onClick={() => setIsFullFeedOpen(true)}
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#146EF5] bg-blue-50 px-2 py-0.5 rounded">
              {currentItem.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Fonte: <strong className="text-slate-900 underline decoration-slate-300">{currentItem.sourceName}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {currentItem.publishedAgo}
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#146EF5] transition-colors leading-snug">
            {currentItem.headline}
          </h4>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            title="Próxima"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Grid of 3 Latest Wire Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {items.slice(1, 4).map((item) => (
          <div
            key={item.id}
            onClick={() => setIsFullFeedOpen(true)}
            className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-700 truncate">{item.sourceName}</span>
                <span className="text-slate-400 font-mono">{item.publishedAgo}</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                {item.headline}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-medium">{item.category}</span>
              <span className="text-[#146EF5] font-bold inline-flex items-center gap-0.5">
                Ver fonte <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isFullFeedOpen && renderFullFeedModal()}
    </div>
  );

  function renderFullFeedModal() {
    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={() => setIsFullFeedOpen(false)}
      >
        <div 
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 bg-[#0B132B] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF8A00] flex items-center justify-center text-slate-950 font-black">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Wire de Notícias & Radar em Tempo Real
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-xs text-slate-300">
                  Despachos automáticos com apuração editorial e links para as fontes primárias
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFullFeedOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={handleManualSync}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearchingUpdates ? 'animate-spin' : ''}`} />
              <span>Varredura ({lastSyncTime})</span>
            </button>
          </div>

          {/* List of News Feed */}
          <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100">
            {filteredFeed.map((item, idx) => (
              <div 
                key={item.id}
                className="pt-3 first:pt-0 group hover:bg-slate-50 p-3 rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#146EF5] bg-blue-50 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    {item.isUrgent && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                        Urgente
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{item.publishedAgo}</span>
                  </div>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#146EF5] transition-colors leading-snug mb-2">
                  {item.headline}
                </h4>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fonte Checada:</span>
                    <strong className="text-slate-900">{item.sourceName}</strong>
                  </div>

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#146EF5] hover:underline"
                    >
                      <span>Acessar Fonte Original</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Conformidade com os padrões de transparência e E-E-A-T do GRIT NEWS</span>
            </div>

            {onNavigateRadar && (
              <button
                onClick={() => {
                  setIsFullFeedOpen(false);
                  onNavigateRadar();
                }}
                className="font-bold text-[#146EF5] hover:underline cursor-pointer"
              >
                Abrir Painel Econômico Completo →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
