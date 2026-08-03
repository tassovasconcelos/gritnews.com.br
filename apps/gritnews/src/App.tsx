import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/views/HomeView';
import { ArticleDetailView } from './components/views/ArticleDetailView';
import { CategoryView } from './components/views/CategoryView';
import { OffersView } from './components/views/OffersView';
import { AuthorView } from './components/views/AuthorView';
import { PartnerView } from './components/views/PartnerView';
import { SearchView } from './components/views/SearchView';
import { BookmarksView } from './components/views/BookmarksView';
import { TagView } from './components/views/TagView';
import { DocumentationModal } from './components/views/DocumentationModal';
import { TenPetsView } from './components/views/TenPetsView';
import { AdminLayout } from './components/admin/AdminLayout';
import { Toast, Modal, ContactPartnershipModal } from '@gritnews/ui';
import {
  getArticles,
  getCategories,
  getAuthors,
  getPartners,
  getOffers,
  getAds,
  getLeads,
  getSubscribers,
  addLead,
  getBookmarks,
  initInitialDataIfEmpty
} from './lib/storage';
import { Article, Category, AuthorProfile, Partner, Offer, AdCampaign, Lead, NewsletterSubscriber } from '@gritnews/types';
import { injectWebsiteSchema } from './lib/seo';

type ViewMode =
  | 'home'
  | 'article'
  | 'category'
  | 'offers'
  | 'author'
  | 'partner'
  | 'search'
  | 'bookmarks'
  | 'tag'
  | 'tenpets'
  | 'admin';

