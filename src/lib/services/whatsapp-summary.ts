import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { StructuredBrief } from "@/domain/project-request";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * The WhatsApp continuation message after a successful Project Builder
 * submission. Deliberately concise and non-sensitive: project type,
 * primary goal, a few capabilities, timeline, and the public reference
 * — never the raw message text, email, or phone (those are already in
 * the database; WhatsApp is a continuation channel, not a data dump).
 */
export async function buildProjectRequestWhatsAppUrl(
  brief: StructuredBrief,
  reference: string,
  locale: Locale,
): Promise<string> {
  const t = await getTranslations({ locale, namespace: "projectBuilder" });

  const capabilities = brief.requestedCapabilities.slice(0, 3).join(", ");
  const message = t("whatsappSummary", {
    projectType: brief.projectType,
    goal: brief.primaryGoals[0] ?? "",
    capabilities: capabilities || "—",
    timeline: brief.timeline,
    reference,
  });

  return buildWhatsAppUrl(message);
}

/** Same idea for the Contact page, whose data shape is simpler (no structured brief). */
export async function buildContactWhatsAppUrl(
  params: { name: string; projectType?: string; reference: string },
  locale: Locale,
): Promise<string> {
  const t = await getTranslations({ locale, namespace: "contactPage" });
  const message = t("whatsappSummary", {
    name: params.name,
    projectType: params.projectType || "—",
    reference: params.reference,
  });
  return buildWhatsAppUrl(message);
}
