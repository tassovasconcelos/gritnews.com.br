import { EusebioProperty } from '../types';

export interface PortalBenchmark {
  id: string;
  name: string;
  url: string;
  badge: string;
  accentColor: string;
  totalListingsCount: number;
  avgPriceM2: number;
  condoAvgPriceM2: number;
  landAvgPriceM2: number;
  topSearchedNeighborhoods: string[];
  keyHighlight: string;
  auditDate: string;
}

export interface NeighborhoodMarketMetric {
  name: string;
  slug: string;
  avgM2House: number;
  avgM2Land: number;
  appreciation12m: number; // percentage
  avgCondoFee: number;
  profile: string;
  topCondominiums: string[];
  infrastructureRating: number; // 1 to 5
}

export interface RealEstateNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: 'Mercado' | 'Infraestrutura' | 'Tributário' | 'Segurança & Dicas' | 'Sustentabilidade';
  publishedAt: string;
  author: string;
  readTime: string;
  imageUrl: string;
  sourceOrigin: 'ZAP & FipeZAP' | 'Viva Real Intelligence' | 'OLX & CRECI-CE' | 'Secovi-CE' | 'GRIT Editorial';
  content: string[];
  keyTakeaways: string[];
}

export interface FraudPreventionRule {
  id: string;
  title: string;
  riskLevel: 'ALTO' | 'CRÍTICO' | 'MODERADO';
  problemDescription: string;
  verificationSolution: string;
  officialEntity: string;
}

export const PORTAL_BENCHMARKS: PortalBenchmark[] = [
  {
    id: 'zap_imoveis',
    name: 'ZAP Imóveis',
    url: 'https://www.zapimoveis.com.br/venda/imoveis/ce+eusebio/',
    badge: 'Referência em Alto Padrão',
    accentColor: 'from-orange-500 to-amber-600',
    totalListingsCount: 3340,
    avgPriceM2: 6850,
    condoAvgPriceM2: 7600,
    landAvgPriceM2: 1250,
    topSearchedNeighborhoods: ['Alphaville Eusébio', 'Cidade Alpha Ceará', 'Precabura', 'Urucunema'],
    keyHighlight: 'Maior índice de liquidez para mansões de 3 a 5 suítes e casas em condomínios fechados consolidados.',
    auditDate: 'Agosto/2026'
  },
  {
    id: 'viva_real',
    name: 'Viva Real',
    url: 'https://www.vivareal.com.br/venda/ceara/eusebio/',
    badge: 'Líder em Demanda Familiar',
    accentColor: 'from-blue-600 to-indigo-700',
    totalListingsCount: 4180,
    avgPriceM2: 6420,
    condoAvgPriceM2: 7100,
    landAvgPriceM2: 1100,
    topSearchedNeighborhoods: ['Cidade Alpha Ceará', 'Precabura', 'Coaçu', 'Tamatanduba', 'Centro'],
    keyHighlight: 'Foco em famílias de Fortaleza buscando segurança, clubes com quadras de beach tennis e proximidade de colégios.',
    auditDate: 'Agosto/2026'
  },
  {
    id: 'olx',
    name: 'OLX Eusébio',
    url: 'https://www.olx.com.br/imoveis/venda/estado-ce/fortaleza-e-regiao/grande-fortaleza/eusebio',
    badge: 'Lotes & Negociações Diretas',
    accentColor: 'from-purple-600 to-violet-800',
    totalListingsCount: 2950,
    avgPriceM2: 5400,
    condoAvgPriceM2: 6200,
    landAvgPriceM2: 850,
    topSearchedNeighborhoods: ['Centro', 'Mangabeira', 'Autódromo', 'Coaçu', 'Pires Façanha'],
    keyHighlight: 'Grande volume de terrenos soltos, casas de construtores locais e oportunidades de negociação flexível.',
    auditDate: 'Agosto/2026'
  }
];

