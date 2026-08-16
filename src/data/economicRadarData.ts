export interface EconomicIndicator {
  symbol: string;
  name: string;
  code: string;
  value: string;
  numericValue: number;
  change: string;
  changeValue: number;
  isPositive: boolean;
  unit: string;
  category: 'moedas' | 'indices' | 'taxas' | 'commodities' | 'cripto';
  source: string;
  sourceUrl: string;
  lastUpdated: string;
  methodology: string;
  benchmarkContext: string;
}

export interface FocusProjection {
  indicator: string;
  period2026: string;
  period2027: string;
  weeklyTrend: 'subindo' | 'descendo' | 'estavel';
  source: string;
}

export interface MacroeconomicSummary {
  selicMeta: string;
  cdiOver: string;
  ipca12m: string;
  igpm12m: string;
  dolarComercial: string;
  dolarVariacao: string;
  dolarPositivo: boolean;
  dolarTurismo: string;
  dolarTurismoVariacao: string;
  euroComercial: string;
  euroVariacao: string;
  libraEsterlina: string;
  ibovespa: string;
  ibovespaVariacao: string;
  ibovespaPositivo: boolean;
  ifix: string;
  ifixVariacao: string;
  bitcoinUsd: string;
  bitcoinVariacao: string;
  brentUsd: string;
  minerioUsd: string;
  lastSyncTimestamp: string;
}

export const BASELINE_ECONOMIC_SUMMARY: MacroeconomicSummary = {
  selicMeta: '10,50% a.a.',
  cdiOver: '10,40% a.a.',
  ipca12m: '4,18%',
  igpm12m: '3,82%',
  dolarComercial: 'R$ 5,217',
  dolarVariacao: '+0,70%',
  dolarPositivo: true,
  dolarTurismo: 'R$ 5,420',
  dolarTurismoVariacao: '+0,55%',
  euroComercial: 'R$ 6,040',
  euroVariacao: '+1,02%',
  libraEsterlina: 'R$ 7,025',
  ibovespa: '135.840 pts',
  ibovespaVariacao: '+0,68%',
  ibovespaPositivo: true,
  ifix: '3.385 pts',
  ifixVariacao: '+0,22%',
  bitcoinUsd: 'US$ 64.120',
  bitcoinVariacao: '+2,15%',
  brentUsd: 'US$ 78,40',
  minerioUsd: 'US$ 98,50',
  lastSyncTimestamp: 'Auditado às 11:30 BRT'
};

