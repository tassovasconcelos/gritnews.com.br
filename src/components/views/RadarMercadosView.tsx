import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity, 
  ArrowUpRight, 
  ShieldCheck, 
  Calculator, 
  Building, 
  Zap, 
  Cpu, 
  FileText, 
  Search, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight,
  Globe2,
  RefreshCw
} from 'lucide-react';
import { Article } from '../../types';

interface RadarMercadosViewProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onNavigateCheckout?: (productId?: string) => void;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

interface MarketQuote {
  symbol: string;
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
  category: 'moedas' | 'indices' | 'taxas' | 'commodities';
  source: string;
}

const MARKET_QUOTES: MarketQuote[] = [
  { symbol: 'USD/BRL', name: 'Dólar Comercial', value: 'R$ 5,42', change: '-0,34%', isPositive: false, category: 'moedas', source: 'Banco Central do Brasil' },
  { symbol: 'EUR/BRL', name: 'Euro', value: 'R$ 5,91', change: '+0,18%', isPositive: true, category: 'moedas', source: 'BCE / BCB' },
  { symbol: 'BTC/BRL', name: 'Bitcoin', value: 'R$ 364.200', change: '+2,85%', isPositive: true, category: 'moedas', source: 'Coinbase / Mercado Bitcoin' },
  { symbol: 'IBOV', name: 'Ibovespa', value: '136.420 pts', change: '+0,72%', isPositive: true, category: 'indices', source: 'B3 Brasil' },
  { symbol: 'S&P 500', name: 'S&P 500 EUA', value: '5.610 pts', change: '+0,45%', isPositive: true, category: 'indices', source: 'NYSE' },
  { symbol: 'SELIC', name: 'Taxa Selic Meta', value: '10,50% a.a.', change: 'Estável', isPositive: true, category: 'taxas', source: 'Copom / BCB' },
  { symbol: 'CDI', name: 'Taxa CDI Over', value: '10,40% a.a.', change: '0,00%', isPositive: true, category: 'taxas', source: 'B3 Cetip' },
  { symbol: 'IPCA', name: 'IPCA Acumulado 12m', value: '4,18%', change: '-0,08%', isPositive: false, category: 'taxas', source: 'IBGE' },
  { symbol: 'BRENT', name: 'Petróleo Brent', value: '$ 78,60', change: '+1,12%', isPositive: true, category: 'commodities', source: 'ICE Londres' },
  { symbol: 'SOJA', name: 'Soja Paranaguá (sc)', value: 'R$ 138,50', change: '+0,90%', isPositive: true, category: 'commodities', source: 'Cepea / Esalq' }
];

