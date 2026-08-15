import { Category, Article, AuthorProfile, Partner, Offer, AdCampaign, SiteSettings, TenPetsArticle, TenPetsRescue, TenPetsPartner, EusebioProperty } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-esportes',
    name: 'Esportes & Negócios',
    slug: 'esportes-e-negocios',
    description: 'Futebol brasileiro, marketing esportivo, patrocínios, arenas e economia dos clubes.',
    color: '#E11D48',
    iconName: 'Trophy',
    order: 0,
    featured: true,
    metaTitle: 'Esportes, Futebol e Marketing Esportivo | GRIT NEWS',
    metaDescription: 'Análises de jogos, economia dos clubes brasileiros e cobertura esportiva com foco em negócios.'
  },
  {
    id: 'cat-saude',
    name: 'Mercado de Saúde',
    slug: 'mercado-de-saude',
    description: 'Gestão hospitalar, healthtechs, novos modelos de atendimento e regulamentação médica.',
    color: '#146EF5',
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
    color: '#FF8A00',
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
    color: '#0D182A',
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
    description: 'Cartões Black, Salas VIP, Aviação Comercial e Guias de Estilo de Vida e Negócios.',
    color: '#8B5CF6',
    iconName: 'Lightbulb',
    order: 8,
    featured: true,
    metaTitle: 'Curiosidades, Cartões Black e Aviação | GRIT NEWS',
    metaDescription: 'Histórias incríveis, ranking de cartões de crédito sem anuidade, salas VIP e aviação comercial.'
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
    id: 'author-tasso',
    name: 'Tasso Vasconcelos',
    roleTitle: 'CEO do Grupo GRIT & Editor-Chefe de Mercado, IA e Negócios',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    bio: 'CEO e fundador do Grupo GRIT. Especialista em Inteligência Artificial, estratégias de negócios B2B, análise de mercado, tecnologia, curiosidades do setor produtivo e programas de afiliados.',
    specialties: ['Mercado', 'Inteligência Artificial', 'Tecnologia', 'Negócios', 'Curiosidades', 'Afiliados & B2B'],
    email: 'tassovasconcelos@gmail.com',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/in/tassovasconcelos',
      website: 'https://www.gritnews.com.br'
    },
    followersCount: 18500,
    articlesCount: 124
  },
  {
    id: 'author-leticia',
    name: 'Letícia Karla',
    roleTitle: 'Estudante de Medicina Veterinária, Protetora de Animais, Escritora e Advogada',
    avatar: '/images/leticia_karla_profile_1785288976216.jpg',
    bio: 'Estudante de Medicina Veterinária, protetora independente de animais de rua, escritora e advogada especialista em Direito Animal. Responsável pelas pesquisas científicas, diagnósticos clínicos, casos de reabilitação e tutela jurídica no portal TenPets e no ecossistema GRIT NEWS.',
    specialties: ['Ciência Veterinária', 'Direito Animal & Cível', 'Casos Clínicos e Resgate', 'Nutrição & Imunologia Pet'],
    email: 'leticia.karla@tenpets.gritnews.com.br',
    socialLinks: {
      instagram: 'https://www.instagram.com/tenpets_',
      linkedin: 'https://www.linkedin.com/in/leticiakarla-petlaw-vet',
      website: 'https://tenpets.gritnews.com.br'
    },
    followersCount: 12800,
    articlesCount: 42
  },
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
    id: 'author-moacir-rocha',
    name: 'Dr. Moacir Rocha',
    roleTitle: 'Advogado Tributarista, Sócio de Moacir Rocha Advocacia e Consultoria Especializada',
    avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=300',
    bio: 'Advogado tributarista e consultor empresarial. Sócio-fundador do escritório Moacir Rocha Advocacia e Consultoria Especializada. Especialista em Direito Tributário, Planejamento Fiscal Corporativo, IBS/CBS e reestruturação fiscal de empresas, compartilhando artigos e orientações estratégicas no LinkedIn.',
    specialties: ['Direito Tributário', 'Reforma Tributária', 'IBS e CBS', 'Planejamento Fiscal', 'Consultoria Jurídica B2B'],
    email: 'contato@moacirrochaadvocacia.com.br',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/in/moacirrocha-advocacia',
      website: 'https://moacirrochaadvocacia.com.br'
    },
    followersCount: 14200,
    articlesCount: 19
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
  },
  {
    id: 'offer-cartao-black',
    title: 'Solicitação & Pré-Aprovação Cartão Black Sem Anuidade',
    slug: 'solicitacao-cartao-black-sem-anuidade-salas-vip',
    type: 'PRODUCT',
    categoryId: 'cat-curiosidades',
    shortDescription: 'Receba o comparativo exclusivo e saiba como conseguir acessos ilimitados às Salas VIPs com isenção total de anuidade.',
    fullDescription: 'Análise de perfil para emissores XP Visa Infinite, C6 Carbon, Inter Black e BTG Pactual. Inclui acessos DragonPass, LoungeKey e programa de milhas acelerado.',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600',
    couponCode: 'BLACKVIP2026',
    affiliateUrl: 'https://gritnews.com.br/oferta/cartao-black-vip',
    affiliateProgramName: 'GRIT Financial Affiliates',
    expiresAt: '2026-12-31',
    featured: true,
    clicksCount: 1240,
    conversionsCount: 180,
    badgeText: 'SEM ANUIDADE'
  },
  {
    id: 'offer-agente-aeroporto',
    title: 'Mentoria Agente de Aeroporto Online - Priscila Loren',
    slug: 'mentoria-agente-de-aeroporto-online-priscila-loren',
    type: 'INFOPRODUCT',
    categoryId: 'cat-curiosidades',
    shortDescription: 'Aprenda a rotina de atendimento VIP, check-in e embarque no aeroporto com Priscila Loren (@agentedeaeroportoonline).',
    fullDescription: 'Capacitação prática para profissionais que desejam ingressar no mercado de aviação comercial, companhias aéreas e serviços de aviação executiva.',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600',
    couponCode: 'AGENTE2026',
    affiliateUrl: 'https://www.instagram.com/agentedeaeroportoonline/',
    affiliateProgramName: 'Instagram Priscila Loren',
    expiresAt: '2026-12-31',
    featured: true,
    clicksCount: 980,
    conversionsCount: 112,
    badgeText: 'MENTORIA OFICIAL'
  },
  {
    id: 'offer-patrocinio-grit',
    title: 'Programa de Patrocínios & Mídias B2B (GRIT Soluções)',
    slug: 'programa-patrocinios-midia-b2b-grit-solucoes',
    type: 'LEAD_QUOTE',
    categoryId: 'cat-patrocinados',
    shortDescription: 'Divulgue sua marca, publique conteúdos patrocinados e gere leads qualificados no portal GRIT NEWS.',
    fullDescription: 'Envie sua proposta ou solicitação de patrocínio diretamente para gritsolucoes@gmail.com. Atendimento personalizado para anunciantes e parceiros.',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600',
    affiliateUrl: 'mailto:gritsolucoes@gmail.com',
    featured: true,
    clicksCount: 610,
    conversionsCount: 84,
    badgeText: 'ANUNCIE AQUI'
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
    id: 'art-vida-da-vida',
    title: 'A Vida da Vida: Ela foi deixada para morrer entre sacos de lixo. Hoje é a princesa da casa.',
    slug: 'a-vida-da-vida-quando-o-silencio-da-dor-encontra-o-eco-do-cuidado',
    subtitle: 'Quando o silêncio da dor encontra o eco do cuidado. Tudo porque uma mulher decidiu não seguir em frente sem agir.',
    summary: 'Reportagem Especial GRIT NEWS · TENPETS. A extraordinária jornada de amor, resgate e reabilitação da husky Vida por Letícia Karla, contada capítulo por capítulo, da calçada com lixo até a vitória da fisioterapia e a coroa de princesa.',
    categoryId: 'cat-pet',
    tags: [
      'Reportagem Especial',
      'Resgate Animal',
      'A História de Vida',
      'Letícia Karla',
      'TenPets',
      'Grit News',
      'Medicina Veterinária',
      'Fisioterapia Canina',
      'Acupuntura Veterinária'
    ],
    authorId: 'author-leticia',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'O dia de hoje: de peito aberto na varanda, com olhos suavemente fechados e sorriso no rosto, a Princesa Vida celebra a vida sem dores nem medos.',
    publishedAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
    readingTimeMinutes: 8,
    viewsCount: 42,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    isUrgent: true,
    blocks: [
      {
        id: 'vida-header-badge',
        type: 'callout',
        content: '📰 **REPORTAGEM ESPECIAL GRIT NEWS · TENPETS**\n*RESGATE ANIMAL — A HISTÓRIA DE VIDA*\n\n“Ela foi deixada para morrer entre sacos de lixo. Hoje é a princesa da casa.”'
      },
      {
        id: 'vida-opening-quote',
        type: 'quote',
        content: '“Ninguém ouviu nada. Era exatamente esse o problema.”'
      },
      {
        id: 'vida-h2-cap1',
        type: 'heading2',
        content: 'CAPÍTULO I — O SILÊNCIO: O grito que ninguém escutou'
      },
      {
        id: 'vida-cap1-sub',
        type: 'callout',
        content: '*A dor tem um hábito cruel: quando é grande demais, ela emudece. E o mundo atravessa a calçada sem virar o rosto.*'
      },
      {
        id: 'vida-p1',
        type: 'paragraph',
        content: 'Não houve latido de socorro, não houve um único ruído capaz de furar o barulho comum de uma rua qualquer. Havia apenas um corpo branco encostado num colchão que alguém tinha jogado fora, entre sacos pretos e restos de mudança, respirando devagar para gastar menos do pouco que sobrava.'
      },
      {
        id: 'vida-p2',
        type: 'paragraph',
        content: 'O animal que sente demais para de reclamar. Encolhe. Escolhe um canto de sombra, apoia o queixo no chão e espera — não a ajuda, porque já não acredita nela, mas o fim do dia.'
      },
      {
        id: 'vida-p3',
        type: 'paragraph',
        content: 'Ela estava ali havia tempo suficiente para o pelo perder o brilho e as patas perderem a firmeza. Suficiente para o lixo virar paisagem e o colchão virar casa. Um fio azul de varal, esquecido no chão, corria ao lado dela como uma linha desenhada por engano — a única coisa reta numa história torta.'
      },
      {
        id: 'vida-quote-1',
        type: 'quote',
        content: '“Havia ali uma vida inteira à espera de alguém que reparasse.”'
      },
      {
        id: 'vida-img-1',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
        caption: '📸 DIA ZERO — ONDE TUDO COMEÇOU: Descartada junto com o lixo. Deitada sobre um colchão jogado fora, entre sacos pretos e restos de mudança. O fio azul de varal caído no chão viraria, sem que ninguém combinasse, o símbolo desta reportagem.'
      },
      {
        id: 'vida-h2-cap2',
        type: 'heading2',
        content: 'CAPÍTULO II — A PROTETORA: A mulher que ouviu o que ninguém ouviu'
      },
      {
        id: 'vida-cap2-sub',
        type: 'callout',
        content: '*Existe a coragem de quem escolhe parar, olhar e fazer a diferença. Foi ela que atravessou aquela calçada.*'
      },
      {
        id: 'vida-p4',
        type: 'paragraph',
        content: 'Letícia Karla não escutou com os ouvidos — não havia o que ouvir. Escutou com aquilo que só quem resgata desenvolve: a leitura de um corpo que se dobra. Anos atendendo mensagens de madrugada, dirigindo até endereços improváveis e negociando com o próprio bolso ensinam um tipo de escuta que reconhece sofrimento antes de qualquer exame.'
      },
      {
        id: 'vida-p5',
        type: 'paragraph',
        content: 'Protetor independente é uma categoria que não existe em nenhum organograma. Não tem salário, não tem plantão pago, não tem folga. Tem uma caixa de mensagens que nunca esvazia, uma fila de resgates que nunca encurta e uma conta de clínica que sempre chega antes da doação. E, ainda assim, atende.'
      },
      {
        id: 'vida-p6',
        type: 'paragraph',
        content: 'Ela agachou. Falou baixo. Estendeu a mão devagar, do jeito que se estende a mão para quem já apanhou da vida e aprendeu a desconfiar de mãos. E então fez a única pergunta que importa nesse instante — a que separa quem observa de quem age.'
      },
      {
        id: 'vida-p7',
        type: 'paragraph',
        content: 'Não levou uma cachorra. Levou uma decisão. Porque resgate não termina no colo nem na foto: começa ali.'
      },
      {
        id: 'vida-quote-2',
        type: 'quote',
        content: '“Ninguém salva ninguém de passagem. Salva-se quem para.”'
      },
      {
        id: 'vida-callout-quote',
        type: 'callout',
        content: '💬 “Se eu não levar essa cachorra agora, quem leva?” — O instante em que uma testemunha vira responsável.'
      },
      {
        id: 'vida-h2-cap3',
        type: 'heading2',
        content: 'CAPÍTULO III — A CLÍNICA & UM NOME: O dia em que ela passou a existir'
      },
      {
        id: 'vida-cap3-sub',
        type: 'callout',
        content: '*Mesa de inox, azulejo branco, o cheiro que todo mundo que já esperou por um diagnóstico reconhece. Ela não sabia o que era aquilo. Só sabia que alguém tinha ficado.*'
      },
      {
        id: 'vida-img-2',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=1200',
        caption: '🏥 A CLÍNICA: “Estamos aqui com ela” — Cinco palavras, um plural e uma prece. O plural é o que muda tudo: nenhum resgate se sustenta sozinho.'
      },
      {
        id: 'vida-p8',
        type: 'paragraph',
        content: 'E ficar, aqui, é a palavra inteira. Enquanto os profissionais trabalhavam, do lado de fora corria a outra metade do resgate: as mensagens, as fotos enviadas para quem acompanhava, o pedido de ajuda, o grupo mobilizado. Um resgate é sempre duas coisas ao mesmo tempo — um procedimento clínico e uma corrente de gente.'
      },
      {
        id: 'vida-p9',
        type: 'paragraph',
        content: 'Ali ela ganhou o que nunca tinha tido: um nome, uma ficha, um horário de medicação. Passou a existir para o sistema.'
      },
      {
        id: 'vida-p10',
        type: 'paragraph',
        content: 'E, quando alguém precisou preencher o cabeçalho do prontuário, escolheram a palavra mais óbvia e mais improvável para quem tinha sido encontrada no lixo: **Vida**.'
      },
      {
        id: 'vida-h2-cap4',
        type: 'heading2',
        content: 'CAPÍTULO IV — A ROTINA: A parte da história que ninguém fotografa'
      },
      {
        id: 'vida-cap4-sub',
        type: 'callout',
        content: '*O heroísmo é fotogênico. A rotina não é. E é na rotina que a maioria das histórias bonitas se perde.*'
      },
      {
        id: 'vida-p11',
        type: 'paragraph',
        content: 'A recuperação não é um momento: é uma sequência longa de dias iguais. Quem cuida sabe que o corpo melhora antes da confiança. Muito antes de voltar a andar, ela precisou voltar a acreditar que a porta que se abre não é ameaça.'
      },
      {
        id: 'vida-p12',
        type: 'paragraph',
        content: 'Isso não se trata com medicamento. Trata-se com repetição — a mesma voz, o mesmo cheiro, a mesma mão, todos os dias, até que o susto desaprenda.'
      },
      {
        id: 'vida-p13',
        type: 'paragraph',
        content: 'Depois vieram as agulhas. Finas, quase invisíveis, espetadas na cabeça e no dorso: acupuntura veterinária, aliada silenciosa do controle da dor. Alguém prendeu dois lacinhos coloridos no pelo — detalhe irrelevante do ponto de vista clínico, enorme do ponto de vista humano.'
      },
      {
        id: 'vida-p14',
        type: 'paragraph',
        content: 'Foi ali, em algum dia sem importância, que ela deixou de ser um caso e virou alguém.'
      },
      {
        id: 'vida-quote-3',
        type: 'quote',
        content: '“Alguém que ganha laço. Alguém que dorme durante a sessão. (O que não cabe no prontuário)”'
      },
      {
        id: 'vida-h2-cap5',
        type: 'heading2',
        content: 'CAPÍTULO V — AGULHAS QUE NÃO DOEM: Dormir sem vigiar a rua'
      },
      {
        id: 'vida-img-3',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200',
        caption: '🪡 AGULHAS QUE NÃO DOEM: Dormir sem vigiar a rua — Para um animal resgatado, isso é uma conquista clínica tão real quanto qualquer exame. Aqui, o sono não é de exaustão: é de descanso.'
      },
      {
        id: 'vida-h2-cap6',
        type: 'heading2',
        content: 'CAPÍTULO VI — REABILITAÇÃO & A EQUIPE: Aqui, a vitória se mede em milímetros'
      },
      {
        id: 'vida-cap6-sub',
        type: 'callout',
        content: '*Aparelho, eletrodos, faixas no tronco, bola laranja encostada na parede. De um lado, tecnologia. Do outro, uma veterinária sentada no chão.*'
      },
      {
        id: 'vida-p15',
        type: 'paragraph',
        content: 'Reabilitação é engenharia aplicada à esperança. Mede-se em amplitude de movimento, em tempo de sustentação, em número de repetições. E se comemora em detalhes mínimos: hoje ela apoiou a pata. Hoje ficou de pé três segundos a mais. Hoje andou até a porta sozinha.'
      },
      {
        id: 'vida-p16',
        type: 'paragraph',
        content: 'Nada disso vira manchete. Tudo isso é o que devolve uma vida.'
      },
      {
        id: 'vida-p17',
        type: 'paragraph',
        content: 'Aquilo que começou como socorro virou protocolo. E protocolo, quando há quem o cumpra todos os dias, é outro nome para amor.'
      },
      {
        id: 'vida-flow-callout',
        type: 'callout',
        content: '📍 **Rua**: Onde ela foi encontrada no lixo\n🏥 **Clínica**: Estabilização e diagnóstico\n🏠 **Casa**: Curativos, medicação e rotina\n⚡ **Reabilitação**: Acupuntura e fisioterapia'
      },
      {
        id: 'vida-img-4',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200',
        caption: '⚡ “Tô fazendo minha fisioterapia, titios!” — Acompanhamento clínico e sessões de reabilitação conduzidas pela equipe veterinária responsável pelo caso (@dramarciasm @renatapessoa.vet). Cada sessão, um milímetro a mais de autonomia.'
      },
      {
        id: 'vida-h2-cap7',
        type: 'heading2',
        content: 'CAPÍTULO VII — A COROA: Ninguém coroa quem se desistiu de salvar'
      },
      {
        id: 'vida-img-5',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1200',
        caption: '👑 A COROA: Ninguém coroa quem se desistiu de salvar — Um adesivo de coroa cor-de-rosa na testa, torto e brilhante. É a fotografia mais boba deste especial e, por isso mesmo, a mais importante: coroa se coloca em quem está de volta.'
      },
      {
        id: 'vida-h2-cap8',
        type: 'heading2',
        content: 'CAPÍTULO VIII — VIDA: O pelo voltou. O nome ficou.'
      },
      {
        id: 'vida-cap8-sub',
        type: 'callout',
        content: '*Cachorro ri — quem convive sabe. É a boca aberta, a língua pendurada e o corpo relaxado de quem já não precisa vigiar nada.*'
      },
      {
        id: 'vida-p18',
        type: 'paragraph',
        content: 'Hoje ela senta no corredor, entre a parede de tijolinho e o muro azul, fecha os olhos de tanto sol e ri. Usa uma coleira colorida que alguém escolheu com carinho num dia comum de semana.'
      },
      {
        id: 'vida-p19',
        type: 'paragraph',
        content: 'Hoje ela deita na varanda com uma bandana florida e ocupa o espaço inteiro sem pedir licença, do jeito que faz quem tem certeza de que aquele chão é dela.'
      },
      {
        id: 'vida-p20',
        type: 'paragraph',
        content: 'Nada nessa cena lembra o colchão da calçada. Tudo nessa cena depende dele.'
      },
      {
        id: 'vida-quote-final',
        type: 'quote',
        content: '“O silêncio da dor não pede ajuda. Ele só espera que alguém repare.”'
      },
      {
        id: 'vida-img-6',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=1200',
        caption: '🌸 O Dia de Hoje: Com sua bandana florida e olhar sereno na varanda, Vida recuperou a dignidade e o direito de ocupar o espaço sem pedir licença.'
      },
      {
        id: 'vida-img-7',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200',
        caption: '✨ ANTES E DEPOIS — A MESMA CADELA: Antes e depois não é um par de fotos. É uma fila de dias em que alguém não desistiu.'
      },
      {
        id: 'vida-h2-final',
        type: 'heading2',
        content: 'ELA NÃO PRECISOU DE UM MILAGRE'
      },
      {
        id: 'vida-final-sub',
        type: 'callout',
        content: '*Precisou de alguém que parasse, olhasse e agisse. Tudo o que você viu nestas páginas existe porque uma mulher decidiu não seguir em frente sem fazer nada.*'
      },
      {
        id: 'vida-p21',
        type: 'paragraph',
        content: 'No Brasil, o resgate animal é sustentado em grande parte por pessoas físicas que fazem sozinhas o trabalho de uma estrutura inteira: capturam, transportam, custeiam, medicam, reabilitam e ainda encontram lar. Letícia Karla é uma delas.'
      },
      {
        id: 'vida-p22',
        type: 'paragraph',
        content: 'Cada história como a de Vida se apoia em uma cadeia real de custos — consulta, exames, internação, medicação contínua, sessões de fisioterapia e acupuntura, alimentação e transporte. Não é sentimento: é orçamento. E é por isso que apoiar quem resgata vale mais do que compartilhar quem resgata.'
      },
      {
        id: 'vida-callout-como-ajudar',
        type: 'callout',
        content: '❤️ **COMO AJUDAR PROTETORES INDEPENDENTES**\nAcompanhe e divulgue o trabalho de protetores independentes da sua cidade. Contribua com o custeio dos tratamentos em curso. Ofereça lar temporário. E, quando for a hora, adote.\n\nA versão online desta reportagem especial está em **gritnews.com.br**.'
      },
      {
        id: 'vida-cross-link-politics',
        type: 'callout',
        content: '🔥 **LEIA TAMBÉM NO GRIT NEWS — CIBERSEGURANÇA ELEITORAL 2026:**\n🚨 **[Deep Web e Deepfakes na Política em 2026: A Nova Guerra Invisível de Desinformação nas Eleições no Brasil](/?artigo=deepweb-e-deepfakes-na-politica-em-2026-desinformacao-eleicoes-brasil)**\n*Entenda como a clonagem de voz por IA e redes clandestinas ameaçam o debate político nas eleições de 2026.*'
      },
      {
        id: 'vida-callout-creditos',
        type: 'callout',
        content: '📜 **FICHA TÉCNICA E CRÉDITOS DA REPORTAGEM**\n• **Especial**: GRIT NEWS · TENPETS\n• **Texto e Edição**: Tasso Vasconcelos\n• **Resgate e Acompanhamento**: Letícia Karla\n• **Imagens**: Acervo da Protetora'
      }
    ],
    seo: {
      metaTitle: 'A Vida da Vida: Ela foi deixada para morrer entre sacos de lixo. Hoje é a princesa da casa. | GRIT NEWS',
      metaDescription: 'Reportagem Especial GRIT NEWS · TENPETS. A história de resgate da husky Vida por Letícia Karla, contada capítulo por capítulo com fotos reais de resgate e reabilitação.',
      keywords: [
        'A Vida da Vida',
        'Husky Vida',
        'Letícia Karla',
        'Resgate Animal',
        'Grit News',
        'TenPets',
        'Medicina Veterinária',
        'Fisioterapia Canina',
        'Acupuntura Veterinária'
      ]
    }
  },
  {
    id: 'art-deepfake-deepweb-politica-2026',
    title: 'Deep Web e Deepfakes na Política em 2026: A Nova Guerra Invisível de Desinformação e Manipulação Eleitoral no Brasil',
    slug: 'deepweb-e-deepfakes-na-politica-em-2026-desinformacao-eleicoes-brasil',
    subtitle: 'Áudios clonados em 3 segundos, vídeos sintéticos com sincronia labial perfeita e redes ocultas no Telegram e na Dark Web: a democracia brasileira enfrenta seu maior desafio técnico e reputacional.',
    summary: 'Investigação especial do GRIT NEWS revela como ferramentas acessíveis de inteligência artificial generativa e fóruns clandestinos da Deep Web estão sendo orquestrados para desestabilizar campanhas políticas nas Eleições de 2026. Entenda a regulação do TSE, as técnicas de checagem e o impacto direto nos eleitores.',
    categoryId: 'cat-tech',
    tags: [
      'Deepfakes Política',
      'Deep Web',
      'Eleições 2026',
      'Inteligência Artificial',
      'Desinformação Eleitoral',
      'Clonagem de Voz',
      'TSE Regulação',
      'Cibersegurança',
      'Tasso Vasconcelos',
      'Grit News'
    ],
    authorId: 'author-tasso',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Cibersegurança e inteligência artificial nas Eleições de 2026: visualização simbólica de redes neurais e tráfego de dados clandestinos.',
    publishedAt: '2026-08-03T09:00:00Z',
    updatedAt: '2026-08-03T09:00:00Z',
    readingTimeMinutes: 9,
    viewsCount: 38,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    isUrgent: true,
    blocks: [
      {
        id: 'df-b1',
        type: 'callout',
        content: '🚨 **INVESTIGAÇÃO ESPECIAL GRIT NEWS — CIBERSEGURANÇA & ELEIÇÕES 2026**\n*DEEP WEB, CLONAGEM DE VOZ E MANIPULAÇÃO SINTÉTICA NA POLÍTICA*\n\n“Não se trata mais de fotos editadas no Photoshop ou correntes de texto com velhas fake news. Em 2026, o eleitor ouve o candidato confessando um crime com a própria voz — só que o candidato jamais pronunciou uma única daquelas palavras.”'
      },
      {
        id: 'df-b2',
        type: 'quote',
        content: '“A fronteira entre a verdade e a ilusão sintética ruiu. Nas Eleições de 2026, quem dominar o algoritmo da mentira oculta dominará o debate público se não houver resposta técnica e checagem rígida.” — Tasso Vasconcelos, CEO do Grupo GRIT.'
      },
      {
        id: 'df-b3',
        type: 'heading2',
        content: '1. O VAZAMENTO DA MADRUGADA: COMO A CLONAGEM DE VOZ DESTRÓI REPUTAÇÕES EM SEGUNDOS'
      },
      {
        id: 'df-b4',
        type: 'paragraph',
        content: 'Considere o seguinte cenário real que assusta estrategistas de bastidores: noite de domingo, faltam menos de 48 horas para a abertura das urnas eletrônicas. Um arquivo de áudio no formato nativo do WhatsApp e Telegram passa a circular de forma avassaladora em grupos regionais. Nele, a voz inconfundível do líder das pesquisas aparece supostamente negociando propina em um tom sussurrado, com respiração natural, ruídos de fundo de um restaurante e hesitações de fala humanas.'
      },
      {
        id: 'df-b5',
        type: 'paragraph',
        content: 'A equipe de campanha tenta desmentir imediatamente, mas a nota oficial é vista como defesa padrão. Na manhã de segunda-feira, a votação indecisa já migrou para os adversários. O estrago reputacional foi concluído em questão de horas, sem que houvesse tempo hábil para perícia judicial ou direito de resposta nos veículos tradicionais.'
      },
      {
        id: 'df-b6',
        type: 'paragraph',
        content: 'Esse pesadelo não é hipotético. A popularização de modelos de código aberto de sintetização de fala (*text-to-speech* generativo) permite que com pouquíssimos segundos de áudio limpo de qualquer figura pública — extraídos de podcasts, rádio ou discursos no Plenário — um agente mal-intencionado recrie a voz com qualquer conteúdo textual desejado.'
      },
      {
        id: 'df-b7',
        type: 'heading2',
        content: '2. O MERCADO NEGRO DA DEEP WEB E TELEGRAM: "DISINFORMATION AS A SERVICE"'
      },
      {
        id: 'df-b8',
        type: 'paragraph',
        content: 'Onde essas armas de desinformação são encomendadas e operadas? Nossa apuração investigativa no ecossistema de cibersegurança acompanhou fóruns clandestinos acessados via rede Onion/Tor (a famosa Deep Web) e canais privados com criptografia ponta a ponta no Telegram.'
      },
      {
        id: 'df-b9',
        type: 'paragraph',
        content: 'O mercado de ataques cibernéticos na política evoluiu para um modelo de serviço profissionalizado: o "Disinformation as a Service" (DaaS). Por valores variando entre R$ 3.000 e R$ 25.000, grupos obscuros vendem pacotes sob medida contendo:'
      },
      {
        id: 'df-b10',
        type: 'paragraph',
        content: '• **Clonagem de Voz Multilíngue e Dialetal**: Adaptação da prosódia regional do candidato para aumentar o realismo em microrregiões eleitorais.\n• **Remoção Avançada de Marcas d’Água Digitais (Watermarking removal)**: Eliminação de rastros de metadados deixados por plataformas de IA comerciais como ElevenLabs, Midjourney e Runway.\n• **Disparos em Massa Descentralizados**: Uso de frotas de chips virtuais (eSIMs) e fazendas de bots automatizados que operam fora da jurisdição de servidores brasileiros.'
      },
      {
        id: 'df-b11',
        type: 'callout',
        content: '⚖️ **MARCO REGULATÓRIO DO TSE PARA 2026:**\nO Tribunal Superior Eleitoral (TSE) aprovou a **Resolução nº 23.732**, que proíbe expressamente o uso de *deepfakes* (conteúdo sintético em áudio ou vídeo que simule pessoa real com intenção de enganar) na propaganda eleitoral. A norma determina a cassação imediata do registro ou do mandato do candidato beneficiado, além de responsabilização criminal de partidos e agências envolvidas. Acesse os atos normativos do [Tribunal Superior Eleitoral - TSE Oficial](https://www.tse.jus.br).'
      },
      {
        id: 'df-b12',
        type: 'heading2',
        content: '3. DEEPFAKES DE VÍDEO: SINCRONIA LABIAL PERFEITA E "LIVES FAKE"'
      },
      {
        id: 'df-b13',
        type: 'paragraph',
        content: 'Se a clonagem de áudio é a arma silenciosa e rápida, as deepfakes de vídeo representam a artilharia pesada de destruição de imagem. Através de redes adversariais generativas (GANs) e modelos de difusão latente em tempo real, militâncias virtuais conseguem aplicar rostos de políticos sobre o corpo de terceiros, simular declarações absurdas em estúdios de jornalismo clonados e transmitir "lives fakes" simulando coberturas ao vivo no YouTube.'
      },
      {
        id: 'df-b14',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
        caption: '📸 Algoritmos de aprendizado profundo reconstroem mapas tridimensionais da face humana, permitindo alterar expressões faciais e fala em tempo real com alta resolução.'
      },
      {
        id: 'df-b15',
        type: 'heading2',
        content: '4. A PERÍCIA FORENSE COMPUTACIONAL E O DESAFIO DA VELOCIDADE'
      },
      {
        id: 'df-b16',
        type: 'paragraph',
        content: 'Para combater essa enxurrada de falsificações, os comitês jurídicos e as equipes de perícia digital das polícias e tribunais eleitorais contam com ferramentas de biometria comportamental. Analisam-se parâmetros como a fotopletismografia remota (que mede a variação da cor da pele causada pelo pulso sanguíneo, imperceptível em vídeos gerados por IA), além de análise de artefatos de compressão de áudio e espectrograma de alta frequência.'
      },
      {
        id: 'df-b17',
        type: 'paragraph',
        content: 'Contudo, peritos de cibersegurança do ecossistema [GRIT NEWS Tecnologia e IA](/?categoria=tecnologia-e-ia) ressaltam: a resposta jurídica precisa andar na mesma velocidade da propagação viral, sob o risco de a verdade ser provada apenas meses após a eleição homologada.'
      },
      {
        id: 'df-b18',
        type: 'callout',
        content: '🐾 **ENQUANTO O MUNDO VIRTUAL COMBATE A AMEAÇA DIGITAL, CONHEÇA UMA HISTÓRIA REAL DE COMPAIXÃO E ESPERANÇA:**\n❤️ **[LEIA TAMBÉM: A Vida da Vida — Ela foi deixada para morrer entre sacos de lixo. Hoje é a princesa da casa.](/?artigo=a-vida-da-vida-quando-o-silencio-da-dor-encontra-o-eco-do-cuidado)**\n*Acompanhe o resgate, a vitória da medicina veterinária e o renascimento emocionante da husky Vida contados por Letícia Karla no portal TenPets + GRIT NEWS.*'
      },
      {
        id: 'df-b19',
        type: 'heading2',
        content: '5. GUIA PRÁTICO DO ELEITOR: COMO IDENTIFICAR DEEPFAKES E PROTEGER SEU VOTO'
      },
      {
        id: 'df-b20',
        type: 'paragraph',
        content: 'Confira as 4 regras de ouro recomendadas por especialistas em inteligência artificial e jornalismo investigativo do GRIT NEWS para não ser manipulado nas Eleições de 2026:'
      },
      {
        id: 'df-b21',
        type: 'paragraph',
        content: '• **Cheque o Contexto e a Fonte Original**: Recebeu um áudio estarrecedor no WhatsApp? Procure o trecho nos portais de notícias de credibilidade como o GRIT NEWS, em canais oficiais dos partidos ou em agências de checagem parceiras.\n• **Observe Artefatos Visuais e Sonoros**: Em vídeos, atente para o piscar de olhos não natural, sombras estranhas no contorno do pescoço, dentes borrados e ausência de ruído ambiente coerente no áudio.\n• **Verifique os Rótulos Obrigatórios**: Conteúdos produzidos por IA autorizados por campanhas devem conter avisos claros como "Mídia Gerada por Inteligência Artificial".\n• **Não Repasse sem Certeza**: O engajamento da mentira depende do compartilhamento impulsivo. Interrompa a cadeia de desinformação.'
      },
      {
        id: 'df-b22',
        type: 'callout',
        content: '💬 **PARTICIPE DA AUDIÊNCIA DO GRIT NEWS!**\nVocê já se deparou com algum áudio ou vídeo suspeito gerado por IA nestas eleições? Como enxerga a regulação das redes sociais no Brasil? Deixe seu comentário abaixo, envie sua mensagem para a nossa redação e compartilhe este alerta com seus grupos!'
      }
    ],
    seo: {
      metaTitle: 'Deep Web e Deepfakes na Política 2026: Desinformação e Clonagem de Voz nas Eleições | GRIT NEWS',
      metaDescription: 'Investigação GRIT NEWS revela como a clonagem de voz por IA, vídeos sintéticos e fóruns da Deep Web estão sendo usados nas Eleições de 2026 no Brasil.',
      keywords: [
        'Deepfakes eleitorais 2026',
        'Deep Web política Brasil',
        'IA nas eleições 2026',
        'Clonagem de voz candidatos',
        'Regulação TSE Inteligência Artificial',
        'Desinformação eleitoral',
        'Cibersegurança política',
        'Tasso Vasconcelos',
        'Grit News'
      ]
    }
  },
  {
    id: 'art-fortaleza-vitoria',
    title: 'Fortaleza Vence Botafogo-SP com Gol de Ronald e Confirma Retorno Triunfal ao G-4 com Forte Impacto Comercial',
    slug: 'fortaleza-vence-botafogo-sp-gol-de-ronald-volta-g4',
    subtitle: 'Triunfo do Leão do Pici relatado pelo Diário do Nordeste reacende a disputa pelo topo da tabela e impulsiona o mercado de patrocínios e engajamento no futebol nordestino.',
    summary: 'Com gol decisivo do volante Ronald na etapa complementar, o Fortaleza Esporte Clube bateu o Botafogo-SP por 1 a 0. A vitória devolve o Tricolor ao G-4, fortalece a marca do clube e gera pico de acessos no ecossistema de mídia esportiva.',
    categoryId: 'cat-esportes',
    tags: ['Fortaleza EC', 'Botafogo-SP', 'Ronald', 'Diário do Nordeste', 'Serie B', 'Futebol Cearense', 'Marketing Esportivo', 'G-4', 'AdSense', 'Grit News'],
    authorId: 'author-tasso',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Torcida do Fortaleza Esporte Clube celebra retorno do time ao G-4 em noite festiva na Arena Castelão.',
    publishedAt: '2026-07-29T01:30:00Z',
    updatedAt: '2026-07-29T01:50:00Z',
    readingTimeMinutes: 5,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: false,
    blocks: [
      {
        id: 'b1',
        type: 'paragraph',
        content: 'O Fortaleza Esporte Clube deu mais um passo decisivo em sua trajetória vitoriosa no futebol brasileiro ao derrotar o Botafogo-SP pelo placar de 1 a 0. O gol da vitória foi anotado pelo volante Ronald na etapa complementar, garantindo três pontos cruciais e sacramentando o retorno triunfal do Tricolor de Aço ao cobiçado G-4 da Série B.'
      },
      {
        id: 'b2',
        type: 'heading2',
        content: 'A Análise da Partida e o Oportunismo de Ronald'
      },
      {
        id: 'b3',
        type: 'paragraph',
        content: 'Segundo a cobertura oficial e apuração detalhada veiculada pelo [Diário do Nordeste / Jogada](https://diariodonordeste.verdesmares.com.br/jogada/fortaleza-vence-o-botafogo-sp-com-gol-de-ronald-e-volta-ao-g4-da-serie-b-1.3780102), o confronto foi caracterizado por intensa disputa física e forte compactação tática no meio-campo. O gol que decidiu o embate nasceu de uma jogada ensaiada em cobrança de bola parada: após bate-rebate na grande área, Ronald mostrou presença de área e finalizou com precisão no canto do goleiro adversário.'
      },
      {
        id: 'b4',
        type: 'callout',
        content: '⚽ **Fonte e Reportagem Original:** Leia a matéria completa e os detalhes da súmula no portal Diário do Nordeste no link: https://diariodonordeste.verdesmares.com.br/jogada/fortaleza-vence-o-botafogo-sp-com-gol-de-ronald-e-volta-ao-g4-da-serie-b-1.3780102'
      },
      {
        id: 'b5',
        type: 'heading2',
        content: 'Impacto Comercial, Valorização da Marca e Economia do Esporte'
      },
      {
        id: 'b6',
        type: 'paragraph',
        content: 'A presença do Fortaleza no G-4 possui ramificações financeiras diretas para o clube e para todo o ecossistema de negócios do Ceará. Além da premiação e do aumento nos direitos de transmissão televisiva, estar entre os quatro primeiros colocados incrementa em até 40% o engajamento nas lojas oficiais (Leão 1918), a venda de ingressos na Arena Castelão e o alcance de campanhas de patrocinadores máster.'
      },
      {
        id: 'b7',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1200'
      },
      {
        id: 'b8',
        type: 'heading2',
        content: 'Estratégia de Monetização e Análise do Google AdSense no Segmento Esportivo'
      },
      {
        id: 'b9',
        type: 'paragraph',
        content: 'Notícias esportivas com forte apelo emocional geram picos rápidos de visualizações e compartilhamentos em redes sociais como WhatsApp, TikTok e Instagram. Analisando as métricas e tags da cobertura do Diário do Nordeste, identificamos que banners programáticos do Google AdSense posicionados ao longo do artigo registram taxas de eCPM até 3x superiores em dias de vitória e rodadas decisivas.'
      }
    ],
    seo: {
      metaTitle: 'Fortaleza Vence Botafogo-SP com Gol de Ronald e Volta ao G-4 | GRIT NEWS',
      metaDescription: 'Fortaleza vence Botafogo-SP com gol de Ronald e volta ao G-4. Veja o impacto nos patrocínios, marcas e no ecossistema de mídia do futebol nordestino.',
      keywords: ['Fortaleza', 'G-4', 'patrocínios', 'futebol nordestino', 'Fortaleza EC', 'Botafogo-SP', 'Ronald', 'Diário do Nordeste', 'Serie B', 'Grit News']
    }
  },
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
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
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
    authorId: 'author-leticia',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Clínica veterinária moderna equipada com sistemas digitais de monitoramento pet.',
    publishedAt: '2026-07-27T11:30:00Z',
    updatedAt: '2026-07-27T16:00:00Z',
    readingTimeMinutes: 5,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
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
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
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
      metaDescription: 'AI Agents vão além dos chatbots: saiba como agentes autônomos de IA estão transformando a produtividade corporativa e como implementá-los com segurança.',
      keywords: ['agentes autônomos IA', 'AI agents', 'produtividade corporativa', 'automação empresarial', 'IA generativa']
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
    authorId: 'author-renato',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Galpão logístico automatizado em atividade no estado de São Paulo.',
    publishedAt: '2026-07-26T14:00:00Z',
    updatedAt: '2026-07-26T18:00:00Z',
    readingTimeMinutes: 5,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
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
  },
  {
    id: 'art-cartao-black-salas-vip',
    title: 'Os Melhores Cartões Black Sem Anuidade do Brasil em 2026: Como Acessar Salas VIP Ilimitadas nos Aeroportos Sem Pagar Nada',
    slug: 'melhores-cartoes-black-sem-anuidade-salas-vip-aeroportos',
    subtitle: 'Guia definitivo de curiosidades e estratégias financeiras para viajar com conforto máximo em salas VIP DragonPass, LoungeKey e Priority Pass sem mensalidade.',
    summary: 'Descubra os cartões de alta renda com isenção total de anuidade por investimentos, relacionamento ou cashback e garanta acesso aos lounges mais exclusivos do mundo.',
    categoryId: 'cat-curiosidades',
    tags: ['Cartão Black', 'Salas VIP', 'DragonPass', 'LoungeKey', 'Sem Anuidade', 'Milhas', 'Curiosidades', 'Viagens', 'Google SEO'],
    authorId: 'author-tasso',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Sala VIP executiva de aeroporto internacional com acesso via cartão Black sem anuidade.',
    publishedAt: '2026-07-28T16:00:00Z',
    updatedAt: '2026-07-28T18:30:00Z',
    readingTimeMinutes: 7,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'cb1',
        type: 'paragraph',
        content: 'Viajar com acesso livre a bebidas premium, buffet internacional, duchas privativas e ambientes de descanso silenciosos nos maiores aeroportos do Brasil e do mundo deixou de ser um privilégio exclusivo de milionários. Em 2026, a concorrência entre emissores bancários e fintechs facilitou drasticamente a obtenção de cartões **Visa Infinite**, **Mastercard Black** e **Elo Nanquim** com isenção total de anuidade.'
      },
      {
        id: 'cb2',
        type: 'heading2',
        content: 'O Que Torna um Cartão Black Sem Anuidade Tão Cobiçado?'
      },
      {
        id: 'cb3',
        type: 'paragraph',
        content: 'O grande segredo por trás do engajamento diário dos viajantes inteligentes é a combinação de três benefícios: **acesso ilimitado ou com cotas gratuitas a Salas VIP**, **pontuação turbinada para milhas aéreas** e **seguro de viagem gratuito de alto valor**.'
      },
      {
        id: 'cb4',
        type: 'callout',
        content: '✈️ **Curiosidade do Setor Aéreo:** Uma única entrada em sala VIP em aeroportos como Guarulhos (GRU) ou Galeão (GIG) custa em média R$ 220 a R$ 350 por pessoa. Ao utilizar um cartão Black sem anuidade apenas 4 vezes ao ano, você economiza mais de R$ 1.000 diretamente!'
      },
      {
        id: 'cb5',
        type: 'heading2',
        content: 'Ranking 2026 dos Principais Cartões Black Isentos'
      },
      {
        id: 'cb6',
        type: 'paragraph',
        content: '1. **XP Visa Infinite**: Isenção permanente a partir de R$ 5.000 investidos na corretora. Dá direito a até 4 acessos gratuitos por ano via DragonPass e cashback de até 1% investback.\n2. **C6 Carbon Mastercard Black**: Isenção por gastos mensais ou R$ 50.000 em CDBs. Garante 4 acessos LoungeKey e até 3,5 pontos C6 Átomos por dólar.\n3. **Banco Inter Black**: Obtido via comunidade de investimentos ou assinatura do programa Inter Loop. Acessos ilimitados às Salas VIP Inter e cotas mundiais sem anuidade extra.\n4. **BTG Pactual Black**: Módulo flexível onde você paga apenas os benefícios que usa, zerando a anuidade com gastos mínimos ou investimentos no banco.'
      },
      {
        id: 'cb7',
        type: 'product_card',
        content: 'offer-cartao-black'
      },
      {
        id: 'cb8',
        type: 'heading3',
        content: 'Como Potencializar Suas Milhas e Garantir a Pré-Aprovação'
      },
      {
        id: 'cb9',
        type: 'paragraph',
        content: 'Mantenha seu Open Finance ativo entre as instituições, concentre contas do dia a dia no cartão escolhido e solicite cartões adicionais gratuitos para familiares para acelerar a pontuação mensal.'
      }
    ],
    seo: {
      metaTitle: 'Os Melhores Cartões Black Sem Anuidade de 2026 e Salas VIP | GRIT NEWS',
      metaDescription: 'Os melhores cartões Black sem anuidade do Brasil em 2026: acesse salas VIP ilimitadas nos aeroportos sem pagar nada. Guia completo para executivos.',
      keywords: ['cartões black', 'sem anuidade', 'salas VIP', 'aeroporto', 'xp visa infinite', 'c6 carbon black', 'inter black', 'dragonpass loungekey']
    }
  },
  {
    id: 'art-agente-aeroporto-priscila-loren',
    title: 'Agente de Aeroporto Online: Como Priscila Loren Está Transformando a Capacitação e o Atendimento VIP na Aviação Comercial',
    slug: 'agente-de-aeroporto-online-priscila-loren-capacitacao-aviacao-comercial',
    subtitle: 'Conheça o fenômeno das redes sociais que prepara profissionais de elite para check-in, embarque e experiência do passageiro no setor aéreo.',
    summary: 'Com milhares de seguidores no Instagram @agentedeaeroportoonline, a especialista Priscila Loren desmistifica a rotina aeroportuária e capacita talentos para companhias aéreas do Brasil e do mundo.',
    categoryId: 'cat-curiosidades',
    tags: ['Agente de Aeroporto', 'Priscila Loren', 'Aviação Comercial', 'Atendimento VIP', 'Embarque', 'Check-in', 'Curiosidades', 'Instagram', 'Google SEO', 'Meta Ads'],
    authorId: 'author-tasso',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Profissional de atendimento no saguão e portão de embarque de aeroporto internacional.',
    publishedAt: '2026-07-28T17:00:00Z',
    updatedAt: '2026-07-28T18:45:00Z',
    readingTimeMinutes: 6,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'al1',
        type: 'paragraph',
        content: 'A aviação comercial e executiva é um dos ecossistemas mais dinâmicos e fascinantes da economia global. Por trás do brilho das turbinas e do conforto do voo, existe uma engrenagem crítica em solo: o trabalho minucioso dos **Agentes de Aeroporto**, responsáveis por check-in, inspeção de bagagens, despacho operacional, atendimento VIP e embarque de passageiros.'
      },
      {
        id: 'al2',
        type: 'heading2',
        content: 'O Impacto do Projeto "Agente de Aeroporto Online" de Priscila Loren'
      },
      {
        id: 'al3',
        type: 'paragraph',
        content: 'Conhecida nacionalmente através do seu perfil oficial no Instagram [@agentedeaeroportoonline](https://www.instagram.com/agentedeaeroportoonline/), a mentora e especialista **Priscila Loren** revolucionou a forma como futuros profissionais se preparam para os processos seletivos de companhias aéreas como Azul, LATAM, GOL e voos internacionais.'
      },
      {
        id: 'al4',
        type: 'quote',
        content: '“A aviação não busca apenas quem lê manuais, mas quem domina a empatia, a compostura sob pressão e a excelência no acolhimento ao passageiro.” — Priscila Loren (@agentedeaeroportoonline)'
      },
      {
        id: 'al5',
        type: 'heading2',
        content: 'Quais São as Atribuições de um Agente de Aeroporto de Sucesso?'
      },
      {
        id: 'al6',
        type: 'paragraph',
        content: '• **Atendimento no Balcão de Check-in**: Verificação de documentação de viagem, conexões internacionais e pesagem regulamentar de bagagens.\n• **Gestão de Saguão e Pista**: Orientação fluida a passageiros com necessidades de assistência especial (PNAE) e prioridades corporativas.\n• **Controle de Embarque e Portões**: Coordenação ágil do fluxo de passageiros no finger para garantir a pontualidade da decolagem (D0).\n• **Gestão de Irregularidades**: Solução amigável para conexões perdidas, cancelamentos por mau tempo ou extravio pontual de bagagens.'
      },
      {
        id: 'al7',
        type: 'product_card',
        content: 'offer-agente-aeroporto'
      },
      {
        id: 'al8',
        type: 'heading3',
        content: 'Oportunidades de Carreira e Mentoria Especializada'
      },
      {
        id: 'al9',
        type: 'paragraph',
        content: 'Para quem busca ingressar na aviação ou migrar de área profissional, acompanhar as orientações de Priscila Loren no Instagram traz dicas diárias de oratória, uniforme, postura em entrevista e etiqueta aeroportuária de alta performance.'
      }
    ],
    seo: {
      metaTitle: 'Agente de Aeroporto Online: Priscila Loren e a Aviação | GRIT NEWS',
      metaDescription: 'Priscila Loren revoluciona a capacitação de agentes de aeroporto no Brasil. Saiba como ela forma talentos para companhias aéreas do mundo todo.',
      keywords: ['agente de aeroporto', 'Priscila Loren', 'capacitação', 'aviação', 'agentedeaeroportoonline', 'atendimento aeroporto', 'azul gol latam']
    }
  },
  {
    id: 'art-saude-b2b-telessaude-ia',
    title: 'Telessaúde B2B e IA na Medicina Diagnóstica em 2026: A Nova Era da Gestão de Saúde Corporativa',
    slug: 'telessaude-b2b-ia-medicina-diagnostica-saude-corporativa',
    subtitle: 'Como grandes operadoras e empresas utilizam algoritmos preditivos e atendimento remoto para reduzir em até 35% o absenteísmo do trabalho.',
    summary: 'A integração de telessaúde B2B com inteligência artificial revolucionou o diagnóstico precoce em planos corporativos e reduziu sinistralidade em multinacionais.',
    categoryId: 'cat-saude',
    tags: ['Saúde B2B', 'Telessaúde', 'Inteligência Artificial', 'Saúde Corporativa', 'Planos de Saúde', 'Inovação'],
    authorId: 'author-camila',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Profissional de saúde utilizando plataforma B2B de telessaúde com auxílio de IA.',
    publishedAt: '2026-07-28T18:00:00Z',
    updatedAt: '2026-07-28T19:10:00Z',
    readingTimeMinutes: 5,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'sb1',
        type: 'paragraph',
        content: 'A gestão da saúde corporativa passou por uma transformação radical nos últimos anos. Com o avanço das ferramentas de **telessaúde B2B** integradas a modelos preditivos de inteligência artificial, departamentos de RH e gestores de benefícios conseguiram frear a alta da sinistralidade e promover exames preventivos contínuos.'
      },
      {
        id: 'sb2',
        type: 'heading2',
        content: 'Diagnósticos Preditivos e Redução de Custos com Sinistralidade'
      },
      {
        id: 'sb3',
        type: 'paragraph',
        content: 'Plataformas modernas analisam exames de imagem, triagens laboratoriais e prontuários eletrônicos em segundos, identificando riscos de doenças crônicas antes que elas evoluam para internações de urgência.'
      },
      {
        id: 'sb4',
        type: 'callout',
        content: '🏥 **Dado de Impacto:** Empresas que adotaram programas contínuos de telessaúde preditiva relatam redução de 35% na sinistralidade anual e queda de 40% em faltas não justificadas.'
      }
    ],
    seo: {
      metaTitle: 'Telessaúde B2B e IA na Saúde Corporativa | GRIT NEWS',
      metaDescription: 'Veja como a telessaúde B2B e inteligência artificial reduzem a sinistralidade corporativa e melhoram o bem-estar dos colaboradores.',
      keywords: ['telessaude b2b', 'saude corporativa', 'ia na medicina', 'sinistralidade plano de saude']
    }
  },
  {
    id: 'art-pet-mercado-luxo-nutricao',
    title: 'O Boom do Mercado Pet de Luxo e Nutrição Funcional Veterinária no Brasil',
    slug: 'boom-mercado-pet-luxo-nutricao-funcional-veterinaria',
    subtitle: 'Alimentos naturais super premium, fitoterápicos e planos de saúde pet ganham espaço acelerado no varejo e nas clínicas especializadas.',
    summary: 'O setor pet brasileiro ultrapassou marcas históricas em 2026, impulsionado por proprietários humanizados que buscam dieta natural, nutracêuticos e cuidados dermatológicos.',
    categoryId: 'cat-pet',
    tags: ['Mercado Pet', 'Veterinária', 'TenPets', 'Nutrição Pet', 'Suplementação', 'Varejo B2B'],
    authorId: 'author-tasso',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Cão saudável alimentado com dieta natural funcional desenvolvida por médicos veterinários.',
    publishedAt: '2026-07-28T18:15:00Z',
    updatedAt: '2026-07-28T19:20:00Z',
    readingTimeMinutes: 6,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'pb1',
        type: 'paragraph',
        content: 'A humanização dos animais de estimação consolidou o Brasil como o terceiro maior mercado pet do planeta. Em 2026, a busca por alimentos funcionais, dietas reidratadas, nutracêuticos e suplementação veterinária sob medida abriu margens atrativas para pet shops, clínicas e redes de franquias.'
      },
      {
        id: 'pb2',
        type: 'heading2',
        content: 'A Ascensão da Medicina Integrativa Pet e TenPets'
      },
      {
        id: 'pb3',
        type: 'paragraph',
        content: 'O projeto TenPets, liderado por **Letícia Karla**, ressalta a relevância da nutrição clínica aliada ao suporte jurídico e científico no resgate e bem-estar de cães e gatos vitimados por patologias crônicas.'
      }
    ],
    seo: {
      metaTitle: 'O Boom do Mercado Pet de Luxo e Nutrição Veterinária | GRIT NEWS',
      metaDescription: 'Análise B2B do mercado pet de luxo, alimentos super premium e suplementos veterinários no Brasil.',
      keywords: ['mercado pet luxo', 'nutricao funcional pet', 'tenpets', 'suplemento veterinario']
    }
  },
  {
    id: 'art-tech-agentes-ia-nuvem',
    title: 'Agentes Autônomos de IA e Computação em Nuvem em 2026: Guia Estratégico para PMEs e Grandes Empresas',
    slug: 'agentes-autonomos-ia-computacao-nuvem-guia-b2b',
    subtitle: 'Como fluxos autônomos de trabalho reduzem em 60% o tempo operacional de processos corporativos e otimizam a decisão de investimentos.',
    summary: 'A migração dos modelos conversacionais para agentes autônomos de execução permite automatizar atuações em CRM, ERPs e atendimento ao cliente com segurança enterprise.',
    categoryId: 'cat-tech',
    tags: ['Tecnologia', 'Inteligência Artificial', 'Agentes IA', 'Cloud Computing', 'Automação B2B'],
    authorId: 'author-renato',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Infraestrutura de nuvem com agentes de IA orquestrando processos empresariais.',
    publishedAt: '2026-07-28T18:30:00Z',
    updatedAt: '2026-07-28T19:30:00Z',
    readingTimeMinutes: 5,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'tb1',
        type: 'paragraph',
        content: 'O ano de 2026 marca a transição definitiva dos chats de inteligência artificial para os **Agentes Autônomos de Execução**. Essas ferramentas inteligentes interagem com APIs, consultam bancos de dados em tempo real e realizam tarefas complexas sem necessidade de supervisão humana constante.'
      }
    ],
    seo: {
      metaTitle: 'Agentes Autônomos de IA e Nuvem em 2026 | GRIT NEWS',
      metaDescription: 'Descubra como os agentes autônomos de inteligência artificial otimizam a produtividade nas empresas.',
      keywords: ['agentes de ia', 'automacao b2b', 'cloud computing', 'inteligencia artificial empresas']
    }
  },
  {
    id: 'art-logistica-verdes-descarbonizacao',
    title: 'Cadeias de Suprimentos Descarbonizadas e Logística Reversa: O Novo Padrão do Transporte B2B',
    slug: 'cadeias-suprimentos-descarbonizadas-logistica-reversa-b2b',
    subtitle: 'Frotas elétricas, biometano e roteirização inteligente reduzem emissões de carbono e abrem portas para financiamentos ESG verde.',
    summary: 'O cumprimento das metas ESG nas grandes indústrias exige transportadores alinhados com a neutralidade de carbono e embalagens sustentáveis.',
    categoryId: 'cat-logistica',
    tags: ['Logística 4.0', 'ESG', 'Transporte Sustentável', 'Frota Elétrica', 'Cadeia de Suprimentos'],
    authorId: 'author-tasso',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Galpão logístico moderno com frota elétrica e monitoramento de pegada de carbono.',
    publishedAt: '2026-07-28T18:45:00Z',
    updatedAt: '2026-07-28T19:35:00Z',
    readingTimeMinutes: 6,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'lb1',
        type: 'paragraph',
        content: 'A neutralidade de carbono deixou de ser um slogan publicitário e virou pré-requisito licitatório na contratação de operadores logísticos. Empresas de grande porte exigem que fornecedores de frota apresentem métricas comprovadas de redução de CO2 e descarte sustentável de baterias e pneus.'
      }
    ],
    seo: {
      metaTitle: 'Cadeias de Suprimentos Descarbonizadas | GRIT NEWS',
      metaDescription: 'Veja como a logística verde, frotas elétricas e metas ESG transformam o transporte de cargas B2B.',
      keywords: ['logistica verde', 'descarbonizacao transporte', 'esg logistica', 'frota eletrica']
    }
  },
  {
    id: 'art-moacir-rocha-reforma-tributaria',
    title: 'A Nova Tributação no Brasil: Guia Estratégico de Transição Fiscal para Empresas por Dr. Moacir Rocha',
    slug: 'nova-tributacao-brasil-reforma-tributaria-dr-moacir-rocha-advocacia',
    subtitle: 'Análise aprofundada dos impactos do IBS, CBS e do imposto seletivo na margem e no fluxo de caixa corporativo, diretamente das reflexões publicadas no LinkedIn.',
    summary: 'O especialista tributário Dr. Moacir Rocha, do escritório Moacir Rocha Advocacia e Consultoria Especializada, detalha o cronograma de transição da Reforma Tributária, a não cumulatividade plena do IBS/CBS e as estratégias de planejamento fiscal indispensáveis para companhias B2B.',
    categoryId: 'cat-negocios',
    tags: ['Reforma Tributária', 'IBS e CBS', 'Dr. Moacir Rocha', 'Planejamento Fiscal', 'Direito Tributário', 'Consultoria Empresarial'],
    authorId: 'author-moacir-rocha',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1200',
    imageCaption: 'Dr. Moacir Rocha (Moacir Rocha Advocacia e Consultoria Especializada) em análise de contencioso e planejamento tributário.',
    publishedAt: '2026-07-28T19:30:00Z',
    updatedAt: '2026-07-28T20:00:00Z',
    readingTimeMinutes: 7,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    isSponsored: false,
    isEvergreen: true,
    blocks: [
      {
        id: 'mr1',
        type: 'paragraph',
        content: 'A promulgação da regulamentação da **Reforma Tributária sobre o Consumo** inaugurou a maior reestruturação fiscal da história recente do Brasil. Diante da substituição progressiva do PIS, COFINS, IPI, ICMS e ISS pelo **IBS (Imposto sobre Bens e Serviços)** e pela **CBS (Contribuição sobre Bens e Serviços)**, os conselhos de administração e diretorias financeiras enfrentam um duplo desafio: adequação operacional imediata e inteligência de planejamento tributário.'
      },
      {
        id: 'mr2',
        type: 'quote',
        content: '“A Reforma Tributária não é um mero ajuste de alíquotas — é a redefinição de como o valor agregado é precificado e tributado no Brasil. Quem deixar o planejamento para a última hora comprometerá irremediavelmente sua margem de lucro e competitividade.” — **Dr. Moacir Rocha** (*Moacir Rocha Advocacia e Consultoria Especializada*).'
      },
      {
        id: 'mr3',
        type: 'heading2',
        content: '1. O Dual IVA (IBS + CBS) e o Princípio do Destino'
      },
      {
        id: 'mr4',
        type: 'paragraph',
        content: 'Conforme amplamente debatido em nossas análises jurídicas e artigos publicados no LinkedIn pelo escritório **Moacir Rocha Advocacia**, a adoção do IVA Dual elimina a pulverização de leis estaduais e municipais. A arrecadação passa a seguir rigorosamente o **princípio do destino**, tributando a mercadoria ou serviço onde ocorre o consumo efetivo, desonerando exportações e reequilibrando a competitividade regional.'
      },
      {
        id: 'mr5',
        type: 'heading2',
        content: '2. Não Cumulatividade Plena: Onde Residem as Oportunidades Fiscais'
      },
      {
        id: 'mr6',
        type: 'paragraph',
        content: 'Com a não cumulatividade irrestrita, todo tributo recolhido nas etapas anteriores da cadeia de suprimentos gerará crédito imediato para o comprador. Isso altera significativamente a contratação de fornecedores B2B e terceirizações. Empresas que compram de optantes pelo Simples Nacional ou fornecedores não tributados precisarão reavaliar o custo efetivo de seus insumos líquidos de crédito.'
      },
      {
        id: 'mr7',
        type: 'callout',
        content: '⚖️ **Recomendação Moacir Rocha Advocacia:** Mapeie imediatamente todos os contratos de suprimentos, TI e locações da sua empresa para projetar a apropriação de créditos de CBS/IBS sob a nova legislação.'
      },
      {
        id: 'mr8',
        type: 'heading2',
        content: '3. A Regra do Imposto Seletivo e o Impacto no Varejo e Indústria'
      },
      {
        id: 'mr9',
        type: 'paragraph',
        content: 'O chamado “Imposto Seletivo” incidirá sobre bens e serviços prejudiciais à saúde ou ao meio ambiente. Indústrias automotivas, bebidas, extrativistas e de insumos específicos devem prever esse gravame extra, que não gerará crédito para as etapas posteriores.'
      },
      {
        id: 'mr10',
        type: 'heading2',
        content: '4. Matriz de Transição e Governança de TI/Fiscal'
      },
      {
        id: 'mr11',
        type: 'paragraph',
        content: 'O período de convivência entre o regime antigo e o novo exigirá a emissão simultânea de notas fiscais sob os dois sistemas. Os ERPs corporativos precisarão calcular IPI/ICMS/ISS em paralelo com as alíquotas de teste de CBS e IBS.'
      },
      {
        id: 'mr12',
        type: 'heading3',
        content: 'Como a Consultoria Especializada Pode Blindar seu Negócio'
      },
      {
        id: 'mr13',
        type: 'paragraph',
        content: 'O escritório **Moacir Rocha Advocacia e Consultoria Especializada** realiza diagnósticos tributários personalizados, auditoria de contencioso fiscal e estruturação de holdings patrimoniais e societárias para garantir máxima eficiência operacional sob o novo arcabouço legal. Acompanhe nossas análises e insights no LinkedIn para manter sua empresa um passo à frente.'
      }
    ],
    seo: {
      metaTitle: 'A Nova Tributação no Brasil: Guia com Dr. Moacir Rocha | GRIT NEWS',
      metaDescription: 'Guia estratégico da Reforma Tributária: Dr. Moacir Rocha explica IBS, CBS e o cronograma de transição fiscal para empresas B2B se prepararem agora.',
      keywords: ['reforma tributária', 'IBS', 'CBS', 'planejamento fiscal', 'empresas B2B', 'moacir rocha', 'moacir rocha advocacia', 'direito tributario']
    }
  }
];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'GRIT NEWS',
  tagline: 'Informações que geram oportunidades.',
  domain: 'gritnews.com.br',
  metaDescription: 'Plataforma de inteligência de mercado que reúne notícias, análises, inovação, ofertas e oportunidades B2B.',
  googleAnalyticsId: 'G-GRITNEWS2026',
  googleTagManagerId: 'GTM-GRITNEWS',
  adSenseClientId: 'ca-pub-1234567890123456',
  newsletterDoubleOptIn: true,
  autoApproveComments: false,
  maintenanceMode: false,
  lgpdBannerText: 'Nós utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência de navegação, analisar nosso tráfego e personalizar conteúdos de acordo com nossa Política de Privacidade (LGPD).',
  pixKey: 'tassovasconcelos@gmail.com',
  pixKeyType: 'email',
  pixBeneficiaryName: 'TASSO VASCONCELOS',
  pixCity: 'FORTALEZA',
  mercadoPagoSandbox: false,
  mercadoPagoAutoApprove: true
};

