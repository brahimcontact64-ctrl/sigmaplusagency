import type { ServiceMeta } from "@/domain/service";

/**
 * Locale-independent facts. Technology names are never translated
 * (brand names stay as-is in every language, per project convention).
 */
export const servicesMeta: Record<string, ServiceMeta> = {
  "web-development": {
    id: "web-development",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js"],
    relatedServices: ["ui-ux-design", "seo-growth", "backend-api"],
  },
  "mobile-applications": {
    id: "mobile-applications",
    technologies: ["React Native", "Expo", "TypeScript", "iOS", "Android"],
    relatedServices: ["backend-api", "ui-ux-design", "cloud-infrastructure"],
  },
  ecommerce: {
    id: "ecommerce",
    technologies: ["Next.js", "Stripe", "PostgreSQL", "Node.js", "Tailwind CSS"],
    relatedServices: ["web-development", "seo-growth", "automation"],
  },
  "saas-platforms": {
    id: "saas-platforms",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Node.js"],
    relatedServices: ["backend-api", "cloud-infrastructure", "ai-agents"],
  },
  "ai-agents": {
    id: "ai-agents",
    technologies: ["Claude", "OpenAI", "TypeScript", "Node.js", "Vector Search"],
    relatedServices: ["automation", "voice-ai", "backend-api"],
  },
  "voice-ai": {
    id: "voice-ai",
    technologies: ["Speech-to-Text", "Text-to-Speech", "Claude", "Node.js"],
    relatedServices: ["ai-agents", "automation", "backend-api"],
  },
  automation: {
    id: "automation",
    technologies: ["Node.js", "TypeScript", "Zapier", "n8n", "REST APIs"],
    relatedServices: ["ai-agents", "backend-api", "saas-platforms"],
  },
  "ui-ux-design": {
    id: "ui-ux-design",
    technologies: ["Figma", "Design Systems", "Tailwind CSS"],
    relatedServices: ["web-development", "mobile-applications", "seo-growth"],
  },
  "seo-growth": {
    id: "seo-growth",
    technologies: ["Next.js", "Structured Data", "Google Search Console", "Core Web Vitals"],
    relatedServices: ["web-development", "ui-ux-design", "maintenance-support"],
  },
  "backend-api": {
    id: "backend-api",
    technologies: ["Node.js", "TypeScript", "PostgreSQL", "REST", "GraphQL"],
    relatedServices: ["cloud-infrastructure", "saas-platforms", "automation"],
  },
  "cloud-infrastructure": {
    id: "cloud-infrastructure",
    technologies: ["Vercel", "AWS", "Docker", "PostgreSQL", "CI/CD"],
    relatedServices: ["backend-api", "maintenance-support", "saas-platforms"],
  },
  "maintenance-support": {
    id: "maintenance-support",
    technologies: ["Monitoring", "Error Tracking", "CI/CD", "Automated Backups"],
    relatedServices: ["cloud-infrastructure", "backend-api", "seo-growth"],
  },
};
