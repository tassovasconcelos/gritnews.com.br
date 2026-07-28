import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Copy, ExternalLink } from 'lucide-react';
import { Offer, OfferType, Category } from '../../types';
import { saveOffer } from '../../lib/storage';
import { Modal } from '../ui/Modal';

interface AdminOffersProps {
  offers: Offer[];
  categories: Category[];
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminOffers: React.FC<AdminOffersProps> = ({ offers, categories, onRefresh, onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<OfferType>('PRODUCT');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [shortDescription, setShortDescription] = useState('');
  const [image, setImage] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(499);
  const [promoPrice, setPromoPrice] = useState<number | undefined>(299);
  const [couponCode, setCouponCode] = useState('GRIT2026');
  const [affiliateUrl, setAffiliateUrl] = useState('https://gritnews.com.br/ofertas');
  const [badgeText, setBadgeText] = useState('OFERTA GRIT');

  const handleOpenNew = () => {
    setEditingOffer(null);
    setTitle('');
    setType('PRODUCT');
    setCategoryId(categories[0]?.id || '');
    setShortDescription('Descrição da oferta B2B ou cupom...');
    setImage('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600');
    setOriginalPrice(499);
    setPromoPrice(299);
    setCouponCode('GRIT2026');
    setAffiliateUrl('https://gritnews.com.br/ofertas');
    setBadgeText('OFERTA GRIT');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    saveOffer({
      id: editingOffer ? editingOffer.id : `offer-${Date.now()}`,
      title,
      slug,
      type,
      categoryId,
      shortDescription,
      fullDescription: shortDescription,
      image,
      originalPrice,
      promoPrice,
      couponCode,
      affiliateUrl,
      featured: true,
      clicksCount: editingOffer ? editingOffer.clicksCount : 0,
      conversionsCount: editingOffer ? editingOffer.conversionsCount : 0,
      badgeText
    });

    setIsModalOpen(false);
    onRefresh();
    onShowToast(`Oferta "${title}" salva com sucesso!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B2343]">Gerenciador de Ofertas & Afiliados</h1>
          <p className="text-sm text-[#5C6B7A]">Cadastre produtos, cupons e links com rastreamento UTM</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Oferta B2B</span>
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#0B2343] font-extrabold uppercase">
              <tr>
                <th className="p-4">Título</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Preço Promo</th>
                <th className="p-4">Cupom</th>
                <th className="p-4">Cliques</th>
                <th className="p-4">Conversões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#10233F]">
              {offers.map(o => (
                <tr key={o.id} className="hover:bg-[#F7F9FC]">
                  <td className="p-4 font-bold text-[#0B2343]">{o.title}</td>
                  <td className="p-4 font-semibold text-[#145EDB]">{o.type}</td>
                  <td className="p-4 font-bold text-[#22A06B]">
                    {o.promoPrice ? `R$ ${o.promoPrice}` : 'Sob Consulta'}
                  </td>
                  <td className="p-4 text-[#FF8500] font-bold">{o.couponCode || 'N/A'}</td>
                  <td className="p-4 font-bold">{o.clicksCount}</td>
                  <td className="p-4 font-bold text-[#22A06B]">{o.conversionsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Oferta ou Produto">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Título da Oferta *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Tipo de Oferta</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as OfferType)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            >
              <option value="PRODUCT">Produto / Software B2B</option>
              <option value="AFFILIATE">Programa de Afiliados</option>
              <option value="INFOPRODUCT">Infoproduto / Curso</option>
              <option value="LEAD_QUOTE">Orçamento Especial (Captura de Lead)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Preço Promocional (R$)</label>
            <input
              type="number"
              value={promoPrice || ''}
              onChange={e => setPromoPrice(Number(e.target.value))}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Código do Cupom de Desconto</label>
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Link de Afiliado / Destino</label>
            <input
              type="text"
              value={affiliateUrl}
              onChange={e => setAffiliateUrl(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <button type="submit" className="w-full bg-[#145EDB] text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
            Salvar Oferta
          </button>
        </form>
      </Modal>
    </div>
  );
};
