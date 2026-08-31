import path from "node:path";
import { mkdirSync } from "node:fs";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * postgres-js and pglite are both genuinely PostgreSQL underneath, and
 * expose the same Drizzle query-builder surface (`.select()`,
 * `.insert().values().returning()`, etc.) — the only thing that
 * actually differs between `PostgresJsDatabase` and `PgliteDatabase`
 * is their raw driver result-shape generic, which nothing in this
 * codebase inspects directly. This shared type lets the repository
 * layer stay dialect-agnostic instead of forking per driver.
 */
export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Dialect selection, made explicit rather than silent:
 *
 * - `DATABASE_URL` set → real PostgreSQL (Supabase or otherwise) via
 *   postgres-js. This is what production must use.
 * - `DATABASE_URL` unset in production → throw immediately. We never
 *   fall back to an in-memory or embedded database in production; a
 *   misconfigured deploy must fail loudly at startup, not silently
 *   accept leads it can't actually keep.
 * - `DATABASE_URL` unset outside production → PGlite, a real embedded
 *   Postgres (WASM), file-persisted under `.data/`. This is genuine
 *   SQL persistence for local development and tests, not a mock — the
 *   schema, constraints, and migrations are identical to production's.
 */

async function createPostgresDb(databaseUrl: string): Promise<AppDatabase> {
  const [{ drizzle }, { default: postgres }] = await Promise.all([
    import("drizzle-orm/postgres-js"),
    import("postgres"),
  ]);
  const client = postgres(databaseUrl, { max: 5 });
  return drizzle(client, { schema }) as unknown as AppDatabase;
}

async function createPgliteDb(dataDir: string): Promise<AppDatabase> {
  const [{ drizzle }, { PGlite }, { migrate }] = await Promise.all([
    import("drizzle-orm/pglite"),
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  if (dataDir !== "memory://") {
    mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  const migrationsFolder = path.join(process.cwd(), "src", "lib", "db", "migrations");
  await migrate(db, { migrationsFolder });
  return db as unknown as AppDatabase;
}

let dbPromise: Promise<AppDatabase> | null = null;

export function getDb(): Promise<AppDatabase> {
  if (dbPromise) return dbPromise;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    dbPromise = createPostgresDb(databaseUrl);
    return dbPromise;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is not configured. Refusing to start a production database connection " +
        "with an embedded fallback — configure DATABASE_URL or leads would silently not be saved.",
    );
  }

  // Reconfirmed explicitly in Phase 7 (see docs/SIGMA_PLUS_MASTER_PLAN.md
  // §0.1): every repository in this codebase — leads, project requests,
  // lead activities, admin users, lead notes, admin audit logs, site
  // settings *writes*, AI conversations/messages — constructs against
  // this exact function (see each repository's `getDbInstance = getDb`
  // constructor default). There is no separate or parallel persistence
  // path anywhere, so this one throw is the whole production guarantee.
  // The only place that *catches* a failure from this function and
  // degrades gracefully is src/lib/effective-config.ts's public contact
  // info read — that is a cosmetic display fallback (which WhatsApp
  // number to show), never a persistence decision, and it never writes
  // anything. Do not add another catch-and-fall-back around getDb() for
  // an actual write path; a failed write must surface as a failure.
  //
  // Overridable so a test run (or, historically, an E2E run before that
  // policy was removed — see the durable "no browser E2E" project rule)
  // uses its own on-disk database instead of silently writing into the
  // same directory a developer is using for manual testing. The test
  // suite itself never takes this branch — it always uses createTestDb().
  const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite-dev");
  dbPromise = createPgliteDb(dataDir);
  return dbPromise;
}

/** Test-only: an isolated, in-memory PGlite instance so tests never share or pollute the dev database. */
export async function createTestDb() {
  return createPgliteDb("memory://");
}
