"use server";

import { projectInquirySchema, type ProjectInquiryResult } from "@/domain/project-inquiry";
import { submitProjectInquiry } from "@/lib/services/lead-service";
import { buildProjectInquiryWhatsAppUrl } from "@/lib/services/whatsapp-summary";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { isHoneypotTripped, HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";
import { submissionRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { isMaintenanceModeEnabled } from "@/lib/feature-flags";
import { withIdempotency } from "@/lib/security/idempotency-cache";

/**
 * Server boundary for the MagicFlux AI Lead Qualification inquiry
 * form — validated, rate-limited, honeypot-checked, idempotency-
 * guarded, then persisted through the same lead pipeline every other
 * surface uses (`submitProjectInquiry`), which itself forwards a
 * normalized payload to MagicFlux only AFTER a successful write. The
 * browser never sees, sends, or could extract the MagicFlux webhook
 * URL or secret — both are read server-side only, inside
 * `lib/integrations/magicflux.ts`, and never returned in any response.
 */
export async function submitProjectInquiryForm(formData: unknown, analyticsSessionId?: string): Promise<ProjectInquiryResult> {
  if (isMaintenanceModeEnabled()) {
    return { success: false, error: "maintenance" };
  }

  const parsed = projectInquirySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "validation_error" };
  }

  const data = parsed.data;

  if (isHoneypotTripped(data[HONEYPOT_FIELD_NAME])) {
    return { success: false, error: "unexpected" };
  }

  const ip = await getClientIp();
  if (!(await submissionRateLimiter.check(`project-inquiry:${ip}`))) {
    return { success: false, error: "rate_limited" };
  }

  const result = await withIdempotency(`project-inquiry:${data.submissionNonce}`, () =>
    submitProjectInquiry(
      {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        company: data.company || undefined,
        service: data.service,
        projectDescription: data.projectDescription,
        budgetRange: data.budgetRange,
        budgetCurrency: data.budgetCurrency,
        desiredStart: data.desiredStart,
        urgency: data.urgency,
        purchaseIntent: data.purchaseIntent,
        locale: data.locale,
        landingPage: data.landingPage || undefined,
        referrer: data.referrer || undefined,
        utmSource: data.utmSource || undefined,
        utmMedium: data.utmMedium || undefined,
        utmCampaign: data.utmCampaign || undefined,
        utmContent: data.utmContent || undefined,
        utmTerm: data.utmTerm || undefined,
        analyticsSessionId: typeof analyticsSessionId === "string" ? analyticsSessionId.slice(0, 100) : undefined,
      },
      data.submissionNonce,
    ),
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // As in the Contact/Project Builder actions: the lead (and, best-
  // effort, the MagicFlux forward) is already handled inside
  // submitProjectInquiry by this point — a WhatsApp link-build failure
  // must never turn a real success into an apparent failure.
  let whatsappUrl: string;
  try {
    whatsappUrl = await buildProjectInquiryWhatsAppUrl({ name: data.name, service: data.service, reference: result.reference }, data.locale);
  } catch (error) {
    console.error("[project-inquiry] WhatsApp link build failed after successful persistence:", error);
    whatsappUrl = buildWhatsAppUrl();
  }

  return { success: true, reference: result.reference, whatsappUrl };
}
