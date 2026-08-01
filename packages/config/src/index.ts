export const DOMAINS = {
  GRITNEWS: 'https://gritnews.com.br',
  SACPROH: 'https://sacproh.gritnews.com.br'
};

export const SACPROH_DOMAIN = 'sacproh.gritnews.com.br';
export const GRITNEWS_DOMAIN = 'gritnews.com.br';

export const APPS = {
  GRITNEWS: {
    name: 'GRIT NEWS',
    description: 'Portal de Notícias B2B, Inteligência de Mercado e Conteúdo Especializado',
    domain: DOMAINS.GRITNEWS,
  },
  SACPROH: {
    name: 'SACPROH',
    description: 'Sistema Atendimento ao Cliente PROH - Suporte Hospitalar e Cirúrgico',
    domain: DOMAINS.SACPROH,
  }
};

export const getSupabaseConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
});
