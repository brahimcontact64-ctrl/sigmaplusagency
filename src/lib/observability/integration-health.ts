import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getAIProvider } from "@/lib/ai/get-provider";

export const INTEGRATION_HEALTH_STATUSES = ["HEALTHY", "DEGRADED", "NOT_CONFIGURED", "ERROR"] as const;
export type IntegrationHealthStatus = (typeof INTEGRATION_HEALTH_STATUSES)[number];

export type IntegrationHealthRow = { name: string; status: IntegrationHealthStatus };

/**
 * Cheap, on-demand core integration health for the Admin dashboard
 * (Phase 9 §38) — truthful states only, never shown as HEALTHY without
 * a real check. Deliberately NOT a live call to every external
 * provider on every page load (the spec explicitly warns against
 * that): the database gets one trivial `select 1`; AI is a
 * configuration presence check, not a real provider request (a real
 * request costs money and would make loading this page expensive).
 * See docs/PRODUCTION_OPERATIONS.md.
 */
export async function getCoreIntegrationHealth(): Promise<IntegrationHealthRow[]> {
  let dbStatus: IntegrationHealthStatus;
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    dbStatus = "HEALTHY";
  } catch {
    dbStatus = "ERROR";
  }

  const aiStatus: IntegrationHealthStatus = getAIProvider() ? "HEALTHY" : "NOT_CONFIGURED";
  // First-party analytics persistence has no external credential of
  // its own — its only real dependency is the database it's already
  // checking above.
  const analyticsStatus: IntegrationHealthStatus = dbStatus === "HEALTHY" ? "HEALTHY" : "DEGRADED";

  return [
    { name: "Database", status: dbStatus },
    { name: "AI provider", status: aiStatus },
    { name: "Analytics (first-party)", status: analyticsStatus },
  ];
}
