import { NextResponse, type NextRequest } from "next/server";
import { isValidCronAuthorization } from "@/lib/security/cron-auth";
import { seoJobRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { log } from "@/lib/observability/logger";
import { SEO_JOB_DISPATCH } from "@/lib/seo/jobs";
import { SEO_JOB_TYPES, isValidSeoJobType } from "@/domain/seo-job";

/**
 * The one protected trigger point for every SEO job (Phase 12 §3) —
 * suitable for a Vercel Cron entry (which sends a GET request) or any
 * other scheduler. Runs on Node (not Edge) since it eventually reaches
 * Postgres via Drizzle. See docs/SEO_STRATEGY.md §28 for the exact
 * Vercel cron configuration this is meant to be wired to — NOT
 * activated by this file alone; a `vercel.json` cron entry (or the
 * Vercel dashboard) still has to be added separately and explicitly.
 *
 * One job per request (`?job=<SEO_JOB_TYPE>`) rather than "run
 * everything due" — this keeps each cron entry's schedule (daily vs.
 * weekly) trivially declarative and each invocation's timeout/failure
 * blast radius limited to one job.
 */
async function handle(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!isValidCronAuthorization(authorization)) {
    log({ level: "WARN", event: "seo_cron_unauthorized", component: "seo-cron-endpoint" });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = await getClientIp();
  if (!(await seoJobRateLimiter.check(`seo-cron:${ip}`))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const jobParam = request.nextUrl.searchParams.get("job");
  if (!isValidSeoJobType(jobParam)) {
    return NextResponse.json({ error: "invalid_job", validJobTypes: SEO_JOB_TYPES }, { status: 400 });
  }

  const dispatch = SEO_JOB_DISPATCH[jobParam];
  const result = await dispatch("CRON");

  if (!result.dispatched) {
    // Not an error — a legitimate overlap-protection outcome (e.g. a
    // slow prior run still in flight). 409 Conflict is the honest
    // status for "this couldn't run right now because one is already
    // running," distinct from any real failure.
    return NextResponse.json({ jobType: jobParam, dispatched: false, reason: result.reason, runningSince: result.runningSince }, { status: 409 });
  }

  return NextResponse.json({ jobType: jobParam, dispatched: true, runId: result.runId, status: result.status, counts: result.counts });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
