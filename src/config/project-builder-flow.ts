import type { ProjectType, ProjectCapability, ProjectTimeline, BusinessState } from "@/domain/project-request";

/**
 * Project Builder Conversion Simplification (Project Builder v2) —
 * this file is the single place that decides which of the *existing*,
 * unchanged canonical IDs (see src/domain/project-request.ts) are
 * surfaced in the short primary flow vs. reserved for the optional
 * progressive-qualification step or AI Consultant handoff. It never
 * introduces a new ID — only curates which already-valid ones a given
 * UI surface offers, so historical data and every downstream consumer
 * (CRM, structured brief, AI qualification mapper) keep working
 * unchanged. Pure, dependency-free — safe to unit test directly.
 */

/**
 * The 6 broad categories shown as Step 1's cards. `ai-agent`,
 * `voice-ai`, and `automation` (previously 3 separate primary options)
 * are consolidated into one "IA & Automatisation" card that stores the
 * existing `automation` id — the most general of the three — rather
 * than inventing a new one. `internal-system` is dropped from the
 * primary grid entirely. Both remain valid, selectable `ProjectType`
 * values everywhere else (historical data, AI Consultant handoff,
 * admin filters) — this list only curates Step 1's grid.
 */
export const PRIMARY_PROJECT_TYPE_IDS: readonly ProjectType[] = [
  "website",
  "ecommerce",
  "mobile-app",
  "saas-platform",
  "automation",
  "not-sure",
];

/**
 * The 4 timeline options shown in Step 3. `within-1-month` and
 * `6-plus-months` are dropped from the primary grid (redundant next to
 * `asap`/`1-3-months` and `3-6-months`/`flexible` respectively) but
 * remain valid `ProjectTimeline` values for historical rows and the AI
 * Consultant handoff.
 */
export const PRIMARY_TIMELINE_IDS: readonly ProjectTimeline[] = ["asap", "1-3-months", "3-6-months", "flexible"];

/**
 * The 2 business-state options shown as a compact selector in Step 2.
 * The other two historical values (`existing-product-to-improve`,
 * `existing-process-to-automate`) are finer-grained refinements of
 * "I already have something" that the primary flow no longer asks for
 * up front — they stay valid and reachable via the AI Consultant's
 * qualification, which can still set them directly.
 */
export const PRIMARY_BUSINESS_STATE_IDS: readonly BusinessState[] = ["new-idea", "existing-business"];

/**
 * Adaptive capability suggestions for the optional post-submission
 * qualification step (spec §3) — a plain lookup table, not a rules
 * engine. A project type absent from this map (or `not-sure`) falls
 * back to the full `PROJECT_CAPABILITIES` list in the caller.
 */
export const CAPABILITIES_BY_TYPE: Partial<Record<ProjectType, readonly ProjectCapability[]>> = {
  website: ["seo", "multilingual", "analytics", "notifications", "authentication", "other"],
  ecommerce: ["payments", "inventory", "delivery-integration", "multilingual", "notifications", "analytics", "other"],
  "mobile-app": ["authentication", "notifications", "maps-location", "ai-features", "api-integration", "other"],
  "saas-platform": ["authentication", "admin-dashboard", "payments", "api-integration", "analytics", "crm", "other"],
  automation: ["api-integration", "ai-features", "crm", "notifications", "other"],
};

/**
 * Whether the optional qualification step should ask which platforms
 * (iOS/Android/etc.) the client wants — only meaningful for project
 * types where "platform" isn't already implied by the category itself.
 */
export function shouldAskPlatforms(projectType?: ProjectType): boolean {
  return projectType === "mobile-app" || projectType === "saas-platform" || projectType === "not-sure";
}
