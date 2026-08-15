import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Star, 
  ShieldCheck, 
  ExternalLink, 
  Download, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize, 
  DollarSign, 
  Phone, 
  Check, 
  X,
  Eye
} from 'lucide-react';
import { EusebioProperty, PropertyType, PropertyPurpose } from '../../types';
import { getEusebioProperties, saveEusebioProperties, addEusebioProperty, updateEusebioProperty, deleteEusebioProperty } from '../../lib/storage';

interface AdminImoveisProps {
  onShowToast: (msg: string) => void;
}

export const AdminImoveis: React.FC<AdminImoveisProps> = ({ onShowToast }) => {
  const [properties, setProperties] = useState<EusebioProperty[]>(() => getEusebioProperties());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<EusebioProperty | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<PropertyType>('casa_condominio');
  const [purpose, setPurpose] = useState<PropertyPurpose>('venda');
  const [price, setPrice] = useState<number>(1200000);
  const [condoFee, setCondoFee] = useState<number>(850);
  const [iptu, setIptu] = useState<number>(1800);
  const [neighborhood, setNeighborhood] = useState('Alphaville Eusébio');
  const [address, setAddress] = useState('Av. Eusébio de Queiroz, 2000');
  const [bedrooms, setBedrooms] = useState<number>(4);
  const [suites, setSuites] = useState<number>(4);
  const [bathrooms, setBathrooms] = useState<number>(5);
  const [garageSpots, setGarageSpots] = useState<number>(4);
  const [areaTotal, setAreaTotal] = useState<number>(450);
  const [areaPrivate, setAreaPrivate] = useState<number>(320);
  const [description, setDescription] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('Piscina privativa, Energia solar, Varanda gourmet, Closet master');
  const [imagesInput, setImagesInput] = useState('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200');
  const [featured, setFeatured] = useState(true);
  const [verified, setVerified] = useState(true);
  const [realtorName, setRealtorName] = useState('Imobiliária Conceito Eusébio');
  const [realtorCreci, setRealtorCreci] = useState('CRECI 12450-J');
  const [realtorPhone, setRealtorPhone] = useState('+5585998877665');

  const refreshProperties = () => {
    setProperties(getEusebioProperties());
  };

  const handleOpenCreateModal = () => {
    setEditingProperty(null);
    setTitle('');
    setSlug('');
    setType('casa_condominio');
    setPurpose('venda');
    setPrice(1500000);
    setCondoFee(900);
    setIptu(2100);
    setNeighborhood('Alphaville Eusébio');
    setAddress('');
    setBedrooms(4);
    setSuites(4);
    setBathrooms(5);
    setGarageSpots(4);
    setAreaTotal(450);
    setAreaPrivate(340);
    setDescription('Mansão de alto padrão recém-construída em localização nobre do Eusébio.');
    setHighlightsInput('Piscina privativa, Energia solar, Varanda gourmet, Closet master');
    setImagesInput('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200');
    setFeatured(false);
    setVerified(true);
    setRealtorName('Imobiliária Conceito Eusébio');
    setRealtorCreci('CRECI 12450-J');
    setRealtorPhone('+5585998877665');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prop: EusebioProperty) => {
    setEditingProperty(prop);
    setTitle(prop.title);
    setSlug(prop.slug);
    setType(prop.type);
    setPurpose(prop.purpose);
    setPrice(prop.price);
    setCondoFee(prop.condoFee || 0);
    setIptu(prop.iptu || 0);
    setNeighborhood(prop.neighborhood);
    setAddress(prop.address || '');
    setBedrooms(prop.bedrooms);
    setSuites(prop.suites);
    setBathrooms(prop.bathrooms);
    setGarageSpots(prop.garageSpots);
    setAreaTotal(prop.areaTotal);
    setAreaPrivate(prop.areaPrivate || prop.areaTotal);
    setDescription(prop.description);
    setHighlightsInput(prop.highlights.join(', '));
    setImagesInput(prop.images.join('\n'));
    setFeatured(prop.featured);
    setVerified(prop.verified);
    setRealtorName(prop.realtor.name);
    setRealtorCreci(prop.realtor.creci || '');
    setRealtorPhone(prop.realtor.phone);
    setIsModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || price <= 0) {
      onShowToast('Por favor, informe um título válido e o valor do imóvel.');
      return;
    }

    const highlights = highlightsInput
      .split(',')
      .map(h => h.trim())
      .filter(Boolean);

    const images = imagesInput
      .split('\n')
      .map(img => img.trim())
      .filter(Boolean);

    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200');
    }

    const generatedSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingProperty) {
      const updated: EusebioProperty = {
        ...editingProperty,
        title,
        slug: generatedSlug,
        type,
        purpose,
        price,
        condoFee,
        iptu,
        neighborhood,
        address,
        bedrooms,
        suites,
        bathrooms,
        garageSpots,
        areaTotal,
        areaPrivate,
        description,
        highlights,
        images,
        featured,
        verified,
        realtor: {
          ...editingProperty.realtor,
          name: realtorName,
          creci: realtorCreci,
          phone: realtorPhone
        }
      };
      updateEusebioProperty(updated);
      onShowToast('Imóvel atualizado com sucesso no catálogo do Eusébio.');
    } else {
      const created: EusebioProperty = {
        id: `prop-${Date.now()}`,
        title,
        slug: generatedSlug,
        type,
        purpose,
        price,
        condoFee,
        iptu,
        neighborhood,
        address,
        bedrooms,
        suites,
        bathrooms,
        garageSpots,
        areaTotal,
        areaPrivate,
        description,
        highlights,
        images,
        featured,
        verified,
        realtor: {
          name: realtorName,
          creci: realtorCreci,
          phone: realtorPhone
        },
        createdAt: new Date().toISOString(),
        viewsCount: 1
      };
      addEusebioProperty(created);
      onShowToast('Novo imóvel cadastrado com sucesso no Eusébio.');
    }

    refreshProperties();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, propTitle: string) => {
    if (window.confirm(`Tem certeza que deseja remover o imóvel "${propTitle}"?`)) {
      deleteEusebioProperty(id);
      refreshProperties();
      onShowToast('Imóvel excluído do sistema.');
    }
  };

  const handleToggleFeatured = (prop: EusebioProperty) => {
    const updated = { ...prop, featured: !prop.featured };
    updateEusebioProperty(updated);
    refreshProperties();
    onShowToast(`Imóvel ${updated.featured ? 'marcado como destaque' : 'removido dos destaques'}.`);
  };

  const handleToggleVerified = (prop: EusebioProperty) => {
    const updated = { ...prop, verified: !prop.verified };
    updateEusebioProperty(updated);
    refreshProperties();
    onShowToast(`Selo verificado ${updated.verified ? 'ativado' : 'desativado'}.`);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(properties, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `imoveis_eusebio_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Exportação do banco de imóveis concluída!');
  };

  // Filtered List
  const filtered = properties.filter(prop => {
    const matchesSearch = 
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPurpose = filterPurpose === 'all' || prop.purpose === filterPurpose;
    const matchesType = filterType === 'all' || prop.type === filterType;
    const matchesNeighborhood = filterNeighborhood === 'all' || prop.neighborhood === filterNeighborhood;

    return matchesSearch && matchesPurpose && matchesType && matchesNeighborhood;
  });

  const neighborhoodsList: string[] = Array.from(new Set(properties.map(p => p.neighborhood)));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0B2343]">Gestão de Imóveis no Eusébio</h1>
              <p className="text-xs text-slate-500 font-medium">
                Catálogo de casas em condomínio, lotes, salas comerciais e captações na Região Metropolitana
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-[#145EDB] hover:bg-[#0f4eb8] text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Imóvel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-bold uppercase">Total de Imóveis</p>
          <p className="text-2xl font-black text-[#0B2343] mt-1">{properties.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-bold uppercase">Para Venda</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {properties.filter(p => p.purpose === 'venda').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-bold uppercase">Para Locação</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {properties.filter(p => p.purpose === 'locacao').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-400 font-bold uppercase">Destaques da Capa</p>
          <p className="text-2xl font-black text-amber-500 mt-1">
            {properties.filter(p => p.featured).length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, condomínio, bairro..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#145EDB] focus:outline-none"
          />
        </div>

        <select
          value={filterPurpose}
          onChange={e => setFilterPurpose(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="all">Todas Finalidades</option>
          <option value="venda">Venda</option>
          <option value="locacao">Locação</option>
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="all">Todos os Tipos</option>
          <option value="casa_condominio">Casa em Condomínio</option>
          <option value="apartamento">Apartamento</option>
          <option value="lote_terreno">Lote / Terreno</option>
          <option value="comercial">Comercial</option>
        </select>

        <select
          value={filterNeighborhood}
          onChange={e => setFilterNeighborhood(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="all">Todos os Bairros</option>
          {neighborhoodsList.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Property List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-4">Imóvel</th>
                <th className="p-4">Tipo & Bairro</th>
                <th className="p-4">Finalidade & Valor</th>
                <th className="p-4">Estrutura</th>
                <th className="p-4">Corretor / Imobiliária</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(prop => (
                <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=300';
                        }}
                      />
                      <div>
                        <p className="font-black text-slate-900 line-clamp-1 max-w-[220px]">{prop.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {prop.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px] uppercase mb-1">
                      {prop.type.replace('_', ' ')}
                    </span>
                    <p className="text-slate-600 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{prop.neighborhood}</span>
                    </p>
                  </td>

                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-md font-black text-[10px] uppercase mb-1 ${
                      prop.purpose === 'venda' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {prop.purpose === 'venda' ? 'Venda' : 'Locação'}
                    </span>
                    <p className="text-sm font-black text-slate-900">
                      R$ {prop.price.toLocaleString('pt-BR')}
                    </p>
                    {prop.condoFee && (
                      <p className="text-[10px] text-slate-400">Cond: R$ {prop.condoFee}</p>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="space-y-0.5 text-[11px] text-slate-600">
                      <p>🛏️ {prop.bedrooms} quartos ({prop.suites} suítes)</p>
                      <p>🚗 {prop.garageSpots} vagas • 📐 {prop.areaTotal}m²</p>
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-slate-800">{prop.realtor.name}</p>
                    <p className="text-[11px] text-slate-500">{prop.realtor.phone}</p>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleToggleFeatured(prop)}
                        className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          prop.featured 
                            ? 'bg-amber-100 border-amber-300 text-amber-800' 
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title="Alternar Destaque"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px]">{prop.featured ? 'Destaque' : 'Comum'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleVerified(prop)}
                        className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          prop.verified 
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title="Alternar Verificado"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{prop.verified ? 'Verificado' : 'Pendente'}</span>
                      </button>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(prop)}
                        className="p-2 text-slate-600 hover:text-[#145EDB] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="Editar Imóvel"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prop.id, prop.title)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir Imóvel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum imóvel encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Property Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-[#0B2343]">
                {editingProperty ? 'Editar Imóvel no Eusébio' : 'Cadastrar Novo Imóvel no Eusébio'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Imóvel *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mansão Alphaville Eusébio 4 Suítes Piscina Privativa"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-[#145EDB] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo de Imóvel *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as PropertyType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="casa_condominio">Casa em Condomínio</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="lote_terreno">Lote / Terreno</option>
                    <option value="comercial">Comercial</option>
                    <option value="cobertura">Cobertura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Finalidade *</label>
                  <select
                    value={purpose}
                    onChange={e => setPurpose(e.target.value as PropertyPurpose)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="venda">Venda</option>
                    <option value="locacao">Locação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bairro / Condomínio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alphaville Eusébio"
                    value={neighborhood}
                    onChange={e => setNeighborhood(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Taxa Condomínio (R$)</label>
                  <input
                    type="number"
                    value={condoFee}
                    onChange={e => setCondoFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">IPTU Anual (R$)</label>
                  <input
                    type="number"
                    value={iptu}
                    onChange={e => setIptu(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Quartos</label>
                  <input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={e => setBedrooms(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Suítes</label>
                  <input
                    type="number"
                    min={0}
                    value={suites}
                    onChange={e => setSuites(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Banheiros</label>
                  <input
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={e => setBathrooms(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Vagas</label>
                  <input
                    type="number"
                    min={0}
                    value={garageSpots}
                    onChange={e => setGarageSpots(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Área Total (m²)</label>
                  <input
                    type="number"
                    min={0}
                    value={areaTotal}
                    onChange={e => setAreaTotal(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Área Priv. (m²)</label>
                  <input
                    type="number"
                    min={0}
                    value={areaPrivate}
                    onChange={e => setAreaPrivate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Diferenciais (separados por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: Piscina privativa, Energia solar, Varanda gourmet"
                  value={highlightsInput}
                  onChange={e => setHighlightsInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Descrição Completa</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              {/* Image URLs */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">URLs das Fotos (uma por linha)</label>
                <textarea
                  rows={2}
                  value={imagesInput}
                  onChange={e => setImagesInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px]"
                />
              </div>

              {/* Realtor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nome do Corretor / Agência *</label>
                  <input
                    type="text"
                    required
                    value={realtorName}
                    onChange={e => setRealtorName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">CRECI</label>
                  <input
                    type="text"
                    value={realtorCreci}
                    onChange={e => setRealtorCreci(e.target.value)}
                    placeholder="Ex: 12345-J"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">WhatsApp com DDD *</label>
                  <input
                    type="text"
                    required
                    value={realtorPhone}
                    onChange={e => setRealtorPhone(e.target.value)}
                    placeholder="+5585..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={e => setFeatured(e.target.checked)}
                    className="rounded text-[#145EDB] focus:ring-[#145EDB]"
                  />
                  <span className="font-bold text-slate-800">Destaque na Página Inicial</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={e => setVerified(e.target.checked)}
                    className="rounded text-[#145EDB] focus:ring-[#145EDB]"
                  />
                  <span className="font-bold text-slate-800">Selo de Verificado</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingProperty ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
