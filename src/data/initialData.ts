import { Category, Article, AuthorProfile, Partner, Offer, AdCampaign, SiteSettings } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-saude',
    name: 'Mercado de Saúde',
    slug: 'mercado-de-saude',
    description: 'Gestão hospitalar, healthtechs, novos modelos de atendimento e regulamentação médica.',
    color: '#145EDB',
    iconName: 'HeartPulse',
    order: 1,
    featured: true,
    metaTitle: 'Notícias e Análises do Mercado de Saúde | GRIT NEWS',
    metaDescription: 'Acompanhe tendências de healthtechs, inovação médica e gestão na saúde.'
  },
  {
    id: 'cat-pet',
    name: 'Mercado Pet',
    slug: 'mercado-pet',
    description: 'Franquias, medicina veterinária, nutrição animal, tecnologia e logística pet no Brasil.',
    color: '#FF8500',
    iconName: 'PawPrint',
    order: 2,
    featured: true,
    metaTitle: 'Inteligência de Mercado Pet e Negócios Veterinários | GRIT NEWS',
    metaDescription: 'Análises de crescimento do setor pet, tecnologia e investimentos.'
  },
  {
    id: 'cat-tech',
    name: 'Tecnologia e Inteligência Artificial',
    slug: 'tecnologia-e-ia',
    description: 'IA generativa, agentes de software, infraestrutura em nuvem, cibersegurança e SaaS.',
    color: '#0B2343',
    iconName: 'Cpu',
    order: 3,
    featured: true,
    metaTitle: 'Tecnologia e Inteligência Artificial para Negócios | GRIT NEWS',
    metaDescription: 'Últimas novidades de IA, transformação digital e soluções enterprise.'
  },
  {
    id: 'cat-logistica',
    name: 'Automação e Logística',
    slug: 'automacao-e-logistica',
    description: 'Supply chain, robótica industrial, frotas conectadas e eficiência operacional.',
    color: '#0284C7',
    iconName: 'Truck',
    order: 4,
    featured: true,
    metaTitle: 'Automação Industrial e Logística 4.0 | GRIT NEWS',
    metaDescription: 'Notícias sobre logística, automação de galpões e tecnologia em transporte.'
  },
  {
    id: 'cat-importacao',
    name: 'Importação',
    slug: 'importacao',
    description: 'Comércio exterior, taxas alfandegárias, fornecedores globais, portos e logística internacional.',
    color: '#0D9488',
    iconName: 'Globe',
    order: 5,
    featured: true,
    metaTitle: 'Guia e Notícias sobre Importação e Comércio Exterior | GRIT NEWS',
    metaDescription: 'Análises de cenários globais, regulamentação e estratégias de importação.'
  },
  {
    id: 'cat-negocios',
    name: 'Negócios',
    slug: 'negocios',
    description: 'M&A, venture capital, liderança, investimentos, crédito corporativo e valuation.',
    color: '#16A34A',
    iconName: 'TrendingUp',
    order: 6,
    featured: true,
    metaTitle: 'Negócios, Finanças e Tendências de Mercado | GRIT NEWS',
    metaDescription: 'Análises econômicas, fusões e aquisições e inteligência de negócios.'
  },
  {
    id: 'cat-bem-estar',
    name: 'Saúde e Bem-estar',
    slug: 'saude-e-bem-estar',
    description: 'Qualidade de vida, longevidade corporativa, medicina preventiva e ergonomia.',
    color: '#059669',
    iconName: 'Smile',
    order: 7,
    featured: false,
    metaTitle: 'Saúde e Bem-estar Corporativo | GRIT NEWS',
    metaDescription: 'Artigos e pesquisas sobre hábitos saudáveis e alta performance.'
  },
  {
    id: 'cat-curiosidades',
    name: 'Curiosidades',
    slug: 'curiosidades',
    description: 'Dados surpreendentes, invenções históricas e fatos curiosos do mundo empresarial.',
    color: '#8B5CF6',
    iconName: 'Lightbulb',
    order: 8,
    featured: false,
    metaTitle: 'Curiosidades e Histórias de Inovação | GRIT NEWS',
    metaDescription: 'Histórias incríveis e fatos pouco conhecidos sobre grandes empresas.'
  },
  {
    id: 'cat-ofertas',
    name: 'Ofertas',
    slug: 'ofertas',
    description: 'Oportunidades de softwares, equipamentos, cupons e infoprodutos com desconto exclusivo.',
    color: '#DC2626',
    iconName: 'Tag',
    order: 9,
    featured: true,
    metaTitle: 'Ofertas e Oportunidades Especiais B2B | GRIT NEWS',
    metaDescription: 'Descontos em sistemas, consultorias e produtos selecionados pela GRIT.'
  },
  {
    id: 'cat-patrocinados',
    name: 'Conteúdos Patrocinados',
    slug: 'conteudos-patrocinados',
    description: 'Estudos de caso, lançamentos e whitepapers produzidos por nossos parceiros estratégicos.',
    color: '#D97706',
    iconName: 'Sparkles',
    order: 10,
    featured: false,
    metaTitle: 'Conteúdos Patrocinados e Cases de Sucesso | GRIT NEWS',
    metaDescription: 'Casos práticos e soluções apresentadas por marcas parceiras.'
  }
];