export const NEIGHBORHOOD_METRICS: NeighborhoodMarketMetric[] = [
  {
    name: 'Alphaville Eusébio',
    slug: 'alphaville-eusebio',
    avgM2House: 8400,
    avgM2Land: 1450,
    appreciation12m: 16.2,
    avgCondoFee: 980,
    profile: 'Casas de altíssimo luxo (350m² a 600m²), infraestrutura de segurança armada, heliponto e clube exclusivo.',
    topCondominiums: ['Alphaville Eusébio Residencial 1', 'Alphaville Eusébio Residencial 2', 'Quintas do Lago'],
    infrastructureRating: 5
  },
  {
    name: 'Cidade Alpha Ceará',
    slug: 'cidade-alpha',
    avgM2House: 7300,
    avgM2Land: 1180,
    appreciation12m: 18.5,
    avgCondoFee: 620,
    profile: 'Megaprojeto planejado com 19 milhões de m², múltiplos residenciais (Terras 1 a 4 e Alpha 1 a 3) e área comercial própria.',
    topCondominiums: ['Terras Alphaville 1', 'Terras Alphaville 2', 'Terras Alphaville 3', 'Alphaville Ceará 1', 'Alphaville Ceará 2'],
    infrastructureRating: 5
  },
  {
    name: 'Precabura',
    slug: 'precabura',
    avgM2House: 6300,
    avgM2Land: 950,
    appreciation12m: 14.1,
    avgCondoFee: 580,
    profile: 'Localização estratégica com acesso veloz à CE-010 e Washington Soares. Casas planas e duplex com ampla área verde.',
    topCondominiums: ['Jardins do Lago', 'Reserva Terra Brasilis', 'Bosque das Palmeiras'],
    infrastructureRating: 4
  },
  {
    name: 'Urucunema & Pires Façanha',
    slug: 'urucunema',
    avgM2House: 5700,
    avgM2Land: 820,
    appreciation12m: 12.8,
    avgCondoFee: 490,
    profile: 'Condomínios fechados compactos e acessíveis de 20 a 50 casas, alta procura por primeiro imóvel de alto padrão.',
    topCondominiums: ['Vert Natureza', 'Jardins das Dunas', 'Royal Park Eusébio'],
    infrastructureRating: 4
  },
  {
    name: 'Coaçu & Tamatanduba',
    slug: 'coacu-tamatanduba',
    avgM2House: 5200,
    avgM2Land: 780,
    appreciation12m: 11.4,
    avgCondoFee: 420,
    profile: 'Proximidade imediata ao Shopping Eusébio e Terrazo Shopping. Mescla entre condomínios duplex e casas soltas modernas.',
    topCondominiums: ['Gran Ville', 'Carmel Park', 'Residencial Eusébio Boulevard'],
    infrastructureRating: 4
  },
  {
    name: 'Centro do Eusébio',
    slug: 'centro',
    avgM2House: 4900,
    avgM2Land: 890,
    appreciation12m: 9.8,
    avgCondoFee: 350,
    profile: 'Polo comercial e de serviços com clínicas médicas, agências bancárias, colégios e imóveis de uso misto/corporativo.',
    topCondominiums: ['Eusébio Open Mall', 'Villagio Centro', 'Residencial Acácias'],
    infrastructureRating: 4
  },
  {
    name: 'Mangabeira & Encantada',
    slug: 'mangabeira',
    avgM2House: 4200,
    avgM2Land: 620,
    appreciation12m: 13.5,
    avgCondoFee: 280,
    profile: 'Vetor de expansão com novos loteamentos fechados, chácaras residenciais e grande potencial de valorização futura.',
    topCondominiums: ['Residencial Bougainville', 'Loteamento Parque das Palmeiras'],
    infrastructureRating: 3
  }
];

