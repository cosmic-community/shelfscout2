// Base Cosmic object interface
export interface CosmicObject {
  id: string
  slug: string
  title: string
  content?: string
  metadata: Record<string, any>
  type: string
  created_at: string
  modified_at: string
}

// Settings singleton
export interface Settings extends CosmicObject {
  type: 'settings'
  metadata: {
    site_name: string
    amazon_tag: string
    hero_title: string
    hero_subtitle: string
    sample_titles: string[]
    legal_privacy?: string
    about_body?: string
  }
}

// Upload status type
export type UploadStatus = 'pending' | 'analyzed' | 'failed'

// Upload object with proper source_image structure
export interface Upload extends CosmicObject {
  type: 'uploads'
  metadata: {
    status: UploadStatus
    source_image?: {
      id: string
      name: string
      url: string
      imgix_url: string
    }
    parsed_titles?: ParsedTitle[]
    owned_books?: OwnedBook[]
    notes?: string
    ip_hash?: string
  }
}

// Parsed title from OCR
export interface ParsedTitle {
  title_candidate: string
  author_candidate?: string
  confidence: number
}

// Normalized book metadata
export interface OwnedBook {
  title: string
  author?: string
  isbn13?: string
  subjects?: string[]
  year?: number
}

// Book recommendation pick
export interface BookPick {
  title: string
  author: string
  reason: string
  isbn13?: string
  genres?: string[]
  amazon_url: string
  alt?: {
    title: string
    author: string
    reason: string
    amazon_url: string
  }
}

// Recommendation object
export interface Recommendation extends CosmicObject {
  type: 'recommendations'
  metadata: {
    upload?: Upload
    picks: BookPick[]
  }
}

// Click tracking object
export interface Click extends CosmicObject {
  type: 'clicks'
  metadata: {
    rec_id?: Recommendation
    slot_index: number
    url: string
    user_agent?: string
    ts: string
  }
}

// API response types
export interface UploadResponse {
  uploadId: string
}

export interface AnalyzeResponse {
  recommendationId: string
}

export interface AlternateResponse {
  alt: {
    title: string
    author: string
    reason: string
    amazon_url: string
  }
}

export interface ClickResponse {
  ok: boolean
}

// Error helper for Cosmic SDK
export function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error
}