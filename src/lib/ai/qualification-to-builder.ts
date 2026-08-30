import type { QualificationState } from "@/domain/ai-qualification";
import {
  PROJECT_TYPES,
  PROJECT_GOALS,
  PROJECT_CAPABILITIES,
  PROJECT_PLATFORMS,
  BUSINESS_STATES,
  PROJECT_TIMELINES,
} from "@/domain/project-request";
import { BUDGET_RANGE_IDS } from "@/config/budget-ranges";

/**
 * Shape matches BuilderFormData's optional fields (see
 * components/project-builder/types.ts) — kept as a separate type
 * rather than importing that one directly to avoid a client-component
 * file depending on this lib module's import graph unnecessarily.
 */
export type ProjectBuilderPrefill = {
  projectType?: string;
  goals?: string[];
  capabilities?: string[];
  platforms?: string[];
  businessState?: string;
  currentWebsite?: string;
  timeline?: string;
  budgetRange?: string;
  company?: string;
  country?: string;
};

/**
 * Defense in depth: even though the extraction schema already
 * validates against these same canonical enums before it's ever
 * stored, re-validate here too right before it becomes visible
 * Project Builder state — this is the last line before user-facing UI,
 * and qualificationState could in principle have come from
 * sessionStorage (see the AI panel's handoff), which a browser
 * extension or the user's own devtools could tamper with.
 */
export function mapQualificationToBuilderPrefill(state: QualificationState): ProjectBuilderPrefill {
  const prefill: ProjectBuilderPrefill = {};

  if (state.projectType && (PROJECT_TYPES as readonly string[]).includes(state.projectType.value)) {
    prefill.projectType = state.projectType.value;
  }
  if (state.goals) {
    const valid = state.goals.value.filter((g) => (PROJECT_GOALS as readonly string[]).includes(g));
    if (valid.length > 0) prefill.goals = valid;
  }
  if (state.capabilities) {
    const valid = state.capabilities.value.filter((c) => (PROJECT_CAPABILITIES as readonly string[]).includes(c));
    if (valid.length > 0) prefill.capabilities = valid;
  }
  if (state.platforms) {
    const valid = state.platforms.value.filter((p) => (PROJECT_PLATFORMS as readonly string[]).includes(p));
    if (valid.length > 0) prefill.platforms = valid;
  }
  if (state.businessState && (BUSINESS_STATES as readonly string[]).includes(state.businessState.value)) {
    prefill.businessState = state.businessState.value;
  }
  if (state.existingWebsite) prefill.currentWebsite = state.existingWebsite.value.slice(0, 300);
  if (state.timeline && (PROJECT_TIMELINES as readonly string[]).includes(state.timeline.value)) {
    prefill.timeline = state.timeline.value;
  }
  if (state.budgetRange && BUDGET_RANGE_IDS.includes(state.budgetRange.value)) {
    prefill.budgetRange = state.budgetRange.value;
  }
  if (state.businessName) prefill.company = state.businessName.value.slice(0, 120);
  if (state.country) prefill.country = state.country.value.slice(0, 100);

  return prefill;
}
