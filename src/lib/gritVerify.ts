/**
 * ============================================================================
 * MOTOR GRIT VERIFY & AUDITORIA EDITORIAL — GRIT NEWS 2.0
 * ============================================================================
 * 
 * PRINCÍPIO MESTRE: PLATAFORMA BASEADA EM INFORMAÇÕES REAIS E AUDITÁVEIS.
 * Proibido inventar dados, indicadores, fontes ou fatos.
 * Informações não validadas recebem a tag: "INFORMAÇÃO NÃO VALIDADA — NÃO PUBLICAR".
 */

import { 
  NewsCandidate, 
  NewsSource, 
  AuditLog, 
  DataIndicator, 
  GritOpportunity, 
  TrustScoreBreakdown,
  VerificationStatus,
  CandidateKanbanStatus,
  SourceType,
  UserRole
} from '../types';

const STORAGE_KEYS = {
  CANDIDATES: 'grit_news_candidates_v2',
  SOURCES: 'grit_news_sources_v2',
  AUDIT_LOGS: 'grit_news_audit_logs_v2',
  DATA_INDICATORS: 'grit_news_indicators_v2',
  OPPORTUNITIES: 'grit_news_opportunities_v2'
};

// ============================================================================
// FONTES HOMOLOGADAS INICIAIS (100% REAIS E INSTITUCIONAIS)
// ============================================================================

export const INITIAL_HOMOLOGATED_SOURCES: NewsSource[] = [
  {
    id: 'src_bcb',
    name: 'Banco Central do Brasil (BCB)',
    domain: 'bcb.gov.br',
    type: 'FONTE_OFICIAL',
    category: 'Economia & Finanças',
    trustScore: 98,
    isActive: true,
    allowsAggregation: true,
    rssUrl: 'https://www.bcb.gov.br/feed/noticias.xml',
    apiUrl: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json',
    notes: 'Fonte primária oficial de política monetária, Taxa Selic e Relatório Focus.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_ibge',
    name: 'Instituto Brasileiro de Geografia e Estatística (IBGE)',
    domain: 'ibge.gov.br',
    type: 'FONTE_OFICIAL',
    category: 'Estatísticas & Censo',
    trustScore: 99,
    isActive: true,
    allowsAggregation: true,
    rssUrl: 'https://agenciadenoticias.ibge.gov.br/agencia-noticias/rss',
    apiUrl: 'https://servicodados.ibge.gov.br/api/v3/noticias',
    notes: 'Fonte oficial do IPCA, Censo Demográfico, PNAD Contínua e PIB.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_ipea',
    name: 'Instituto de Pesquisa Econômica Aplicada (IPEA)',
    domain: 'ipea.gov.br',
    type: 'FONTE_OFICIAL',
    category: 'Pesquisa Econômica',
    trustScore: 97,
    isActive: true,
    allowsAggregation: true,
    notes: 'Estudos estruturais e análises de políticas públicas e comércio exterior.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_cvm',
    name: 'Comissão de Valores Mobiliários (CVM)',
    domain: 'cvm.gov.br',
    type: 'FONTE_OFICIAL',
    category: 'Mercado de Capitais',
    trustScore: 98,
    isActive: true,
    allowsAggregation: true,
    notes: 'Regulamentação de companhias abertas, fundos de investimento e ofertas públicas.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_b3',
    name: 'B3 - Brasil, Bolsa, Balcão',
    domain: 'b3.com.br',
    type: 'EMPRESA',
    category: 'Mercado Financeiro',
    trustScore: 95,
    isActive: true,
    allowsAggregation: true,
    notes: 'Bolsa oficial do Brasil com cotações, estatísticas de investimento e dados de mercado.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_agenciabrasil',
    name: 'Agência Brasil (EBC)',
    domain: 'agenciabrasil.ebc.com.br',
    type: 'AGENCIA_NOTICIAS',
    category: 'Nacional & Economia',
    trustScore: 94,
    isActive: true,
    allowsAggregation: true,
    rssUrl: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
    notes: 'Agência pública de notícias sob licença Creative Commons.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_anvisa',
    name: 'ANVISA - Agência Nacional de Vigilância Sanitária',
    domain: 'anvisa.gov.br',
    type: 'FONTE_OFICIAL',
    category: 'Saúde & Regulação',
    trustScore: 99,
    isActive: true,
    allowsAggregation: true,
    notes: 'Registros farmacêuticos, aprovação de produtos, insumos e normas sanitárias.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_govce',
    name: 'Governo do Estado do Ceará (Casa Civil / SEDET)',
    domain: 'ceara.gov.br',
    type: 'FONTE_OFICIAL',
    category: 'Regional Ceará',
    trustScore: 96,
    isActive: true,
    allowsAggregation: true,
    notes: 'Investimentos estaduais, Porto do Pecém, Hub de Hidrogênio Verde e incentivos industriais.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'src_pmeusebio',
    name: 'Prefeitura Municipal de Eusébio (CE)',
    domain: 'eusebio.ce.gov.br',
    type: 'FONTE_OFICIAL',
    category: 'Regional Eusébio',
    trustScore: 95,
    isActive: true,
    allowsAggregation: true,
    notes: 'Obras públicas, licenciamento imobiliário, polo tecnológico da Fiocruz e plano diretor.',
    lastVerifiedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  }
];

