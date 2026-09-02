import { getEmailProvider, type EmailNotificationProvider } from "./email-provider";

/**
 * SEO operational alerts (Phase 12 §13) — reuses the exact same
 * internal-inbox email plumbing as `lead-notification-service.ts`'s
 * `sendInternalLeadNotification` (LEAD_NOTIFICATION_EMAIL/
 * LEAD_NOTIFICATION_FROM_EMAIL, the Resend-backed provider). No new
 * notification channel/vendor is introduced. A failed or skipped
 * notification must NEVER fail the SEO job it's attached to — every
 * caller in src/lib/seo/jobs/ treats this as fire-and-forget.
 */
export const SEO_ALERT_KINDS = [
  "critical_indexing_failure",
  "sitemap_failure",
  "large_ranking_loss",
  "severe_traffic_drop",
  "cwv_regression",
  "weekly_report_ready",
] as const;
export type SeoAlertKind = (typeof SEO_ALERT_KINDS)[number];

export type SeoAlertResult = { outcome: "SENT" | "SKIPPED" | "FAILED"; error?: string };

function getNotificationEmail(): string | undefined {
  return process.env.LEAD_NOTIFICATION_EMAIL;
}
function getFromEmail(): string | undefined {
  return process.env.LEAD_NOTIFICATION_FROM_EMAIL;
}

/** Defense-in-depth, same pattern as lead-notification-service.ts's `oneLine`. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

const SUBJECT_BY_KIND: Record<SeoAlertKind, string> = {
  critical_indexing_failure: "SIGMA+ SEO alert — critical indexing failure",
  sitemap_failure: "SIGMA+ SEO alert — sitemap generation failure",
  large_ranking_loss: "SIGMA+ SEO alert — large ranking loss detected",
  severe_traffic_drop: "SIGMA+ SEO alert — severe traffic drop",
  cwv_regression: "SIGMA+ SEO alert — Core Web Vitals regression",
  weekly_report_ready: "SIGMA+ weekly SEO report is ready",
};

/**
 * `details` must already be safe, human-readable lines — never a raw
 * error object, stack trace, or anything containing a URL/credential.
 * Every call site in src/lib/seo/jobs/ is responsible for that, the
 * same discipline `sendInternalLeadNotification` already requires of
 * its callers.
 */
export async function sendSeoAlert(
  kind: SeoAlertKind,
  details: string[],
  provider: EmailNotificationProvider | null = getEmailProvider(),
): Promise<SeoAlertResult> {
  const notificationEmail = getNotificationEmail();
  const fromEmail = getFromEmail();
  if (!provider || !notificationEmail || !fromEmail) return { outcome: "SKIPPED" };

  const text = [SUBJECT_BY_KIND[kind], "", ...details.map(oneLine), "", `Admin: /admin/seo`].join("\n");

  const result = await provider.send({ to: notificationEmail, from: fromEmail, subject: SUBJECT_BY_KIND[kind], text });
  if (result.success) return { outcome: "SENT" };
  console.error(`[seo-notification] ${kind} failed:`, result.error);
  return { outcome: "FAILED", error: result.error };
}
