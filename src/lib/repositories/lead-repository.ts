import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { leads, projectRequests, leadActivities } from "@/lib/db/schema";
import type { Lead, LeadActivityType, LeadSource, Attribution, PreferredContactMethod } from "@/domain/lead";
import type { ProjectRequest } from "@/domain/project-request";

export type NewLeadInput = {
  publicReference: string;
  name: string;
  email: string;
  emailNormalized: string;
  phone?: string;
  phoneNormalized?: string;
  company?: string;
  country?: string;
  language: string;
  preferredContactMethod?: PreferredContactMethod;
  source: LeadSource;
} & Attribution;

export type NewProjectRequestInput = Omit<ProjectRequest, "id" | "createdAt">;

/**
 * The only place that talks to the database. Every write goes through
 * here — never directly from a server action or UI component — so the
 * persistence strategy (Postgres now, whatever later) stays swappable
 * without touching business logic.
 */
export interface LeadRepository {
  findByNormalizedIdentity(emailNormalized: string, phoneNormalized?: string): Promise<Lead | null>;
  createLead(input: NewLeadInput): Promise<Lead>;
  createProjectRequest(input: NewProjectRequestInput): Promise<ProjectRequest>;
  createActivity(leadId: string, type: LeadActivityType, metadata?: Record<string, unknown>): Promise<void>;
}

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
    preferredContactMethod: (row.preferredContactMethod as PreferredContactMethod) ?? undefined,
    source: row.source as LeadSource,
    status: row.status as Lead["status"],
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

/**
 * Accepts an optional db-getter so tests can inject an isolated
 * instance (see createTestDb in db/client.ts) instead of hitting the
 * shared dev database through the module-level singleton.
 */
export class DrizzleLeadRepository implements LeadRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async findByNormalizedIdentity(emailNormalized: string, phoneNormalized?: string): Promise<Lead | null> {
    const db = await this.getDbInstance();
    const byEmail = await db.select().from(leads).where(eq(leads.emailNormalized, emailNormalized)).limit(1);
    if (byEmail[0]) return toLead(byEmail[0]);

    if (phoneNormalized) {
      const byPhone = await db.select().from(leads).where(eq(leads.phoneNormalized, phoneNormalized)).limit(1);
      if (byPhone[0]) return toLead(byPhone[0]);
    }

    return null;
  }

  async createLead(input: NewLeadInput): Promise<Lead> {
    const db = await this.getDbInstance();
    const [row] = await db.insert(leads).values(input).returning();
    return toLead(row);
  }

  async createProjectRequest(input: NewProjectRequestInput): Promise<ProjectRequest> {
    const db = await this.getDbInstance();
    const [row] = await db.insert(projectRequests).values(input).returning();
    return toProjectRequest(row);
  }

  async createActivity(leadId: string, type: LeadActivityType, metadata?: Record<string, unknown>): Promise<void> {
    const db = await this.getDbInstance();
    await db.insert(leadActivities).values({ leadId, type, metadata });
  }
}

let repository: LeadRepository | null = null;

export function getLeadRepository(): LeadRepository {
  if (!repository) repository = new DrizzleLeadRepository();
  return repository;
}

/** Test-only: bypasses the production singleton entirely. */
export function createTestLeadRepository(getDbInstance: typeof getDb): LeadRepository {
  return new DrizzleLeadRepository(getDbInstance);
}
