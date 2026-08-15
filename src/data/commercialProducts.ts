import { CommercialProduct, Offer } from '../types';

export const COMMERCIAL_PRODUCTS: CommercialProduct[] = [
  {
    id: 'prod-playbook-emagrecimento',
    sku: 'PLAYBOOK-EMAGRECE-2026',
    title: 'Playbook Emagrecimento Saudável Definitivo',
    subtitle: 'Edição 2026 • Método Científico Anti-Efeito Sanfona + 4 Bônus Exclusivos',
    description: 'Guia completo passo a passo de 128 páginas com protocolo de queima de gordura, crononutrição, 28 dias de cardápios práticos, tabela de substituições de alimentos e guia de chás termogênicos.',
    type: 'INFOPRODUCT',
    category: 'Saúde & Nutrição',
    originalPrice: 97.00,
    price: 29.90,
    badge: 'Mais Vendido • 70% OFF',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80',
    downloadUrl: '/downloads/playbook-emagrecimento-saudavel-grit.pdf',
    benefits: [
      'Download Imediato em PDF de Alta Definição (128 páginas)',
      'Protocolo de Ativação Metabólica 2026',
      '4 Bônus: Cardápio 28 Dias + Lista Mercado + Tabela Substituições + Guia de Chás',
      'Acesso Vitalício no seu E-mail e WhatsApp',
      'Garantia Incondicional de 7 Dias'
    ],
    featured: true
  },
  {
    id: 'prod-ad-banner-header',
    sku: 'AD-BANNER-HEADER-30D',
    title: 'Plano Mídia: Banner Topo Header (30 Dias)',
    subtitle: 'Posicionamento Premium em Todas as Páginas do Portal GRIT News',
    description: 'Exibição garantida no topo do portal (Desktop e Mobile), impactando tomadores de decisão, executivos e consumidores de alta renda no Ceará e Nordeste.',
    type: 'AD_BANNER',
    category: 'Publicidade B2B',
    originalPrice: 500.00,
    price: 350.00,
    badge: 'Alta Visibilidade',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    benefits: [
      'Veiculação por 30 dias contínuos no topo do site',
      'Links rastreados com UTM para seu WhatsApp ou Landing Page',
      'Relatório analítico de cliques e impressões',
      'Suporte de criação e formatação da arte do banner',
      'Impacto direto no público executivo do Ceará'
    ],
    featured: true
  },
  {
    id: 'prod-ad-publieditorial',
    sku: 'AD-PUBLI-EDITORIAL-15D',
    title: 'Publieditorial Patrocinado + Destaque na Home',
    subtitle: 'Artigo de Autoridade Escrito pela Equipe Editorial GRIT News',
    description: 'Matéria aprofundada com narrativa jornalística profissional sobre sua empresa, produto ou serviço, indexada no Google com SEO avançado e em destaque na Home.',
    type: 'SPONSORED_POST',
    category: 'Publicidade B2B',
    originalPrice: 1200.00,
    price: 890.00,
    badge: 'Máxima Autoridade',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
    benefits: [
      'Artigo de 800 a 1.500 palavras produzido por jornalistas GRIT',
      'Destaque no bloco principal da Home por 15 dias',
      'Indexação permanente no Google e motores de busca',
      'Disparo dedicado na Newsletter Executiva para 8.500+ assinantes',
      'Direito de compartilhamento e selo "Destaque no GRIT News"'
    ],
    featured: false
  },
  {
    id: 'prod-ad-banner-sidebar',
    sku: 'AD-BANNER-SIDEBAR-30D',
    title: 'Banner Lateral & In-Article (30 Dias)',
    subtitle: 'Inserção Estratégica Dentro das Notícias e Artigos Setoriais',
    description: 'Seu anúncio posicionado na barra lateral de leitura e no meio dos artigos das categorias de Economia, Saúde, Tecnologia ou Agronegócio.',
    type: 'AD_BANNER',
    category: 'Publicidade B2B',
    originalPrice: 380.00,
    price: 250.00,
    badge: 'Excelente Custo-Benefício',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
    benefits: [
      '30 dias de exibição em artigos de alto tráfego',
      'Segmentação por categoria de interesse',
      'Cliques diretos para seu catálogo ou WhatsApp',
      'Relatório de conversão quinzenal'
    ],
    featured: false
  },
  {
    id: 'prod-re-destaque-eusebio',
    sku: 'RE-EUSEBIO-FEATURED-LISTING',
    title: 'Destaque de Imóvel no Eusébio (Selo Verificado)',
    subtitle: 'Posicionamento no Topo da Central Imobiliária de Eusébio por 60 Dias',
    description: 'Destaque sua casa em condomínio fechado, lote ou apartamento no Eusébio com selo de verificação, galeria de fotos e botão direto para o seu WhatsApp de corretor/proprietário.',
    type: 'REAL_ESTATE_FEATURE',
    category: 'Imóveis no Eusébio',
    originalPrice: 249.00,
    price: 149.00,
    badge: 'Gere Mais Visitas',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    benefits: [
      'Exibição no topo da seção de Imóveis no Eusébio por 60 dias',
      'Selo "Imóvel Verificado GRIT News"',
      'Botão direto de WhatsApp com mensagem personalizada para o corretor',
      'Inclusão nas recomendações de condomínios da região'
    ],
    featured: true
  },
  {
    id: 'prod-re-consultoria-vip',
    sku: 'RE-EUSEBIO-VIP-CONSULTING',
    title: 'Consultoria Imobiliária VIP no Eusébio',
    subtitle: 'Assessoria Personalizada para Escolha do Condomínio Ideal',
    description: 'Atendimento consultivo exclusivo com especialistas que conhecem a fundo a infraestrutura, zoneamento, valorização e segurança dos melhores residenciais fechados do Eusébio.',
    type: 'REAL_ESTATE_CONSULTING',
    category: 'Imóveis no Eusébio',
    originalPrice: 850.00,
    price: 490.00,
    badge: 'Atendimento Exclusivo',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80',
    benefits: [
      'Dossiê comparativo dos melhores condomínios fechados do Eusébio',
      'Análise de valorização metro quadrado e taxas condominiais',
      'Agendamento VIP de visitas com corretores parceiros de alta confiança',
      'Suporte preventivo na checagem de certidões e documentação'
    ],
    featured: false
  },
  {
    id: 'prod-tenpets-apoio-50',
    sku: 'TENPETS-DONATION-50',
    title: 'Cota de Apoio TenPets: Ração & Primeiros Cuidados',
    subtitle: 'Doação Solidária para Resgate e Nutrição de Animais em Tratamento',
    description: 'Contribuição direta para a compra de ração super premium, vermífugos, vacinas e cuidados emergenciais para cães e gatos resgatados sob acompanhamento veterinário.',
    type: 'DONATION_TENPETS',
    category: 'Proteção Animal TenPets',
    price: 50.00,
    badge: 'Solidariedade Direta',
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
    benefits: [
      '100% destinado aos insumos e ração dos animais em recuperação',
      'Certificado Digital de Padrinho Solidário TenPets',
      'Nome no mural de apoiadores da causa animal GRIT',
      'Relatório de transparência enviado por e-mail'
    ],
    featured: true
  },
  {
    id: 'prod-tenpets-apoio-150',
    sku: 'TENPETS-DONATION-150',
    title: 'Cota TenPets: Tratamento Clínico & Cirurgias',
    subtitle: 'Financiamento de Exames Laboratoriais, Medicamentos e Procedimentos',
    description: 'Apoio vital para custear exames de sangue, internações, ultrassonografias e cirurgias veterinárias de animais resgatados em estado crítico.',
    type: 'DONATION_TENPETS',
    category: 'Proteção Animal TenPets',
    price: 150.00,
    badge: 'Salva Vidas',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
    benefits: [
      'Custeio de exames e medicamentos essenciais',
      'Certificado Especial de Mantenedor da Vida TenPets',
      'Atualizações fotográficas do animal em tratamento via WhatsApp',
      'Agradecimento público no canal veterinário'
    ],
    featured: false
  },
  {
    id: 'prod-grit-membership-pro',
    sku: 'GRIT-MEMBERSHIP-PRO-ANUAL',
    title: 'Clube GRIT News Pro (Assinatura Anual)',
    subtitle: 'Acesso Exclusivo a Relatórios Econômicos, Inteligência Setorial e Sem Anúncios',
    description: 'Faça parte do círculo fechado de tomadores de decisão com acesso a relatórios trimestrais de inteligência de mercado do Ceará e Nordeste, newsletters exclusivas e navegação sem publicidade.',
    type: 'MEMBERSHIP',
    category: 'Assinatura Premium',
    originalPrice: 390.00,
    price: 199.00,
    badge: 'Acesso VIP Anual',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    benefits: [
      'Navegação 100% livre de anúncios em todo o portal',
      'Edição Semanal da Newsletter "Radar Executivo Nordeste"',
      'Acesso a PDFs e Relatórios Econômicos Setoriais Exclusivos',
      'Convite para encontros digitais e webinars fechados com especialistas',
      'Badge de Assinante Pro nos comentários'
    ],
    featured: true
  }
];

