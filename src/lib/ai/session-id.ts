const STORAGE_KEY = "sigma_ai_session_id";

/** Anonymous, per-browser identifier scoping AI conversations — not an auth mechanism, just enough to let the same visitor resume their own conversation and to rate-limit/attribute abuse. Client-only by construction (localStorage). */
export function getOrCreateAiSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Private browsing / storage disabled — fall back to an in-memory id for this page load only.
    return crypto.randomUUID();
  }
}
