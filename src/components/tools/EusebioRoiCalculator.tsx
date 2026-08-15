import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Percent, 
  ArrowRight, 
  Download, 
  MessageCircle, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw,
  PieChart,
  BarChart3
} from 'lucide-react';

interface EusebioRoiCalculatorProps {
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  defaultPropertyValue?: number;
  defaultNeighborhood?: string;
  onSelectPropertyInterest?: (neighborhood: string, price: number) => void;
}

export const EusebioRoiCalculator: React.FC<EusebioRoiCalculatorProps> = ({
  onShowToast,
  defaultPropertyValue = 1200000,
  defaultNeighborhood = 'Alphaville Eusébio'
}) => {
  // Input States
  const [propertyPrice, setPropertyPrice] = useState<number>(defaultPropertyValue);
  const [strategy, setStrategy] = useState<'rental_monthly' | 'rental_short_stay' | 'flip_appreciation'>('rental_monthly');
  const [neighborhood, setNeighborhood] = useState<string>(defaultNeighborhood);
  const [furnishingCost, setFurnishingCost] = useState<number>(60000);
  const [holdingYears, setHoldingYears] = useState<number>(5);

  // Monthly Rental Mode Inputs
  const [monthlyRent, setMonthlyRent] = useState<number>(6500);
  const [condoAndIptuPayer, setCondoAndIptuPayer] = useState<'tenant' | 'owner'>('tenant');
  const [propertyMgmtRate, setPropertyMgmtRate] = useState<number>(8); // % da imobiliária
  const [occupancyMonthsPerYear, setOccupancyMonthsPerYear] = useState<number>(11.5); // meses alugado/ano

  // Short-Stay (Airbnb/Booking) Mode Inputs
  const [dailyRate, setDailyRate] = useState<number>(650);
  const [occupancyRatePercent, setOccupancyRatePercent] = useState<number>(60); // % de ocupação anual
  const [cleaningAndPlatformFeePercent, setCleaningAndPlatformFeePercent] = useState<number>(20); // taxa da plataforma + gestão

  // Capital Appreciation
  const [annualAppreciationRate, setAnnualAppreciationRate] = useState<number>(14.5); // % média histórica Eusébio

  // Lead Generation state
  const [investorName, setInvestorName] = useState('');
  const [investorPhone, setInvestorPhone] = useState('');
  const [investorEmail, setInvestorEmail] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Calculated Metrics
  const calculations = useMemo(() => {
    const totalInitialInvestment = propertyPrice + (strategy === 'rental_short_stay' ? furnishingCost : furnishingCost * 0.5);

    let grossAnnualIncome = 0;
    let netAnnualOperatingIncome = 0;

    if (strategy === 'rental_monthly') {
      grossAnnualIncome = monthlyRent * occupancyMonthsPerYear;
      const mgmtExpense = grossAnnualIncome * (propertyMgmtRate / 100);
      const maintenanceReserve = grossAnnualIncome * 0.05; // 5% manutenção
      netAnnualOperatingIncome = grossAnnualIncome - mgmtExpense - maintenanceReserve;
    } else if (strategy === 'rental_short_stay') {
      const activeDays = (365 * occupancyRatePercent) / 100;
      grossAnnualIncome = activeDays * dailyRate;
      const platformExpense = grossAnnualIncome * (cleaningAndPlatformFeePercent / 100);
      const maintenanceReserve = grossAnnualIncome * 0.08;
      netAnnualOperatingIncome = grossAnnualIncome - platformExpense - maintenanceReserve;
    } else {
      // Flip / Construção para revenda
      grossAnnualIncome = 0;
      netAnnualOperatingIncome = 0;
    }

    // Rental Yield (Cap Rate)
    const annualRentalYield = totalInitialInvestment > 0 ? (netAnnualOperatingIncome / totalInitialInvestment) * 100 : 0;
    const monthlyNetCashFlow = netAnnualOperatingIncome / 12;

    // Projected Property Value after Holding Period with compound appreciation
    const finalPropertyValue = propertyPrice * Math.pow(1 + annualAppreciationRate / 100, holdingYears);
    const totalCapitalGain = finalPropertyValue - propertyPrice;

    // Cumulative Rental Income over Holding Years
    const cumulativeRentalIncome = netAnnualOperatingIncome * holdingYears;

    // Total Net Return
    const totalReturn = totalCapitalGain + cumulativeRentalIncome;
    const totalRoiPercent = totalInitialInvestment > 0 ? (totalReturn / totalInitialInvestment) * 100 : 0;
    const annualizedRoiPercent = totalInitialInvestment > 0 
      ? (Math.pow(1 + totalRoiPercent / 100, 1 / holdingYears) - 1) * 100 
      : 0;

    // Comparison Benchmarks
    const cdiAnnualRate = 10.5; // Benchmark CDI
    const cdiFinalCapital = totalInitialInvestment * Math.pow(1 + (cdiAnnualRate * 0.85) / 100, holdingYears);
    const cdiNetProfit = cdiFinalCapital - totalInitialInvestment;

    const eusebioAdvantagePercent = cdiNetProfit > 0 
      ? Math.round(((totalReturn - cdiNetProfit) / cdiNetProfit) * 100)
      : 100;

    return {
      totalInitialInvestment,
      grossAnnualIncome,
      netAnnualOperatingIncome,
      annualRentalYield,
      monthlyNetCashFlow,
      finalPropertyValue,
      totalCapitalGain,
      cumulativeRentalIncome,
      totalReturn,
      totalRoiPercent,
      annualizedRoiPercent,
      cdiNetProfit,
      eusebioAdvantagePercent
    };
  }, [
    propertyPrice, 
    strategy, 
    furnishingCost, 
    holdingYears, 
    monthlyRent, 
    occupancyMonthsPerYear, 
    propertyMgmtRate, 
    dailyRate, 
    occupancyRatePercent, 
    cleaningAndPlatformFeePercent, 
    annualAppreciationRate
  ]);

  const handleSendToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorName || !investorPhone) {
      onShowToast('Por favor, informe seu nome e WhatsApp para receber o dossiê.', 'info');
      return;
    }

    const message = encodeURIComponent(
      `*Dossiê de Investimento Imobiliário - GRIT NEWS & Eusébio*\n\n` +
      `👤 *Investidor:* ${investorName}\n` +
      `📍 *Região:* ${neighborhood}\n` +
      `🏷️ *Valor do Imóvel:* R$ ${propertyPrice.toLocaleString('pt-BR')}\n` +
      `📊 *Estratégia:* ${
        strategy === 'rental_monthly' ? 'Aluguel Mensal / Residencial' :
        strategy === 'rental_short_stay' ? 'Temporada / Airbnb' : 'Ganho de Capital / Valorização'
      }\n` +
      `💰 *Yield Anual Líquido:* ${calculations.annualRentalYield.toFixed(2)}% a.a.\n` +
      `💵 *Fluxo de Caixa Líquido Mensal:* R$ ${calculations.monthlyNetCashFlow.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}\n` +
      `📈 *Valorização Projetada (${holdingYears} anos):* R$ ${calculations.finalPropertyValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}\n` +
      `🚀 *ROI Total Projetado:* +${calculations.totalRoiPercent.toFixed(1)}% (+R$ ${calculations.totalReturn.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})\n\n` +
      `Olá! Gostaria de receber oportunidades reais de imóveis e lotes no Eusébio com esses parâmetros de rentabilidade.`
    );

    window.open(`https://wa.me/5585998877665?text=${message}`, '_blank');
    onShowToast('Relatório gerado! Redirecionando para o especialista no WhatsApp...', 'success');
    setIsReportModalOpen(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B2343] via-[#0E2D55] to-[#145EDB] text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulador de Rentabilidade 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Calculadora de ROI & Yield Imobiliário no Eusébio
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Projete com precisão matemática o retorno de aluguel residencial, short-stay (Airbnb) e valorização patrimonial no polo imobiliário de maior crescimento do Ceará.
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/40 cursor-pointer shrink-0 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Análise em PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Metrics */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Strategy Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              1. Estratégia do Investimento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStrategy('rental_monthly')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  strategy === 'rental_monthly'
                    ? 'bg-[#145EDB]/10 border-[#145EDB] text-[#145EDB] font-black shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Locação Mensal</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('rental_short_stay')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  strategy === 'rental_short_stay'
                    ? 'bg-[#145EDB]/10 border-[#145EDB] text-[#145EDB] font-black shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                }`}
              >
                <Sparkles className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Airbnb / Temporada</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('flip_appreciation')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  strategy === 'flip_appreciation'
                    ? 'bg-[#145EDB]/10 border-[#145EDB] text-[#145EDB] font-black shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                }`}
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Ganho de Capital</span>
              </button>
            </div>
          </div>

          {/* Property Price & Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Valor do Imóvel / Aquisição (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step={50000}
                  min={100000}
                  value={propertyPrice}
                  onChange={e => setPropertyPrice(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-[#145EDB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Bairro / Região no Eusébio
              </label>
              <select
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="Alphaville Eusébio">Alphaville Eusébio (Alto Padrão)</option>
                <option value="Cidade Alpha Ceará">Cidade Alpha Ceará (Residencial 1-4)</option>
                <option value="Precabura">Precabura (Próximo à CE-010 e Praia)</option>
                <option value="Urucunema">Urucunema (Eixo de Expansão)</option>
                <option value="Centro do Eusébio">Centro / Polo Gastronômico</option>
                <option value="Coaçu / Autódromo">Coaçu / Autódromo</option>
              </select>
            </div>
          </div>

          {/* Strategy-Specific Controls */}
          {strategy === 'rental_monthly' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <p className="text-xs font-black text-[#0B2343] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#145EDB]" />
                <span>Parâmetros de Locação Mensal</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aluguel Líquido Estimado / Mês
                  </label>
                  <input
                    type="number"
                    step={200}
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Média no Eusébio: 0,45% a 0,65% do valor do imóvel
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taxa de Gestão Imobiliária (%)
                  </label>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    max={15}
                    value={propertyMgmtRate}
                    onChange={e => setPropertyMgmtRate(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {strategy === 'rental_short_stay' && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4">
              <p className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Parâmetros de Temporada (Airbnb / Eventos Eusébio)</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Diária Média (R$)
                  </label>
                  <input
                    type="number"
                    step={50}
                    value={dailyRate}
                    onChange={e => setDailyRate(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ocupação Média Anual (%)
                  </label>
                  <input
                    type="number"
                    step={5}
                    min={10}
                    max={100}
                    value={occupancyRatePercent}
                    onChange={e => setOccupancyRatePercent(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Investimento Mobília (R$)
                  </label>
                  <input
                    type="number"
                    step={5000}
                    value={furnishingCost}
                    onChange={e => setFurnishingCost(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Capital Appreciation & Holding Sliders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-700">Valorização Anual Projetada</span>
                <span className="font-black text-[#145EDB] bg-blue-50 px-2 py-0.5 rounded-md">
                  {annualAppreciationRate}% a.a.
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="25"
                step="0.5"
                value={annualAppreciationRate}
                onChange={e => setAnnualAppreciationRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#145EDB]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Conservador (8%)</span>
                <span>Média Eusébio (14.5%)</span>
                <span>Alta Demanda (20%+)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-700">Horizonte de Investimento</span>
                <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {holdingYears} {holdingYears === 1 ? 'ano' : 'anos'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={holdingYears}
                onChange={e => setHoldingYears(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B2343]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Financial Results Dashboard (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900 to-[#0B2343] text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl border border-white/10">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Resultado Projetado
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-full border border-emerald-500/30">
                Horizonte: {holdingYears} Anos
              </span>
            </div>

            {/* Big Metrics */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Retorno Total Estimado (ROI)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                    +{calculations.totalRoiPercent.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    (+R$ {calculations.totalReturn.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Yield Anual Aluguel</p>
                  <p className="text-lg font-black text-white mt-0.5">
                    {calculations.annualRentalYield.toFixed(2)}% a.a.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    R$ {calculations.monthlyNetCashFlow.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês líq.
                  </p>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Final do Imóvel</p>
                  <p className="text-lg font-black text-white mt-0.5">
                    R$ {(calculations.finalPropertyValue / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold">
                    +R$ {calculations.totalCapitalGain.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Benchmark vs CDI */}
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs space-y-1.5">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Supera o CDI / Renda Fixa em +{calculations.eusebioAdvantagePercent}%</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Enquanto o CDI entregaria ~R$ {calculations.cdiNetProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}, o imóvel no Eusébio projeta gerar <strong>R$ {calculations.totalReturn.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong> somando fluxo de aluguel e ganho de capital.
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="pt-6 space-y-3">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Receber Dossiê & Oportunidades</span>
            </button>
            <p className="text-[10px] text-center text-slate-400">
              Atendimento direto com corretor credenciado no Eusébio e Alphaville
            </p>
          </div>

        </div>

      </div>

      {/* Modal Lead Capture / WhatsApp Dispatch */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#0B2343]">
                Dossiê Completo de Rentabilidade
              </h3>
              <p className="text-xs text-slate-500">
                Informe onde deseja receber a análise com os melhores imóveis disponíveis no {neighborhood}
              </p>
            </div>

            <form onSubmit={handleSendToWhatsApp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tasso Vasconcelos"
                  value={investorName}
                  onChange={e => setInvestorName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-[#145EDB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">WhatsApp com DDD *</label>
                <input
                  type="tel"
                  required
                  placeholder="(85) 99887-6655"
                  value={investorPhone}
                  onChange={e => setInvestorPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-[#145EDB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">E-mail para envio</label>
                <input
                  type="email"
                  placeholder="investidor@exemplo.com"
                  value={investorEmail}
                  onChange={e => setInvestorEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Simulação no WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-center font-bold"
              >
                Voltar à calculadora
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
