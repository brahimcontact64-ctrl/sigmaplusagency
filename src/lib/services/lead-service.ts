import type { Locale } from "@/i18n/routing";
import { getLeadRepository, type LeadRepository } from "@/lib/repositories/lead-repository";
import { generatePublicReference } from "./reference";
import { normalizeEmail, normalizePhone } from "./identity";
import { buildStructuredBrief, type BriefInput } from "./structured-brief";
import { getBudgetRange, getBudgetAmounts } from "@/config/budget-ranges";
import { sanitizeUtmValue, sanitizeUrlValue } from "@/lib/attribution/sanitize-utm";
import { sendInternalLeadNotification, sendClientConfirmationEmail } from "@/lib/notifications/lead-notification-service";
import { forwardLeadToMagicFlux } from "@/lib/integrations/magicflux";
import { buildMagicFluxPayload, mapInquiryServiceToProjectType, type InquiryService, type UrgencyLevel, type PurchaseIntentLevel } from "@/domain/project-inquiry";
import type { Attribution, Lead, LeadSource, PreferredContactMethod, IdentityConflictMetadata, MagicFluxForwardMetadata } from "@/domain/lead";
import type { ProjectRequest, StructuredBrief, ProjectTimeline } from "@/domain/project-request";
import type { CurrencyCode } from "@/lib/money";

export type SubmitContactInput = {
  name: string;
  // Still required by contactFormSchema at the Zod layer (a different
  // acquisition surface than the Project Builder — the audit for the
  // email-optionality change found no reason to loosen this one too),
  // typed `string` here for that reason; findOrCreateLead below accepts
  // the wider `email?: string` so both callers share one identity path.
  email: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  message?: string;
  locale: Locale;
  /** First-party analytics session id, if the visitor's browser supplied one — bridges prior anonymous events to this lead (Phase 9 §8). Never required. */
  analyticsSessionId?: string;
} & Attribution;

export type SubmitProjectRequestInput = BriefInput & {
  name: string;
  /** Optional — Project Builder Step 4 requires phone/WhatsApp instead; email is a nice-to-have here (see findOrCreateLead's identity model). */
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  preferredContactMethod?: PreferredContactMethod;
  locale: Locale;
  analyticsSessionId?: string;
} & Attribution;

/**
 * Best-effort, non-blocking: retroactively links this session's prior
 * anonymous analytics events to the just-created/reused lead. Must
 * never fail (or slow down) the actual submission it's attached to —
 * analytics is always secondary to persisting the lead (Phase 9 §31).
 */
async function attachAnalyticsSession(analyticsSessionId: string | undefined, leadId: string): Promise<void> {
  if (!analyticsSessionId) return;
  try {
    // Dynamically imported so the analytics repository/Drizzle stack
    // behind it never has to resolve just because lead-service.ts is
    // loaded — a lead submission's success must never depend on the
    // analytics module even being importable.
    const { getAnalyticsService } = await import("./analytics-service");
    await getAnalyticsService().attachSessionToLead(analyticsSessionId, leadId);
  } catch (error) {
    console.error("[lead-service] analytics session attach failed (non-fatal):", error);
  }
}

/**
 * Best-effort, non-blocking email notifications (Phase 10 §13-18) —
 * both the internal new-lead notice and the optional client
 * confirmation. Never throws, never delays the caller beyond the
 * actual send attempt, and NEVER rolls back (or masks the success of)
 * the lead it's attached to; a notification failure is only ever
 * logged. A `LeadActivity` is written only for a real SENT outcome —
 * SKIPPED/FAILED are never recorded as if something happened.
 */
async function sendLeadNotifications(
  repo: LeadRepository,
  lead: Lead,
  reference: string,
  brief?: Pick<StructuredBrief, "projectType" | "timeline" | "investmentRange">,
): Promise<void> {
  try {
    const internal = await sendInternalLeadNotification(lead, reference, brief);
    if (internal.outcome === "SENT") {
      await repo.createActivity(lead.id, "internal_notification_sent", {});
    }

    const confirmation = await sendClientConfirmationEmail(lead, reference);
    if (confirmation.outcome === "SENT") {
      await repo.createActivity(lead.id, "client_confirmation_sent", {});
    }
  } catch (error) {
    console.error("[lead-service] notification dispatch failed (non-fatal):", error);
  }
}

export type SubmitResult =
  | { success: true; reference: string; leadId: string }
  | { success: false; error: "db_unavailable" | "unexpected" };