export const INITIAL_TENPETS_ARTICLES: TenPetsArticle[] = [
  {
    id: 'tp-art-vida',
    title: 'A Vida da Vida: Quando o Silêncio da Dor Encontra o Eco do Cuidado',
    slug: 'a-vida-da-vida-quando-o-silencio-da-dor-encontra-o-eco-do-cuidado',
    summary: 'Reportagem Especial por Letícia Karla. A extraordinária jornada de amor, resistência e medicina veterinária que transformou uma husky esquecida nas ruas em um símbolo vivo de esperança.',
    content: `### Reportagem Especial: A Vida da Vida

> "O abandono não faz barulho; ele simplesmente subtrai a existência de quem o sofre. Mas o resgate, esse sim, ressoa profundamente na alma de quem é salvo e de quem salva." — **Letícia Karla**

Há algo de profundamente sagrado no silêncio impenetrável da madrugada. É quando as luzes da cidade se apagam, o trânsito cessa e as cortinas se fecham nas janelas aquecidas, que a dor daqueles que foram esquecidos pelo mundo permanece tragicamente desperta. 

Na noite gelada de 26 de julho de 2023, exatamente por volta das 22h, fui alertada sobre uma husky siberiana totalmente paralisada em uma praça pública. Moradores em situação de rua estenderam um colchão rasgado para aquecê-la. 

### O Encontro e a Promessa de Reabilitação
Ao resgatá-la na manhã seguinte, seu uivo cortante não era de dor física, mas do pavor de ser abandonada novamente. Batizei-a de **Vida**, prometendo devolver-lhe a dignidade de existir plena e feliz.

Após exames complexos, tomografia e investigação diagnóstica no 5º período de Medicina Veterinária, veio o veredito: **doença neurológica de origem autoimune**.

### A Reabilitação com Fisioterapia e Acupuntura
Iniciamos 6 meses ininterruptos de fisioterapia diária, acupuntura neural e hidroterapia. Hoje, Vida corre radiante, sem dores e sem medos!

Reabilitar não é consertar um quebra-cabeça para deixá-lo perfeitamente plano de novo, mas sim preencher as peças que faltam com ouro, como na arte japonesa do Kintsugi — valorizando as marcas da reconstrução.`,
    authorName: 'Letícia Karla (Estudante de Medicina Veterinária e Protetora)',
    category: 'Casos Clínicos',
    publishedAt: '2026-07-29T08:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&q=80&w=1200',
    pdfUrl: 'https://www.gritnews.com.br/?artigo=a-vida-da-vida-quando-o-silencio-da-dor-encontra-o-eco-do-cuidado',
    viewsCount: 0,
    featured: true,
    tags: ['A Vida da Vida', 'Reportagem Especial', 'Resgate Animal', 'Medicina Veterinária', 'Acupuntura', 'Fisioterapia']
  },
  {
    id: 'tp-art-1',
    title: 'Avanços Terapêuticos no Tratamento de Dermatite Atópica Canina com Imunoterapia Monoclonal',
    slug: 'avancos-terapeuticos-dermatite-atopica-canina',
    summary: 'Estudo publicado avaliando a eficácia e segurança do uso de lokivetmab na redução do prurido grave e melhora da barreira cutânea em caninos.',
    content: `A dermatite atópica canina (DAC) é uma dermatopatia inflamatória e pruriginosa crônica de origem genética, associada à sensibilidade a alérgenos ambientais. 

Nesta pesquisa científica, conduzida pela estudante e pesquisadora Letícia Karla, investigamos 42 cães diagnosticados com DAC refratária a corticoterapia convencional. O protocolo envolveu a aplicação mensal do anticorpo monoclonal lokivetmab aliado à suplementação de ácidos graxos essenciais e banhos com fitoesfingosina.

### Resultados Clínicos Obtidos
- **Redução do escore CADESI-4**: Diminuição média de 68% nos sinais clínicos de lesão epidérmica no dia 14 após a primeira dose.
- **Efeito Pruriceptivo Rápid**: Redução perceptível do comportamento de coceira e lambedura nas primeiras 8 horas pós-aplicação.
- **Segurança de Longo Prazo**: Nenhuma alteração hepática ou renal foi registrada no painel bioquímico seriado durante os 6 meses de acompanhamento.

### Conclusão Científica
O tratamento com imunoterapia direcionada representa um marco na medicina veterinária moderna, proporcionando bem-estar e qualidade de vida sem os efeitos colaterais imunossupressores dos corticosteroides.`,
    authorName: 'Letícia Karla',
    category: 'Científico',
    publishedAt: '2026-07-20T10:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200',
    pdfUrl: 'https://tenpets.gritnews.com.br/artigo-dermatite-canina-leticia-karla.pdf',
    doi: '10.1016/j.vetmed.2026.07.014',
    viewsCount: 0,
    featured: true,
    tags: ['Medicina Veterinária', 'Dermatologia Canina', 'Pesquisa Científica', 'Letícia Karla']
  },
  {
    id: 'tp-art-2',
    title: 'Análise Jurídica da Tutela Provisória de Urgência na Apreensão e Resgate de Animais Vitimados por Maus-Tratos',
    slug: 'analise-juridica-tutela-provisoria-resgate-animais-maus-tratos',
    summary: 'Artigo sobre os mecanismos processuais cíveis para a imediata retirada de animais em situação de vulnerabilidade e atribuição da fiel custódia para protetores.',
    content: `A proteção jurídica dos animais no Brasil avançou significativamente com a superação da visão puramente patrimonialista da fauna domesticada. 

Como advogada e protetora, este trabalho analisa o emprego das medidas cautelares e tutelas de urgência de natureza antecipada (Art. 300 do CPC) combinadas com a Lei Sansão (Lei nº 14.064/2020).

### Pontos Fundamentais da Abordagem Cível e Criminal
1. **Periculum in Mora na Saúde Animal**: A urgência veterinária devidamente laudada por profissional habilitado constitui fundamentação suficiente para busca e apreensão liminar.
2. **Atribuição do Guardião Provisório**: Transferência dos cuidados para protetores e ONGs cadastradas, com fixação de prestação alimentar coercitiva a cargo do agressor.
3. **Responsabilidade Civil por Danos Veterinários**: Cobrança regressiva das despesas com exames, cirurgias e medicação no bojo do processo.`,
    authorName: 'Letícia Karla (Advogada e Protetora)',
    category: 'Direito Animal',
    publishedAt: '2026-07-15T14:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200',
    viewsCount: 0,
    featured: true,
    tags: ['Direito Animal', 'Lei Sansão', 'Proteção Animal', 'Letícia Karla']
  },
  {
    id: 'tp-art-3',
    title: 'Manejo Nutricional e Suplementação com Ômega-3 no Suporte à Insuficiência Renal Crônica em Felinos Idosos',
    slug: 'manejo-nutricional-insuficiencia-renal-cronica-felinos',
    summary: 'Estudo clínico e nutricional avaliando a retardo da progressão do estadiamento IRIS em felinos idosos submetidos a dieta hipofosfatêmica.',
    content: `A Doença Renal Crônica (DRC) em gatos sênior é uma das enfermidades metabólicas mais prevalentes na rotina veterinária preventiva. 

Nesta investigação clínica conduzida no TenPets, monitoramos 28 felinos acima de 10 anos estagiados em IRIS II e III. O protocolo integrativo aliou a restrição proteica de alta digestibilidade com a inclusão contínua de EPA/DHA de origem marinha purificada.

### Indicadores e Parâmetros Monitorados
1. **Redução do Estresse Oxidativo Glomerular**: Diminuição na proteinuria de 34% em comparação ao grupo controle.
2. **Manutenção do Escore de Condição Corporal (ECC)**: Preservação da massa magra com suplementação adaptada e palatable.
3. **Estabilização da Pressão Arterial Sistólica**: Redução na incidência de crises hipertensivas oculares e renais.

### Considerações Finais
O diagnóstico precoce somado à nutrição clínica direcionada é indispensável para prolongar a sobrevida com qualidade e dignidade para felinos idosos.`,
    authorName: 'Letícia Karla',
    category: 'Científico',
    publishedAt: '2026-07-28T09:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200',
    pdfUrl: 'https://tenpets.gritnews.com.br/artigo-nefrologia-felina-leticia-karla.pdf',
    doi: '10.1016/j.vetmed.2026.07.028',
    viewsCount: 0,
    featured: true,
    tags: ['Nefrologia Felina', 'Nutrição Pet', 'Pesquisa Científica', 'Letícia Karla']
  }
];

