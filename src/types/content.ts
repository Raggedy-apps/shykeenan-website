/**
 * Type definitions for content schemas
 * Shykeenan.uk Archive
 */

// ============================================
// BOOKS
// ============================================

export interface Book {
  id: string;
  title: string;
  year: number;
  publisher: string;
  isbn: string; // ISBN-10 or ISBN-13
  cover: string; // Path to cover image
  description: string;
  category: 'memoir' | 'poetry' | 'essays' | 'other';
  purchaseLinks?: PurchaseLink[];
  legacy_url?: string;
}

export interface PurchaseLink {
  vendor: 'amazon' | 'waterstones' | 'bookshop' | 'other';
  url: string;
  affiliateId?: string;
}

// ============================================
// MEMORIAL / TRIBUTES
// ============================================

export interface Tribute {
  id: string;
  name: string;
  dates?: {
    birth?: string; // ISO 8601 date
    death?: string; // ISO 8601 date
  };
  tribute: string; // Markdown content
  submittedBy?: string;
  submittedDate?: string; // ISO 8601 date
  photo?: string; // Path to photo
  approved: boolean;
  legacy_url?: string;
}

// ============================================
// TIMELINE
// ============================================

export type TimelineCategory =
  | 'birth'
  | 'childhood'
  | 'trauma'
  | 'advocacy'
  | 'publication'
  | 'award'
  | 'tragedy'
  | 'foundation'
  | 'campaign'
  | 'milestone';

export interface TimelineEvent {
  id: string;
  date: string; // ISO 8601 date
  title: string;
  category: TimelineCategory;
  description: string; // Markdown content
  media?: string[]; // Array of image paths
  tags?: string[];
  location?: string;
  relatedEvents?: string[]; // IDs of related events
  legacy_url?: string;
}

// ============================================
// POSTS / ARTICLES
// ============================================

export interface Post {
  id: string;
  title: string;
  slug: string;
  date: string; // ISO 8601 date
  author: string;
  description: string;
  content: string; // Markdown/MDX content
  featuredImage?: string;
  category?: string;
  tags?: string[];
  published: boolean;
  legacy_url?: string;
}

// ============================================
// SURVIVOR STORIES
// ============================================

export interface SurvivorStory {
  id: string;
  title: string;
  submittedDate: string; // ISO 8601 date
  content: string; // Markdown content
  anonymous: boolean;
  author?: string;
  contentWarnings?: string[];
  approved: boolean;
  legacy_url?: string;
}

// ============================================
// NAVIGATION
// ============================================

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  children?: NavigationItem[];
  badge?: string | number;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

// ============================================
// SITE METADATA
// ============================================

export interface SiteMetadata {
  title: string;
  description: string;
  siteUrl: string;
  author: string;
  social?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  analytics?: {
    googleAnalyticsId?: string;
    plausibleDomain?: string;
  };
}

// ============================================
// LEGACY REDIRECTS
// ============================================

export interface LegacyRedirect {
  from: string; // Old URL path
  to: string; // New URL path
  status: 301 | 302; // HTTP status code
  source?: 'wordpress' | 'wayback' | 'manual';
}

// ============================================
// CONTENT VALIDATION
// ============================================

export interface ContentValidation {
  filePath: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// ============================================
// MEDIA / ASSETS
// ============================================

export interface MediaAsset {
  id: string;
  filename: string;
  path: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number; // bytes
  alt?: string;
  credit?: string;
  uploadDate: string; // ISO 8601 date
  tags?: string[];
}

// ============================================
// FRONTMATTER (for MDX files)
// ============================================

export interface Frontmatter {
  title: string;
  date: string;
  description?: string;
  author?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  published?: boolean;
  legacy_url?: string;
  [key: string]: any; // Allow additional fields
}