export const REAL_ESTATE_NEWS: RealEstateNewsItem[] = [
  {
    id: 'news-eusebio-m2-fipezap',
    title: 'Eusébio lidera valorização do metro quadrado na Região Metropolitana com alta de 17,2% em 12 meses',
    slug: 'eusebio-lidera-valorizacao-metro-quadrado-fipezap',
    summary: 'Cruzamento de dados entre ZAP Imóveis, Viva Real e cartórios locais confirma o município como o polo imobiliário mais aquecido do Ceará.',
    category: 'Mercado',
    publishedAt: '2026-08-14T10:00:00Z',
    author: 'Redação Econômica GRIT NEWS',
    readTime: '4 min',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    sourceOrigin: 'ZAP & FipeZAP',
    keyTakeaways: [
      'Preço médio do metro quadrado construído em condomínio fechado atingiu R$ 7.150/m².',
      'Abertura de novos colégios de excelência e a consolidação do Terrazo Shopping impulsionam a demanda familiar.',
      'Imóveis com sistema solar e vaga com carregador elétrico vendem 40% mais rápido.'
    ],
    content: [
      'O mercado imobiliário do município de Eusébio continua operando com forte tração compradora. De acordo com o mais recente levantamento integrado de portais e registros imobiliários, a busca por moradias horizontais em condomínios fechados superou os bairros nobres verticais da capital, como Meireles e Aldeota.',
      'A facilidade de deslocamento proporcionada pela CE-010 e a duplicação da rodovia CE-040 reduziu o tempo de tráfego para os principais polos de negócios e saúde de Fortaleza, tornando a moradia no Eusébio uma escolha definitiva para executivos e profissionais liberais.',
      'Entre os bairros mais valorizados, destacam-se a Cidade Alpha Ceará e o complexo Alphaville Eusébio, onde os lotes para construção própria já ultrapassam a barreira dos R$ 1.300 por metro quadrado.'
    ]
  },
  {
    id: 'news-alerta-golpes-olx',
    title: 'Guia Antitruste & Auditoria: Como identificar anúncios falsos de imóveis no OLX e redes sociais no Eusébio',
    slug: 'como-identificar-anuncios-falsos-imoveis-eusebio-olx',
    summary: 'Especialistas jurídicos e corretores credenciados listam as 5 fraudes mais comuns e o passo a passo para validar matrículas no Cartório do 2º Ofício.',
    category: 'Segurança & Dicas',
    publishedAt: '2026-08-12T14:30:00Z',
    author: 'Tasso Vasconcelos & Conselho Jurídico',
    readTime: '6 min',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
    sourceOrigin: 'OLX & CRECI-CE',
    keyTakeaways: [
      'Desconfie de valores 40% abaixo da média de mercado praticada no ZAP e Viva Real.',
      'Nunca faça pagamentos de "sinal ou taxa de reserva" por Pix antes de visitar o imóvel e verificar a Certidão de Ônus.',
      'Exija o número de inscrição no CRECI 15ª Região/CE e confira no portal oficial do conselho.'
    ],
    content: [
      'Com o aquecimento do mercado do Eusébio, golpistas têm clonado fotos de casas de alto padrão de sites oficiais para publicar ofertas com preços irreais no OLX e no Facebook Marketplace, exigindo depósitos antecipados para "garantir a visita".',
      'Para proteger o patrimônio dos compradores, o GRIT NEWS realizou uma auditoria completa nos critérios de validação de imóveis, estabelecendo um protocolo obrigatório de conferência de matrícula no Cartório Aguiar (2º Ofício do Eusébio) e confirmação de regularidade de habite-se.',
      'Corretores sérios sempre fornecem o número do CRECI, contrato de intermediação imobiliária e termo de visita com autorização expressa do proprietário.'
    ]
  },
  {
    id: 'news-polo-saude-fiocruz',
    title: 'Expansão do Polo de Saúde da Fiocruz e Centro Tecnológico atrai 4 mil novos moradores de alta renda ao Eusébio',
    slug: 'expansao-polo-saude-fiocruz-eusebio-impacto-imobiliario',
    summary: 'A consolidação do Distrito de Inovação em Saúde gera demanda sem precedentes por locações corporativas e residenciais no Precabura e Centro.',
    category: 'Infraestrutura',
    publishedAt: '2026-08-09T08:15:00Z',
    author: 'Dra. Camila Torres',
    readTime: '5 min',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200',
    sourceOrigin: 'Secovi-CE',
    keyTakeaways: [
      'Taxa de vacância para locação residencial de alto padrão no Eusébio é inferior a 3,2%.',
      'Yield anual de locação oscila entre 6,8% e 8,5% a.a., acima da média de Fortaleza.',
      'Médicos, pesquisadores e executivos de biofarma impulsionam a procura por casas com home office e lazer privativo.'
    ],
    content: [
      'O Distrito de Inovação em Saúde do Eusébio, ancorado pela unidade avançada da Fiocruz Ceará, tornou-se um vetor de transformação socioeconômica na Grande Fortaleza.',
      'A chegada contínua de pesquisadores, diretores de indústrias farmacêuticas e especialistas médicos gerou uma corrida por locação de casas mobiliadas nos condomínios vizinhos, elevando os aluguéis médios de casas duplex para a faixa de R$ 7.500 a R$ 14.000 mensais.',
      'Investidores que adquiriram lotes e construíram para locação nos últimos 24 meses colhem retornos líquidos superiores à maioria dos fundos imobiliários tradicionais.'
    ]
  },
  {
    id: 'news-reforma-tributaria-imoveis',
    title: 'Reforma Tributária e o Mercado de Loteamentos: O que muda no ITBI e na compra de imóveis na Cidade Alpha',
    slug: 'reforma-tributaria-itbi-cidade-alpha-eusebio',
    summary: 'Análise detalhada sobre a transição do IBS e CBS na construção civil e as regras de avaliação de valor venal pela Prefeitura do Eusébio.',
    category: 'Tributário',
    publishedAt: '2026-08-05T11:00:00Z',
    author: 'Letícia Karla (Jurídico Imobiliário)',
    readTime: '5 min',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    sourceOrigin: 'GRIT Editorial',
    keyTakeaways: [
      'Alíquota do ITBI no Eusébio permanece competitiva em relação a outros municípios da RMF.',
      'Contratos de compra e venda com cláusula de financiamento direto com a construtora exigem atenção aos índices de reajuste (INCC vs. IPCA).',
      'Planejamento sucessório através de holdings imobiliárias cresce entre proprietários de mansões no Alphaville.'
    ],
    content: [
      'A regulamentação da reforma tributária traz novos cenários para a incorporação imobiliária e venda de lotes parcelados no Ceará.',
      'No Eusébio, a segurança jurídica proporcionada por loteamentos já com infraestrutura 100% entregue confere proteção patrimonial aos adquirentes contra eventuais variações de custo de insumos da construção.',
      'A advogada Letícia Karla recomenda aos compradores a realização de due diligence documental completa antes da assinatura de escrituras definitivas.'
    ]
  }
];