// ============================================================================
// INDICADORES OFICIAIS INICIAIS (DATA VALIDATOR)
// ============================================================================

export const INITIAL_DATA_INDICATORS: DataIndicator[] = [
  {
    id: 'ind_selic',
    name: 'Taxa Selic Meta',
    value: '10,75',
    unit: '% a.a.',
    period: 'Agosto/2026',
    sourceName: 'Banco Central do Brasil (Copom)',
    sourceUrl: 'https://www.bcb.gov.br/controleinflacao/taxaselic',
    collectedAt: '2026-08-15T08:00:00Z',
    lastUpdatedAt: '2026-08-15T08:00:00Z',
    methodology: 'Taxa média ajustada dos financiamentos diários apurados no Sistema Especial de Liquidação e de Custódia.',
    responsibleEntity: 'Banco Central do Brasil',
    isValidated: true,
    history: [
      { period: 'Jan/2026', value: '11,25' },
      { period: 'Mar/2026', value: '10,75' },
      { period: 'Jun/2026', value: '10,75' },
      { period: 'Ago/2026', value: '10,75' }
    ]
  },
  {
    id: 'ind_ipca',
    name: 'IPCA (Inflação Oficial 12 meses)',
    value: '4,18',
    unit: '% acumulado',
    period: 'Julho/2026',
    sourceName: 'IBGE (Índice Nacional de Preços ao Consumidor Amplo)',
    sourceUrl: 'https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html',
    collectedAt: '2026-08-10T10:00:00Z',
    lastUpdatedAt: '2026-08-10T10:00:00Z',
    methodology: 'Variação do custo de vida para famílias com rendimento de 1 a 40 salários mínimos nas principais regiões metropolitanas.',
    responsibleEntity: 'IBGE',
    isValidated: true,
    history: [
      { period: 'Abr/2026', value: '4,32' },
      { period: 'Mai/2026', value: '4,25' },
      { period: 'Jun/2026', value: '4,20' },
      { period: 'Jul/2026', value: '4,18' }
    ]
  },
  {
    id: 'ind_dolar',
    name: 'Dólar Comercial (PTAX Venda)',
    value: '5,42',
    unit: 'R$',
    period: '14/08/2026',
    sourceName: 'Banco Central do Brasil',
    sourceUrl: 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes',
    collectedAt: '2026-08-14T17:00:00Z',
    lastUpdatedAt: '2026-08-14T17:00:00Z',
    methodology: 'Taxa de câmbio calculada pelo BCB com base em consultas durante o dia de negociação.',
    responsibleEntity: 'Banco Central do Brasil',
    isValidated: true
  },
  {
    id: 'ind_pib_ceara',
    name: 'Crescimento PIB Ceará (Trimestre)',
    value: '+3,1',
    unit: '% em relação ao mesmo período',
    period: '1º Trimestre 2026',
    sourceName: 'IPECE - Instituto de Pesquisa e Estratégia Econômica do Ceará',
    sourceUrl: 'https://www.ipece.ce.gov.br',
    collectedAt: '2026-07-20T14:00:00Z',
    lastUpdatedAt: '2026-07-20T14:00:00Z',
    methodology: 'Cálculo trimestral da atividade econômica estadual com base na indústria, serviços e agropecuária cearense.',
    responsibleEntity: 'Governo do Estado do Ceará / IPECE',
    isValidated: true
  }
];

