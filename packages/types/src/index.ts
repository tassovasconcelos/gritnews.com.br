// Export all GritNews and SACPROH types for the monorepo

export type Role = 'SUPERADMIN' | 'EDITOR_IN_CHIEF' | 'EDITOR' | 'AUTHOR' | 'COMMERCIAL_MANAGER';
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
  content: string; // text or JSON string for complex blocks
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
  codeSnippet?: string;
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
  authorName: string;
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
  title: string;
  summary: string;
  romanticStory: string;
  rescueDate: string;
  status: 'EM_TRATAMENTO' | 'RECUPERADO' | 'ADOTADO' | 'VITORIA_MEDICA';
  beforeImageUrl: string;
  afterImageUrl: string;
  videoUrl?: string;
  vetCareNotes: string;
  sponsorGoal?: number;
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

// SACPROH TYPES
export type SacProhPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA_CIRURGICA';

export type SacProhTicketStatus = 
  | 'ABERTO' 
  | 'EM_ANALISE_TECNICA' 
  | 'TECNICO_ALOCADO' 
  | 'LOGISTICA_ENTREGA' 
  | 'CONCLUIDO' 
  | 'CANCELADO';

export type SacProhTicketCategory = 
  | 'Suporte Técnico Equipamentos'
  | 'Rastreio & Entrega Centro Cirúrgico'
  | 'Troca, Devolução & SAC'
  | 'Faturamento, NFe & Financeiro'
  | 'Documentação & Registro ANVISA'
  | 'Cotação Especial OPME & Insumos';

export interface SacProhTicket {
  id: string;
  protocolCode: string;
  requesterName: string;
  hospitalName: string;
  cnpj?: string;
  email: string;
  phone: string;
  category: SacProhTicketCategory;
  subject: string;
  description: string;
  serialNumber?: string;
  anvisaRegister?: string;
  status: SacProhTicketStatus;
  priority: SacProhPriority;
  createdAt: string;
  updatedAt: string;
  responseNotes?: string;
  assignedTechnician?: string;
  estimatedResolutionTime?: string;
}

export interface SacProhProduct {
  id: string;
  name: string;
  code: string;
  anvisaRegister: string;
  category: 'Equipamentos Cirúrgicos' | 'OPME & Próteses' | 'Instrumental Cirúrgico' | 'Insumos & Esterilização' | 'Bisturis & Módulos';
  description: string;
  imageUrl: string;
  manualPdfUrl?: string;
  technicalDataSheet?: string;
  warrantyMonths: number;
  stockStatus?: 'DISPONIVEL' | 'EM_TRANSITO' | 'SOB_CONSULTA';
}

export interface SacProhHospitalContract {
  id: string;
  hospitalName: string;
  cnpj: string;
  contractTier: 'Gold 24/7' | 'Platinum Surgical SLA' | 'Standard Care';
  activeEquipmentsCount: number;
  preventiveMaintenanceCount: number;
  emergencySlaHours: number;
  contactPerson: string;
  phone: string;
}

export interface SacProhFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
}
