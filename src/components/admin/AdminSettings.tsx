import React, { useState } from 'react';
import { Save, Globe, Shield, Search, FileCode, CreditCard } from 'lucide-react';
import { SiteConfig } from '../../types';
import { getSiteConfig, saveSiteConfig } from '../../lib/storage';

interface AdminSettingsProps {
  onShowToast: (msg: string) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onShowToast }) => {
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteConfig(config);
    onShowToast('Configurações globais e de SEO salvas com sucesso!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B2343]">Configurações Gerais & SEO do Portal</h1>
        <p className="text-sm text-[#5C6B7A]">Ajustes de domínio gritnews.com.br, Google Analytics e LGPD</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#0B2343] flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#145EDB]" />
            Dados Institucionais do Portal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome Oficial do Portal</label>
              <input
                type="text"
                value={config.siteName}
                onChange={e => setConfig({ ...config, siteName: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Domínio Oficial</label>
              <input
                type="text"
                value={config.domain}
                onChange={e => setConfig({ ...config, domain: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Slogan / Tagline</label>
            <input
              type="text"
              value={config.tagline}
              onChange={e => setConfig({ ...config, tagline: e.target.value })}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">E-mail de Suporte / Comercial</label>
            <input
              type="email"
              value={config.contactEmail}
              onChange={e => setConfig({ ...config, contactEmail: e.target.value })}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0B2343] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Gateway de Pagamento, PIX & Mercado Pago
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Recebimento Automático
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Tipo de Chave PIX</label>
              <select
                value={config.pixKeyType || 'email'}
                onChange={e => setConfig({ ...config, pixKeyType: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
              >
                <option value="email">E-mail</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="phone">Telefone Celular</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Chave PIX da sua Conta</label>
              <input
                type="text"
                placeholder="ex: tassovasconcelos@gmail.com"
                value={config.pixKey || ''}
                onChange={e => setConfig({ ...config, pixKey: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome do Titular da Conta PIX</label>
              <input
                type="text"
                placeholder="Ex: TASSO VASCONCELOS"
                value={config.pixBeneficiaryName || ''}
                onChange={e => setConfig({ ...config, pixBeneficiaryName: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Cidade da Conta</label>
              <input
                type="text"
                placeholder="Ex: FORTALEZA"
                value={config.pixCity || ''}
                onChange={e => setConfig({ ...config, pixCity: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Mercado Pago - Access Token (Produção)</label>
              <input
                type="password"
                placeholder="APP_USR-1234567890123456-..."
                value={config.mercadoPagoAccessToken || ''}
                onChange={e => setConfig({ ...config, mercadoPagoAccessToken: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Insira seu Access Token do Mercado Pago para liberar processamento de Cartão e PIX diretamente na sua conta.</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#0B2343] flex items-center gap-2">
            <Search className="w-5 h-5 text-[#145EDB]" />
            Integrações de Tracking & Ads
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Google Analytics Measurement ID</label>
              <input
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={config.googleAnalyticsId}
                onChange={e => setConfig({ ...config, googleAnalyticsId: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0B2343] mb-1">Google AdSense Publisher ID</label>
              <input
                type="text"
                placeholder="pub-xxxxxxxxxxxxxxxx"
                value={config.googleAdSenseId}
                onChange={e => setConfig({ ...config, googleAdSenseId: e.target.value })}
                className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#0B2343] cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={config.lgpdEnabled}
                onChange={e => setConfig({ ...config, lgpdEnabled: e.target.checked })}
                className="rounded text-[#145EDB]"
              />
              <span>Ativar Banner Flutuante de Consentimento LGPD</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações do Portal</span>
        </button>
      </form>
    </div>
  );
};