export const INITIAL_AUTHORS: AuthorProfile[] = [
  {
    id: 'author-camila',
    name: 'Dra. Camila Torres',
    roleTitle: 'Especialista em Healthtechs e Gestão Médica',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    bio: 'Médica pós-graduada em Administração Hospitalar pela FGV e consultora de inovação no setor de saúde pública e privada.',
    specialties: ['Healthtechs', 'Telemedicina', 'Gestão Hospitalar'],
    email: 'camila.torres@gritnews.com.br',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    },
    followersCount: 1240,
    articlesCount: 18
  },
  {
    id: 'author-renato',
    name: 'Renato Silva',
    roleTitle: 'Chief Editor de Tecnologia e IA',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    bio: 'Jornalista de tecnologia com 12 anos de experiência cobrindo IA, automação e ecossistemas de startups na América Latina.',
    specialties: ['Inteligência Artificial', 'Automação', 'SaaS'],
    email: 'renato.silva@gritnews.com.br',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      website: 'https://gritnews.com.br'
    },
    followersCount: 2890,
    articlesCount: 42
  },
  {
    id: 'author-gabriel',
    name: 'Gabriel GRIT',
    roleTitle: 'Fundador e Analista sênior de Mercado',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    bio: 'Empresário, investidor anjo e estrategista de inteligência de negócios focado em ecossistemas de alta tração.',
    specialties: ['M&A', 'Negócios Globais', 'Estratégia'],
    email: 'gabriel@gritnews.com.br',
    socialLinks: {
      linkedin: 'https://linkedin.com'
    },
    followersCount: 5400,
    articlesCount: 31
  },
  {
    id: 'author-beatriz',
    name: 'Beatriz Costa',
    roleTitle: 'Analista de Mercado Pet e Agronegócio',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    bio: 'Veterinária e pesquisadora de inteligência comercial para a cadeia veterinária e pet food.',
    specialties: ['Pet Care', 'Nutrição Animal', 'Franquias Pet'],
    email: 'beatriz.costa@gritnews.com.br',
    followersCount: 980,
    articlesCount: 15
  }
];

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'partner-medtech',
    name: 'MedTech Brasil',
    slug: 'medtech-brasil',
    logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=200',
    coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
    sector: 'Mercado de Saúde',
    description: 'Plataforma líder em prontuário eletrônico inteligente e gestão de clínicas médicas integradas com IA.',
    website: 'https://medtechbrasil.com.br',
    contactEmail: 'contato@medtechbrasil.com.br',
    status: 'ACTIVE',
    partnershipTier: 'PREMIUM',
    featuredCount: 5
  },
  {
    id: 'partner-petcare',
    name: 'PetCare Ops',
    slug: 'petcare-ops',
    logo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200',
    coverImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800',
    sector: 'Mercado Pet',
    description: 'Soluções completas de gestão de inventário e agendamento para hospitais e pet shops em todo o país.',
    website: 'https://petcareops.com.br',
    contactEmail: 'comercial@petcareops.com.br',
    status: 'ACTIVE',
    partnershipTier: 'GOLD',
    featuredCount: 3
  },
  {
    id: 'partner-logitech',
    name: 'LogiTech Global',
    slug: 'logitech-global',
    logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200',
    coverImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800',
    sector: 'Automação e Logística',
    description: 'Software de otimização de rotas e rastreamento de cargas em tempo real impulsionado por IoT.',
    website: 'https://logitechglobal.com.br',
    contactEmail: 'parcerias@logitechglobal.com.br',
    status: 'ACTIVE',
    partnershipTier: 'PREMIUM',
    featuredCount: 8
  }
];

