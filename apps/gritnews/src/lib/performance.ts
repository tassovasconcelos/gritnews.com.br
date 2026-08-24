export type PerformanceSource = 'internal' | 'ga4' | 'search_console' | 'meta_organic' | 'meta_ads';
export type IntegrationStatus = 'connected' | 'pending' | 'error' | 'unavailable';

export interface PerformanceProject {
  id: string;
  name: string;
  host: string;
  status: 'live' | 'planned';
}

export interface PerformanceIntegration {
  id: PerformanceSource;
  name: string;
  status: IntegrationStatus;
  freshness: 'real_time' | 'delayed' | 'internal' | 'unavailable';
  description: string;
}

export const performanceProjects: PerformanceProject[] = [
  { id: 'gritnews', name: 'GRIT News', host: 'gritnews.com.br', status: 'live' },
  { id: 'meu-espetinho', name: 'Meu Espetinho', host: 'meuespetinho.gritnews.com.br', status: 'live' },
  { id: 'sr-padeiro', name: 'Sr. Padeiro', host: 'srpadeiro.gritnews.com.br', status: 'live' },
  { id: 'meu-orcamento', name: 'Meu Orçamento', host: 'meuorcamento.gritnews.com.br', status: 'planned' },
  { id: 'grit-propostas', name: 'GRIT Propostas', host: 'propostas.gritnews.com.br', status: 'planned' }
];

export const performanceIntegrations: PerformanceIntegration[] = [
  {
    id: 'internal',
    name: 'Dados internos GRIT',
    status: 'connected',
    freshness: 'internal',
    description: 'Leads, inscritos, visualizações e cliques registrados pelos apps.'
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    status: 'pending',
    freshness: 'unavailable',
    description: 'Aguardando conexão server-side com a propriedade GA4 de cada produto.'
  },
  {
    id: 'search_console',
    name: 'Google Search Console',
    status: 'pending',
    freshness: 'unavailable',
    description: 'Aguardando autorização oficial para cliques, impressões, CTR e posição.'
  },
  {
    id: 'meta_organic',
    name: 'Instagram / Facebook Insights',
    status: 'pending',
    freshness: 'unavailable',
    description: 'Aguardando conexão Meta Graph API para alcance, seguidores e engajamento.'
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    status: 'pending',
    freshness: 'unavailable',
    description: 'Aguardando conexão Meta Marketing API para mídia paga, CPL, CAC e ROAS.'
  }
];

export const performanceApiBase = import.meta.env.VITE_PERFORMANCE_API_BASE || '/api/performance';
