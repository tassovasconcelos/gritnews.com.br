export type Role = 
  | 'SUPERADMIN' 
  | 'ADMIN' 
  | 'EDITOR_IN_CHIEF' 
  | 'EDITOR' 
  | 'COMMERCIAL_MANAGER' 
  | 'ANALYST' 
  | 'PARTNER' 
  | 'AUTHOR' 
  | 'READER';
export type UserRole = Role;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  bio?: string;
  specialties?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  iconName: string;
  parentId?: string;
  order: number;
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export type ArticleStatus = 'DRAFT' | 'IN_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export type BlockType = 'paragraph' | 'heading2' | 'heading3' | 'callout' | 'quote' | 'image' | 'video' | 'table' | 'product_card' | 'ad_slot' | 'faq';

export interface ArticleBlock {
  id: string;
  type: BlockType;
  content: string; // text or JSON string for complex blocks like table/faq
  caption?: string;
  metadata?: Record<string, any>;
}

export interface ArticleVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
  title: string;
  summary: string;
  blocks: ArticleBlock[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  summary: string;
  categoryId: string;
  tags: string[];
  authorId: string;
  status: ArticleStatus;
  featuredImage: string;
  imageCaption?: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  isSponsored?: boolean;
  partnerId?: string;
  isAffiliate?: boolean;
  isEvergreen?: boolean;
  isUrgent?: boolean;
  pdfUrl?: string;
  blocks: ArticleBlock[];
  versions?: ArticleVersion[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl?: string;
  };
}

export interface AuthorProfile {
  id: string;
  name: string;
  roleTitle: string;
  avatar: string;
  bio: string;
  specialties: string[];
  email: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    instagram?: string;
  };
  followersCount: number;
  articlesCount: number;
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  logo: string;
  coverImage?: string;
  sector: string;
  description: string;
  website: string;
  contactEmail: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
  partnershipTier: 'PREMIUM' | 'GOLD' | 'STANDARD';
  featuredCount: number;
}

export type OfferType = 'PRODUCT' | 'AFFILIATE' | 'INFOPRODUCT' | 'SERVICE' | 'COUPON' | 'LEAD_QUOTE';

export interface Offer {
  id: string;
  title: string;
  slug: string;
  type: OfferType;
  partnerId?: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  originalPrice?: number;
  promoPrice?: number;
  couponCode?: string;
  affiliateUrl: string;
  affiliateProgramName?: string;
  expiresAt?: string;
  featured: boolean;
  clicksCount: number;
  conversionsCount: number;
  badgeText?: string;
}

export type AdType = 'BANNER' | 'NATIVE_CARD' | 'POPUP' | 'ADSENSE_CODE' | 'SPONSORED_BOX';
export type AdPlacementLocation = 'HEADER' | 'HOME_BETWEEN_BLOCKS' | 'SIDEBAR' | 'IN_ARTICLE' | 'POST_ARTICLE' | 'CATEGORY_TOP' | 'STICKY_FOOTER';

export interface AdCampaign {
  id: string;
  name: string;
  advertiserName: string;
  type: AdType;
  location: AdPlacementLocation;
  imageUrl?: string;
  headline?: string;
  bodyText?: string;
  targetUrl: string;
  codeSnippet?: string; // For AdSense or HTML ads
  startDate: string;
  endDate?: string;
  impressionsCount: number;
  clicksCount: number;
  maxImpressions?: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  categoryId?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string;
  sectorInterests: string[];
  lgpdConsent: boolean;
  consentTimestamp: string;
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED';
  sourcePage: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  sectorInterest: string;
  partnerId?: string;
  offerId?: string;
  message?: string;
  lgpdConsent: boolean;
  createdAt: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED';
}

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  likesCount: number;
  parentId?: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  articleId?: string;
  offerId?: string;
  adId?: string;
  categorySlug?: string;
  pageUrl: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SiteSettings {
  siteTitle: string;
  siteName?: string;
  contactEmail?: string;
  tagline: string;
  domain: string;
  metaDescription: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  adSenseClientId: string;
  googleAdSenseId?: string;
  newsletterDoubleOptIn: boolean;
  autoApproveComments: boolean;
  maintenanceMode: boolean;
  lgpdBannerText: string;
  lgpdEnabled?: boolean;

  // PIX & Mercado Pago Payment Gateway Settings
  pixKey?: string;
  pixKeyType?: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  pixBeneficiaryName?: string;
  pixCity?: string;
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoWebhookSecret?: string;
  mercadoPagoSandbox?: boolean;
  mercadoPagoAutoApprove?: boolean;
  mercadoPagoWalletUrl?: string;
}

export type SiteConfig = SiteSettings;

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  altText: string;
  category: string;
  dimensions?: string;
  source: 'unsplash' | 'upload' | 'ai';
  createdAt: string;
  tags: string[];
}

