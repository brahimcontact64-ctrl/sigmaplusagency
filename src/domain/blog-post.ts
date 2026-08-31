import type { Locale } from "@/i18n/routing";
import type { ServiceId } from "./service";
import type { ProjectId } from "./case-study";

/**
 * Content architecture for the future blog (Phase 8+) — types only,
 * no content, no route, no sitemap entries. Preparing the shape now
 * means Phase 8 doesn't have to design this under time pressure, but
 * nothing here is wired up or populated: the brief is explicit that
 * Phase 7 must not "populate dozens of AI-generated articles."
 */
export const BLOG_CATEGORIES = ["web", "mobile", "ai", "automation", "ecommerce", "seo", "business-technology", "case-studies"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const CONTENT_STATUSES = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type BlogPost = {
  /** Stable identity independent of locale/slug — mirrors ServiceId/ProjectId's pattern. */
  id: string;
  category: BlogCategory;
  status: ContentStatus;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  publishedAt?: string;
  updatedAt?: string;
  /** Rarely needed — only when a post's canonical intentionally differs from its own URL (e.g. syndicated content). */
  canonicalOverride?: string;
  ogImage?: string;
  relatedServices: ServiceId[];
  relatedCaseStudies: ProjectId[];
};

/** Only PUBLISHED posts may ever appear in the sitemap or be indexable — see src/app/sitemap.ts's own comment on this. */
export function isPublished(post: Pick<BlogPost, "status">): boolean {
  return post.status === "PUBLISHED";
}
