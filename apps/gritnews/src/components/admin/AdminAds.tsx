import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Sparkles, Eye, MousePointer } from 'lucide-react';
import { AdCampaign, AdPlacementLocation, AdType } from '../../types';
import { saveAd, getAds } from '../../lib/storage';
import { Modal } from '../ui/Modal';

interface AdminAdsProps {
  ads: AdCampaign[];
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminAds: React.FC<AdminAdsProps> = ({ ads, onRefresh, onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdCampaign | null>(null);

  const [name, setName] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [type, setType] = useState<AdType>('BANNER');
  const [location, setLocation] = useState<AdPlacementLocation>('HOME_BETWEEN_BLOCKS');
  const [imageUrl, setImageUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');

  const handleOpenNew = () => {
    setEditingAd(null);
    setName('');
    setAdvertiserName('Parceiro GRIT');
    setType('BANNER');
    setLocation('HOME_BETWEEN_BLOCKS');
    setImageUrl('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800');
    setHeadline('Campanha de Impacto Comercial');
    setBodyText('Conheça soluções líderes para transformar seus negócios.');
    setTargetUrl('https://gritnews.com.br/ofertas');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    saveAd({
      id: editingAd ? editingAd.id : `ad-${Date.now()}`,
      name,
      advertiserName,
      type,
      location,
      imageUrl,
      headline,
      bodyText,
      targetUrl,
      startDate: new Date().toISOString(),
      impressionsCount: editingAd ? editingAd.impressionsCount : 0,
      clicksCount: editingAd ? editingAd.clicksCount : 0,
      status: 'ACTIVE'
    });

    setIsModalOpen(false);
    onRefresh();
    onShowToast(`Campanha "${name}" salva com sucesso!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B2343]">Gerenciador de Anúncios e Publicidade</h1>
          <p className="text-sm text-[#5C6B7A]">Controle campanhas diretas, banners e inserções AdSense</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-[#FF8500] hover:bg-[#e07500] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Campanha</span>
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#0B2343] font-extrabold uppercase">
              <tr>
                <th className="p-4">Campanha</th>
                <th className="p-4">Anunciante</th>
                <th className="p-4">Posição</th>
                <th className="p-4">Impressões</th>
                <th className="p-4">Cliques</th>
                <th className="p-4">CTR</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#10233F]">
              {ads.map(a => {
                const ctr = a.impressionsCount > 0 ? ((a.clicksCount / a.impressionsCount) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={a.id} className="hover:bg-[#F7F9FC]">
                    <td className="p-4 font-bold text-[#0B2343]">{a.name}</td>
                    <td className="p-4 text-gray-500">{a.advertiserName}</td>
                    <td className="p-4 font-semibold text-[#145EDB]">{a.location}</td>
                    <td className="p-4 font-bold">{a.impressionsCount}</td>
                    <td className="p-4 font-bold">{a.clicksCount}</td>
                    <td className="p-4 font-bold text-[#FF8500]">{ctr}%</td>
                    <td className="p-4">
                      <span className="bg-[#22A06B]/10 text-[#22A06B] px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Campanha Publicitária">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome da Campanha *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome do Anunciante</label>
            <input
              type="text"
              value={advertiserName}
              onChange={e => setAdvertiserName(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Posição no Layout</label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value as AdPlacementLocation)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            >
              <option value="HEADER">Topo da Home (Header Banner)</option>
              <option value="HOME_BETWEEN_BLOCKS">Entre blocos da Home</option>
              <option value="SIDEBAR">Barra Lateral</option>
              <option value="IN_ARTICLE">Dentro do Artigo</option>
              <option value="CATEGORY_TOP">Topo da Categoria</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Título da Chamada</label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Link de Destino Target</label>
            <input
              type="text"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <button type="submit" className="w-full bg-[#FF8500] text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
            Salvar Campanha
          </button>
        </form>
      </Modal>
    </div>
  );
};