export function getProductById(id?: string): CommercialProduct | undefined {
  if (!id) return undefined;
  const cleanId = id.trim().toLowerCase();
  
  // Direct match
  const direct = COMMERCIAL_PRODUCTS.find(p => p.id.toLowerCase() === cleanId || p.sku.toLowerCase() === cleanId);
  if (direct) return direct;

  // Aliases
  if (cleanId.includes('eusebio') || cleanId.includes('imoveis')) {
    return COMMERCIAL_PRODUCTS.find(p => p.id === 'prod-re-destaque-eusebio') || COMMERCIAL_PRODUCTS[3];
  }
  if (cleanId.includes('tenpets') || cleanId.includes('doacao')) {
    return COMMERCIAL_PRODUCTS.find(p => p.id === 'prod-tenpets-apoio-50') || COMMERCIAL_PRODUCTS[5];
  }
  if (cleanId.includes('playbook') || cleanId.includes('emagrecimento')) {
    return COMMERCIAL_PRODUCTS[0];
  }
  if (cleanId.includes('banner') || cleanId.includes('header')) {
    return COMMERCIAL_PRODUCTS.find(p => p.id === 'prod-ad-banner-header');
  }
  if (cleanId.includes('publi') || cleanId.includes('post')) {
    return COMMERCIAL_PRODUCTS.find(p => p.id === 'prod-ad-publieditorial');
  }
  if (cleanId.includes('vip') || cleanId.includes('pro') || cleanId.includes('membership')) {
    return COMMERCIAL_PRODUCTS.find(p => p.id === 'prod-grit-membership-pro');
  }

  return undefined;
}

export function convertOfferToProduct(offer: Offer): CommercialProduct {
  return {
    id: `offer-${offer.id}`,
    sku: `OFFER-${offer.id.toUpperCase()}`,
    title: offer.title,
    subtitle: offer.shortDescription,
    description: offer.fullDescription || offer.shortDescription,
    type: 'CUSTOM_OFFER',
    category: 'Oferta Especial B2B',
    originalPrice: offer.originalPrice,
    price: offer.promoPrice || offer.originalPrice || 99.00,
    badge: offer.badgeText || 'Condição Especial',
    image: offer.image,
    benefits: [
      'Ativação imediata da oferta com a garantia GRIT News',
      'Atendimento e suporte comercial direto',
      'Condição negociada exclusivamente para a comunidade de leitores'
    ],
    featured: offer.featured
  };
}
