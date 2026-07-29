import React, { useState } from 'react';
import { Search, Tag, Bookmark, ShieldAlert, Menu, X, LayoutDashboard, Sparkles, TrendingUp, HeartPulse, PawPrint, Cpu, Truck, Globe, Smile, Lightbulb } from 'lucide-react';
import { Category } from '../../types';

interface NavbarProps {
  categories: Category[];
  activeCategorySlug?: string;
  onSelectCategory: (slug?: string) => void;
  onNavigateOffers: () => void;
  onNavigateBookmarks: () => void;
  onNavigateAdmin: () => void;
  onNavigateTenPets: () => void;
  onSearch: (query: string) => void;
  onNavigateHome: () => void;
  onOpenDocs: () => void;
  bookmarksCount: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  HeartPulse,
  PawPrint,
  Cpu,
  Truck,
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
  onSearch,
  onNavigateHome,
  onOpenDocs,
  bookmarksCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-xs">
      {/* Top Bar / Ticker */}
      <div className="bg-[#0B2343] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-[#FF8500] text-white font-bold px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider">
              Destaque
            </span>
            <p className="text-gray-200 font-medium truncate text-xs">
              M&A no setor de saúde cresce 34% em 2026 • IA Generativa já otimiza 80% dos chamados B2B
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-gray-300">
            <button
              onClick={onOpenDocs}
              className="hover:text-[#FF8500] font-semibold transition-colors flex items-center gap-1"
            >
              <span>Documentação & Deploy</span>
            </button>
            <span>|</span>
            <button
              onClick={onNavigateAdmin}
              className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 text-[11px] transition-colors"
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>Painel Admin / CMS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onNavigateHome}>
          <div className="w-10 h-10 bg-gradient-to-br from-[#0B2343] to-[#145EDB] text-white font-black text-xl rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            G
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tighter text-[#0B2343]">GRIT</span>
              <span className="text-2xl font-black tracking-tighter text-[#145EDB]">NEWS</span>
            </div>
            <p className="text-[10px] font-bold text-[#5C6B7A] tracking-wider uppercase -mt-1">
              Informação que gera oportunidades.
            </p>
          </div>
        </div>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar notícias, mercado de saúde, pet, tecnologia, inteligência artificial..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm text-[#10233F] focus:outline-none focus:ring-2 focus:ring-[#145EDB] focus:bg-white transition-all placeholder-gray-400"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </form>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={onNavigateOffers}
            className="flex items-center gap-1.5 bg-[#FF8500] hover:bg-[#e07500] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md hover:scale-102 transition-all cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Central de Ofertas</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
              PROMO
            </span>
          </button>

          <button
            onClick={onNavigateBookmarks}
            className="flex items-center gap-1.5 bg-[#F7F9FC] hover:bg-[#EAF3FF] text-[#0B2343] font-bold px-3.5 py-2 rounded-xl text-xs border border-[#E2E8F0] hover:border-[#145EDB] transition-all relative"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#145EDB]" />
            <span>Salvos</span>
            {bookmarksCount > 0 && (
              <span className="bg-[#145EDB] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {bookmarksCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onNavigateOffers}
            className="bg-[#FF8500] text-white font-bold p-2 rounded-xl text-xs"
            title="Ofertas"
          >
            <Tag className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#0B2343] hover:bg-gray-100 rounded-xl"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-[#F7F9FC] border-t border-[#E2E8F0] overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 whitespace-nowrap py-1">
          <button
            onClick={() => onSelectCategory(undefined)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              !activeCategorySlug
                ? 'bg-[#0B2343] text-white shadow-xs'
                : 'text-[#5C6B7A] hover:text-[#0B2343] hover:bg-white'
            }`}
          >
            Todas as Notícias
          </button>

          {/* TenPets Subdomain Portal Button */}
          <button
            onClick={onNavigateTenPets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-sm hover:scale-105 transition-all border border-amber-500/50"
          >
            <img
              src="/src/assets/images/tenpets_official_logo_1785288965710.jpg"
              alt="TenPets Logo"
              className="w-4 h-4 rounded object-cover ring-1 ring-amber-300"
              referrerPolicy="no-referrer"
            />
            <span>TenPets (Resgates & Ciência)</span>
            <span className="bg-amber-900/80 text-amber-200 text-[9px] px-1.5 py-0.2 rounded font-mono">
              .gritnews
            </span>
          </button>

          {categories.map(cat => {
            const isActive = activeCategorySlug === cat.slug;
            const IconComp = ICON_MAP[cat.iconName] || Tag;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#145EDB] text-white shadow-xs'
                    : 'text-[#5C6B7A] hover:text-[#10233F] hover:bg-white'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" style={{ color: isActive ? '#FFFFFF' : cat.color }} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] p-4 shadow-xl animate-slideDown">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar notícias ou assuntos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </form>

          <div className="space-y-1 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categorias</p>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between ${
                  activeCategorySlug === cat.slug ? 'bg-[#EAF3FF] text-[#145EDB]' : 'text-[#10233F]'
                }`}
              >
                <span>{cat.name}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigateOffers();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#FF8500] text-white font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              <span>Central de Ofertas</span>
            </button>
            <button
              onClick={() => {
                onNavigateAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#0B2343] text-white font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel Admin / CMS</span>
            </button>
            <button
              onClick={() => {
                onOpenDocs();
                setMobileMenuOpen(false);
              }}
              className="w-full border border-[#E2E8F0] text-[#0B2343] font-bold py-2 rounded-xl text-xs text-center"
            >
              Documentação & Deploy Hostinger
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