export type SubmitProjectRequestResult =
  | { success: true; reference: string; leadId: string; projectRequestId: string; brief: StructuredBrief }
  | { success: false; error: "db_unavailable" | "unexpected" };

/**
 * The shared identity/dedup model for every lead-acquisition surface
 * (Contact form, Project Builder, AI proposal capture). Priority order
 * — deliberately phone-first now that email is no longer guaranteed to
 * exist:
 *
 *   1. A normalized-phone match wins and is reused immediately.
 *   2. Otherwise, a normalized-email match (if an email was supplied)
 *      is reused.
 *   3. Otherwise, a new lead is created.
 *
 * Conservative-by-construction for the "phone points at Lead A, email
 * points at a DIFFERENT Lead B" case: since a phone match is checked
 * and returned FIRST, Lead B is never looked up, read, or written —
 * there is no merge, destructive or otherwise. The submission simply
 * belongs to Lead A. If Lead A is missing whatever contact detail this
 * submission *does* supply, that gap is filled in (never a known value
 * overwritten — see `backfillContactInfo`), and the fill itself is
 * skipped if the value would collide with a different existing lead
 * (checked inside `backfillContactInfo`), so two lead rows can never
 * end up silently sharing the same normalized email or phone.
 */
async function findOrCreateLead(
  repo: LeadRepository,
  params: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    country?: string;
    language: string;
    preferredContactMethod?: PreferredContactMethod;
    source: LeadSource;
    attribution: Attribution;
  },
) {
  const emailNormalized = params.email ? normalizeEmail(params.email) : undefined;
  const phoneNormalized = params.phone ? normalizePhone(params.phone) : undefined;

  const identity = await repo.resolveIdentity({ emailNormalized, phoneNormalized });
  if (identity) {
    const { lead } = identity;

    // Identity conflict signal (never a merge — see the identity_conflict_detected
    // doc in domain/lead.ts). Only reachable when BOTH an email and a
    // phone were supplied and phone won the match (the only way
    // `resolveIdentity` can return here with a *different* identifier
    // still unaccounted for, since phone is always checked first): if
    // the supplied email independently identifies a DIFFERENT existing
    // lead, that's recorded as a non-PII activity on the lead this
    // submission actually landed on — the other lead is still never
    // read again beyond this one lookup, never written, and never
    // exposed to this prospect.
    if (identity.matchedVia === "phone" && emailNormalized) {
      const emailMatch = await repo.resolveIdentity({ emailNormalized });
      if (emailMatch && emailMatch.lead.id !== lead.id) {
        await repo.createActivity(lead.id, "identity_conflict_detected", {
          source: params.source,
          hasPhoneConflict: false,
          hasEmailConflict: true,
        } satisfies IdentityConflictMetadata);
      }
    }

    // Only ever attempt to fill a column that's currently genuinely
    // empty on the matched lead — a value it already has is never
    // touched, regardless of what this submission supplied.
    const needsEmail = !lead.email && params.email;
    const needsPhone = !lead.phone && params.phone;
    if (needsEmail || needsPhone) {
      const updated = await repo.backfillContactInfo(lead.id, {
        email: needsEmail ? params.email : undefined,
        emailNormalized: needsEmail ? emailNormalized : undefined,
        phone: needsPhone ? params.phone : undefined,
        phoneNormalized: needsPhone ? phoneNormalized : undefined,
      });
      return { lead: updated ?? lead, isNew: false };
    }
    return { lead, isNew: false };
  }

  // This is the entire "First Touch" attribution model (Phase 9 §9):
  // attribution is captured exactly once, right here, at the visit
  // that created the lead — a returning visitor who resubmits via a
  // different channel never overwrites it (see the dedup return
  // above). See docs/ANALYTICS_MEASUREMENT_PLAN.md for why this model
  // was chosen over multi-touch attribution.
  const attribution: Attribution = {
    landingPage: sanitizeUrlValue(params.attribution.landingPage),
    referrer: sanitizeUrlValue(params.attribution.referrer),
    utmSource: sanitizeUtmValue(params.attribution.utmSource),
    utmMedium: sanitizeUtmValue(params.attribution.utmMedium),
    utmCampaign: sanitizeUtmValue(params.attribution.utmCampaign),
    utmContent: sanitizeUtmValue(params.attribution.utmContent),
    utmTerm: sanitizeUtmValue(params.attribution.utmTerm),
  };

  const lead = await repo.createLead({
    publicReference: generatePublicReference(),
    name: params.name,
    email: params.email,
    emailNormalized,
    phone: params.phone,
    phoneNormalized,
    company: params.company,
    country: params.country,
    language: params.language,
    preferredContactMethod: params.preferredContactMethod,
    source: params.source,
    ...attribution,
  });
  return { lead, isNew: true };
}

