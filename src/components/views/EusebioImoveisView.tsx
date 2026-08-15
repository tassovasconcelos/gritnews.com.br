import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Home, 
  MapPin, 
  BedDouble, 
  Bath, 
  Car, 
  Maximize2, 
  Search, 
  Filter, 
  PlusCircle, 
  Share2, 
  MessageCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Calculator, 
  ArrowUpRight, 
  Phone, 
  UserCheck, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  Award, 
  Check, 
  Copy, 
  Tag, 
  Compass, 
  Info,
  DollarSign
} from 'lucide-react';
import { EusebioProperty, PropertyPurpose, PropertyType } from '../../types';
import { getEusebioProperties, addEusebioProperty } from '../../lib/storage';
import { EusebioRoiCalculator } from '../tools/EusebioRoiCalculator';

interface EusebioImoveisViewProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
  onNavigateCheckout?: (productId?: string) => void;
}

const NEIGHBORHOODS = [
  'Todos os Bairros',
  'Alphaville Eusébio',
  'Cidade Alpha Ceará',
  'Precabura',
  'Urucunema',
  'Centro',
  'Coaçu',
  'Tamatanduba',
  'Autódromo',
  'Mangabeira'
];

const PROPERTY_TYPES: { label: string; value: string }[] = [
  { label: 'Todos os Tipos', value: 'all' },
  { label: 'Casas em Condomínio', value: 'casa_condominio' },
  { label: 'Apartamentos', value: 'apartamento' },
  { label: 'Lotes e Terrenos', value: 'lote_terreno' },
  { label: 'Comercial & Salas', value: 'comercial' }
];

