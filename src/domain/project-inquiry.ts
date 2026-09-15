import { z } from "zod";
import { locales } from "@/i18n/routing";
import { HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";
import { BUDGET_RANGE_IDS } from "@/config/budget-ranges";
import { PROJECT_TIMELINES, type ProjectType } from "@/domain/project-request";
import { SUPPORTED_CURRENCIES } from "@/lib/money";

/**
 * The real MagicFlux AI Lead Qualification inquiry form — a distinct,
 * additive lead-acquisition surface alongside the existing Contact
 * form and Project Builder (never a replacement for either). Stable
 * canonical IDs only, same discipline as `project-request.ts`: these —
 * never a translated label — are what gets stored and sent to
 * MagicFlux, so the same submission means the same thing regardless of
 * the visitor's locale.
 */

export const INQUIRY_SERVICES = ["business-website", "ecommerce", "mobile-app", "web-app", "ai-automation", "other"] as const;
export type InquiryService = (typeof INQUIRY_SERVICES)[number];

/**
 * Distinct from `desiredStart` (reuses `ProjectTimeline` — "when do you
 * want this to begin") — urgency captures how time-pressured the
 * visitor's need is, a separate qualification signal MagicFlux's
 * classifier can weigh independently (e.g. "urgent" + "6-plus-months"
 * timeline is itself a meaningful, slightly contradictory signal worth
 * surfacing rather than collapsing into one field).
 */
export const URGENCY_LEVELS = ["urgent", "soon", "flexible"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

/**
 * Expressed naturally to the customer (never "hot/warm/cold" — that
 * classification belongs exclusively to MagicFlux, see §4/§6 of the
 * brief). This is a factual self-report of readiness, nothing more.
 */
export const PURCHASE_INTENT_LEVELS = ["exploring", "comparing", "ready-to-discuss", "ready-to-start"] as const;
export type PurchaseIntentLevel = (typeof PURCHASE_INTENT_LEVELS)[number];

const attributionSchema = z.object({
  landingPage: z.string().trim().max(500).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  utmSource: z.string().trim().max(120).optional().or(z.literal("")),
  utmMedium: z.string().trim().max(120).optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(120).optional().or(z.literal("")),
  utmContent: z.string().trim().max(120).optional().or(z.literal("")),
  utmTerm: z.string().trim().max(120).optional().or(z.literal("")),
});

export const projectInquirySchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(120),
    email: z.string().trim().email("Invalid email"),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    company: z.string().trim().max(120).optional().or(z.literal("")),
    service: z.enum(INQUIRY_SERVICES),
    projectDescription: z.string().trim().min(10, "Please add a bit more detail").max(2000),
    budgetRange: z.enum(BUDGET_RANGE_IDS as [string, ...string[]]),
    budgetCurrency: z.enum(SUPPORTED_CURRENCIES),
    desiredStart: z.enum(PROJECT_TIMELINES),
    urgency: z.enum(URGENCY_LEVELS),
    purchaseIntent: z.enum(PURCHASE_INTENT_LEVELS),
    locale: z.enum(locales),
    [HONEYPOT_FIELD_NAME]: z.string().max(200).optional().or(z.literal("")),
    /** Client-generated, per-page-load random token — the idempotency key for both Sigma Plus's own duplicate-submit guard and MagicFlux's `Idempotency-Key` header. Never a secret, never persisted beyond a short TTL. */
    submissionNonce: z.string().trim().min(8).max(100),
  })
  .merge(attributionSchema)
  .strict();

export type ProjectInquiryInput = z.infer<typeof projectInquirySchema>;

export type ProjectInquiryResult =
  | { success: true; reference: string; whatsappUrl: string }
  | { success: false; error: "validation_error" | "rate_limited" | "db_unavailable" | "maintenance" | "unexpected" };

/**
 * §2 of the brief — the canonical, stable payload MagicFlux's webhook
 * trigger receives. Field names/semantics here are the source of truth
 * requested by the brief itself (no separate MagicFlux-side lead
 * schema exists to conform to — verified: MagicFlux's webhook trigger
 * accepts arbitrary JSON as trigger input, see
 * lib/runtime/webhook-security.ts / app/api/workflows/[id]/webhook in
 * the MagicFlux codebase). A few fields beyond the required minimum
 * are included (budget_min/max/currency, reference, submitted_at) —
 * additive context for the AI classifier, never a rename or removal of
 * a required field.
 */
export type MagicFluxLeadPayload = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: InquiryService;
  project_description: string;
  budget: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency: string;
  urgency: UrgencyLevel;
  purchase_intent: PurchaseIntentLevel;
  desired_start: string;
  source: "sigma_plus_agency";
  locale: string;
  reference: string;
  submitted_at: string;
};

/**
 * Pure, dependency-free normalization — never calls the network itself
 * (see lib/integrations/magicflux.ts for the actual send). Absent
 * optional fields become an empty string, never `null`/omitted: a
 * no-code AI workflow reading `{{trigger.phone}}` should always find a
 * string, not risk an undefined-key error.
 */
export function buildMagicFluxPayload(input: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: InquiryService;
  projectDescription: string;
  budgetRangeId: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency: string;
  urgency: UrgencyLevel;
  purchaseIntent: PurchaseIntentLevel;
  desiredStart: string;
  locale: string;
  reference: string;
  submittedAt: string;
}): MagicFluxLeadPayload {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone ?? "",
    company: input.company ?? "",
    service: input.service,
    project_description: input.projectDescription,
    budget: input.budgetRangeId,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    budget_currency: input.budgetCurrency,
    urgency: input.urgency,
    purchase_intent: input.purchaseIntent,
    desired_start: input.desiredStart,
    source: "sigma_plus_agency",
    locale: input.locale,
    reference: input.reference,
    submitted_at: input.submittedAt,
  };
}

/**
 * Maps this form's small, MagicFlux-facing service taxonomy onto the
 * existing, more granular `ProjectType` used by the CRM/Project
 * Builder — so this inquiry's own record in `/admin/leads` categorizes
 * consistently with every other lead, without inventing a parallel
 * taxonomy at the persistence layer. "web-app" (a general custom web
 * application, not necessarily multi-tenant SaaS) maps to the closest
 * existing bucket, `saas-platform`; "other" maps to `not-sure` (never
 * guessed further).
 */
const SERVICE_TO_PROJECT_TYPE = {
  "business-website": "website",
  ecommerce: "ecommerce",
  "mobile-app": "mobile-app",
  "web-app": "saas-platform",
  "ai-automation": "automation",
  other: "not-sure",
} satisfies Record<InquiryService, ProjectType>;

export function mapInquiryServiceToProjectType(service: InquiryService): ProjectType {
  return SERVICE_TO_PROJECT_TYPE[service];
}
