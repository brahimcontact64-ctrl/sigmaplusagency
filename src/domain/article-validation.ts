import { z } from "zod";
import { locales } from "@/i18n/routing";
import { ARTICLE_TYPES, ARTICLE_CATEGORIES } from "./article";
import { SERVICE_IDS } from "./service";
import { PROJECT_IDS } from "./case-study";

/** Loose validation for saving a DRAFT — only structural sanity, no length minimums (an admin must be able to save partial work). */
export const articleCreateSchema = z
  .object({
    type: z.enum(ARTICLE_TYPES),
    category: z.enum(ARTICLE_CATEGORIES),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    author: z.string().trim().min(1).max(120),
    featured: z.boolean().default(false),
    relatedServices: z.array(z.enum(SERVICE_IDS)).max(10).default([]),
    relatedCaseStudies: z.array(z.enum(PROJECT_IDS)).max(10).default([]),
  })
  .strict();

export const translationDraftSchema = z
  .object({
    locale: z.enum(locales),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9؀-ۿ-]+$/u, "Slug must be lowercase letters/numbers/hyphens (Arabic script allowed, matching the existing services/case-studies slug convention)."),
    title: z.string().trim().max(200),
    description: z.string().trim().max(400),
    excerpt: z.string().trim().max(400),
    content: z.string().max(50_000),
    seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
    seoDescription: z.string().trim().max(170).optional().or(z.literal("")),
    ogImage: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .strict();

/**
 * Stricter gate applied only at the moment of publishing (Phase 8
 * §14) — a DRAFT is allowed to be incomplete, a PUBLISHED page is not.
 * Deliberately no arbitrary SEO character-count hard-block (the brief
 * is explicit warnings are fine there) — this only blocks the genuine
 * blockers: empty title/description/body/slug.
 */
export function validateForPublish(translation: { title: string; description: string; content: string; slug: string }): string[] {
  const problems: string[] = [];
  if (!translation.title.trim()) problems.push("Title is required to publish.");
  if (!translation.description.trim()) problems.push("Description is required to publish.");
  if (!translation.content.trim()) problems.push("Body content is required to publish.");
  if (!translation.slug.trim()) problems.push("Slug is required to publish.");
  return problems;
}
