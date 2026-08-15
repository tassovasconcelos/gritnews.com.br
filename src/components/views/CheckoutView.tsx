import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  QrCode,
  CheckCircle2,
  Copy,
  Zap,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Phone,
  Mail,
  User,
  FileText,
  Tag,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Clock,
  Send,
  Building,
  HeartHandshake
} from 'lucide-react';
import { CommercialProduct, PlaybookOrder, SiteConfig } from '../../types';
import { COMMERCIAL_PRODUCTS, getProductById } from '../../data/commercialProducts';
import { getSiteConfig, addPlaybookOrder } from '../../lib/storage';
import { processMercadoPagoCheckout, detectCardBrand } from '../../lib/mercadoPagoService';
import confetti from 'canvas-confetti';

interface CheckoutViewProps {
  initialProductId?: string;
  onBackToHome: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  initialProductId = 'prod-playbook-emagrecimento',
  onBackToHome,
  onShowToast
}) => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => getSiteConfig());
  
  // Produto selecionado
  const [selectedProduct, setSelectedProduct] = useState<CommercialProduct>(() => {
    const found = getProductById(initialProductId);
    return found || COMMERCIAL_PRODUCTS[0];
  });
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Método de pagamento
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'mercadopago_wallet'>('pix');

  // Dados do comprador
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');

  // Cartão de Crédito
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  // Cupom
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Processamento
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<PlaybookOrder | null>(null);
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [pixPayloadCode, setPixPayloadCode] = useState<string>('');

  // Timer do Pix (15 minutos)
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => {
    setSiteConfig(getSiteConfig());
  }, []);

  useEffect(() => {
    if (orderCompleted && paymentMethod === 'pix') {
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [orderCompleted, paymentMethod]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Preço calculado
  const basePrice = selectedProduct.price;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Manipulação de máscaras
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      setCustomerPhone(digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim());
    } else {
      setCustomerPhone(digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim());
    }
  };

  const handleCpfChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    setCustomerCpf(digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/[-.]$/, ''));
  };

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const parts = digits.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleCardExpiryChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2, 4)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  // Aplicação de Cupom
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCoupon = couponInput.trim().toUpperCase();
    if (!cleanCoupon) return;

    if (cleanCoupon === 'GRIT10' || cleanCoupon === 'BEMVINDO') {
      const disc = Number((basePrice * 0.1).toFixed(2));
      setDiscountAmount(disc);
      setAppliedCoupon(cleanCoupon);
      onShowToast(`Cupom ${cleanCoupon} aplicado! Desconto de 10%.`, 'success');
    } else if (cleanCoupon === 'PROMO2026' || cleanCoupon === 'DESCONTO5') {
      const disc = 5.00;
      setDiscountAmount(disc);
      setAppliedCoupon(cleanCoupon);
      onShowToast(`Cupom ${cleanCoupon} aplicado! Desconto de R$ 5,00.`, 'success');
    } else {
      onShowToast('Cupom inválido ou expirado.', 'error');
    }
  };

  // Envio do Pedido
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      onShowToast('Por favor, informe seu nome completo.', 'error');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      onShowToast('Informe um e-mail válido para envio do acesso.', 'error');
      return;
    }
    if (!customerPhone.trim()) {
      onShowToast('Informe seu número de WhatsApp com DDD.', 'error');
      return;
    }

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 15) {
        onShowToast('Informe os 16 dígitos do cartão de crédito.', 'error');
        return;
      }
      if (!cardHolderName.trim()) {
        onShowToast('Informe o nome do titular como impresso no cartão.', 'error');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        onShowToast('Informe a validade no formato MM/AA.', 'error');
        return;
      }
      if (cardCvv.length < 3) {
        onShowToast('Informe o código de segurança (CVV).', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await processMercadoPagoCheckout({
        product: selectedProduct,
        customerName,
        customerEmail,
        customerPhone,
        customerCpf,
        paymentMethod,
        cardDetails: paymentMethod === 'card' ? {
          cardNumber,
          cardHolderName,
          cardExpiry,
          cardCvv,
          installments,
          brand: detectCardBrand(cardNumber)
        } : undefined,
        couponCode: appliedCoupon || undefined,
        discountAmount,
        finalAmount: finalPrice,
        siteConfig
      });

      if (result.success) {
        // Gravar no histórico de pedidos do sistema
        addPlaybookOrder(result.order);
        setCompletedOrder(result.order);
        if (result.pixQrCodeDataUrl) setPixQrCodeUrl(result.pixQrCodeDataUrl);
        if (result.pixPayload) setPixPayloadCode(result.pixPayload);

        // Se for Wallet Mercado Pago, redirecionar se configurado
        if (paymentMethod === 'mercadopago_wallet' && result.mercadoPagoInitPoint) {
          window.open(result.mercadoPagoInitPoint, '_blank');
        }

        // Lançar confetes se cartão aprovado ou pedido criado
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        setOrderCompleted(true);
        onShowToast(result.message, 'success');
      } else {
        onShowToast('Não foi possível processar o pedido. Tente novamente.', 'error');
      }
    } catch (err) {
      console.error('Erro no checkout:', err);
      onShowToast('Ocorreu um erro ao processar o pagamento.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixPayloadCode) return;
    navigator.clipboard.writeText(pixPayloadCode);
    onShowToast('Código PIX Copia e Cola copiado com sucesso!', 'success');
  };

  const handleCopyPixKey = () => {
    const key = siteConfig.pixKey || 'tassovasconcelos@gmail.com';
    navigator.clipboard.writeText(key);
    onShowToast(`Chave PIX (${key}) copiada!`, 'success');
  };

  const handleSendWhatsAppReceipt = () => {
    if (!completedOrder) return;
    const phone = '5585994441122'; // WhatsApp Comercial GRIT News
    const msg = `Olá, Equipe GRIT News! 👋\n\nAcabei de realizar o pedido *${completedOrder.id}* no portal:\n- *Produto:* ${selectedProduct.title}\n- *Valor:* R$ ${completedOrder.amount.toFixed(2)}\n- *Cliente:* ${completedOrder.customerName}\n- *E-mail:* ${completedOrder.customerEmail}\n\nGostaria de confirmar o pagamento e o recebimento dos acessos. Obrigado!`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B2343] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#145EDB] bg-white px-4 py-2 rounded-full border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Portal GRIT</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ambiente 100% Criptografado SSL</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              <span>Checkout Oficial Mercado Pago</span>
            </div>
          </div>
        </div>

        {!orderCompleted ? (
          /* =========================================================
             TELA DE CHECKOUT PRINCIPAL (FORMULÁRIO + RESUMO)
             ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUNA ESQUERDA (7 COLS): DADOS DO CLIENTE & PAGAMENTO */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Box 1: Seletor de Produto */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#145EDB] text-white text-xs font-black flex items-center justify-center">1</span>
                    <h3 className="text-base font-black text-[#0B2343]">Item Selecionado para Compra</h3>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                      className="text-xs font-bold text-[#145EDB] hover:text-[#0B2343] flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 transition-colors cursor-pointer"
                    >
                      <span>Trocar Produto</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {isProductDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1 max-h-96 overflow-y-auto">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 py-1">
                          Catálogo de Produtos e Serviços GRIT
                        </p>
                        {COMMERCIAL_PRODUCTS.map(prod => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setDiscountAmount(0);
                              setAppliedCoupon(null);
                              setIsProductDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                              selectedProduct.id === prod.id ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-[#0B2343] line-clamp-1">{prod.title}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">{prod.category}</p>
                            </div>
                            <span className="text-xs font-black text-[#145EDB] shrink-0">
                              R$ {prod.price.toFixed(2)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card do Produto Selecionado */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#F7F9FC] p-4 rounded-2xl border border-slate-200">
                  {selectedProduct.image && (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.title}
                      className="w-full sm:w-28 h-24 sm:h-24 object-cover rounded-xl shrink-0"
                    />
                  )}
                  <div className="space-y-1 flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#145EDB]/10 text-[#145EDB]">
                        {selectedProduct.category}
                      </span>
                      {selectedProduct.badge && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#FF8500]/10 text-[#FF8500]">
                          {selectedProduct.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-[#0B2343]">{selectedProduct.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{selectedProduct.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Box 2: Dados do Comprador */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#145EDB] text-white text-xs font-black flex items-center justify-center">2</span>
                  <h3 className="text-base font-black text-[#0B2343]">Dados de Identificação & Envio</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Eduardo de Albuquerque"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seu Melhor E-mail *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="Ex: seuemail@gmail.com"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">O link de download e recibo serão enviados aqui.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp com DDD *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="(85) 99999-9999"
                        value={customerPhone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Para suporte ágil e envio de confirmação.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">CPF ou CNPJ (para emissão do comprovante)</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={customerCpf}
                        onChange={e => handleCpfChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: Seleção e Formulário de Pagamento */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#145EDB] text-white text-xs font-black flex items-center justify-center">3</span>
                  <h3 className="text-base font-black text-[#0B2343]">Forma de Pagamento Mercado Pago</h3>
                </div>

                {/* Abas de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PIX */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Instantâneo
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#0B2343]">PIX Oficial</p>
                      <p className="text-[11px] text-slate-500">Aprovação em segundos</p>
                    </div>
                  </button>

                  {/* CARTÃO DE CRÉDITO */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#145EDB] bg-sky-50/50 shadow-md ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-sky-100 text-[#145EDB] rounded-xl">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-[#145EDB] text-white px-2 py-0.5 rounded-full">
                        Até 12x
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#0B2343]">Cartão de Crédito</p>
                      <p className="text-[11px] text-slate-500">Mercado Pago Seguro</p>
                    </div>
                  </button>

                  {/* CHECKOUT PRO / WALLET */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mercadopago_wallet')}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'mercadopago_wallet'
                        ? 'border-sky-600 bg-sky-50 shadow-md ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-sky-200 text-sky-800 rounded-xl">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-sky-600 text-white px-2 py-0.5 rounded-full">
                        Conta MP
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#0B2343]">Conta Mercado Pago</p>
                      <p className="text-[11px] text-slate-500">Saldo ou Mercado Crédito</p>
                    </div>
                  </button>
                </div>

                {/* CONTEÚDO DO MÉTODO SELECIONADO */}
                {paymentMethod === 'pix' && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <QrCode className="w-4 h-4" />
                      <span>Como funciona o pagamento por PIX:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-emerald-900 list-disc list-inside">
                      <li>Ao clicar no botão abaixo, geramos o QR Code dinâmico e o código Copia e Cola.</li>
                      <li>Você copia o código ou aponta a câmera no app do seu banco (qualquer instituição bancária).</li>
                      <li>A liberação do seu produto ou serviço ocorre instantaneamente após o pagamento.</li>
                    </ul>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-gradient-to-r from-[#0B2343] to-[#145EDB] text-white rounded-2xl shadow-lg relative overflow-hidden text-xs">
                      <div className="flex justify-between items-center mb-6">
                        <span className="font-mono text-[10px] tracking-widest text-sky-200">MERCADO PAGO TRANSPARENTE</span>
                        <span className="font-extrabold text-sm uppercase bg-white/20 px-2 py-0.5 rounded">
                          {detectCardBrand(cardNumber).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-base tracking-widest mb-4">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between items-end text-[11px]">
                        <div>
                          <p className="text-[9px] text-sky-200 uppercase">Titular</p>
                          <p className="font-bold uppercase tracking-wider">{cardHolderName || 'NOME DO TITULAR'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-sky-200 uppercase">Validade</p>
                          <p className="font-bold">{cardExpiry || 'MM/AA'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Número do Cartão *</label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={e => handleCardNumberChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-mono font-medium focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Nome Impresso no Cartão *</label>
                        <input
                          type="text"
                          placeholder="Ex: CARLOS E ALBUQUERQUE"
                          value={cardHolderName}
                          onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium uppercase focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Validade (MM/AA) *</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={e => handleCardExpiryChange(e.target.value)}
                          className="w-full px-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium text-center focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Código de Segurança (CVV) *</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="123"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium text-center focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Opções de Parcelamento *</label>
                        <select
                          value={installments}
                          onChange={e => setInstallments(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none"
                        >
                          <option value={1}>1x de R$ {finalPrice.toFixed(2)} (à vista sem juros)</option>
                          <option value={2}>2x de R$ {(finalPrice / 2).toFixed(2)} sem juros</option>
                          <option value={3}>3x de R$ {(finalPrice / 3).toFixed(2)} sem juros</option>
                          <option value={6}>6x de R$ {((finalPrice * 1.05) / 6).toFixed(2)}</option>
                          <option value={12}>12x de R$ {((finalPrice * 1.12) / 12).toFixed(2)}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'mercadopago_wallet' && (
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-2 text-xs text-sky-950">
                    <p className="font-bold text-sky-900">Pague com o ecossistema Mercado Pago:</p>
                    <p className="text-[11px] text-sky-800">
                      Você poderá utilizar o saldo da sua conta Mercado Pago, cartões salvos ou a linha de crédito Mercado Crédito com total segurança e praticidade.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA (5 COLS): RESUMO FINANCEIRO, CUPOM E BOTÃO DE FECHAMENTO */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6">
                <h3 className="text-base font-black text-[#0B2343] pb-3 border-b border-slate-100">
                  Resumo do Pedido
                </h3>

                {/* Lista de Benefícios do Produto */}
                <div className="space-y-2.5 text-xs text-slate-700">
                  <p className="font-bold text-[#0B2343]">O que está incluso na sua compra:</p>
                  {selectedProduct.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px]">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Formulário de Cupom */}
                <form onSubmit={handleApplyCoupon} className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Cupom de Desconto</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ex: GRIT10"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3 py-2 bg-[#F7F9FC] border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-[#145EDB] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cupom {appliedCoupon} ativo (-R$ {discountAmount.toFixed(2)})
                    </p>
                  )}
                </form>

                {/* Tabela de Preços */}
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                    <div className="flex justify-between text-slate-400">
                      <span>Valor Original:</span>
                      <span className="line-through">R$ {selectedProduct.originalPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Preço Promocional:</span>
                    <span>R$ {basePrice.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Desconto do Cupom:</span>
                      <span>- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-[#0B2343]">
                    <div>
                      <span className="text-base font-black">Total a Pagar:</span>
                      <p className="text-[10px] text-slate-500">Sem taxas adicionais</p>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-[#145EDB]">
                      R$ {finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Botão de Conclusão do Checkout */}
                <button
                  type="button"
                  onClick={handleSubmitCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-[#FF8500] via-[#FF9E2C] to-[#FF8500] hover:from-[#E67700] hover:to-[#E67700] text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Processando no Mercado Pago...</span>
                  ) : (
                    <>
                      <span>FINALIZAR PAGAMENTO (R$ {finalPrice.toFixed(2)})</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Selos de Garantia */}
                <div className="space-y-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Garantia incondicional de 7 dias ou seu dinheiro de volta.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Acesso imediato enviado para o seu e-mail e WhatsApp.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* =========================================================
             TELA DE SUCESSO / CONFIRMAÇÃO DO PEDIDO (PIX & CARTÃO)
             ========================================================= */
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Pedido Gerado com Sucesso
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B2343]">
                {paymentMethod === 'card' ? 'Pagamento Aprovado!' : 'Pedido Criado no Mercado Pago!'}
              </h2>
              <p className="text-xs text-slate-600">
                Obrigado, <strong className="text-[#0B2343]">{customerName}</strong>! Pedido código: <strong className="font-mono text-[#145EDB]">{completedOrder?.id}</strong>
              </p>
            </div>

            {/* SE FOR PIX: EXIBIR O QR CODE E CÓDIGO COPIA E COLA */}
            {paymentMethod === 'pix' && (
              <div className="bg-[#F7F9FC] p-6 rounded-2xl border-2 border-emerald-500/30 text-left space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>Pague com o PIX Oficial (R$ {finalPrice.toFixed(2)}):</span>
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expira em {formatTimer(timeLeft)}</span>
                  </div>
                </div>

                {/* QR Code Imagem Gerada Dinamicamente */}
                {pixQrCodeUrl && (
                  <div className="flex justify-center py-2">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                      <img
                        src={pixQrCodeUrl}
                        alt="QR Code PIX Mercado Pago"
                        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto"
                      />
                      <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                        Aponte a câmera do aplicativo do seu banco
                      </p>
                    </div>
                  </div>
                )}

                {/* Código Copia e Cola */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Código PIX Copia e Cola:
                  </label>
                  <div className="p-3 bg-white rounded-xl text-[10px] font-mono text-slate-700 break-all border border-slate-200 select-all max-h-20 overflow-y-auto">
                    {pixPayloadCode}
                  </div>
                </div>

                {/* Botões de Ação do PIX */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar Código Copia e Cola</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPixKey}
                    className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-300 transition-all"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Copiar Chave ({siteConfig.pixKey || 'tassovasconcelos@gmail.com'})</span>
                  </button>
                </div>

                {/* Detalhes do Favorecido Oficial */}
                <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Beneficiário:</span>
                    <strong className="text-slate-900">{siteConfig.pixBeneficiaryName || 'TASSO VASCONCELOS'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Chave PIX:</span>
                    <strong className="text-slate-900">{siteConfig.pixKey || 'tassovasconcelos@gmail.com'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cidade:</span>
                    <strong className="text-slate-900">{siteConfig.pixCity || 'FORTALEZA'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SE O PRODUTO FOR DIGITAL (PLAYBOOK), BOTÃO DE DOWNLOAD */}
            {selectedProduct.downloadUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Download className="w-5 h-5 text-emerald-600" />
                  <span>Seu E-book e Bônus estão liberados para download:</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Enviamos uma cópia de segurança para <strong>{customerEmail}</strong>. Você também pode baixar o arquivo em PDF de alta qualidade agora mesmo.
                </p>
                <a
                  href={selectedProduct.downloadUrl}
                  download="Playbook-Emagrecimento-Grit-News.pdf"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>BAIXAR PLAYBOOK EM PDF AGORA</span>
                </a>
              </div>
            )}

            {/* BOTÃO PARA ENVIAR COMPROVANTE POR WHATSAPP */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleSendWhatsAppReceipt}
                className="px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Comprovante pelo WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onBackToHome}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Voltar à Página Inicial
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
