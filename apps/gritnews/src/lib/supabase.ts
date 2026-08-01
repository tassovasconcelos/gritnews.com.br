import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getArticles,
  getCategories,
  getAuthors,
  getPartners,
  getOffers,
  getAds,
  getLeads,
  getSubscribers,
  getComments,
  getSiteSettings,
  getTenPetsArticles,
  getTenPetsRescues,
  getTenPetsPartners
} from './storage';

const SUPABASE_STORAGE_KEYS = {
  URL: 'grit_news_supabase_url',
  ANON_KEY: 'grit_news_supabase_anon_key'
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

/**
 * Get active Supabase configuration (localStorage override or VITE_ env vars)
 */
export function getSupabaseConfig(): SupabaseConfig {
  const customUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL);
  const customKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY);

  if (customUrl && customKey) {
    return {
      url: customUrl,
      anonKey: customKey,
      isConfigured: true,
      source: 'custom'
    };
  }

  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env'
    };
  }

  return {
    url: customUrl || envUrl || '',
    anonKey: customKey || envKey || '',
    isConfigured: false,
    source: 'none'
  };
}

/**
 * Save user custom Supabase credentials
 */
export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url.trim()) {
    localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
  } else {
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
  }

  if (anonKey.trim()) {
    localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.ANON_KEY);
  }

  // Reset cached instance
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

/**
 * Get initialized Supabase JS Client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('[Supabase Init Error]:', err);
    return null;
  }
}

/**
 * Tests live connection to Supabase instance
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, boolean>;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Credenciais do Supabase não configuradas (URL ou Anon Key ausentes).'
    };
  }

  try {
    // Attempt a lightweight query
    const { data, error } = await client.from('site_settings').select('id').limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist yet, but client connected!
      return {
        success: true,
        message: 'Conexão com o Supabase estabelecida com sucesso! Nota: As tabelas ainda precisam ser criadas executando o script SQL fornecido.'
      };
    }

    if (error) {
      return {
        success: false,
        message: `Erro ao conectar com o Supabase: ${error.message} (Código: ${error.code})`
      };
    }

    return {
      success: true,
      message: 'Conexão e tabelas do Supabase ativas e operando normalmente!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha na conexão: ${err.message || 'Erro de rede ou URL inválida.'}`
    };
  }
}

/**
 * Generates SQL DDL Script for creating tables, RLS policies, and indexes in Supabase SQL Editor
 */
export function generateSupabaseSQLScript(): string {
  return `-- ==========================================================
-- SCRIPT DE BANCO DE DADOS SUPABASE - PORTAL GRIT NEWS
-- Cole e execute no Editor SQL do seu Painel Supabase
-- ==========================================================

-- 1. Habilitar extensões necessárias para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Categorias do Portal
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  icon_name TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Autores & Jornalistas
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  email TEXT,
  linkedin TEXT,
  articles_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Artigos & Notícias
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  summary TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  author_id TEXT REFERENCES authors(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'PUBLISHED',
  featured_image TEXT NOT NULL,
  views_count INT DEFAULT 0,
  slug TEXT UNIQUE,
  tags TEXT[],
  seo JSONB,
  partner_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Leads B2B & Solicitações de Cotação/Proposta
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  offer_id TEXT,
  partner_id TEXT,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  sector_interest TEXT,
  status TEXT DEFAULT 'NEW',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Inscrições na Newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  sector_interests TEXT[],
  status TEXT DEFAULT 'SUBSCRIBED',
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Campanhas de Anúncios e Banners B2B
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  target_url TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  clicks_count INT DEFAULT 0,
  impressions_count INT DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Ofertas Comercial B2B / Soluções Parceiras
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  partner_id TEXT,
  category_id TEXT,
  badge_text TEXT,
  short_description TEXT NOT NULL,
  full_description TEXT,
  image TEXT NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  clicks_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Comentários e Reações das Matérias
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'APPROVED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabela de Configurações Globais do Portal
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  site_title TEXT NOT NULL,
  tagline TEXT,
  meta_description TEXT,
  google_tag_manager_id TEXT,
  adsense_client_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabela TenPets: Artigos Científicos e Jurídicos (Letícia Karla)
CREATE TABLE IF NOT EXISTS tenpets_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT DEFAULT 'Letícia Karla',
  category TEXT DEFAULT 'Científico',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT NOT NULL,
  pdf_url TEXT,
  doi TEXT,
  views_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabela TenPets: Casos de Resgate e Histórias Romanceadas
CREATE TABLE IF NOT EXISTS tenpets_rescues (
  id TEXT PRIMARY KEY,
  animal_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  romantic_story TEXT NOT NULL,
  rescue_date DATE,
  status TEXT DEFAULT 'EM_TRATAMENTO',
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  video_url TEXT,
  vet_care_notes TEXT,
  sponsor_goal NUMERIC,
  current_sponsor_total NUMERIC DEFAULT 0,
  featured BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Tabela TenPets: Parceiros e Apadrinhamento
CREATE TABLE IF NOT EXISTS tenpets_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  description TEXT NOT NULL,
  website_url TEXT,
  contact_email TEXT,
  discount_benefit TEXT,
  featured BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR ROW LEVEL SECURITY (RLS) - Permissões de Leitura Pública
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenpets_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenpets_rescues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenpets_partners ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura das notícias e tenpets
CREATE POLICY "Leitura publica de categorias" ON categories FOR SELECT USING (true);
CREATE POLICY "Leitura publica de autores" ON authors FOR SELECT USING (true);
CREATE POLICY "Leitura publica de artigos" ON articles FOR SELECT USING (true);
CREATE POLICY "Leitura publica de anuncios" ON ad_campaigns FOR SELECT USING (true);
CREATE POLICY "Leitura publica de ofertas" ON offers FOR SELECT USING (true);
CREATE POLICY "Leitura publica de comentarios" ON comments FOR SELECT USING (true);
CREATE POLICY "Leitura publica tenpets_articles" ON tenpets_articles FOR SELECT USING (true);
CREATE POLICY "Leitura publica tenpets_rescues" ON tenpets_rescues FOR SELECT USING (true);
CREATE POLICY "Leitura publica tenpets_partners" ON tenpets_partners FOR SELECT USING (true);
CREATE POLICY "Inscricao publica na newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Envio publico de leads B2B" ON leads FOR INSERT WITH CHECK (true);

-- Criar Índices de Alta Performance para Busca e SEO
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
`;
}

