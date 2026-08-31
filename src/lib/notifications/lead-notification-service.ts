import { getEmailProvider, type EmailNotificationProvider } from "./email-provider";
import { siteConfig } from "@/lib/site-config";
import type { Lead } from "@/domain/lead";
import type { StructuredBrief } from "@/domain/project-request";
import type { EmailNotificationOutcome } from "@/domain/email-notification";

export type NotificationResult = { outcome: EmailNotificationOutcome; error?: string };

// Read at call time, not cached at module load — env vars don't change
// mid-process in production, but reading them lazily is what lets a
// test toggle `process.env` and see the effect without needing to
// re-import the module (same reasoning as `isMaintenanceModeEnabled()`
// in feature-flags.ts).
function getNotificationEmail(): string | undefined {
  return process.env.LEAD_NOTIFICATION_EMAIL;
}
function getFromEmail(): string | undefined {
  return process.env.LEAD_NOTIFICATION_FROM_EMAIL;
}
// Off by default even when the provider is fully configured — a
// client-facing email is a bigger commitment than an internal one
// (Phase 10 §15: "do not automatically enable until actual sender
// domain/config exists").
function isClientConfirmationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CLIENT_CONFIRMATION_EMAIL === "true";
}

/** Defense-in-depth: strips newlines from any value interpolated into an email body/subject — the REST provider already JSON-encodes the payload (so classic SMTP header injection isn't reachable), but a field containing a stray newline could still make a plain-text body confusing. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Internal new-lead notification (Phase 10 §13-14). Never blocks or
 * fails a lead submission — `lead-service.ts` calls this only AFTER a
 * successful DB write, and this function itself never throws. Returns
 * SKIPPED (not an error) when no provider/recipient is configured.
 */
export async function sendInternalLeadNotification(
  lead: Lead,
  reference: string,
  brief?: Pick<StructuredBrief, "projectType" | "timeline" | "investmentRange">,
  provider: EmailNotificationProvider | null = getEmailProvider(),
): Promise<NotificationResult> {
  const notificationEmail = getNotificationEmail();
  const fromEmail = getFromEmail();
  if (!provider || !notificationEmail || !fromEmail) return { outcome: "SKIPPED" };

  const lines = [
    `New SIGMA+ lead: ${reference}`,
    `Name: ${oneLine(lead.name)}`,
    lead.company ? `Company: ${oneLine(lead.company)}` : null,
    brief ? `Project type: ${oneLine(brief.projectType)}` : null,
    brief ? `Timeline: ${oneLine(brief.timeline)}` : null,
    brief ? `Budget: ${oneLine(brief.investmentRange)}` : null,
    `Source: ${lead.source}`,
    `Admin: ${siteConfig.url}/admin/leads/${lead.id}`,
  ].filter((line): line is string => line !== null);

  const result = await provider.send({
    to: notificationEmail,
    from: fromEmail,
    subject: `New lead — ${reference}`,
    text: lines.join("\n"),
  });

  if (result.success) return { outcome: "SENT" };
  console.error("[lead-notification] internal notification failed:", result.error);
  return { outcome: "FAILED", error: result.error };
}

/**
 * Optional client-facing confirmation (Phase 10 §15) — English-only
 * for now (a documented limitation, not an oversight: this is off by
 * default via `CLIENT_CONFIRMATION_ENABLED` and localizing copy for a
 * disabled-by-default feature across 4 locales is deferred until it's
 * actually turned on). Never promises a specific response time.
 */
export async function sendClientConfirmationEmail(
  lead: Lead,
  reference: string,
  provider: EmailNotificationProvider | null = getEmailProvider(),
): Promise<NotificationResult> {
  const fromEmail = getFromEmail();
  if (!provider || !fromEmail || !isClientConfirmationEnabled()) return { outcome: "SKIPPED" };

  const text = [
    `Hi ${oneLine(lead.name)},`,
    "",
    "Thanks for reaching out to SIGMA+ — we've received your request.",
    `Your reference: ${reference}`,
    "",
    "We'll be in touch. Feel free to reach us on WhatsApp in the meantime if you have anything to add.",
  ].join("\n");

  const result = await provider.send({ to: lead.email, from: fromEmail, subject: `We received your request — ${reference}`, text });

  if (result.success) return { outcome: "SENT" };
  console.error("[lead-notification] client confirmation failed:", result.error);
  return { outcome: "FAILED", error: result.error };
}
