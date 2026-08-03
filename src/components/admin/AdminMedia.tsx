import React, { useState, useEffect } from 'react';
import { Image, Upload, Search, Trash2, Copy, Check, Filter, Plus, ExternalLink, Tag, Sparkles } from 'lucide-react';
import { MediaAsset } from '../../types';
import { getMediaAssets, addMediaAsset, deleteMediaAsset, compressImageFile } from '../../lib/storage';

interface AdminMediaProps {
  onShowToast: (msg: string) => void;
}

export const AdminMedia: React.FC<AdminMediaProps> = ({ onShowToast }) => {
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Image Form Modal
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAltText, setNewAltText] = useState('');
  const [newCategory, setNewCategory] = useState('tecnologia');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = () => {
    setMediaList(getMediaAssets());
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onShowToast('URL da imagem copiada para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover esta imagem do acervo?')) {
      deleteMediaAsset(id);
      loadMedia();
      onShowToast('Imagem removida com sucesso');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newTitle) {
      onShowToast('Por favor, informe a URL e o Título da imagem');
      return;
    }

    addMediaAsset({
      title: newTitle,
      url: newUrl,
      altText: newAltText || newTitle,
      category: newCategory,
      source: 'upload',
      tags: newTags ? newTags.split(',').map(t => t.trim()) : [newCategory]
    });

    loadMedia();
    setIsAdding(false);
    setNewTitle('');
    setNewUrl('');
    setNewAltText('');
    setNewTags('');
    onShowToast('Nova imagem cadastrada no acervo do portal!');
  };

  const filteredMedia = mediaList.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#145EDB]/10 text-[#145EDB] rounded-xl">
              <Image className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-[#10233F]">Gerenciador de Mídia & Imagens</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Biblioteca centralizada de imagens em alta definição otimizadas para matérias, capas e banners.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Imagem</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'saude', label: 'Saúde' },
            { id: 'pet', label: 'Mercado Pet' },
            { id: 'tecnologia', label: 'Tecnologia & IA' },
            { id: 'automacao', label: 'Automação' },
            { id: 'importacao', label: 'Importação' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#10233F] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
          >
            {/* Image Preview */}
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              <img
                src={item.url}
                alt={item.altText}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                {item.category}
              </span>
            </div>

            {/* Info Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-xs text-[#10233F] line-clamp-1">{item.title}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 italic line-clamp-1">Alt: {item.altText}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag, i) => (
                    <span key={i} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => handleCopyUrl(item.id, item.url)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#145EDB] hover:text-[#0f4bb3] transition-colors"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Excluir imagem"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E2E8F0]">
          <Image className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#10233F]">Nenhuma imagem encontrada</h3>
          <p className="text-xs text-gray-500 mt-1">Tente ajustar a busca ou adicione uma nova imagem ao acervo.</p>
        </div>
      )}

      {/* Add Image Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-[#10233F] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#145EDB]" />
                Adicionar Imagem ao Acervo
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#10233F] mb-1">Título da Imagem</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Centro de Operações Logísticas"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10233F] mb-1">URL da Imagem / Vídeo ou Upload de Arquivo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://... ou escolha um arquivo"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
                  />
                  <label className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1 shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!newTitle) setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
                          if (file.type.startsWith('image/')) {
                            onShowToast('Otimizando imagem...', 'info');
                            const dataUrl = await compressImageFile(file);
                            if (dataUrl) {
                              setNewUrl(dataUrl);
                              onShowToast('Imagem otimizada e pronta!');
                            }
                          } else {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setNewUrl(evt.target.result as string);
                                onShowToast('Arquivo de vídeo carregado!');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10233F] mb-1">Categoria de Uso</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-[#10233F] focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
                >
                  <option value="saude">Saúde & Inovação</option>
                  <option value="pet">Mercado Pet</option>
                  <option value="tecnologia">Tecnologia & IA</option>
                  <option value="automacao">Automação & Logística</option>
                  <option value="importacao">Importação & B2B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10233F] mb-1">Texto Alternativo (Alt Text para SEO)</label>
                <input
                  type="text"
                  placeholder="Descrição da foto para acessibilidade e buscadores"
                  value={newAltText}
                  onChange={e => setNewAltText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10233F] mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="ia, hospital, robô"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Salvar no Acervo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