const resolveRouteFromUrl = (
  allArticles: Article[],
  allCategories: Category[],
  allAuthors: AuthorProfile[],
  allPartners: Partner[]
) => {
  if (typeof window === 'undefined') return { view: 'home' as ViewMode };

  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname;
  const pathLower = path.toLowerCase();
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const hash = window.location.hash;

  // 1. TenPets Subdomain / View
  if (
    host.startsWith('tenpets') ||
    host.includes('tenpets.') ||
    pathLower.includes('/tenpets') ||
    params.get('view') === 'tenpets' ||
    params.get('subdomain') === 'tenpets' ||
    hash.includes('tenpets')
  ) {
    return { view: 'tenpets' as ViewMode };
  }

  // 3. Admin / Offers / Bookmarks
  if (params.get('view') === 'admin' || pathLower.includes('/admin')) return { view: 'admin' as ViewMode };
  if (params.get('view') === 'offers' || pathLower.includes('/offers')) return { view: 'offers' as ViewMode };
  if (params.get('view') === 'bookmarks' || pathLower.includes('/bookmarks')) return { view: 'bookmarks' as ViewMode };

  // 4. Article Lookup by slug, artigo, article, noticia, art, id, or direct path
  const articleParam =
    params.get('artigo') ||
    params.get('article') ||
    params.get('noticia') ||
    params.get('art') ||
    params.get('slug') ||
    params.get('id');

  let targetSlugOrId = articleParam;

  if (!targetSlugOrId) {
    if (pathLower.includes('/noticia/') || pathLower.includes('/artigo/') || pathLower.includes('/materia/')) {
      const parts = path.split('/').filter(Boolean);
      targetSlugOrId = parts[parts.length - 1];
    } else if (hash.includes('noticia/') || hash.includes('artigo/')) {
      const parts = hash.split('/').filter(Boolean);
      targetSlugOrId = parts[parts.length - 1];
    } else if (path !== '/' && path !== '' && !pathLower.includes('/tenpets')) {
      const cleanPath = path.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (cleanPath) {
        targetSlugOrId = cleanPath;
      }
    }
  }

  if (targetSlugOrId) {
    const lowerTarget = targetSlugOrId.toLowerCase();
    const foundArt = allArticles.find(
      a =>
        a.slug === targetSlugOrId ||
        a.id === targetSlugOrId ||
        a.slug?.toLowerCase() === lowerTarget ||
        (lowerTarget.includes('vida') && (a.id === 'art-vida-da-vida' || a.slug.includes('vida')))
    );
    if (foundArt) {
      return { view: 'article' as ViewMode, article: foundArt };
    }
  }

  // 5. Category Lookup
  const catParam = params.get('categoria') || params.get('category') || params.get('cat');
  if (catParam) {
    const foundCat = allCategories.find(c => c.slug === catParam || c.id === catParam);
    if (foundCat) return { view: 'category' as ViewMode, category: foundCat };
  }

  // 6. Author Lookup
  const autParam = params.get('autor') || params.get('author');
  if (autParam) {
    const foundAut = allAuthors.find(a => a.id === autParam);
    if (foundAut) return { view: 'author' as ViewMode, author: foundAut };
  }

  // 7. Partner Lookup
  const prtParam = params.get('parceiro') || params.get('partner');
  if (prtParam) {
    const foundPrt = allPartners.find(p => p.id === prtParam || p.slug === prtParam);
    if (foundPrt) return { view: 'partner' as ViewMode, partner: foundPrt };
  }

  // 8. Tag Lookup
  const tagParam = params.get('tag');
  if (tagParam) return { view: 'tag' as ViewMode, tag: decodeURIComponent(tagParam) };

  // 9. Search Lookup
  const searchParam = params.get('busca') || params.get('search') || params.get('q');
  if (searchParam) return { view: 'search' as ViewMode, searchQuery: decodeURIComponent(searchParam) };

  return { view: 'home' as ViewMode };
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorProfile | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Lead Quote
  const [leadModalOffer, setLeadModalOffer] = useState<Offer | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadMessage, setLeadMessage] = useState('');

  // Manuals Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // State Data
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<AuthorProfile[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);

  const syncRouteState = (
    loadedArticles = articles,
    loadedCategories = categories,
    loadedAuthors = authors,
    loadedPartners = partners
  ) => {
    const route = resolveRouteFromUrl(loadedArticles, loadedCategories, loadedAuthors, loadedPartners);
    setCurrentView(route.view);
    if (route.article) setSelectedArticle(route.article);
    if (route.category) setSelectedCategory(route.category);
    if (route.author) setSelectedAuthor(route.author);
    if (route.partner) setSelectedPartner(route.partner);
    if (route.tag) setSelectedTag(route.tag);
    if (route.searchQuery) setSearchQuery(route.searchQuery);
  };

  const loadData = () => {
    initInitialDataIfEmpty();
    const fetchedArticles = getArticles();
    const fetchedCategories = getCategories();
    const fetchedAuthors = getAuthors();
    const fetchedPartners = getPartners();

    setArticles(fetchedArticles);
    setCategories(fetchedCategories);
    setAuthors(fetchedAuthors);
    setPartners(fetchedPartners);
    setOffers(getOffers());
    setAds(getAds());
    setLeads(getLeads());
    setSubscribers(getSubscribers());

    syncRouteState(fetchedArticles, fetchedCategories, fetchedAuthors, fetchedPartners);
  };

  useEffect(() => {
    loadData();
    injectWebsiteSchema();

    const handlePopState = () => {
      syncRouteState();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handleSelectArticle = (art: Article) => {
    setSelectedArticle(art);
    setCurrentView('article');
    const targetSlug = art.slug || art.id;
    const newUrl = `?artigo=${targetSlug}`;
    if (window.location.search !== newUrl) {
      window.history.pushState({ view: 'article', articleId: art.id, slug: art.slug }, '', newUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catOrSlug?: Category | string) => {
    if (!catOrSlug) {
      setCurrentView('home');
      return;
    }
    const cat = typeof catOrSlug === 'string'
      ? categories.find(c => c.slug === catOrSlug || c.id === catOrSlug)
      : catOrSlug;
    if (!cat) return;
    setSelectedCategory(cat);
    setCurrentView('category');
    const newUrl = `?categoria=${cat.slug}`;
    window.history.pushState({ view: 'category', categoryId: cat.id }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setCurrentView('tag');
    const newUrl = `?tag=${encodeURIComponent(tag)}`;
    window.history.pushState({ view: 'tag', tag }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAuthor = (aut: AuthorProfile) => {
    setSelectedAuthor(aut);
    setCurrentView('author');
    const newUrl = `?autor=${aut.id}`;
    window.history.pushState({ view: 'author', authorId: aut.id }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPartner = (prt: Partner) => {
    setSelectedPartner(prt);
    setCurrentView('partner');
    const newUrl = `?parceiro=${prt.id}`;
    window.history.pushState({ view: 'partner', partnerId: prt.id }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentView('search');
    const newUrl = `?q=${encodeURIComponent(q)}`;
    window.history.pushState({ view: 'search', q }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setSelectedArticle(null);
    setSelectedCategory(null);
    setCurrentView('home');
    if (window.location.search || window.location.pathname !== '/') {
      window.history.pushState({ view: 'home' }, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateOffers = () => {
    setCurrentView('offers');
    window.history.pushState({ view: 'offers' }, '', '?view=offers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateBookmarks = () => {
    setCurrentView('bookmarks');
    window.history.pushState({ view: 'bookmarks' }, '', '?view=bookmarks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAdmin = () => {
    setCurrentView('admin');
    window.history.pushState({ view: 'admin' }, '', '?view=admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateTenPets = () => {
    setCurrentView('tenpets');
    window.history.pushState({ view: 'tenpets' }, '', '?view=tenpets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLeadQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadModalOffer) return;

    addLead({
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      company: leadCompany,
      sectorInterest: leadModalOffer.title,
      partnerId: leadModalOffer.partnerId,
      message: leadMessage,
      lgpdConsent: true
    });

    showToast(`Solicitação de proposta comercial para "${leadModalOffer.title}" enviada!`);
    setLeadModalOffer(null);
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
    setLeadCompany('');
    setLeadMessage('');
    loadData();
  };

  // If in Admin view, render full AdminLayout
  if (currentView === 'admin') {
    return (
      <>
        <AdminLayout
          articles={articles}
          categories={categories}
          authors={authors}
          leads={leads}
          subscribers={subscribers}
          offers={offers}
          ads={ads}
          onRefreshData={loadData}
          onExitAdmin={() => setCurrentView('home')}
          onShowToast={showToast}
        />
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#10233F]">
      {/* Header Navbar */}
      <Navbar
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onNavigateHome={handleNavigateHome}
        onNavigateOffers={handleNavigateOffers}
        onNavigateBookmarks={handleNavigateBookmarks}
        onNavigateAdmin={handleNavigateAdmin}
        onNavigateTenPets={handleNavigateTenPets}
        onOpenDocs={() => setIsDocModalOpen(true)}
        onOpenContactModal={() => setIsContactModalOpen(true)}
        bookmarksCount={getBookmarks().length}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            articles={articles}
            categories={categories}
            offers={offers}
            partners={partners}
            authors={authors}
            onSelectArticle={handleSelectArticle}
            onSelectCategory={handleSelectCategory}
            onSelectAuthor={handleSelectAuthor}
            onSelectPartner={handleSelectPartner}
            onNavigateOffers={handleNavigateOffers}
            onOpenLeadModal={setLeadModalOffer}
            onShowToast={showToast}
          />
        )}

        {currentView === 'tenpets' && (
          <TenPetsView
            onShowToast={showToast}
          />
        )}

        {currentView === 'article' && selectedArticle && (
          <ArticleDetailView
            article={selectedArticle}
            author={authors.find(a => a.id === selectedArticle.authorId)}
            category={categories.find(c => c.id === selectedArticle.categoryId)}
            relatedArticles={articles.filter(a => a.categoryId === selectedArticle.categoryId && a.id !== selectedArticle.id)}
            onSelectArticle={handleSelectArticle}
            onSelectAuthor={handleSelectAuthor}
            onBackToHome={handleNavigateHome}
            onOpenLeadModal={setLeadModalOffer}
            onShowToast={showToast}
            onSelectTag={handleSelectTag}
          />
        )}

        {currentView === 'tag' && selectedTag && (
          <TagView
            tag={selectedTag}
            articles={articles}
            categories={categories}
            onSelectArticle={handleSelectArticle}
            onSelectTag={handleSelectTag}
          />
        )}

        {currentView === 'category' && selectedCategory && (
          <CategoryView
            category={selectedCategory}
            articles={articles}
            offers={offers}
            onSelectArticle={handleSelectArticle}
            onBackToHome={() => setCurrentView('home')}
            onOpenLeadModal={setLeadModalOffer}
            onShowToast={showToast}
          />
        )}

        {currentView === 'offers' && (
          <OffersView
            offers={offers}
            categories={categories}
            onBackToHome={() => setCurrentView('home')}
            onOpenLeadModal={setLeadModalOffer}
            onShowToast={showToast}
          />
        )}

        {currentView === 'author' && selectedAuthor && (
          <AuthorView
            author={selectedAuthor}
            articles={articles}
            onSelectArticle={handleSelectArticle}
            onBackToHome={() => setCurrentView('home')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'partner' && selectedPartner && (
          <PartnerView
            partner={selectedPartner}
            articles={articles}
            offers={offers}
            onSelectArticle={handleSelectArticle}
            onBackToHome={() => setCurrentView('home')}
            onOpenLeadModal={setLeadModalOffer}
            onShowToast={showToast}
          />
        )}

        {currentView === 'search' && (
          <SearchView
            initialQuery={searchQuery}
            articles={articles}
            categories={categories}
            onSelectArticle={handleSelectArticle}
            onBackToHome={() => setCurrentView('home')}
          />
        )}

        {currentView === 'bookmarks' && (
          <BookmarksView
            articles={articles}
            onSelectArticle={handleSelectArticle}
            onBackToHome={() => setCurrentView('home')}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onNavigateOffers={() => setCurrentView('offers')}
        onOpenDocs={() => setIsDocModalOpen(true)}
        onNavigateAdmin={() => setCurrentView('admin')}
        onOpenContactModal={() => setIsContactModalOpen(true)}
      />

      {/* Lead Quote Modal */}
      <Modal
        isOpen={Boolean(leadModalOffer)}
        onClose={() => setLeadModalOffer(null)}
        title={`Solicitar Proposta B2B: ${leadModalOffer?.title}`}
      >
        <form onSubmit={handleLeadQuoteSubmit} className="space-y-4">
          <p className="text-xs text-[#5C6B7A]">
            Preencha seus dados para receber orçamento e proposta personalizada da solução.
          </p>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={leadName}
              onChange={e => setLeadName(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">E-mail Corporativo *</label>
            <input
              type="email"
              required
              value={leadEmail}
              onChange={e => setLeadEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Telefone / WhatsApp</label>
            <input
              type="tel"
              value={leadPhone}
              onChange={e => setLeadPhone(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Empresa</label>
            <input
              type="text"
              value={leadCompany}
              onChange={e => setLeadCompany(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Observações ou Dúvidas</label>
            <textarea
              rows={2}
              value={leadMessage}
              onChange={e => setLeadMessage(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#FF8500] hover:bg-[#e07500] text-white font-bold py-3 rounded-xl text-xs shadow-md"
          >
            Enviar Solicitação Comercial
          </button>
        </form>
      </Modal>

      {/* Manuals and Documentation Modal */}
      <DocumentationModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Contact & Partnerships Modal */}
      <ContactPartnershipModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Global Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