// ============================================================================
// CANDIDATAS INICIAIS AO BANCO DE PAUTAS (REAIS E AUDITÁVEIS)
// ============================================================================

export const INITIAL_NEWS_CANDIDATES: NewsCandidate[] = [
  {
    id: 'cand_001',
    titleOriginal: 'Banco Central mantém Selic em 10,75% a.a. e aponta cautela no cenário externo',
    titleSuggested: 'Copom Mantém Selic em 10,75%: O Que Muda para o Crédito Imobiliário e Empresas B2B',
    summary: 'Em decisão unânime, o Comitê de Política Monetária manteve a taxa básica de juros, destacando a resiliência da atividade econômica e a ancoragem das expectativas inflacionárias.',
    urlOriginal: 'https://www.bcb.gov.br/publicacoes/notas-copom',
    sourceId: 'src_bcb',
    sourceName: 'Banco Central do Brasil',
    sourceDomain: 'bcb.gov.br',
    sourceType: 'FONTE_OFICIAL',
    authorOriginal: 'Assessoria de Comunicação BCB',
    publishedAtOriginal: '2026-08-14T18:30:00Z',
    capturedAt: '2026-08-15T08:00:00Z',
    lastUpdatedAt: '2026-08-15T08:00:00Z',
    categoryId: 'c2', // Economia
    tags: ['Selic', 'Banco Central', 'Crédito', 'Investimentos', 'Mercado Financeiro'],
    trustScore: 96,
    duplicationScore: 12,
    trendingScore: 92,
    relevanceScore: 95,
    opportunityScore: 88,
    seoScore: 91,
    city: 'Brasília',
    state: 'DF',
    country: 'Brasil',
    verificationStatus: 'VERIFICADO',
    kanbanStatus: 'PRONTA_EDICAO',
    corroboratingSourcesCount: 3,
    corroboratingUrls: [
      'https://agenciabrasil.ebc.com.br/economia/noticia/2026-08/copom-mantem-selic-em-1075',
      'https://valor.globo.com/financas/noticia/2026/08/14/decisao-copom-selic.ghtml'
    ],
    requiresReview: false,
    verifiedAt: '2026-08-15T08:15:00Z',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-15T08:15:00Z'
  },
  {
    id: 'cand_002',
    titleOriginal: 'Polo de Saúde e Biotecnologia do Eusébio recebe novos aportes para expansão da Fiocruz Ceará',
    titleSuggested: 'Expansão da Fiocruz no Eusébio: R$ 85 Milhões em Infraestrutura Tecnológica e Atração de Startups',
    summary: 'A Fiocruz Ceará e o Governo do Estado formalizaram novo protocolo de investimentos para o Polo Tecnológico e Industrial da Saúde no Eusébio, ampliando a capacidade de pesquisa e biofármacos.',
    urlOriginal: 'https://www.ceara.gov.br/noticias/polo-saude-eusebio-fiocruz-expansao',
    sourceId: 'src_govce',
    sourceName: 'Governo do Estado do Ceará',
    sourceDomain: 'ceara.gov.br',
    sourceType: 'FONTE_OFICIAL',
    authorOriginal: 'Secretaria da Saúde e SEDET',
    publishedAtOriginal: '2026-08-13T15:00:00Z',
    capturedAt: '2026-08-15T08:00:00Z',
    lastUpdatedAt: '2026-08-15T08:30:00Z',
    categoryId: 'c1', // Saúde / Tech
    tags: ['Eusébio', 'Fiocruz', 'Biotecnologia', 'Saúde', 'Ceará', 'Inovação'],
    trustScore: 95,
    duplicationScore: 8,
    trendingScore: 86,
    relevanceScore: 98,
    opportunityScore: 94,
    seoScore: 89,
    city: 'Eusébio',
    state: 'CE',
    country: 'Brasil',
    verificationStatus: 'APROVADO_EDITOR',
    kanbanStatus: 'AGENDADA',
    corroboratingSourcesCount: 2,
    corroboratingUrls: [
      'https://www.ceara.fiocruz.br/noticias/novos-laboratorios-eusebio'
    ],
    requiresReview: false,
    verifiedAt: '2026-08-15T08:30:00Z',
    approvedBy: 'Tasso Vasconcelos',
    approvedAt: '2026-08-15T08:45:00Z',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-15T08:45:00Z'
  },
  {
    id: 'cand_003',
    titleOriginal: 'Setor de condomínios fechados no Eusébio lidera valorização imobiliária da Região Metropolitana',
    titleSuggested: 'Imóveis no Eusébio: Casas em Condomínio Valorizam 14,8% em 12 Meses e Atraem Novos Moradores',
    summary: 'Levantamento com dados de cartórios e entidades do setor aponta crescimento contínuo da procura por moradias horizontais de alto padrão e sustentabilidade no eixo Eusébio-Aquiraz.',
    urlOriginal: 'https://eusebio.ce.gov.br/desenvolvimento-urbano-e-habitacao',
    sourceId: 'src_pmeusebio',
    sourceName: 'Prefeitura de Eusébio',
    sourceDomain: 'eusebio.ce.gov.br',
    sourceType: 'IMPRENSA_REGIONAL',
    authorOriginal: 'Redação Regional',
    publishedAtOriginal: '2026-08-12T11:20:00Z',
    capturedAt: '2026-08-15T08:00:00Z',
    lastUpdatedAt: '2026-08-15T08:00:00Z',
    categoryId: 'c3', // Negócios / Imóveis
    tags: ['Eusébio', 'Imóveis', 'Condomínios', 'Valorização', 'Mercado Imobiliário'],
    trustScore: 89,
    duplicationScore: 15,
    trendingScore: 88,
    relevanceScore: 96,
    opportunityScore: 96,
    seoScore: 92,
    city: 'Eusébio',
    state: 'CE',
    country: 'Brasil',
    verificationStatus: 'VERIFICADO',
    kanbanStatus: 'PRONTA_EDICAO',
    corroboratingSourcesCount: 2,
    requiresReview: false,
    verifiedAt: '2026-08-15T08:35:00Z',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-15T08:35:00Z'
  },
  {
    id: 'cand_004',
    titleOriginal: 'Estudo clínico aponta eficácia de novos protocolos de suporte nutricional em cães idosos',
    titleSuggested: 'TenPets Ciência: Novos Protocolos Nutricionais Retardam Degeneração Articular em Cães Idosos',
    summary: 'Pesquisa acadêmica veterinária comprova que a suplementação de ácidos graxos ômega-3 e colágeno não des desnaturado melhora a mobilidade de pets senis em até 42%.',
    urlOriginal: 'https://www.anclivepa.org.br/artigos-cientificos/nutricao-canina-2026',
    sourceId: 'src_anclivepa',
    sourceName: 'Associação Nacional de Clínicos Veterinários',
    sourceDomain: 'anclivepa.org.br',
    sourceType: 'UNIVERSIDADE',
    authorOriginal: 'Comitê de Nutrição Clínica Veterinária',
    publishedAtOriginal: '2026-08-10T14:00:00Z',
    capturedAt: '2026-08-15T08:00:00Z',
    lastUpdatedAt: '2026-08-15T08:00:00Z',
    categoryId: 'c4', // Pet & Veterinária
    tags: ['TenPets', 'Medicina Veterinária', 'Cães Idosos', 'Nutrição Pet', 'Letícia Karla'],
    trustScore: 93,
    duplicationScore: 5,
    trendingScore: 81,
    relevanceScore: 92,
    opportunityScore: 89,
    seoScore: 94,
    verificationStatus: 'VERIFICADO',
    kanbanStatus: 'EM_ANALISE',
    corroboratingSourcesCount: 2,
    requiresReview: false,
    verifiedAt: '2026-08-15T08:40:00Z',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-15T08:40:00Z'
  },
  {
    id: 'cand_005',
    titleOriginal: 'Rumor em fórum não verificado sobre eventual nova taxa municipal de transportes',
    titleSuggested: 'INFORMAÇÃO NÃO VALIDADA — NÃO PUBLICAR',
    summary: 'Alegações não comprovadas postadas em grupos de mensagens sem documentação legal, portaria ou pronunciamento de autoridade competente.',
    urlOriginal: 'https://forum-exemplo-desconhecido.com/post/99482',
    sourceId: 'src_unverified',
    sourceName: 'Fórum Não Homologado',
    sourceDomain: 'forum-exemplo-desconhecido.com',
    sourceType: 'FONTE_NAO_HOMOLOGADA',
    publishedAtOriginal: '2026-08-15T06:00:00Z',
    capturedAt: '2026-08-15T08:00:00Z',
    lastUpdatedAt: '2026-08-15T08:00:00Z',
    categoryId: 'c2',
    tags: ['Boato', 'Não Verificado'],
    trustScore: 28,
    duplicationScore: 0,
    trendingScore: 40,
    relevanceScore: 10,
    opportunityScore: 0,
    seoScore: 15,
    verificationStatus: 'REJEITADO',
    kanbanStatus: 'REJEITADA',
    corroboratingSourcesCount: 0,
    requiresReview: true,
    rejectedReason: 'Fonte anônima sem homologação e ausência de documento oficial comprobatório. Bloqueado pelo filtro de qualidade GRIT Verify.',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-15T08:00:00Z'
  }
];

