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

/**
 * Defense-in-depth: strips anything URL-shaped that looks like a
 * Postgres connection string, in case a library ever embeds one
 * verbatim in an error message. Applied to every string this script
 * prints from an error, not just ones we expect to be safe.
 */
function redactConnectionStrings(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]");
}

/**
 * Diagnostic-only error unwrapping (added after a real incident: a
 * failed `db:migrate:prod` run only ever printed
 * "Failed query: CREATE SCHEMA IF NOT EXISTS \"drizzle\"" with no
 * further detail). That message comes from drizzle-orm's own
 * `DrizzleQueryError` (see node_modules/drizzle-orm/errors.js and
 * pg-core/session.js's `queryWithCache`), which wraps ANY error the
 * underlying `postgres` driver throws — a real Postgres error (with
 * `.code`/`.severity`), a network failure, anything — and puts the
 * real cause on `.cause` without ever including it in `.message`.
 * This function surfaces the safe, structured parts of that cause
 * without ever printing a raw connection string, password, or
 * anything from `.detail`/`.hint` (which, for other error types, can
 * occasionally embed the actual offending value — e.g. a constraint
 * violation's message repeats the offending row data).
 */
function describeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { value: redactConnectionStrings(String(error)) };
  }

  const details: Record<string, unknown> = {
    errorName: error.name,
    message: redactConnectionStrings(error.message),
  };

  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) {
    details.causeName = cause.name;
    details.causeMessage = redactConnectionStrings(cause.message);
    // Real Postgres client errors (from the `postgres` package) carry
    // these fields directly on the error object — never guaranteed to
    // exist (e.g. a plain network error like ECONNREFUSED won't have
    // them), so each is included only when actually present.
    const pgFields = cause as { code?: string; severity?: string; severity_local?: string };
    if (pgFields.code) details.postgresErrorCode = pgFields.code;
    if (pgFields.severity || pgFields.severity_local) details.postgresSeverity = pgFields.severity ?? pgFields.severity_local;
  } else if (cause !== undefined) {
    details.cause = redactConnectionStrings(String(cause));
  }

  return details;
}

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
  const databaseUrl = process.env.DATABASE_URL;
  let target: { host: string; port: string } = { host: "(unparseable)", port: "(unknown)" };
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      target = { host: parsed.hostname, port: parsed.port || "(default)" };
    } catch {
      // leave the "(unparseable)" placeholder — never attempt to log the raw string itself
    }
  }

  console.error("db:migrate:prod failed:", {
    hasDatabaseUrl: Boolean(databaseUrl),
    target,
    ...describeError(error),
  });
  process.exit(1);
});
