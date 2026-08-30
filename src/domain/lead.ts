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

export const LEAD_SOURCES = ["contact_form", "project_builder"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const PREFERRED_CONTACT_METHODS = ["whatsapp", "phone", "email"] as const;
export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];

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
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

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
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  language: string;
  preferredContactMethod?: PreferredContactMethod;
  source: LeadSource;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
} & Attribution;
