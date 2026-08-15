import React, { useState } from 'react';
import { addPlaybookOrder, getSiteConfig } from '../../lib/storage';
import { PlaybookOrder, PlaybookOrderStatus } from '../../types';
import { generatePixBrCode } from '../../lib/pixUtils';
import { PlaybookMetabolicQuiz } from '../tools/PlaybookMetabolicQuiz';
import { 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  BookOpen, 
  Download, 
  Clock, 
  Award, 
  HeartPulse, 
  Zap, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  CreditCard, 
  QrCode, 
  ArrowRight, 
  Gift, 
  MessageCircle, 
  Share2, 
  FileText, 
  Star, 
  Users, 
  TrendingDown, 
  AlertCircle,
  Coffee,
  Apple,
  Copy,
  Calculator
} from 'lucide-react';

interface PlaybookEmagrecimentoViewProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const PlaybookEmagrecimentoView: React.FC<PlaybookEmagrecimentoViewProps> = ({ onShowToast }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [generatedPixCode, setGeneratedPixCode] = useState('');

  const siteConfig = getSiteConfig();

  const handleOpenCheckout = () => {
    setIsCheckoutOpen(true);
    setOrderCompleted(false);
  };

  const handleProcessPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      onShowToast('Por favor, preencha nome, e-mail e WhatsApp para liberação imediata.', 'info');
      return;
    }

    setIsProcessingOrder(true);

    const generatedId = `ord-pb-${Date.now().toString().slice(-6)}`;
    setCurrentOrderId(generatedId);

    // Generate dynamic PIX code using the configured admin key
    const pixCode = generatePixBrCode({
      pixKey: siteConfig.pixKey || 'tassovasconcelos@gmail.com',
      pixKeyType: siteConfig.pixKeyType || 'email',
      beneficiaryName: siteConfig.pixBeneficiaryName || 'TASSO VASCONCELOS',
      beneficiaryCity: siteConfig.pixCity || 'FORTALEZA',
      amount: 29.90,
      txId: generatedId.replace(/[^a-zA-Z0-9]/g, '').slice(-15),
      description: 'Playbook Emagrecimento'
    });

    setGeneratedPixCode(pixCode);

    const orderStatus: PlaybookOrderStatus = paymentMethod === 'card' ? 'PAID' : 'PENDING_PIX';

    const newOrder: PlaybookOrder = {
      id: generatedId,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      amount: 29.90,
      status: orderStatus,
      accessSent: paymentMethod === 'card',
      createdAt: new Date().toISOString(),
      paidAt: paymentMethod === 'card' ? new Date().toISOString() : undefined,
      notes: paymentMethod === 'card' 
        ? 'Aprovado via Gateway Mercado Pago / Cartão.' 
        : `PIX gerado para chave: ${siteConfig.pixKey || 'tassovasconcelos@gmail.com'}`
    };

    addPlaybookOrder(newOrder);

    setTimeout(() => {
      setIsProcessingOrder(false);
      setOrderCompleted(true);
      onShowToast('Pedido gerado com sucesso! Conclua o pagamento via PIX ou Mercado Pago.', 'success');
    }, 800);
  };

  const handleCopyPix = () => {
    const codeToCopy = generatedPixCode || generatePixBrCode({
      pixKey: siteConfig.pixKey || 'tassovasconcelos@gmail.com',
      pixKeyType: siteConfig.pixKeyType || 'email',
      beneficiaryName: siteConfig.pixBeneficiaryName || 'TASSO VASCONCELOS',
      beneficiaryCity: siteConfig.pixCity || 'FORTALEZA',
      amount: 29.90,
      txId: 'PLAYBOOK2990',
      description: 'Playbook Emagrecimento'
    });
    navigator.clipboard.writeText(codeToCopy);
    onShowToast('Código PIX Copia e Cola copiado com sucesso!', 'success');
  };

  const handleCopyPixKeyOnly = () => {
    const keyToCopy = siteConfig.pixKey || 'tassovasconcelos@gmail.com';
    navigator.clipboard.writeText(keyToCopy);
    onShowToast(`Chave PIX (${keyToCopy}) copiada!`, 'success');
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="bg-[#0B132B] text-slate-100 min-h-screen selection:bg-[#FF8A00] selection:text-white">
      {/* Top Urgent Alert Bar */}
      <div className="bg-gradient-to-r from-[#FF8A00] via-rose-500 to-[#FF8A00] text-white text-center py-2 px-4 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md">
        <Flame className="w-4 h-4 animate-bounce" />
        <span>Oferta Especial de Lançamento GRIT Saúde: Acesso Vitalício por Apenas R$ 29,90 (Preço Normal: R$ 97,00)</span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-80 h-80 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold text-amber-400 border border-white/15 shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Método Científico & Descomplicado • Sem Restrições Radicais</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              Perca Gordura, Desinflame o Corpo e <span className="bg-gradient-to-r from-amber-400 via-[#FF8A00] to-rose-400 bg-clip-text text-transparent">Destrave seu Metabolismo</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              O guia passo a passo definitivo para emagrecer com saúde comendo comida de verdade, sem passar fome, sem cortar o convívio social e sem gastar fortunas em fórmulas mágicas.
            </p>

            {/* Main Action CTA Box */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleOpenCheckout}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FF8A00] to-[#E67A00] hover:from-[#FFA02E] hover:to-[#FF8A00] text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3"
              >
                <span>QUERO O PLAYBOOK POR R$ 29,90</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  const target = document.getElementById('quiz-metabolico-section');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-sm sm:text-base rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Calcular Meu Diagnóstico Metabólico (Grátis)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Garantia Incondicional de 7 Dias
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-400" /> Acesso Imediato no seu E-mail / WhatsApp
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> 4 Bônus Exclusivos Inclusos
              </span>
            </div>
          </div>

          {/* Book Mockup Visual Container */}
          <div className="mt-14 max-w-4xl mx-auto bg-gradient-to-b from-slate-800/80 to-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Mockup Left Card */}
              <div className="md:col-span-5 relative flex justify-center">
                <div className="w-64 sm:w-72 aspect-[3/4] bg-gradient-to-tr from-[#0F1E36] via-[#1E293B] to-[#FF8A00]/20 rounded-2xl border-2 border-amber-400/40 p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A00]/20 rounded-full blur-2xl"></div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] uppercase tracking-widest bg-amber-400/20 text-amber-300 font-black px-2 py-0.5 rounded">GRIT SAÚDE</span>
                      <span className="text-[10px] text-slate-400 font-bold">EDIÇÃO 2026</span>
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight">
                      PLAYBOOK EMAGRECIMENTO SAUDÁVEL
                    </h3>
                    <p className="text-xs text-amber-400/90 font-medium mt-1">
                      O Método Definitivo Anti-Efeito Sanfona
                    </p>
                  </div>

                  <div className="space-y-2 py-4 my-auto">
                    <div className="h-1 w-12 bg-[#FF8A00] rounded"></div>
                    <p className="text-[11px] text-slate-300">
                      Reeducação Metabólica • Crononutrição • 28 Dias de Cardápios • Tabela de Substituições
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Autor: Equipe GRIT</span>
                    <span className="text-amber-400 font-black">R$ 29,90</span>
                  </div>
                </div>
              </div>

              {/* Benefits Bullet Points */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  O Que Você Vai Aprender e Aplicar Imediatamente:
                </h3>

                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <span><strong>Destravar a Queima de Gordura:</strong> Como ativar o gasto calórico basal sem precisar passar horas em esteiras exaustivas.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <span><strong>Fim do Vício em Doces e Beliscos:</strong> A fórmula nutricional para equilibrar a insulina e eliminar a compulsão noturna.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <span><strong>Cardápio Prático de 28 Dias:</strong> Receitas com ingredientes acessíveis que você encontra em qualquer supermercado de bairro.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <span><strong>Guia Social Anti-Culpa:</strong> Como comer em restaurantes, aniversários e fins de semana sem sabotar o seu progresso.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    onClick={handleOpenCheckout}
                    className="text-amber-400 hover:text-amber-300 text-sm font-bold inline-flex items-center gap-1.5 group cursor-pointer"
                  >
                    <span>Quero garantir meu exemplar digital agora</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Metabolic Quiz & Diagnosis Funnel */}
      <section id="quiz-metabolico-section" className="py-12 bg-slate-950/60 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <PlaybookMetabolicQuiz 
            onNavigateCheckout={handleOpenCheckout}
            onShowToast={onShowToast}
          />
        </div>
      </section>

      {/* Comparison: Dietas da Moda vs. Método Playbook */}
      <section className="py-16 bg-[#0E1726] border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Por que 95% das pessoas falham nas dietas tradicionais?
            </h2>
            <p className="text-sm text-slate-400">
              Veja a diferença entre tentar emagrecer no sofrimento e aplicar um método de sustentabilidade metabólica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Bad Way */}
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-rose-300">Dietas Radicais & Chás Milagrosos</h3>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Passar fome e sentir fraqueza, irritabilidade e dores de cabeça constantes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Cortar carboidratos totalmente e perder a vontade de viver no terceiro dia.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Efeito sanfona brutal: engordar o dobro assim que volta a comer normalmente.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Gastar rios de dinheiro em cápsulas e shakes industriais sem comprovação.</span>
                </li>
              </ul>
            </div>

            {/* The Playbook Way */}
            <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-5 relative overflow-hidden shadow-xl shadow-emerald-900/10">
              <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                MÉTODO COMPROVADO
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-300">O Playbook Emagrecimento Saudável</h3>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Comer pratos saborosos e fartos, equilibrando macronutrientes com inteligência.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Preservação de massa magra enquanto queima gordura visceral profunda.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Mais energia, sono restaurador e pele renovada pela ação anti-inflamatória.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Investimento único e acessível de apenas R$ 29,90 com acesso vitalício.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Breakdown Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-amber-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Conteúdo Programático Completo</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Os 6 Módulos Estratégicos do Playbook
          </h2>
          <p className="text-sm text-slate-400">
            Cada capítulo foi desenhado em linguagem direta e prática para você ler em menos de 2 horas e aplicar no mesmo dia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="w-10 h-10 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center font-black text-sm">
              01
            </div>
            <h4 className="text-base font-bold text-white">Revolução Metabólica</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Descubra por que seu metabolismo ficou preguiçoso e aprenda a chave biológica para religar o motor queimador de gordura.
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="w-10 h-10 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center font-black text-sm">
              02
            </div>
            <h4 className="text-base font-bold text-white">Nutrição Anti-Inflamatória</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Elimine o inchaço abdominal e retenção de líquidos identificando os 5 alimentos silenciosos que travam o emagrecimento.
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="w-10 h-10 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center font-black text-sm">
              03
            </div>
            <h4 className="text-base font-bold text-white">Crononutrição Prática</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O momento certo do dia para ingerir carboidratos, proteínas e gorduras para maximizar a energia e otimizar o sono profundo.
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="w-10 h-10 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center font-black text-sm">
              04
            </div>
            <h4 className="text-base font-bold text-white">Substituições Inteligentes</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              A tabela visual para trocar ingredientes ultraprocessados por versões nutritivas e deliciosas sem perder o prazer de comer.
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="w-10 h-10 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center font-black text-sm">
              05
            </div>
            <h4 className="text-base font-bold text-white">Cortisol, Estresse & Ansiedade</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Técnicas de 5 minutos para controlar os picos de estresse hormonal que provocam a fome emocional e o acúmulo de gordura.
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="w-10 h-10 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center font-black text-sm">
              06
            </div>
            <h4 className="text-base font-bold text-white">Manutenção Vitalícia</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O protocolo pós-emagrecimento para nunca mais voltar ao peso antigo e manter seu corpo saudável e definido nos próximos anos.
            </p>
          </div>
        </div>
      </section>

      {/* 4 Exclusive Bonuses Section */}
      <section className="py-16 bg-gradient-to-b from-[#0D182A] to-[#0A1220] border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
              <Gift className="w-4 h-4" />
              <span>Bônus Gratuitos Inclusos Hoje</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Leve 4 Bônus Exclusivos Sem Pagar Nada a Mais
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-800/50 rounded-2xl border border-amber-500/20 flex gap-4 items-start">
              <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Bônus #1: Cardápio 28 Dias Pronto</h4>
                  <span className="text-[10px] text-amber-400 line-through">R$ 47</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Cardápio completo de 4 semanas com café da manhã, almoço, lanches e jantar sem complicação.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-800/50 rounded-2xl border border-amber-500/20 flex gap-4 items-start">
              <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl shrink-0">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Bônus #2: Guia de Compras Inteligente</h4>
                  <span className="text-[10px] text-amber-400 line-through">R$ 27</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  A lista de feira e supermercado para economizar até 30% nas compras mensais de alimentos saudáveis.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-800/50 rounded-2xl border border-amber-500/20 flex gap-4 items-start">
              <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Bônus #3: 20 Receitas Rápidas de 15min</h4>
                  <span className="text-[10px] text-amber-400 line-through">R$ 37</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Opções práticas para os dias corridos em que você não tem tempo para cozinhar pratos elaborados.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-800/50 rounded-2xl border border-amber-500/20 flex gap-4 items-start">
              <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Bônus #4: Checklist Diário de Hábitos</h4>
                  <span className="text-[10px] text-amber-400 line-through">R$ 19</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Planilha imprimível e interativa para acompanhar seu progresso de peso, medidas e energia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Box & Pricing Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 border-2 border-amber-500/40 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-[#FF8A00] to-rose-500"></div>

          <span className="inline-block px-4 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
            ACESSO IMEDIATO & VITALÍCIO
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Tudo isso por apenas:
          </h2>

          <div className="py-2">
            <p className="text-slate-400 text-sm line-through">De R$ 97,00 por apenas</p>
            <p className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight mt-1">
              R$ 29,90
            </p>
            <p className="text-xs text-slate-300 mt-1">ou 3x de R$ 10,47 no cartão sem juros</p>
          </div>

          <button
            onClick={handleOpenCheckout}
            className="w-full max-w-md mx-auto py-4 px-6 bg-gradient-to-r from-[#FF8A00] to-[#E67A00] hover:from-[#FFA02E] hover:to-[#FF8A00] text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3"
          >
            <span>SIM! QUERO MEU ACESSO AGORA</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Guarantee Badge */}
          <div className="pt-6 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-300">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <p className="text-left max-w-md">
              <strong>Garantia Incondicional de 7 Dias:</strong> Leia o material, aplique as receitas e se não gostar por qualquer motivo, devolvemos 100% do seu dinheiro sem burocracia.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 max-w-3xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Perguntas Frequentes (FAQ)</h2>
          <p className="text-xs sm:text-sm text-slate-400">Tire todas as suas dúvidas sobre o Playbook e o formato de entrega</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Como vou receber o Playbook e os Bônus?',
              a: 'Assim que o pagamento for confirmado (no PIX ou Cartão é instantâneo), você receberá um e-mail e uma mensagem no WhatsApp com o link direto para download do e-book em formato PDF de alta resolução, legível em qualquer celular, tablet ou computador.'
            },
            {
              q: 'Preciso tomar remédios ou shakes industriais?',
              a: 'Absolutamente NÃO. O método é 100% focado em comida de verdade, alimentos naturais e hábitos biológicos saudáveis. Você não gastará dinheiro com suplementos caros.'
            },
            {
              q: 'Serve para quem tem a rotina muito corrida?',
              a: 'Sim! Foi feito exatamente para pessoas ocupadas. Os módulos são objetivos e o Bônus de Receitas de 15 Minutos resolve o almoço e jantar sem complicação.'
            },
            {
              q: 'E se eu não gostar do conteúdo?',
              a: 'Você tem 7 dias de garantia total. Basta nos enviar um e-mail ou WhatsApp e estornamos 100% do valor pago sem fazer perguntas.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-amber-400 transition-colors"
              >
                <span>{item.q}</span>
                {openFaqIndex === idx ? <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
              </button>
              {openFaqIndex === idx && (
                <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-700/50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Floating Bottom CTA */}
      <div className="sticky bottom-4 max-w-xl mx-auto px-4 z-40">
        <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-amber-400 font-bold uppercase">Preço Promocional</p>
            <p className="text-lg sm:text-xl font-black text-white">R$ 29,90 <span className="text-xs text-slate-400 font-normal">vitalício</span></p>
          </div>
          <button
            onClick={handleOpenCheckout}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#E67A00] hover:from-[#FFA02E] hover:to-[#FF8A00] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>COMPRAR AGORA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 text-white">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderCompleted ? (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase mb-1">
                    <Lock className="w-3.5 h-3.5" /> Ambiente Seguro de Pagamento
                  </div>
                  <h3 className="text-xl font-black text-white">Finalizar Pedido do Playbook</h3>
                  <p className="text-xs text-slate-400 mt-1">Preencha seus dados para liberação imediata do seu acesso digital.</p>
                </div>

                {/* Summary Box */}
                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">Playbook Emagrecimento Saudável + 4 Bônus</p>
                    <p className="text-slate-400 text-[11px]">Download em PDF • Acesso Vitalício</p>
                  </div>
                  <span className="text-base font-black text-amber-400">R$ 29,90</span>
                </div>

                {/* Payment Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>PIX Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleProcessPurchase} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Seu Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria Silva"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Seu Melhor E-mail (onde receberá o e-book) *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: maria.silva@gmail.com"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">WhatsApp com DDD (para envio de link backup) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (85) 99123-4567"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-[11px] text-slate-300 space-y-2">
                      <p>💳 Simulação de Gateway Seguro: Aceitamos Visa, Mastercard, Elo e Hipercard em até 3x de R$ 10,47.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessingOrder}
                    className="w-full py-4 bg-gradient-to-r from-[#FF8A00] to-[#E67A00] hover:from-[#FFA02E] hover:to-[#FF8A00] text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessingOrder ? (
                      <span>Gerando acesso seguro...</span>
                    ) : (
                      <>
                        <span>GERAR PAGAMENTO (R$ 29,90)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Order Success Screen */
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Pedido Criado com Sucesso!</h3>
                  <p className="text-xs text-slate-300">
                    Obrigado, <strong className="text-white">{customerName}</strong>! Conclua o pagamento de <strong className="text-amber-400">R$ 29,90</strong> para liberar o download imediato.
                  </p>
                </div>

                {paymentMethod === 'pix' && (
                  <div className="bg-slate-800 p-4 rounded-2xl border border-amber-400/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" />
                        <span>PIX Copia e Cola Oficial (R$ 29,90):</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {currentOrderId || 'ORD-PB'}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg text-[10px] text-slate-300 font-mono break-all text-left select-all border border-slate-700">
                      {generatedPixCode || '00020126580014br.gov.bcb.pix0136' + (siteConfig.pixKey || 'tassovasconcelos@gmail.com')}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={handleCopyPix}
                        className="py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código Copia e Cola</span>
                      </button>

                      <button
                        onClick={handleCopyPixKeyOnly}
                        className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-600"
                      >
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Copiar Somente Chave</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex flex-wrap justify-between items-center gap-2 text-left">
                      <div>
                        <span className="text-slate-500">Beneficiário:</span> <strong className="text-slate-300">{siteConfig.pixBeneficiaryName || 'TASSO VASCONCELOS'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Chave:</span> <strong className="text-slate-300">{siteConfig.pixKey || 'tassovasconcelos@gmail.com'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Cidade:</span> <strong className="text-slate-300">{siteConfig.pixCity || 'FORTALEZA'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {siteConfig.mercadoPagoWalletUrl && (
                  <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl text-xs space-y-2 text-left">
                    <p className="text-sky-300 font-bold">Prefere pagar via Mercado Pago?</p>
                    <a
                      href={siteConfig.mercadoPagoWalletUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 py-2 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Abrir Checkout Mercado Pago</span>
                    </a>
                  </div>
                )}

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 text-left">
                  <Download className="w-5 h-5 shrink-0" />
                  <span>Assim que você pagar, o arquivo em PDF e os 4 bônus serão enviados automaticamente para <strong>{customerEmail}</strong>.</span>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
