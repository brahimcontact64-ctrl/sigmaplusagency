import type { Locale } from "@/i18n/routing";
import { getLeadRepository, type LeadRepository } from "@/lib/repositories/lead-repository";
import { generatePublicReference } from "./reference";
import { normalizeEmail, normalizePhone } from "./identity";
import { buildStructuredBrief, type BriefInput } from "./structured-brief";
import { sanitizeUtmValue, sanitizeUrlValue } from "@/lib/attribution/sanitize-utm";
import { sendInternalLeadNotification, sendClientConfirmationEmail } from "@/lib/notifications/lead-notification-service";
import type { Attribution, Lead, LeadSource, PreferredContactMethod } from "@/domain/lead";
import type { ProjectRequest, StructuredBrief } from "@/domain/project-request";

export type SubmitContactInput = {
  name: string;
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
  email: string;
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
  | { success: true; reference: string; leadId: string; brief: StructuredBrief }
  | { success: false; error: "db_unavailable" | "unexpected" };

async function findOrCreateLead(
  repo: LeadRepository,
  params: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    country?: string;
    language: string;
    preferredContactMethod?: PreferredContactMethod;
    source: LeadSource;
    attribution: Attribution;
  },
) {
  const emailNormalized = normalizeEmail(params.email);
  const phoneNormalized = params.phone ? normalizePhone(params.phone) : undefined;

  const existing = await repo.findByNormalizedIdentity(emailNormalized, phoneNormalized);
  if (existing) return { lead: existing, isNew: false };

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

    await repo.createProjectRequest({
      leadId: lead.id,
      projectType: input.projectType,
      goals: input.goals,
      capabilities: input.capabilities,
      platforms: input.platforms,
      businessState: input.businessState,
      currentWebsite: input.currentWebsite,
      timeline: input.timeline,
      budgetRange: input.budgetRange,
      message: input.message,
      structuredBrief: brief,
      locale: input.locale,
    } satisfies Omit<ProjectRequest, "id" | "createdAt">);

    await repo.createActivity(lead.id, "project_request_submitted", {
      projectType: input.projectType,
    });

    await attachAnalyticsSession(input.analyticsSessionId, lead.id);
    await sendLeadNotifications(repo, lead, lead.publicReference, brief);

    return { success: true, reference: lead.publicReference, leadId: lead.id, brief };
  } catch (error) {
    return toFailure(error);
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