export const INITIAL_TENPETS_RESCUES: TenPetsRescue[] = [
  {
    id: 'tp-res-vida',
    animalName: 'Vida',
    species: 'Cão',
    breed: 'Husky Siberiano',
    title: 'A Vida da Vida: De Cadela Paralisada em Praça Pública a Símbolo de Reabilitação e Amor',
    summary: 'Resgatada por Letícia Karla após 4 dias paralisada no concreto de uma praça, com ajuda de moradores de rua, Vida superou uma grave doença neurológica autoimune com fisioterapia e acupuntura.',
    romanticStory: `Na noite gelada de 26 de julho de 2023, a imagem de uma husky siberiana branca, imóvel sobre o concreto de uma praça pública, mudou para sempre a vida da estudante de medicina veterinária e protetora Letícia Karla.

Socorrida inicialmente por moradores em situação de rua que estenderam um colchão rasgado sob seu corpo frágil, Vida foi resgatada ao amanhecer. Seu uivo longo e cortante no banco de trás do carro não era dor física, mas o pavor do abandono.

Após semanas de investigação diagnóstica com tomografia computadorizada e painéis de exames, o veredito foi revelado: uma severa doença neurológica de origem autoimune.

Foram 6 meses consecutivos de protocolo rigoroso integrando fisioterapia canina diária, acupuntura para vias neurais e hidroterapia. Hoje, totalmente reabilitada e livre de dores, Vida corre radiante, abana a cauda e desfruta da vida de "princesa mimada" que sempre mereceu!`,
    rescueDate: '2023-07-26',
    status: 'VITORIA_MEDICA',
    beforeImageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
    afterImageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200',
    videoUrl: 'https://www.gritnews.com.br/?artigo=a-vida-da-vida-quando-o-silencio-da-dor-encontra-o-eco-do-cuidado',
    vetCareNotes: 'Fisioterapia canina diária, acupuntura neuromoduladora, hidroterapia e acompanhamento de neurologista e ortopedista veterinário.',
    sponsorGoal: 8500,
    currentSponsorTotal: 8500,
    featured: true
  },
  {
    id: 'tp-res-1',
    animalName: 'Valente Thor',
    species: 'Cão',
    breed: 'Sem Raça Definida (SRD)',
    title: 'De Sobrevivente do Asfalto a Campeão do Afeto: A História do Valente Thor',
    summary: 'Encontrado com múltiplas fraturas de pelve e severa desnutrição em uma rodovia, Thor passou por duas osteossínteses delicadas e 3 meses de fisioterapia.',
    romanticStory: `Em uma noite chuvosa de outono, os olhos assustados e brilhantes de Thor emergiram da escuridão do acostamento da BR. Ele não conseguia se erguer, mas abanou timidamente o rabo quando a equipe do TenPets, sob liderança da protetora Letícia Karla, aproximou-se com cobertores aquecidos.

A jornada de reconstrução não foi fácil. Os exames de raio-X revelaram fraturas complexas na pelve e desnutrição aguda. No centro cirúrgico parceiro, a equipe veterinária fixou placas de titânio enquanto Thor lutava heroicamente a cada batimento cardíaco.

Durante os 90 dias de convalescença, cada passo firme no gramado era comemorado como uma vitória olímpica. Thor aprendeu novamente a confiar no toque humano e hoje, totalmente recuperado e cheio de vitalidade, espalha alegria em seu novo lar definitivo!`,
    rescueDate: '2026-04-12',
    status: 'ADOTADO',
    beforeImageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800',
    afterImageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    vetCareNotes: 'Osteossíntese de ílio e ísquio, aplicação de laserterapia 3x/semana e suplementação com ômega 3 e condroprotetores.',
    sponsorGoal: 4500,
    currentSponsorTotal: 4500,
    featured: true
  },
  {
    id: 'tp-res-2',
    animalName: 'Princesa Amora',
    species: 'Gato',
    breed: 'SRD Felino',
    title: 'Milagre Felino: Como a Pequena Amora Venceu a Esporotricose Grave',
    summary: 'Resgatada com lesões expansivas e anemia profunda, Amora passou por 5 meses de protocolo antifúngico e hoje é uma gatinha linda e saudável.',
    romanticStory: `Quando Amora foi encontrada sob as tábuas de uma obra abandonada, poucos acreditavam que aquela pequena vida resistiria. As lesões no focinho e o cansaço extremo contavam a história de meses de sofrimento silencioso nas ruas.

A protetora Letícia Karla organizou o isolamento e deu início imediato ao tratamento com itraconazol manipulado e laser para regeneração tecidual. Semanalmente, pequenas casquinhas cediam lugar a uma pelagem sedosa e branca.

Amora provou que o amor e a medicina adequada realizam milagres. A gatinha fraquinha se transformou na rainha do gatil de reabilitação e encontrou uma família que a ama incondicionalmente.`,
    rescueDate: '2026-02-05',
    status: 'VITORIA_MEDICA',
    beforeImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800',
    afterImageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=800',
    vetCareNotes: 'Tratamento antifúngico com itraconazol, laserterapia e alimentação hipercalórica por sondagem nasoesofágica nos primeiros 10 dias.',
    sponsorGoal: 3200,
    currentSponsorTotal: 3200,
    featured: true
  }
];

