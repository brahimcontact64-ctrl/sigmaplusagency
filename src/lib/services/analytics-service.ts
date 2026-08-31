import { getAnalyticsRepository, type AnalyticsRepository } from "@/lib/repositories/analytics-repository";
import { validateAnalyticsPayload } from "@/lib/analytics/sanitize";
import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/domain/analytics-event";
import { resolveAnalyticsEnvironment } from "@/lib/analytics/environment";

const ANALYTICS_EVENT_SET = new Set<string>(ANALYTICS_EVENTS);

export type RecordEventInput = {
  eventName: string;
  anonymousSessionId: string;
  leadId?: string;
  projectRequestId?: string;
  locale?: string;
  pagePath?: string;
  properties?: Record<string, unknown>;
};

export type RecordEventResult = { success: true } | { success: false; error: "unknown_event" | "invalid_properties" | "invalid_session" };

const MAX_PAGE_PATH_LENGTH = 300;

/**
 * The one place an analytics event is actually persisted — used both
 * by the client-facing ingestion route (`/api/analytics/event`) and
 * directly by server-side callers (e.g. the AI consultant route,
 * which already has a session id and no need for an HTTP round trip
 * to itself). See docs/ANALYTICS_MEASUREMENT_PLAN.md for the taxonomy
 * this validates against.
 */
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository = getAnalyticsRepository()) {}

  async recordEvent(input: RecordEventInput): Promise<RecordEventResult> {
    if (!ANALYTICS_EVENT_SET.has(input.eventName)) {
      return { success: false, error: "unknown_event" };
    }
    if (!input.anonymousSessionId || input.anonymousSessionId.length > 100) {
      return { success: false, error: "invalid_session" };
    }

    const validated = validateAnalyticsPayload(input.eventName, input.properties);
    if (!validated.valid) return { success: false, error: validated.error };

    await this.repo.record({
      eventName: input.eventName as AnalyticsEventName,
      anonymousSessionId: input.anonymousSessionId,
      leadId: input.leadId,
      projectRequestId: input.projectRequestId,
      locale: input.locale?.slice(0, 10),
      pagePath: input.pagePath?.slice(0, MAX_PAGE_PATH_LENGTH),
      environment: resolveAnalyticsEnvironment(),
      safeProperties: validated.props,
    });

    return { success: true };
  }

  /** Retroactively associates every prior event from an anonymous session with a newly created lead — never rewrites the events' own content (Phase 9 §8). */
  attachSessionToLead(anonymousSessionId: string, leadId: string) {
    return this.repo.attachSessionToLead(anonymousSessionId, leadId);
  }
}

let service: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!service) service = new AnalyticsService();
  return service;
}
