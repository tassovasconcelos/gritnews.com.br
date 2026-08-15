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
  DollarSign,
  Globe,
  ExternalLink,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  Newspaper,
  BookOpen,
  Landmark,
  Scale,
  Percent,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EusebioProperty, PropertyPurpose, PropertyType, PropertyPortalSource, PropertyVerificationBadge } from '../../types';
import { getEusebioProperties, addEusebioProperty } from '../../lib/storage';
import { EusebioRoiCalculator } from '../tools/EusebioRoiCalculator';
import { 
  PORTAL_BENCHMARKS, 
  NEIGHBORHOOD_METRICS, 
  REAL_ESTATE_NEWS, 
  FRAUD_PREVENTION_RULES,
  RealEstateNewsItem
} from '../../data/eusebioRealEstateData';

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
  'Pires Façanha',
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
  
  // Navigation Tabs: 'properties' | 'portals' | 'security' | 'news' | 'roi'
  const [activeTab, setActiveTab] = useState<'properties' | 'portals' | 'security' | 'news' | 'roi'>('properties');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [portalFilter, setPortalFilter] = useState<'all' | PropertyPortalSource>('all');
  const [purposeFilter, setPurposeFilter] = useState<'all' | PropertyPurpose>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('Todos os Bairros');
  const [priceRange, setPriceRange] = useState<'all' | 'under500k' | '500k-1m' | '1m-2m' | 'above2m'>('all');
  const [bedroomsFilter, setBedroomsFilter] = useState<'all' | '1' | '2' | '3' | '4+'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'area_desc' | 'm2_asc'>('recent');

  // Modals & Selected items
  const [selectedProperty, setSelectedProperty] = useState<EusebioProperty | null>(null);
  const [selectedNews, setSelectedNews] = useState<RealEstateNewsItem | null>(null);
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
    condominiumName: '',
    address: '',
    bedrooms: '3',
    suites: '3',
    bathrooms: '4',
    garageSpots: '2',
    areaTotal: '250',
    areaPrivate: '200',
    portalSource: 'zap_imoveis' as PropertyPortalSource,
    verificationBadge: 'CRECI_AUDITADO' as PropertyVerificationBadge,
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
        const matchesCondo = prop.condominiumName ? prop.condominiumName.toLowerCase().includes(term) : false;
        const matchesHighlights = prop.highlights.some(h => h.toLowerCase().includes(term));
        if (!matchesTitle && !matchesDesc && !matchesNeigh && !matchesCondo && !matchesHighlights) return false;
      }

      // Portal source filter
      if (portalFilter !== 'all') {
        if (prop.portalSource !== portalFilter) return false;
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
      if (sortBy === 'm2_asc') {
        const m2a = a.price / (a.areaTotal || 1);
        const m2b = b.price / (b.areaTotal || 1);
        return m2a - m2b;
      }
      // 'recent'
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [properties, searchTerm, portalFilter, purposeFilter, typeFilter, neighborhoodFilter, priceRange, bedroomsFilter, sortBy]);

  // Handle WhatsApp
  const handleOpenWhatsApp = (prop: EusebioProperty, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const phoneClean = prop.realtor.phone.replace(/\D/g, '');
    const priceFormatted = prop.purpose === 'locacao' 
      ? `R$ ${prop.price.toLocaleString('pt-BR')}/mês`
      : `R$ ${prop.price.toLocaleString('pt-BR')}`;
    
    const message = encodeURIComponent(
      `Olá ${prop.realtor.name}! Encontrei o anúncio "${prop.title}" (${priceFormatted}) verificado no portal GRIT NEWS Eusébio e gostaria de agendar uma visita e obter a certidão de inteiro teor.`
    );
    window.open(`https://wa.me/${phoneClean}?text=${message}`, '_blank');
    onShowToast('Redirecionando para o WhatsApp do corretor credenciado...', 'success');
  };

  // Copy share link
  const handleCopyLink = (prop: EusebioProperty, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/imoveis?id=${prop.id}`;
    navigator.clipboard.writeText(url);
    setLinkCopiedId(prop.id);
    onShowToast('Link do imóvel copiado com sucesso!', 'success');
    setTimeout(() => setLinkCopiedId(null), 2500);
  };

  // Financing Calculation
  const financingCalculations = useMemo(() => {
    if (!selectedProperty || selectedProperty.purpose === 'locacao') return null;
    const price = selectedProperty.price;
    const downPayment = (price * downPaymentPercent) / 100;
    const loanAmount = price - downPayment;
    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = loanYears * 12;

    // Price formula (Amortização SAC inicial aprox)
    const initialAmortization = loanAmount / totalMonths;
    const initialInterest = loanAmount * monthlyRate;
    const initialInstallment = initialAmortization + initialInterest;

    // Tabela Price aproximada
    const priceInstallment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                             (Math.pow(1 + monthlyRate, totalMonths) - 1);

    return {
      price,
      downPayment,
      loanAmount,
      initialInstallment,
      priceInstallment,
      totalMonths
    };
  }, [selectedProperty, downPaymentPercent, loanYears, interestRate]);

  // Handle Submit Form
  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.realtorName || !formData.realtorPhone) {
      onShowToast('Por favor, preencha todos os campos obrigatórios (*)', 'info');
      return;
    }

    const priceNum = parseFloat(formData.price.replace(/\D/g, '')) || 0;
    const areaNum = parseFloat(formData.areaTotal) || 200;
    const calculatedPricePerM2 = areaNum > 0 ? Math.round(priceNum / areaNum) : undefined;

    const newProperty: EusebioProperty = {
      id: `prop-${Date.now()}`,
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
      type: formData.type,
      purpose: formData.purpose,
      price: priceNum,
      condoFee: formData.condoFee ? parseFloat(formData.condoFee.replace(/\D/g, '')) : undefined,
      iptu: formData.iptu ? parseFloat(formData.iptu.replace(/\D/g, '')) : undefined,
      neighborhood: formData.neighborhood,
      condominiumName: formData.condominiumName || undefined,
      address: formData.address || `${formData.neighborhood}, Eusébio - CE`,
      bedrooms: parseInt(formData.bedrooms) || 0,
      suites: parseInt(formData.suites) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      garageSpots: parseInt(formData.garageSpots) || 0,
      areaTotal: areaNum,
      areaPrivate: formData.areaPrivate ? parseFloat(formData.areaPrivate) : undefined,
      pricePerM2: calculatedPricePerM2,
      description: formData.description || 'Excelente imóvel em localização privilegiada no Eusébio.',
      highlights: formData.highlights.split(',').map(s => s.trim()).filter(Boolean),
      images: formData.images.split('\n').map(s => s.trim()).filter(Boolean),
      featured: true,
      verified: true,
      verificationBadge: formData.verificationBadge,
      portalSource: formData.portalSource,
      sourceUrl: formData.portalSource === 'zap_imoveis' 
        ? 'https://www.zapimoveis.com.br/venda/imoveis/ce+eusebio/' 
        : formData.portalSource === 'viva_real'
        ? 'https://www.vivareal.com.br/venda/ceara/eusebio/'
        : 'https://www.olx.com.br/imoveis/venda/estado-ce/fortaleza-e-regiao/grande-fortaleza/eusebio',
      realtor: {
        name: formData.realtorName,
        creci: formData.realtorCreci || 'CRECI 15ª Região/CE',
        agency: formData.realtorAgency || 'Imobiliária Eusébio',
        phone: formData.realtorPhone,
        email: formData.realtorEmail || undefined,
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
      },
      createdAt: new Date().toISOString().split('T')[0],
      viewsCount: 1
    };

    addEusebioProperty(newProperty);
    setProperties(getEusebioProperties());
    setIsPublishModalOpen(false);
    onShowToast('Imóvel cadastrado e homologado com sucesso no Radar GRIT!', 'success');

    // Reset
    setFormData({
      title: '',
      type: 'casa_condominio',
      purpose: 'venda',
      price: '',
      condoFee: '',
      iptu: '',
      neighborhood: 'Alphaville Eusébio',
      condominiumName: '',
      address: '',
      bedrooms: '3',
      suites: '3',
      bathrooms: '4',
      garageSpots: '2',
      areaTotal: '250',
      areaPrivate: '200',
      portalSource: 'zap_imoveis',
      verificationBadge: 'CRECI_AUDITADO',
      description: '',
      highlights: 'Pé direito duplo, Energia solar, Piscina privativa, Varanda gourmet, Portaria 24h',
      images: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
      realtorName: '',
      realtorCreci: '',
      realtorAgency: '',
      realtorPhone: '',
      realtorEmail: ''
    });
  };

  const getBadgeStyle = (badge?: PropertyVerificationBadge) => {
    switch (badge) {
      case 'MATRICULA_VERIFICADA':
        return { label: 'Matrícula Cartorial Auditada', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' };
      case 'CRECI_AUDITADO':
        return { label: 'Corretor CRECI-CE Ativo', bg: 'bg-blue-500/10 text-blue-700 border-blue-300' };
      case 'DIRETO_COM_CONSTRUTORA':
        return { label: 'Direto com Incorporadora', bg: 'bg-purple-500/10 text-purple-700 border-purple-300' };
      case 'VALOR_CONFIRMADO':
      default:
        return { label: 'Valor e Habite-se Confirmados', bg: 'bg-amber-500/10 text-amber-700 border-amber-300' };
    }
  };

  const getPortalBadge = (portal?: PropertyPortalSource) => {
    switch (portal) {
      case 'zap_imoveis':
        return { label: 'ZAP Imóveis', bg: 'bg-orange-500 text-white', url: 'https://www.zapimoveis.com.br/venda/imoveis/ce+eusebio/' };
      case 'viva_real':
        return { label: 'Viva Real', bg: 'bg-blue-600 text-white', url: 'https://www.vivareal.com.br/venda/ceara/eusebio/' };
      case 'olx':
        return { label: 'OLX Eusébio', bg: 'bg-purple-700 text-white', url: 'https://www.olx.com.br/imoveis/venda/estado-ce/fortaleza-e-regiao/grande-fortaleza/eusebio' };
      default:
        return { label: 'GRIT Exclusivo', bg: 'bg-slate-900 text-white', url: '#' };
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Top Hero Banner */}
      <section className="bg-gradient-to-br from-[#0B2343] via-[#0E2D55] to-[#145EDB] text-white pt-12 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-300 mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Integrador Oficial de Imóveis • Eusébio / Ceará 2026</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Radar Imobiliário Eusébio & Alphaville
              </h1>
              <p className="text-slate-200 text-base sm:text-lg mt-3 leading-relaxed">
                Integração auditada com dados oficiais de <strong>ZAP Imóveis</strong>, <strong>Viva Real</strong> e <strong>OLX</strong>. Monitoramento em tempo real do metro quadrado, segurança cartorial e oportunidades em condomínios fechados.
              </p>

              {/* Portal Live Stats Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <a 
                  href="https://www.zapimoveis.com.br/venda/imoveis/ce+eusebio/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-3 flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-xs text-orange-300 font-bold uppercase flex items-center gap-1">
                      <span>ZAP Imóveis</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-lg font-black text-white">3.340+ Imóveis</div>
                    <div className="text-[11px] text-slate-300">Média: R$ 6.850/m²</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </a>

                <a 
                  href="https://www.vivareal.com.br/venda/ceara/eusebio/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-3 flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-xs text-blue-300 font-bold uppercase flex items-center gap-1">
                      <span>Viva Real</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-lg font-black text-white">4.180+ Imóveis</div>
                    <div className="text-[11px] text-slate-300">Média: R$ 6.420/m²</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </a>

                <a 
                  href="https://www.olx.com.br/imoveis/venda/estado-ce/fortaleza-e-regiao/grande-fortaleza/eusebio" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-3 flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-xs text-purple-300 font-bold uppercase flex items-center gap-1">
                      <span>OLX Eusébio</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-lg font-black text-white">2.950+ Anúncios</div>
                    <div className="text-[11px] text-slate-300">Média: R$ 5.400/m²</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </a>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Anunciar Imóvel Verificado</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>Guia Anti-Golpe (Cartório & CRECI)</span>
              </button>

              <button
                onClick={() => setActiveTab('roi')}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-emerald-300" />
                <span>Simulador de ROI & Yield</span>
              </button>
            </div>
          </div>

          {/* Hub Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-8 scrollbar-none border-t border-white/10 pt-6">
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'properties'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Imóveis Auditados ({properties.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('portals')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'portals'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Radar Multiportais (ZAP x VivaReal x OLX)</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Auditoria Cartorial & Anti-Fraude</span>
            </button>

            <button
              onClick={() => setActiveTab('news')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'news'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Notícias & Tendências do Mercado</span>
            </button>

            <button
              onClick={() => setActiveTab('roi')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'roi'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Simuladores de Financiamento & ROI</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area based on Active Tab */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">

        {/* TAB 1: PROPERTIES CATALOG */}
        {activeTab === 'properties' && (
          <div>
            {/* Filter Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 md:p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Search Term */}
                <div className="lg:col-span-2 relative">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Buscar por Condomínio, Bairro ou Palavra-chave
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: Alphaville Eusébio, Terras 3, Precabura, Piscina..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Portal Source Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fonte do Anúncio
                  </label>
                  <select
                    value={portalFilter}
                    onChange={(e) => setPortalFilter(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="all">Todas as Fontes (ZAP / VivaReal / OLX)</option>
                    <option value="zap_imoveis">ZAP Imóveis</option>
                    <option value="viva_real">Viva Real</option>
                    <option value="olx">OLX Eusébio</option>
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Finalidade
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPurposeFilter('all')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        purposeFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setPurposeFilter('venda')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        purposeFilter === 'venda' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Comprar
                    </button>
                    <button
                      onClick={() => setPurposeFilter('locacao')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        purposeFilter === 'locacao' ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Alugar
                    </button>
                  </div>
                </div>

                {/* Neighborhood */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bairro / Região
                  </label>
                  <select
                    value={neighborhoodFilter}
                    onChange={(e) => setNeighborhoodFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    {NEIGHBORHOODS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipo do Imóvel
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Faixa de Preço
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="all">Qualquer Valor</option>
                    <option value="under500k">Até R$ 500.000</option>
                    <option value="500k-1m">R$ 500.000 a R$ 1.000.000</option>
                    <option value="1m-2m">R$ 1.000.000 a R$ 2.000.000</option>
                    <option value="above2m">Acima de R$ 2.000.000</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ordenar Por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="recent">Mais Recentes</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="m2_asc">Menor Preço por m²</option>
                    <option value="area_desc">Maior Área</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Badges & Reset */}
              {(searchTerm || portalFilter !== 'all' || purposeFilter !== 'all' || typeFilter !== 'all' || neighborhoodFilter !== 'Todos os Bairros' || priceRange !== 'all') && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Exibindo <strong>{filteredProperties.length}</strong> de <strong>{properties.length}</strong> imóveis verificados
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPortalFilter('all');
                      setPurposeFilter('all');
                      setTypeFilter('all');
                      setNeighborhoodFilter('Todos os Bairros');
                      setPriceRange('all');
                      setSortBy('recent');
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              )}
            </div>

            {/* Properties Grid */}
            {filteredProperties.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-8 shadow-sm">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Nenhum imóvel encontrado para estes filtros</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                  Tente ampliar sua busca alterando o bairro, a faixa de valor ou o tipo de imóvel desejado.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPortalFilter('all');
                    setPurposeFilter('all');
                    setTypeFilter('all');
                    setNeighborhoodFilter('Todos os Bairros');
                    setPriceRange('all');
                  }}
                  className="mt-6 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Restaurar Filtros Padrão
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredProperties.map((prop) => {
                  const portalInfo = getPortalBadge(prop.portalSource);
                  const badgeInfo = getBadgeStyle(prop.verificationBadge);
                  const pricePerM2Calc = prop.pricePerM2 || (prop.areaTotal > 0 ? Math.round(prop.price / prop.areaTotal) : 0);

                  return (
                    <div
                      key={prop.id}
                      onClick={() => {
                        setSelectedProperty(prop);
                        setActiveImageIndex(0);
                      }}
                      className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* Image Container */}
                        <div className="relative h-56 overflow-hidden bg-slate-900">
                          <img
                            src={prop.images[0]}
                            alt={prop.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800');
                            }}
                          />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-sm ${portalInfo.bg}`}>
                              {portalInfo.label}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white">
                              {prop.purpose === 'venda' ? 'Venda' : 'Locação'}
                            </span>
                          </div>

                          {/* Price Tag Overlay */}
                          <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10">
                            <div className="text-[10px] text-emerald-400 font-bold uppercase">
                              {prop.purpose === 'venda' ? 'Valor de Venda' : 'Aluguel Mensal'}
                            </div>
                            <div className="text-lg font-black text-white">
                              R$ {prop.price.toLocaleString('pt-BR')}
                              {prop.purpose === 'locacao' && <span className="text-xs font-normal text-slate-300">/mês</span>}
                            </div>
                          </div>

                          {/* Verification Icon Top Right */}
                          <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg" title="Imóvel Auditado">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5">
                          {/* Neighborhood & Condominium */}
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {prop.condominiumName ? `${prop.condominiumName} • ` : ''}{prop.neighborhood}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                            {prop.title}
                          </h3>

                          {/* Price/m² & Audit Tag */}
                          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                            <div className="text-xs text-slate-600 font-bold">
                              {pricePerM2Calc > 0 ? `R$ ${pricePerM2Calc.toLocaleString('pt-BR')}/m²` : 'Sob consulta'}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeInfo.bg}`}>
                              {badgeInfo.label}
                            </span>
                          </div>

                          {/* Key Specs */}
                          <div className="grid grid-cols-4 gap-2 text-center text-slate-700 text-xs mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div>
                              <BedDouble className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                              <span className="font-bold">{prop.bedrooms}</span> <span className="text-[10px] text-slate-500">qts</span>
                            </div>
                            <div>
                              <Bath className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                              <span className="font-bold">{prop.suites}</span> <span className="text-[10px] text-slate-500">suítes</span>
                            </div>
                            <div>
                              <Car className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                              <span className="font-bold">{prop.garageSpots}</span> <span className="text-[10px] text-slate-500">vg</span>
                            </div>
                            <div>
                              <Maximize2 className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                              <span className="font-bold">{prop.areaTotal}</span> <span className="text-[10px] text-slate-500">m²</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Realtor & WhatsApp Button */}
                      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={prop.realtor.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100'}
                            alt={prop.realtor.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0"
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 truncate">{prop.realtor.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{prop.realtor.creci || 'CRECI 15ª Região'}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => handleCopyLink(prop, e)}
                            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            title="Copiar link do anúncio"
                          >
                            {linkCopiedId === prop.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={(e) => handleOpenWhatsApp(prop, e)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PORTALS RADAR & BENCHMARKS */}
        {activeTab === 'portals' && (
          <div className="space-y-8 mb-16">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Radar Comparativo de Portais Imobiliários</h2>
                  <p className="text-sm text-slate-600">
                    Análise comparativa em tempo real entre ZAP Imóveis, Viva Real e OLX Eusébio.
                  </p>
                </div>
              </div>

              {/* Portal Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PORTAL_BENCHMARKS.map(p => (
                  <div key={p.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 text-slate-800 rounded-full">
                          {p.badge}
                        </span>
                        <span className="text-xs text-slate-400">{p.auditDate}</span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mb-2">{p.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-6">{p.keyHighlight}</p>

                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Volume de Anúncios:</span>
                          <span className="font-black text-slate-900">{p.totalListingsCount.toLocaleString('pt-BR')}+</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Preço Médio do m²:</span>
                          <span className="font-black text-emerald-700">R$ {p.avgPriceM2.toLocaleString('pt-BR')}/m²</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Casas em Condomínio:</span>
                          <span className="font-black text-blue-700">R$ {p.condoAvgPriceM2.toLocaleString('pt-BR')}/m²</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Lotes / Terrenos:</span>
                          <span className="font-black text-purple-700">R$ {p.landAvgPriceM2.toLocaleString('pt-BR')}/m²</span>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="text-xs font-bold text-slate-700 mb-2">Bairros mais buscados:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.topSearchedNeighborhoods.map(neigh => (
                            <span key={neigh} className="text-[11px] bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md font-medium">
                              {neigh}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Acessar {p.name}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Neighborhoods Pricing Matrix */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Termômetro do Metro Quadrado por Bairro</h2>
                  <p className="text-sm text-slate-600">
                    Valores médios apurados através do cruzamento de matrículas cartoriais e ofertas públicas.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-black uppercase">
                      <th className="py-3.5 px-4">Bairro / Polo</th>
                      <th className="py-3.5 px-4">m² Construído (Médio)</th>
                      <th className="py-3.5 px-4">m² Lote / Terreno</th>
                      <th className="py-3.5 px-4">Valorização 12m</th>
                      <th className="py-3.5 px-4">Condomínio Médio</th>
                      <th className="py-3.5 px-4">Principais Condomínios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {NEIGHBORHOOD_METRICS.map(neigh => (
                      <tr key={neigh.slug} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {neigh.name}
                        </td>
                        <td className="py-4 px-4 font-black text-emerald-700">
                          R$ {neigh.avgM2House.toLocaleString('pt-BR')}/m²
                        </td>
                        <td className="py-4 px-4 text-slate-700 font-semibold">
                          R$ {neigh.avgM2Land.toLocaleString('pt-BR')}/m²
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                            <TrendingUp className="w-3 h-3" />
                            +{neigh.appreciation12m}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          R$ {neigh.avgCondoFee.toLocaleString('pt-BR')}/mês
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600">
                          {neigh.topCondominiums.slice(0, 2).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CARTORIAL AUDIT & FRAUD DETECTION */}
        {activeTab === 'security' && (
          <div className="space-y-8 mb-16">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Guia Antitruste & Prevenção de Fraudes Imobiliárias</h2>
                  <p className="text-sm text-slate-600">
                    Como validar a procedência legal do imóvel em Eusébio e evitar golpes comuns no OLX e redes sociais.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {FRAUD_PREVENTION_RULES.map((rule, idx) => (
                  <div key={rule.id} className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-white transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <h3 className="text-lg font-black text-slate-900">{rule.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          rule.riskLevel === 'CRÍTICO' 
                            ? 'bg-red-100 text-red-700' 
                            : rule.riskLevel === 'ALTO'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          Risco: {rule.riskLevel}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{rule.officialEntity}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                      <div className="bg-red-50/60 border border-red-200/60 rounded-xl p-4">
                        <div className="text-xs font-black text-red-800 uppercase flex items-center gap-1.5 mb-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Golpe / Risco Identificado</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{rule.problemDescription}</p>
                      </div>

                      <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4">
                        <div className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Protocolo de Segurança GRIT</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{rule.verificationSolution}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cartório Aguiar Reference */}
              <div className="mt-8 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="text-xs text-emerald-400 font-black uppercase tracking-wider mb-1">
                    Cartório Competente de Registro
                  </div>
                  <h4 className="text-lg font-black text-white">
                    2º Ofício de Notas e Registro de Imóveis do Eusébio (Cartório Aguiar)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Para qualquer compra e venda definitiva de imóveis no município de Eusébio/CE, solicite a Certidão de Ônus Reais de até 30 dias de emissão.
                  </p>
                </div>
                <button
                  onClick={() => onShowToast('Consulte o portal oficial do TJCE ou Cartório Aguiar para emissão de certidões online.', 'info')}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer"
                >
                  Informações Cartoriais
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REAL ESTATE NEWS & EDITORIALS */}
        {activeTab === 'news' && (
          <div className="space-y-8 mb-16">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
                  <Newspaper className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Notícias & Análises do Mercado Imobiliário</h2>
                  <p className="text-sm text-slate-600">
                    Cobertura jornalística sobre valorização, polos de desenvolvimento e infraestrutura urbana no Eusébio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REAL_ESTATE_NEWS.map(article => (
                  <div
                    key={article.id}
                    onClick={() => setSelectedNews(article)}
                    className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-48 overflow-hidden bg-slate-900">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                          {article.category}
                        </div>
                        <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                          Fonte: {article.sourceOrigin}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <span>{new Date(article.publishedAt).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{article.readTime} de leitura</span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-purple-700 transition-colors">
                          {article.title}
                        </h3>

                        <p className="text-slate-600 text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 flex items-center justify-between text-xs font-bold text-purple-700">
                      <span>Ler reportagem completa</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ROI & FINANCING SIMULATORS */}
        {activeTab === 'roi' && (
          <div className="mb-16">
            <EusebioRoiCalculator onShowToast={onShowToast} />
          </div>
        )}

      </div>

      {/* PROPERTY DETAIL MODAL */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase px-3 py-1 rounded-md ${getPortalBadge(selectedProperty.portalSource).bg}`}>
                  {getPortalBadge(selectedProperty.portalSource).label}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  ID: #{selectedProperty.id}
                </span>
              </div>

              <button
                onClick={() => setSelectedProperty(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Carousel */}
            <div className="relative h-72 sm:h-96 bg-slate-900 overflow-hidden">
              <img
                src={selectedProperty.images[activeImageIndex] || selectedProperty.images[0]}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />

              {/* Prev / Next Buttons */}
              {selectedProperty.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? selectedProperty.images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === selectedProperty.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-slate-950/70 text-white px-3 py-1 rounded-full text-xs font-bold">
                {activeImageIndex + 1} / {selectedProperty.images.length}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Title & Price Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{selectedProperty.address || `${selectedProperty.neighborhood}, Eusébio - CE`}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 leading-snug">
                    {selectedProperty.title}
                  </h2>
                </div>

                <div className="text-left sm:text-right shrink-0 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="text-xs text-emerald-800 font-bold uppercase">
                    {selectedProperty.purpose === 'venda' ? 'Valor de Venda' : 'Aluguel Mensal'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950">
                    R$ {selectedProperty.price.toLocaleString('pt-BR')}
                  </div>
                  {selectedProperty.condoFee && (
                    <div className="text-xs text-slate-600 mt-1">
                      Condomínio: <strong>R$ {selectedProperty.condoFee.toLocaleString('pt-BR')}/mês</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div>
                  <BedDouble className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <div className="text-base font-black text-slate-900">{selectedProperty.bedrooms} Quartos</div>
                  <div className="text-xs text-slate-500">{selectedProperty.suites} Suítes</div>
                </div>
                <div>
                  <Bath className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <div className="text-base font-black text-slate-900">{selectedProperty.bathrooms} Banheiros</div>
                  <div className="text-xs text-slate-500">Lavabo incluso</div>
                </div>
                <div>
                  <Car className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <div className="text-base font-black text-slate-900">{selectedProperty.garageSpots} Vagas</div>
                  <div className="text-xs text-slate-500">Garagem coberta</div>
                </div>
                <div>
                  <Maximize2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <div className="text-base font-black text-slate-900">{selectedProperty.areaTotal} m²</div>
                  <div className="text-xs text-slate-500">Área total construída</div>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 mb-3 tracking-wider">
                  Diferenciais & Lazer
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedProperty.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 mb-2 tracking-wider">
                  Descrição Completa do Imóvel
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {selectedProperty.description}
                </p>
              </div>

              {/* Financing Simulator Inside Modal */}
              {selectedProperty.purpose === 'venda' && financingCalculations && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                    <Calculator className="w-4 h-4" />
                    <span>Simulador de Financiamento Habitacional</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-4">
                    Estimativa de Financiamento Bancário (Caixa, BB, Itaú, Bradesco)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Entrada ({downPaymentPercent}%)</label>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        step="5"
                        value={downPaymentPercent}
                        onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <div className="text-sm font-black text-emerald-300 mt-1">
                        R$ {financingCalculations.downPayment.toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Prazo ({loanYears} anos)</label>
                      <input
                        type="range"
                        min="10"
                        max="35"
                        step="5"
                        value={loanYears}
                        onChange={(e) => setLoanYears(parseInt(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <div className="text-sm font-black text-slate-200 mt-1">
                        {financingCalculations.totalMonths} meses
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Taxa de Juros Anual</label>
                      <div className="text-sm font-black text-slate-200 mt-1">
                        {interestRate}% a.a. (Estimada)
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-300">Valor a ser Financiado:</div>
                      <div className="text-base font-bold text-white">
                        R$ {financingCalculations.loanAmount.toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-emerald-400 font-bold">Parcela Inicial (SAC):</div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-300">
                        R$ {Math.round(financingCalculations.initialInstallment).toLocaleString('pt-BR')}/mês
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Realtor Contact Card */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedProperty.realtor.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'}
                    alt={selectedProperty.realtor.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500"
                  />
                  <div>
                    <div className="text-base font-black text-slate-900">{selectedProperty.realtor.name}</div>
                    <div className="text-xs text-emerald-700 font-bold">{selectedProperty.realtor.creci || 'CRECI 15ª Região'}</div>
                    <div className="text-xs text-slate-500">{selectedProperty.realtor.agency || 'Imobiliária Credenciada'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {selectedProperty.sourceUrl && (
                    <a
                      href={selectedProperty.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ver no Portal</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenWhatsApp(selectedProperty)}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar com o Corretor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE / NEWS DETAIL MODAL */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase px-3 py-1 bg-purple-100 text-purple-800 rounded-md">
                  {selectedNews.category}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Fonte: {selectedNews.sourceOrigin}
                </span>
              </div>

              <button
                onClick={() => setSelectedNews(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-64 bg-slate-900">
              <img
                src={selectedNews.imageUrl}
                alt={selectedNews.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Publicado em {new Date(selectedNews.publishedAt).toLocaleDateString('pt-BR')} • Por {selectedNews.author}
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-snug">
                  {selectedNews.title}
                </h2>
              </div>

              {/* Key Takeaways */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-700" />
                  <span>Destaques da Reportagem</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-purple-950">
                  {selectedNews.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Content */}
              <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
                {selectedNews.content.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH NEW PROPERTY MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900">Anunciar Imóvel no Radar GRIT</h3>
                <p className="text-xs text-slate-500">Validação técnica com integração ZAP, Viva Real ou OLX</p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-6 sm:p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Título do Anúncio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mansão Duplex no Alphaville Eusébio com Piscina"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Finalidade *
                  </label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  >
                    <option value="venda">Venda</option>
                    <option value="locacao">Locação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo do Imóvel *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  >
                    <option value="casa_condominio">Casa em Condomínio Fechado</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="lote_terreno">Lote / Terreno</option>
                    <option value="comercial">Comercial / Sala</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1.450.000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Condomínio (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 650"
                    value={formData.condoFee}
                    onChange={(e) => setFormData({ ...formData, condoFee: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    IPTU Mensal (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 180"
                    value={formData.iptu}
                    onChange={(e) => setFormData({ ...formData, iptu: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bairro no Eusébio *
                  </label>
                  <select
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  >
                    {NEIGHBORHOODS.filter(n => n !== 'Todos os Bairros').map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome do Condomínio
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Terras Alphaville 3"
                    value={formData.condominiumName}
                    onChange={(e) => setFormData({ ...formData, condominiumName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quartos</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Suítes</label>
                  <input
                    type="number"
                    value={formData.suites}
                    onChange={(e) => setFormData({ ...formData, suites: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vagas</label>
                  <input
                    type="number"
                    value={formData.garageSpots}
                    onChange={(e) => setFormData({ ...formData, garageSpots: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Área (m²)</label>
                  <input
                    type="number"
                    value={formData.areaTotal}
                    onChange={(e) => setFormData({ ...formData, areaTotal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Portal de Origem
                  </label>
                  <select
                    value={formData.portalSource}
                    onChange={(e) => setFormData({ ...formData, portalSource: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  >
                    <option value="zap_imoveis">ZAP Imóveis</option>
                    <option value="viva_real">Viva Real</option>
                    <option value="olx">OLX Eusébio</option>
                    <option value="grit_direto">GRIT Direto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Selo de Validação
                  </label>
                  <select
                    value={formData.verificationBadge}
                    onChange={(e) => setFormData({ ...formData, verificationBadge: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  >
                    <option value="CRECI_AUDITADO">CRECI Auditado</option>
                    <option value="MATRICULA_VERIFICADA">Matrícula Verificada no Cartório</option>
                    <option value="DIRETO_COM_CONSTRUTORA">Direto com a Construtora</option>
                    <option value="VALOR_CONFIRMADO">Valor Confirmado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descrição dos Diferenciais
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes sobre a planta, acabamentos, posição solar..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                />
              </div>

              {/* Realtor Details */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-900 mb-3 tracking-wider">
                  Dados do Corretor / Imobiliária Responsável
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nome do Corretor *"
                      value={formData.realtorName}
                      onChange={(e) => setFormData({ ...formData, realtorName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="CRECI (Ex: 14.890-F)"
                      value={formData.realtorCreci}
                      onChange={(e) => setFormData({ ...formData, realtorCreci: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="WhatsApp (Ex: 5585991823344) *"
                      value={formData.realtorPhone}
                      onChange={(e) => setFormData({ ...formData, realtorPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Imobiliária / Agência"
                      value={formData.realtorAgency}
                      onChange={(e) => setFormData({ ...formData, realtorAgency: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Homologar & Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
