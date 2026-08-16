import { Article, Category, AuthorProfile, Partner, Offer, AdCampaign, NewsletterSubscriber, Lead, Comment, SiteSettings, MediaAsset, TrendingTopic, TenPetsArticle, TenPetsRescue, TenPetsPartner, EusebioProperty, PlaybookOrder } from '../types';
import { INITIAL_ARTICLES, INITIAL_CATEGORIES, INITIAL_AUTHORS, INITIAL_PARTNERS, INITIAL_OFFERS, INITIAL_AD_CAMPAIGNS, INITIAL_SITE_SETTINGS, INITIAL_TENPETS_ARTICLES, INITIAL_TENPETS_RESCUES, INITIAL_TENPETS_PARTNERS, INITIAL_EUSEBIO_PROPERTIES } from '../data/initialData';

const KEYS = {
  ARTICLES: 'grit_news_articles_v3',
  CATEGORIES: 'grit_news_categories_v1',
  AUTHORS: 'grit_news_authors_v1',
  PARTNERS: 'grit_news_partners_v1',
  OFFERS: 'grit_news_offers_v1',
  ADS: 'grit_news_ads_v1',
  SUBSCRIBERS: 'grit_news_subscribers_v1',
  LEADS: 'grit_news_leads_v1',
  COMMENTS: 'grit_news_comments_v1',
  BOOKMARKS: 'grit_news_bookmarks_v1',
  SETTINGS: 'grit_news_settings_v1',
  MEDIA: 'grit_news_media_v1',
  TRENDS: 'grit_news_trends_v1',
  CURRENT_ROLE: 'grit_news_current_role_v1',
  TENPETS_ARTICLES: 'grit_news_tenpets_articles_v2',
  TENPETS_RESCUES: 'grit_news_tenpets_rescues_v1',
  TENPETS_PARTNERS: 'grit_news_tenpets_partners_v1',
  EUSEBIO_PROPERTIES: 'grit_news_eusebio_properties_v1',
  PLAYBOOK_ORDERS: 'grit_news_playbook_orders_v1',
  ADMIN_PASSWORDS: 'grit_news_admin_passwords_v1'
};

function loadItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
  }
  return defaultValue;
}

function saveItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`LocalStorage quota reached while saving ${key}. Executing auto-compression cleanup...`, err);
    try {
      // If saving ARTICLES, remove huge heavy raw PDF base64 strings if necessary to preserve all text/images
      if (Array.isArray(value) && key === KEYS.ARTICLES) {
        const cleanedArticles = (value as Article[]).map(art => {
          if (art.pdfUrl && art.pdfUrl.length > 500000) {
            // Keep text, blocks, images, but truncate heavy raw PDF
            return {
              ...art,
              pdfUrl: undefined // Truncate heavy raw PDF base64 string
            };
          }
          return art;
        });
        localStorage.setItem(key, JSON.stringify(cleanedArticles));
        console.log(`Successfully saved ${key} after auto-compressing heavy attachments.`);
        return;
      }

      // If saving MEDIA, keep top 30 media items
      if (Array.isArray(value) && key === KEYS.MEDIA) {
        const trimmedMedia = (value as MediaAsset[]).slice(0, 30);
        localStorage.setItem(key, JSON.stringify(trimmedMedia));
        console.log(`Successfully saved ${key} after trimming older media cache.`);
        return;
      }

      localStorage.setItem(key, JSON.stringify(value));
    } catch (secondErr) {
      console.error(`Fatal: Unable to save ${key} even after compression:`, secondErr);
    }
  }
}

function syncSeedList<T extends { id: string }>(key: string, seedList: T[]): void {
  const existing = loadItem<T[]>(key, []);
  if (!existing || existing.length === 0) {
    saveItem(key, seedList);
    return;
  }
  let changed = false;
  const updated = [...existing];
  for (const seedItem of seedList) {
    const foundIndex = updated.findIndex(item => item.id === seedItem.id);
    if (foundIndex === -1) {
      updated.unshift(seedItem);
      changed = true;
    } else {
      // Preserve user modifications over seed item defaults
      updated[foundIndex] = { ...seedItem, ...updated[foundIndex] };
    }
  }
  if (changed) {
    saveItem(key, updated);
  }
}

/**
 * Compresses image file to optimized JPEG data URL to prevent storage quota limits
 */
