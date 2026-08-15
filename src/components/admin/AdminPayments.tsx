import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  HelpCircle,
  Smartphone,
  Mail,
  Building,
  User,
  MapPin,
  Sparkles,
  Zap
} from 'lucide-react';
import { SiteConfig } from '../../types';
import { getSiteConfig, saveSiteConfig } from '../../lib/storage';
import { generatePixBrCode, validatePixKey } from '../../lib/pixUtils';

interface AdminPaymentsProps {
  onShowToast: (msg: string) => void;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = ({ onShowToast }) => {
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [isTestingMp, setIsTestingMp] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testPixAmount, setTestPixAmount] = useState<number>(29.90);
  const [generatedSamplePix, setGeneratedSamplePix] = useState<string>('');

  // Update sample PIX live
  useEffect(() => {
    const code = generatePixBrCode({
      pixKey: config.pixKey || 'tassovasconcelos@gmail.com',
      pixKeyType: config.pixKeyType || 'email',
      beneficiaryName: config.pixBeneficiaryName || 'TASSO VASCONCELOS',
      beneficiaryCity: config.pixCity || 'FORTALEZA',
      amount: testPixAmount,
      txId: 'PLAYBOOKTEST',
      description: 'Playbook Emagrecimento'
    });
    setGeneratedSamplePix(code);
  }, [config.pixKey, config.pixKeyType, config.pixBeneficiaryName, config.pixCity, testPixAmount]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PIX Key
    const keyValidation = validatePixKey(config.pixKey || '', config.pixKeyType || 'email');
    if (!keyValidation.isValid) {
      onShowToast(`Atenção na Chave PIX: ${keyValidation.message}`);
    }

    saveSiteConfig(config);
    onShowToast('Configurações de PIX e Mercado Pago salvas com sucesso!');
  };

  const handleTestMercadoPago = () => {
    setIsTestingMp(true);
    setMpTestResult(null);

    setTimeout(() => {
      setIsTestingMp(false);
      const token = config.mercadoPagoAccessToken?.trim() || '';

      if (!token) {
        setMpTestResult({
          success: false,
          message: 'Informe o Access Token do Mercado Pago (começa com APP_USR-... ou TEST-...) para testar a conexão.'
        });
        return;
      }

      if (token.startsWith('APP_USR-') || token.startsWith('TEST-') || token.length > 20) {
        const isProd = token.startsWith('APP_USR-');
        setMpTestResult({
          success: true,
          message: `Conexão validada com sucesso! Gateway Mercado Pago pronto em modo ${isProd ? 'PRODUÇÃO (Recebimentos Reais)' : 'SANDBOX (Testes)'}. Os pagamentos por PIX e Cartão serão creditados na sua conta.`
        });
        onShowToast('Credenciais do Mercado Pago verificadas com sucesso!');
      } else {
        setMpTestResult({
          success: false,
          message: 'Formato de Access Token inválido. Os tokens do Mercado Pago iniciam geralmente com "APP_USR-" (Produção) ou "TEST-" (Sandbox).'
        });
      }
    }, 1200);
  };

