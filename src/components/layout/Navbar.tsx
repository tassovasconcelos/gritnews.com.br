import React, { useState } from 'react';
import { Search, Menu, X, Bookmark, LayoutDashboard, Newspaper, ArrowRight } from 'lucide-react';
import { Category } from '../../types';

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

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  activeCategorySlug,
  onSelectCategory,
  onNavigateBookmarks,
  onNavigateAdmin,
  onSearch,
  onNavigateHome,
  bookmarksCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    onSearch(query);
    setMobileMenuOpen(false);
    setInsightsOpen(false);
  };

  const goSection = (id: string) => {
    onNavigateHome();
    setMobileMenuOpen(false);
    setInsightsOpen(false);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const goInsights = () => {
    onNavigateHome();
    setMobileMenuOpen(false);
    window.setTimeout(() => {
      document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
      <div className="bg-[#061C2D] text-white">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between gap-4 text-[11px]">
          <button onClick={goInsights} className="flex items-center gap-2 font-bold tracking-wide hover:text-[#FF7A18] transition-colors">
            <Newspaper className="w-3.5 h-3.5 text-[#FF7A18]" />
            <span>GRIT INSIGHTS</span>
            <span className="hidden sm:inline text-slate-400 font-medium">conteúdo, mercado e inteligência</span>
          </button>
          <div className="hidden md:flex items-center gap-4 text-slate-300">
            <button onClick={onNavigateBookmarks} className="hover:text-white transition-colors">Salvos{bookmarksCount > 0 ? ` (${bookmarksCount})` : ''}</button>
            <button onClick={onNavigateAdmin} className="hover:text-[#FF7A18] transition-colors">Admin</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 h-[76px] flex items-center justify-between gap-5">
        <button onClick={onNavigateHome} className="flex items-center gap-3 shrink-0 text-left">
          <div className="w-11 h-11 rounded-xl bg-[#061C2D] grid place-items-center shadow-sm">
            <svg viewBox="0 0 48 48" className="w-7 h-7" aria-hidden="true">
              <path d="M12 34 34 12M21 12h13v13" fill="none" stroke="#FF6A00" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[27px] font-black tracking-[-0.045em] text-[#061C2D]">grit</div>
            <div className="mt-1 text-[8px] sm:text-[9px] font-extrabold tracking-[0.18em] text-slate-500">SOLUÇÕES E NEGÓCIOS</div>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-bold text-slate-600">
          <button onClick={onNavigateHome} className="px-3 py-2 rounded-lg hover:text-[#061C2D] hover:bg-slate-50">Início</button>
          <button onClick={() => goSection('solucoes')} className="px-3 py-2 rounded-lg hover:text-[#061C2D] hover:bg-slate-50">Soluções</button>
          <button onClick={() => goSection('metodo')} className="px-3 py-2 rounded-lg hover:text-[#061C2D] hover:bg-slate-50">Método</button>
          <button onClick={() => goSection('produtos')} className="px-3 py-2 rounded-lg hover:text-[#061C2D] hover:bg-slate-50">Produtos</button>
          <div className="relative">
            <button onClick={() => setInsightsOpen(v => !v)} className="px-3 py-2 rounded-lg hover:text-[#061C2D] hover:bg-slate-50">Insights</button>
            {insightsOpen && (
              <div className="absolute right-0 mt-2 w-[360px] rounded-2xl bg-white border border-slate-200 shadow-2xl p-3">
                <button onClick={goInsights} className="w-full text-left rounded-xl p-3 hover:bg-slate-50">
                  <span className="block text-xs font-black text-[#FF6A00] tracking-wider">GRIT NEWS</span>
                  <span className="block mt-1 text-sm font-black text-[#061C2D]">Inteligência que gera oportunidades</span>
                  <span className="block mt-1 text-xs font-medium text-slate-500">Artigos, análises, mercado, tecnologia e conteúdo especializado.</span>
                </button>
                <div className="border-t border-slate-100 mt-2 pt-2 max-h-48 overflow-auto">
                  {categories.slice(0, 8).map(category => (
                    <button
                      key={category.id}
                      onClick={() => { onSelectCategory(category.slug); setInsightsOpen(false); }}
                      className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs font-bold ${activeCategorySlug === category.slug ? 'bg-[#061C2D] text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-[#061C2D]'}`}
                    >
                      {category.name}<ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="hidden xl:block relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar Insights..."
              className="w-48 pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </form>
          <button onClick={() => goSection('diagnostico')} className="bg-[#FF6A00] hover:bg-[#E95F00] text-white font-extrabold text-sm px-5 py-3 rounded-xl transition-colors shadow-sm">
            Diagnóstico GRIT
          </button>
        </div>

        <button onClick={() => setMobileMenuOpen(v => !v)} className="lg:hidden w-11 h-11 rounded-xl border border-slate-200 grid place-items-center text-[#061C2D]" aria-label="Abrir menu">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <button onClick={onNavigateHome} className="w-full text-left px-4 py-3 rounded-xl font-bold text-[#061C2D] hover:bg-slate-50">Início</button>
            <button onClick={() => goSection('solucoes')} className="w-full text-left px-4 py-3 rounded-xl font-bold text-[#061C2D] hover:bg-slate-50">Soluções</button>
            <button onClick={() => goSection('metodo')} className="w-full text-left px-4 py-3 rounded-xl font-bold text-[#061C2D] hover:bg-slate-50">Método</button>
            <button onClick={() => goSection('produtos')} className="w-full text-left px-4 py-3 rounded-xl font-bold text-[#061C2D] hover:bg-slate-50">Produtos</button>
            <button onClick={goInsights} className="w-full text-left px-4 py-3 rounded-xl font-bold text-[#061C2D] hover:bg-slate-50">GRIT Insights / News</button>
            <form onSubmit={handleSearchSubmit} className="relative pt-1">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar no GRIT Insights" className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none" />
              <Search className="absolute left-3.5 top-[18px] w-4 h-4 text-slate-400" />
            </form>
            <button onClick={() => goSection('diagnostico')} className="w-full bg-[#FF6A00] text-white px-4 py-3.5 rounded-xl font-extrabold">Conte seu desafio</button>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={onNavigateBookmarks} className="flex-1 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600"><Bookmark className="w-4 h-4 inline mr-1" /> Salvos</button>
              <button onClick={onNavigateAdmin} className="flex-1 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600"><LayoutDashboard className="w-4 h-4 inline mr-1" /> Admin</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
