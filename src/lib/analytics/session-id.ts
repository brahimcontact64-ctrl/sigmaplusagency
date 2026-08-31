const STORAGE_KEY = "sigma_analytics_session";
/** Rotate after 30 days — long enough for real funnel continuity (a visitor researching over days/weeks), short enough that this is never a long-lived tracking identifier. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type StoredSession = { id: string; createdAt: number };

/**
 * Privacy-conscious anonymous session identifier (Phase 9 §7): random
 * (`crypto.randomUUID()`), first-party (localStorage, this origin
 * only), never derived from fingerprinting/email/phone/IP, and
 * rotates automatically after 30 days. Used only for same-session
 * funnel continuity (page A → service B → Project Builder → lead) —
 * never for cross-device tracking, which would require exactly the
 * kind of identity-linking this deliberately avoids.
 */
export function getOrCreateAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed.id && Date.now() - parsed.createdAt < SESSION_TTL_MS) {
        return parsed.id;
      }
    }
  } catch {
    // Corrupt/unreadable stored value — fall through and mint a fresh one.
  }

  const fresh: StoredSession = { id: crypto.randomUUID(), createdAt: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // Private browsing / storage disabled — the id still works for this page load, just won't persist across reloads.
  }
  return fresh.id;
}