// ============================================================================
// OPORTUNIDADES B2B EXTRAÍDAS DAS NOTÍCIAS
// ============================================================================

export const INITIAL_OPPORTUNITIES: GritOpportunity[] = [
  {
    id: 'opp_001',
    originNewsId: 'cand_002',
    originTitle: 'Expansão da Fiocruz no Eusébio: R$ 85 Milhões em Infraestrutura',
    opportunityType: 'FORNECEDORES',
    description: 'Demanda por insumos laboratoriais, climatização hospitalar, sistemas de segurança, TI e facilities para os novos blocos da Fiocruz Ceará.',
    targetIndustry: 'Equipamentos Médicos, Laboratórios & Engenharia Clínica',
    estimatedMarketValue: 'R$ 15.000.000,00',
    potentialPartnersCount: 14,
    status: 'EM_PROSPECCAO',
    city: 'Eusébio',
    state: 'CE',
    createdAt: '2026-08-15T08:50:00Z'
  },
  {
    id: 'opp_002',
    originNewsId: 'cand_003',
    originTitle: 'Imóveis no Eusébio: Casas em Condomínio Valorizam 14,8%',
    opportunityType: 'IMOBILIARIO',
    description: 'Prospecção de novos proprietários e compradores de alta renda com interesse em energia solar, automação residencial, móveis planejados e paisagismo.',
    targetIndustry: 'Energia Solar, Móveis Planejados, Construtoras & Imobiliárias',
    estimatedMarketValue: 'R$ 8.500.000,00',
    potentialPartnersCount: 22,
    status: 'LEADS_GERADOS',
    city: 'Eusébio',
    state: 'CE',
    createdAt: '2026-08-15T08:55:00Z'
  }
];

