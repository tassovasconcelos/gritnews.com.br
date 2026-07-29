import React, { useState } from 'react';
import {
  Box,
  Search,
  ShieldCheck,
  FileDown,
  ExternalLink,
  MessageSquare,
  Check,
  Sparkles
} from 'lucide-react';
import { SacProhProduct } from '../types';

interface CatalogModuleProps {
  products: SacProhProduct[];
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const CatalogModule: React.FC<CatalogModuleProps> = ({
  products,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.anvisaRegister.includes(searchTerm);

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-sky-400" />
              <span>Catálogo Técnico ProCirúrgica & Registros ANVISA</span>
            </h2>
            <p className="text-xs text-slate-400">
              Equipamentos, OPME e insumos hospitalares para centro cirúrgico com documentação regulatória
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por equipamento, código ou registro ANVISA..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-sky-500"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="Equipamentos Cirúrgicos">Equipamentos Cirúrgicos</option>
              <option value="OPME & Próteses">OPME & Próteses</option>
              <option value="Insumos & Esterilização">Insumos & Esterilização</option>
              <option value="Instrumental Cirúrgico">Instrumental Cirúrgico</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-xl group"
          >
            <div>
              <div className="relative h-48 bg-slate-900 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-sky-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border border-sky-800/50">
                  {product.code}
                </div>
                <div className="absolute top-3 right-3 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold px-2 py-1 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ANVISA: {product.anvisaRegister}</span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                  {product.category}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                  {product.name}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {product.description}
                </p>

                {product.technicalDataSheet && (
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono">
                    {product.technicalDataSheet}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 pt-0 space-y-3 border-t border-slate-800/80 mt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Garantia de Fábrica: <strong>{product.warrantyMonths} Meses</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Estoque Hospitalar
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/5585991234455?text=Olá,%20gostaria%20de%20solicitar%20cotação%20para%20o%20item%20ProCirúrgica%20${product.code}%20(${product.name})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Solicitar Cotação</span>
                </a>

                <button
                  onClick={() => onShowToast(`Manual do produto ${product.code} enviado para o e-mail de suporte.`, 'info')}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Baixar Manual Técnico PDF"
                >
                  <FileDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