export const RadarMercadosView: React.FC<RadarMercadosViewProps> = ({
  articles,
  onSelectArticle,
  onNavigateCheckout,
  onShowToast
}) => {
  const [selectedTab, setSelectedTab] = useState<'todos' | 'moedas' | 'indices' | 'taxas' | 'commodities'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Simulator State
  const [simRevenue, setSimRevenue] = useState(100000);
  const [simMargin, setSimMargin] = useState(18);
  const [simInflation, setSimInflation] = useState(4.2);
  const [emailNewsletter, setEmailNewsletter] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Economic Articles filter
  const economicArticles = articles.filter(a => 
    a.categoryId === 'cat-negocios' || 
    a.categoryId === 'cat-tech' || 
    a.categoryId === 'cat-logistica' ||
    a.tags.some(t => ['Reforma Tributária', 'Investimentos', 'Mercado Imobiliário', 'Data Centers', 'Eusébio'].includes(t))
  );

  const filteredQuotes = MARKET_QUOTES.filter(q => {
    const matchesTab = selectedTab === 'todos' || q.category === selectedTab;
    const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) || q.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate Simulator
  const monthlyProfit = (simRevenue * (simMargin / 100));
  const annualProfit = monthlyProfit * 12;
  const inflationImpact = annualProfit * (simInflation / 100);
  const realProfit = annualProfit - inflationImpact;

  const handleSubscribeNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailNewsletter || !emailNewsletter.includes('@')) {
      onShowToast('Informe um e-mail corporativo válido.', 'info');
      return;
    }
    setIsSubscribed(true);
    onShowToast('Inscrição confirmada no Radar B2B GRIT NEWS!', 'success');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0B1528] via-[#0D1E3A] to-[#122B55] text-white pt-10 pb-12 border-b border-blue-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Painel de Inteligência Macroeconômica & Negócios</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Radar Econômico & Mercados B2B
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Cotações ao vivo, análises tributárias e projeções financeiras para líderes, conselheiros e empreendedores que tomam decisões estratégicas no Brasil.
              </p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px] shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Índice de Clima B2B</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">68/100</span>
              </div>
              <p className="text-xs font-bold text-white">Otimismo Moderado com Expansão</p>
              <p className="text-[11px] text-slate-400 leading-tight">
                Impulsionado por energia limpa, dados e avanço da regulamentação tributária.
              </p>
            </div>
          </div>

          {/* Real-time Ticker Strip */}
          <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {MARKET_QUOTES.slice(0, 5).map(q => (
              <div key={q.symbol} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 hover:border-blue-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">{q.name}</span>
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${q.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {q.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {q.change}
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-mono font-black text-white">{q.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 relative z-20 space-y-10">
        {/* Tabela de Cotações e Indicadores */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Painel Completo de Indicadores & Cotações</span>
              </h2>
              <p className="text-xs text-slate-500">Dados consolidados do Banco Central, IBGE, B3 e bolsas internacionais</p>
            </div>

            {/* Filter Tabs and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['todos', 'moedas', 'indices', 'taxas', 'commodities'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                      selectedTab === tab 
                        ? 'bg-white text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar indicador..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Indicador / Ativo</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cotação Atual</th>
                  <th className="py-3 px-4">Variação Recente</th>
                  <th className="py-3 px-4">Fonte Oficial</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQuotes.map(q => (
                  <tr key={q.symbol} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{q.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{q.symbol}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">{q.value}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                        q.isPositive 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {q.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {q.change}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{q.source}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Auditado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bloco 2 Colunas: Análise & Simulador de Impacto Empresarial */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Notícias e Análises Estratégicas */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Análises de Mercado & Decisores</h2>
                <p className="text-xs text-slate-500">Reportagens aprofundadas com teses e dados verificados</p>
              </div>
            </div>

            <div className="space-y-4">
              {economicArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => onSelectArticle(art)}
                  className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-5"
                >
                  {art.featuredImage && (
                    <div className="sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <img 
                        src={art.featuredImage} 
                        alt={art.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                          {art.tags[0] || 'Negócios'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {art.readingTimeMinutes} min de leitura
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base leading-snug line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-blue-600 pt-2 border-t border-slate-100">
                      <span>Ler análise completa</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Simulador de Impacto de Inflação & Gestão de Margem */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-[#0F1E38] text-white p-6 rounded-2xl shadow-lg border border-slate-800">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Simulador de Margem & Erosão Inflacionária</h3>
                  <p className="text-[11px] text-slate-400">Calcule o impacto do IPCA na lucratividade da sua operação B2B</p>
                </div>
              </div>

              <div className="space-y-4 text-xs mt-4">
                <div>
                  <div className="flex justify-between font-bold text-slate-300 mb-1">
                    <span>Faturamento Mensal (R$)</span>
                    <span className="font-mono text-white">R$ {simRevenue.toLocaleString('pt-BR')}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="1000000"
                    step="10000"
                    value={simRevenue}
                    onChange={e => setSimRevenue(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-300 mb-1">
                    <span>Margem Líquida Alvo (%)</span>
                    <span className="font-mono text-white">{simMargin}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={simMargin}
                    onChange={e => setSimMargin(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-300 mb-1">
                    <span>Projeção IPCA Anual (%)</span>
                    <span className="font-mono text-white">{simInflation}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.1"
                    value={simInflation}
                    onChange={e => setSimInflation(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Simulation Output Cards */}
                <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Lucro Líquido Anual</span>
                    <div className="font-mono text-base font-black text-white mt-0.5">
                      R$ {annualProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-rose-400 uppercase font-bold">Erosão por Inflação</span>
                    <div className="font-mono text-base font-black text-rose-400 mt-0.5">
                      - R$ {inflationImpact.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-950/40 border border-blue-700/40 p-3 rounded-xl">
                  <div className="text-[11px] text-blue-200 font-medium">
                    💡 <strong>Insight Estratégico:</strong> Para manter o poder de compra real de <strong>R$ {annualProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong>, seu faturamento anual precisa ser corrigido para <strong>R$ {((simRevenue * 12) * (1 + simInflation / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong> no próximo ciclo contratual.
                  </div>
                </div>

                {onNavigateCheckout && (
                  <button
                    onClick={() => onNavigateCheckout('prod-grit-membership-pro')}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Desbloquear Relatório de Inteligência Fiscal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Newsletter Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-900 text-base mb-1">Morning Call GRIT B2B</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Receba o resumo executivo dos mercados antes da abertura da B3, com cotações, decisões do Copom e análises exclusivas.
              </p>

              {isSubscribed ? (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Você está inscrito na Morning Call diária!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribeNewsletter} className="space-y-2">
                  <input
                    type="email"
                    placeholder="Seu e-mail corporativo..."
                    value={emailNewsletter}
                    onChange={e => setEmailNewsletter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Receber Resumo Diário Gratuito
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