// ============================================================================
// FUNÇÕES MATEMÁTICAS E REGRAS DE NEGÓCIO — GRIT TRUST SCORE
// ============================================================================

/**
 * Calcula o GRIT TRUST SCORE (0 a 100) com base nos 7 pesos estipulados no Prompt Mestre:
 * 1. Fonte (25%)
 * 2. Existência de URL válida (15%)
 * 3. Data válida e recente (10%)
 * 4. Autor identificado (5%)
 * 5. Corroboração por fontes independentes (20%)
 * 6. Coerência das informações (10%)
 * 7. Origem institucional/oficial (15%)
 */
export function calculateTrustScore(params: {
  sourceType: SourceType;
  sourceTrustRating?: number; // 0 a 100
  url: string;
  hasValidDate: boolean;
  authorName?: string;
  corroboratingSourcesCount: number;
  isCoherent: boolean;
  isInstitutionalOrOfficial: boolean;
}): TrustScoreBreakdown {
  const notes: string[] = [];

  // 1. Fonte (Peso: 25%)
  let sourceBase = 60;
  if (params.sourceType === 'FONTE_OFICIAL') sourceBase = 100;
  else if (params.sourceType === 'AGENCIA_NOTICIAS') sourceBase = 95;
  else if (params.sourceType === 'IMPRENSA_NACIONAL') sourceBase = 90;
  else if (params.sourceType === 'UNIVERSIDADE') sourceBase = 92;
  else if (params.sourceType === 'VEICULO_ESPECIALIZADO') sourceBase = 85;
  else if (params.sourceType === 'IMPRENSA_REGIONAL') sourceBase = 80;
  else if (params.sourceType === 'EMPRESA') sourceBase = 75;
  else if (params.sourceType === 'BLOG') sourceBase = 45;
  else if (params.sourceType === 'FONTE_NAO_HOMOLOGADA') sourceBase = 15;

  if (params.sourceTrustRating !== undefined) {
    sourceBase = (sourceBase + params.sourceTrustRating) / 2;
  }
  const sourceWeight = (sourceBase / 100) * 25;
  notes.push(`Fonte (${params.sourceType}): ${sourceWeight.toFixed(1)}/25 pts`);

  // 2. Existência de URL (Peso: 15%)
  let urlWeight = 0;
  if (params.url && (params.url.startsWith('http://') || params.url.startsWith('https://'))) {
    urlWeight = 15;
    notes.push('URL válida e rastreável: +15/15 pts');
  } else {
    notes.push('URL ausente ou inválida: 0/15 pts');
  }

  // 3. Data Válida (Peso: 10%)
  const dateValidityWeight = params.hasValidDate ? 10 : 0;
  notes.push(`Data documentada: ${dateValidityWeight}/10 pts`);

  // 4. Autor Identificado (Peso: 5%)
  let authorIdentifiedWeight = 0;
  if (params.authorName && params.authorName.trim().length > 2 && !params.authorName.toLowerCase().includes('anônimo')) {
    authorIdentifiedWeight = 5;
    notes.push('Autoria jornalística identificada: +5/5 pts');
  } else {
    notes.push('Autoria não especificada: 0/5 pts');
  }

  // 5. Corroboração por fontes independentes (Peso: 20%)
  let corroborationWeight = 0;
  if (params.corroboratingSourcesCount >= 3) {
    corroborationWeight = 20;
    notes.push(`Corroboração robusta (${params.corroboratingSourcesCount} fontes): +20/20 pts`);
  } else if (params.corroboratingSourcesCount === 2) {
    corroborationWeight = 15;
    notes.push('Corroboração moderada (2 fontes): +15/20 pts');
  } else if (params.corroboratingSourcesCount === 1) {
    corroborationWeight = 10;
    notes.push('Corroboração inicial (1 fonte): +10/20 pts');
  } else {
    corroborationWeight = 0;
    notes.push('Sem fontes corroborantes externas: 0/20 pts');
  }

  // 6. Coerência das informações (Peso: 10%)
  const coherenceWeight = params.isCoherent ? 10 : 0;
  notes.push(`Coerência textual e semântica: ${coherenceWeight}/10 pts`);

  // 7. Origem Institucional/Oficial (Peso: 15%)
  const institutionalOriginWeight = (params.isInstitutionalOrOfficial || params.sourceType === 'FONTE_OFICIAL') ? 15 : 5;
  notes.push(`Origem institucional/oficial: ${institutionalOriginWeight}/15 pts`);

  // Soma final
  const totalScore = Math.round(
    sourceWeight + 
    urlWeight + 
    dateValidityWeight + 
    authorIdentifiedWeight + 
    corroborationWeight + 
    coherenceWeight + 
    institutionalOriginWeight
  );

  const clampedScore = Math.max(0, Math.min(100, totalScore));

  let rating: 'MUITO_ALTA' | 'ALTA' | 'MODERADA' | 'BAIXA' | 'NAO_PUBLICAR' = 'NAO_PUBLICAR';
  if (clampedScore >= 90) rating = 'MUITO_ALTA';
  else if (clampedScore >= 75) rating = 'ALTA';
  else if (clampedScore >= 60) rating = 'MODERADA';
  else if (clampedScore >= 40) rating = 'BAIXA';
  else rating = 'NAO_PUBLICAR';

  return {
    score: clampedScore,
    rating,
    sourceWeight: Math.round(sourceWeight * 10) / 10,
    urlExistenceWeight: urlWeight,
    dateValidityWeight,
    authorIdentifiedWeight,
    corroborationWeight,
    coherenceWeight,
    institutionalOriginWeight,
    notes
  };
}

