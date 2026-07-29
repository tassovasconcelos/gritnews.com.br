import { Category, Article, AuthorProfile, Partner, Offer, AdCampaign, SiteSettings, TenPetsArticle, TenPetsRescue, TenPetsPartner } from '../types';

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
    avatar: '/src/assets/images/leticia_karla_profile_1785288976216.jpg',
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
    authorId: 'author-leticia',
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
    viewsCount: 8420,
    likesCount: 680,
    sharesCount: 390,
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
      metaDescription: 'Veja como conseguir os melhores cartões de crédito Black sem anuidade com acesso gratuito às Salas VIP DragonPass e LoungeKey.',
      keywords: ['cartao black sem anuidade', 'salas vip aeroporto', 'xp visa infinite', 'c6 carbon black', 'inter black', 'dragonpass loungekey']
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
    viewsCount: 6180,
    likesCount: 520,
    sharesCount: 290,
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
      metaDescription: 'Descubra como se capacitar para agente de aeroporto com Priscila Loren (@agentedeaeroportoonline) e conquistar sua vaga nas companhias aéreas.',
      keywords: ['agente de aeroporto', 'priscila loren', 'agentedeaeroportoonline', 'atendimento aeroporto', 'emprego aviacao', 'azul gol latam']
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

export const INITIAL_TENPETS_ARTICLES: TenPetsArticle[] = [
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
    viewsCount: 1420,
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
    viewsCount: 980,
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
    viewsCount: 2150,
    featured: true,
    tags: ['Nefrologia Felina', 'Nutrição Pet', 'Pesquisa Científica', 'Letícia Karla']
  }
];

export const INITIAL_TENPETS_RESCUES: TenPetsRescue[] = [
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

