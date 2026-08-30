/**
 * Classic honeypot: a field real users never see or fill (hidden via
 * CSS, not `type="hidden"` — some bots skip those). If it arrives
 * non-empty, treat the submission as spam without telling the bot why,
 * so it doesn't just learn to leave the field blank.
 */
export const HONEYPOT_FIELD_NAME = "website_url_confirm";

export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