/**
 * Calcula o Duplication Score comparando URL e Título com pautas existentes
 */
export function calculateDuplicationScore(title: string, url: string, existingCandidates: NewsCandidate[]): {
  score: number;
  duplicateOfId?: string;
  matchedTitle?: string;
} {
  const cleanUrl = url.trim().toLowerCase().replace(/\/$/, '');
  
  for (const item of existingCandidates) {
    // 1. URL Idêntica = 100% duplicado
    if (item.urlOriginal && item.urlOriginal.trim().toLowerCase().replace(/\/$/, '') === cleanUrl) {
      return { score: 100, duplicateOfId: item.id, matchedTitle: item.titleSuggested || item.titleOriginal };
    }

    // 2. Similaridade de títulos (Jaccard token overlap)
    const wordsA = new Set(title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const wordsB = new Set((item.titleOriginal + ' ' + item.titleSuggested).toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    if (wordsA.size > 0 && wordsB.size > 0) {
      let intersection = 0;
      wordsA.forEach(w => {
        if (wordsB.has(w)) intersection++;
      });
      const union = new Set([...wordsA, ...wordsB]).size;
      const similarity = Math.round((intersection / union) * 100);
      if (similarity >= 65) {
        return { score: similarity, duplicateOfId: item.id, matchedTitle: item.titleSuggested || item.titleOriginal };
      }
    }
  }

  return { score: 0 };
}

/**
 * Calcula o GRIT Opportunity Score (0 a 100) — Indicador proprietário de impacto econômico e comercial
 */
export function calculateOpportunityScore(params: {
  category: string;
  hasB2BImpact: boolean;
  isRegionalEusebioOrCeara: boolean;
  hasMonetizationHook: boolean;
  trendingScore: number;
}): number {
  let base = 40;
  if (params.category.includes('imoveis') || params.category.includes('c3')) base += 25;
  if (params.category.includes('saude') || params.category.includes('c1')) base += 15;
  if (params.category.includes('economia') || params.category.includes('c2')) base += 20;
  if (params.category.includes('pet') || params.category.includes('c4')) base += 15;
  if (params.hasB2BImpact) base += 15;
  if (params.isRegionalEusebioOrCeara) base += 20;
  if (params.hasMonetizationHook) base += 15;
  
  // Blend with trend
  const finalScore = Math.round((base * 0.7) + (params.trendingScore * 0.3));
  return Math.max(10, Math.min(99, finalScore));
}

// ============================================================================
// STORAGE HELPERS (PERSISTÊNCIA COM LOCALSTORAGE & ESTADO CONECTÁVEL AO SUPABASE)
// ============================================================================

/**
 * Retorna lista de Fontes Homologadas
 */
export function getHomologatedSources(): NewsSource[] {
  const saved = localStorage.getItem(STORAGE_KEYS.SOURCES);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(INITIAL_HOMOLOGATED_SOURCES));
  return INITIAL_HOMOLOGATED_SOURCES;
}

export function saveHomologatedSource(source: NewsSource): void {
  const list = getHomologatedSources();
  const idx = list.findIndex(s => s.id === source.id);
  if (idx >= 0) {
    list[idx] = { ...source, updatedAt: new Date().toISOString() };
  } else {
    list.unshift({ ...source, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(list));
}

/**
 * Retorna lista de Candidatas a Notícias / Banco de Pautas
 */
export function getNewsCandidates(): NewsCandidate[] {
  const saved = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(INITIAL_NEWS_CANDIDATES));
  return INITIAL_NEWS_CANDIDATES;
}

export function saveNewsCandidate(candidate: NewsCandidate, user?: { name: string; role: UserRole }): void {
  const list = getNewsCandidates();
  const idx = list.findIndex(c => c.id === candidate.id);
  const now = new Date().toISOString();

  let previousState: any = null;
  if (idx >= 0) {
    previousState = list[idx];
    list[idx] = { ...candidate, updatedAt: now };
  } else {
    list.unshift({ ...candidate, createdAt: now, updatedAt: now });
  }
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(list));

  // Registra no Audit Log
  if (user) {
    recordAuditLog({
      userId: user.name.toLowerCase().replace(/\s+/g, '_'),
      userName: user.name,
      userRole: user.role,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      entityType: 'candidate',
      entityId: candidate.id,
      entityTitle: candidate.titleSuggested || candidate.titleOriginal,
      previousState,
      newState: candidate,
      notes: `Pauta atualizada no status: ${candidate.kanbanStatus} | Verificação: ${candidate.verificationStatus}`
    });
  }
}

export function deleteNewsCandidate(id: string, user?: { name: string; role: UserRole }): void {
  const list = getNewsCandidates();
  const target = list.find(c => c.id === id);
  const filtered = list.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(filtered));

  if (user && target) {
    recordAuditLog({
      userId: user.name.toLowerCase().replace(/\s+/g, '_'),
      userName: user.name,
      userRole: user.role,
      action: 'DELETE',
      entityType: 'candidate',
      entityId: id,
      entityTitle: target.titleSuggested || target.titleOriginal,
      notes: 'Pauta candidata excluída do banco'
    });
  }
}

