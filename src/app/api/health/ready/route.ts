import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5000;
let cached: { checkedAt: number; healthy: boolean } | null = null;

/**
 * Readiness — distinct from liveness (`/api/health`): actually checks
 * the database is reachable with a trivial `select 1`. Result is
 * cached for a few seconds (Phase 9 §37) so this can't be turned into
 * a way to hammer the database via repeated health checks (e.g. an
 * aggressive load balancer or uptime monitor polling every second).
 * Same minimal response shape as `/api/health` — no connection
 * string, no error detail, no stack trace.
 */
export async function GET() {
  const now = Date.now();
  if (!cached || now - cached.checkedAt > CACHE_TTL_MS) {
    let healthy = true;
    try {
      const db = await getDb();
      await db.execute(sql`select 1`);
    } catch {
      healthy = false;
    }
    cached = { checkedAt: now, healthy };
  }

  return NextResponse.json(
    { status: cached.healthy ? "ready" : "not_ready", timestamp: new Date().toISOString() },
    { status: cached.healthy ? 200 : 503 },
  );
}
