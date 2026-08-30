import { siteConfig } from "./site-config";

/**
 * Single source of truth for building WhatsApp deep links.
 * Every entry point on the site (nav, hero, contact section, future
 * Project Builder / case-study pages / AI consultant handoff) must go
 * through this function so the message format stays consistent and the
 * number stays configurable in one place.
 */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