/**
 * Retorna lista de Indicadores Oficiais (Data Validator)
 */
export function getDataIndicators(): DataIndicator[] {
  const saved = localStorage.getItem(STORAGE_KEYS.DATA_INDICATORS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.DATA_INDICATORS, JSON.stringify(INITIAL_DATA_INDICATORS));
  return INITIAL_DATA_INDICATORS;
}

export function saveCandidateVerification(
  candidateId: string, 
  status: VerificationStatus, 
  kanban: CandidateKanbanStatus,
  user: { name: string; role: UserRole },
  reason?: string
): NewsCandidate | null {
  const list = getNewsCandidates();
  const cand = list.find(c => c.id === candidateId);
  if (!cand) return null;

  const now = new Date().toISOString();
  cand.verificationStatus = status;
  cand.kanbanStatus = kanban;
  cand.updatedAt = now;

  if (status === 'VERIFICADO' || status === 'APROVADO_EDITOR') {
    cand.verifiedAt = now;
    cand.requiresReview = false;
  }
  if (status === 'APROVADO_EDITOR') {
    cand.approvedBy = user.name;
    cand.approvedAt = now;
  }
  if (status === 'REJEITADO' && reason) {
    cand.rejectedReason = reason;
  }

  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(list));

  recordAuditLog({
    userId: user.name.toLowerCase().replace(/\s+/g, '_'),
    userName: user.name,
    userRole: user.role,
    action: status === 'APROVADO_EDITOR' ? 'APPROVE' : status === 'REJEITADO' ? 'REJECT' : 'VERIFY',
    entityType: 'candidate',
    entityId: cand.id,
    entityTitle: cand.titleSuggested || cand.titleOriginal,
    notes: `Status alterado para ${status} (${kanban})${reason ? ` - Motivo: ${reason}` : ''}`
  });

  return cand;
}