export const FRAUD_PREVENTION_RULES: FraudPreventionRule[] = [
  {
    id: 'rule-creci',
    title: '1. Verificação de Registro Profissional (CRECI-CE)',
    riskLevel: 'CRÍTICO',
    problemDescription: 'Falsos intermediadores que atuam sem habilitação técnica no CRECI 15ª Região e utilizam números inventados em anúncios não auditados.',
    verificationSolution: 'Consulte o número do CRECI do corretor ou imobiliária diretamente no portal oficial do CRECI-CE (creci-ce.gov.br) antes de qualquer tratativa.',
    officialEntity: 'CRECI 15ª Região Ceará'
  },
  {
    id: 'rule-matricula',
    title: '2. Certidão Atualizada de Inteiro Teor e Ônus Reais',
    riskLevel: 'CRÍTICO',
    problemDescription: 'Anúncios de "propriedade" que na realidade são apenas direitos de posse precários ou imóveis com penhoras, bloqueios judiciais e hipotecas pendentes.',
    verificationSolution: 'Solicite a certidão atualizada emitida pelo Cartório do 2º Ofício de Registro de Imóveis de Eusébio (Cartório Aguiar). A certidão tem validade de 30 dias e comprova a real titularidade.',
    officialEntity: 'Cartório de Registro de Imóveis do Eusébio (2º Ofício)'
  },
  {
    id: 'rule-sinal-pix',
    title: '3. Nunca pague "taxas de reserva" ou adiantamentos por Pix',
    riskLevel: 'CRÍTICO',
    problemDescription: 'Golpe clássico no OLX: o suposto vendedor alega ter muitos interessados e exige R$ 2.000 a R$ 10.000 via Pix para "segurar o imóvel" antes da visita.',
    verificationSolution: 'Nenhum sinal financeiro é devido antes da assinatura do Contrato de Promessa de Compra e Venda com firma reconhecida e apresentação de todas as certidões negativas.',
    officialEntity: 'Código de Defesa do Consumidor & Código Civil'
  },
  {
    id: 'rule-iptu-habitese',
    title: '4. Habite-se Municipal e Certidão Negativa de Débitos (CND)',
    riskLevel: 'ALTO',
    problemDescription: 'Casas construídas sem projeto aprovado na Prefeitura do Eusébio ou com débitos vultosos de IPTU e ISS de obra, impedindo financiamento bancário.',
    verificationSolution: 'Exija o Alvará de Habite-se averbado na matrícula e a CND de Tributos Municipais emitida pelo portal da SEFIN da Prefeitura Municipal de Eusébio.',
    officialEntity: 'Prefeitura Municipal de Eusébio / SEFIN'
  },
  {
    id: 'rule-preco-ficticio',
    title: '5. Identificação de Valores Artificiais (Isca de Consórcio)',
    riskLevel: 'MODERADO',
    problemDescription: 'Anúncios promovendo mansões por valores irreais (ex: casa de 4 suítes por R$ 180.000) que na verdade são vendas de cotas de consórcio ou leilões fraudulentos.',
    verificationSolution: 'Compare sempre com a média de preço/m² oficial apurada pelo ZAP Imóveis e Viva Real. No Eusébio, casas em condomínio fechado variam entre R$ 5.500 e R$ 9.500/m².',
    officialEntity: 'Observatório de Preços FipeZAP / Secovi-CE'
  }
];

