import React, { useState } from 'react';
import { Search, Menu, X, Bookmark, LayoutDashboard, Newspaper, ArrowRight } from 'lucide-react';
import { Category } from '../../types';
import { GritBrandLogo } from '../ui/GritBrandLogo';

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

export const Navbar: React.FC<NavbarProps> = ({ categories, activeCategorySlug, onSelectCategory, onNavigateBookmarks, onNavigateAdmin, onSearch, onNavigateHome, bookmarksCount }) => {
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
    onNavigateHome(); setMobileMenuOpen(false); setInsightsOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const goInsights = () => goSection('insights');

  return (
    <header className="sticky top-0 z-50 bg-[#0A1930] text-white border-b border-white/10 shadow-xl">
      <div className="border-b border-white/10 bg-[#071426]">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between gap-4 text-[11px]">
          <button onClick={goInsights} className="flex items-center gap-2 font-bold tracking-wide hover:text-[#FB7A18] transition-colors">
            <Newspaper className="w-3.5 h-3.5 text-[#FB7A18]" />
            <span className="text-[#FB7A18]">GRIT INSIGHTS</span>
            <span className="hidden sm:inline text-slate-400 font-medium">Inteligência que gera oportunidades</span>
          </button>
          <div className="hidden md:flex items-center gap-4 text-slate-400">
            <span>Inteligência • Tecnologia • Execução • Resultados</span>
            <button onClick={onNavigateAdmin} className="hover:text-[#FF6A00]">Admin</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 h-[82px] flex items-center justify-between gap-5">
        <GritBrandLogo variant="light" size="md" onClick={onNavigateHome} />

        <nav className="hidden lg:flex items-center gap-1 text-sm font-bold text-slate-200">
          <button onClick={onNavigateHome} className="px-3 py-2 rounded-lg text-[#FB7A18]">Início</button>
          <button onClick={() => goSection('solucoes')} className="px-3 py-2 rounded-lg hover:text-[#FF6A00] hover:bg-white/5">Soluções</button>
          <button onClick={() => goSection('metodo')} className="px-3 py-2 rounded-lg hover:text-[#FF6A00] hover:bg-white/5">Método</button>
          <button onClick={() => goSection('produtos')} className="px-3 py-2 rounded-lg hover:text-[#FF6A00] hover:bg-white/5">Produtos</button>
          <div className="relative">
            <button onClick={() => setInsightsOpen(v => !v)} className="px-3 py-2 rounded-lg hover:text-[#FF6A00] hover:bg-white/5">Insights</button>
            {insightsOpen && (
              <div className="absolute right-0 mt-3 w-[370px] rounded-2xl bg-white text-[#061C2D] border border-slate-200 shadow-2xl p-3">
                <button onClick={goInsights} className="w-full text-left rounded-xl p-3 hover:bg-slate-50">
                  <span className="block text-xs font-black text-[#FF6A00] tracking-wider">GRIT INSIGHTS / NEWS</span>
                  <span className="block mt-1 text-sm font-black">Conteúdo, mercado e inteligência</span>
                  <span className="block mt-1 text-xs font-medium text-slate-500">Preservamos o ativo editorial como motor de autoridade e indexação.</span>
                </button>
                <div className="border-t border-slate-100 mt-2 pt-2 max-h-48 overflow-auto">
                  {categories.slice(0, 8).map(category => (
                    <button key={category.id} onClick={() => { onSelectCategory(category.slug); setInsightsOpen(false); }} className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs font-bold ${activeCategorySlug === category.slug ? 'bg-[#061C2D] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
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
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar Insights..." className="w-48 pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#FF6A00]/30" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </form>
          <button onClick={() => goSection('diagnostico')} className="bg-[#FB7A18] hover:bg-[#e66b0b] text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">Diagnóstico GRIT</button>
        </div>

        <button onClick={() => setMobileMenuOpen(v => !v)} className="lg:hidden w-11 h-11 rounded-xl border border-white/20 grid place-items-center" aria-label="Abrir menu">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#071B2C] shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <button onClick={onNavigateHome} className="w-full text-left px-4 py-3 rounded-xl font-bold hover:bg-white/5">Início</button>
            <button onClick={() => goSection('solucoes')} className="w-full text-left px-4 py-3 rounded-xl font-bold hover:bg-white/5">Soluções</button>
            <button onClick={() => goSection('metodo')} className="w-full text-left px-4 py-3 rounded-xl font-bold hover:bg-white/5">Método</button>
            <button onClick={() => goSection('produtos')} className="w-full text-left px-4 py-3 rounded-xl font-bold hover:bg-white/5">Produtos</button>
            <button onClick={goInsights} className="w-full text-left px-4 py-3 rounded-xl font-bold hover:bg-white/5">GRIT Insights / News</button>
            <form onSubmit={handleSearchSubmit} className="relative pt-1"><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar no GRIT Insights" className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-sm outline-none"/><Search className="absolute left-3.5 top-[18px] w-4 h-4 text-slate-500"/></form>
            <button onClick={() => goSection('diagnostico')} className="w-full bg-[#FF6A00] text-white px-4 py-3.5 rounded-xl font-extrabold">Conte seu desafio</button>
            <div className="flex items-center gap-2 pt-2"><button onClick={onNavigateBookmarks} className="flex-1 border border-white/15 px-3 py-2.5 rounded-xl text-xs font-bold"><Bookmark className="w-4 h-4 inline mr-1"/> Salvos{bookmarksCount>0?` (${bookmarksCount})`:''}</button><button onClick={onNavigateAdmin} className="flex-1 border border-white/15 px-3 py-2.5 rounded-xl text-xs font-bold"><LayoutDashboard className="w-4 h-4 inline mr-1"/> Admin</button></div>
          </div>
        </div>
      )}
    </header>
  );
};
