import React, { useState } from 'react';
import { ShoppingBag, ExternalLink, Star, ShieldCheck, Sparkles, Search, CheckCircle2, ArrowUpRight, BookOpen, Laptop, PawPrint, Plane } from 'lucide-react';

interface AmazonProduct {
  id: string;
  title: string;
  category: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviewsCount: string;
  image: string;
  description: string;
  badge?: string;
  isPrime: boolean;
  shopUrl: string;
}

const AMAZON_PRODUCTS: AmazonProduct[] = [
  {
    id: 'amz-kindle-paperwhite',
    title: 'Kindle Paperwhite 16GB - Tela 6,8” com Luz Quente Ajustável',
    category: 'Tecnologia & Leitura',
    price: 'R$ 799,00',
    originalPrice: 'R$ 849,00',
    rating: 4.9,
    reviewsCount: '12.400+',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    description: 'O e-reader indispensável para leitura de livros de negócios, economia e liderança sem distração e com semanas de bateria.',
    badge: 'ESCOLHA DO TASSO',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  },
  {
    id: 'amz-livro-psicologia-financeira',
    title: 'Livro: A Psicologia Financeira - Morgan Housel',
    category: 'Livros de Negócios',
    price: 'R$ 42,90',
    originalPrice: 'R$ 59,90',
    rating: 4.9,
    reviewsCount: '28.900+',
    image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&q=80&w=600',
    description: 'Lições atemporais sobre riqueza, investimentos e tomada de decisão racional. Leitura recomendada no portal GRIT NEWS.',
    badge: 'BESTSELLER',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  },
  {
    id: 'amz-fone-sony-xm5',
    title: 'Fone de Ouvido Sony WH-1000XM5 com Cancelamento de Ruído',
    category: 'Tecnologia & Produtividade',
    price: 'R$ 2.499,00',
    originalPrice: 'R$ 2.799,00',
    rating: 4.8,
    reviewsCount: '8.100+',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    description: 'Isolamento acústico de elite para reuniões executivas, foco profundo no trabalho e viagens de avião com conforto impecável.',
    badge: 'PREMIUM',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  },
  {
    id: 'amz-fonte-inox-tenpets',
    title: 'Fonte de Água Automática Inox para Cães e Gatos (TenPets)',
    category: 'Linha TenPets',
    price: 'R$ 189,90',
    originalPrice: 'R$ 239,00',
    rating: 4.9,
    reviewsCount: '3.500+',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
    description: 'Sistema de filtragem quádrupla e aço inoxidável higiênico. Recomendado pelo projeto TenPets para hidratação constante.',
    badge: 'APOIO RECOMENDADO',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  },
  {
    id: 'amz-apple-airtag-4pack',
    title: 'Apple AirTag - Kit com 4 Unidades para Rastreamento de Bagagem',
    category: 'Viagens & Aviação',
    price: 'R$ 1.099,00',
    originalPrice: 'R$ 1.249,00',
    rating: 4.9,
    reviewsCount: '15.200+',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600',
    description: 'Localize malas despachadas, mochilas executivas e veículos em tempo real no aplicativo Buscar com alcance global.',
    badge: 'ESSENCIAL VIAGENS',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  },
  {
    id: 'amz-livro-de-zero-a-um',
    title: 'Livro: De Zero a Um - Peter Thiel (O Futuro das Startups)',
    category: 'Livros de Negócios',
    price: 'R$ 39,90',
    originalPrice: 'R$ 54,90',
    rating: 4.8,
    reviewsCount: '19.400+',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    description: 'Insights práticos sobre inovação tecnológica, construção de negócios escaláveis e monopólios criativos no mercado global.',
    badge: 'LEITURA B2B',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  },
  {
    id: 'amz-alimentador-wifi-tenpets',
    title: 'Alimentador Inteligente Wi-Fi com Câmera HD (Linha TenPets)',
    category: 'Linha TenPets',
    price: 'R$ 459,00',
    originalPrice: 'R$ 520,00',
    rating: 4.8,
    reviewsCount: '2.100+',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=600',
    description: 'Programe horários de alimentação, monitore o animal ao vivo em alta definição e converse por voz à distância.',
    badge: 'TECNOLOGIA PET',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  },
  {
    id: 'amz-mochila-anti-furto-executiva',
    title: 'Mochila Executiva Anti-Furto Impermeável com Porta USB',
    category: 'Viagens & Aviação',
    price: 'R$ 229,00',
    originalPrice: 'R$ 299,00',
    rating: 4.7,
    reviewsCount: '6.400+',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
    description: 'Design ergônomico, trava de segurança com segredo e compartimento acolchoado para notebook até 17 polegadas.',
    badge: 'VIAGENS VIP',
    isPrime: true,
    shopUrl: 'https://www.amazon.com.br/shop/tassovasconcelos'
  }
];