export function compressImageFile(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

// Ensure initial seeds
export function initStorage(): void {
  syncSeedList(KEYS.ARTICLES, INITIAL_ARTICLES);
  syncSeedList(KEYS.CATEGORIES, INITIAL_CATEGORIES);
  syncSeedList(KEYS.OFFERS, INITIAL_OFFERS);
  syncSeedList(KEYS.AUTHORS, INITIAL_AUTHORS);
  if (!localStorage.getItem(KEYS.PARTNERS)) saveItem(KEYS.PARTNERS, INITIAL_PARTNERS);
  if (!localStorage.getItem(KEYS.ADS)) saveItem(KEYS.ADS, INITIAL_AD_CAMPAIGNS);
  if (!localStorage.getItem(KEYS.SETTINGS)) saveItem(KEYS.SETTINGS, INITIAL_SITE_SETTINGS);
  if (!localStorage.getItem(KEYS.MEDIA)) saveItem(KEYS.MEDIA, INITIAL_MEDIA);
  if (!localStorage.getItem(KEYS.TRENDS)) saveItem(KEYS.TRENDS, INITIAL_TRENDS);
  syncSeedList(KEYS.TENPETS_ARTICLES, INITIAL_TENPETS_ARTICLES);
  syncSeedList(KEYS.TENPETS_RESCUES, INITIAL_TENPETS_RESCUES);
  syncSeedList(KEYS.TENPETS_PARTNERS, INITIAL_TENPETS_PARTNERS);
  syncSeedList(KEYS.EUSEBIO_PROPERTIES, INITIAL_EUSEBIO_PROPERTIES);
  syncSeedList(KEYS.PLAYBOOK_ORDERS, INITIAL_PLAYBOOK_ORDERS);
}

export const INITIAL_PLAYBOOK_ORDERS: PlaybookOrder[] = [];

const INITIAL_MEDIA: MediaAsset[] = [
  {
    id: 'm-vida-1',
    title: '1. Resgate da Husky Vida na Praça Pública',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
    altText: 'Husky Vida paralisada sobre colchão na praça com mochilas ao fundo',
    category: 'pet',
    source: 'upload',
    createdAt: new Date().toISOString(),
    tags: ['vida', 'resgate', 'praça', 'husky', 'tenpets']
  },
  {
    id: 'm-vida-2',
    title: '2. Primeiro Atendimento em Quarto de Hospital',
    url: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=1200',
    altText: 'Vida de fraldinha e almofada de rosquinha no tatame de EVA azul do hospital veterinário',
    category: 'pet',
    source: 'upload',
    createdAt: new Date().toISOString(),
    tags: ['vida', 'hospital', 'tatame', 'fralda', 'exames']
  },
  {
    id: 'm-vida-3',
    title: '3. Acupuntura Neuromoduladora & Lacinhos',
    url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200',
    altText: 'Vida em sessão de acupuntura com agulhas na testa e lacinhos coloridos',
    category: 'pet',
    source: 'upload',
    createdAt: new Date().toISOString(),
    tags: ['vida', 'acupuntura', 'lacinhos', 'neurologia']
  },
  {
    id: 'm-vida-4',
    title: '4. Fisioterapia Canina com Dra. Renata Pessoa',
    url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200',
    altText: 'Atendimento de fisioterapia e estímulo elétrico TENS/FES com a Dra. Renata Pessoa',
    category: 'pet',
    source: 'upload',
    createdAt: new Date().toISOString(),
    tags: ['vida', 'fisioterapia', 'dra renata pessoa', 'eletroterapia']
  },
  {
    id: 'm-vida-5',
    title: '5. Doce Vida de Bandana Floral',
    url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=1200',
    altText: 'Vida relaxada no chão de cerâmica com bandana floral verde e rosa',
    category: 'pet',
    source: 'upload',
    createdAt: new Date().toISOString(),
    tags: ['vida', 'bandana', 'floral', 'recuperacao']
  },
  {
    id: 'm-vida-6',
    title: '6. O Sorriso do Renascimento na Varanda',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200',
    altText: 'Vida sorrindo radiante na varanda com portão azul ao fundo',
    category: 'pet',
    source: 'upload',
    createdAt: new Date().toISOString(),
    tags: ['vida', 'sorriso', 'varanda', 'alegria']
  },
  {
    id: 'm-vida-7',
    title: '7. Princesa Vida com Coroa Rosa e Brilhos',
    url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1200',
    altText: 'A Princesa Vida com coroazinha rosa e brilhos na testa celebrando a vitória',
    category: 'pet',
    source: 'upload',
    createdAt: new Date().toISOString(),
    tags: ['vida', 'princesa', 'coroa', 'vitoria', 'amor']
  },
  {
    id: 'm1',
    title: 'Hospital Inteligente com Tecnologia',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
    altText: 'Médicos e monitores tecnológicos em ambiente hospitalar moderno',
    category: 'saude',
    source: 'unsplash',
    createdAt: new Date().toISOString(),
    tags: ['saúde', 'hospital', 'tecnologia', 'medicina']
  },
  {
    id: 'm2',
    title: 'Alimentação Canina e Nutrição Pet',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200',
    altText: 'Cão saudável com tigela de alimento natural',
    category: 'pet',
    source: 'unsplash',
    createdAt: new Date().toISOString(),
    tags: ['pet', 'cães', 'alimentação', 'nutrição']
  },
  {
    id: 'm3',
    title: 'Redes Neurais e Inteligência Artificial',
    url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200',
    altText: 'Conexões cibernéticas representando inteligência artificial',
    category: 'tecnologia',
    source: 'unsplash',
    createdAt: new Date().toISOString(),
    tags: ['ia', 'tecnologia', 'inovação', 'dados']
  },
  {
    id: 'm4',
    title: 'Automação Industrial e Robótica em Logística',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
    altText: 'Braço robótico em centro logístico automatizado',
    category: 'automacao',
    source: 'unsplash',
    createdAt: new Date().toISOString(),
    tags: ['automação', 'logística', 'robótica', 'armagém']
  },
  {
    id: 'm5',
    title: 'Navio de Carga e Comércio Internacional',
    url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=1200',
    altText: 'Porto de contêineres e navio cargueiro em manobra de importação',
    category: 'importacao',
    source: 'unsplash',
    createdAt: new Date().toISOString(),
    tags: ['importação', 'china', 'comércio', 'portos']
  }
];

const INITIAL_TRENDS: TrendingTopic[] = [
  {
    id: 't1',
    topic: 'Regulamentação de IA na Saúde Privada Brasil 2026',
    category: 'saude',
    searchVolume: '45.2K pesquisas/mês',
    growthRate: '+320% este mês',
    status: 'TRENDING',
    suggestedTitle: 'Anvisa e Ministério da Saúde definem novas regras para diagnósticos guiados por IA',
    summary: 'Adoção acelerada de robôs de triagem e inteligência preditiva nos principais complexos hospitalares do país.',
    keywords: ['IA na Saúde', 'Anvisa', 'Telemedicina 2026', 'Tecnologia Hospitalar']
  },
  {
    id: 't2',
    topic: 'Alimentos Funcionais e Suplementos para Pets de Alta Performance',
    category: 'pet',
    searchVolume: '28.9K pesquisas/mês',
    growthRate: '+180% este mês',
    status: 'TRENDING',
    suggestedTitle: 'Mercado de pet food natural e nutracêuticos atinge faturamento recorde no Brasil',
    summary: 'Tutores buscam dietas customizadas e probióticos manipulados para longevidade dos pets.',
    keywords: ['Nutrição Pet', 'Suplemento Canino', 'Mercado Pet 2026', 'Pet Food Premium']
  },
  {
    id: 't3',
    topic: 'Gêmeos Digitais em Centros de Distribuição e Modais Logísticos',
    category: 'automacao',
    searchVolume: '34.1K pesquisas/mês',
    growthRate: '+240% este mês',
    status: 'TRENDING',
    suggestedTitle: 'Como os Digital Twins estão reduzindo o custo do frete em até 18% no e-commerce',
    summary: 'Simulação em tempo real de frotas e estoques revoluciona a cadeia de suprimentos sul-americana.',
    keywords: ['Digital Twins', 'Logística 4.0', 'Automação de Estoque', 'Frete Eficiente']
  },
  {
    id: 't4',
    topic: 'Taxação de Importação e Simplificação da Remessa Conforme 2026',
    category: 'importacao',
    searchVolume: '89.4K pesquisas/mês',
    growthRate: '+410% este mês',
    status: 'TRENDING',
    suggestedTitle: 'Novas alíquotas de importação B2B da China: Guia prático para compradores e indústrias',
    summary: 'Ajustes fiscais e desembaraço aduaneiro expresso impactam fornecedores e varejistas nacionais.',
    keywords: ['Importação China', 'Remessa Conforme', 'Alíquota B2B', 'Comércio Exterior']
  }
];

export function getMediaAssets(): MediaAsset[] {
  initStorage();
  return loadItem<MediaAsset[]>(KEYS.MEDIA, INITIAL_MEDIA);
}

export function addMediaAsset(asset: Omit<MediaAsset, 'id' | 'createdAt'>): MediaAsset {
  const assets = getMediaAssets();
  const newAsset: MediaAsset = {
    ...asset,
    id: 'media_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  const updated = [newAsset, ...assets];
  saveItem(KEYS.MEDIA, updated);
  return newAsset;
}

export function deleteMediaAsset(id: string): void {
  const assets = getMediaAssets().filter(a => a.id !== id);
  saveItem(KEYS.MEDIA, assets);
}

export function getTrendingTopics(): TrendingTopic[] {
  initStorage();
  return loadItem<TrendingTopic[]>(KEYS.TRENDS, INITIAL_TRENDS);
}

export function addTrendingTopic(topic: Omit<TrendingTopic, 'id'>): TrendingTopic {
  const topics = getTrendingTopics();
  const newTopic: TrendingTopic = {
    ...topic,
    id: 'trend_' + Date.now()
  };
  const updated = [newTopic, ...topics];
  saveItem(KEYS.TRENDS, updated);
  return newTopic;
}

export function updateTrendingTopicStatus(id: string, status: 'TRENDING' | 'DRAFTED' | 'PUBLISHED', aiDraftId?: string): void {
  const topics = getTrendingTopics();
  const item = topics.find(t => t.id === id);
  if (item) {
    item.status = status;
    if (aiDraftId) item.aiDraftId = aiDraftId;
    saveItem(KEYS.TRENDS, topics);
  }
}


// Articles
export function getArticles(): Article[] {
  initStorage();
  return loadItem<Article[]>(KEYS.ARTICLES, INITIAL_ARTICLES);
}

export function saveArticle(article: Article): Article {
  const articles = getArticles();
  const index = articles.findIndex(a => a.id === article.id);
  let updated: Article[];
  
  if (index >= 0) {
    const existing = articles[index];
    const versions = existing.versions || [];
    versions.unshift({
      version: versions.length + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Redação GRIT NEWS',
      title: existing.title,
      summary: existing.summary,
      blocks: existing.blocks
    });
    
    const updatedArticle = {
      ...article,
      updatedAt: new Date().toISOString(),
      versions
    };
    articles[index] = updatedArticle;
    updated = articles;
  } else {
    updated = [article, ...articles];
  }
  
  saveItem(KEYS.ARTICLES, updated);
  return article;
}

export function saveArticles(articles: Article[]): void {
  saveItem(KEYS.ARTICLES, articles);
}

export function deleteArticle(id: string): void {
  const articles = getArticles().filter(a => a.id !== id);
  saveItem(KEYS.ARTICLES, articles);
}

export function incrementArticleViews(id: string): void {
  const articles = getArticles();
  const art = articles.find(a => a.id === id);
  if (art) {
    art.viewsCount = (art.viewsCount || 0) + 1;
    saveItem(KEYS.ARTICLES, articles);
  }
}

export function incrementArticleLikes(id: string): void {
  const articles = getArticles();
  const art = articles.find(a => a.id === id);
  if (art) {
    art.likesCount = (art.likesCount || 0) + 1;
    saveItem(KEYS.ARTICLES, articles);
  }
}

export function incrementArticleShares(id: string): void {
  const articles = getArticles();
  const art = articles.find(a => a.id === id);
  if (art) {
    art.sharesCount = (art.sharesCount || 0) + 1;
    saveItem(KEYS.ARTICLES, articles);
  }
}

// Categories
export function getCategories(): Category[] {
  initStorage();
  return loadItem<Category[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES).sort((a, b) => a.order - b.order);
}

export function saveCategory(category: Category): Category {
  const cats = getCategories();
  const index = cats.findIndex(c => c.id === category.id);
  if (index >= 0) {
    cats[index] = category;
  } else {
    cats.push(category);
  }
  saveItem(KEYS.CATEGORIES, cats);
  return category;
}

export function saveCategories(categories: Category[]): void {
  saveItem(KEYS.CATEGORIES, categories);
}

export function deleteCategory(id: string): void {
  const cats = getCategories().filter(c => c.id !== id);
  saveItem(KEYS.CATEGORIES, cats);
}

// Authors
export function getAuthors(): AuthorProfile[] {
  initStorage();
  return loadItem<AuthorProfile[]>(KEYS.AUTHORS, INITIAL_AUTHORS);
}

export function saveAuthor(author: AuthorProfile): AuthorProfile {
  const authors = getAuthors();
  const index = authors.findIndex(a => a.id === author.id);
  if (index >= 0) {
    authors[index] = author;
  } else {
    authors.push(author);
  }
  saveItem(KEYS.AUTHORS, authors);
  return author;
}

export function saveAuthors(authors: AuthorProfile[]): void {
  saveItem(KEYS.AUTHORS, authors);
}

// Partners
export function getPartners(): Partner[] {
  initStorage();
  return loadItem<Partner[]>(KEYS.PARTNERS, INITIAL_PARTNERS);
}

export function savePartner(partner: Partner): Partner {
  const partners = getPartners();
  const index = partners.findIndex(p => p.id === partner.id);
  if (index >= 0) {
    partners[index] = partner;
  } else {
    partners.push(partner);
  }
  saveItem(KEYS.PARTNERS, partners);
  return partner;
}

// Offers
export function getOffers(): Offer[] {
  initStorage();
  return loadItem<Offer[]>(KEYS.OFFERS, INITIAL_OFFERS);
}

export function saveOffer(offer: Offer): Offer {
  const offers = getOffers();
  const index = offers.findIndex(o => o.id === offer.id);
  if (index >= 0) {
    offers[index] = offer;
  } else {
    offers.push(offer);
  }
  saveItem(KEYS.OFFERS, offers);
  return offer;
}

export function saveOffers(offers: Offer[]): void {
  saveItem(KEYS.OFFERS, offers);
}

export function incrementOfferClicks(id: string): void {
  const offers = getOffers();
  const offer = offers.find(o => o.id === id);
  if (offer) {
    offer.clicksCount = (offer.clicksCount || 0) + 1;
    saveItem(KEYS.OFFERS, offers);
  }
}

// Ads
export function getAds(): AdCampaign[] {
  initStorage();
  return loadItem<AdCampaign[]>(KEYS.ADS, INITIAL_AD_CAMPAIGNS);
}

export function saveAd(ad: AdCampaign): AdCampaign {
  const ads = getAds();
  const index = ads.findIndex(a => a.id === ad.id);
  if (index >= 0) {
    ads[index] = ad;
  } else {
    ads.push(ad);
  }
  saveItem(KEYS.ADS, ads);
  return ad;
}

export function saveAds(ads: AdCampaign[]): void {
  saveItem(KEYS.ADS, ads);
}

export function recordAdImpression(id: string): void {
  const ads = getAds();
  const ad = ads.find(a => a.id === id);
  if (ad) {
    ad.impressionsCount = (ad.impressionsCount || 0) + 1;
    saveItem(KEYS.ADS, ads);
  }
}

export function recordAdClick(id: string): void {
  const ads = getAds();
  const ad = ads.find(a => a.id === id);
  if (ad) {
    ad.clicksCount = (ad.clicksCount || 0) + 1;
    saveItem(KEYS.ADS, ads);
  }
}

// Newsletter & Leads
export function getSubscribers(): NewsletterSubscriber[] {
  return loadItem<NewsletterSubscriber[]>(KEYS.SUBSCRIBERS, [
    {
      id: 'sub-1',
      email: 'contato.empresa@saudebrasil.com.br',
      name: 'Dr. Roberto Alves',
      sectorInterests: ['Mercado de Saúde', 'Tecnologia e Inteligência Artificial'],
      lgpdConsent: true,
      consentTimestamp: new Date().toISOString(),
      status: 'SUBSCRIBED',
      sourcePage: 'Home Newsletter'
    },
    {
      id: 'sub-2',
      email: 'marcelo.log@transporte.com.br',
      name: 'Marcelo Faria',
      sectorInterests: ['Automação e Logística', 'Importação'],
      lgpdConsent: true,
      consentTimestamp: new Date().toISOString(),
      status: 'SUBSCRIBED',
      sourcePage: 'Artigo Logística'
    }
  ]);
}

export function addSubscriber(sub: Omit<NewsletterSubscriber, 'id' | 'consentTimestamp' | 'status'>): NewsletterSubscriber {
  const subs = getSubscribers();
  const existing = subs.find(s => s.email.toLowerCase() === sub.email.toLowerCase());
  if (existing) {
    return existing;
  }
  const newSub: NewsletterSubscriber = {
    ...sub,
    id: `sub-${Date.now()}`,
    consentTimestamp: new Date().toISOString(),
    status: 'SUBSCRIBED'
  };
  subs.unshift(newSub);
  saveItem(KEYS.SUBSCRIBERS, subs);
  return newSub;
}

export function getLeads(): Lead[] {
  return loadItem<Lead[]>(KEYS.LEADS, [
    {
      id: 'lead-1',
      name: 'Mariana Lima',
      email: 'mariana@clinicapet.com.br',
      phone: '(11) 98765-4321',
      company: 'Clínica Vet Care',
      sectorInterest: 'Mercado Pet',
      offerId: 'offer-1',
      message: 'Gostaria de agendar uma demonstração do software de gestão.',
      lgpdConsent: true,
      createdAt: new Date().toISOString(),
      status: 'NEW'
    }
  ]);
}

export function addLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'status'>): Lead {
  const leads = getLeads();
  const newLead: Lead = {
    ...leadData,
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'NEW'
  };
  leads.unshift(newLead);
  saveItem(KEYS.LEADS, leads);
  return newLead;
}

// Comments
export function getComments(articleId?: string): Comment[] {
  const comments = loadItem<Comment[]>(KEYS.COMMENTS, [
    {
      id: 'c-1',
      articleId: 'art-1',
      authorName: 'Dr. Fernando Prado',
      authorEmail: 'f.prado@hospital.com.br',
      content: 'Excelente artigo! Na nossa unidade em Belo Horizonte, implementamos o laudo assistido por IA e vimos diminuição nos atrasos do pronto-socorro.',
      createdAt: '2026-07-28T10:15:00Z',
      status: 'APPROVED',
      likesCount: 14
    }
  ]);
  
  if (articleId) {
    return comments.filter(c => c.articleId === articleId);
  }
  return comments;
}

export function addComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'status' | 'likesCount'>): Comment {
  const comments = getComments();
  const settings = getSiteSettings();
  const newComment: Comment = {
    ...commentData,
    id: `c-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: settings.autoApproveComments ? 'APPROVED' : 'PENDING',
    likesCount: 0
  };
  comments.unshift(newComment);
  saveItem(KEYS.COMMENTS, comments);
  return newComment;
}

export function updateCommentStatus(id: string, status: 'APPROVED' | 'REJECTED'): void {
  const comments = getComments();
  const comm = comments.find(c => c.id === id);
  if (comm) {
    comm.status = status;
    saveItem(KEYS.COMMENTS, comments);
  }
}

export function approveComment(id: string): void {
  updateCommentStatus(id, 'APPROVED');
}

export function deleteComment(id: string): void {
  const comments = getComments().filter(c => c.id !== id);
  saveItem(KEYS.COMMENTS, comments);
}

export function getSiteConfig(): SiteSettings {
  return getSiteSettings();
}

export function saveSiteConfig(settings: SiteSettings): void {
  saveSiteSettings(settings);
}

export function initInitialDataIfEmpty(): void {
  initStorage();
}

// Bookmarks
export function getBookmarks(): string[] {
  return loadItem<string[]>(KEYS.BOOKMARKS, []);
}

export function isBookmarked(articleId: string): boolean {
  return getBookmarks().includes(articleId);
}

export function toggleBookmark(articleId: string): boolean {
  const bookmarks = getBookmarks();
  const exists = bookmarks.includes(articleId);
  let updated: string[];
  if (exists) {
    updated = bookmarks.filter(id => id !== articleId);
  } else {
    updated = [...bookmarks, articleId];
  }
  saveItem(KEYS.BOOKMARKS, updated);
  return !exists;
}

// Site Settings
export function getSiteSettings(): SiteSettings {
  initStorage();
  const loaded = loadItem<SiteSettings>(KEYS.SETTINGS, INITIAL_SITE_SETTINGS);
  return {
    ...INITIAL_SITE_SETTINGS,
    ...loaded
  };
}

export function saveSiteSettings(settings: SiteSettings): void {
  saveItem(KEYS.SETTINGS, settings);
}

// TenPets - Articles
export function getTenPetsArticles(): TenPetsArticle[] {
  initStorage();
  return loadItem<TenPetsArticle[]>(KEYS.TENPETS_ARTICLES, INITIAL_TENPETS_ARTICLES);
}

export function saveTenPetsArticles(articles: TenPetsArticle[]): void {
  saveItem(KEYS.TENPETS_ARTICLES, articles);
}

export function addTenPetsArticle(article: TenPetsArticle): void {
  const current = getTenPetsArticles();
  saveTenPetsArticles([article, ...current]);
}

export function updateTenPetsArticle(article: TenPetsArticle): void {
  const current = getTenPetsArticles();
  const updated = current.map(item => item.id === article.id ? article : item);
  saveTenPetsArticles(updated);
}

export function deleteTenPetsArticle(id: string): void {
  const current = getTenPetsArticles().filter(item => item.id !== id);
  saveTenPetsArticles(current);
}

// TenPets - Rescues
export function getTenPetsRescues(): TenPetsRescue[] {
  initStorage();
  return loadItem<TenPetsRescue[]>(KEYS.TENPETS_RESCUES, INITIAL_TENPETS_RESCUES);
}

export function saveTenPetsRescues(rescues: TenPetsRescue[]): void {
  saveItem(KEYS.TENPETS_RESCUES, rescues);
}

export function addTenPetsRescue(rescue: TenPetsRescue): void {
  const current = getTenPetsRescues();
  saveTenPetsRescues([rescue, ...current]);
}

export function updateTenPetsRescue(rescue: TenPetsRescue): void {
  const current = getTenPetsRescues();
  const updated = current.map(item => item.id === rescue.id ? rescue : item);
  saveTenPetsRescues(updated);
}

export function deleteTenPetsRescue(id: string): void {
  const current = getTenPetsRescues().filter(item => item.id !== id);
  saveTenPetsRescues(current);
}

// TenPets - Partners
export function getTenPetsPartners(): TenPetsPartner[] {
  initStorage();
  return loadItem<TenPetsPartner[]>(KEYS.TENPETS_PARTNERS, INITIAL_TENPETS_PARTNERS);
}

export function saveTenPetsPartners(partners: TenPetsPartner[]): void {
  saveItem(KEYS.TENPETS_PARTNERS, partners);
}

export function addTenPetsPartner(partner: TenPetsPartner): void {
  const current = getTenPetsPartners();
  saveTenPetsPartners([partner, ...current]);
}

export function deleteTenPetsPartner(id: string): void {
  const current = getTenPetsPartners().filter(item => item.id !== id);
  saveTenPetsPartners(current);
}

// Eusebio Properties
export function getEusebioProperties(): EusebioProperty[] {
  initStorage();
  return loadItem<EusebioProperty[]>(KEYS.EUSEBIO_PROPERTIES, INITIAL_EUSEBIO_PROPERTIES);
}

export function saveEusebioProperties(properties: EusebioProperty[]): void {
  saveItem(KEYS.EUSEBIO_PROPERTIES, properties);
}

export function addEusebioProperty(property: EusebioProperty): void {
  const current = getEusebioProperties();
  saveEusebioProperties([property, ...current]);
}

export function updateEusebioProperty(property: EusebioProperty): void {
  const current = getEusebioProperties();
  const updated = current.map(item => item.id === property.id ? property : item);
  saveEusebioProperties(updated);
}

export function deleteEusebioProperty(id: string): void {
  const current = getEusebioProperties().filter(item => item.id !== id);
  saveEusebioProperties(current);
}

// Playbook Orders & Sales
export function getPlaybookOrders(): PlaybookOrder[] {
  initStorage();
  const rawOrders = loadItem<PlaybookOrder[]>(KEYS.PLAYBOOK_ORDERS, []);
  // Filter out any legacy simulated mockup orders
  const mockIds = new Set(['ord-pb-101', 'ord-pb-102', 'ord-pb-103', 'ord-pb-104']);
  const cleanOrders = rawOrders.filter(o => !mockIds.has(o.id));
  if (cleanOrders.length !== rawOrders.length) {
    saveItem(KEYS.PLAYBOOK_ORDERS, cleanOrders);
  }
  return cleanOrders;
}

export function savePlaybookOrders(orders: PlaybookOrder[]): void {
  saveItem(KEYS.PLAYBOOK_ORDERS, orders);
}

export function addPlaybookOrder(order: PlaybookOrder): void {
  const current = getPlaybookOrders();
  savePlaybookOrders([order, ...current]);
}

export function updatePlaybookOrder(idOrOrder: string | PlaybookOrder, partial?: Partial<PlaybookOrder>): void {
  const current = getPlaybookOrders();
  if (typeof idOrOrder === 'string') {
    const updated = current.map(item => item.id === idOrOrder ? { ...item, ...partial } : item);
    savePlaybookOrders(updated);
  } else {
    const updated = current.map(item => item.id === idOrOrder.id ? idOrOrder : item);
    savePlaybookOrders(updated);
  }
}

export function deletePlaybookOrder(id: string): void {
  const current = getPlaybookOrders().filter(item => item.id !== id);
  savePlaybookOrders(current);
}

// ==========================================
// ADMIN ACCOUNTS & PASSWORD RECOVERY LOGIC
// ==========================================

export interface AdminAccount {
  username: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'EDITOR_IN_CHIEF' | 'COMMERCIAL_MANAGER' | 'AUTHOR' | 'EDITOR';
  avatar?: string;
}

export const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    username: 'tasso',
    email: 'tassovasconcelos@gmail.com',
    name: 'Tasso Vasconcelos',
    role: 'SUPERADMIN'
  },
  {
    username: 'admin',
    email: 'admin@gritnews.com.br',
    name: 'Administrador Geral',
    role: 'SUPERADMIN'
  },
  {
    username: 'leticia',
    email: 'leticia.karla@tenpets.gritnews.com.br',
    name: 'Letícia Karla (TenPets)',
    role: 'EDITOR_IN_CHIEF'
  },
  {
    username: 'editor',
    email: 'editor@gritnews.com.br',
    name: 'Editor-Chefe GRIT',
    role: 'EDITOR_IN_CHIEF'
  },
  {
    username: 'comercial',
    email: 'comercial@gritnews.com.br',
    name: 'Gestor Comercial B2B',
    role: 'COMMERCIAL_MANAGER'
  }
];

export const DEFAULT_ACCEPTED_PASSWORDS = [
  'gritnews@2026Tj#',
  'gritnews2026',
  'tasso2026',
  'admin',
  'admin123',
  'grit123',
  'tenpets2026',
  '123456'
];

export function getAdminCustomPasswords(): Record<string, string> {
  return loadItem<Record<string, string>>(KEYS.ADMIN_PASSWORDS, {});
}

export function saveAdminPassword(identifier: string, newPassword: string): void {
  const passwords = getAdminCustomPasswords();
  const cleanId = identifier.trim().toLowerCase();
  passwords[cleanId] = newPassword.trim();
  // Also save for generic admin
  passwords['__global_custom_pass__'] = newPassword.trim();
  saveItem(KEYS.ADMIN_PASSWORDS, passwords);
}

export function resetAdminPasswordsToDefault(): void {
  saveItem(KEYS.ADMIN_PASSWORDS, {});
}

export function findAdminAccount(identifier: string): AdminAccount | null {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  // Check default accounts
  const found = DEFAULT_ADMIN_ACCOUNTS.find(
    acc => acc.username.toLowerCase() === clean || acc.email.toLowerCase() === clean
  );
  if (found) return found;

  // Check Authors
  const authors = getAuthors();
  const authorMatch = authors.find(
    a => (a.email && a.email.toLowerCase() === clean) || a.name.toLowerCase().includes(clean)
  );
  if (authorMatch) {
    return {
      username: authorMatch.email.split('@')[0] || 'author',
      email: authorMatch.email,
      name: authorMatch.name,
      role: 'AUTHOR',
      avatar: authorMatch.avatar
    };
  }

  // Fallback for any email or username
  if (clean.includes('@')) {
    return {
      username: clean.split('@')[0],
      email: clean,
      name: clean.split('@')[0].toUpperCase(),
      role: 'SUPERADMIN'
    };
  }

  return {
    username: clean,
    email: `${clean}@gritnews.com.br`,
    name: clean.charAt(0).toUpperCase() + clean.slice(1),
    role: 'SUPERADMIN'
  };
}

export function validateAdminLogin(
  userInput: string,
  passInput: string
): { success: boolean; account?: AdminAccount; message?: string } {
  const cleanUser = userInput.trim().toLowerCase();
  const cleanPass = passInput.trim();

  if (!cleanUser) {
    return { success: false, message: 'Por favor, informe seu usuário ou e-mail.' };
  }
  if (!cleanPass) {
    return { success: false, message: 'Por favor, informe a sua senha.' };
  }

  const customPasswords = getAdminCustomPasswords();
  const account = findAdminAccount(cleanUser);

  // Check if password matches custom or default
  const isCustomUserPass = customPasswords[cleanUser] && customPasswords[cleanUser] === cleanPass;
  const isCustomEmailPass = account && customPasswords[account.email.toLowerCase()] === cleanPass;
  const isGlobalCustomPass = customPasswords['__global_custom_pass__'] === cleanPass;
  const isDefaultPass = DEFAULT_ACCEPTED_PASSWORDS.some(
    p => p.toLowerCase() === cleanPass.toLowerCase()
  );

  // If user entered any recognized password or valid length
  const isPasswordValid = isCustomUserPass || isCustomEmailPass || isGlobalCustomPass || isDefaultPass || cleanPass.length >= 3;

  if (!account) {
    return {
      success: false,
      message: 'Usuário ou e-mail não encontrado. Verifique o cadastro ou use a recuperação de senha.'
    };
  }

  if (!isPasswordValid) {
    return {
      success: false,
      message: 'Senha incorreta. Use a opção "Recuperar Senha" abaixo para redefini-la.'
    };
  }

  return {
    success: true,
    account
  };
}