/**
 * Migrates/Syncs local storage data into Supabase
 */
export async function syncLocalDataToSupabase(): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Supabase não configurado.'
    };
  }

  let totalSynced = 0;

  try {
    // 1. Sync Categories
    const categories = getCategories();
    if (categories.length > 0) {
      const catPayload = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        color: c.color || '#145EDB',
        icon_name: c.iconName || 'Newspaper',
        order_index: c.order || 0
      }));
      const { error } = await client.from('categories').upsert(catPayload, { onConflict: 'id' });
      if (!error) totalSynced += categories.length;
    }

    // 2. Sync Authors
    const authors = getAuthors();
    if (authors.length > 0) {
      const authorPayload = authors.map(a => ({
        id: a.id,
        name: a.name,
        role_title: a.roleTitle,
        bio: a.bio,
        avatar: a.avatar,
        email: a.email,
        linkedin: a.socialLinks?.linkedin || '',
        articles_count: a.articlesCount || 0
      }));
      const { error } = await client.from('authors').upsert(authorPayload, { onConflict: 'id' });
      if (!error) totalSynced += authors.length;
    }

    // 3. Sync Articles
    const articles = getArticles();
    if (articles.length > 0) {
      const articlePayload = articles.map(art => ({
        id: art.id,
        title: art.title,
        subtitle: art.subtitle || '',
        summary: art.summary,
        category_id: art.categoryId,
        author_id: art.authorId,
        published_at: art.publishedAt,
        updated_at: art.updatedAt || art.publishedAt,
        status: art.status || 'PUBLISHED',
        featured_image: art.featuredImage,
        views_count: art.viewsCount || 0,
        slug: art.slug || art.id,
        tags: art.tags || [],
        seo: art.seo || {}
      }));
      const { error } = await client.from('articles').upsert(articlePayload, { onConflict: 'id' });
      if (!error) totalSynced += articles.length;
    }

    // 4. Sync Offers
    const offers = getOffers();
    if (offers.length > 0) {
      const offerPayload = offers.map(o => ({
        id: o.id,
        title: o.title,
        slug: o.slug,
        partner_id: o.partnerId,
        category_id: o.categoryId,
        badge_text: o.badgeText || '',
        short_description: o.shortDescription,
        full_description: o.fullDescription,
        image: o.image,
        featured: o.featured || false,
        clicks_count: o.clicksCount || 0
      }));
      const { error } = await client.from('offers').upsert(offerPayload, { onConflict: 'id' });
      if (!error) totalSynced += offers.length;
    }

    // 5. Sync Ad Campaigns
    const ads = getAds();
    if (ads.length > 0) {
      const adPayload = ads.map(ad => ({
        id: ad.id,
        name: ad.name,
        advertiser_name: ad.advertiserName,
        location: ad.location,
        image_url: ad.imageUrl || '',
        target_url: ad.targetUrl,
        start_date: ad.startDate,
        end_date: ad.endDate,
        clicks_count: ad.clicksCount || 0,
        impressions_count: ad.impressionsCount || 0,
        status: ad.status || 'ACTIVE'
      }));
      const { error } = await client.from('ad_campaigns').upsert(adPayload, { onConflict: 'id' });
      if (!error) totalSynced += ads.length;
    }

    // 6. Sync Leads
    const leads = getLeads();
    if (leads.length > 0) {
      const leadPayload = leads.map(l => ({
        id: l.id,
        offer_id: l.offerId,
        partner_id: l.partnerId,
        name: l.name,
        company: l.company || '',
        email: l.email,
        phone: l.phone || '',
        message: l.message || '',
        sector_interest: l.sectorInterest,
        status: l.status || 'NEW',
        created_at: l.createdAt
      }));
      const { error } = await client.from('leads').upsert(leadPayload, { onConflict: 'id' });
      if (!error) totalSynced += leads.length;
    }

    // 7. Sync Newsletter Subscribers
    const subscribers = getSubscribers();
    if (subscribers.length > 0) {
      const subPayload = subscribers.map(s => ({
        id: s.id,
        email: s.email,
        name: s.name,
        sector_interests: s.sectorInterests || [],
        status: s.status || 'SUBSCRIBED',
        subscribed_at: s.consentTimestamp || new Date().toISOString()
      }));
      const { error } = await client.from('newsletter_subscribers').upsert(subPayload, { onConflict: 'id' });
      if (!error) totalSynced += subscribers.length;
    }

    // 8. Sync TenPets Articles
    const tpArticles = getTenPetsArticles();
    if (tpArticles.length > 0) {
      const tpArtPayload = tpArticles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        summary: a.summary,
        content: a.content,
        author_name: a.authorName,
        category: a.category,
        published_at: a.publishedAt,
        image_url: a.imageUrl,
        pdf_url: a.pdfUrl || '',
        doi: a.doi || '',
        views_count: a.viewsCount || 0,
        featured: a.featured ?? true,
        tags: a.tags || []
      }));
      const { error } = await client.from('tenpets_articles').upsert(tpArtPayload, { onConflict: 'id' });
      if (!error) totalSynced += tpArticles.length;
    }

    // 9. Sync TenPets Rescues
    const tpRescues = getTenPetsRescues();
    if (tpRescues.length > 0) {
      const tpResPayload = tpRescues.map(r => ({
        id: r.id,
        animal_name: r.animalName,
        species: r.species,
        breed: r.breed || '',
        title: r.title,
        summary: r.summary,
        romantic_story: r.romanticStory,
        rescue_date: r.rescueDate,
        status: r.status,
        before_image_url: r.beforeImageUrl,
        after_image_url: r.afterImageUrl,
        video_url: r.videoUrl || '',
        vet_care_notes: r.vetCareNotes || '',
        sponsor_goal: r.sponsorGoal || 0,
        current_sponsor_total: r.currentSponsorTotal || 0,
        featured: r.featured ?? true
      }));
      const { error } = await client.from('tenpets_rescues').upsert(tpResPayload, { onConflict: 'id' });
      if (!error) totalSynced += tpRescues.length;
    }

    // 10. Sync TenPets Partners
    const tpPartners = getTenPetsPartners();
    if (tpPartners.length > 0) {
      const tpPartPayload = tpPartners.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        logo_url: p.logoUrl,
        description: p.description,
        website_url: p.websiteUrl,
        contact_email: p.contactEmail || '',
        discount_benefit: p.discountBenefit || '',
        featured: p.featured ?? true
      }));
      const { error } = await client.from('tenpets_partners').upsert(tpPartPayload, { onConflict: 'id' });
      if (!error) totalSynced += tpPartners.length;
    }

    return {
      success: true,
      syncedCount: totalSynced,
      message: `Sincronização concluída com sucesso! ${totalSynced} registros exportados para o Supabase.`
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount: totalSynced,
      message: `Erro durante a sincronização: ${err.message || 'Verifique se as tabelas foram criadas no Supabase.'}`
    };
  }
}
