import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { StructuredBrief } from "@/domain/project-request";
import { getEffectiveWhatsAppUrl } from "@/lib/effective-config";

const IDEA_EXCERPT_MAX_LENGTH = 140;

/**
 * The WhatsApp continuation message after a successful Project Builder
 * submission. Deliberately concise: project type, a short excerpt of
 * the visitor's own idea description, timeline, and the public
 * reference — never the full message, email, or phone (those are
 * already in the database; WhatsApp is a continuation channel, not a
 * data dump). `ideaMessage` is optional so older callers/tests that
 * don't have one (there are none left in this codebase, but the
 * signature stays defensive) still get a valid message.
 */
export async function buildProjectRequestWhatsAppUrl(
  brief: StructuredBrief,
  reference: string,
  locale: Locale,
  ideaMessage?: string,
): Promise<string> {
  const t = await getTranslations({ locale, namespace: "projectBuilder" });

  const trimmed = (ideaMessage ?? "").trim();
  const ideaExcerpt =
    trimmed.length > IDEA_EXCERPT_MAX_LENGTH ? `${trimmed.slice(0, IDEA_EXCERPT_MAX_LENGTH).trimEnd()}…` : trimmed;

  const message = t("whatsappSummary", {
    projectType: brief.projectType,
    idea: ideaExcerpt || "—",
    timeline: brief.timeline,
    reference,
  });

  return getEffectiveWhatsAppUrl(message);
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
  return getEffectiveWhatsAppUrl(message);
}
