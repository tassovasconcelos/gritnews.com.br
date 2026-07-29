import React from 'react';
import { ShieldCheck, ArrowUpRight, Lock, FileText, Mail, Heart, Rss } from 'lucide-react';
import { Category } from '../../types';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug?: string) => void;
  onNavigateOffers: () => void;
  onOpenDocs: () => void;
  onNavigateAdmin?: () => void;
  onOpenContactModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onNavigateOffers,
  onOpenDocs,
  onNavigateAdmin,
  onOpenContactModal
}) => {
  return (
    <footer className="bg-[#0B2343] text-white pt-12 pb-8 border-t border-[#145EDB]/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#145EDB] text-white font-black text-xl rounded-xl flex items-center justify-center">
                G
              </div>
              <div>
                <span className="text-xl font-black text-white">GRIT</span>
                <span className="text-xl font-black text-[#145EDB]">NEWS</span>
              </div>
            </div>
            <p className="text-sm text-[#EAF3FF] opacity-80 leading-relaxed max-w-sm">
              Plataforma de inteligência de mercado que conecta notícias, análises estratégicas, ofertas exclusivas e oportunidades de negócios no ecossistema GRIT.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#EAF3FF] font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
              <span>Domínio oficial: <strong>gritnews.com.br</strong></span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Categorias</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => onSelectCategory(cat.slug)}
                    className="hover:text-[#FF8500] transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Recomendações & Curadoria</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <a
                  href="https://meli.la/1kXwMJQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 font-extrabold transition-colors inline-flex items-center gap-1"
                >
                  <span>Lista Mercado Livre (Achados Tasso)</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.amazon.com.br/shop/tassovasconcelos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-amber-300 font-medium transition-colors inline-flex items-center gap-1"
                >
                  <span>Vitrine Amazon (Tasso Vasconcelos)</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button onClick={onNavigateOffers} className="hover:text-[#FF8500] transition-colors">
                  Central de Ofertas B2B
                </button>
              </li>
              <li>
                <button onClick={onOpenDocs} className="hover:text-[#FF8500] transition-colors">
                  Manual de Publicação & Hostinger
                </button>
              </li>
              <li>
                <a href="#editorial" onClick={e => { e.preventDefault(); onOpenDocs(); }} className="hover:text-[#FF8500]">
                  Política Editorial & E-E-A-T
                </a>
              </li>
              <li>
                <a href="#lgpd" onClick={e => { e.preventDefault(); onOpenDocs(); }} className="hover:text-[#FF8500]">
                  Privacidade e LGPD
                </a>
              </li>
              <li>
                <a href="#affiliates" onClick={e => { e.preventDefault(); onOpenDocs(); }} className="hover:text-[#FF8500]">
                  Transparência de Afiliados
                </a>
              </li>
              <li>
                <a href="/api/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-[#FF8500] inline-flex items-center gap-1">
                  <Rss className="w-3 h-3 text-[#FF8500]" />
                  <span>Sitemap XML</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Partner Note */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Ecossistema GRIT</h4>
            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              Anuncie sua marca, publique conteúdos patrocinados e gere leads qualificados no portal GRIT NEWS.
            </p>
            <button
              onClick={onOpenContactModal || onNavigateOffers}
              className="bg-[#FF8500] hover:bg-[#e07500] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>Seja Parceiro / Patrocinador</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 GRIT NEWS (gritnews.com.br) - Todos os direitos reservados. Informação que gera oportunidades.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#22A06B]" />
              Conexão Segura SSL 256-bit
            </span>
            <span>|</span>
            <span>Conformidade com a LGPD</span>
            {onNavigateAdmin && (
              <>
                <span>|</span>
                <button
                  onClick={onNavigateAdmin}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-mono text-[10px]"
                  title="Acesso Gerencial Restrito"
                >
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span>Acesso Restrito CMS</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
