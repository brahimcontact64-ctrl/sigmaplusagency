import type { Locale } from "@/i18n/routing";

export const SERVICE_IDS = [
  "web-development",
  "mobile-applications",
  "ecommerce",
  "saas-platforms",
  "ai-agents",
  "voice-ai",
  "automation",
  "ui-ux-design",
  "seo-growth",
  "backend-api",
  "cloud-infrastructure",
  "maintenance-support",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export const SERVICE_CATEGORY_IDS = ["build", "intelligence", "experience", "infrastructure"] as const;
export type ServiceCategoryId = (typeof SERVICE_CATEGORY_IDS)[number];

export const SERVICE_CATEGORY_MAP: Record<ServiceId, ServiceCategoryId> = {
  "web-development": "build",
  "mobile-applications": "build",
  ecommerce: "build",
  "saas-platforms": "build",
  "ai-agents": "intelligence",
  "voice-ai": "intelligence",
  automation: "intelligence",
  "ui-ux-design": "experience",
  "seo-growth": "experience",
  "backend-api": "infrastructure",
  "cloud-infrastructure": "infrastructure",
  "maintenance-support": "infrastructure",
};

export type ServiceFaqItem = {
  question: string;
  answer: string;
};

/** Per-locale editorial content for a service. Stable `ServiceId` never changes; slugs and prose do, per locale. */
export type ServiceContent = {
  slug: string;
  title: string;
  positioning: string;
  description: string;
  problems: string[];
  deliverables: string[];
  capabilities: string[];
  industries: string[];
  faq: ServiceFaqItem[];
};

/** Locale-independent facts about a service: technology names (never translated) and cross-links. */
export type ServiceMeta = {
  id: ServiceId;
  technologies: string[];
  relatedServices: ServiceId[];
};

export type LocalizedServiceContentMap = Record<ServiceId, ServiceContent>;

export function getServiceCategory(id: ServiceId): ServiceCategoryId {
  return SERVICE_CATEGORY_MAP[id];
}

export type ServiceRouteParams = {
  locale: Locale;
  slug: string;
};
