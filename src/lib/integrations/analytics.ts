import { ANALYTICS_EVENTS, type AnalyticsEventName, type AnalyticsProps } from "@/domain/analytics-event";

/**
 * Client-side `track()` — Phase 9 §2 unifies this with the canonical
 * taxonomy in `@/domain/analytics-event` instead of maintaining a
 * second, competing event list.
 *
 * Server callers (route handlers, server actions) must use
 * `trackServer()` from `./analytics-server` instead of this function.
 * That's a real, load-bearing split, not just style: this file is
 * imported directly by client components (contact-form.tsx,
 * project-builder.tsx, ...), and Next's client webpack build resolves
 * *every* import specifier reachable from a client module — including
 * ones inside a `typeof window === "undefined"` branch, and even a
 * dynamic `import()` — to build its code-split chunks. A server-only
 * persistence path (which pulls in Drizzle/`postgres`, and transitively
 * Node builtins like `tls`/`perf_hooks`) living in *this* file breaks
 * the client build even though that branch would never run in a
 * browser. Keeping it in a separate file that this one never
 * references (not even dynamically) is what actually keeps the
 * client bundle clean.
 *
 * Never throws, never blocks — a tracking failure must never surface
 * as (or cause) an application failure. See
 * docs/ANALYTICS_MEASUREMENT_PLAN.md for what each event means.
 */
export { ANALYTICS_EVENTS };
export type { AnalyticsEventName as AnalyticsEvent, AnalyticsProps };

export type TrackContext = {
  /**
   * Callers that already own a stable, non-PII session identifier
   * (e.g. the AI consultant's own `sessionId`) should pass it here so
   * funnel events land in the same session as the rest of that
   * visitor's activity. Omit only when no such id exists.
   */
  anonymousSessionId?: string;
  leadId?: string;
  projectRequestId?: string;
};

const DEV_LOG = process.env.NODE_ENV !== "production";

export function track(event: AnalyticsEventName, props?: AnalyticsProps, context?: TrackContext): void {
  if (DEV_LOG) console.log("[analytics]", event, props ?? {});

  if (typeof window === "undefined") {
    // A server-context call to the client-only `track()` — most likely
    // a call site that should be using `trackServer()` instead. Silent
    // no-op rather than a thrown error: tracking must never break the
    // caller, and this still gets logged above in development.
    return;
  }

  void trackClient(event, props, context);
}

async function trackClient(event: AnalyticsEventName, props: AnalyticsProps | undefined, context: TrackContext | undefined): Promise<void> {
  try {
    const { hasAnalyticsConsent } = await import("@/lib/consent/consent-store");
    if (!hasAnalyticsConsent()) return;

    const { getOrCreateAnalyticsSessionId } = await import("@/lib/analytics/session-id");
    const anonymousSessionId = context?.anonymousSessionId ?? getOrCreateAnalyticsSessionId();

    const body = JSON.stringify({
      eventName: event,
      anonymousSessionId,
      locale: document.documentElement.lang || undefined,
      pagePath: window.location.pathname,
      properties: props,
    });

    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Fire-and-forget: a network hiccup or a browser blocking the
    // request (ad blockers commonly target analytics-shaped calls)
    // must never surface to the caller.
  }
}
