import { siteConfig } from "./site-config";

/**
 * The static, env-only WhatsApp link builder. Since Phase 6, the
 * primary path for anything user-facing is
 * `getEffectiveWhatsAppUrl()` (src/lib/effective-config.ts), which
 * layers a DB-configurable number over this one. This function still
 * matters as the last-resort fallback used specifically when the
 * effective/DB-aware resolver already failed (see the try/catch
 * fallbacks in the contact and project-builder server actions) or
 * when the DB itself is unavailable — it must stay independent of any
 * database call so it can never fail for the same reason the primary
 * path just did.
 */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