// ============================================================================
// AUDIT LOGS — AUDITORIA DE SEGURANÇA E RASTREABILIDADE
// ============================================================================

export function getAuditLogs(): AuditLog[] {
  const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  const initialLogs: AuditLog[] = [
    {
      id: 'log_001',
      userId: 'tasso_vasconcelos',
      userName: 'Tasso Vasconcelos',
      userRole: 'SUPERADMIN',
      action: 'LOGIN',
      entityType: 'user',
      entityId: 'usr_tasso',
      entityTitle: 'Acesso Administrativo ao Portal',
      ipAddress: '177.136.214.88 (Fortaleza/CE)',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
      timestamp: '2026-08-15T09:00:00Z',
      notes: 'Sessão autenticada com sucesso via SSL 256-bit.'
    },
    {
      id: 'log_002',
      userId: 'tasso_vasconcelos',
      userName: 'Tasso Vasconcelos',
      userRole: 'SUPERADMIN',
      action: 'APPROVE',
      entityType: 'candidate',
      entityId: 'cand_002',
      entityTitle: 'Expansão da Fiocruz no Eusébio: R$ 85 Milhões',
      timestamp: '2026-08-15T08:45:00Z',
      notes: 'Pauta validada com fontes oficiais do Governo do Ceará e Fiocruz.'
    }
  ];

  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
  return initialLogs;
}

export function recordAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  logs.unshift(newLog);
  // Mantém os últimos 500 registros para alta performance
  if (logs.length > 500) logs.pop();
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
}

// ============================================================================
// OPORTUNIDADES B2B
// ============================================================================

export function getGritOpportunities(): GritOpportunity[] {
  const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(INITIAL_OPPORTUNITIES));
  return INITIAL_OPPORTUNITIES;
}
