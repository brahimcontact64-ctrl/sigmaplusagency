import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAnalyticsService } from "@/lib/services/analytics-service";
import { analyticsEventRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { log } from "@/lib/observability/logger";

const payloadSchema = z
  .object({
    eventName: z.string().min(1).max(60),
    anonymousSessionId: z.uuid(),
    locale: z.string().max(10).optional(),
    pagePath: z.string().max(300).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

/**
 * The one client-facing analytics ingestion boundary. Always responds
 * quickly and never surfaces a validation failure as a hard error to
 * the caller beyond a 4xx status — a rejected/malformed analytics
 * event must never look like (or be treated as) an application error
 * by the tiny fire-and-forget client in `track()` (Phase 9 §31: never
 * block conversion). Rate-limited per session and per IP — this
 * endpoint is a much softer target than a lead-creating form, but an
 * unbounded write amplifier into Postgres is still worth capping.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const ip = await getClientIp();
  if (!(await analyticsEventRateLimiter.check(`analytics:${parsed.data.anonymousSessionId}`)) || !(await analyticsEventRateLimiter.check(`analytics-ip:${ip}`))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await getAnalyticsService().recordEvent({
    eventName: parsed.data.eventName,
    anonymousSessionId: parsed.data.anonymousSessionId,
    locale: parsed.data.locale,
    pagePath: parsed.data.pagePath,
    properties: parsed.data.properties,
  });

  if (!result.success) {
    // Not logged as ERROR — a rejected event is expected, routine input
    // validation, not a system failure.
    log({ level: "INFO", event: "analytics_event_rejected", component: "analytics-ingest", errorCode: "VALIDATION_FAILED", reason: result.error });
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return new NextResponse(null, { status: 204 });
}
