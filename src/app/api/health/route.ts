import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";

/**
 * Minimal liveness endpoint (Phase 9 §36) — proves the Node process is
 * up and serving requests, nothing more. Deliberately returns only
 * status/version/timestamp: never env vars, DB credentials, stack
 * traces, or any infrastructure detail. For an actual dependency check
 * (database reachability), see `/api/health/ready`.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  });
}
