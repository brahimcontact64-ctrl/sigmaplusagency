/** Phase 10 §17 — a safe, non-secret outcome recorded for every notification attempt. Never SENT unless the provider actually confirmed it. */
export const EMAIL_NOTIFICATION_OUTCOMES = ["SENT", "FAILED", "SKIPPED"] as const;
export type EmailNotificationOutcome = (typeof EMAIL_NOTIFICATION_OUTCOMES)[number];
