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
  RefreshCw,
  Clock,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Percent,
  Sliders,
  Radio
} from 'lucide-react';
import { Article } from '../../types';
import { LiveRadarNewsEngine } from '../ui/LiveRadarNewsEngine';
import { 
  FOCUS_PROJECTIONS, 
  EconomicIndicator 
} from '../../data/economicRadarData';
import { useEconomicRadar } from '../../hooks/useEconomicRadar';

interface RadarMercadosViewProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onNavigateCheckout?: (productId?: string) => void;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const RadarMercadosView: React.FC<RadarMercadosViewProps> = ({
  articles,
  onSelectArticle,
  onNavigateCheckout,
  onShowToast
}) => {
  const { 
    summary: radarSummary, 
    indicators: liveIndicators, 
    isLoading, 
    lastSync, 
    syncStatus, 
    sourceSummary,
    refreshData 
  } = useEconomicRadar();

  const [selectedTab, setSelectedTab] = useState<'todos' | 'moedas' | 'indices' | 'taxas' | 'commodities' | 'cripto'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndicatorDetail, setSelectedIndicatorDetail] = useState<EconomicIndicator | null>(null);
  
  // Simulator 1: Margem & Erosão Inflacionária B2B
  const [simRevenue, setSimRevenue] = useState(120000);
  const [simMargin, setSimMargin] = useState(20);
  const [simInflation, setSimInflation] = useState(4.18);

  // Simulator 2: Renda Fixa & Ganho Real (CDI x IPCA)
  const [investCapital, setInvestCapital] = useState(50000);
  const [investMonths, setInvestMonths] = useState(12);
  const [investPercentCdi, setInvestPercentCdi] = useState(105);

  const [emailNewsletter, setEmailNewsletter] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Filter economic articles
  const economicArticles = articles.filter(a => 
    a.categoryId === 'cat-negocios' || 
    a.categoryId === 'cat-tech' || 
    a.categoryId === 'cat-logistica' ||
    a.tags.some(t => ['Reforma Tributária', 'Investimentos', 'Mercado Imobiliário', 'Data Centers', 'Eusébio', 'Cibersegurança', 'Nutrição Funcional'].includes(t))
  );

  const filteredQuotes = liveIndicators.filter(q => {
    const matchesTab = selectedTab === 'todos' || q.category === selectedTab;
    const matchesSearch = 
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      q.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate Business Simulator
  const monthlyProfit = (simRevenue * (simMargin / 100));
  const annualProfit = monthlyProfit * 12;
  const inflationImpact = annualProfit * (simInflation / 100);
  const realProfit = annualProfit - inflationImpact;

  // Extract live CDI number if available
  const cdiIndicator = liveIndicators.find(i => i.symbol === 'CDI');
  const cdiBaseRate = cdiIndicator ? cdiIndicator.numericValue : 10.40;

  // Calculate Investment Simulator (CDI Rate x target %)
  const cdiTaxAnnual = (cdiBaseRate * (investPercentCdi / 100)) / 100;
  const cdiMonthly = Math.pow(1 + cdiTaxAnnual, 1 / 12) - 1;
  const grossFinalValue = investCapital * Math.pow(1 + cdiMonthly, investMonths);
  const grossYield = grossFinalValue - investCapital;
  // Alíquota regressiva de IR
  const irTax = investMonths <= 6 ? 0.225 : investMonths <= 12 ? 0.20 : investMonths <= 24 ? 0.175 : 0.15;
  const netYield = grossYield * (1 - irTax);
  const netFinalValue = investCapital + netYield;
  // Inflação acumulada no período
  const inflationRatePeriod = (simInflation / 100) * (investMonths / 12);
  const inflationLoss = investCapital * inflationRatePeriod;
  const realNetGain = netYield - inflationLoss;

  const handleManualRefresh = async () => {
    await refreshData(true);
    onShowToast('Cotações sincronizadas com as APIs do Banco Central (SGS) e AwesomeAPI.', 'success');
  };

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
      {/* Header Banner Macroeconômico */}
      <div className="bg-gradient-to-br from-[#070D1B] via-[#0B172E] to-[#11244A] text-white pt-10 pb-12 border-b border-blue-900/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base Oficial Verificada: UOL Economia Câmbio, Banco Central do Brasil (SGS), IBGE & B3</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Radar Econômico & Mercados B2B
              </h1>
              
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Cotações em tempo real de câmbio comercial e turismo apuradas com base no <strong>UOL Economia Câmbio</strong> e <strong>Banco Central do Brasil</strong>, taxas oficiais de juros (Selic/CDI), índices de inflação (IPCA/IGP-M) e projeções do <strong>Boletim Focus</strong>.
              </p>
            </div>

            {/* Painel de Status de Mercado & Auditoria */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/70 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 min-w-[300px] shadow-2xl">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className={`w-2 h-2 rounded-full ${syncStatus === 'live' ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'}`} />
                  <span>UOL Câmbio & BCB</span>
                </span>
                <a
                  href="https://economia.uol.com.br/cotacoes/cambio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] font-bold text-blue-300 hover:text-white flex items-center gap-1 underline decoration-dotted"
                  title="Ver cotações no portal UOL Economia"
                >
                  <span>economia.uol.com.br</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Dólar Comercial:</span>
                  <strong className="text-white font-mono">{radarSummary.dolarComercial}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Dólar Turismo:</span>
                  <strong className="text-emerald-400 font-mono">{radarSummary.dolarTurismo}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Euro Comercial:</span>
                  <strong className="text-white font-mono">{radarSummary.euroComercial}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Taxa Selic Meta:</span>
                  <strong className="text-white font-mono">{radarSummary.selicMeta}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Última Auditoria:</span>
                  <strong className="text-slate-300 font-mono text-[11px]">{radarSummary.lastSyncTimestamp}</strong>
                </div>
              </div>

              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="w-full py-2 bg-blue-600/30 hover:bg-blue-600 disabled:opacity-50 text-blue-200 hover:text-white rounded-xl text-xs font-bold border border-blue-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-300' : ''}`} />
                <span>{isLoading ? 'Sincronizando BCB...' : 'Atualizar Cotações'}</span>
              </button>
            </div>
          </div>

          {/* Real-time Ticker Strip com 5 Pilares Macroeconômicos */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {liveIndicators.slice(0, 5).map(q => (
              <div 
                key={q.symbol} 
                onClick={() => setSelectedIndicatorDetail(q)}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 hover:border-blue-500/60 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-blue-300 transition-colors">
                    {q.name}
                  </span>
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${q.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {q.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {q.change}
                  </span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-mono font-black text-white">{q.value}</div>
                <div className="mt-1 text-[9px] text-slate-400 truncate flex items-center gap-1">
                  <Globe2 className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                  <span className="truncate">{q.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 relative z-20 space-y-8">
        
        {/* Automated Live Real-time News Radar Wire */}
        <LiveRadarNewsEngine 
          variant="widget"
        />

        {/* Quadro 1: Boletim Focus do Banco Central (Expectativas de Mercado) */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Boletim Focus — Projeções Macroeconômicas Oficiais (BCB)
                </h3>
                <p className="text-xs text-slate-500">
                  Mediana das expectativas de mais de 100 instituições financeiras e consultorias consultadas pelo Banco Central do Brasil.
                </p>
              </div>
            </div>

            <a
              href="https://www.bcb.gov.br/publicacoes/focus"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#146EF5] hover:underline shrink-0"
            >
              <span>Relatório Oficial Focus</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {FOCUS_PROJECTIONS.map(fp => (
              <div key={fp.indicator} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-xs font-bold text-slate-700">{fp.indicator}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-bold block">Meta 2026</span>
                    <strong className="text-sm font-mono font-black text-slate-900">{fp.period2026}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-bold block">Projeção 2027</span>
                    <strong className="text-sm font-mono font-black text-slate-900">{fp.period2027}</strong>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span>Tendência Semanal:</span>
                  <span className={`font-bold capitalize ${
                    fp.weeklyTrend === 'subindo' ? 'text-emerald-700' : fp.weeklyTrend === 'descendo' ? 'text-blue-700' : 'text-slate-600'
                  }`}>
                    {fp.weeklyTrend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadro 2: Tabela Completa de Cotações com Auditoria & Metodologia */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Painel Consolidado de Cotações & Ativos</span>
              </h2>
              <p className="text-xs text-slate-500">
                Moedas PTAX, Renda Fixa, Inflação, Ações B3, Índices Internacionais e Commodities
              </p>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                {(['todos', 'moedas', 'indices', 'taxas', 'commodities', 'cripto'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
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
                  placeholder="Buscar ativo ou fonte..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-48"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Ativo / Indicador</th>
                  <th className="py-3 px-4">Código / Série</th>
                  <th className="py-3 px-4">Cotação Atual</th>
                  <th className="py-3 px-4">Variação</th>
                  <th className="py-3 px-4">Fonte Primária</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQuotes.map(q => (
                  <tr 
                    key={q.symbol} 
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedIndicatorDetail(q)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{q.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{q.category.toUpperCase()}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{q.symbol}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">{q.value}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        q.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        {q.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {q.change}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium truncate max-w-xs">{q.source}</div>
                      <div className="text-[10px] text-slate-400">{q.lastUpdated}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndicatorDetail(q);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        <span>Ficha Técnica</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quadro 3: Simuladores Financeiros Duplos (Renda Fixa Real & Gestão de Margem B2B) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Simulador 1: Renda Fixa & Ganho Real (CDI x Inflação IPCA) */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Simulador de Rendimento Real (CDI vs IPCA)</h3>
                <p className="text-[11px] text-slate-500">Calcule o ganho líquido de caixa após Imposto de Renda e corrosão inflacionária</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Capital de Caixa (R$)</span>
                  <span className="font-mono text-slate-900 font-black">R$ {investCapital.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={investCapital}
                  onChange={e => setInvestCapital(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Prazo (Meses)</span>
                    <span className="font-mono text-slate-900">{investMonths}m</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="36"
                    step="3"
                    value={investMonths}
                    onChange={e => setInvestMonths(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>% do CDI (Ref: {cdiBaseRate}% a.a.)</span>
                    <span className="font-mono text-slate-900">{investPercentCdi}%</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="130"
                    step="5"
                    value={investPercentCdi}
                    onChange={e => setInvestPercentCdi(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Resultado Renda Fixa */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Montante Bruto</span>
                  <div className="font-mono text-xs font-black text-slate-900 mt-0.5">
                    R$ {grossFinalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Líquido (Pós IR)</span>
                  <div className="font-mono text-xs font-black text-emerald-700 mt-0.5">
                    R$ {netFinalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block">Ganho Real Acima IPCA</span>
                  <div className="font-mono text-xs font-black text-emerald-800 mt-0.5">
                    + R$ {realNetGain.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                ℹ️ <strong>Parâmetro B3:</strong> Taxa DI Over de {cdiBaseRate}% a.a. com alíquota regressiva de IR ({irTax * 100}%) e IPCA de {simInflation}%.
              </div>
            </div>
          </div>

          {/* Simulador 2: Erosão Inflacionária & Repasse em Contratos B2B */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-[#0F1E38] text-white p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Simulador de Erosão Inflacionária B2B</h3>
                <p className="text-[11px] text-slate-400">Calcule o impacto do IPCA na lucratividade e necessidade de reajuste contratual</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-300 mb-1">
                  <span>Faturamento Mensal Contratado (R$)</span>
                  <span className="font-mono text-white font-black">R$ {simRevenue.toLocaleString('pt-BR')}</span>
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

              <div className="grid grid-cols-2 gap-3">
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
                    <span>IPCA Acumulado 12m (%)</span>
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
              </div>

              {/* Simulation Output Cards */}
              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
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
                <div className="text-[11px] text-blue-200 font-medium leading-relaxed">
                  💡 <strong>Insight Estratégico:</strong> Para manter o poder de compra real de <strong>R$ {annualProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong>, seu faturamento anual precisa ser corrigido para <strong>R$ {((simRevenue * 12) * (1 + simInflation / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong> no próximo ciclo.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quadro 4: Análises de Mercado & Decisores B2B */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-900">Análises de Mercado & Decisores B2B</h2>
              <p className="text-xs text-slate-500">Reportagens aprofundadas com teses e dados verificados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {economicArticles.map(art => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {art.tags[0] || 'Negócios'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {art.readingTimeMinutes} min de leitura
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base leading-snug">
                    {art.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Ler análise completa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadro 5: Morning Call GRIT B2B */}
        <div className="bg-gradient-to-r from-[#0B132B] to-[#1C2541] text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-black tracking-widest text-[#FF8A00] uppercase">
              EXCLUSIVO PARA GESTORES & INVESTIDORES
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Morning Call GRIT: Os Mercados Antes da Abertura da B3
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Receba todos os dias úteis às 08h00 o resumo consolidado com cotações asiáticas e europeias, commodities, pré-mercado de Nova York e o que esperar do Copom.
            </p>
          </div>

          <div className="w-full md:w-auto min-w-[280px]">
            {isSubscribed ? (
              <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Inscrição ativa! Você receberá a Morning Call diariamente.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribeNewsletter} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Seu e-mail corporativo..."
                  value={emailNewsletter}
                  onChange={e => setEmailNewsletter(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-[#146EF5] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF8A00] hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-colors shrink-0 cursor-pointer shadow-md"
                >
                  Assinar Grátis
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* MODAL FICHA TÉCNICA DO INDICADOR */}
      {selectedIndicatorDetail && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedIndicatorDetail(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedIndicatorDetail.name}</h3>
                  <span className="text-xs font-mono font-bold text-blue-600">{selectedIndicatorDetail.symbol}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIndicatorDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Cotação Vigente:</span>
                <span className="text-2xl font-mono font-black text-slate-900">{selectedIndicatorDetail.value}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Variação Recente:</span>
                <span className={`font-bold ${selectedIndicatorDetail.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedIndicatorDetail.change}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div>
                <strong className="text-slate-900 block mb-0.5">Metodologia & Apuração:</strong>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedIndicatorDetail.methodology}
                </p>
              </div>

              <div>
                <strong className="text-slate-900 block mb-0.5">Contexto de Mercado:</strong>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedIndicatorDetail.benchmarkContext}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-slate-500">
                <span>Fonte: <strong>{selectedIndicatorDetail.source}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <a
                href={selectedIndicatorDetail.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#146EF5] hover:underline"
              >
                <span>Acessar Base Oficial da Fonte</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedIndicatorDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