export const INITIAL_OFFERS: Offer[] = [
  {
    id: 'offer-1',
    title: 'Software de Gestão Hospitalar e Clínicas MedTech',
    slug: 'software-gestao-medtech',
    type: 'PRODUCT',
    partnerId: 'partner-medtech',
    categoryId: 'cat-saude',
    shortDescription: 'Ganhe 3 meses de teste grátis e implantação assistida no melhor ERP médico com IA.',
    fullDescription: 'O ERP MedTech acelera o faturamento de consultas, reduz faltas com avisos automáticos no WhatsApp e centraliza exames laboratoriais na nuvem com criptografia de ponta a ponta.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    originalPrice: 499,
    promoPrice: 299,
    couponCode: 'GRITSAUDE2026',
    affiliateUrl: 'https://gritnews.com.br/oferta/medtech-promo',
    affiliateProgramName: 'MedTech Partners',
    expiresAt: '2026-12-31',
    featured: true,
    clicksCount: 342,
    conversionsCount: 28,
    badgeText: 'EXCLUSIVO GRIT'
  },
  {
    id: 'offer-2',
    title: 'Curso Master de Importação e Desembaraço Aduaneiro',
    slug: 'curso-master-importacao',
    type: 'INFOPRODUCT',
    categoryId: 'cat-importacao',
    shortDescription: 'Treinamento completo para empresas reduzirem impostos em até 30% nas compras internacionais.',
    fullDescription: 'Aprenda do zero as alíquotas de tributação, Radar Siscomex, escolha de despachantes confiáveis e rotas marítimas estratégicas com consultores experientes.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    originalPrice: 1200,
    promoPrice: 497,
    couponCode: 'GRITIMPORT50',
    affiliateUrl: 'https://gritnews.com.br/oferta/curso-importacao',
    affiliateProgramName: 'Hotmart Affiliate',
    expiresAt: '2026-09-30',
    featured: true,
    clicksCount: 520,
    conversionsCount: 45,
    badgeText: '50% OFF'
  },
  {
    id: 'offer-3',
    title: 'Consultoria de Valuation e M&A para Startups',
    slug: 'consultoria-valuation-ma',
    type: 'LEAD_QUOTE',
    partnerId: 'partner-logitech',
    categoryId: 'cat-negocios',
    shortDescription: 'Diagnóstico financeiro e avaliação de mercado gratuita para empresas de tecnologia.',
    fullDescription: 'Receba um relatório detalhado assinado por analistas da GRIT e parceiros com estimativa de valor da sua empresa e potenciais compradores do setor.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
    affiliateUrl: 'https://gritnews.com.br/oferta/valuation-contato',
    featured: false,
    clicksCount: 180,
    conversionsCount: 19,
    badgeText: 'ORÇAMENTO GRÁTIS'
  }
];