/**
 * Contact form submission. Creates (or reuses, per the dedup rule in
 * findOrCreateLead) a Lead, records an activity, and — only when the
 * visitor gave enough project detail to be useful — a minimal
 * ProjectRequest, so the Contact page and the Project Builder feed the
 * exact same pipeline rather than two parallel lead systems.
 */
export async function submitContact(
  input: SubmitContactInput,
  repo: LeadRepository = getLeadRepository(),
): Promise<SubmitResult> {
  try {
    const { lead, isNew } = await findOrCreateLead(repo, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      language: input.locale,
      source: "contact_form",
      attribution: {
        landingPage: input.landingPage,
        referrer: input.referrer,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
      },
    });

    if (isNew) await repo.createActivity(lead.id, "lead_created", { via: "contact_form" });
    await repo.createActivity(lead.id, "contact_form_submitted", { via: "contact_form" });

    let brief: StructuredBrief | undefined;
    if (input.projectType && input.message) {
      brief = await buildStructuredBrief(
        {
          projectType: "not-sure",
          goals: [],
          capabilities: [],
          platforms: [],
          businessState: "new-idea",
          timeline: "flexible",
          budgetRange: input.budget || "not-sure",
          message: input.message,
        },
        input.locale,
      );
      await repo.createProjectRequest({
        leadId: lead.id,
        projectType: "not-sure",
        goals: [],
        capabilities: [],
        platforms: [],
        businessState: "new-idea",
        timeline: "flexible",
        budgetRange: input.budget || "not-sure",
        message: input.message,
        structuredBrief: brief,
        locale: input.locale,
      } satisfies Omit<ProjectRequest, "id" | "createdAt">);
    }

    await attachAnalyticsSession(input.analyticsSessionId, lead.id);
    await sendLeadNotifications(repo, lead, lead.publicReference, brief);

    return { success: true, reference: lead.publicReference, leadId: lead.id };
  } catch (error) {
    return toFailure(error);
  }
}

/** Full Project Builder submission. */
export async function submitProjectRequest(
  input: SubmitProjectRequestInput,
  repo: LeadRepository = getLeadRepository(),
): Promise<SubmitProjectRequestResult> {
  try {
    const { lead, isNew } = await findOrCreateLead(repo, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      country: input.country,
      language: input.locale,
      preferredContactMethod: input.preferredContactMethod,
      source: "project_builder",
      attribution: {
        landingPage: input.landingPage,
        referrer: input.referrer,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
      },
    });

    if (isNew) await repo.createActivity(lead.id, "lead_created", { via: "project_builder" });

    const brief = await buildStructuredBrief(input, input.locale);

    // Phase 11 §6 — resolved once, here, from the same stable id
    // that's always been stored, never trusted from free-typed client
    // input. Absent (undefined) when the id doesn't match a known
    // range (e.g. "not-sure") or no currency context was supplied —
    // never guessed.
    const budgetRangeConfig = getBudgetRange(input.budgetRange);
    const budgetCurrency = input.budgetCurrency ?? (budgetRangeConfig ? "EUR" : undefined);
    const budgetAmounts = budgetRangeConfig && budgetCurrency ? getBudgetAmounts(budgetRangeConfig, budgetCurrency) : undefined;

    const projectRequest = await repo.createProjectRequest({
      leadId: lead.id,
      projectType: input.projectType,
      goals: input.goals,
      capabilities: input.capabilities,
      platforms: input.platforms,
      businessState: input.businessState,
      currentWebsite: input.currentWebsite,
      timeline: input.timeline,
      budgetRange: input.budgetRange,
      budgetCurrency,
      budgetMinAmount: budgetAmounts?.min,
      budgetMaxAmount: budgetAmounts?.max,
      message: input.message,
      structuredBrief: brief,
      locale: input.locale,
    } satisfies Omit<ProjectRequest, "id" | "createdAt">);

    await repo.createActivity(lead.id, "project_request_submitted", {
      projectType: input.projectType,
    });

    await attachAnalyticsSession(input.analyticsSessionId, lead.id);
    await sendLeadNotifications(repo, lead, lead.publicReference, brief);

    return { success: true, reference: lead.publicReference, leadId: lead.id, projectRequestId: projectRequest.id, brief };
  } catch (error) {
    return toFailure(error);
  }
}