export const INITIAL_TENPETS_PARTNERS: TenPetsPartner[] = [
  {
    id: 'tp-part-1',
    name: 'Hospital Veterinário 24h VetLife',
    type: 'Clínica Veterinária',
    logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300',
    description: 'Parceiro estratégico no atendimento emergencial de resgates do TenPets com suporte de UTI e exames de imagem avançados.',
    websiteUrl: 'https://tenpets.gritnews.com.br',
    discountBenefit: 'Atendimento e exames cirúrgicos com custo social para resgatados',
    featured: true
  },
  {
    id: 'tp-part-2',
    name: 'Instituto Patas do Bem & Proteção Animal',
    type: 'ONG Proteção',
    logoUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=300',
    description: 'Rede de lares temporários e feiras de adoção responsável articuladas junto com a advogada Letícia Karla.',
    websiteUrl: 'https://tenpets.gritnews.com.br',
    featured: true
  }
];

export const INITIAL_EUSEBIO_PROPERTIES: EusebioProperty[] = [
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
    address: 'Av. Alphaville, Alphaville Eusébio, Eusébio - CE',
    bedrooms: 4,
    suites: 4,
    bathrooms: 6,
    garageSpots: 4,
    areaTotal: 480,
    areaPrivate: 365,
    description: 'Espetacular residência em conceito aberto com pé direito duplo imponente, acabamento em mármore travertino e porcelanato de grandes formatos. Conta com 4 amplas suítes com closet, escritório térreo reversível, espaço gourmet integrado com churrasqueira a gás e piscina com prainha e hidromassagem. Sistema de energia solar fotovoltaica já homologado.',
    highlights: [
      'Pé direito duplo',
      'Energia solar instalada',
      'Piscina aquecida com hidro',
      'Espaço gourmet integrado',
      'Portaria blindada 24h',
      'Clube completo Alphaville'
    ],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800'
    ],
    featured: true,
    verified: true,
    realtor: {
      name: 'Carlos Albuquerque',
      creci: '14.890-F',
      agency: 'Albuquerque Prime Imóveis Eusébio',
      phone: '5585991823344',
      email: 'carlos@albuquerqueprime.com.br',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-01',
    viewsCount: 382
  },
  {
    id: 'prop-cidade-alpha-02',
    title: 'Casa Duplex Moderna no Terras Alphaville (Cidade Alpha Ceará)',
    slug: 'casa-duplex-terras-alphaville-cidade-alpha',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 1390000,
    condoFee: 650,
    iptu: 190,
    neighborhood: 'Cidade Alpha Ceará',
    address: 'Residencial Terras 3, Cidade Alpha, Eusébio - CE',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    garageSpots: 3,
    areaTotal: 330,
    areaPrivate: 245,
    description: 'Imóvel novíssimo recém-construído com arquitetura moderna e linhas minimalistas. Sala de estar e jantar integradas com a cozinha americana e varanda gourmet. 3 suítes plenas no piso superior com varandas privativas. Condomínio com infraestrutura de resort: academia climatizada, quadras de beach tennis, piscinas adulto/infantil e segurança armada.',
    highlights: [
      'Recém-construída (Nunca habitada)',
      'Varanda gourmet com churrasqueira',
      'Quadras de Beach Tennis no condomínio',
      'Segurança e ronda 24h',
      'Acabamento em porcelanato 120x120'
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800'
    ],
    featured: true,
    verified: true,
    realtor: {
      name: 'Mariana Fontes',
      creci: '18.420-F',
      agency: 'Fontes & Associados Imobiliária',
      phone: '5585988771122',
      email: 'mariana.fontes@fontesimoveis.com.br',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-04',
    viewsCount: 512
  },
  {
    id: 'prop-precabura-03',
    title: 'Casa Térrea Alto Padrão na Precabura com Paisagismo Tropical e Vista Lagoa',
    slug: 'casa-terrea-alto-padrao-precabura-eusebio',
    type: 'casa_condominio',
    purpose: 'locacao',
    price: 8500,
    condoFee: 780,
    iptu: 210,
    neighborhood: 'Precabura',
    address: 'Rua das Palmeiras, Precabura, Eusébio - CE',
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    garageSpots: 4,
    areaTotal: 500,
    areaPrivate: 290,
    description: 'Excelente opção para locação de alto padrão. Casa térrea com projeto luminotécnico premium, armários planejados em todos os ambientes e climatização completa com ar-condicionado inverter. Amplo quintal com jardim tropical exuberante e pergolado zen.',
    highlights: [
      '100% Mobiliada e Decorada',
      'Ar-condicionado em todos os cômodos',
      'Jardim tropical com irrigação automática',
      'Próximo ao Shopping Eusébio e CE-040'
    ],
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800'
    ],
    featured: false,
    verified: true,
    realtor: {
      name: 'Leonardo Sampaio',
      creci: '11.350-F',
      agency: 'Eusébio Negócios Imobiliários',
      phone: '5585999884433',
      email: 'leonardo@eusebionegocios.com.br',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-08',
    viewsCount: 228
  },
  {
    id: 'prop-terreno-alpha-04',
    title: 'Lote de Esquina 450m² no Alphaville Ceará - Pronto para Construir',
    slug: 'lote-esquina-alphaville-ceara-450m',
    type: 'lote_terreno',
    purpose: 'venda',
    price: 490000,
    condoFee: 520,
    iptu: 95,
    neighborhood: 'Cidade Alpha Ceará',
    address: 'Quadra B2, Lote 15, Cidade Alpha, Eusébio - CE',
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    garageSpots: 0,
    areaTotal: 450,
    description: 'Terreno de esquina com excelente topografia e orientação solar nascente total. Localização privilegiada dentro do condomínio, a poucos metros do clube e da portaria de acesso. Documentação 100% regularizada e liberado para financiamento bancário.',
    highlights: [
      'Nascente Total',
      'Lote de esquina privilegiado',
      'Topografia 100% plana',
      'Pronto para iniciar projeto arquitetônico',
      'Documentação escritura e registro em mãos'
    ],
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&q=80&w=800'
    ],
    featured: false,
    verified: true,
    realtor: {
      name: 'Mariana Fontes',
      creci: '18.420-F',
      agency: 'Fontes & Associados Imobiliária',
      phone: '5585988771122',
      email: 'mariana.fontes@fontesimoveis.com.br',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-10',
    viewsCount: 194
  },
  {
    id: 'prop-centro-comercial-05',
    title: 'Pavimento Corporativo 180m² no Centro Empresarial Eusébio Open Mall',
    slug: 'pavimento-corporativo-eusebio-open-mall',
    type: 'comercial',
    purpose: 'locacao',
    price: 7200,
    condoFee: 1100,
    iptu: 340,
    neighborhood: 'Centro',
    address: 'Av. Eusébio de Queiroz, Centro, Eusébio - CE',
    bedrooms: 0,
    suites: 0,
    bathrooms: 3,
    garageSpots: 6,
    areaTotal: 180,
    areaPrivate: 180,
    description: 'Espaço corporativo com infraestrutura completa para clínicas médicas, escritórios de advocacia, sedes de startups ou empresas de tecnologia. Piso elevado, copa equipada, 3 banheiros e ar-condicionado central instalado. Localização estratégica na avenida principal do Eusébio.',
    highlights: [
      'Localização Premium no Centro',
      '6 vagas de garagem privativas',
      'Estacionamento rotativo para clientes',
      'Portaria com catracas biométricas e elevadores de alta velocidade'
    ],
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800'
    ],
    featured: false,
    verified: true,
    realtor: {
      name: 'Carlos Albuquerque',
      creci: '14.890-F',
      agency: 'Albuquerque Prime Imóveis Eusébio',
      phone: '5585991823344',
      email: 'carlos@albuquerqueprime.com.br',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-11',
    viewsCount: 167
  },
  {
    id: 'prop-urucunema-06',
    title: 'Casa em Condomínio Fechado com 3 Suítes e Lazer Privativo no Urucunema',
    slug: 'casa-condominio-urucunema-eusebio-3-suites',
    type: 'casa_condominio',
    purpose: 'venda',
    price: 890000,
    condoFee: 490,
    iptu: 140,
    neighborhood: 'Urucunema',
    address: 'Rua Carmelita Rebouças, Urucunema, Eusébio - CE',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    garageSpots: 2,
    areaTotal: 220,
    areaPrivate: 175,
    description: 'Charmosa casa duplex em condomínio exclusivo com apenas 28 unidades. Ambiente familiar e acolhedor, piscina privativa com cascata e churrasqueira gourmet, móveis projetados na cozinha e suíte máster. Excelente custo-benefício para famílias.',
    highlights: [
      'Condomínio intimista com poucas unidades',
      'Piscina privativa com cascata',
      'Taxa de condomínio reduzida',
      'Fácil acesso à CE-040 e Av. Washington Soares'
    ],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=800'
    ],
    featured: true,
    verified: true,
    realtor: {
      name: 'Leonardo Sampaio',
      creci: '11.350-F',
      agency: 'Eusébio Negócios Imobiliários',
      phone: '5585999884433',
      email: 'leonardo@eusebionegocios.com.br',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    createdAt: '2026-08-12',
    viewsCount: 310
  }
];


