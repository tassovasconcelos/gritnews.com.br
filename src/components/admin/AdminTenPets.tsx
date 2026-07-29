import React, { useState } from 'react';
import { 
  PawPrint, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Heart, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { TenPetsArticle, TenPetsRescue, TenPetsPartner } from '../../types';
import { 
  getTenPetsArticles, 
  addTenPetsArticle, 
  updateTenPetsArticle, 
  deleteTenPetsArticle,
  getTenPetsRescues,
  addTenPetsRescue,
  updateTenPetsRescue,
  deleteTenPetsRescue,
  getTenPetsPartners,
  addTenPetsPartner,
  deleteTenPetsPartner
} from '../../lib/storage';
import { syncLocalDataToSupabase } from '../../lib/supabase';

interface AdminTenPetsProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const AdminTenPets: React.FC<AdminTenPetsProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'rescues' | 'partners'>('articles');

  const [articles, setArticles] = useState<TenPetsArticle[]>(getTenPetsArticles());
  const [rescues, setRescues] = useState<TenPetsRescue[]>(getTenPetsRescues());
  const [partners, setPartners] = useState<TenPetsPartner[]>(getTenPetsPartners());

  // Form states - Article
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState<'Científico' | 'Direito Animal' | 'Casos Clínicos' | 'Opinião Vet'>('Científico');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800');
  const [artPdfUrl, setArtPdfUrl] = useState('');
  const [artDoi, setArtDoi] = useState('');
  const [editingArtId, setEditingArtId] = useState<string | null>(null);

  // Form states - Rescue
  const [resAnimalName, setResAnimalName] = useState('');
  const [resSpecies, setResSpecies] = useState<'Cão' | 'Gato' | 'Silvestre' | 'Outro'>('Cão');
  const [resBreed, setResBreed] = useState('SRD');
  const [resTitle, setResTitle] = useState('');
  const [resSummary, setResSummary] = useState('');
  const [resStory, setResStory] = useState('');
  const [resStatus, setResStatus] = useState<'EM_TRATAMENTO' | 'RECUPERADO' | 'ADOTADO' | 'VITORIA_MEDICA'>('RECUPERADO');
  const [resBeforeImg, setResBeforeImg] = useState('https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800');
  const [resAfterImg, setResAfterImg] = useState('https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800');
  const [resVideoUrl, setResVideoUrl] = useState('');
  const [resVetNotes, setResVetNotes] = useState('');
  const [resSponsorGoal, setResSponsorGoal] = useState<number>(3000);
  const [resSponsorTotal, setResSponsorTotal] = useState<number>(3000);
  const [editingResId, setEditingResId] = useState<string | null>(null);

  // Form states - Partner
  const [partName, setPartName] = useState('');
  const [partType, setPartType] = useState<'Clínica Veterinária' | 'ONG Proteção' | 'Laboratório' | 'Pet Food' | 'Apoiador'>('Clínica Veterinária');
  const [partLogo, setPartLogo] = useState('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300');
  const [partDesc, setPartDesc] = useState('');
  const [partWeb, setPartWeb] = useState('https://tenpets.gritnews.com.br');
  const [partBenefit, setPartBenefit] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with Supabase
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    const result = await syncLocalDataToSupabase();
    setIsSyncing(false);
    if (result.success) {
      onShowToast(result.message, 'success');
    } else {
      onShowToast(result.message, 'info');
    }
  };

  // Article Handlers
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artSummary || !artContent) {
      onShowToast('Preencha título, resumo e conteúdo do artigo.', 'info');
      return;
    }

    const item: TenPetsArticle = {
      id: editingArtId || `tp-art-${Date.now()}`,
      title: artTitle,
      slug: artTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: artSummary,
      content: artContent,
      authorName: 'Letícia Karla',
      category: artCategory,
      publishedAt: new Date().toISOString(),
      imageUrl: artImageUrl,
      pdfUrl: artPdfUrl || undefined,
      doi: artDoi || undefined,
      viewsCount: 1,
      featured: true,
      tags: ['Medicina Veterinária', 'TenPets', 'Letícia Karla']
    };

    if (editingArtId) {
      updateTenPetsArticle(item);
      onShowToast('Artigo atualizado com sucesso!', 'success');
    } else {
      addTenPetsArticle(item);
      onShowToast('Novo artigo publicado com sucesso!', 'success');
    }

    setArticles(getTenPetsArticles());
    resetArticleForm();
  };

  const resetArticleForm = () => {
    setEditingArtId(null);
    setArtTitle('');
    setArtCategory('Científico');
    setArtSummary('');
    setArtContent('');
    setArtPdfUrl('');
    setArtDoi('');
  };

  const handleEditArticle = (a: TenPetsArticle) => {
    setEditingArtId(a.id);
    setArtTitle(a.title);
    setArtCategory(a.category);
    setArtSummary(a.summary);
    setArtContent(a.content);
    setArtImageUrl(a.imageUrl);
    setArtPdfUrl(a.pdfUrl || '');
    setArtDoi(a.doi || '');
  };

  const handleDeleteArticle = (id: string) => {
    deleteTenPetsArticle(id);
    setArticles(getTenPetsArticles());
    onShowToast('Artigo removido.', 'info');
  };

  // Rescue Handlers
  const handleSaveRescue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resAnimalName || !resTitle || !resStory) {
      onShowToast('Preencha nome do animal, título e a história romanceada.', 'info');
      return;
    }

    const item: TenPetsRescue = {
      id: editingResId || `tp-res-${Date.now()}`,
      animalName: resAnimalName,
      species: resSpecies,
      breed: resBreed,
      title: resTitle,
      summary: resSummary || resStory.substring(0, 150),
      romanticStory: resStory,
      rescueDate: new Date().toISOString().split('T')[0],
      status: resStatus,
      beforeImageUrl: resBeforeImg,
      afterImageUrl: resAfterImg,
      videoUrl: resVideoUrl || undefined,
      vetCareNotes: resVetNotes,
      sponsorGoal: resSponsorGoal,
      currentSponsorTotal: resSponsorTotal,
      featured: true
    };

    if (editingResId) {
      updateTenPetsRescue(item);
      onShowToast('Caso de resgate atualizado!', 'success');
    } else {
      addTenPetsRescue(item);
      onShowToast('Novo caso de resgate publicado!', 'success');
    }

    setRescues(getTenPetsRescues());
    resetRescueForm();
  };

  const resetRescueForm = () => {
    setEditingResId(null);
    setResAnimalName('');
    setResTitle('');
    setResSummary('');
    setResStory('');
    setResVetNotes('');
    setResVideoUrl('');
  };

  const handleEditRescue = (r: TenPetsRescue) => {
    setEditingResId(r.id);
    setResAnimalName(r.animalName);
    setResSpecies(r.species);
    setResBreed(r.breed || 'SRD');
    setResTitle(r.title);
    setResSummary(r.summary);
    setResStory(r.romanticStory);
    setResStatus(r.status);
    setResBeforeImg(r.beforeImageUrl);
    setResAfterImg(r.afterImageUrl);
    setResVideoUrl(r.videoUrl || '');
    setResVetNotes(r.vetCareNotes);
    setResSponsorGoal(r.sponsorGoal || 3000);
    setResSponsorTotal(r.currentSponsorTotal || 3000);
  };

  const handleDeleteRescue = (id: string) => {
    deleteTenPetsRescue(id);
    setRescues(getTenPetsRescues());
    onShowToast('Resgate removido.', 'info');
  };

  // Partner Handlers
  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName || !partDesc) {
      onShowToast('Preencha o nome e a descrição do parceiro.', 'info');
      return;
    }

    const item: TenPetsPartner = {
      id: `tp-part-${Date.now()}`,
      name: partName,
      type: partType,
      logoUrl: partLogo,
      description: partDesc,
      websiteUrl: partWeb,
      discountBenefit: partBenefit,
      featured: true
    };

    addTenPetsPartner(item);
    setPartners(getTenPetsPartners());
    onShowToast('Novo parceiro TenPets cadastrado com sucesso!', 'success');
    setPartName('');
    setPartDesc('');
    setPartBenefit('');
  };

  const handleDeletePartner = (id: string) => {
    deleteTenPetsPartner(id);
    setPartners(getTenPetsPartners());
    onShowToast('Parceiro removido.', 'info');
  };

  return (
    <div className="space-y-8 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* Header & Subdomain Control */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <PawPrint className="w-4 h-4" />
            <span>Módulo Gerencial Exclusivo TenPets</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">
            Gestão de Ciência Veterinária & Casos de Resgate (Letícia Karla)
          </h1>
          <p className="text-xs text-amber-100 mt-1">
            Subdomínio ativo: <strong className="underline">tenpets.gritnews.com.br</strong>
          </p>
        </div>

        <button
          onClick={handleSyncSupabase}
          disabled={isSyncing}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Exportar para Supabase'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('articles')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'articles'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Artigos Científicos ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rescues')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rescues'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Casos de Resgate Romanceados ({rescues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'partners'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Rede de Parceiros ({partners.length})</span>
        </button>
      </div>

      {/* TAB 1: ARTICLES */}
      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>{editingArtId ? 'Editar Artigo Científico' : 'Novo Artigo Científico / Jurídico'}</span>
            </h3>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Título do Artigo *</label>
                <input
                  type="text"
                  required
                  value={artTitle}
                  onChange={e => setArtTitle(e.target.value)}
                  placeholder="Ex: Avanços Terapêuticos em Dermatite Canina"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Categoria *</label>
                <select
                  value={artCategory}
                  onChange={e => setArtCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                >
                  <option value="Científico">Científico Veterinário</option>
                  <option value="Direito Animal">Direito Animal</option>
                  <option value="Casos Clínicos">Casos Clínicos</option>
                  <option value="Opinião Vet">Opinião Vet</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Resumo Executivo *</label>
                <textarea
                  rows={2}
                  required
                  value={artSummary}
                  onChange={e => setArtSummary(e.target.value)}
                  placeholder="Breve resumo para listagens e SEO..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Conteúdo Completo *</label>
                <textarea
                  rows={6}
                  required
                  value={artContent}
                  onChange={e => setArtContent(e.target.value)}
                  placeholder="Escreva a íntegra da pesquisa ou parecer jurídico..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Link do PDF</label>
                  <input
                    type="url"
                    value={artPdfUrl}
                    onChange={e => setArtPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">DOI (se houver)</label>
                  <input
                    type="text"
                    value={artDoi}
                    onChange={e => setArtDoi(e.target.value)}
                    placeholder="10.1016/j..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Artigo</span>
                </button>
                {editingArtId && (
                  <button
                    type="button"
                    onClick={resetArticleForm}
                    className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-4 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Artigos Publicados ({articles.length})</h3>
            {articles.map(art => (
              <div
                key={art.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    {art.category}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{art.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{art.summary}</p>
                  <span className="text-[10px] text-slate-400 block">Autor: {art.authorName}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditArticle(art)}
                    className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(art.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RESCUES */}
      {activeTab === 'rescues' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>{editingResId ? 'Editar Caso de Resgate' : 'Novo Caso de Resgate Romanceado'}</span>
            </h3>

            <form onSubmit={handleSaveRescue} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Nome do Animal *</label>
                  <input
                    type="text"
                    required
                    value={resAnimalName}
                    onChange={e => setResAnimalName(e.target.value)}
                    placeholder="Ex: Valente Thor"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Espécie</label>
                  <select
                    value={resSpecies}
                    onChange={e => setResSpecies(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                  >
                    <option value="Cão">Cão</option>
                    <option value="Gato">Gato</option>
                    <option value="Silvestre">Silvestre</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Título da História Romanceada *</label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={e => setResTitle(e.target.value)}
                  placeholder="Ex: De Sobrevivente do Asfalto a Campeão do Afeto"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">História Romanceada do Resgate *</label>
                <textarea
                  rows={5}
                  required
                  value={resStory}
                  onChange={e => setResStory(e.target.value)}
                  placeholder="Conte a narrativa emocionante do resgate, a superação dos desafios e a vitoria..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Cuidados Veterinários / Prontuário</label>
                <textarea
                  rows={2}
                  value={resVetNotes}
                  onChange={e => setResVetNotes(e.target.value)}
                  placeholder="Medicamentos, cirurgias realizada, laserterapia..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Imagem Antes (URL)</label>
                  <input
                    type="url"
                    value={resBeforeImg}
                    onChange={e => setResBeforeImg(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Imagem Depois (URL)</label>
                  <input
                    type="url"
                    value={resAfterImg}
                    onChange={e => setResAfterImg(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">URL de Vídeo (YouTube/Vimeo)</label>
                <input
                  type="url"
                  value={resVideoUrl}
                  onChange={e => setResVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Caso de Resgate</span>
                </button>
                {editingResId && (
                  <button
                    type="button"
                    onClick={resetRescueForm}
                    className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-4 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Casos de Resgate Cadastrados ({rescues.length})</h3>
            {rescues.map(res => (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <img src={res.afterImageUrl} alt={res.animalName} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {res.status.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{res.animalName}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 italic">"{res.title}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditRescue(res)}
                    className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRescue(res.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PARTNERS */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Novo Parceiro TenPets</span>
            </h3>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nome do Parceiro *</label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={e => setPartName(e.target.value)}
                  placeholder="Ex: Hospital Veterinário 24h VetLife"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tipo de Parceiro</label>
                <select
                  value={partType}
                  onChange={e => setPartType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                >
                  <option value="Clínica Veterinária">Clínica Veterinária</option>
                  <option value="ONG Proteção">ONG Proteção</option>
                  <option value="Laboratório">Laboratório</option>
                  <option value="Pet Food">Pet Food</option>
                  <option value="Apoiador">Apoiador</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Descrição *</label>
                <textarea
                  rows={3}
                  required
                  value={partDesc}
                  onChange={e => setPartDesc(e.target.value)}
                  placeholder="Descreva a parceria e o apoio..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Benefício / Custo Social</label>
                <input
                  type="text"
                  value={partBenefit}
                  onChange={e => setPartBenefit(e.target.value)}
                  placeholder="Ex: Custo social para cirurgias e exames de resgatados"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Cadastrar Parceiro</span>
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Rede de Parceiros TenPets ({partners.length})</h3>
            {partners.map(p => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {p.type}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                </div>

                <button
                  onClick={() => handleDeletePartner(p.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
