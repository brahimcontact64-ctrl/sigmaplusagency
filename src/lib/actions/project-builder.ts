"use server";

import { projectBuilderSchema, type ProjectBuilderResult } from "@/domain/project-builder";
import { submitProjectRequest } from "@/lib/services/lead-service";
import { buildProjectRequestWhatsAppUrl } from "@/lib/services/whatsapp-summary";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { isHoneypotTripped, HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";
import { submissionRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { isMaintenanceModeEnabled } from "@/lib/feature-flags";

/**
 * Failure-safety rule from the master plan, enforced structurally here:
 * WhatsApp is only built from `submitProjectRequest`'s *result* — if
 * persistence throws or returns success:false, we never reach the
 * WhatsApp URL construction at all. There is no code path that hands
 * back a WhatsApp link without a prior successful database write.
 */
export async function submitProjectBuilder(formData: unknown, analyticsSessionId?: string): Promise<ProjectBuilderResult> {
  if (isMaintenanceModeEnabled()) {
    return { success: false, error: "maintenance" };
  }

  const parsed = projectBuilderSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "validation_error" };
  }

  const data = parsed.data;

  if (isHoneypotTripped(data[HONEYPOT_FIELD_NAME])) {
    return { success: false, error: "unexpected" };
  }

  const ip = await getClientIp();
  if (!(await submissionRateLimiter.check(`project-builder:${ip}`))) {
    return { success: false, error: "rate_limited" };
  }

  const briefInput = {
    projectType: data.projectType,
    goals: data.goals,
    capabilities: data.capabilities,
    platforms: data.platforms,
    businessState: data.businessState,
    currentWebsite: data.currentWebsite || undefined,
    timeline: data.timeline,
    budgetRange: data.budgetRange,
    budgetCurrency: data.budgetCurrency,
    message: data.message || undefined,
  };

  const result = await submitProjectRequest({
    ...briefInput,
    name: data.name,
    email: data.email || undefined,
    phone: data.phone || undefined,
    company: data.company || undefined,
    country: data.country || undefined,
    preferredContactMethod: data.preferredContactMethod,
    locale: data.locale,
    landingPage: data.landingPage || undefined,
    referrer: data.referrer || undefined,
    utmSource: data.utmSource || undefined,
    utmMedium: data.utmMedium || undefined,
    utmCampaign: data.utmCampaign || undefined,
    utmContent: data.utmContent || undefined,
    utmTerm: data.utmTerm || undefined,
    // Untrusted client-supplied value, only ever used as an equality
    // lookup key (never interpolated/executed) — a malformed value
    // simply matches no prior analytics events. Length-capped the same
    // way the ingestion route caps it.
    analyticsSessionId: typeof analyticsSessionId === "string" ? analyticsSessionId.slice(0, 100) : undefined,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // The lead is already safely persisted at this point. WhatsApp link
  // construction is a secondary convenience — if it throws for any
  // reason (e.g. a translation lookup issue), that must never present
  // as a failed submission. Fall back to the plain WhatsApp link
  // (no pre-filled message) rather than losing the success state.
  let whatsappUrl: string;
  try {
    whatsappUrl = await buildProjectRequestWhatsAppUrl(result.brief, result.reference, data.locale, data.message);
  } catch (error) {
    console.error("[project-builder] WhatsApp link build failed after successful persistence:", error);
    whatsappUrl = buildWhatsAppUrl();
  }

  return {
    success: true,
    reference: result.reference,
    whatsappUrl,
    projectRequestId: result.projectRequestId,
    projectType: data.projectType,
  };
}
