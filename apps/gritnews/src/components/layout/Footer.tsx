import React from 'react';
import { ArrowUpRight, Lock, ShieldCheck } from 'lucide-react';
import { Category } from '../../types';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug?: string) => void;
  onNavigateOffers: () => void;
  onOpenDocs: () => void;
  onNavigateAdmin?: () => void;
  onOpenContactModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, onSelectCategory, onNavigateAdmin, onOpenContactModal }) => {
  return (
    <footer className="bg-[#04131F] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5"><span className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center text-[#FF6A00] font-black text-xl">↗</span><div><strong className="text-2xl tracking-[-0.04em]">grit</strong><small className="block text-[9px] tracking-[0.16em] text-slate-400">SOLUÇÕES E NEGÓCIOS</small></div></div>
            <p className="text-sm text-slate-400 leading-relaxed">Consultoria, inteligência comercial e tecnologia aplicada para transformar problemas em movimento.</p>
            <p className="mt-4 text-xs font-black text-[#FF6A00]">Impulsionando o crescimento.</p>
          </div>
          <div><h4 className="text-xs font-black tracking-widest mb-4">SOLUÇÕES</h4><ul className="space-y-3 text-sm text-slate-400"><li>Inteligência Comercial</li><li>Revenue Operations</li><li>Atendimento & Pós-venda</li><li>Automação & IA</li><li>Dados, BI & Performance</li></ul></div>
          <div><h4 className="text-xs font-black tracking-widest mb-4">ECOSSISTEMA</h4><ul className="space-y-3 text-sm"><li><a className="text-slate-400 hover:text-[#FF6A00]" href="https://oportunidadespro.gritnews.com.br" target="_blank" rel="noreferrer">OportunidadesPro</a></li><li><a className="text-slate-400 hover:text-[#FF6A00]" href="https://apps.sacproh.gritnews.com.br" target="_blank" rel="noreferrer">GRIT SAC 4.0</a></li><li><a className="text-slate-400 hover:text-[#FF6A00]" href="https://meuespetinho.gritnews.com.br" target="_blank" rel="noreferrer">Meu Espetinho</a></li><li><button onClick={onOpenContactModal} className="text-slate-400 hover:text-[#FF6A00]">Fale com a GRIT</button></li></ul></div>
          <div><h4 className="text-xs font-black tracking-widest mb-4">INSIGHTS</h4><ul className="space-y-3 text-sm text-slate-400">{categories.slice(0,5).map(cat => <li key={cat.id}><button onClick={() => onSelectCategory(cat.slug)} className="hover:text-[#FF6A00]">{cat.name}</button></li>)}</ul></div>
        </div>
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500"><p>© 2026 GRIT Soluções e Negócios · gritnews.com.br</p><div className="flex items-center gap-4"><span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#FF6A00]"/> Tecnologia com governança</span>{onNavigateAdmin && <button onClick={onNavigateAdmin} className="flex items-center gap-1 hover:text-white"><Lock className="w-3 h-3"/> Acesso gerencial</button>}<a href="/sitemap.xml" className="inline-flex items-center gap-1 hover:text-white">Sitemap <ArrowUpRight className="w-3 h-3"/></a></div></div>
      </div>
    </footer>
  );
};
