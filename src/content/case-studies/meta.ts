import type { CaseStudyMeta } from "@/domain/case-study";

/**
 * Locale-independent, verifiable facts only. Every field here traces back
 * to what Phase 0's audit actually confirmed (the live brahim-dev.vercel.app
 * listing) — nothing here is inferred beyond directly categorizing what
 * the product demonstrably is. No live/repo URLs, no dates, no tech-stack
 * specifics are included because none were verified; see
 * docs/CASE_STUDY_OWNER_INPUT.md for exactly what's still needed from the
 * owner to fill these in and unlock a richer narrative on each page.
 */
export const caseStudiesMeta: Record<string, CaseStudyMeta> = {
  saheat: {
    id: "saheat",
    status: "delivered",
    featured: true,
    clientVisibility: "named",
    industry: "Food delivery",
    services: ["mobile-applications", "web-development", "backend-api"],
    technologies: [],
    platforms: ["Web", "iOS", "Android"],
    media: [{ kind: "device-mockup", isRealScreenshot: false }],
    contentStatus: "PARTIAL",
  },
  "e-vizza": {
    id: "e-vizza",
    status: "delivered",
    featured: true,
    clientVisibility: "named",
    industry: "Travel & visa services",
    services: ["saas-platforms", "ai-agents"],
    technologies: [],
    platforms: ["Web"],
    media: [{ kind: "device-mockup", isRealScreenshot: false }],
    contentStatus: "PARTIAL",
  },
  "eleman-shoes": {
    id: "eleman-shoes",
    status: "delivered",
    featured: true,
    clientVisibility: "named",
    industry: "Retail & e-commerce",
    services: ["ecommerce"],
    technologies: [],
    platforms: ["Web"],
    media: [{ kind: "device-mockup", isRealScreenshot: false }],
    contentStatus: "PARTIAL",
  },
  dzenix: {
    id: "dzenix",
    status: "delivered",
    featured: true,
    clientVisibility: "named",
    industry: "Digital agency",
    services: ["web-development", "ui-ux-design"],
    technologies: [],
    platforms: ["Web"],
    media: [{ kind: "device-mockup", isRealScreenshot: false }],
    contentStatus: "PARTIAL",
  },
};
