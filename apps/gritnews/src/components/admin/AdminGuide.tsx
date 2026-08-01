/**
 * ============================================================================
 * GUIA DO EDITOR, MANUAL DE ESPECIFICAÇÕES DE IMAGENS E MÍDIAS DO ECOSSISTEMA
 * ============================================================================
 * 
 * Este componente fornece aos administradores, editores e autores (incluindo Letícia Karla)
 * todas as orientações operacionais para manter o padrão profissional do ecossistema
 * GRIT NEWS e TenPets.
 * 
 * CONTEÚDO COBERTO:
 * 1. Resoluções e tamanhos ideais de fotos e banners.
 * 2. Incorporação de vídeos do YouTube/Vimeo e player de mídias.
 * 3. Criação de links para matérias externas, pesquisas científicas e mídias sociais.
 * 4. Estruturação de ofertas B2B, cupons e links de afiliados com rastreamento UTM.
 */

import React, { useState } from 'react';
import { Image, Video, Link, Tag, BookOpen, CheckCircle2, FileText, Info, Sparkles, ExternalLink, ShieldCheck, PawPrint, Download, Code } from 'lucide-react';

export const AdminGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'links' | 'offers' | 'code'>('images');

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner do Manual */}
      <div className="bg-gradient-to-r from-[#0B2343] via-blue-900 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Documentação Técnica & Manual Editorial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Guia do Editor, Mídias & Boas Práticas do Ecossistema
          </h1>
          <p className="text-sm text-slate-200 leading-relaxed font-light">
            Orientações completas sobre dimensões de imagens, integração de vídeos, estruturação de matérias externas do TenPets e parametrizador de links de afiliados.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'images'
              ? 'bg-[#145EDB] text-white shadow-md'
              : 'bg-white text-[#5C6B7A] hover:bg-[#F7F9FC]'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Tamanhos de Fotos & Resoluções</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'videos'
              ? 'bg-[#145EDB] text-white shadow-md'
              : 'bg-white text-[#5C6B7A] hover:bg-[#F7F9FC]'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Embeds de Vídeos & Mídia</span>
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'links'
              ? 'bg-[#145EDB] text-white shadow-md'
              : 'bg-white text-[#5C6B7A] hover:bg-[#F7F9FC]'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>Links Externos & Fontes TenPets</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'offers'
              ? 'bg-[#145EDB] text-white shadow-md'
              : 'bg-white text-[#5C6B7A] hover:bg-[#F7F9FC]'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Ofertas, Cupons & Afiliados</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'code'
              ? 'bg-[#145EDB] text-white shadow-md'
              : 'bg-white text-[#5C6B7A] hover:bg-[#F7F9FC]'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Comentários de Código & Arquitetura</span>
        </button>
      </div>

      {/* TAB 1: TAMANHOS E RESOLUÇÕES DE FOTOS */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#0B2343] flex items-center gap-2">
              <Image className="w-5 h-5 text-[#145EDB]" />
              <span>Padrões de Dimensão e Formatos Recomendados</span>
            </h2>
            <p className="text-xs text-[#5C6B7A]">
              Para manter o carregamento ultra-rápido no portal e evitar cortes indesejados no layout mobile e desktop, utilize as especificações abaixo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Card 1: Banner Hero Destaque */}
              <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0B2343]">Banner Hero Principal</span>
                  <span className="bg-[#145EDB]/10 text-[#145EDB] text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">2:1</span>
                </div>
                <div className="text-2xl font-black text-[#145EDB]">1200 x 600 px</div>
                <p className="text-xs text-[#5C6B7A]">Uso em matérias em destaque principal na Home e no Portal TenPets.</p>
                <div className="text-[11px] text-gray-500 font-mono pt-1">
                  • Peso máx: 350 KB<br />
                  • Formatos: WebP / JPG
                </div>
              </div>

              {/* Card 2: Thumbnails de Artigos */}
              <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0B2343]">Thumbnail do Artigo</span>
                  <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">16:9</span>
                </div>
                <div className="text-2xl font-black text-emerald-600">800 x 450 px</div>
                <p className="text-xs text-[#5C6B7A]">Imagens de capa padrão para notícias, artigos e matérias do blog.</p>
                <div className="text-[11px] text-gray-500 font-mono pt-1">
                  • Peso máx: 200 KB<br />
                  • Formatos: WebP / JPG
                </div>
              </div>

              {/* Card 3: Avatares de Autores (ex: Letícia Karla) */}
              <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0B2343]">Foto de Perfil / Autor</span>
                  <span className="bg-amber-500/10 text-amber-600 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">1:1</span>
                </div>
                <div className="text-2xl font-black text-amber-600">400 x 400 px</div>
                <p className="text-xs text-[#5C6B7A]">Fotos de perfil de colunistas, foto oficial de Letícia Karla no TenPets.</p>
                <div className="text-[11px] text-gray-500 font-mono pt-1">
                  • Peso máx: 100 KB<br />
                  • Formatos: PNG / JPG
                </div>
              </div>

              {/* Card 4: Cards de Ofertas */}
              <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0B2343]">Cards de Ofertas B2B</span>
                  <span className="bg-orange-500/10 text-orange-600 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">3:2</span>
                </div>
                <div className="text-2xl font-black text-orange-600">600 x 400 px</div>
                <p className="text-xs text-[#5C6B7A]">Imagens de produtos, cupons e serviços na Central de Ofertas.</p>
                <div className="text-[11px] text-gray-500 font-mono pt-1">
                  • Peso máx: 180 KB<br />
                  • Formatos: WebP / JPG
                </div>
              </div>

              {/* Card 5: Logos de Marcas */}
              <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0B2343]">Logotipos de Parceiros</span>
                  <span className="bg-purple-500/10 text-purple-600 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">2:1</span>
                </div>
                <div className="text-2xl font-black text-purple-600">400 x 200 px</div>
                <p className="text-xs text-[#5C6B7A]">Logos transparentes de clínicas, patrocinadores e parceiros GRIT.</p>
                <div className="text-[11px] text-gray-500 font-mono pt-1">
                  • Fundo: Transparente<br />
                  • Formato: PNG / SVG
                </div>
              </div>

              {/* Card 6: Banners de Anúncios Display */}
              <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0B2343]">Anúncio Banner Topo</span>
                  <span className="bg-slate-500/10 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">4:1</span>
                </div>
                <div className="text-2xl font-black text-slate-700">1200 x 300 px</div>
                <p className="text-xs text-[#5C6B7A]">Banners de anúncios de topo e rodapé do site.</p>
                <div className="text-[11px] text-gray-500 font-mono pt-1">
                  • Peso máx: 250 KB<br />
                  • Formatos: WebP / PNG
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMBEDS DE VÍDEOS */}
      {activeTab === 'videos' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0B2343] flex items-center gap-2">
            <Video className="w-5 h-5 text-[#145EDB]" />
            <span>Como Adicionar Vídeos aos Artigos e Notícias</span>
          </h2>

          <div className="space-y-4 text-xs text-[#10233F]">
            <p className="leading-relaxed">
              O ecossistema suporta incorporação responsiva de vídeos do <strong>YouTube</strong>, <strong>Vimeo</strong> e players de terceiros.
            </p>

            <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-4 rounded-xl space-y-2">
              <span className="font-bold text-[#0B2343] block">Formatos de Links Aceitos no Bloco de Vídeo:</span>
              <ul className="list-disc list-inside space-y-1 text-gray-600 font-mono">
                <li>https://www.youtube.com/watch?v=CODIGO_DO_VIDEO</li>
                <li>https://youtu.be/CODIGO_DO_VIDEO</li>
                <li>https://www.youtube.com/embed/CODIGO_DO_VIDEO</li>
                <li>https://player.vimeo.com/video/CODIGO_VIMEO</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Dica para a Seção TenPets (Letícia Karla)</span>
              </span>
              <p className="text-xs text-amber-800 leading-relaxed">
                Recomenda-se incorporar reportagens do Instagram Reels ou vídeos do YouTube sobre casos de reabilitação e resgates de animais diretamente no Bloco Mídia/Vídeo do editor de matérias.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LINKS EXTERNOS E HISTÓRIAS */}
      {activeTab === 'links' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0B2343] flex items-center gap-2">
            <Link className="w-5 h-5 text-[#145EDB]" />
            <span>Inclusão de Fontes, Blogs Externos e Artigos Científicos</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-4 rounded-xl space-y-2">
              <span className="font-bold text-[#0B2343] text-sm flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-amber-600" />
                <span>Fontes Científicas & DOI (TenPets)</span>
              </span>
              <p className="text-gray-600 leading-relaxed">
                Ao publicar estudos de Medicina Veterinária assinados por Letícia Karla, sempre inclua o número <strong>DOI</strong> (Digital Object Identifier) ou o link direto para o repositório científico da universidade no formulário de artigos.
              </p>
            </div>

            <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-4 rounded-xl space-y-2">
              <span className="font-bold text-[#0B2343] text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span>Redes Sociais & Instagram Oficial</span>
              </span>
              <p className="text-gray-600 leading-relaxed">
                Sempre vincule posts do Instagram oficial <strong>@tenpets_</strong> com o atributo <code className="bg-gray-200 px-1 rounded">rel="noreferrer"</code> para garantir segurança e autoridade SEO.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFERTAS E AFILIADOS */}
      {activeTab === 'offers' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0B2343] flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#FF8500]" />
            <span>Parametrização de Ofertas, Produtos e Links de Afiliados</span>
          </h2>

          <p className="text-xs text-[#5C6B7A] leading-relaxed">
            Todas as ofertas B2B e links de parceiros comerciais devem ser cadastrados no módulo <strong>Ofertas & Afiliados</strong>.
          </p>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs space-y-2">
            <span className="text-amber-400 font-bold">Exemplo de URL com Rastreamento UTM Padrão GRIT NEWS:</span>
            <div className="bg-black/50 p-3 rounded-xl overflow-x-auto text-emerald-300">
              https://parceiro.com.br/produto?utm_source=gritnews&utm_medium=offers_portal&utm_campaign=black_friday_vet
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COMENTÁRIOS E ARQUITETURA DE CÓDIGO */}
      {activeTab === 'code' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0B2343] flex items-center gap-2">
            <Code className="w-5 h-5 text-[#145EDB]" />
            <span>Padrões de Código e Comentários Explicativos</span>
          </h2>

          <p className="text-xs text-[#5C6B7A] leading-relaxed">
            Os arquivos do projeto foram comentados com detalhamento instrucional para facilitar a manutenção futura, segurança e integrações.
          </p>

          <div className="space-y-3 text-xs">
            <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-3.5 rounded-xl">
              <span className="font-bold text-[#0B2343] block">`src/components/admin/AdminLoginScreen.tsx`</span>
              <p className="text-gray-600">Trata da barreira de login restrita com usuário e senha, criptografia visual e controle RBAC.</p>
            </div>

            <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-3.5 rounded-xl">
              <span className="font-bold text-[#0B2343] block">`src/components/admin/AdminLayout.tsx`</span>
              <p className="text-gray-600">Painel administrativo completo com gerenciamento de sessão, abas de publicações e logout seguro.</p>
            </div>

            <div className="bg-[#F7F9FC] border border-[#E2E8F0] p-3.5 rounded-xl">
              <span className="font-bold text-[#0B2343] block">`src/components/views/TenPetsView.tsx`</span>
              <p className="text-gray-600">Página do ecossistema TenPets com marca oficial, conteúdos da Letícia Karla e feed do Instagram @tenpets_.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