export interface TrendingTopic {
  id: string;
  topic: string;
  category: string;
  searchVolume: string;
  growthRate: string;
  status: 'TRENDING' | 'DRAFTED' | 'PUBLISHED';
  suggestedTitle: string;
  summary: string;
  keywords: string[];
  aiDraftId?: string;
}

export interface TenPetsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  authorName: string; // Dra/Estudante Letícia Karla
  category: 'Científico' | 'Direito Animal' | 'Casos Clínicos' | 'Opinião Vet';
  publishedAt: string;
  imageUrl: string;
  pdfUrl?: string;
  doi?: string;
  viewsCount: number;
  featured: boolean;
  tags: string[];
}

export interface TenPetsRescue {
  id: string;
  animalName: string;
  species: 'Cão' | 'Gato' | 'Silvestre' | 'Outro';
  breed?: string;
  title: string; // Ex: "A Jornada do Valente Pipoca"
  summary: string;
  romanticStory: string; // História romanceada do resgate
  rescueDate: string;
  status: 'EM_TRATAMENTO' | 'RECUPERADO' | 'ADOTADO' | 'VITORIA_MEDICA';
  beforeImageUrl: string;
  afterImageUrl: string;
  videoUrl?: string; // YouTube/Vimeo embed
  vetCareNotes: string;
  sponsorGoal?: number; // R$ arrecadado ou meta
  currentSponsorTotal?: number;
  featured: boolean;
}

export interface TenPetsPartner {
  id: string;
  name: string;
  type: 'Clínica Veterinária' | 'ONG Proteção' | 'Laboratório' | 'Pet Food' | 'Apoiador';
  logoUrl: string;
  description: string;
  websiteUrl: string;
  contactEmail?: string;
  discountBenefit?: string;
  featured: boolean;
}

export type PropertyType = 'casa_condominio' | 'apartamento' | 'lote_terreno' | 'comercial' | 'cobertura';
export type PropertyPurpose = 'venda' | 'locacao';
export type PropertyPortalSource = 'zap_imoveis' | 'viva_real' | 'olx' | 'grit_direto';
export type PropertyVerificationBadge = 'MATRICULA_VERIFICADA' | 'CRECI_AUDITADO' | 'DIRETO_COM_CONSTRUTORA' | 'VALOR_CONFIRMADO';

export interface EusebioProperty {
  id: string;
  title: string;
  slug: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  price: number;
  condoFee?: number;
  iptu?: number;
  neighborhood: string;
  condominiumName?: string;
  address?: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  garageSpots: number;
  areaTotal: number;
  areaPrivate?: number;
  pricePerM2?: number;
  description: string;
  highlights: string[];
  images: string[];
  featured: boolean;
  verified: boolean;
  verificationBadge?: PropertyVerificationBadge;
  portalSource?: PropertyPortalSource;
  sourceUrl?: string;
  realtor: {
    name: string;
    creci?: string;
    agency?: string;
    phone: string; // WhatsApp
    email?: string;
    avatar?: string;
  };
  createdAt: string;
  viewsCount: number;
}

export type PlaybookPaymentMethod = 'pix' | 'card' | 'boleto' | 'mercadopago_wallet';
export type PlaybookOrderStatus = 'PAID' | 'PENDING_PIX' | 'PROCESSING' | 'REFUNDED' | 'CANCELLED';

export type CommercialProductType = 
  | 'INFOPRODUCT' 
  | 'AD_BANNER' 
  | 'SPONSORED_POST' 
  | 'REAL_ESTATE_FEATURE' 
  | 'REAL_ESTATE_CONSULTING' 
  | 'DONATION_TENPETS' 
  | 'MEMBERSHIP' 
  | 'CUSTOM_OFFER';

export interface CommercialProduct {
  id: string;
  sku: string;
  title: string;
  subtitle: string;
  description: string;
  type: CommercialProductType;
  category: string;
  originalPrice?: number;
  price: number;
  badge?: string;
  image?: string;
  downloadUrl?: string; // Para produtos digitais (ex: PDF do Playbook)
  benefits: string[];
  featured?: boolean;
  requiresShipping?: boolean;
}

export type PlaybookOrder = {
  id: string;
  productId?: string;
  productTitle?: string;
  productType?: CommercialProductType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf?: string;
  paymentMethod: PlaybookPaymentMethod;
  amount: number;
  originalAmount?: number;
  installments?: number;
  status: PlaybookOrderStatus;
  pixCode?: string;
  couponCode?: string;
  discountAmount?: number;
  accessSent: boolean;
  downloadUrl?: string;
  mercadoPagoPaymentId?: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
};

export type CommercialOrder = PlaybookOrder;

// ==========================================
// GRIT 2.0 - AUDITORIA & SEGURANÇA
// ==========================================

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'APPROVE'
  | 'REJECT'
  | 'VERIFY'
  | 'EXPORT'
  | 'PERMISSION_CHANGE';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditActionType;
  entityType: 'article' | 'candidate' | 'source' | 'lead' | 'property' | 'settings' | 'user' | 'indicator';
  entityId: string;
  entityTitle?: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  notes?: string;
}