export const OFFICIAL_ECONOMIC_INDICATORS: EconomicIndicator[] = [
  // 1. MOEDAS & CÂMBIO (Fonte: UOL Economia Câmbio / BCB)
  {
    symbol: 'USD/BRL (COM)',
    name: 'Dólar Comercial',
    code: 'PTAX BCB / B3 / UOL',
    value: 'R$ 5,217',
    numericValue: 5.217,
    change: '+0,70%',
    changeValue: 0.70,
    isPositive: true,
    unit: 'BRL',
    category: 'moedas',
    source: 'UOL Economia Câmbio / Banco Central do Brasil (PTAX)',
    sourceUrl: 'https://economia.uol.com.br/cotacoes/cambio/',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Taxa comercial interbancária e PTAX média ponderada apurada pelo Banco Central do Brasil para operações corporativas e de comércio exterior.',
    benchmarkContext: 'Referência primordial para importações, exportações, balanço corporativo e contratos internacionais.'
  },
  {
    symbol: 'USD/BRL (TUR)',
    name: 'Dólar Turismo',
    code: 'TURISMO / UOL',
    value: 'R$ 5,420',
    numericValue: 5.420,
    change: '+0,55%',
    changeValue: 0.55,
    isPositive: true,
    unit: 'BRL',
    category: 'moedas',
    source: 'UOL Economia Câmbio / Casas de Câmbio',
    sourceUrl: 'https://economia.uol.com.br/cotacoes/cambio/',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Cotação média em espécie e cartões pré-pagos para viagens ao exterior, incluindo spread operacional e despesas logísticas.',
    benchmarkContext: 'Utilizado por pessoas físicas em viagens internacionais e compras no exterior.'
  },
  {
    symbol: 'EUR/BRL (COM)',
    name: 'Euro Comercial',
    code: 'EUR PTAX / UOL',
    value: 'R$ 6,040',
    numericValue: 6.040,
    change: '+1,02%',
    changeValue: 1.02,
    isPositive: true,
    unit: 'BRL',
    category: 'moedas',
    source: 'UOL Economia Câmbio / Banco Central do Brasil / BCE',
    sourceUrl: 'https://economia.uol.com.br/cotacoes/cambio/',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Paridade Euro/Real apurada pelo Sistema de Câmbio do BCB e mercados cambiais europeus.',
    benchmarkContext: 'Referência para transações com a Zona do Euro e empresas multinacionais europeias.'
  },
  {
    symbol: 'EUR/BRL (TUR)',
    name: 'Euro Turismo',
    code: 'EUR TUR / UOL',
    value: 'R$ 6,280',
    numericValue: 6.280,
    change: '+0,85%',
    changeValue: 0.85,
    isPositive: true,
    unit: 'BRL',
    category: 'moedas',
    source: 'UOL Economia Câmbio / Mercado Varejo',
    sourceUrl: 'https://economia.uol.com.br/cotacoes/cambio/',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Cotação de varejo do Euro em papel-moeda e cartões de viagem.',
    benchmarkContext: 'Utilizado em despesas turísticas e remessas pessoais para países da União Europeia.'
  },
  {
    symbol: 'GBP/BRL',
    name: 'Libra Esterlina',
    code: 'GBP PTAX / UOL',
    value: 'R$ 7,025',
    numericValue: 7.025,
    change: '+0,45%',
    changeValue: 0.45,
    isPositive: true,
    unit: 'BRL',
    category: 'moedas',
    source: 'UOL Economia Câmbio / Bank of England',
    sourceUrl: 'https://economia.uol.com.br/cotacoes/cambio/',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Cotação da libra britânica apurada nos mercados cambiais primários.',
    benchmarkContext: 'Referência para importações, consultorias e serviços do Reino Unido.'
  },
  {
    symbol: 'DXY',
    name: 'Dollar Index (DXY)',
    code: 'ICE:DX',
    value: '103,45 pts',
    numericValue: 103.45,
    change: '-0,18%',
    changeValue: -0.18,
    isPositive: false,
    unit: 'pontos',
    category: 'moedas',
    source: 'Intercontinental Exchange (ICE EUA)',
    sourceUrl: 'https://www.theice.com',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Cesta geométrica ponderada do Dólar contra 6 moedas fortes (Euro, Iene, Libra, Dólar Canadense, Coroa Sueca e Franco Suíço).',
    benchmarkContext: 'Sensível a dados de inflação (CPI) e política de juros do Federal Reserve.'
  },

  // 2. TAXAS DE JUROS & INFLAÇÃO
  {
    symbol: 'SELIC',
    name: 'Taxa Selic Meta',
    code: 'COPOM/BCB',
    value: '10,50% a.a.',
    numericValue: 10.50,
    change: '0,00%',
    changeValue: 0.00,
    isPositive: true,
    unit: '% a.a.',
    category: 'taxas',
    source: 'Banco Central do Brasil / Copom',
    sourceUrl: 'https://www.bcb.gov.br/controleinflacao/taxaselic',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Taxa básica de juros definida pela Ata do Comitê de Política Monetária do BCB para ancorar expectativas de inflação.',
    benchmarkContext: 'Nível restritivo para convergência da inflação à meta contínua de 3,00%.'
  },
  {
    symbol: 'CDI',
    name: 'Taxa DI Over (CDI)',
    code: 'B3 Cetip',
    value: '10,40% a.a.',
    numericValue: 10.40,
    change: '0,00%',
    changeValue: 0.00,
    isPositive: true,
    unit: '% a.a.',
    category: 'taxas',
    source: 'B3 S.A. - Brasil, Bolsa, Balcão',
    sourceUrl: 'https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-estrutura-a-termo/taxa-di.htm',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Média ponderada dos depósitos interfinanceiros de um dia útil (252 dias úteis/ano) calculada pela B3.',
    benchmarkContext: 'Principal indexador de Renda Fixa privada (CDBs, LCIs, LCAs e Debêntures).'
  },
  {
    symbol: 'IPCA',
    name: 'IPCA Acumulado 12 Meses',
    code: 'IBGE / SNIPC',
    value: '4,18%',
    numericValue: 4.18,
    change: '-0,08%',
    changeValue: -0.08,
    isPositive: false,
    unit: '% 12m',
    category: 'taxas',
    source: 'IBGE - Instituto Brasileiro de Geografia e Estatística',
    sourceUrl: 'https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Índice Nacional de Preços ao Consumidor Amplo cobrindo famílias com rendimento de 1 a 40 salários mínimos em 16 regiões metropolitanas.',
    benchmarkContext: 'Dentro do intervalo de tolerância da meta oficial de inflação (1,5% a 4,5%).'
  },
  {
    symbol: 'IGP-M',
    name: 'IGP-M Acumulado 12 Meses',
    code: 'FGV IBRE',
    value: '3,82%',
    numericValue: 3.82,
    change: '+0,15%',
    changeValue: 0.15,
    isPositive: true,
    unit: '% 12m',
    category: 'taxas',
    source: 'FGV IBRE - Fundação Getulio Vargas',
    sourceUrl: 'https://portalibre.fgv.br',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Composto ponderado por IPA-M (60% atacado), IPC-M (30% consumidor) e INCC-M (10% construção civil).',
    benchmarkContext: 'Índice de referência para reajuste de contratos de aluguel e concessões públicas.'
  },

  // 3. ÍNDICES DE RENDA VARIÁVEL & FUNDOS
  {
    symbol: 'IBOV',
    name: 'Ibovespa',
    code: 'IBOVESPA B3',
    value: '135.840 pts',
    numericValue: 135840,
    change: '+0,68%',
    changeValue: 0.68,
    isPositive: true,
    unit: 'pontos',
    category: 'indices',
    source: 'B3 S.A. - Brasil, Bolsa, Balcão',
    sourceUrl: 'https://www.b3.com.br',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Índice de Retorno Total ponderado por valor de mercado e liquidez de ações na bolsa brasileira.',
    benchmarkContext: 'Impulsionado por fluxo de capital estrangeiro, commodities e bancos.'
  },
  {
    symbol: 'IFIX',
    name: 'Índice Fundos Imobiliários',
    code: 'IFIX B3',
    value: '3.385 pts',
    numericValue: 3385,
    change: '+0,22%',
    changeValue: 0.22,
    isPositive: true,
    unit: 'pontos',
    category: 'indices',
    source: 'B3 S.A. - Brasil, Bolsa, Balcão',
    sourceUrl: 'https://www.b3.com.br',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Performance média ponderada dos FIIs listados em bolsa (tijolo, papel, galpões logísticos e shoppings).',
    benchmarkContext: 'Atraente pelo dividend yield isento de IR para pessoas físicas.'
  },
  {
    symbol: 'S&P 500',
    name: 'S&P 500 EUA',
    code: 'SPX:US',
    value: '5.580 pts',
    numericValue: 5580,
    change: '+0,42%',
    changeValue: 0.42,
    isPositive: true,
    unit: 'pontos',
    category: 'indices',
    source: 'S&P Dow Jones Indices / NYSE',
    sourceUrl: 'https://www.spglobal.com/spdji',
    lastUpdated: '16/08/2026 11:30',
    methodology: '500 maiores empresas públicas americanas ponderadas por capitalização flutuante.',
    benchmarkContext: 'Sustentado por resultados corporativos sólidos em computação e IA.'
  },
  {
    symbol: 'NASDAQ',
    name: 'Nasdaq Composite',
    code: 'COMP:US',
    value: '17.650 pts',
    numericValue: 17650,
    change: '+0,88%',
    changeValue: 0.88,
    isPositive: true,
    unit: 'pontos',
    category: 'indices',
    source: 'Nasdaq Stock Market',
    sourceUrl: 'https://www.nasdaq.com',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Mais de 3.000 ações e ADRs listadas na bolsa de tecnologia Nasdaq.',
    benchmarkContext: 'Liderança de big techs, semicondutores e cibersegurança.'
  },

  // 4. COMMODITIES
  {
    symbol: 'BRENT',
    name: 'Petróleo Brent',
    code: 'ICE:B',
    value: 'US$ 78,40 / bar.',
    numericValue: 78.40,
    change: '+1,05%',
    changeValue: 1.05,
    isPositive: true,
    unit: 'USD/barril',
    category: 'commodities',
    source: 'Intercontinental Exchange (ICE Londres)',
    sourceUrl: 'https://www.theice.com',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Contrato futuro de petróleo bruto tipo Brent do Mar do Norte (42 galões americanos/barril).',
    benchmarkContext: 'Referência direta para paridade de preços internacionais e ações da Petrobras.'
  },
  {
    symbol: 'MINERIO',
    name: 'Minério de Ferro 62% Fe',
    code: 'DCE / Qingdao',
    value: 'US$ 98,50 / ton.',
    numericValue: 98.50,
    change: '+1,80%',
    changeValue: 1.80,
    isPositive: true,
    unit: 'USD/tonelada',
    category: 'commodities',
    source: 'Dalian Commodity Exchange / S&P Platts',
    sourceUrl: 'https://www.dce.com.cn',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Preço spot CFR Porto de Qingdao (China) para finos de minério de ferro com 62% de teor.',
    benchmarkContext: 'Impacto direto no Ebitda da Vale, CSN Mineração e balança comercial do Brasil.'
  },
  {
    symbol: 'SOJA',
    name: 'Soja Paranaguá (sc 60kg)',
    code: 'CEPEA/ESALQ',
    value: 'R$ 138,50 / sc.',
    numericValue: 138.50,
    change: '+0,65%',
    changeValue: 0.65,
    isPositive: true,
    unit: 'BRL/saca',
    category: 'commodities',
    source: 'Cepea / Esalq - USP',
    sourceUrl: 'https://www.cepea.esalq.usp.br/br/indicador/soja.aspx',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Indicador de preço à vista para saca de 60kg posta no Porto de Paranaguá/PR apurado diariamente pelo CEPEA.',
    benchmarkContext: 'Principal item da pauta exportadora do agronegócio nacional.'
  },
  {
    symbol: 'MILHO',
    name: 'Milho Campinas (sc 60kg)',
    code: 'CEPEA B3',
    value: 'R$ 62,80 / sc.',
    numericValue: 62.80,
    change: '-0,40%',
    changeValue: -0.40,
    isPositive: false,
    unit: 'BRL/saca',
    category: 'commodities',
    source: 'Cepea / Esalq - USP',
    sourceUrl: 'https://www.cepea.esalq.usp.br/br/indicador/milho.aspx',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Preço médio ao produtor na região de Campinas/SP para milho seco em grãos.',
    benchmarkContext: 'Insumo essencial para avicultura, suinocultura e nutrição animal.'
  },

  // 5. CRIPTOATIVOS
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin (BTC / Dólar)',
    code: 'BTC/USD',
    value: 'US$ 64.120',
    numericValue: 64120,
    change: '+2,15%',
    changeValue: 2.15,
    isPositive: true,
    unit: 'USD',
    category: 'cripto',
    source: 'Coinbase / Binance Spot Index',
    sourceUrl: 'https://www.coinbase.com',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Preço spot mediano global com volume verificado em exchanges de alta liquidez.',
    benchmarkContext: 'Reserva de valor digital impulsionada por ETFs à vista e política monetária global.'
  },
  {
    symbol: 'BTC/BRL',
    name: 'Bitcoin (BTC / Real)',
    code: 'BTC/BRL',
    value: 'R$ 347.850',
    numericValue: 347850,
    change: '+1,87%',
    changeValue: 1.87,
    isPositive: true,
    unit: 'BRL',
    category: 'cripto',
    source: 'Mercado Bitcoin / B3 Cripto Index',
    sourceUrl: 'https://www.mercadobitcoin.com.br',
    lastUpdated: '16/08/2026 11:30',
    methodology: 'Cotação média em Reais nos principais livros de ordens regulados no Brasil.',
    benchmarkContext: 'Paridade direta da cotação internacional em Dólar multiplicada pelo câmbio comercial.'
  }
];

export const FOCUS_PROJECTIONS: FocusProjection[] = [
  {
    indicator: 'IPCA (Inflação Oficial)',
    period2026: '3,95%',
    period2027: '3,60%',
    weeklyTrend: 'estavel',
    source: 'Boletim Focus / Banco Central do Brasil'
  },
  {
    indicator: 'PIB (Crescimento Real)',
    period2026: '2,20%',
    period2027: '2,00%',
    weeklyTrend: 'subindo',
    source: 'Boletim Focus / Banco Central do Brasil'
  },
  {
    indicator: 'Câmbio (USD/BRL no Fim do Período)',
    period2026: 'R$ 5,40',
    period2027: 'R$ 5,45',
    weeklyTrend: 'estavel',
    source: 'Boletim Focus / Banco Central do Brasil'
  },
  {
    indicator: 'Taxa Selic Meta (Fim do Período)',
    period2026: '10,00% a.a.',
    period2027: '9,25% a.a.',
    weeklyTrend: 'descendo',
    source: 'Boletim Focus / Banco Central do Brasil'
  }
];
