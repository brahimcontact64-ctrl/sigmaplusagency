import type { ErrorCode } from "@/domain/error-codes";

export const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogEntry = {
  level: LogLevel;
  /** A short, stable event name, e.g. "lead_persistence_failed" — not a free-text sentence. */
  event: string;
  /** Which subsystem logged this, e.g. "lead-service", "ai-consultant", "analytics-ingest". */
  component: string;
  errorCode?: ErrorCode;
  correlationId?: string;
  /** Any additional safe, already-vetted identifiers/counts — never raw user content. Redacted defensively anyway, see `redact()`. */
  [key: string]: unknown;
};

/**
 * Centralized structured logging (Phase 9 §32-33). Every entry is one
 * JSON object per line to `console.*` — the format every major hosting
 * platform (Vercel, Railway, etc.) already captures and can index
 * without a separate logging service. No external log provider is
 * required for this to be useful; swapping in one later means adding
 * an adapter here, not changing every call site.
 *
 * `redact()` is defense-in-depth on top of "never pass these fields in
 * the first place" — the real discipline is at each call site (see
 * `toFailure()` in lead-service.ts for the original pattern this
 * generalizes), but a field named like a secret is stripped
 * automatically regardless of who logged it.
 */
const REDACTED_KEY_PATTERN = /password|token|secret|apikey|api_key|authorization|jwt|cookie/i;

function redact(entry: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    safe[key] = REDACTED_KEY_PATTERN.test(key) ? "[redacted]" : value;
  }
  return safe;
}

// Wrapped in arrow functions rather than referencing console.debug/
// console.error etc. directly — a bare method reference loses its
// `this` binding to the `console` object, which breaks in some
// runtimes when called detached from it.
const CONSOLE_BY_LEVEL: Record<LogLevel, (line: string) => void> = {
  DEBUG: (line) => console.debug(line),
  INFO: (line) => console.info(line),
  WARN: (line) => console.warn(line),
  ERROR: (line) => console.error(line),
};

export function log(entry: LogEntry): void {
  const { level, ...rest } = entry;
  const payload = { timestamp: new Date().toISOString(), level, ...redact(rest) };
  CONSOLE_BY_LEVEL[level](JSON.stringify(payload));
}

export function newCorrelationId(): string {
  return crypto.randomUUID();
}
