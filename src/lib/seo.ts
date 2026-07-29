import { Article, Category, AuthorProfile } from '../types';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  imageUrl?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  categoryName?: string;
}

const BASE_URL = 'https://www.gritnews.com.br';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200';

/**
 * Dynamically updates document head metadata and injects JSON-LD Structured Data
 */
export function updatePageSEO(config: SEOConfig) {
  // 1. Page Title
  const formattedTitle = config.title.includes('GRIT NEWS')
    ? config.title
    : `${config.title} | GRIT NEWS - Inteligência de Mercado`;
  document.title = formattedTitle;

  // Helper to set meta tag
  const setMeta = (nameAttr: string, attrVal: string, content: string) => {
    let el = document.querySelector(`meta[${nameAttr}="${attrVal}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(nameAttr, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 2. Standard Meta Tags
  setMeta('name', 'title', formattedTitle);
  setMeta('name', 'description', config.description);
  setMeta('name', 'keywords', (config.keywords || ['GRIT NEWS', 'Notícias B2B', 'Inteligência de Mercado', 'Brasil']).join(', '));
  setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // 3. Canonical Link
  const canonical = config.canonicalUrl || BASE_URL;
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', canonical);

  // 4. OpenGraph Tags
  setMeta('property', 'og:title', formattedTitle);
  setMeta('property', 'og:description', config.description);
  setMeta('property', 'og:type', config.type || 'website');
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:image', config.imageUrl || DEFAULT_IMAGE);
  setMeta('property', 'og:site_name', 'GRIT NEWS');
  setMeta('property', 'og:locale', 'pt_BR');

  if (config.publishedTime) {
    setMeta('property', 'article:published_time', config.publishedTime);
  }
  if (config.modifiedTime) {
    setMeta('property', 'article:modified_time', config.modifiedTime);
  }
  if (config.authorName) {
    setMeta('property', 'article:author', config.authorName);
  }
  if (config.categoryName) {
    setMeta('property', 'article:section', config.categoryName);
  }

  // 5. Twitter Card Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', formattedTitle);
  setMeta('name', 'twitter:description', config.description);
  setMeta('name', 'twitter:image', config.imageUrl || DEFAULT_IMAGE);
}

/**
 * Injects Google JSON-LD Schema.org for NewsArticle
 */
export function injectArticleSchema(article: Article, category?: Category, author?: AuthorProfile) {
  const articleUrl = `${BASE_URL}/noticia/${article.slug || article.id}`;
  
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    'headline': article.title,
    'description': article.summary || article.subtitle,
    'image': [article.featuredImage || DEFAULT_IMAGE],
    'datePublished': article.publishedAt,
    'dateModified': article.updatedAt || article.publishedAt,
    'author': {
      '@type': 'Person',
      'name': author?.name || 'Redação Grit News',
      'jobTitle': author?.roleTitle || 'Jornalista de Mercado',
      'url': `${BASE_URL}/autor/${author?.id || 'redacao'}`
    },
    'publisher': {
      '@type': 'NewsMediaOrganization',
      'name': 'GRIT NEWS',
      'url': BASE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE_URL}/logo.png`,
        'width': 600,
        'height': 60
      },
      'sameAs': [
        'https://instagram.com/gritnews',
        'https://linkedin.com/company/gritnews'
      ]
    },
    'articleSection': category?.name || 'Negócios',
    'keywords': article.tags ? article.tags.join(', ') : 'Notícias, B2B, Mercado',
    'inLanguage': 'pt-BR',
    'isAccessibleForFree': 'true'
  };

  injectJSONLD('schema-news-article', schemaData);

  // Breadcrumb Schema
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Início',
        'item': BASE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': category?.name || 'Notícias',
        'item': `${BASE_URL}/categoria/${category?.slug || 'geral'}`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': article.title,
        'item': articleUrl
      }
    ]
  };

  injectJSONLD('schema-breadcrumb', breadcrumbData);
}

/**
 * Injects Google Sitelinks & Organization Schema for Home / Portal
 */
export function injectWebsiteSchema() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'GRIT NEWS',
    'alternateName': 'Grit News Inteligência de Mercado',
    'url': BASE_URL,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${BASE_URL}/busca?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    'name': 'GRIT NEWS',
    'url': BASE_URL,
    'logo': `${BASE_URL}/logo.png`,
    'description': 'Informação que gera oportunidades. O portal que reúne notícias B2B, inovação, saúde, pet, automação e importação.',
    'contactPoint': {
      '@type': 'ContactPoint',
      'email': 'contato@gritnews.com.br',
      'contactType': 'customer support',
      'areaServed': 'BR',
      'availableLanguage': 'Portuguese'
    }
  };

  injectJSONLD('schema-website', websiteSchema);
  injectJSONLD('schema-organization', orgSchema);
}

function injectJSONLD(scriptId: string, data: object) {
  let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = scriptId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(data);
}
