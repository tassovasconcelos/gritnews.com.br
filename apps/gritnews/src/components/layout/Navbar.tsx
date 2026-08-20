import React, { useState } from 'react';
import { Bookmark, LayoutDashboard, Menu, Search, X } from 'lucide-react';
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
  onOpenContactModal?: () => void;
  bookmarksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateBookmarks,
  onNavigateAdmin,
  onSearch,
  onNavigateHome,
  bookmarksCount
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const scrollTo = (id: string) => {
    if (window.location.pathname !== '/' || window.location.search) onNavigateHome();
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#061C2D]/95 backdrop-blur-xl border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 h-[76px] flex items-center justify-between gap-5">
        <button onClick={onNavigateHome} className="flex items-center gap-3 shrink-0">
          <span className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center text-[#FF6A00] font-black text-xl">↗</span>
          <span className="text-left"><strong className="block text-2xl leading-none tracking-[-0.04em]">grit</strong><small className="block text-[9px] tracking-[0.16em] text-slate-300 mt-1">SOLUÇÕES E NEGÓCIOS</small></span>
        </button>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-200">
          <button onClick={onNavigateHome} className="hover:text-[#FF6A00]">Início</button>
          <button onClick={() => scrollTo('solucoes')} className="hover:text-[#FF6A00]">Soluções</button>
          <button onClick={() => scrollTo('produtos')} className="hover:text-[#FF6A00]">Aplicativos</button>
          <button onClick={() => scrollTo('insights')} className="hover:text-[#FF6A00]">Insights</button>
          <button onClick={() => scrollTo('metodo')} className="hover:text-[#FF6A00]">Método</button>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => setSearchOpen(v => !v)} className="w-10 h-10 rounded-xl border border-white/15 hover:bg-white/10 flex items-center justify-center" aria-label="Buscar"><Search className="w-4 h-4"/></button>
          <button onClick={onNavigateBookmarks} className="relative w-10 h-10 rounded-xl border border-white/15 hover:bg-white/10 flex items-center justify-center" aria-label="Salvos"><Bookmark className="w-4 h-4"/>{bookmarksCount > 0 && <span className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-[#FF6A00] text-[9px] grid place-items-center">{bookmarksCount}</span>}</button>
          <button onClick={() => scrollTo('diagnostico')} className="bg-[#FF6A00] hover:bg-[#e65f00] px-4 py-2.5 rounded-xl font-black text-sm">Diagnóstico GRIT</button>
          <button onClick={onNavigateAdmin} className="w-10 h-10 rounded-xl border border-white/15 hover:bg-white/10 flex items-center justify-center" title="Acesso gerencial"><LayoutDashboard className="w-4 h-4"/></button>
        </div>

        <button onClick={() => setMobileOpen(v => !v)} className="lg:hidden w-10 h-10 rounded-xl border border-white/15 flex items-center justify-center">{mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}</button>
      </div>

      {searchOpen && <div className="border-t border-white/10 bg-[#071A2A]"><form onSubmit={submitSearch} className="max-w-7xl mx-auto px-4 py-3 flex gap-2"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar artigos, inteligência comercial, vendas, IA..." className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6A00]"/><button className="bg-[#FF6A00] px-5 rounded-xl font-black text-sm">Buscar</button></form></div>}

      {mobileOpen && <div className="lg:hidden border-t border-white/10 bg-[#071A2A] px-4 py-4 space-y-2 text-sm font-bold"><button onClick={onNavigateHome} className="block w-full text-left px-3 py-3 rounded-xl hover:bg-white/10">Início</button><button onClick={() => scrollTo('solucoes')} className="block w-full text-left px-3 py-3 rounded-xl hover:bg-white/10">Soluções</button><button onClick={() => scrollTo('produtos')} className="block w-full text-left px-3 py-3 rounded-xl hover:bg-white/10">Aplicativos</button><button onClick={() => scrollTo('insights')} className="block w-full text-left px-3 py-3 rounded-xl hover:bg-white/10">Insights</button><button onClick={() => scrollTo('metodo')} className="block w-full text-left px-3 py-3 rounded-xl hover:bg-white/10">Método</button><button onClick={() => scrollTo('diagnostico')} className="block w-full text-left px-3 py-3 rounded-xl bg-[#FF6A00] text-white">Diagnóstico GRIT</button></div>}
    </header>
  );
};
