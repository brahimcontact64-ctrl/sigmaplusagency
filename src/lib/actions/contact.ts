"use server";

import { contactFormSchema, type ContactFormResult } from "@/domain/contact";
import { submitContact } from "@/lib/services/lead-service";
import { buildContactWhatsAppUrl } from "@/lib/services/whatsapp-summary";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { isHoneypotTripped, HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";
import { submissionRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";

/**
 * Real server boundary: validated, rate-limited, honeypot-checked, then
 * persisted through the same lead-service the Project Builder uses —
 * one lead pipeline, not two. WhatsApp is only ever offered *after* a
 * successful write; see submitContact's try/catch for the failure path.
 */
export async function submitContactForm(formData: unknown, analyticsSessionId?: string): Promise<ContactFormResult> {
  const parsed = contactFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "validation_error" };
  }

  const data = parsed.data;

  if (isHoneypotTripped(data[HONEYPOT_FIELD_NAME])) {
    // Don't reveal the trap: report a generic failure so a bot can't
    // learn to leave the field blank next time.
    return { success: false, error: "unexpected" };
  }

  const ip = await getClientIp();
  if (!submissionRateLimiter.check(`contact:${ip}`)) {
    return { success: false, error: "rate_limited" };
  }

  const result = await submitContact({
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    company: data.company || undefined,
    projectType: data.projectType || undefined,
    budget: data.budget || undefined,
    timeline: data.timeline || undefined,
    message: data.message,
    locale: data.locale,
    landingPage: data.landingPage || undefined,
    referrer: data.referrer || undefined,
    utmSource: data.utmSource || undefined,
    utmMedium: data.utmMedium || undefined,
    utmCampaign: data.utmCampaign || undefined,
    utmContent: data.utmContent || undefined,
    utmTerm: data.utmTerm || undefined,
    analyticsSessionId: typeof analyticsSessionId === "string" ? analyticsSessionId.slice(0, 100) : undefined,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // As in the Project Builder action: the lead is already safely
  // persisted here, so a failure building the WhatsApp link must never
  // turn a real success into an apparent crash.
  let whatsappUrl: string;
  try {
    whatsappUrl = await buildContactWhatsAppUrl(
      { name: data.name, projectType: data.projectType, reference: result.reference },
      data.locale,
    );
  } catch (error) {
    console.error("[contact] WhatsApp link build failed after successful persistence:", error);
    whatsappUrl = buildWhatsAppUrl();
  }

  return { success: true, reference: result.reference, whatsappUrl };
}