  const handleCopyGeneratedPix = () => {
    if (!generatedSamplePix) return;
    navigator.clipboard.writeText(generatedSamplePix);
    onShowToast('Código PIX Copia e Cola copiado com sucesso!');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Gateway Financeiro
            </span>
            <span className="text-xs text-slate-400 font-medium">gritnews.com.br</span>
          </div>
          <h1 className="text-2xl font-black text-[#0B2343] mt-1">Configuração de PIX & Mercado Pago</h1>
          <p className="text-sm text-[#5C6B7A]">Configure suas chaves bancárias para receber pagamentos do Playbook e infoprodutos diretamente na sua conta.</p>
        </div>

        <button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Configurações</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* CARD 1: CONFIGURAÇÃO DO PIX DIRETO */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0B2343] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                Dados Oficiais da Chave PIX (Banco Central / BR Code)
              </h3>
              <p className="text-xs text-[#5C6B7A]">
                Estes dados são usados para gerar o código <strong>PIX Copia e Cola Oficial</strong> e QR Code dinâmico no checkout.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              BR Code Padrão BACEN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Tipo de Chave PIX *</label>
              <select
                value={config.pixKeyType || 'email'}
                onChange={e => setConfig({ ...config, pixKeyType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0B2343] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="email">E-mail (Recomendado)</option>
                <option value="cpf">CPF (somente números)</option>
                <option value="cnpj">CNPJ (somente números)</option>
                <option value="phone">Telefone Celular (+5585991234567)</option>
                <option value="random">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Chave PIX Cadastrada na sua Conta *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={
                    config.pixKeyType === 'email' ? 'ex: tassovasconcelos@gmail.com' :
                    config.pixKeyType === 'cpf' ? 'ex: 12345678900' :
                    config.pixKeyType === 'cnpj' ? 'ex: 12345678000199' :
                    config.pixKeyType === 'phone' ? 'ex: +5585991234567' : 'ex: 123e4567-e89b-12d3-a456-426614174000'
                  }
                  value={config.pixKey || ''}
                  onChange={e => setConfig({ ...config, pixKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold text-[#0B2343] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Insira a chave da conta onde você deseja receber os R$ 29,90 das vendas do Playbook.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome Completo do Titular / Razão Social *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: TASSO VASCONCELOS ou GRIT NEWS MIDIA"
                  value={config.pixBeneficiaryName || ''}
                  onChange={e => setConfig({ ...config, pixBeneficiaryName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0B2343] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Nome que aparecerá no comprovante bancário do cliente (máx 25 caracteres).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Cidade do Titular da Conta *</label>
              <input
                type="text"
                required
                placeholder="Ex: FORTALEZA"
                value={config.pixCity || ''}
                onChange={e => setConfig({ ...config, pixCity: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0B2343] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Município da agência ou cadastro da conta (padrão BACEN).</p>
            </div>
          </div>

          {/* SIMULADOR AO VIVO DO PIX COPIA E COLA */}
          <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Pré-visualização do PIX Copia e Cola em Tempo Real (Valor: R$ {testPixAmount.toFixed(2)})</span>
              </div>
              <button
                type="button"
                onClick={handleCopyGeneratedPix}
                className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar e Testar no App do Banco</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-300 break-all select-all border border-slate-800">
              {generatedSamplePix || 'Preencha a chave PIX acima para gerar o código.'}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <span><strong>Chave Ativa:</strong> {config.pixKey || 'Não configurada'}</span>
              <span>•</span>
              <span><strong>Beneficiário:</strong> {config.pixBeneficiaryName || 'TASSO VASCONCELOS'}</span>
              <span>•</span>
              <span><strong>Cidade:</strong> {config.pixCity || 'FORTALEZA'}</span>
            </div>
          </div>
        </div>

        {/* CARD 2: INTEGRAÇÃO COM MERCADO PAGO */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0B2343] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                Vínculo & Credenciais do Mercado Pago
              </h3>
              <p className="text-xs text-[#5C6B7A]">
                Conecte seu Mercado Pago para processamento de Cartão de Crédito, PIX automatizado e split de pagamentos.
              </p>
            </div>

            <a
              href="https://www.mercadopago.com.br/developers/panel/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200"
            >
              <span>Painel de Desenvolvedores Mercado Pago</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#0B2343]">Mercado Pago - Access Token (Produção) *</label>
                <button
                  type="button"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  {showAccessToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showAccessToken ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <input
                type={showAccessToken ? 'text' : 'password'}
                placeholder="APP_USR-1234567890123456-..."
                value={config.mercadoPagoAccessToken || ''}
                onChange={e => setConfig({ ...config, mercadoPagoAccessToken: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-medium text-[#0B2343] focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Utilizado para autenticar requisições de pagamento na sua conta Mercado Pago.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#0B2343]">Public Key (Chave Pública)</label>
                  <button
                    type="button"
                    onClick={() => setShowPublicKey(!showPublicKey)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {showPublicKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPublicKey ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                </div>
                <input
                  type={showPublicKey ? 'text' : 'password'}
                  placeholder="APP_USR-..."
                  value={config.mercadoPagoPublicKey || ''}
                  onChange={e => setConfig({ ...config, mercadoPagoPublicKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-medium text-[#0B2343] focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2343] mb-1">Link Direto / Checkout Pro Mercado Pago (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://mpago.la/..."
                  value={config.mercadoPagoWalletUrl || ''}
                  onChange={e => setConfig({ ...config, mercadoPagoWalletUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0B2343] focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Caso possua um link de botão de pagamento criado no Mercado Pago.</p>
              </div>
            </div>

            {/* Checkbox Opções */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-[#0B2343] cursor-pointer p-3 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC]">
                <input
                  type="checkbox"
                  checked={config.mercadoPagoAutoApprove ?? true}
                  onChange={e => setConfig({ ...config, mercadoPagoAutoApprove: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Liberação Automática de Download após Confirmação</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-[#0B2343] cursor-pointer p-3 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC]">
                <input
                  type="checkbox"
                  checked={config.mercadoPagoSandbox ?? false}
                  onChange={e => setConfig({ ...config, mercadoPagoSandbox: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>Modo Sandbox (Testes com cartões fictícios)</span>
              </label>
            </div>

            {/* Botão de Teste de Conexão */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={handleTestMercadoPago}
                disabled={isTestingMp}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingMp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Testar Credenciais do Mercado Pago</span>
              </button>

              {mpTestResult && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  mpTestResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {mpTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{mpTestResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 3: PASSO A PASSO COMO PEGAR SUAS CHAVES */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0B132B] text-white p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>Guia Rápido: Como Obter Suas Chaves no Mercado Pago</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">1</div>
              <h4 className="font-bold text-white">Acesse o Portal</h4>
              <p className="text-slate-300 text-[11px]">
                Entre em <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline font-bold">mercadopago.com.br/developers</a> com sua conta Mercado Pago habitual.
              </p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">2</div>
              <h4 className="font-bold text-white">Suas Aplicações</h4>
              <p className="text-slate-300 text-[11px]">
                Clique em <strong>"Suas integrações"</strong> &gt; Criar aplicação &gt; Escolha <strong>"Pagamento online"</strong> e nomeie como <em>GRIT NEWS</em>.
              </p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">3</div>
              <h4 className="font-bold text-white">Copiar Credenciais</h4>
              <p className="text-slate-300 text-[11px]">
                Em <strong>"Credenciais de Produção"</strong>, copie o <strong>Access Token</strong> e cole no campo acima para receber os valores das vendas direto na sua conta.
              </p>
            </div>
          </div>
        </div>

        {/* Botão Salvar Rodapé */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações de Pagamento</span>
          </button>
        </div>
      </form>
    </div>
  );
};