export const INITIAL_AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'ad-top-header',
    name: 'Banner Topo - Inovação em Saúde MedTech',
    advertiserName: 'MedTech Brasil',
    type: 'BANNER',
    location: 'HEADER',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
    headline: 'Revolucione a Gestão da sua Clínica com Inteligência Artificial',
    bodyText: 'Conheça o sistema oficial de saúde aprovado por mais de 2.000 médicos no Brasil.',
    targetUrl: 'https://gritnews.com.br/ofertas',
    startDate: '2026-01-01',
    impressionsCount: 12500,
    clicksCount: 480,
    status: 'ACTIVE'
  },
  {
    id: 'ad-sidebar-1',
    name: 'Native Ad - Logística 4.0 LogiTech',
    advertiserName: 'LogiTech Global',
    type: 'NATIVE_CARD',
    location: 'SIDEBAR',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
    headline: 'Reduza Custos de Frota em 25% este Mês',
    bodyText: 'Descubra a tecnologia de roteirização usada pelas maiores transportadoras.',
    targetUrl: 'https://gritnews.com.br/ofertas',
    startDate: '2026-02-01',
    impressionsCount: 8400,
    clicksCount: 310,
    status: 'ACTIVE'
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Inteligência Artificial na Saúde: Como Algoritmos Estão Reduzindo em 40% o Tempo de Diagnóstico em Hospitais Brasileiros',
    slug: 'inteligencia-artificial-na-saude-diagnosticos-hospitais-brasil',
    subtitle: 'Estudo exclusivo da GRIT NEWS revela a adoção acelerada de modelos generativos e visão computacional em centros médicos do país.',
    summary: 'Projetos integrados de IA em redes hospitalares públicas e privadas mostram ganhos expressivos em precisão laboratorial e triagem imediata de emergência.',
    categoryId: 'cat-saude',
    tags: ['Healthtech', 'Inteligência Artificial', 'Hospitais', 'Inovação Médica'],
    authorId: 'author-camila',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Equipe médica analisa exames auxiliados por algoritmos de aprendizado profundo em São Paulo.',
    publishedAt: '2026-07-28T09:00:00Z',
    updatedAt: '2026-07-28T14:20:00Z',
    readingTimeMinutes: 6,
    viewsCount: 4820,
    likesCount: 312,
    sharesCount: 145,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'b1',
        type: 'paragraph',
        content: 'A revolução silenciosa nos corredores hospitalares do Brasil não vem apenas de novos fármacos, mas de linhas de código inteligentes. Nos últimos 18 meses, mais de 120 grandes centros de saúde nacionais adotaram soluções baseadas em Inteligência Artificial para análise preditiva e triagem de exames de imagem.'
      },
      {
        id: 'b2',
        type: 'heading2',
        content: 'Gargalos de Triagem e Soluções em Tempo Real'
      },
      {
        id: 'b3',
        type: 'paragraph',
        content: 'Segundo levantamento realizado com 45 diretores clínicos, o tempo médio para leitura e pré-laudo de tomografias de urgência caiu de 45 minutos para apenas 8 minutos com o suporte da visão computacional. Isso permite que casos graves de acidente vascular cerebral (AVC) ou hemorragias sejam direcionados imediatamente para o cirurgião de plantão.'
      },
      {
        id: 'b4',
        type: 'callout',
        content: '💡 **Dado de Mercado:** O segmento de healthtechs no Brasil movimentou mais de R$ 1,8 bilhão em investimentos no último ano, com destaque para soluções B2B hospitalares.'
      },
      {
        id: 'b5',
        type: 'heading2',
        content: 'O Papel da Regulamentação da ANVISA e Proteção de Dados'
      },
      {
        id: 'b6',
        type: 'paragraph',
        content: 'Com a consolidação da LGPD para dados sensíveis de saúde, os fornecedores de software precisaram blindar completamente suas arquiteturas. Todos os dados processados por algoritmos de IA médica devem ser anonimizados no servidor antes de entrarem nas redes de inferência.'
      },
      {
        id: 'b7',
        type: 'product_card',
        content: 'software-gestao-medtech'
      },
      {
        id: 'b8',
        type: 'heading3',
        content: 'Próximos Passos para os Gestores de Saúde'
      },
      {
        id: 'b9',
        type: 'paragraph',
        content: 'Especialistas recomendam que a implementação ocorra por etapas: iniciando pela automação da agenda e atendimento ao paciente via WhatsApp, passando para o prontuário eletrônico unificado e, por fim, conectando módulos avançados de suporte à decisão clínica.'
      }
    ],
    seo: {
      metaTitle: 'IA na Saúde: Como Diagnósticos Estão 40% Mais Rápidos no Brasil | GRIT NEWS',
      metaDescription: 'Veja como hospitais brasileiros usam inteligência artificial para agilizar diagnósticos e melhorar a gestão em saúde.',
      keywords: ['IA na saude', 'healthtech brasil', 'diagnostico por imagem', 'gestao hospitalar']
    }
  },
  {
    id: 'art-2',
    title: 'O Fenômeno do Mercado Pet no Brasil: Projeção Indica Movimentação de R$ 78 Bilhões até o Fim do Ano',
    slug: 'fenomeno-mercado-pet-brasil-projecao-78-bilhoes',
    subtitle: 'Humanização dos animais de estimação impulsiona serviços de alta especialização, pet food premium e plano de saúde veterinário.',
    summary: 'Mesmo em cenários econômicos desafiadores, o setor pet nacional mantém crescimento duplo dígito impulsionado por tecnologia e novas franquias.',
    categoryId: 'cat-pet',
    tags: ['Mercado Pet', 'Negócios', 'Franquias', 'Veterinária'],
    authorId: 'author-beatriz',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Clínica veterinária moderna equipada com sistemas digitais de monitoramento pet.',
    publishedAt: '2026-07-27T11:30:00Z',
    updatedAt: '2026-07-27T16:00:00Z',
    readingTimeMinutes: 5,
    viewsCount: 3910,
    likesCount: 240,
    sharesCount: 98,
    isSponsored: false,
    blocks: [
      {
        id: 'b21',
        type: 'paragraph',
        content: 'O Brasil se consolida como o terceiro maior mercado pet do planeta. A mudança no perfil das famílias brasileiras transformou cães e gatos em membros efetivos do lar, criando demanda por serviços que antes existiam apenas para humanos.'
      },
      {
        id: 'b22',
        type: 'heading2',
        content: 'Sub-setores que Mais Crescem'
      },
      {
        id: 'b23',
        type: 'paragraph',
        content: 'A nutrição natural (pet food super premium) e os planos de saúde veterinários são os grandes motores deste ano. Redes de hospitais 24h integradas com franquias de banho e tosa registram taxas de rentabilidade acima da média do varejo tradicional.'
      },
      {
        id: 'b24',
        type: 'quote',
        content: '“O tutor pet brasileiro não corta investimentos em saúde e alimentação do seu animal nem em tempos de arrocho orçamentário. O desafio atual é a digitalização do atendimento.”'
      },
      {
        id: 'b25',
        type: 'heading2',
        content: 'Tecnologia Aplicada à Gestão Veterinária'
      },
      {
        id: 'b26',
        type: 'paragraph',
        content: 'Com o aumento de clínicas e pet shops, a gestão automatizada de vacinas, estoque e agendamentos tornou-se requisito de sobrevivência. Plataformas especializadas ajudam proprietários a controlar margens de lucro e fidelizar clientes com facilidade.'
      }
    ],
    seo: {
      metaTitle: 'Mercado Pet no Brasil Move R$ 78 Bi com Alta Tecnologia | GRIT NEWS',
      metaDescription: 'Análise do crescimento do mercado pet no Brasil: franquias, veterinária e nutrição de alta performance.',
      keywords: ['mercado pet', 'pet food', 'franquia pet shop', 'medicina veterinaria']
    }
  },
  {
    id: 'art-3',
    title: 'Agentes Autônomos de IA para Empresas: A Próxima Fronteira da Produtividade Corporativa',
    slug: 'agentes-autonomos-ia-empresas-produtividade-corporativa',
    subtitle: 'Sistemas que tomam decisões e executam fluxos completos de trabalho estão substituindo tarefas repetitivas em grandes organizações.',
    summary: 'Entenda como os AI Agents diferem dos chatbots tradicionais e como sua empresa pode implementar essa tecnologia com segurança.',
    categoryId: 'cat-tech',
    tags: ['Inteligência Artificial', 'Tecnologia', 'Automação', 'SaaS'],
    authorId: 'author-renato',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Representação visual de ecossistema conectado de agentes autônomos.',
    publishedAt: '2026-07-28T11:00:00Z',
    updatedAt: '2026-07-28T15:00:00Z',
    readingTimeMinutes: 7,
    viewsCount: 5210,
    likesCount: 430,
    sharesCount: 210,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'b31',
        type: 'paragraph',
        content: 'Não estamos mais falando apenas de conversar com uma inteligência artificial para obter respostas em texto. A nova onda da tecnologia empresarial é composta por Agentes Autônomos de IA — sistemas capazes de interagir com bancos de dados, APIs e ferramentas internas para resolver tarefas complexas sem supervisão constante.'
      },
      {
        id: 'b32',
        type: 'heading2',
        content: 'Exemplos Práticos em Operações Reais'
      },
      {
        id: 'b33',
        type: 'paragraph',
        content: 'No setor financeiro, agentes autônomos já analisam conciliação bancária, identificam discrepâncias fiscais e enviam notificações aos contadores em questão de segundos. No atendimento ao cliente, resolvem 80% dos chamados de suporte Nível 1 sem intervenção humana.'
      },
      {
        id: 'b34',
        type: 'callout',
        content: '⚡ **Insight GRIT:** Organizações que adotaram arquitetura de agentes reduziram o tempo do ciclo de vendas B2B de 14 para 4 dias.'
      }
    ],
    seo: {
      metaTitle: 'Agentes Autônomos de IA na Empresa: Guia Completo | GRIT NEWS',
      metaDescription: 'Descubra como funcionam os agentes autônomos de IA e como aumentar a produtividade corporativa.',
      keywords: ['agentes de IA', 'automação empresarial', 'produtividade B2B', 'IA generativa']
    }
  },
  {
    id: 'art-4',
    title: 'Automação de Galpões e Logística 4.0: Como Entregas no Mesmo Dia se Tornaram o Padrão do Varejo',
    slug: 'automacao-de-galpoes-logistica-4-0-entregas-no-mesmo-dia',
    subtitle: 'Investimento em robôs AMR e software WMS reduz custos de separação de pedidos e turbina a experiência do cliente final.',
    summary: 'A busca por eficiência no e-commerce força a modernização do supply chain brasileiro com tecnologia avançada.',
    categoryId: 'cat-logistica',
    tags: ['Logística', 'Automação', 'Supply Chain', 'E-commerce'],
    authorId: 'author-gabriel',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Galpão logístico automatizado em atividade no estado de São Paulo.',
    publishedAt: '2026-07-26T14:00:00Z',
    updatedAt: '2026-07-26T18:00:00Z',
    readingTimeMinutes: 5,
    viewsCount: 2890,
    likesCount: 195,
    sharesCount: 88,
    isSponsored: true,
    partnerId: 'partner-logitech',
    blocks: [
      {
        id: 'b41',
        type: 'paragraph',
        content: 'A expectativa do consumidor moderno em relação ao prazo de entrega mudou radicalmente. O que antes era considerado um diferencial — receber o produto em 24 a 48 horas — agora é exigência básica para grandes players do comércio eletrônico.'
      },
      {
        id: 'b42',
        type: 'heading2',
        content: 'Robótica de Separação e Gestão IoT'
      },
      {
        id: 'b43',
        type: 'paragraph',
        content: 'A substituição de rotas manuais por Robôs Móveis Autônomos (AMR) dentro dos centro de distribuição eliminou 95% dos erros de picking e reduziu acidentes de trabalho a zero nas áreas integradas.'
      }
    ],
    seo: {
      metaTitle: 'Logística 4.0 e Automação de Galpões no Brasil | GRIT NEWS',
      metaDescription: 'Veja como a robótica e o software de roteirização revolucionam as entregas no e-commerce.',
      keywords: ['logistica 4.0', 'automacao de galpoes', 'same day delivery', 'wms']
    }
  }
];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'GRIT NEWS',
  tagline: 'Informação que gera oportunidades.',
  domain: 'gritnews.com.br',
  metaDescription: 'Plataforma de inteligência de mercado que reúne notícias, análises, inovação, ofertas e oportunidades B2B.',
  googleAnalyticsId: 'G-GRITNEWS2026',
  googleTagManagerId: 'GTM-GRITNEWS',
  adSenseClientId: 'ca-pub-1234567890123456',
  newsletterDoubleOptIn: true,
  autoApproveComments: false,
  maintenanceMode: false,
  lgpdBannerText: 'Nós utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência de navegação, analisar nosso tráfego e personalizar conteúdos de acordo com nossa Política de Privacidade (LGPD).'
};
