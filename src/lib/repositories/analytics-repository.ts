import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { analyticsEvents } from "@/lib/db/schema";
import type { AnalyticsEventName, AnalyticsProps } from "@/domain/analytics-event";

export type NewAnalyticsEventInput = {
  eventName: AnalyticsEventName;
  anonymousSessionId: string;
  leadId?: string;
  projectRequestId?: string;
  locale?: string;
  pagePath?: string;
  environment: string;
  safeProperties: AnalyticsProps;
};

export type AnalyticsEventRecord = NewAnalyticsEventInput & { id: string; createdAt: Date };

export type EventCountRow = { eventName: string; count: number };
export type DateRange = { start: Date; end: Date };
export type PropertyBreakdownRow = { value: string; sessionCount: number; leadAttributedSessionCount: number };

function toRecord(row: typeof analyticsEvents.$inferSelect): AnalyticsEventRecord {
  return {
    id: row.id,
    eventName: row.eventName as AnalyticsEventName,
    anonymousSessionId: row.anonymousSessionId,
    leadId: row.leadId ?? undefined,
    projectRequestId: row.projectRequestId ?? undefined,
    locale: row.locale ?? undefined,
    pagePath: row.pagePath ?? undefined,
    environment: row.environment,
    safeProperties: row.safeProperties as AnalyticsProps,
    createdAt: row.createdAt,
  };
}

export interface AnalyticsRepository {
  record(input: NewAnalyticsEventInput): Promise<void>;
  /** Links every event from an anonymous session to a newly created lead — never rewrites the event's original content/timestamp, only adds the association (Phase 9 §8). */
  attachSessionToLead(anonymousSessionId: string, leadId: string): Promise<number>;
  countByEventName(range: DateRange, environment: string): Promise<EventCountRow[]>;
  listBySession(anonymousSessionId: string): Promise<AnalyticsEventRecord[]>;
  listInRange(eventName: AnalyticsEventName, range: DateRange, environment: string): Promise<AnalyticsEventRecord[]>;
  /** Distinct sessions that fired this event at least once within range — the building block for funnel stage counts (each stage is itself a distinct-session count of one event name). */
  countSessionsWithEvent(eventName: AnalyticsEventName, range: DateRange, environment: string): Promise<number>;
  /** Same distinct-session count, additionally filtered to a single safeProperties value (e.g. serviceId = "web-design") — the building block for per-service/case-study/article conversion intelligence. */
  countSessionsWithEventProperty(eventName: AnalyticsEventName, propertyKey: string, propertyValue: string, range: DateRange, environment: string): Promise<number>;
  /** Distinct sessions across ALL events in range — the Overview "sessions" KPI. */
  countDistinctSessions(range: DateRange, environment: string): Promise<number>;
  /** Distinct sessions that fired EVERY one of the given event names (in any order) within range — the building block for multi-step funnel/comparison metrics like "sessions that both viewed AND started". */
  countSessionsWithAllEvents(eventNames: AnalyticsEventName[], range: DateRange, environment: string): Promise<number>;
  /**
   * Groups this event's distinct sessions by one safeProperties value
   * (e.g. serviceId) — the content conversion intelligence building
   * block (Phase 9 §14-16): "sessionCount" is how many distinct
   * sessions viewed/interacted with that id; "leadAttributedSessionCount"
   * is how many of those sessions were later linked to a real lead via
   * `attachSessionToLead`. This is correlation via session attribution,
   * never forced/invented attribution — a session only counts here if
   * it was genuinely linked.
   */
  groupDistinctSessionsByProperty(eventName: AnalyticsEventName, propertyKey: string, range: DateRange, environment: string): Promise<PropertyBreakdownRow[]>;
  latestEventAt(): Promise<Date | null>;
}

