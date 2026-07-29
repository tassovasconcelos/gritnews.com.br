import React, { useState } from 'react';
import { ExternalLink, Star, ShieldCheck, ShoppingBag, ArrowUpRight, Tag, Sparkles, CheckCircle2 } from 'lucide-react';

interface CuratedItem {
  id: string;
  title: string;
  category: string;
  price: string;
  originalPrice?: string;
  platform: 'Mercado Livre' | 'Amazon';
  image: string;
  badge?: string;
  link: string;
}

const MELI_LIST_URL = 'https://meli.la/1kXwMJQ';
const AMAZON_SHOP_URL = 'https://www.amazon.com.br/shop/tassovasconcelos';

const CURATED_ITEMS: CuratedItem[] = [
  {
    id: 'ml-kindle',
    title: 'Kindle Paperwhite 16GB - Luz Quente Ajustável',
    category: 'Tecnologia & Leitura',
    price: 'R$ 779,00',
    originalPrice: 'R$ 849,00',
    platform: 'Mercado Livre',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    badge: 'OFERTA ML',
    link: MELI_LIST_URL
  },
  {
    id: 'ml-fonte-tenpets',
    title: 'Fonte de Água Inox Automática Bivolt (Linha TenPets)',
    category: 'Linha TenPets',
    price: 'R$ 169,90',
    originalPrice: 'R$ 219,00',
    platform: 'Mercado Livre',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400',
    badge: 'TENPETS',
    link: MELI_LIST_URL
  },
  {
    id: 'ml-fone-xm5',
    title: 'Fone de Ouvido Sony WH-1000XM5 Noise Cancelling',
    category: 'Tecnologia',
    price: 'R$ 2.390,00',
    originalPrice: 'R$ 2.699,00',
    platform: 'Mercado Livre',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    badge: 'FRETE GRÁTIS',
    link: MELI_LIST_URL
  },
  {
    id: 'amz-livro-psicologia',
    title: 'Livro: A Psicologia Financeira - Morgan Housel',
    category: 'Livros B2B',
    price: 'R$ 42,90',
    platform: 'Amazon',
    image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&q=80&w=400',
    badge: 'AMAZON',
    link: AMAZON_SHOP_URL
  },
  {
    id: 'ml-airtag',
    title: 'Kit 4 Rastradores de Bagagem para Viagens & Aviação',
    category: 'Viagens & Aviação',
    price: 'R$ 989,00',
    originalPrice: 'R$ 1.190,00',
    platform: 'Mercado Livre',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400',
    badge: 'DESTAQUE',
    link: MELI_LIST_URL
  },
  {
    id: 'amz-mochila-executiva',
    title: 'Mochila Executiva Impermeável Anti-Furto com USB',
    category: 'Viagens',
    price: 'R$ 219,00',
    platform: 'Amazon',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    badge: 'AMAZON',
    link: AMAZON_SHOP_URL
  }
];

interface AmazonShopSectionProps {
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AmazonShopSection: React.FC<AmazonShopSectionProps> = ({ onShowToast }) => {
  const [activePlatform, setActivePlatform] = useState<'TODOS' | 'MERCADO_LIVRE' | 'AMAZON'>('TODOS');

  const filteredItems = CURATED_ITEMS.filter(item => {
    if (activePlatform === 'MERCADO_LIVRE') return item.platform === 'Mercado Livre';
    if (activePlatform === 'AMAZON') return item.platform === 'Amazon';
    return true;
  });

  const handleOpenLink = (url: string, platformName: string) => {
    if (onShowToast) {
      onShowToast(`Redirecionando para as recomendações de Tasso Vasconcelos no ${platformName}...`, 'info');
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="achados-tasso" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 my-6 shadow-sm relative overflow-hidden transition-all">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Header - Compact & Discreete */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-900 border border-yellow-300 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                <Tag className="w-3 h-3 text-yellow-700" />
                <span>Lista Mercado Livre Oficial</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                <span>Amazon Storefront</span>
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Achados & Recomendações por Tasso Vasconcelos</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Seleção discreta de produtos testados em tecnologia, leitura corporativa, insumos para causa animal (TenPets) e utilitários de viagem.
            </p>
          </div>

          {/* Quick CTA Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenLink(MELI_LIST_URL, 'Mercado Livre')}
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-yellow-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-900 fill-current" />
              <span>Ver Lista Mercado Livre</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleOpenLink(AMAZON_SHOP_URL, 'Amazon')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold px-3 py-2 rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>Loja Amazon</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Filter Filter Tabs */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActivePlatform('TODOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activePlatform === 'TODOS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos os Selecionados
            </button>
            <button
              onClick={() => setActivePlatform('MERCADO_LIVRE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activePlatform === 'MERCADO_LIVRE'
                  ? 'bg-yellow-400 text-slate-950 font-extrabold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mercado Livre (Destaque)
            </button>
            <button
              onClick={() => setActivePlatform('AMAZON')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activePlatform === 'AMAZON'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Amazon
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Links verificados e atualizados semanalmente
          </span>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => handleOpenLink(item.link, item.platform)}
              className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-2.5 transition-all cursor-pointer flex flex-col justify-between hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="relative h-28 bg-white rounded-lg overflow-hidden border border-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className={`absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase tracking-tight ${
                    item.platform === 'Mercado Livre'
                      ? 'bg-yellow-400 text-slate-950'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {item.badge || item.platform}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors">
                    {item.title}
                  </h4>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    {item.price}
                  </span>
                </div>
                <div className="w-5 h-5 rounded-md bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-all">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Discreet Bottom Bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">
              Confira a lista completa no Mercado Livre em <strong>meli.la/1kXwMJQ</strong> ou a loja Amazon em <strong>amazon.com.br/shop/tassovasconcelos</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] shrink-0 font-medium">
            <a
              href={MELI_LIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-700 hover:text-yellow-800 font-extrabold flex items-center gap-0.5 underline"
            >
              <span>Abrir Mercado Livre</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">•</span>
            <a
              href={AMAZON_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-0.5 underline"
            >
              <span>Abrir Amazon</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