export type SubmitProjectInquiryInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: InquiryService;
  projectDescription: string;
  budgetRange: string;
  budgetCurrency: CurrencyCode;
  desiredStart: ProjectTimeline;
  urgency: UrgencyLevel;
  purchaseIntent: PurchaseIntentLevel;
  locale: Locale;
  analyticsSessionId?: string;
} & Attribution;

/**
 * Best-effort, non-blocking MagicFlux forward (brief §3/§6): always
 * runs strictly AFTER the lead is already safely persisted, and its
 * outcome never changes what the customer sees — a MagicFlux delivery
 * failure is an internal operational signal (logged + recorded as a
 * non-PII activity), never a reason to tell the visitor their inquiry
 * wasn't received, since it genuinely was.
 */
async function forwardToMagicFlux(repo: LeadRepository, lead: Lead, reference: string, input: SubmitProjectInquiryInput, submissionNonce: string): Promise<void> {
  try {
    const budgetRangeConfig = getBudgetRange(input.budgetRange);
    const budgetAmounts = budgetRangeConfig ? getBudgetAmounts(budgetRangeConfig, input.budgetCurrency) : undefined;

    const payload = buildMagicFluxPayload({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      service: input.service,
      projectDescription: input.projectDescription,
      budgetRangeId: input.budgetRange,
      budgetMin: budgetAmounts?.min,
      budgetMax: budgetAmounts?.max,
      budgetCurrency: input.budgetCurrency,
      urgency: input.urgency,
      purchaseIntent: input.purchaseIntent,
      desiredStart: input.desiredStart,
      locale: input.locale,
      reference,
      submittedAt: new Date().toISOString(),
    });

    const result = await forwardLeadToMagicFlux(payload, submissionNonce);
    if (result.outcome === "SKIPPED") return;

    await repo.createActivity(lead.id, "magicflux_forwarded", {
      outcome: result.outcome,
      executionId: result.executionId,
      errorReason: result.errorReason,
    } satisfies MagicFluxForwardMetadata);
  } catch (error) {
    console.error("[lead-service] MagicFlux forward dispatch failed (non-fatal):", error);
  }
}

/**
 * The real MagicFlux AI Lead Qualification inquiry form's submission
 * path (distinct from Contact and the full Project Builder — see
 * domain/project-inquiry.ts). Creates/reuses a Lead through the exact
 * same identity/dedup model as every other surface, persists a minimal
 * ProjectRequest so this inquiry shows up in /admin/leads like any
 * other, sends the existing best-effort email notifications, and only
 * then forwards a normalized payload to MagicFlux — never the other
 * order, and a MagicFlux outcome never affects this function's return
 * value.
 */
export async function submitProjectInquiry(
  input: SubmitProjectInquiryInput,
  submissionNonce: string,
  repo: LeadRepository = getLeadRepository(),
): Promise<SubmitResult> {
  try {
    const { lead, isNew } = await findOrCreateLead(repo, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      language: input.locale,
      source: "magicflux_inquiry",
      attribution: {
        landingPage: input.landingPage,
        referrer: input.referrer,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
      },
    });

    if (isNew) await repo.createActivity(lead.id, "lead_created", { via: "magicflux_inquiry" });
    await repo.createActivity(lead.id, "project_request_submitted", { via: "magicflux_inquiry" });

    const projectType = mapInquiryServiceToProjectType(input.service);
    const budgetRangeConfig = getBudgetRange(input.budgetRange);
    const budgetAmounts = budgetRangeConfig ? getBudgetAmounts(budgetRangeConfig, input.budgetCurrency) : undefined;

    const brief = await buildStructuredBrief(
      {
        projectType,
        goals: [],
        capabilities: [],
        platforms: [],
        businessState: "new-idea",
        timeline: input.desiredStart,
        budgetRange: input.budgetRange,
        budgetCurrency: input.budgetCurrency,
        message: input.projectDescription,
      },
      input.locale,
    );

    await repo.createProjectRequest({
      leadId: lead.id,
      projectType,
      goals: [],
      capabilities: [],
      platforms: [],
      businessState: "new-idea",
      timeline: input.desiredStart,
      budgetRange: input.budgetRange,
      budgetCurrency: input.budgetCurrency,
      budgetMinAmount: budgetAmounts?.min,
      budgetMaxAmount: budgetAmounts?.max,
      message: input.projectDescription,
      structuredBrief: brief,
      locale: input.locale,
    } satisfies Omit<ProjectRequest, "id" | "createdAt">);

    await attachAnalyticsSession(input.analyticsSessionId, lead.id);
    await sendLeadNotifications(repo, lead, lead.publicReference, brief);
    await forwardToMagicFlux(repo, lead, lead.publicReference, input, submissionNonce);

    return { success: true, reference: lead.publicReference, leadId: lead.id };
  } catch (error) {
    return toFailure(error);
  }
}