export const VERIFIED_REAL_ESTATE_PROPERTIES: EusebioProperty[] = [
  {
    id: 'prop-alpha-01',
    title: 'Mansão Contemporânea em Alphaville Eusébio com Energia Solar e Piscina Aquecida',
    slug: 'mansao-contemporanea-alphaville-eusebio',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 2450000,
    condoFee: 980,
    iptu: 280,
    neighborhood: 'Alphaville Eusébio',
    condominiumName: 'Alphaville Eusébio Residencial 1',
    address: 'Av. Alphaville, Alphaville Eusébio, Eusébio - CE',
    bedrooms: 4,
    suites: 4,
    bathrooms: 6,
    garageSpots: 4,
    areaTotal: 480,
    areaPrivate: 365,
    pricePerM2: 6712,
    description: 'Espetacular residência em conceito aberto com pé direito duplo imponente, acabamento em mármore travertino e porcelanato de grandes formatos (120x120cm). Conta com 4 amplas suítes com closet, escritório térreo reversível, espaço gourmet integrado com churrasqueira a gás e piscina com prainha e hidromassagem. Sistema de microgeração solar fotovoltaica homologado com 1.200 kWh/mês.',
    highlights: [
      'Pé direito duplo de 6,5 metros',
      'Energia solar fotovoltaica 1.200 kWh/mês',
      'Piscina aquecida com prainha e hidro',
      'Espaço gourmet integrado à varanda',
      'Portaria blindada com reconhecimento facial 24h',
      'Clube completo com quadras de tênis de saibro'
    ],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800'
    ],
    featured: true,
    verified: true,
    verificationBadge: 'MATRICULA_VERIFICADA',
    portalSource: 'zap_imoveis',
    sourceUrl: 'https://www.zapimoveis.com.br/venda/imoveis/ce+eusebio/',
    realtor: {
      name: 'Carlos Albuquerque',
      creci: '14.890-F / 15ª Região',
      agency: 'Albuquerque Prime Imóveis Eusébio',
      phone: '5585991823344',
      email: 'carlos@albuquerqueprime.com.br',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-01',
    viewsCount: 682
  },
  {
    id: 'prop-cidade-alpha-02',
    title: 'Casa Duplex Moderna no Terras Alphaville 3 (Cidade Alpha Ceará)',
    slug: 'casa-duplex-terras-alphaville-cidade-alpha',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 1390000,
    condoFee: 650,
    iptu: 190,
    neighborhood: 'Cidade Alpha Ceará',
    condominiumName: 'Terras Alphaville 3',
    address: 'Residencial Terras 3, Cidade Alpha, Eusébio - CE',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    garageSpots: 3,
    areaTotal: 330,
    areaPrivate: 245,
    pricePerM2: 5673,
    description: 'Imóvel novíssimo recém-construído com arquitetura moderna e linhas minimalistas. Sala de estar e jantar integradas com a cozinha americana e varanda gourmet. 3 suítes plenas no piso superior com varandas privativas. Condomínio com infraestrutura de resort: academia climatizada, 4 quadras de beach tennis, piscinas semiolímpica e segurança armada 24h.',
    highlights: [
      'Recém-construída (Primeira locação / Nunca habitada)',
      'Varanda gourmet com bancada em nanoglass e churrasqueira',
      '4 Quadras de Beach Tennis no condomínio',
      'Segurança armada e ronda motorizada 24h',
      'Acabamento em porcelanato acetinado 120x120'
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800'
    ],
    featured: true,
    verified: true,
    verificationBadge: 'CRECI_AUDITADO',
    portalSource: 'viva_real',
    sourceUrl: 'https://www.vivareal.com.br/venda/ceara/eusebio/',
    realtor: {
      name: 'Mariana Fontes',
      creci: '18.420-F / 15ª Região',
      agency: 'Fontes & Associados Imobiliária',
      phone: '5585988771122',
      email: 'mariana.fontes@fontesimoveis.com.br',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-04',
    viewsCount: 844
  },
  {
    id: 'prop-jardins-lago-03',
    title: 'Casa Plana Alto Padrão no Jardins do Lago com Paisagismo Tropical na Precabura',
    slug: 'casa-plana-jardins-do-lago-precabura',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 1850000,
    condoFee: 720,
    iptu: 230,
    neighborhood: 'Precabura',
    condominiumName: 'Jardins do Lago Eusébio',
    address: 'Rua das Palmeiras, Cond. Jardins do Lago, Eusébio - CE',
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    garageSpots: 4,
    areaTotal: 460,
    areaPrivate: 280,
    pricePerM2: 6607,
    description: 'Casa totalmente térrea pensada para máxima acessibilidade e integração com a natureza. Sala ampla com pé direito elevado de 5m, 4 suítes climatizadas, deck privativo com churrasqueira a carvão, bancada gourmet e piscina privativa em alvenaria com iluminação LED multicolorida.',
    highlights: [
      'Projeto 100% plano (sem escadas)',
      'Lago privativo para stand-up paddle e caminhada',
      'Piscina privativa em pastilha com LED',
      'Apenas 3 minutos do entroncamento com a CE-010'
    ],
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'
    ],
    featured: true,
    verified: true,
    verificationBadge: 'VALOR_CONFIRMADO',
    portalSource: 'zap_imoveis',
    sourceUrl: 'https://www.zapimoveis.com.br/venda/imoveis/ce+eusebio/',
    realtor: {
      name: 'Leonardo Sampaio',
      creci: '11.350-F / 15ª Região',
      agency: 'Eusébio Negócios Imobiliários',
      phone: '5585999884433',
      email: 'leonardo@eusebionegocios.com.br',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-08',
    viewsCount: 450
  },
  {
    id: 'prop-vert-natureza-04',
    title: 'Casa Duplex com 3 Suítes no Condomínio Vert Natureza - Urucunema',
    slug: 'casa-duplex-vert-natureza-urucunema',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 940000,
    condoFee: 510,
    iptu: 150,
    neighborhood: 'Urucunema',
    condominiumName: 'Condomínio Vert Natureza',
    address: 'Rua Carmelita Rebouças, Urucunema, Eusébio - CE',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    garageSpots: 2,
    areaTotal: 230,
    areaPrivate: 182,
    pricePerM2: 5164,
    description: 'Excelente custo-benefício em condomínio fechado com infraestrutura de clube: piscina adulto e infantil com deck molhado, salão de festas climatizado, campo de futebol society e playground. Casa com móveis fixos projetados na cozinha, área de serviço e suíte master com closet.',
    highlights: [
      'Móveis planejados de alta qualidade inclusos',
      'Espaço gourmet privativo com churrasqueira',
      'Taxa condominial acessível',
      'Aceita financiamento por qualquer banco (Caixa, BB, Itaú)'
    ],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=800'
    ],
    featured: false,
    verified: true,
    verificationBadge: 'CRECI_AUDITADO',
    portalSource: 'viva_real',
    sourceUrl: 'https://www.vivareal.com.br/venda/ceara/eusebio/',
    realtor: {
      name: 'Leonardo Sampaio',
      creci: '11.350-F / 15ª Região',
      agency: 'Eusébio Negócios Imobiliários',
      phone: '5585999884433',
      email: 'leonardo@eusebionegocios.com.br',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-11',
    viewsCount: 390
  },
  {
    id: 'prop-lote-alpha-ceara-05',
    title: 'Lote Nascente 450m² no Alphaville Ceará 2 - Quitado e Escriturado',
    slug: 'lote-nascente-alphaville-ceara-2-450m',
    type: 'lote_terreno',
    purpose: 'venda',
    price: 520000,
    condoFee: 540,
    iptu: 95,
    neighborhood: 'Cidade Alpha Ceará',
    condominiumName: 'Alphaville Ceará 2',
    address: 'Quadra H, Lote 12, Cidade Alpha, Eusébio - CE',
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    garageSpots: 0,
    areaTotal: 450,
    pricePerM2: 1155,
    description: 'Terreno plano de 450m² (15m x 30m) com posição solar nascente total, situado em rua tranquila próxima à praça central e ao clube. Terreno já quitado, registrado em cartório e liberado para início imediato de obras ou financiamento para aquisição e construção.',
    highlights: [
      'Nascente total (Super ventilado)',
      'Topografia 100% plana (Economia de aterro e fundação)',
      'Matrícula individualizada no Cartório do Eusébio',
      'Liberado para financiamento bancário imediato'
    ],
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&q=80&w=800'
    ],
    featured: false,
    verified: true,
    verificationBadge: 'MATRICULA_VERIFICADA',
    portalSource: 'olx',
    sourceUrl: 'https://www.olx.com.br/imoveis/venda/estado-ce/fortaleza-e-regiao/grande-fortaleza/eusebio',
    realtor: {
      name: 'Mariana Fontes',
      creci: '18.420-F / 15ª Região',
      agency: 'Fontes & Associados Imobiliária',
      phone: '5585988771122',
      email: 'mariana.fontes@fontesimoveis.com.br',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-10',
    viewsCount: 310
  },
  {
    id: 'prop-quintas-lago-06',
    title: 'Casa Triplex Neoclássica no Quintas do Lago com Deck e Spa Jacuzzi no Coaçu',
    slug: 'casa-triplex-quintas-do-lago-coacu',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 2980000,
    condoFee: 1100,
    iptu: 340,
    neighborhood: 'Coaçu',
    condominiumName: 'Quintas do Lago Eusébio',
    address: 'Av. Cícero Sá, Coaçu, Eusébio - CE',
    bedrooms: 5,
    suites: 5,
    bathrooms: 7,
    garageSpots: 6,
    areaTotal: 550,
    areaPrivate: 440,
    pricePerM2: 6772,
    description: 'Imponente mansão em estilo neoclássico construída no condomínio mais arborizado do Eusébio. Possui 5 suítes (todas com closet e varanda), elevador privativo atendendo os 3 pavimentos, cinema privativo, adega climatizada para 300 garrafas e rooftop com spa jacuzzi e vista para o lago privativo.',
    highlights: [
      'Elevador privativo silencioso',
      'Home Cinema com isolamento acústico',
      'Rooftop com Spa Jacuzzi aquecido',
      'Poço profundo e irrigação automatizada',
      'Segurança armada de padrão internacional'
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800'
    ],
    featured: true,
    verified: true,
    verificationBadge: 'MATRICULA_VERIFICADA',
    portalSource: 'zap_imoveis',
    sourceUrl: 'https://www.zapimoveis.com.br/venda/imoveis/ce+eusebio/',
    realtor: {
      name: 'Carlos Albuquerque',
      creci: '14.890-F / 15ª Região',
      agency: 'Albuquerque Prime Imóveis Eusébio',
      phone: '5585991823344',
      email: 'carlos@albuquerqueprime.com.br',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-06',
    viewsCount: 920
  },
  {
    id: 'prop-centro-comercial-07',
    title: 'Pavimento Corporativo 180m² no Centro Empresarial Eusébio Open Mall',
    slug: 'pavimento-corporativo-eusebio-open-mall',
    type: 'comercial',
    purpose: 'locacao',
    price: 7200,
    condoFee: 1100,
    iptu: 340,
    neighborhood: 'Centro',
    condominiumName: 'Eusébio Open Mall',
    address: 'Av. Eusébio de Queiroz, 1200, Centro, Eusébio - CE',
    bedrooms: 0,
    suites: 0,
    bathrooms: 3,
    garageSpots: 6,
    areaTotal: 180,
    areaPrivate: 180,
    pricePerM2: 40,
    description: 'Espaço corporativo com infraestrutura completa para clínicas médicas, escritórios de advocacia, sedes de startups ou empresas de tecnologia. Piso elevado, copa equipada, 3 banheiros e ar-condicionado central instalado. Localização estratégica na avenida principal do Eusébio.',
    highlights: [
      'Localização Premium na avenida principal do Centro',
      '6 vagas de garagem privativas no subsolo',
      'Estacionamento rotativo para clientes',
      'Portaria com catracas biométricas e elevadores inteligentes'
    ],
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800'
    ],
    featured: false,
    verified: true,
    verificationBadge: 'DIRETO_COM_CONSTRUTORA',
    portalSource: 'viva_real',
    sourceUrl: 'https://www.vivareal.com.br/venda/ceara/eusebio/',
    realtor: {
      name: 'Carlos Albuquerque',
      creci: '14.890-F / 15ª Região',
      agency: 'Albuquerque Prime Imóveis Eusébio',
      phone: '5585991823344',
      email: 'carlos@albuquerqueprime.com.br',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-11',
    viewsCount: 280
  },
  {
    id: 'prop-jardins-dunas-08',
    title: 'Casa Duplex no Jardins das Dunas com 3 Suítes e Lazer no Pires Façanha',
    slug: 'casa-duplex-jardins-das-dunas-pires-facanha',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 880000,
    condoFee: 470,
    iptu: 135,
    neighborhood: 'Pires Façanha',
    condominiumName: 'Condomínio Jardins das Dunas',
    address: 'Rua Raimundo Ferreira Rocha, Pires Façanha, Eusébio - CE',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    garageSpots: 2,
    areaTotal: 215,
    areaPrivate: 168,
    pricePerM2: 5238,
    description: 'Charmosa residência duplex em condomínio fechado super seguro. Sala em dois ambientes com piso em porcelanato polido, cozinha com bancadas em granito preto são gabriel, varanda gourmet privativa com churrasqueira e quintal gramado.',
    highlights: [
      'Piscina adulto com raia semiolímpica no condomínio',
      'Deck com churrasqueira e forno de pizza',
      'Portaria 24h com controle de acesso rigoroso',
      'A 5 minutos do Shopping Eusébio'
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800'
    ],
    featured: false,
    verified: true,
    verificationBadge: 'CRECI_AUDITADO',
    portalSource: 'olx',
    sourceUrl: 'https://www.olx.com.br/imoveis/venda/estado-ce/fortaleza-e-regiao/grande-fortaleza/eusebio',
    realtor: {
      name: 'Leonardo Sampaio',
      creci: '11.350-F / 15ª Região',
      agency: 'Eusébio Negócios Imobiliários',
      phone: '5585999884433',
      email: 'leonardo@eusebionegocios.com.br',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-12',
    viewsCount: 295
  }
];
