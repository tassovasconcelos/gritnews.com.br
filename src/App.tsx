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
import { Toast } from './components/ui/Toast';
import { Modal } from './components/ui/Modal';
import { ContactPartnershipModal } from './components/ui/ContactPartnershipModal';
import { WhatsAppButton } from './components/ui/WhatsAppButton';
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
import { Article, Category, AuthorProfile, Partner, Offer, AdCampaign, Lead, NewsletterSubscriber } from './types';
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

const detectRouteFromLocation = (): ViewMode => {
  if (typeof window === 'undefined') return 'home';

  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // If host is tenpets.gritnews.com.br or tenpets.* or pathname contains /tenpets or query view=tenpets or hash #tenpets
  if (
    host.startsWith('tenpets') ||
    host.includes('tenpets.') ||
    path.includes('/tenpets') ||
    search.includes('view=tenpets') ||
    search.includes('subdomain=tenpets') ||
    search.includes('tenpets') ||
    hash.includes('tenpets')
  ) {
    return 'tenpets';
  }

  if (search.includes('view=offers') || path.includes('/offers')) return 'offers';
  if (search.includes('view=admin') || path.includes('/admin')) return 'admin';
  if (search.includes('view=bookmarks') || path.includes('/bookmarks')) return 'bookmarks';

  return 'home';
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>(detectRouteFromLocation);
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

  const loadData = () => {
    initInitialDataIfEmpty();
    setArticles(getArticles());
    setCategories(getCategories());
    setAuthors(getAuthors());
    setPartners(getPartners());
    setOffers(getOffers());
    setAds(getAds());
    setLeads(getLeads());
    setSubscribers(getSubscribers());
  };

  useEffect(() => {
    loadData();
    injectWebsiteSchema();

    // Route detection on popstate
    const handlePopState = () => {
      setCurrentView(detectRouteFromLocation());
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setCurrentView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setCurrentView('tag');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAuthor = (aut: AuthorProfile) => {
    setSelectedAuthor(aut);
    setCurrentView('author');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPartner = (prt: Partner) => {
    setSelectedPartner(prt);
    setCurrentView('partner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentView('search');
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
          isVisible={toast.isVisible}
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
        onNavigateHome={() => setCurrentView('home')}
        onNavigateOffers={() => setCurrentView('offers')}
        onNavigateBookmarks={() => setCurrentView('bookmarks')}
        onNavigateAdmin={() => setCurrentView('admin')}
        onNavigateTenPets={() => setCurrentView('tenpets')}
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
            onBackToHome={() => setCurrentView('home')}
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

      {/* Floating WhatsApp Direct Chat */}
      <WhatsAppButton phoneNumber="5585921716546" />

      {/* Global Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