export class DrizzleAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async record(input: NewAnalyticsEventInput): Promise<void> {
    const db = await this.getDbInstance();
    await db.insert(analyticsEvents).values(input);
  }

  async attachSessionToLead(anonymousSessionId: string, leadId: string): Promise<number> {
    const db = await this.getDbInstance();
    const rows = await db
      .update(analyticsEvents)
      .set({ leadId })
      .where(and(eq(analyticsEvents.anonymousSessionId, anonymousSessionId), sql`${analyticsEvents.leadId} is null`))
      .returning({ id: analyticsEvents.id });
    return rows.length;
  }

  async countByEventName(range: DateRange, environment: string): Promise<EventCountRow[]> {
    const db = await this.getDbInstance();
    const rows = await db
      .select({ eventName: analyticsEvents.eventName, count: count() })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, range.start), lt(analyticsEvents.createdAt, range.end), eq(analyticsEvents.environment, environment)))
      .groupBy(analyticsEvents.eventName);
    return rows;
  }

  async countSessionsWithEvent(eventName: AnalyticsEventName, range: DateRange, environment: string): Promise<number> {
    const db = await this.getDbInstance();
    const [row] = await db
      .select({ value: sql<number>`count(distinct ${analyticsEvents.anonymousSessionId})` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, eventName),
          gte(analyticsEvents.createdAt, range.start),
          lt(analyticsEvents.createdAt, range.end),
          eq(analyticsEvents.environment, environment),
        ),
      );
    return Number(row?.value ?? 0);
  }

  async countSessionsWithEventProperty(
    eventName: AnalyticsEventName,
    propertyKey: string,
    propertyValue: string,
    range: DateRange,
    environment: string,
  ): Promise<number> {
    const db = await this.getDbInstance();
    const [row] = await db
      .select({ value: sql<number>`count(distinct ${analyticsEvents.anonymousSessionId})` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, eventName),
          sql`${analyticsEvents.safeProperties} ->> ${propertyKey} = ${propertyValue}`,
          gte(analyticsEvents.createdAt, range.start),
          lt(analyticsEvents.createdAt, range.end),
          eq(analyticsEvents.environment, environment),
        ),
      );
    return Number(row?.value ?? 0);
  }

  async countDistinctSessions(range: DateRange, environment: string): Promise<number> {
    const db = await this.getDbInstance();
    const [row] = await db
      .select({ value: sql<number>`count(distinct ${analyticsEvents.anonymousSessionId})` })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, range.start), lt(analyticsEvents.createdAt, range.end), eq(analyticsEvents.environment, environment)));
    return Number(row?.value ?? 0);
  }

  async countSessionsWithAllEvents(eventNames: AnalyticsEventName[], range: DateRange, environment: string): Promise<number> {
    if (eventNames.length === 0) return 0;
    const db = await this.getDbInstance();

    const perSession = db
      .select({
        sessionId: analyticsEvents.anonymousSessionId,
        distinctEvents: sql<number>`count(distinct ${analyticsEvents.eventName})`.as("distinct_events"),
      })
      .from(analyticsEvents)
      .where(
        and(
          inArray(analyticsEvents.eventName, eventNames),
          gte(analyticsEvents.createdAt, range.start),
          lt(analyticsEvents.createdAt, range.end),
          eq(analyticsEvents.environment, environment),
        ),
      )
      .groupBy(analyticsEvents.anonymousSessionId)
      .as("per_session");

    const [row] = await db
      .select({ value: count() })
      .from(perSession)
      .where(sql`${perSession.distinctEvents} = ${eventNames.length}`);
    return Number(row?.value ?? 0);
  }

  async groupDistinctSessionsByProperty(
    eventName: AnalyticsEventName,
    propertyKey: string,
    range: DateRange,
    environment: string,
  ): Promise<PropertyBreakdownRow[]> {
    const db = await this.getDbInstance();
    const valueExpr = sql<string>`${analyticsEvents.safeProperties} ->> ${propertyKey}`;
    const rows = await db
      .select({
        value: valueExpr,
        sessionCount: sql<number>`count(distinct ${analyticsEvents.anonymousSessionId})`,
        leadAttributedSessionCount: sql<number>`count(distinct case when ${analyticsEvents.leadId} is not null then ${analyticsEvents.anonymousSessionId} end)`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, eventName),
          gte(analyticsEvents.createdAt, range.start),
          lt(analyticsEvents.createdAt, range.end),
          eq(analyticsEvents.environment, environment),
        ),
      )
      // Grouping by the ordinal position of the "value" column, not by
      // re-referencing `valueExpr` — Postgres (and PGlite) binds each
      // appearance of a parameterized `sql` fragment to its own
      // placeholder, so a `->> $1` in SELECT and a `->> $6` in GROUP BY
      // are NOT recognized as the same expression even though the bound
      // value is identical, and the query is rejected. `GROUP BY 1` has
      // no such ambiguity.
      .groupBy(sql`1`);

    return rows
      .filter((r): r is typeof r & { value: string } => r.value != null)
      .map((r) => ({ value: r.value, sessionCount: Number(r.sessionCount), leadAttributedSessionCount: Number(r.leadAttributedSessionCount) }));
  }

  async listBySession(anonymousSessionId: string): Promise<AnalyticsEventRecord[]> {
    const db = await this.getDbInstance();
    const rows = await db.select().from(analyticsEvents).where(eq(analyticsEvents.anonymousSessionId, anonymousSessionId)).orderBy(desc(analyticsEvents.createdAt));
    return rows.map(toRecord);
  }

  async listInRange(eventName: AnalyticsEventName, range: DateRange, environment: string): Promise<AnalyticsEventRecord[]> {
    const db = await this.getDbInstance();
    const rows = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, eventName),
          gte(analyticsEvents.createdAt, range.start),
          lt(analyticsEvents.createdAt, range.end),
          eq(analyticsEvents.environment, environment),
        ),
      );
    return rows.map(toRecord);
  }

  async latestEventAt(): Promise<Date | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select({ createdAt: analyticsEvents.createdAt }).from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt)).limit(1);
    return row?.createdAt ?? null;
  }
}

let repository: AnalyticsRepository | null = null;

export function getAnalyticsRepository(): AnalyticsRepository {
  if (!repository) repository = new DrizzleAnalyticsRepository();
  return repository;
}

export function createTestAnalyticsRepository(getDbInstance: typeof getDb): AnalyticsRepository {
  return new DrizzleAnalyticsRepository(getDbInstance);
}
