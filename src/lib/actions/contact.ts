"use server";

import { getTranslations } from "next-intl/server";
import { contactFormSchema, type ContactFormResult } from "@/domain/contact";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * No CRM/database exists yet (that's Phase 5). This is the real server
 * boundary for the contact form — input is validated here, server-side,
 * every time — but its current implementation is deliberately honest
 * about not persisting anything: it logs the lead (a placeholder for the
 * future CRM write) and hands back a WhatsApp continuation link built
 * from what was submitted, rather than claiming a "we received your
 * message" outcome that a working pipeline would imply.
 */
export async function submitContactForm(formData: unknown): Promise<ContactFormResult> {
  const parsed = contactFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "validation_error" };
  }

  const data = parsed.data;

  // TODO(Phase 5 — CRM): persist this lead instead of logging it once a
  // database exists. Until then, logging is the honest placeholder.
  console.log("[contact] new lead received (no persistence layer yet):", {
    name: data.name,
    email: data.email,
    projectType: data.projectType,
    locale: data.locale,
  });

  const t = await getTranslations({ locale: data.locale, namespace: "contactPage" });
  const lines = [
    `${t("form.name")}: ${data.name}`,
    data.company ? `${t("form.company")}: ${data.company}` : null,
    `${t("form.email")}: ${data.email}`,
    data.phone ? `${t("form.phone")}: ${data.phone}` : null,
    `${t("form.projectType")}: ${data.projectType}`,
    data.budget ? `${t("form.budget")}: ${data.budget}` : null,
    data.timeline ? `${t("form.timeline")}: ${data.timeline}` : null,
    `${t("form.message")}: ${data.message}`,
  ].filter(Boolean);

  const whatsappUrl = buildWhatsAppUrl(lines.join("\n"));

  return { success: true, whatsappUrl };
}
