import "server-only";
import type { AnalyticsEventName, AnalyticsProps } from "@/domain/analytics-event";
import type { TrackContext } from "./analytics";

/**
 * Server-side counterpart to `track()` in `./analytics` — route
 * handlers and server actions that already have a session id (or a
 * lead/project request id) should call this directly instead, so the
 * event is persisted with one function call rather than a self-HTTP
 * round trip. Kept in its own file so the client-importable
 * `analytics.ts` never references this module's dependency chain
 * (Drizzle/`postgres`) even via a dynamic import — see that file's
 * top comment for why that split is load-bearing, not stylistic.
 */
export async function trackServer(event: AnalyticsEventName, props?: AnalyticsProps, context?: TrackContext): Promise<void> {
  try {
    // Dynamically imported so the analytics/Drizzle stack behind it
    // isn't pulled in just by importing this file — same reasoning as
    // lead-service.ts's `attachAnalyticsSession`.
    const { getAnalyticsService } = await import("@/lib/services/analytics-service");
    await getAnalyticsService().recordEvent({
      eventName: event,
      anonymousSessionId: context?.anonymousSessionId ?? crypto.randomUUID(),
      leadId: context?.leadId,
      projectRequestId: context?.projectRequestId,
      properties: props,
    });
  } catch (error) {
    console.error("[analytics] trackServer failed (non-fatal):", error);
  }
}
