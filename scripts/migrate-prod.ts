/**
 * `npm run db:migrate:prod` — the one safe production migration entry
 * point (Phase 10 §3-4). Deliberately separate from `db:migrate`
 * (`drizzle-kit migrate`, which reads `drizzle.config.ts` and falls
 * back to a placeholder local connection string when `DATABASE_URL` is
 * unset — fine for local dev, never acceptable for a production run).
 *
 * This script:
 * - Requires a real `DATABASE_URL` — refuses to guess a target.
 * - Opens a single dedicated connection (`max: 1`; a migration run has
 *   no need for a pool).
 * - Applies only the already-generated, committed migration files in
 *   `src/lib/db/migrations`, tracked via Drizzle's own migrations
 *   table — this never resets, drops, or truncates anything; it only
 *   ever runs additive SQL that was already reviewed and committed.
 * - Fails loudly (non-zero exit, clear message) rather than silently
 *   continuing on any error.
 *
 * Never run automatically on every deploy/request — see
 * docs/PRODUCTION_OPERATIONS.md §7 for the full procedure (generate →
 * review → run this script → verify → roll out application code).
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("db:migrate:prod failed: DATABASE_URL is not set. Refusing to guess a connection target.");
    process.exit(1);
  }

  // Redacted confirmation of the target — never log the credentials
  // embedded in the connection string itself.
  let hostForLog = "(unparseable connection string)";
  try {
    hostForLog = new URL(databaseUrl).host;
  } catch {
    // Let the real connection attempt below surface the actual error.
  }
  console.log(`db:migrate:prod — applying pending migrations to ${hostForLog} ...`);

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
    console.log("db:migrate:prod — done. Migrations applied (or already up to date).");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("db:migrate:prod failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
