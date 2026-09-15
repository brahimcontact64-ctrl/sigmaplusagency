/**
 * Approved pipeline lifecycle (see master plan). Never exposed publicly —
 * every new submission starts at NEW regardless of source.
 */
export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
  "DEVELOPMENT",
  "REVIEW",
  "DELIVERED",
  "MAINTENANCE",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["contact_form", "project_builder", "magicflux_inquiry"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const PREFERRED_CONTACT_METHODS = ["whatsapp", "phone", "email"] as const;
export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];

/**
 * The ONLY shape allowed as metadata on an `identity_conflict_detected`
 * activity — deliberately excludes any field that could carry a raw
 * email or phone value. `hasPhoneConflict` is always `false` under the
 * current phone-first resolution (a phone match always wins outright,
 * so a "phone points elsewhere" conflict can't reach this code path)
 * but is kept for schema completeness/symmetry should that priority
 * ever change.
 */
export type IdentityConflictMetadata = {
  source: LeadSource;
  hasPhoneConflict: boolean;
  hasEmailConflict: boolean;
};

export const LEAD_ACTIVITY_TYPES = [
  "lead_created",
  "contact_form_submitted",
  "project_request_submitted",
  "whatsapp_handoff_clicked",
  "status_changed",
  "internal_note_added",
  "ai_consultation_started",
  "ai_qualification_completed",
  "ai_brief_confirmed",
  "ai_handoff_to_builder",
  "ai_lead_created",
  "deal_value_updated",
  "lost_reason_set",
  "internal_notification_sent",
  "client_confirmation_sent",
  /**
   * Email-optionality identity safety (follow-up to Project Builder
   * v2): recorded on the lead a submission actually resolved to
   * (phone always wins — see lead-service.ts's findOrCreateLead) when
   * a supplied identifier that did NOT win the match independently
   * belongs to a DIFFERENT existing lead. Never triggers a merge, a
   * field overwrite, or any cross-lead data exposure — purely a signal
   * for whoever reviews this lead later. `metadata` on this activity
   * type must only ever contain the safe fields listed on
   * IdentityConflictMetadata below — never a raw email or phone value.
   */
  "identity_conflict_detected",
  /**
   * MagicFlux AI Lead Qualification bridge — recorded only for a real
   * SENT or FAILED forward attempt (never for SKIPPED/not-configured,
   * matching the internal_notification_sent convention above). Purely
   * an internal traceability signal ("did this lead actually reach
   * MagicFlux") — never exposed to the customer, never used to
   * duplicate MagicFlux's own Hot/Warm/Cold classification or routing
   * inside Sigma Plus. `metadata` must only ever contain the safe
   * fields on MagicFluxForwardMetadata below — never the payload sent,
   * which contains the lead's own PII.
   */
  "magicflux_forwarded",
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

/** The ONLY shape allowed as metadata on a `magicflux_forwarded` activity. */
export type MagicFluxForwardMetadata = {
  outcome: "SENT" | "FAILED";
  executionId?: string;
  errorReason?: string;
};

/**
 * Optional, structured LOST reasons (Phase 9 §19) — never required
 * retroactively on existing LOST leads, and no reason is inferred.
 * `OTHER` always allows a free-text `lostNote` alongside it.
 */
export const LOST_REASONS = ["BUDGET", "TIMING", "NO_RESPONSE", "COMPETITOR", "SCOPE_MISMATCH", "INTERNAL_DECISION", "OTHER"] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export function isValidLostReason(value: unknown): value is LostReason {
  return typeof value === "string" && (LOST_REASONS as readonly string[]).includes(value);
}

/**
 * Status transition policy: every status currently allows moving to
 * every other status (except itself). No workflow restrictions exist
 * yet — this is intentional pending owner input on the real pipeline
 * rules (see master plan Phase 5), not an oversight. The only thing
 * enforced is that the target is one of the canonical statuses, so a
 * bad request body can never write an arbitrary string into the column.
 */
export function isValidLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

export type Attribution = {
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export type Lead = {
  id: string;
  publicReference: string;
  name: string;
  /** Optional since the Project Builder email-optionality change — phone/WhatsApp is the only contact detail every lead is guaranteed to have (Contact form and AI-proposal capture still require email at their own schema layer, so most rows still have one). Absent means genuinely not provided, never an empty string. */
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  language: string;
  preferredContactMethod?: PreferredContactMethod;
  source: LeadSource;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
  /** Manual CRM input only — never inferred from a Project Builder budget range (a range is not a contract value). See src/lib/money.ts for the integer-minor-units handling. */
  lostReason?: LostReason;
  lostNote?: string;
  dealValueMinorUnits?: number;
  dealCurrency?: string;
  wonAt?: Date;
} & Attribution;