interface AmazonShopSectionProps {
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AmazonShopSection: React.FC<AmazonShopSectionProps> = ({ onShowToast }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['Todos', 'Tecnologia & Leitura', 'Livros de Negócios', 'Linha TenPets', 'Viagens & Aviação'];

  const filteredProducts = AMAZON_PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAmazonShop = (productTitle?: string) => {
    if (onShowToast) {
      onShowToast(`Redirecionando para a loja oficial de Tasso Vasconcelos na Amazon!`, 'info');
    }
    window.open('https://www.amazon.com.br/shop/tassovasconcelos', '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="amazon-shop-tasso" className="bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] py-12 px-4 sm:px-6 rounded-3xl text-white my-8 shadow-2xl border border-amber-500/30 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Amazon Storefront Oficial</span>
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase">
                Verificado
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Achados & Recomendações na Amazon por Tasso Vasconcelos</span>
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Curadoria exclusiva de gadgets tecnológicos, e-readers, livros essenciais de negócios, equipamentos para saúde animal (TenPets) e itens de viagem selecionados pessoalmente por <strong>Tasso Vasconcelos</strong>.
            </p>
          </div>

          {/* Primary Storefront Link CTA */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleOpenAmazonShop()}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 fill-current" />
              <span>Acessar Loja Completa na Amazon</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold scale-102'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {cat === 'Tecnologia & Leitura' && <Laptop className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />}
                  {cat === 'Livros de Negócios' && <BookOpen className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />}
                  {cat === 'Linha TenPets' && <PawPrint className="w-3.5 h-3.5 inline mr-1.5 text-rose-400" />}
                  {cat === 'Viagens & Aviação' && <Plane className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative md:w-64">
            <input
              type="text"
              placeholder="Buscar recomendado..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group bg-slate-900/80 border border-slate-800 hover:border-amber-500/80 rounded-2xl overflow-hidden hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image Container */}
                <div className="relative h-48 bg-slate-800 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-md shadow-md uppercase tracking-wide">
                        {product.badge}
                      </span>
                    </div>
                  )}
                  {product.isPrime && (
                    <div className="absolute top-2.5 right-2.5 bg-sky-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded shadow-md uppercase">
                      prime
                    </div>
                  )}
                </div>

                {/* Product Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-amber-400">{product.category}</span>
                    <div className="flex items-center gap-1 text-amber-300 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                      <span className="text-[10px] text-slate-500">({product.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-white line-clamp-2 group-hover:text-amber-300 transition-colors leading-snug">
                    {product.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 font-light leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80 mt-2">
                <div className="flex items-baseline justify-between pt-2">
                  <div>
                    {product.originalPrice && (
                      <span className="text-[10px] text-slate-400 line-through mr-1.5">
                        {product.originalPrice}
                      </span>
                    )}
                    <span className="text-base font-black text-amber-400">
                      {product.price}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Loja Amazon</span>
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAmazonShop(product.title)}
                  className="w-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-amber-400 cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Comprar na Amazon</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Disclaimer & Storefront Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-200 text-xs">
                Loja Oficial de Recomendações no Brasil
              </p>
              <p className="text-[11px] text-slate-400">
                Acesse a vitrine completa no endereço <strong>amazon.com.br/shop/tassovasconcelos</strong> e garanta descontos e entregas garantidas pela Amazon Prime.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenAmazonShop()}
            className="text-amber-400 hover:text-amber-300 font-extrabold text-xs underline underline-offset-4 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Ver todos os itens na Amazon</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