// ==========================================
// GRIT 2.0 - CENTRAL DE FONTES HOMOLOGADAS
// ==========================================

export type SourceType =
  | 'FONTE_OFICIAL'
  | 'IMPRENSA_NACIONAL'
  | 'IMPRENSA_REGIONAL'
  | 'VEICULO_ESPECIALIZADO'
  | 'EMPRESA'
  | 'UNIVERSIDADE'
  | 'AGENCIA_NOTICIAS'
  | 'BLOG'
  | 'FONTE_NAO_HOMOLOGADA';

export interface NewsSource {
  id: string;
  name: string;
  domain: string;
  type: SourceType;
  category: string;
  trustScore: number; // 0 to 100
  isActive: boolean;
  allowsAggregation: boolean;
  rssUrl?: string;
  apiUrl?: string;
  notes?: string;
  lastVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// GRIT 2.0 - GRIT VERIFY & BANCO DE PAUTAS
// ==========================================

export type VerificationStatus =
  | 'NAO_VERIFICADO'
  | 'EM_VERIFICACAO'
  | 'VERIFICADO'
  | 'DIVERGENTE'
  | 'FONTE_INSUFICIENTE'
  | 'REJEITADO'
  | 'APROVADO_EDITOR'
  | 'PUBLICADO';

export type CandidateKanbanStatus =
  | 'DESCOBERTA'
  | 'EM_ANALISE'
  | 'VALIDANDO'
  | 'PRONTA_EDICAO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA'
  | 'AGENDADA'
  | 'PUBLICADA'
  | 'REJEITADA';

export interface TrustScoreBreakdown {
  score: number; // 0 to 100
  rating: 'MUITO_ALTA' | 'ALTA' | 'MODERADA' | 'BAIXA' | 'NAO_PUBLICAR';
  sourceWeight: number; // 25%
  urlExistenceWeight: number; // 15%
  dateValidityWeight: number; // 10%
  authorIdentifiedWeight: number; // 5%
  corroborationWeight: number; // 20%
  coherenceWeight: number; // 10%
  institutionalOriginWeight: number; // 15%
  notes: string[];
}

export interface NewsCandidate {
  id: string;
  titleOriginal: string;
  titleSuggested: string;
  summary: string;
  urlOriginal: string;
  sourceId: string;
  sourceName: string;
  sourceDomain: string;
  sourceType: SourceType;
  authorOriginal?: string;
  publishedAtOriginal: string;
  capturedAt: string;
  lastUpdatedAt: string;
  categoryId: string;
  tags: string[];
  
  // Scores
  trustScore: number; // 0 - 100
  trustBreakdown?: TrustScoreBreakdown;
  duplicationScore: number; // 0 - 100%
  duplicateOfId?: string;
  trendingScore: number; // 0 - 100
  relevanceScore: number; // 0 - 100
  opportunityScore: number; // 0 - 100 (GRIT Opportunity Score)
  seoScore: number; // 0 - 100
  
  // Geographic
  city?: string;
  state?: string;
  country?: string;
  
  // Status & Workflow
  verificationStatus: VerificationStatus;
  kanbanStatus: CandidateKanbanStatus;
  corroboratingSourcesCount: number;
  corroboratingUrls?: string[];
  requiresReview: boolean;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  articleId?: string; // linked when published
  
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// GRIT 2.0 - VALIDADOR DE INDICADORES OFICIAIS
// ==========================================

export interface DataIndicator {
  id: string;
  name: string; // Ex: "Taxa Selic", "IPCA Acumulado 12m", "PIB Trimestral"
  value: string; // Ex: "10,75", "4,24"
  unit: string; // "% a.a.", "R$ Bilhões", "Índice"
  period: string; // Ex: "Agosto/2026", "2º Trimestre 2026"
  sourceName: string; // Ex: "Banco Central do Brasil", "IBGE", "IPEA"
  sourceUrl: string;
  collectedAt: string;
  lastUpdatedAt: string;
  methodology?: string;
  responsibleEntity: string;
  isValidated: boolean;
  history?: { period: string; value: string }[];
}

// ==========================================
// GRIT 2.0 - BANCO DE OPORTUNIDADES B2B
// ==========================================

export interface GritOpportunity {
  id: string;
  originNewsId?: string;
  originTitle: string;
  opportunityType: 'FORNECEDORES' | 'IMOBILIARIO' | 'ENERGIA_SOLAR' | 'TECNOLOGIA' | 'PET_CARE' | 'B2B_LEAD' | 'INFRAESTRUTURA';
  description: string;
  targetIndustry: string;
  estimatedMarketValue?: string;
  potentialPartnersCount: number;
  status: 'IDENTIFICADA' | 'EM_PROSPECCAO' | 'LEADS_GERADOS' | 'CONVERTIDA';
  city?: string;
  state?: string;
  createdAt: string;
}



