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
}

export type SiteConfig = SiteSettings;
