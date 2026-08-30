import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { leads, projectRequests, leadActivities, leadNotes } from "@/lib/db/schema";
import type { Lead, LeadActivityType, LeadSource, LeadStatus } from "@/domain/lead";
import type { ProjectRequest } from "@/domain/project-request";
import type { LeadNote } from "@/domain/lead-note";

function toLead(row: typeof leads.$inferSelect): Lead {
  return {
    id: row.id,
    publicReference: row.publicReference,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    country: row.country ?? undefined,
    language: row.language,
    preferredContactMethod: (row.preferredContactMethod as Lead["preferredContactMethod"]) ?? undefined,
    source: row.source as LeadSource,
    status: row.status as LeadStatus,
    landingPage: row.landingPage ?? undefined,
    referrer: row.referrer ?? undefined,
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    utmContent: row.utmContent ?? undefined,
    utmTerm: row.utmTerm ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProjectRequest(row: typeof projectRequests.$inferSelect): ProjectRequest {
  return {
    id: row.id,
    leadId: row.leadId,
    projectType: row.projectType as ProjectRequest["projectType"],
    goals: row.goals as ProjectRequest["goals"],
    capabilities: row.capabilities as ProjectRequest["capabilities"],
    platforms: row.platforms as ProjectRequest["platforms"],
    businessState: row.businessState as ProjectRequest["businessState"],
    currentWebsite: row.currentWebsite ?? undefined,
    timeline: row.timeline as ProjectRequest["timeline"],
    budgetRange: row.budgetRange,
    message: row.message ?? undefined,
    structuredBrief: row.structuredBrief as ProjectRequest["structuredBrief"],
    locale: row.locale,
    createdAt: row.createdAt,
  };
}

function toNote(row: typeof leadNotes.$inferSelect): LeadNote {
  return {
    id: row.id,
    leadId: row.leadId,
    authorId: row.authorId ?? undefined,
    authorName: row.authorName,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export type LeadActivityRecord = {
  id: string;
  leadId: string;
  type: LeadActivityType;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

function toActivity(row: typeof leadActivities.$inferSelect): LeadActivityRecord {
  return {
    id: row.id,
    leadId: row.leadId,
    type: row.type as LeadActivityType,
    metadata: row.metadata ?? undefined,
    createdAt: row.createdAt,
  };
}

export type LeadListFilters = {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  projectType?: string;
  language?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type LeadListSort = {
  field: "createdAt" | "updatedAt" | "name" | "status";
  direction: "asc" | "desc";
};

export type LeadListItem = Lead & { latestProjectType?: string; latestBudgetRange?: string; lastActivityAt?: Date };

export type LeadListResult = {
  items: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type DashboardMetrics = {
  totalLeads: number;
  newLeadsLast7Days: number;
  totalProjectRequests: number;
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  leadsByLanguage: { language: string; count: number }[];
  projectsByType: { projectType: string; count: number }[];
  recentLeads: Lead[];
  recentActivities: (LeadActivityRecord & { leadReference: string; leadName: string })[];
};

export interface CrmRepository {
  listLeads(filters: LeadListFilters, sort: LeadListSort, page: number, pageSize: number): Promise<LeadListResult>;
  getLeadById(id: string): Promise<Lead | null>;
  getProjectRequestsForLead(leadId: string): Promise<ProjectRequest[]>;
  getActivitiesForLead(leadId: string): Promise<LeadActivityRecord[]>;
  getNotesForLead(leadId: string): Promise<LeadNote[]>;
  getRecentActivities(limit: number): Promise<(LeadActivityRecord & { leadReference: string; leadName: string })[]>;
  listActivities(
    page: number,
    pageSize: number,
  ): Promise<{ items: (LeadActivityRecord & { leadReference: string; leadName: string })[]; total: number }>;
  listProjectRequests(
    page: number,
    pageSize: number,
  ): Promise<{ items: (ProjectRequest & { leadReference: string; leadName: string; leadStatus: LeadStatus })[]; total: number }>;
  updateLeadStatus(leadId: string, newStatus: LeadStatus): Promise<Lead | null>;
  createActivity(leadId: string, type: LeadActivityType, metadata?: Record<string, unknown>): Promise<void>;
  createNote(leadId: string, authorId: string | undefined, authorName: string, note: string): Promise<LeadNote>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
  listAllLeadsForPipeline(limit: number): Promise<LeadListItem[]>;
}

export class DrizzleCrmRepository implements CrmRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  private buildWhere(filters: LeadListFilters) {
    const conditions = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(leads.publicReference, term),
          ilike(leads.name, term),
          ilike(leads.email, term),
          ilike(leads.phone, term),
          ilike(leads.company, term),
        ),
      );
    }
    if (filters.status) conditions.push(eq(leads.status, filters.status));
    if (filters.source) conditions.push(eq(leads.source, filters.source));
    if (filters.language) conditions.push(eq(leads.language, filters.language));
    if (filters.dateFrom) conditions.push(gte(leads.createdAt, filters.dateFrom));
    if (filters.dateTo) conditions.push(lte(leads.createdAt, filters.dateTo));
    if (filters.projectType) {
      conditions.push(
        sql`exists (select 1 from ${projectRequests} where ${projectRequests.leadId} = ${leads.id} and ${projectRequests.projectType} = ${filters.projectType})`,
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async listLeads(
    filters: LeadListFilters,
    sort: LeadListSort,
    page: number,
    pageSize: number,
  ): Promise<LeadListResult> {
    const db = await this.getDbInstance();
    const where = this.buildWhere(filters);

    const sortColumn = {
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      name: leads.name,
      status: leads.status,
    }[sort.field];
    const orderBy = sort.direction === "asc" ? sortColumn : desc(sortColumn);

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(leads)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(leads).where(where),
    ]);

    if (rows.length === 0) return { items: [], total, page, pageSize };

    const leadIds = rows.map((r) => r.id);

    // Batched per-lead extras (latest project type, last activity) rather
    // than an N+1 query per row in the page.
    const [latestRequests, lastActivities] = await Promise.all([
      db
        .select({ leadId: projectRequests.leadId, projectType: projectRequests.projectType, createdAt: projectRequests.createdAt })
        .from(projectRequests)
        .where(inArray(projectRequests.leadId, leadIds))
        .orderBy(desc(projectRequests.createdAt)),
      db
        .select({ leadId: leadActivities.leadId, createdAt: leadActivities.createdAt })
        .from(leadActivities)
        .where(inArray(leadActivities.leadId, leadIds))
        .orderBy(desc(leadActivities.createdAt)),
    ]);

    const latestProjectTypeByLead = new Map<string, string>();
    for (const r of latestRequests) {
      if (!latestProjectTypeByLead.has(r.leadId)) latestProjectTypeByLead.set(r.leadId, r.projectType);
    }
    const lastActivityByLead = new Map<string, Date>();
    for (const a of lastActivities) {
      if (!lastActivityByLead.has(a.leadId)) lastActivityByLead.set(a.leadId, a.createdAt);
    }

    const items: LeadListItem[] = rows.map((row) => ({
      ...toLead(row),
      latestProjectType: latestProjectTypeByLead.get(row.id),
      lastActivityAt: lastActivityByLead.get(row.id),
    }));

    return { items, total, page, pageSize };
  }

  async listAllLeadsForPipeline(limit: number): Promise<LeadListItem[]> {
    const db = await this.getDbInstance();
    const rows = await db.select().from(leads).orderBy(desc(leads.updatedAt)).limit(limit);
    if (rows.length === 0) return [];

    const leadIds = rows.map((r) => r.id);
    const latestRequests = await db
      .select({ leadId: projectRequests.leadId, projectType: projectRequests.projectType, budgetRange: projectRequests.budgetRange, createdAt: projectRequests.createdAt })
      .from(projectRequests)
      .where(inArray(projectRequests.leadId, leadIds))
      .orderBy(desc(projectRequests.createdAt));

    const byLead = new Map<string, { projectType: string; budgetRange: string }>();
    for (const r of latestRequests) {
      if (!byLead.has(r.leadId)) byLead.set(r.leadId, { projectType: r.projectType, budgetRange: r.budgetRange });
    }

    return rows.map((row) => ({
      ...toLead(row),
      latestProjectType: byLead.get(row.id)?.projectType,
      latestBudgetRange: byLead.get(row.id)?.budgetRange,
    }));
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return row ? toLead(row) : null;
  }

  async getProjectRequestsForLead(leadId: string): Promise<ProjectRequest[]> {
    const db = await this.getDbInstance();
    const rows = await db
      .select()
      .from(projectRequests)
      .where(eq(projectRequests.leadId, leadId))
      .orderBy(desc(projectRequests.createdAt));
    return rows.map(toProjectRequest);
  }

  async getActivitiesForLead(leadId: string): Promise<LeadActivityRecord[]> {
    const db = await this.getDbInstance();
    const rows = await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
    return rows.map(toActivity);
  }

  async getNotesForLead(leadId: string): Promise<LeadNote[]> {
    const db = await this.getDbInstance();
    const rows = await db.select().from(leadNotes).where(eq(leadNotes.leadId, leadId)).orderBy(desc(leadNotes.createdAt));
    return rows.map(toNote);
  }

  async getRecentActivities(limit: number) {
    const db = await this.getDbInstance();
    const rows = await db
      .select({
        id: leadActivities.id,
        leadId: leadActivities.leadId,
        type: leadActivities.type,
        metadata: leadActivities.metadata,
        createdAt: leadActivities.createdAt,
        leadReference: leads.publicReference,
        leadName: leads.name,
      })
      .from(leadActivities)
      .innerJoin(leads, eq(leadActivities.leadId, leads.id))
      .orderBy(desc(leadActivities.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      leadId: row.leadId,
      type: row.type as LeadActivityType,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
      leadReference: row.leadReference,
      leadName: row.leadName,
    }));
  }

  async listActivities(page: number, pageSize: number) {
    const db = await this.getDbInstance();
    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select({
          id: leadActivities.id,
          leadId: leadActivities.leadId,
          type: leadActivities.type,
          metadata: leadActivities.metadata,
          createdAt: leadActivities.createdAt,
          leadReference: leads.publicReference,
          leadName: leads.name,
        })
        .from(leadActivities)
        .innerJoin(leads, eq(leadActivities.leadId, leads.id))
        .orderBy(desc(leadActivities.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(leadActivities),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        leadId: row.leadId,
        type: row.type as LeadActivityType,
        metadata: row.metadata ?? undefined,
        createdAt: row.createdAt,
        leadReference: row.leadReference,
        leadName: row.leadName,
      })),
      total,
    };
  }

  async listProjectRequests(page: number, pageSize: number) {
    const db = await this.getDbInstance();
    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select({
          id: projectRequests.id,
          leadId: projectRequests.leadId,
          projectType: projectRequests.projectType,
          goals: projectRequests.goals,
          capabilities: projectRequests.capabilities,
          platforms: projectRequests.platforms,
          businessState: projectRequests.businessState,
          currentWebsite: projectRequests.currentWebsite,
          timeline: projectRequests.timeline,
          budgetRange: projectRequests.budgetRange,
          message: projectRequests.message,
          structuredBrief: projectRequests.structuredBrief,
          locale: projectRequests.locale,
          createdAt: projectRequests.createdAt,
          leadReference: leads.publicReference,
          leadName: leads.name,
          leadStatus: leads.status,
        })
        .from(projectRequests)
        .innerJoin(leads, eq(projectRequests.leadId, leads.id))
        .orderBy(desc(projectRequests.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(projectRequests),
    ]);

    return {
      items: rows.map((row) => ({
        ...toProjectRequest(row),
        leadReference: row.leadReference,
        leadName: row.leadName,
        leadStatus: row.leadStatus as LeadStatus,
      })),
      total,
    };
  }

  async updateLeadStatus(leadId: string, newStatus: LeadStatus): Promise<Lead | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .update(leads)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning();
    return row ? toLead(row) : null;
  }

  async createActivity(leadId: string, type: LeadActivityType, metadata?: Record<string, unknown>): Promise<void> {
    const db = await this.getDbInstance();
    await db.insert(leadActivities).values({ leadId, type, metadata });
  }

  async createNote(leadId: string, authorId: string | undefined, authorName: string, note: string): Promise<LeadNote> {
    const db = await this.getDbInstance();
    const [row] = await db.insert(leadNotes).values({ leadId, authorId, authorName, note }).returning();
    return toNote(row);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const db = await this.getDbInstance();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      [{ value: totalLeads }],
      [{ value: newLeadsLast7Days }],
      [{ value: totalProjectRequests }],
      leadsByStatus,
      leadsBySource,
      leadsByLanguage,
      projectsByType,
      recentLeadRows,
      recentActivities,
    ] = await Promise.all([
      db.select({ value: count() }).from(leads),
      db.select({ value: count() }).from(leads).where(gte(leads.createdAt, sevenDaysAgo)),
      db.select({ value: count() }).from(projectRequests),
      db.select({ status: leads.status, count: count() }).from(leads).groupBy(leads.status),
      db.select({ source: leads.source, count: count() }).from(leads).groupBy(leads.source),
      db.select({ language: leads.language, count: count() }).from(leads).groupBy(leads.language),
      db.select({ projectType: projectRequests.projectType, count: count() }).from(projectRequests).groupBy(projectRequests.projectType),
      db.select().from(leads).orderBy(desc(leads.createdAt)).limit(8),
      this.getRecentActivities(15),
    ]);

    return {
      totalLeads,
      newLeadsLast7Days,
      totalProjectRequests,
      leadsByStatus,
      leadsBySource,
      leadsByLanguage,
      projectsByType,
      recentLeads: recentLeadRows.map(toLead),
      recentActivities,
    };
  }
}

let repository: CrmRepository | null = null;

export function getCrmRepository(): CrmRepository {
  if (!repository) repository = new DrizzleCrmRepository();
  return repository;
}

export function createTestCrmRepository(getDbInstance: typeof getDb): CrmRepository {
  return new DrizzleCrmRepository(getDbInstance);
}
