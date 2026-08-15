import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  BookOpen, 
  Activity, 
  Clock, 
  Award, 
  AlertCircle, 
  RefreshCw, 
  Smile, 
  Zap, 
  Scale, 
  ChevronRight,
  TrendingDown,
  Check
} from 'lucide-react';

interface PlaybookMetabolicQuizProps {
  onNavigateCheckout: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const PlaybookMetabolicQuiz: React.FC<PlaybookMetabolicQuizProps> = ({
  onNavigateCheckout,
  onShowToast
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Biometrics
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [age, setAge] = useState<number>(34);
  const [currentWeight, setCurrentWeight] = useState<number>(78); // kg
  const [height, setHeight] = useState<number>(168); // cm

  // Step 2: Goal
  const [targetWeight, setTargetWeight] = useState<number>(66); // kg
  const [urgency, setUrgency] = useState<'30_days_fast' | '60_days_balanced' | '90_days_lifestyle'>('60_days_balanced');

  // Step 3: Lifestyle & Routine
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'very_active'>('light');
  const [sleepHours, setSleepHours] = useState<'under_6' | '6_to_7' | '7_to_8' | 'above_8'>('6_to_7');
  const [waterLiters, setWaterLiters] = useState<'under_1' | '1_to_2' | '2_to_3' | 'above_3'>('1_to_2');

  // Step 4: Roadblocks (Multiple choice)
  const [selectedRoadblocks, setSelectedRoadblocks] = useState<string[]>([
    'slow_metabolism',
    'night_cravings'
  ]);

  // Lead for Report
  const [userName, setUserName] = useState('');
  const [userWhatsApp, setUserWhatsApp] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);

  const roadblocksOptions = [
    { id: 'slow_metabolism', label: 'Metabolismo lento ou travado após dietas anteriores', icon: Zap },
    { id: 'night_cravings', label: 'Compulsão por doces ou ataques à geladeira à noite', icon: Flame },
    { id: 'yo_yo_effect', label: 'Efeito sanfona (emagrece e engorda tudo de novo)', icon: Scale },
    { id: 'anxiety_stress', label: 'Comer por ansiedade, estresse ou cansaço', icon: HeartPulse },
    { id: 'lack_of_time', label: 'Falta de tempo para cozinhar ou preparar refeições', icon: Clock },
    { id: 'bloating_gut', label: 'Retenção de líquidos e digestão estufada', icon: Activity }
  ];

  const toggleRoadblock = (id: string) => {
    if (selectedRoadblocks.includes(id)) {
      setSelectedRoadblocks(selectedRoadblocks.filter(r => r !== id));
    } else {
      setSelectedRoadblocks([...selectedRoadblocks, id]);
    }
  };

  // Metabolic Calculations (Mifflin-St Jeor)
  const diagnostic = useMemo(() => {
    // 1. Basal Metabolic Rate (BMR / TMB)
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age - 161;
    }

    // 2. Physical Activity Factor
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725
    };
    const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

    // 3. Recommended Deficit & Target Calories
    const dailyDeficit = 500; // ~0.5kg to 0.7kg pure fat loss per week safely
    const targetCalories = Math.max(1200, tdee - dailyDeficit);

    // 4. Weight to lose
    const weightToLose = Math.max(1, currentWeight - targetWeight);

    // 5. Projected weeks to goal
    const weeklyLossAverage = urgency === '30_days_fast' ? 0.9 : urgency === '60_days_balanced' ? 0.65 : 0.5;
    const projectedWeeks = Math.ceil(weightToLose / weeklyLossAverage);

    // 6. BMI (IMC)
    const heightInMeters = height / 100;
    const currentImc = currentWeight / (heightInMeters * heightInMeters);
    const targetImc = targetWeight / (heightInMeters * heightInMeters);

    let imcCategory = 'Normal';
    if (currentImc < 18.5) imcCategory = 'Abaixo do peso';
    else if (currentImc < 24.9) imcCategory = 'Peso Saudável';
    else if (currentImc < 29.9) imcCategory = 'Sobrepeso';
    else if (currentImc < 34.9) imcCategory = 'Obesidade Grau I';
    else imcCategory = 'Obesidade Grau II/III';

    // Projected Goal Date
    const today = new Date();
    const goalDate = new Date(today.getTime() + projectedWeeks * 7 * 24 * 60 * 60 * 1000);

    return {
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      dailyDeficit,
      weightToLose,
      projectedWeeks,
      currentImc: currentImc.toFixed(1),
      targetImc: targetImc.toFixed(1),
      imcCategory,
      goalDate: goalDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    };
  }, [gender, age, currentWeight, height, targetWeight, urgency, activityLevel]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (currentWeight <= targetWeight) {
        setTargetWeight(Math.round(currentWeight * 0.88));
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setIsCalculated(true);
      setCurrentStep(5);
      onShowToast('Diagnóstico metabólico gerado com sucesso!', 'success');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsCalculated(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0B2343] text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnóstico Metabólico & TMB 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Calculadora de Queima de Gordura & Plano Individual
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Descubra sua Taxa Metabólica Basal exata, gasto calórico diário e o protocolo personalizado do Playbook de Emagrecimento para o seu corpo.
            </p>
          </div>

          {currentStep < 5 && (
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 text-xs font-bold shrink-0">
              <span className="text-emerald-400">Etapa {currentStep} de 4</span>
              <div className="w-20 bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body Steps */}
      <div className="p-6 sm:p-8">
        
        {/* STEP 1: Biometrics */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-[#0B2343]">
                1. Quais são seus dados biométricos básicos?
              </h3>
              <p className="text-xs text-slate-500">
                Usado para aplicar a equação científica de Mifflin-St Jeor de Taxa Metabólica.
              </p>
            </div>

            {/* Gender Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg block mb-1">👩</span>
                <span>Mulher</span>
              </button>

              <button
                type="button"
                onClick={() => setGender('male')}
                className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg block mb-1">👨</span>
                <span>Homem</span>
              </button>
            </div>

            {/* Age, Weight, Height */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Idade (anos)</label>
                <input
                  type="number"
                  min={16}
                  max={90}
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Peso Atual (kg)</label>
                <input
                  type="number"
                  min={40}
                  max={200}
                  step={0.5}
                  value={currentWeight}
                  onChange={e => setCurrentWeight(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  min={120}
                  max={220}
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Avançar para a Meta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Goal */}
        {currentStep === 2 && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-[#0B2343]">
                2. Qual é a sua meta de peso?
              </h3>
              <p className="text-xs text-slate-500">
                Você pesa atualmente {currentWeight} kg (IMC {diagnostic.currentImc} - {diagnostic.imcCategory}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">
                Peso Alvo Desejado (kg)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={Math.max(40, currentWeight - 40)}
                  max={currentWeight}
                  value={targetWeight}
                  onChange={e => setTargetWeight(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="w-24 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-black text-center text-sm">
                  {targetWeight} kg
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-2">
                Meta de eliminação: -{diagnostic.weightToLose} kg de gordura corporal
              </p>
            </div>

            {/* Rhythm */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">
                Ritmo Preferido do Protocolo
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency('30_days_fast')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    urgency === '30_days_fast'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-black text-slate-900">Acelerado (30 Dias)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Foco em desinchar e queima rápida</p>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('60_days_balanced')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    urgency === '60_days_balanced'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-black text-slate-900">Equilibrado (60 Dias)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sem restrições extremas</p>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('90_days_lifestyle')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    urgency === '90_days_lifestyle'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-black text-slate-900">Sustentável (90+ Dias)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Reeducação definitiva</p>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-4 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-2xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <span>Avançar para Estilo de Vida</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Lifestyle & Routine */}
        {currentStep === 3 && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-[#0B2343]">
                3. Como é o seu nível de atividade e sono?
              </h3>
              <p className="text-xs text-slate-500">
                Necessário para calcular o TDEE (Gasto Energético Diário Total).
              </p>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">
                Nível de Atividade Física Atual
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'sedentary', label: 'Sedentário', desc: 'Trabalho sentado, pouco movimento' },
                  { id: 'light', label: 'Levemente Ativo', desc: 'Caminhadas 1 a 2x por semana' },
                  { id: 'moderate', label: 'Moderadamente Ativo', desc: 'Treinos 3 a 5x por semana' },
                  { id: 'very_active', label: 'Muito Ativo', desc: 'Treinos intensos 6x a 7x/sem' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityLevel(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activityLevel === item.id
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep & Water */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Média de Sono por Noite</label>
                <select
                  value={sleepHours}
                  onChange={e => setSleepHours(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="under_6">Menos de 6 horas (Alerta Cortisol)</option>
                  <option value="6_to_7">6 a 7 horas</option>
                  <option value="7_to_8">7 a 8 horas (Ideal metabólico)</option>
                  <option value="above_8">Mais de 8 horas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Ingestão de Água Diária</label>
                <select
                  value={waterLiters}
                  onChange={e => setWaterLiters(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="under_1">Menos de 1 Litro (Retenção alta)</option>
                  <option value="1_to_2">1 a 2 Litros</option>
                  <option value="2_to_3">2 a 3 Litros (Recomendado)</option>
                  <option value="above_3">Mais de 3 Litros</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-4 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-2xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <span>Avançar para Dificuldades</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Roadblocks */}
        {currentStep === 4 && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-[#0B2343]">
                4. O que mais te impede de emagrecer hoje?
              </h3>
              <p className="text-xs text-slate-500">
                Selecione todas as opções que se aplicam para calibrarmos os bônus e protocolos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roadblocksOptions.map(option => {
                const isSelected = selectedRoadblocks.includes(option.id);
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleRoadblock(option.id)}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold leading-snug">
                      {option.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-4 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-2xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Meu Diagnóstico Completo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Complete Personalized Diagnostic & Sales Offer */}
        {currentStep === 5 && (
          <div className="space-y-8">
            
            {/* Top Scorecard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Taxa Metabólica Basal (TMB)</p>
                <p className="text-2xl font-black text-[#0B2343] mt-1">{diagnostic.bmr} kcal</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Gasto em repouso absoluto</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Gasto Diário Real (TDEE)</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{diagnostic.tdee} kcal</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Com sua rotina atual</p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
                <p className="text-[11px] text-emerald-800 font-bold uppercase">Meta Calórica Diária</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{diagnostic.targetCalories} kcal</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">Déficit seguro de -500 kcal</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
                <p className="text-[11px] text-amber-800 font-bold uppercase">Previsão da Meta ({targetWeight}kg)</p>
                <p className="text-2xl font-black text-amber-600 mt-1">~{diagnostic.projectedWeeks} Semanas</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Alcançável em {diagnostic.goalDate}</p>
              </div>
            </div>

            {/* Diagnostic Matrix Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Customized Analysis */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-400">
                      Análise Metabólica Personalizada
                    </span>
                    <span className="text-xs text-slate-400">
                      IMC Atual: {diagnostic.currentImc} ➔ Alvo: {diagnostic.targetImc}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-snug">
                    Seu plano de ação para eliminar os {diagnostic.weightToLose} kg sem passar fome
                  </h3>

                  <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Janela Metabólica Ideal:</strong> Consumir cerca de {diagnostic.targetCalories} kcal diárias com 1.6g a 2.0g de proteína por kg para blindar sua massa magra.
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Desarmando o Efeito Sanfona:</strong> O Playbook introduz a estratégia de <em>refeed controlado</em> a cada 14 dias para evitar que sua tireoide reduza a TMB.
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Ataques Noturnos & Doces:</strong> Protocolo do <em>Chá Termogênico Calmante</em> (Bônus #2) para diminuir picos de grelina e cortisol após as 19h.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recalcular Dados</span>
                  </button>
                </div>
              </div>

              {/* Right Column: High-Converting Offer Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-[#0B2343] text-white rounded-3xl p-6 sm:p-7 border border-emerald-500/30 text-center space-y-4 shadow-xl">
                
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>Solução Completa Recomendada</span>
                </div>

                <h4 className="text-lg font-black text-white">
                  Playbook de Emagrecimento Saudável (Edição 2026)
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Receba todo o passo a passo dos 30 dias com cardápios econômicos, lista de compras, guia de chás e os 4 bônus exclusivos.
                </p>

                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                  <span className="text-xs text-slate-400 line-through font-bold">De R$ 97,00</span>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-xs text-emerald-400 font-bold">Por apenas</span>
                    <span className="text-3xl font-black text-white">R$ 29,90</span>
                  </div>
                  <p className="text-[10px] text-emerald-300 font-bold mt-1">
                    Pagamento Único • Liberação Imediata no PIX ou Cartão
                  </p>
                </div>

                <button
                  onClick={onNavigateCheckout}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/40 cursor-pointer"
                >
                  <span>Liberar Meu Acesso ao Playbook</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Garantia 7 Dias
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3 text-emerald-400" />
                    Download em PDF
                  </span>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
