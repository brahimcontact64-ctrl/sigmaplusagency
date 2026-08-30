/**
 * Stable canonical IDs for the Project Builder. These — never translated
 * labels — are what gets stored, validated, and matched against. UI
 * copy for each ID lives in messages/*.json under `projectBuilder`.
 */
export const PROJECT_TYPES = [
  "website",
  "ecommerce",
  "mobile-app",
  "saas-platform",
  "ai-agent",
  "voice-ai",
  "automation",
  "internal-system",
  "not-sure",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_GOALS = [
  "generate-leads",
  "sell-products",
  "take-bookings",
  "receive-orders",
  "automate-operations",
  "launch-mvp",
  "improve-existing-product",
  "build-internal-software",
  "reduce-manual-work",
  "improve-customer-support",
  "other",
] as const;
export type ProjectGoal = (typeof PROJECT_GOALS)[number];

export const PROJECT_CAPABILITIES = [
  "admin-dashboard",
  "payments",
  "whatsapp-integration",
  "ai-features",
  "authentication",
  "multilingual",
  "booking",
  "maps-location",
  "notifications",
  "mobile-apps",
  "analytics",
  "seo",
  "api-integration",
  "crm",
  "inventory",
  "delivery-integration",
  "other",
] as const;
export type ProjectCapability = (typeof PROJECT_CAPABILITIES)[number];

export const PROJECT_PLATFORMS = [
  "web",
  "ios",
  "android",
  "tablet",
  "desktop",
  "multiple",
  "not-sure",
] as const;
export type ProjectPlatform = (typeof PROJECT_PLATFORMS)[number];

export const BUSINESS_STATES = [
  "new-idea",
  "existing-business",
  "existing-product-to-improve",
  "existing-process-to-automate",
] as const;
export type BusinessState = (typeof BUSINESS_STATES)[number];

export const PROJECT_TIMELINES = [
  "asap",
  "within-1-month",
  "1-3-months",
  "3-6-months",
  "6-plus-months",
  "flexible",
] as const;
export type ProjectTimeline = (typeof PROJECT_TIMELINES)[number];

/**
 * Ranges are configuration, not hardcoded UI — see
 * src/config/budget-ranges.ts. This is just the stable ID shape stored
 * with the request so ranges can be changed later without a migration.
 */
export type BudgetRangeId = string;

export type StructuredBrief = {
  projectType: string;
  primaryGoals: string[];
  requestedCapabilities: string[];
  platforms: string[];
  timeline: string;
  investmentRange: string;
  businessContext: string;
  openQuestions: string[];
};

export type ProjectRequest = {
  id: string;
  leadId: string;
  projectType: ProjectType;
  goals: ProjectGoal[];
  capabilities: ProjectCapability[];
  platforms: ProjectPlatform[];
  businessState: BusinessState;
  currentWebsite?: string;
  timeline: ProjectTimeline;
  budgetRange: BudgetRangeId;
  message?: string;
  structuredBrief: StructuredBrief;
  locale: string;
  createdAt: Date;
};
