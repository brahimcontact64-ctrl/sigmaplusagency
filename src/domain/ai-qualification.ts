import type {
  ProjectType,
  ProjectGoal,
  ProjectCapability,
  ProjectPlatform,
  BusinessState,
  ProjectTimeline,
} from "@/domain/project-request";
import type { PreferredContactMethod } from "@/domain/lead";
import type { ServiceId } from "@/domain/service";

/**
 * Critical rule (master plan Phase 6): AI-extracted information is not
 * equivalent to user-confirmed information. Everything the extraction
 * pass writes is INFERRED; only an explicit user action in the UI
 * (confirming/editing the qualification summary) promotes a field to
 * USER_CONFIRMED. Only USER_CONFIRMED fields are meant to be trusted as
 * canonical project-request values — see confirmAllInferred() below and
 * the composer in qualification-to-builder.ts.
 */
export const CONFIDENCE_LEVELS = ["INFERRED", "USER_CONFIRMED"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export type QualificationField<T> = {
  value: T;
  confidence: Confidence;
  /** The ai_messages.id whose extraction produced this value — omitted for a user-entered correction. */
  sourceMessageId?: string;
};

export const QUALIFICATION_FIELD_KEYS = [
  "projectType",
  "goals",
  "capabilities",
  "platforms",
  "businessState",
  "businessName",
  "existingWebsite",
  "existingTools",
  "timeline",
  "budgetRange",
  "country",
  "preferredContactMethod",
] as const;
export type QualificationFieldKey = (typeof QUALIFICATION_FIELD_KEYS)[number];

export type QualificationFieldValues = {
  projectType: ProjectType;
  goals: ProjectGoal[];
  capabilities: ProjectCapability[];
  platforms: ProjectPlatform[];
  businessState: BusinessState;
  businessName: string;
  existingWebsite: string;
  existingTools: string[];
  timeline: ProjectTimeline;
  budgetRange: string;
  country: string;
  preferredContactMethod: PreferredContactMethod;
};

export type QualificationState = {
  [K in QualificationFieldKey]?: QualificationField<QualificationFieldValues[K]>;
} & {
  /** AI-suggested clarifying questions still open — not shown to the client as facts. */
  openQuestions: string[];
  /** Canonical ServiceId values only — see extraction schema, which rejects anything else. */
  recommendedServices: ServiceId[];
  /** Short AI-generated internal summary, always labeled as such wherever it's shown — never presented as verified client wording. */
  summary?: string;
};

export const EMPTY_QUALIFICATION_STATE: QualificationState = {
  openQuestions: [],
  recommendedServices: [],
};

/** True once there's enough to usefully prefill the Project Builder or discuss a proposal — deliberately low-bar (project type OR goals), not a fixed 20-field checklist. */
export function hasMinimalQualification(state: QualificationState): boolean {
  return Boolean(state.projectType || (state.goals && state.goals.value.length > 0));
}

/** Only the fields an extraction pass may set — never openQuestions/recommendedServices/summary directly (those are merged separately, see mergeInferredQualification). */
export type ExtractedFieldValues = Partial<QualificationFieldValues>;

/**
 * Merges a fresh AI extraction pass into the existing state. A field
 * already USER_CONFIRMED is frozen against being silently overwritten
 * by a new inference — the client corrected it once, a later AI guess
 * doesn't get to relitigate that without the client doing so again
 * through the same confirm/edit UI. Every newly-written field is
 * INFERRED, never anything else, regardless of how confident the model
 * sounded in its own output.
 */
export function mergeInferredQualification(
  existing: QualificationState,
  extracted: ExtractedFieldValues,
  sourceMessageId: string,
  extras?: { openQuestions?: string[]; recommendedServices?: ServiceId[]; summary?: string },
): QualificationState {
  const next: QualificationState = { ...existing };

  for (const key of QUALIFICATION_FIELD_KEYS) {
    const incomingValue = extracted[key];
    if (incomingValue === undefined) continue;
    if (existing[key]?.confidence === "USER_CONFIRMED") continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic keyed field; incomingValue's type matches QualificationFieldValues[key] by construction of ExtractedFieldValues
    (next as any)[key] = { value: incomingValue, confidence: "INFERRED" as const, sourceMessageId };
  }

  if (extras?.openQuestions) next.openQuestions = extras.openQuestions;
  if (extras?.recommendedServices) next.recommendedServices = extras.recommendedServices;
  if (extras?.summary) next.summary = extras.summary;

  return next;
}

/** Promotes every currently-populated field to USER_CONFIRMED in one action — used when the client reviews the whole summary and confirms it's accurate. */
export function confirmAllInferred(state: QualificationState): QualificationState {
  const next: QualificationState = { ...state };
  for (const key of QUALIFICATION_FIELD_KEYS) {
    const field = state[key];
    if (field) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic keyed field, value type already validated when the field was set
      (next as any)[key] = { ...field, confidence: "USER_CONFIRMED" as const };
    }
  }
  return next;
}