export const EusebioImoveisView: React.FC<EusebioImoveisViewProps> = ({ 
  onShowToast,
  onNavigateCheckout
}) => {
  const [properties, setProperties] = useState<EusebioProperty[]>(getEusebioProperties());
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<'all' | PropertyPurpose>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('Todos os Bairros');
  const [priceRange, setPriceRange] = useState<'all' | 'under500k' | '500k-1m' | '1m-2m' | 'above2m'>('all');
  const [bedroomsFilter, setBedroomsFilter] = useState<'all' | '1' | '2' | '3' | '4+'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'area_desc'>('recent');

  // Modals State
  const [selectedProperty, setSelectedProperty] = useState<EusebioProperty | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [linkCopiedId, setLinkCopiedId] = useState<string | null>(null);

  // Financing Simulator State in Modal
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanYears, setLoanYears] = useState(30);
  const [interestRate, setInterestRate] = useState(9.99); // % a.a.

  // New Property Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'casa_condominio' as PropertyType,
    purpose: 'venda' as PropertyPurpose,
    price: '',
    condoFee: '',
    iptu: '',
    neighborhood: 'Alphaville Eusébio',
    address: '',
    bedrooms: '3',
    suites: '3',
    bathrooms: '4',
    garageSpots: '2',
    areaTotal: '250',
    areaPrivate: '200',
    description: '',
    highlights: 'Pé direito duplo, Energia solar, Piscina privativa, Varanda gourmet, Portaria 24h',
    images: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    realtorName: '',
    realtorCreci: '',
    realtorAgency: '',
    realtorPhone: '',
    realtorEmail: ''
  });

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = prop.title.toLowerCase().includes(term);
        const matchesDesc = prop.description.toLowerCase().includes(term);
        const matchesNeigh = prop.neighborhood.toLowerCase().includes(term);
        const matchesHighlights = prop.highlights.some(h => h.toLowerCase().includes(term));
        if (!matchesTitle && !matchesDesc && !matchesNeigh && !matchesHighlights) return false;
      }

      // Purpose
      if (purposeFilter !== 'all' && prop.purpose !== purposeFilter) return false;

      // Type
      if (typeFilter !== 'all' && prop.type !== typeFilter) return false;

      // Neighborhood
      if (neighborhoodFilter !== 'Todos os Bairros' && prop.neighborhood !== neighborhoodFilter) return false;

      // Bedrooms
      if (bedroomsFilter !== 'all') {
        if (bedroomsFilter === '4+' && prop.bedrooms < 4) return false;
        if (bedroomsFilter !== '4+' && prop.bedrooms !== parseInt(bedroomsFilter)) return false;
      }

      // Price Range
      if (priceRange !== 'all') {
        if (priceRange === 'under500k' && prop.price > 500000) return false;
        if (priceRange === '500k-1m' && (prop.price < 500000 || prop.price > 1000000)) return false;
        if (priceRange === '1m-2m' && (prop.price < 1000000 || prop.price > 2000000)) return false;
        if (priceRange === 'above2m' && prop.price < 2000000) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'area_desc') return b.areaTotal - a.areaTotal;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [properties, searchTerm, purposeFilter, typeFilter, neighborhoodFilter, priceRange, bedroomsFilter, sortBy]);

  const handleShareProperty = (property: EusebioProperty, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/?view=imoveis&id=${property.id}`;
    const shareText = `Confira este imóvel no Eusébio publicado no GRIT NEWS: ${property.title} por ${formatCurrency(property.price)} (${property.neighborhood}). Link: ${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        copyToClipboard(shareUrl, property.id);
      });
    } else {
      copyToClipboard(shareUrl, property.id);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopiedId(id);
    onShowToast('Link do imóvel copiado com sucesso!', 'success');
    setTimeout(() => setLinkCopiedId(null), 3000);
  };

  const openWhatsAppContact = (property: EusebioProperty, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanPhone = property.realtor.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${property.realtor.name}! Vi seu anúncio no *GRIT NEWS Imóveis*: "${property.title}" (${property.neighborhood}, ${formatCurrency(property.price)}). Gostaria de mais informações e agendar uma visita!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.realtorName || !formData.realtorPhone) {
      onShowToast('Por favor, preencha os campos obrigatórios (Título, Preço, Corretor e WhatsApp).', 'info');
      return;
    }

    const priceNum = parseFloat(formData.price.replace(/\D/g, '')) || 0;
    const condoNum = parseFloat(formData.condoFee.replace(/\D/g, '')) || undefined;
    const iptuNum = parseFloat(formData.iptu.replace(/\D/g, '')) || undefined;

    const highlightsList = formData.highlights
      .split(',')
      .map(h => h.trim())
      .filter(Boolean);

    const imagesList = formData.images
      .split('\n')
      .map(img => img.trim())
      .filter(Boolean);

    const newProp: EusebioProperty = {
      id: `prop-${Date.now()}`,
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: formData.type,
      purpose: formData.purpose,
      price: priceNum,
      condoFee: condoNum,
      iptu: iptuNum,
      neighborhood: formData.neighborhood,
      address: formData.address || undefined,
      bedrooms: parseInt(formData.bedrooms) || 0,
      suites: parseInt(formData.suites) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      garageSpots: parseInt(formData.garageSpots) || 0,
      areaTotal: parseFloat(formData.areaTotal) || 0,
      areaPrivate: parseFloat(formData.areaPrivate) || undefined,
      description: formData.description || 'Excelente oportunidade no Eusébio com alto padrão construtivo e excelente localização.',
      highlights: highlightsList.length > 0 ? highlightsList : ['Excelente localização', 'Segurança 24h'],
      images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200'],
      featured: true,
      verified: true,
      realtor: {
        name: formData.realtorName,
        creci: formData.realtorCreci || 'CRECI Sob Consulta',
        agency: formData.realtorAgency || 'Corretor Autônomo',
        phone: formData.realtorPhone.replace(/\D/g, ''),
        email: formData.realtorEmail || undefined,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
      },
      createdAt: new Date().toISOString().split('T')[0],
      viewsCount: 1
    };

    addEusebioProperty(newProp);
    setProperties(getEusebioProperties());
    setIsPublishModalOpen(false);
    onShowToast('Imóvel publicado com sucesso no GRIT NEWS! Já está disponível para todos os leitores.', 'success');
  };

  // Financing Calculation
  const calculatedLoan = useMemo(() => {
    if (!selectedProperty) return null;
    const price = selectedProperty.price;
    const downPayment = (price * downPaymentPercent) / 100;
    const loanAmount = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanYears * 12;

    // Price formula: P = L * [i(1+i)^n] / [(1+i)^n - 1]
    const monthlyInstallment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);

    return {
      downPayment,
      loanAmount,
      monthlyInstallment: Math.round(monthlyInstallment)
    };
  }, [selectedProperty, downPaymentPercent, loanYears, interestRate]);

  function formatCurrency(val: number) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }

  function getTypeLabel(type: PropertyType) {
    switch (type) {
      case 'casa_condominio': return 'Casa em Condomínio';
      case 'apartamento': return 'Apartamento';
      case 'lote_terreno': return 'Lote / Terreno';
      case 'comercial': return 'Comercial & Salas';
      case 'cobertura': return 'Cobertura';
      default: return 'Imóvel';
    }
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Top Banner / Hero */}
      <section className="bg-[#0D182A] text-white relative overflow-hidden border-b border-[#1E293B]">
        {/* Background glow & mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D182A] via-[#132238] to-[#0A1424] opacity-95"></div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#146EF5] opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-[#FF8A00] opacity-10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-[#FF8A00] border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mercado Imobiliário de Alta Performance • Região do Eusébio</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Imóveis no Eusébio: Casas em Condomínio, Lotes & Oportunidades
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Mapeamento completo dos condomínios mais cobiçados do Ceará (Alphaville, Cidade Alpha, Precabura, Urucunema). Conecte-se diretamente com os melhores corretores e construtoras credenciadas.
              </p>
            </div>

            {/* Action Card */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => {
                  const target = document.getElementById('roi-calculator-section');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Simulador de ROI & Yield</span>
              </button>
              {onNavigateCheckout && (
                <button
                  onClick={() => onNavigateCheckout('prod-destaque-eusebio-imoveis')}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Destaque Topo (R$ 149)</span>
                </button>
              )}
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF8A00] hover:bg-[#E67A00] text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Anunciar Imóvel Grátis</span>
              </button>
              <button
                onClick={() => {
                  const target = document.getElementById('market-editorial-section');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/15 transition-all text-sm cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Panorama Eusébio 2026</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 font-medium">Valorização Média 24m</p>
              <p className="text-lg md:text-xl font-bold text-white mt-0.5">+28.4% a.a.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 font-medium">Imóveis Catalogados</p>
              <p className="text-lg md:text-xl font-bold text-white mt-0.5">{properties.length} Opções Ativas</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 font-medium">Segurança & Condomínios</p>
              <p className="text-lg md:text-xl font-bold text-white mt-0.5">Top 1 RMF</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 font-medium">Taxa de Anúncio</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400 mt-0.5">100% Gratuita</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Search Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-20">
        {/* Search & Filter Bar Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xl border border-[#E2E8F0] space-y-4">
          {/* Row 1: Search and Purpose Tabs */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Purpose Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                onClick={() => setPurposeFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  purposeFilter === 'all'
                    ? 'bg-white text-[#0D182A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPurposeFilter('venda')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  purposeFilter === 'venda'
                    ? 'bg-[#146EF5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Comprar
              </button>
              <button
                onClick={() => setPurposeFilter('locacao')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  purposeFilter === 'locacao'
                    ? 'bg-[#146EF5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alugar
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Alphaville, piscina, energia solar, condomínio..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#146EF5] focus:bg-white transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Row 2: Deep Filters (Type, Neighborhood, Price, Bedrooms, Sort) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Type */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Tipo de Imóvel</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#146EF5] text-slate-700 font-medium"
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Neighborhood */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Bairro / Região</label>
              <select
                value={neighborhoodFilter}
                onChange={e => setNeighborhoodFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#146EF5] text-slate-700 font-medium"
              >
                {NEIGHBORHOODS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Faixa de Preço</label>
              <select
                value={priceRange}
                onChange={e => setPriceRange(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#146EF5] text-slate-700 font-medium"
              >
                <option value="all">Qualquer Valor</option>
                <option value="under500k">Até R$ 500 mil</option>
                <option value="500k-1m">R$ 500 mil a R$ 1 milhão</option>
                <option value="1m-2m">R$ 1 milhão a R$ 2 milhões</option>
                <option value="above2m">Acima de R$ 2 milhões</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Quartos Mínimos</label>
              <select
                value={bedroomsFilter}
                onChange={e => setBedroomsFilter(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#146EF5] text-slate-700 font-medium"
              >
                <option value="all">Qualquer quantidade</option>
                <option value="1">1+ Quarto</option>
                <option value="2">2+ Quartos</option>
                <option value="3">3+ Quartos</option>
                <option value="4+">4+ Quartos</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Ordenar por</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#146EF5] text-slate-700 font-medium"
              >
                <option value="recent">Mais Recentes</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="area_desc">Maior Metragem</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mt-8 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#0D182A]">
              Imóveis em Destaque no Eusébio
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Exibindo <span className="font-bold text-[#0D182A]">{filteredProperties.length}</span> imóveis encontrados
            </p>
          </div>

          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-[#146EF5] bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Imóvel Grátis</span>
          </button>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Nenhum imóvel encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Tente ajustar os filtros de busca ou cadastre um novo imóvel nesta região.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setPurposeFilter('all');
                setTypeFilter('all');
                setNeighborhoodFilter('Todos os Bairros');
                setPriceRange('all');
                setBedroomsFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <div
                key={property.id}
                onClick={() => {
                  setSelectedProperty(property);
                  setActiveImageIndex(0);
                }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer flex flex-col"
              >
                {/* Image & Badges */}
                <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider text-white shadow-xs ${
                      property.purpose === 'venda' ? 'bg-[#146EF5]' : 'bg-[#0D182A]'
                    }`}>
                      {property.purpose === 'venda' ? 'Venda' : 'Aluguel'}
                    </span>
                    {property.featured && (
                      <span className="px-2.5 py-1 bg-[#FF8A00] text-white rounded-md text-[11px] font-bold shadow-xs">
                        Destaque
                      </span>
                    )}
                  </div>

                  {/* Share Quick Button */}
                  <button
                    onClick={(e) => handleShareProperty(property, e)}
                    title="Compartilhar imóvel"
                    className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full backdrop-blur-md transition-transform hover:scale-110 shadow-md"
                  >
                    {linkCopiedId === property.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>

                  {/* Neighborhood on Bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="inline-flex items-center gap-1 font-medium drop-shadow-md">
                      <MapPin className="w-3.5 h-3.5 text-[#FF8A00]" />
                      {property.neighborhood}
                    </span>
                    <span className="text-[11px] bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-xs font-mono">
                      {getTypeLabel(property.type)}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Price */}
                    <div className="flex items-baseline justify-between">
                      <p className="text-2xl font-black text-[#0D182A] tracking-tight">
                        {formatCurrency(property.price)}
                        {property.purpose === 'locacao' && <span className="text-xs font-normal text-slate-500"> /mês</span>}
                      </p>
                      {property.condoFee && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Cond.: {formatCurrency(property.condoFee)}
                        </p>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 mt-1.5 leading-snug group-hover:text-[#146EF5] transition-colors">
                      {property.title}
                    </h3>

                    {/* Features Badges */}
                    <div className="grid grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-100 text-slate-600 text-xs">
                      {property.bedrooms > 0 && (
                        <div className="flex flex-col items-center p-1.5 bg-slate-50 rounded-lg">
                          <BedDouble className="w-4 h-4 text-slate-400 mb-0.5" />
                          <span className="font-bold text-[11px]">{property.bedrooms} Qts</span>
                        </div>
                      )}
                      {property.suites > 0 && (
                        <div className="flex flex-col items-center p-1.5 bg-slate-50 rounded-lg">
                          <Bath className="w-4 h-4 text-slate-400 mb-0.5" />
                          <span className="font-bold text-[11px]">{property.suites} Suítes</span>
                        </div>
                      )}
                      {property.garageSpots > 0 && (
                        <div className="flex flex-col items-center p-1.5 bg-slate-50 rounded-lg">
                          <Car className="w-4 h-4 text-slate-400 mb-0.5" />
                          <span className="font-bold text-[11px]">{property.garageSpots} Vagas</span>
                        </div>
                      )}
                      <div className="flex flex-col items-center p-1.5 bg-slate-50 rounded-lg">
                        <Maximize2 className="w-4 h-4 text-slate-400 mb-0.5" />
                        <span className="font-bold text-[11px]">{property.areaTotal} m²</span>
                      </div>
                    </div>
                  </div>

                  {/* Realtor Footer & WhatsApp CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img
                        src={property.realtor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                        alt={property.realtor.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div className="truncate text-left">
                        <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                          {property.realtor.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {property.realtor.creci}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => openWhatsAppContact(property, e)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive ROI & Yield Calculator Section */}
        <section id="roi-calculator-section" className="mt-16">
          <EusebioRoiCalculator onShowToast={onShowToast} />
        </section>

        {/* Editorial Section: Por que investir no Eusébio */}
        <section id="market-editorial-section" className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#146EF5] rounded-full text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Inteligência de Mercado • GRIT NEWS Special Report</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-[#0D182A] tracking-tight">
              O Boom Imobiliário do Eusébio: O Novo Eixo de Riqueza e Qualidade de Vida do Ceará
            </h2>

            <div className="prose prose-slate max-w-none text-slate-600 text-sm md:text-base leading-relaxed space-y-4">
              <p>
                Nos últimos anos, o município do <strong>Eusébio</strong> consolidou-se como o destino preferido para famílias de média e alta renda que buscam fugir da verticalização e do trânsito de Fortaleza, priorizando segurança armada 24h, amplos espaços ao ar livre e infraestrutura completa.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 not-prose">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-[#0D182A] text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#146EF5]" />
                    Segurança e Privacidade
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mais de 80 condomínios fechados horizontais com controle biométrico e monitoramento por câmeras inteligentes.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-[#0D182A] text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                    Polo Tecnológico & Fiocruz
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Hub de biotecnologia, saúde avançada e expansão de colégios de ponta como Farias Brito e Santa Cecília.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-[#0D182A] text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Valorização Líquida
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Liquidez acelerada tanto para revenda quanto para locação residencial corporativa e temporária.
                  </p>
                </div>
              </div>

              <p>
                Seja nos empreendimentos consolidados do <strong>Alphaville Eusébio</strong> e da <strong>Cidade Alpha Ceará</strong>, ou nas novas frentes ecológicas na <strong>Precabura</strong> e <strong>Urucunema</strong>, investir no Eusébio significa garantir patrimônio sólido com padrão construtivo impecável.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative my-8">
            {/* Close Button */}
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Gallery Section */}
            <div className="relative aspect-16/9 bg-slate-900">
              <img
                src={selectedProperty.images[activeImageIndex] || selectedProperty.images[0]}
                alt={selectedProperty.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

              {/* Prev / Next Image */}
              {selectedProperty.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? selectedProperty.images.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-lg transition-transform"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === selectedProperty.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-lg transition-transform"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges on Modal Image */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  <span className="px-2.5 py-1 bg-[#FF8A00] text-white rounded-md text-xs font-bold uppercase mr-2">
                    {selectedProperty.purpose === 'venda' ? 'Venda' : 'Locação'}
                  </span>
                  <span className="text-sm font-semibold">{selectedProperty.neighborhood}</span>
                </div>
                <div className="text-xs bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                  Foto {activeImageIndex + 1} de {selectedProperty.images.length}
                </div>
              </div>
            </div>

            {/* Thumbnails Row */}
            {selectedProperty.images.length > 1 && (
              <div className="p-3 bg-slate-100 flex gap-2 overflow-x-auto border-b border-slate-200">
                {selectedProperty.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-[#146EF5] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumb" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#146EF5]">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedProperty.address || selectedProperty.neighborhood + ', Eusébio - CE'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0D182A] leading-snug">
                    {selectedProperty.title}
                  </h2>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <p className="text-3xl font-black text-[#0D182A]">
                    {formatCurrency(selectedProperty.price)}
                    {selectedProperty.purpose === 'locacao' && <span className="text-sm font-normal text-slate-500"> /mês</span>}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 md:justify-end">
                    {selectedProperty.condoFee && <span>Condomínio: {formatCurrency(selectedProperty.condoFee)}</span>}
                    {selectedProperty.iptu && <span>IPTU: {formatCurrency(selectedProperty.iptu)}/mês</span>}
                  </div>
                </div>
              </div>

              {/* Specs Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <BedDouble className="w-5 h-5 text-[#146EF5]" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Quartos</p>
                    <p className="font-bold text-slate-800 text-sm">{selectedProperty.bedrooms} Quartos ({selectedProperty.suites} suítes)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-5 h-5 text-[#146EF5]" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Banheiros</p>
                    <p className="font-bold text-slate-800 text-sm">{selectedProperty.bathrooms} Banheiros</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-[#146EF5]" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Garagem</p>
                    <p className="font-bold text-slate-800 text-sm">{selectedProperty.garageSpots} Vagas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Maximize2 className="w-5 h-5 text-[#146EF5]" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Área</p>
                    <p className="font-bold text-slate-800 text-sm">{selectedProperty.areaTotal} m² Total</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#0D182A]">Sobre este Imóvel</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedProperty.description}
                </p>
              </div>

              {/* Highlights & Features */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#0D182A]">Diferenciais e Infraestrutura</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.highlights.map((h, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#146EF5] rounded-xl text-xs font-semibold border border-blue-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Financing Simulator (If for sale) */}
              {selectedProperty.purpose === 'venda' && calculatedLoan && (
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-[#FF8A00]" />
                      <h4 className="font-bold text-sm text-white">Simulação Estimada de Financiamento Habitacional</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Tabela SAC / Price</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <p className="text-xs text-slate-300">Entrada Recomendada ({downPaymentPercent}%)</p>
                      <p className="text-lg font-bold text-[#FF8A00] mt-0.5">{formatCurrency(calculatedLoan.downPayment)}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl">
                      <p className="text-xs text-slate-300">Valor Financiado</p>
                      <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(calculatedLoan.loanAmount)}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl">
                      <p className="text-xs text-slate-300">Parcela Inicial Estimada</p>
                      <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(calculatedLoan.monthlyInstallment)}/mês</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    *Valores estimativos sujeitos a análise de crédito bancária (Caixa, Itaú, Bradesco, Santander). Consulte o corretor responsável para proposta detalhada.
                  </p>
                </div>
              )}

              {/* Realtor Contact Section */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedProperty.realtor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={selectedProperty.realtor.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#146EF5]"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{selectedProperty.realtor.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{selectedProperty.realtor.agency} • {selectedProperty.realtor.creci}</p>
                    <p className="text-xs text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Corretor Credenciado Eusébio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleShareProperty(selectedProperty)}
                    className="p-3 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-xs"
                    title="Compartilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openWhatsAppContact(selectedProperty)}
                    className="flex-1 sm:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm inline-flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar no WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Property Modal (Corretores & Proprietários) */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative my-8">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#FF8A00]" />
                <h3 className="text-lg font-bold text-[#0D182A]">Anunciar Imóvel Grátis no Eusébio</h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="p-6 space-y-5 text-xs sm:text-sm">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                <strong>Anúncio 100% Gratuito:</strong> Divulgue seu imóvel para milhares de investidores e compradores qualificados que acessam o GRIT NEWS diariamente.
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Anúncio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mansão 4 Suítes no Alphaville com Piscina e Energia Solar"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#146EF5] focus:bg-white text-slate-800 font-medium"
                />
              </div>

              {/* Purpose & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Finalidade *</label>
                  <select
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="venda">Venda</option>
                    <option value="locacao">Locação (Aluguel)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo de Imóvel *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="casa_condominio">Casa em Condomínio</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="lote_terreno">Lote / Terreno</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>
              </div>

              {/* Neighborhood & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bairro no Eusébio *</label>
                  <select
                    value={formData.neighborhood}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {NEIGHBORHOODS.filter(n => n !== 'Todos os Bairros').map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Endereço / Condomínio</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Alphaville 100"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Price, Condo, IPTU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1450000"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Taxa Condomínio (R$)</label>
                  <input
                    type="text"
                    placeholder="Ex: 750"
                    value={formData.condoFee}
                    onChange={e => setFormData({ ...formData, condoFee: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">IPTU Mensal (R$)</label>
                  <input
                    type="text"
                    placeholder="Ex: 180"
                    value={formData.iptu}
                    onChange={e => setFormData({ ...formData, iptu: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Specs (Bedrooms, Suites, Bathrooms, Garages, Areas) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-xs">Quartos</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={e => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-xs">Suítes</label>
                  <input
                    type="number"
                    value={formData.suites}
                    onChange={e => setFormData({ ...formData, suites: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-xs">Banheiros</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={e => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-xs">Vagas</label>
                  <input
                    type="number"
                    value={formData.garageSpots}
                    onChange={e => setFormData({ ...formData, garageSpots: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-xs">Área (m²)</label>
                  <input
                    type="number"
                    value={formData.areaTotal}
                    onChange={e => setFormData({ ...formData, areaTotal: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Descrição do Imóvel</label>
                <textarea
                  rows={3}
                  placeholder="Detalhe o acabamento, distribuição dos cômodos, posição solar, etc."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                ></textarea>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Diferenciais (separados por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: Pé direito duplo, Energia solar, Piscina privativa, Varanda gourmet"
                  value={formData.highlights}
                  onChange={e => setFormData({ ...formData, highlights: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Images URL */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Links das Fotos (uma URL por linha)</label>
                <textarea
                  rows={2}
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.images}
                  onChange={e => setFormData({ ...formData, images: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                ></textarea>
              </div>

              {/* Realtor Info */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="font-bold text-[#0D182A] text-sm">Dados do Corretor / Imobiliária</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nome do Corretor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Albuquerque"
                      value={formData.realtorName}
                      onChange={e => setFormData({ ...formData, realtorName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CRECI</label>
                    <input
                      type="text"
                      placeholder="Ex: 14.890-F"
                      value={formData.realtorCreci}
                      onChange={e => setFormData({ ...formData, realtorCreci: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Imobiliária / Construtora</label>
                    <input
                      type="text"
                      placeholder="Ex: Albuquerque Prime Imóveis"
                      value={formData.realtorAgency}
                      onChange={e => setFormData({ ...formData, realtorAgency: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">WhatsApp com DDD *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 85991823344"
                      value={formData.realtorPhone}
                      onChange={e => setFormData({ ...formData, realtorPhone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF8A00] hover:bg-[#E67A00] text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Publicar Imóvel Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