export type AttachOptionalQualificationInput = {
  reference: string;
  projectRequestId: string;
  goals: ProjectRequest["goals"];
  capabilities: ProjectRequest["capabilities"];
  platforms: ProjectRequest["platforms"];
};

export type AttachOptionalQualificationResult =
  | { success: true }
  | { success: false; error: "not_found" | "unexpected" };

/**
 * Project Builder v2 §3 — attaches optional, later-supplied
 * qualification (goals/capabilities/platforms) to the *same* project
 * request the primary submission already created. Never creates a
 * lead or project request; ownership is verified by requiring both the
 * public reference (shown to the visitor on the success screen) AND
 * the project request id (returned to the client at submission time)
 * to agree on the same lead — a guessed/tampered id for someone else's
 * request is rejected as "not_found" rather than silently updating it.
 */
export async function attachOptionalQualification(
  input: AttachOptionalQualificationInput,
  repo: LeadRepository = getLeadRepository(),
): Promise<AttachOptionalQualificationResult> {
  try {
    const lead = await repo.findByPublicReference(input.reference);
    if (!lead) return { success: false, error: "not_found" };

    const existing = await repo.getProjectRequestById(input.projectRequestId);
    if (!existing || existing.leadId !== lead.id) return { success: false, error: "not_found" };

    // Re-derive the structured brief from the merged fields so a
    // salesperson opening this lead later sees an up-to-date brief,
    // not one that still says "not specified" for something the
    // visitor has since provided.
    const brief = await buildStructuredBrief(
      {
        projectType: existing.projectType,
        goals: input.goals,
        capabilities: input.capabilities,
        platforms: input.platforms,
        businessState: existing.businessState,
        currentWebsite: existing.currentWebsite,
        timeline: existing.timeline,
        budgetRange: existing.budgetRange,
        budgetCurrency: existing.budgetCurrency,
        message: existing.message,
      },
      existing.locale as Locale,
    );

    const updated = await repo.updateProjectRequestQualification(existing.id, {
      goals: input.goals,
      capabilities: input.capabilities,
      platforms: input.platforms,
      structuredBrief: brief,
    });
    if (!updated) return { success: false, error: "not_found" };

    await repo.createActivity(lead.id, "project_request_submitted", { via: "optional_qualification" });

    return { success: true };
  } catch (error) {
    console.error("[lead-service] optional qualification attach failed:", error instanceof Error ? error.message : error);
    return { success: false, error: "unexpected" };
  }
}

const DB_CONNECTIVITY_PATTERNS = ["ECONNREFUSED", "DATABASE_URL", "connect", "ETIMEDOUT", "ENOTFOUND"];

/**
 * Postgres error messages for constraint violations embed the actual
 * offending value (e.g. "Key (email_normalized)=(person@example.com)
 * already exists") — logging that verbatim in production would leak
 * PII into application logs. Log only a safe classifier (error name/
 * code) in production; the full message is fine in development.
 */
function toFailure(error: unknown): { success: false; error: "db_unavailable" | "unexpected" } {
  const code = (error as { code?: string })?.code;
  const name = error instanceof Error ? error.constructor.name : typeof error;

  if (process.env.NODE_ENV === "production") {
    console.error("[lead-service] submission failed:", { name, code });
  } else {
    console.error("[lead-service] submission failed:", error);
  }

  const message = error instanceof Error ? error.message : String(error);
  const isConnectivity = DB_CONNECTIVITY_PATTERNS.some((p) => message.includes(p));
  return { success: false, error: isConnectivity ? "db_unavailable" : "unexpected" };
}
