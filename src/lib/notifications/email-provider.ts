export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  text: string;
};

export type EmailSendResult = { success: true } | { success: false; error: string };

export interface EmailNotificationProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

/**
 * Resend's plain REST API (Phase 10 §13) — no SDK dependency added
 * just for one HTTP call. One real provider, per the explicit
 * instruction not to invent several; a different provider (Postmark/
 * SendGrid/SES) would mean swapping this one class, never touching
 * `lead-notification-service.ts`.
 */
class ResendEmailProvider implements EmailNotificationProvider {
  constructor(private readonly apiKey: string) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: message.from, to: [message.to], subject: message.subject, text: message.text }),
      });

      if (!res.ok) {
        // Never echo the raw response body into logs — it could in
        // principle contain the recipient address or subject on some
        // error paths; a status code and length are enough to debug.
        return { success: false, error: `Resend responded with status ${res.status}` };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.constructor.name : "unknown_error" };
    }
  }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;

/** `null` when no provider is configured — every caller must treat that as "skip the notification," never as an error. */
export function getEmailProvider(): EmailNotificationProvider | null {
  if (!RESEND_API_KEY) return null;
  return new ResendEmailProvider(RESEND_API_KEY);
}
