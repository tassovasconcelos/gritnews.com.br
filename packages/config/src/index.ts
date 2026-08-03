/// <reference types="vite/client" />

export const DOMAINS = {
  GRITNEWS: 'https://gritnews.com.br'
};

export const GRITNEWS_DOMAIN = 'gritnews.com.br';

export const APPS = {
  GRITNEWS: {
    name: 'GRIT NEWS',
    description: 'Portal de Notícias B2B, Inteligência de Mercado e Conteúdo Especializado',
    domain: DOMAINS.GRITNEWS,
  }
};

export const getSupabaseConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
});
