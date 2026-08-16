import React, { useState } from 'react';
import { 
  Search, 
  Tag, 
  Bookmark, 
  Menu, 
  X, 
  LayoutDashboard, 
  Sparkles, 
  TrendingUp, 
  HeartPulse, 
  PawPrint, 
  Cpu, 
  Globe, 
  Smile, 
  Lightbulb, 
  ShoppingBag, 
  Building2, 
  BarChart3, 
  ShieldCheck, 
  Feather,
  ChevronRight,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Category } from '../../types';
import { GritNewsLogo } from '../ui/GritNewsLogo';
import { LiveRadarNewsEngine } from '../ui/LiveRadarNewsEngine';
import { useEconomicRadar } from '../../hooks/useEconomicRadar';

interface NavbarProps {
  categories: Category[];
  activeCategorySlug?: string;
  onSelectCategory: (slug?: string) => void;
  onNavigateOffers: () => void;
  onNavigateBookmarks: () => void;
  onNavigateAdmin: () => void;
  onNavigateTenPets: () => void;
  onNavigateImoveis?: () => void;
  onNavigatePlaybook?: () => void;
  onNavigateRadar?: () => void;
  onNavigateFato?: () => void;
  onNavigateOpiniao?: () => void;
  onNavigateCheckout?: (productId?: string) => void;
  onSearch: (query: string) => void;
  onNavigateHome: () => void;
  onOpenDocs: () => void;
  onOpenContactModal?: () => void;
  bookmarksCount: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  HeartPulse,
  PawPrint,
  Cpu,
  Globe,
  TrendingUp,
  Smile,
  Lightbulb,
  Tag,
  Sparkles
};

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  activeCategorySlug,
  onSelectCategory,
  onNavigateOffers,
  onNavigateBookmarks,
  onNavigateAdmin,
  onNavigateTenPets,
  onNavigateImoveis,
  onNavigatePlaybook,
  onNavigateRadar,
  onNavigateFato,
  onNavigateOpiniao,
  onNavigateCheckout,
  onSearch,
  onNavigateHome,
  onOpenDocs,
  onOpenContactModal,
  bookmarksCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { summary: radarSummary, syncStatus } = useEconomicRadar();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setMobileMenuOpen(false);
    }
  };

  // Format today's date in Portuguese (e.g. Domingo, 16 de Agosto de 2026)
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* 1. TOP UTILITY BAR: Date, Financial Pulse Ticker & Quick Services */}
      <div className="bg-[#0B132B] text-slate-300 text-xs border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          
          {/* Left: Live Date & Automated Real-time News Radar with Source Attribution */}
          <div className="flex items-center gap-3 overflow-hidden flex-1 max-w-3xl">
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-medium text-[11px] pr-3 border-r border-slate-700/80 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{capitalizedDate}</span>
            </div>

            <div className="flex-1 overflow-hidden">
              <LiveRadarNewsEngine 
                variant="topbar" 
                onNavigateRadar={onNavigateRadar}
              />
            </div>
          </div>

          {/* Right: Financial Market Pulse & Essential Utility Links */}
          <div className="hidden lg:flex items-center gap-4 shrink-0 text-xs">
            {/* Quick Market Mini-Indicators */}
            <div 
              onClick={onNavigateRadar}
              className="flex items-center gap-2.5 text-[11px] font-mono bg-slate-900/90 px-3 py-1 rounded-md border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              title="Abrir Radar Econômico & Painel de Mercados (Fonte: UOL Economia Câmbio & BCB)"
            >
              <span className="text-slate-400">USD COM <strong className="text-slate-200">{radarSummary.dolarComercial}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">TUR <strong className="text-slate-200">{radarSummary.dolarTurismo}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">EUR <strong className="text-slate-200">{radarSummary.euroComercial}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">IBOV <strong className={`font-semibold ${radarSummary.ibovespaPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>{radarSummary.ibovespaVariacao}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">SELIC <strong className="text-slate-200">{radarSummary.selicMeta}</strong></span>
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'} ml-0.5`} title={syncStatus === 'live' ? 'Cotações ao vivo' : 'Sincronizado'} />
            </div>

            {/* Quick Utility Links */}
            {onNavigateFato && (
              <button
                onClick={onNavigateFato}
                className="text-slate-300 hover:text-emerald-300 font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>GRIT Fato</span>
              </button>
            )}

            {onNavigateOpiniao && (
              <button
                onClick={onNavigateOpiniao}
                className="text-slate-300 hover:text-purple-300 font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Feather className="w-3.5 h-3.5 text-purple-400" />
                <span>Colunistas</span>
              </button>
            )}

            {onOpenContactModal && (
              <button
                onClick={onOpenContactModal}
                className="text-slate-300 hover:text-amber-300 font-medium text-[11px] transition-colors cursor-pointer"
              >
                Anuncie / Pautas
              </button>
            )}

            <button
              onClick={onNavigateBookmarks}
              className="text-slate-300 hover:text-white font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
              title="Artigos Salvos"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Salvos</span>
              {bookmarksCount > 0 && (
                <span className="bg-[#146EF5] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {bookmarksCount}
                </span>
              )}
            </button>

            <button
              onClick={onNavigateAdmin}
              className="text-slate-400 hover:text-amber-300 font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer pl-2 border-l border-slate-700"
              title="Painel Administrativo CMS"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN EDITORIAL BRANDING & SEARCH BAR */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-6">
        {/* Brand Masthead */}
        <div className="shrink-0 flex items-center gap-3">
          <GritNewsLogo onClick={onNavigateHome} size="md" showSlogan={true} />
        </div>

        {/* Integrated Clean Search Box */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-auto">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar inteligência de mercado, tecnologia, saúde, causa animal, negócios..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all placeholder-slate-400 font-normal"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              Enter
            </kbd>
          </div>
        </form>

        {/* Right Refined Action Bar */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <button
            onClick={onNavigateOffers}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>Central de Ofertas</span>
          </button>

          <a
            href="https://meli.la/1kXwMJQ"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Achados ML</span>
          </a>

          {onNavigateCheckout && (
            <button
              onClick={() => onNavigateCheckout()}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Checkout Oficial</span>
            </button>
          )}
        </div>

        {/* Mobile Nav Actions */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onNavigateOffers}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg text-xs"
            title="Ofertas"
          >
            <Tag className="w-5 h-5 text-amber-500" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 3. PRIMARY EDITORIAL SECTION NAVIGATION (Clean, Single-line, No Rainbow Clutter) */}
      <nav className="bg-white border-t border-slate-200 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-0.5 whitespace-nowrap py-1">
          {/* Todas as Notícias */}
          <button
            onClick={() => onSelectCategory(undefined)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              !activeCategorySlug
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Todas as Notícias
          </button>

          {/* Standard Categories */}
          {categories.map(cat => {
            const isActive = activeCategorySlug === cat.slug;
            const IconComp = ICON_MAP[cat.iconName] || Tag;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}

          <span className="h-4 w-px bg-slate-200 mx-1 shrink-0" />

          {/* Special Verticals (Styled Elegantly, Unified) */}
          <button
            onClick={onNavigateTenPets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50 transition-all cursor-pointer"
          >
            <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
            <span>TenPets (Causa Animal)</span>
          </button>

          {onNavigateImoveis && (
            <button
              onClick={onNavigateImoveis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-amber-800 hover:text-amber-900 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Imóveis Eusébio</span>
            </button>
          )}

          {onNavigatePlaybook && (
            <button
              onClick={onNavigatePlaybook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-rose-800 hover:text-rose-900 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Playbook Saúde</span>
            </button>
          )}

          {onNavigateRadar && (
            <button
              onClick={onNavigateRadar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-blue-800 hover:text-blue-900 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Radar Mercados</span>
            </button>
          )}
        </div>
      </nav>

      {/* 4. MOBILE DRAWER NAVIGATION */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 shadow-xl max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar notícias, artigos ou temas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </form>

          {/* Quick Hubs */}
          <div className="grid grid-cols-2 gap-2 mb-4 pb-3 border-b border-slate-100">
            <button
              onClick={() => {
                if (onNavigateRadar) onNavigateRadar();
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-left text-xs font-bold text-slate-800 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Radar Mercados</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateFato) onNavigateFato();
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-left text-xs font-bold text-slate-800 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>GRIT Fato</span>
            </button>

            <button
              onClick={() => {
                onNavigateTenPets();
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-left text-xs font-bold text-slate-800 flex items-center gap-2"
            >
              <PawPrint className="w-4 h-4 text-emerald-600" />
              <span>Portal TenPets</span>
            </button>

            {onNavigateImoveis && (
              <button
                onClick={() => {
                  onNavigateImoveis();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-left text-xs font-bold text-slate-800 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Imóveis Eusébio</span>
              </button>
            )}
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Seções & Editorias</p>
            <button
              onClick={() => {
                onSelectCategory(undefined);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between ${
                !activeCategorySlug ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Todas as Notícias</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between ${
                  activeCategorySlug === cat.slug ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigateOffers();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 rounded-lg text-xs text-center flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Central de Ofertas B2B</span>
            </button>

            {onNavigateCheckout && (
              <button
                onClick={() => {
                  onNavigateCheckout();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs text-center flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Checkout Oficial Mercado Pago</span>
              </button>
            )}

            <button
              onClick={() => {
                onNavigateAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-slate-800 text-amber-300 font-bold py-2.5 rounded-lg text-xs text-center flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <span>Acessar Painel CMS (Admin)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
