export type DateRange = { start: Date; end: Date };

/**
 * [start, end) for "the last N days" ending at the current UTC day
 * boundary — Phase 9 §24's consistent-timezone-policy requirement.
 * Every dashboard query uses UTC day boundaries, never the server's or
 * a visitor's local timezone, so two people looking at "last 7 days"
 * on the same day always see the same window.
 */
export function lastNDaysRange(days: number, now: Date = new Date()): DateRange {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end };
}

/** The immediately preceding period of the same length — Phase 9 §24's "equal-length comparison periods only" rule; never compares a 7-day window against a 30-day one. */
export function comparisonRange(range: DateRange): DateRange {
  const length = range.end.getTime() - range.start.getTime();
  return { start: new Date(range.start.getTime() - length), end: range.start };
}

/** Never divides by zero. A zero/negative denominator returns `null` ("no data yet"), not Infinity or NaN — the UI renders that as an honest "—", never a fabricated percentage. */
export function safeRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  return numerator / denominator;
}

/** Same zero-denominator honesty for period-over-period change. */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}
