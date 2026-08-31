import { analyticsPropsSchema, type AnalyticsProps } from "@/domain/analytics-event";

/**
 * Belt-and-suspenders PII guard, on top of `analyticsPropsSchema`'s
 * closed dimension allowlist (Phase 9 §5). The schema already rejects
 * any key that isn't a known-safe dimension; this additionally checks
 * that no *value* in an otherwise-allowed field is shaped like an
 * email address or phone number — defense against a future bug that
 * accidentally passes a real value into e.g. `source` or `context`.
 *
 * A prop failing this check is dropped, not the whole event — losing
 * one optional dimension is a much smaller cost than losing an entire
 * funnel data point over a caller mistake elsewhere.
 */
const EMAIL_SHAPE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_SHAPE = /(?:\+?\d[\s.-]?){7,}/;

function looksLikePii(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return EMAIL_SHAPE.test(value) || PHONE_SHAPE.test(value);
}

export type SanitizeResult = { props: AnalyticsProps; rejectedKeys: string[] };

/** Validates against the closed schema (unknown keys make the whole payload invalid — see `validateAnalyticsPayload`) and then strips any individual value that looks like PII. */
export function sanitizeAnalyticsProps(props: Record<string, unknown> | undefined): SanitizeResult {
  if (!props) return { props: {}, rejectedKeys: [] };

  const rejectedKeys: string[] = [];
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (looksLikePii(value)) {
      rejectedKeys.push(key);
      continue;
    }
    cleaned[key] = value;
  }

  return { props: cleaned as AnalyticsProps, rejectedKeys };
}

export type ValidatePayloadResult =
  | { valid: true; props: AnalyticsProps }
  | { valid: false; error: "unknown_event" | "invalid_properties" };

/** The full validation used at the actual persistence boundary (Phase 9 §68) — rejects an unrecognized event name or a property bag that doesn't match the closed schema, rather than storing arbitrary JSON. */
export function validateAnalyticsPayload(eventName: string, rawProps: Record<string, unknown> | undefined): ValidatePayloadResult {
  const { props: sanitized } = sanitizeAnalyticsProps(rawProps);
  const parsed = analyticsPropsSchema.safeParse(sanitized);
  if (!parsed.success) return { valid: false, error: "invalid_properties" };
  return { valid: true, props: parsed.data };
}
