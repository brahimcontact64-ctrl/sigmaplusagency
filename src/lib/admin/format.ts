/**
 * All timestamps are stored in UTC (Postgres `timestamp with time zone`,
 * always written via `new Date()`). Displaying them pinned to UTC
 * (rather than converting to the admin's browser timezone) keeps every
 * viewer looking at the same wall-clock value and avoids a
 * server/client hydration mismatch, since these are server components.
 */
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatDateTime(date: Date): string {
  return `${dateTimeFormatter.format(date)} UTC`;
}

export function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDateTime(date);
}

const ACTIVITY_LABELS: Record<string, (metadata?: Record<string, unknown>) => string> = {
  lead_created: () => "Lead created",
  contact_form_submitted: () => "Contact form submitted",
  project_request_submitted: (m) => `Project request submitted${m?.projectType ? ` (${m.projectType})` : ""}`,
  whatsapp_handoff_clicked: () => "WhatsApp handoff clicked",
  status_changed: (m) => `Status changed: ${m?.previousStatus ?? "?"} → ${m?.newStatus ?? "?"}`,
  internal_note_added: () => "Internal note added",
  identity_conflict_detected: (m) => {
    const parts = [m?.hasPhoneConflict && "phone", m?.hasEmailConflict && "email"].filter(Boolean);
    return `Identity conflict detected during ${m?.source ?? "submission"} (${parts.join(" & ") || "identity"} pointed at a different existing lead — not merged)`;
  },
};

export function activityLabel(type: string, metadata?: Record<string, unknown>): string {
  return ACTIVITY_LABELS[type]?.(metadata) ?? type;
}

/** `null` means "no denominator data yet" (see `safeRate`) — rendered as an honest em dash, never 0% or NaN%. */
export function formatPercent(rate: number | null, fractionDigits = 1): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(fractionDigits)}%`;
}
