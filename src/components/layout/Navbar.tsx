import React, { useState } from 'react';
import { Search, Tag, Bookmark, ShieldAlert, Menu, X, LayoutDashboard, Sparkles, TrendingUp, HeartPulse, PawPrint, Cpu, Truck, Globe, Smile, Lightbulb, ShoppingBag, Stethoscope } from 'lucide-react';
import { Category } from '../../types';
import { GritNewsLogo } from '../ui/GritNewsLogo';
import { TenPetsLogo } from '../ui/TenPetsLogo';

interface NavbarProps {
  categories: Category[];
  activeCategorySlug?: string;
  onSelectCategory: (slug?: string) => void;
  onNavigateOffers: () => void;
  onNavigateBookmarks: () => void;
  onNavigateAdmin: () => void;
  onNavigateTenPets: () => void;
  onNavigateSacProh?: () => void;
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
  onNavigateSacProh,
  onSearch,
  onNavigateHome,
  onOpenDocs,
  onOpenContactModal,
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
      <div className="bg-[#0D182A] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-[#FF8A00] text-white font-bold px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider">
              Destaque
            </span>
            <p className="text-[#F1F5F9] font-medium truncate text-xs">
              M&A no setor de saúde cresce 34% em 2026 • IA Generativa já otimiza 80% dos chamados B2B
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-gray-300">
            {onOpenContactModal && (
              <button
                onClick={onOpenContactModal}
                className="hover:text-amber-300 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Anuncie / Parcerias & Pautas</span>
              </button>
            )}
            <span className="text-[11px] font-mono text-gray-400">gritnews.com.br</span>
          </div>
        </div>
      </div>

      {/* Main Brand & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <GritNewsLogo onClick={onNavigateHome} size="md" showSlogan={true} />

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar notícias, mercado de saúde, pet, tecnologia, inteligência artificial..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm text-[#0D182A] focus:outline-none focus:ring-2 focus:ring-[#146EF5] focus:bg-white transition-all placeholder-gray-400 font-medium"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </form>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <a
            href="https://meli.la/1kXwMJQ"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black px-3 py-2 rounded-xl text-xs border border-yellow-500/40 shadow-xs hover:scale-102 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current text-slate-900" />
            <span>Lista Mercado Livre</span>
          </a>

          <a
            href="https://www.amazon.com.br/shop/tassovasconcelos"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-2 rounded-xl text-xs border border-slate-200 transition-all cursor-pointer"
            title="Loja Amazon de Tasso Vasconcelos"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>Amazon</span>
          </a>

          {onNavigateSacProh && (
            <button
              onClick={onNavigateSacProh}
              className="flex items-center gap-1.5 bg-sky-700 hover:bg-sky-600 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-xs hover:scale-102 transition-all cursor-pointer"
              title="SAC ProCirúrgica Hospitalar"
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-200" />
              <span>SACPROH</span>
            </button>
          )}

          <button
            onClick={onNavigateOffers}
            className="flex items-center gap-1.5 bg-[#FF8A00] hover:bg-[#e07900] text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md hover:scale-102 transition-all cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Ofertas</span>
          </button>

          <button
            onClick={onNavigateBookmarks}
            className="flex items-center gap-1.5 bg-[#F1F5F9] hover:bg-[#EAF3FF] text-[#0D182A] font-bold px-3.5 py-2 rounded-xl text-xs border border-[#E2E8F0] hover:border-[#146EF5] transition-all relative"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#146EF5]" />
            <span>Salvos</span>
            {bookmarksCount > 0 && (
              <span className="bg-[#146EF5] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
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
      <div className="bg-[#F1F5F9] border-t border-[#E2E8F0] overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 whitespace-nowrap py-1">
          <button
            onClick={() => onSelectCategory(undefined)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              !activeCategorySlug
                ? 'bg-[#0D182A] text-white shadow-xs'
                : 'text-[#687280] hover:text-[#0D182A] hover:bg-white'
            }`}
          >
            Todas as Notícias
          </button>

          {/* TenPets Subdomain Portal Button */}
          <button
            onClick={onNavigateTenPets}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-[#587837] hover:bg-[#48632c] text-white shadow-xs hover:scale-105 transition-all border border-[#769b4e]"
          >
            <TenPetsLogo variant="dark" size="sm" />
            <span>(Resgates & Ciência)</span>
            <span className="bg-black/20 text-emerald-200 text-[9px] px-1.5 py-0.2 rounded font-mono">
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
                    ? 'bg-[#146EF5] text-white shadow-xs'
                    : 'text-[#687280] hover:text-[#0D182A] hover:bg-white'
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
            <a
              href="https://meli.la/1kXwMJQ"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-2 border border-yellow-500/40"
            >
              <Sparkles className="w-4 h-4 text-slate-900 fill-current" />
              <span>Lista de Achados no Mercado Livre</span>
            </a>

            <a
              href="https://www.amazon.com.br/shop/tassovasconcelos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs text-center flex items-center justify-center gap-2 border border-slate-200"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>Loja Amazon (Tasso Vasconcelos)</span>
            </a>

            {onNavigateSacProh && (
              <button
                onClick={() => {
                  onNavigateSacProh();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-4 h-4 text-sky-200" />
                <span>SAC ProCirúrgica (SACPROH)</span>
              </button>
            )}

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
          </div>
        </div>
      )}
    </header>
  );
};
