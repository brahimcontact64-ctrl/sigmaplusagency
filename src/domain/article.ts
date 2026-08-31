import type { Locale } from "@/i18n/routing";
import type { ServiceId } from "./service";
import type { ProjectId } from "./case-study";

/**
 * The production Insights/CMS content model (Phase 8) — supersedes the
 * Phase 7 placeholder in `blog-post.ts` (types only, never wired to
 * anything real). This is DB-backed (see `src/lib/db/schema.ts`
 * `articles`/`article_translations`), not static TypeScript content
 * like services/case-studies — editorial content changes far more
 * often than either of those and genuinely benefits from an admin
 * editing workflow instead of a code deploy per change.
 */
export const ARTICLE_TYPES = ["ARTICLE", "GUIDE", "CASE_STUDY_EDITORIAL"] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const CONTENT_STATUSES = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export function isPublicStatus(status: ContentStatus): boolean {
  return status === "PUBLISHED";
}

export const ARTICLE_CATEGORIES = ["web", "mobile", "ai", "automation", "ecommerce", "seo", "business-technology", "case-studies"] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

/**
 * The stable, locale-independent identity a set of translations
 * belongs to — mirrors the services/case-studies pattern (a canonical
 * ID + per-locale content), except DB-backed and mutable via the admin
 * editor rather than fixed in a TypeScript file. Fields here are the
 * ones that are genuinely locale-independent facts; everything
 * editorial (title, body, SEO copy, publication state) lives on
 * `ArticleTranslation` instead — this is what makes "French exists,
 * Arabic doesn't yet" possible without contradiction.
 */
export type Article = {
  id: string;
  type: ArticleType;
  category: ArticleCategory;
  tags: string[];
  /** Editorial metadata/filtering only (Phase 8 §20) — no tag archive pages exist. */
  author: string;
  featured: boolean;
  relatedServices: ServiceId[];
  relatedCaseStudies: ProjectId[];
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleTranslation = {
  id: string;
  articleId: string;
  locale: Locale;
  status: ContentStatus;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  /** Email of the admin who last saved this translation — the minimum "editor" record from Phase 8 §54's revision-safety requirement; not a full body version history (documented as future work in docs/SEO_STRATEGY.md). */
  editorEmail?: string;
  publishedAt?: Date;
  updatedAt: Date;
};

export type ArticleWithTranslation = Article & { translation: ArticleTranslation };

/** effectiveTitle/effectiveDescription: seoTitle/seoDescription override the editorial title/description for <title>/meta description specifically — never silently required to match. */
export function effectiveSeoTitle(translation: Pick<ArticleTranslation, "title" | "seoTitle">): string {
  return translation.seoTitle?.trim() || translation.title;
}
export function effectiveSeoDescription(translation: Pick<ArticleTranslation, "description" | "seoDescription">): string {
  return translation.seoDescription?.trim() || translation.description;
}
