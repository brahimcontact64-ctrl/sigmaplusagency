import type { ServiceId } from "./service";

export const PROJECT_IDS = ["saheat", "e-vizza", "eleman-shoes", "dzenix"] as const;
export type ProjectId = (typeof PROJECT_IDS)[number];

/**
 * How trustworthy a piece of case-study content is. Every section that
 * could be mistaken for a verified claim carries one of these so the
 * UI can render it (or omit it) accordingly — see CONTENT_STATUS below
 * for what each value permits on a public page.
 */
export const CONTENT_STATUS = ["VERIFIED", "PARTIAL", "NEEDS_OWNER_INPUT", "DRAFT"] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

export type ProjectMedia = {
  /** Decorative/illustrative only — never a claimed real screenshot unless explicitly marked isRealScreenshot. */
  kind: "device-mockup" | "diagram" | "logo";
  isRealScreenshot: boolean;
};

/**
 * Narrative fields are optional on purpose: Phase 3 ships with only
 * what the audit could verify. A missing field must be omitted from
 * the rendered page, never replaced with "Coming soon" placeholder text.
 */
export type CaseStudyNarrative = {
  challenge?: string;
  strategy?: string;
  implementation?: string;
  qualitativeOutcome?: string;
};

export type CaseStudyContent = {
  slug: string;
  name: string;
  /** Short punchy category label for cards, e.g. "Marketplace", "E-commerce". */
  tag: string;
  tagline: string;
  summary: string;
  whatItIs: string;
  coreFunctionality: string[];
  narrative: CaseStudyNarrative;
};

export type CaseStudyMeta = {
  id: ProjectId;
  /**
   * "delivered" deliberately does not claim the product is still live
   * and operating today — only that SIGMA+ built and shipped it. Current
   * operating status of a client's own business is not something we can
   * verify from here without asking them.
   */
  status: "delivered" | "in-development" | "unavailable";
  featured: boolean;
  /** Omitted, not guessed, when the delivery year isn't verified. */
  year?: number;
  clientVisibility: "named" | "unnamed";
  industry: string;
  services: ServiceId[];
  technologies: string[];
  platforms: string[];
  liveUrl?: string;
  repositoryUrl?: string;
  media: ProjectMedia[];
  contentStatus: ContentStatus;
};

export type LocalizedCaseStudyContentMap = Record<ProjectId, CaseStudyContent>;
