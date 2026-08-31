const MAX_UTM_LENGTH = 120;
const MAX_URL_LENGTH = 500;

// Not a general HTML sanitizer — these values are only ever rendered
// through normal JSX (auto-escaped) or stored as opaque strings, never
// interpolated into HTML/SQL/shell. This is defense-in-depth against
// obviously malformed input (Phase 9 §10), not a substitute for that
// escaping.
const SUSPICIOUS_PATTERN = /<script|javascript:|on\w+\s*=/i;

/** Caps length and drops obviously malformed/script-shaped UTM values, while preserving real campaign names untouched. */
export function sanitizeUtmValue(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, MAX_UTM_LENGTH);
  if (!trimmed || SUSPICIOUS_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

/** Same idea for landingPage/referrer, which are full URLs rather than short tokens — capped further out since real URLs are longer than a campaign slug. */
export function sanitizeUrlValue(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, MAX_URL_LENGTH);
  if (!trimmed || SUSPICIOUS_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}
