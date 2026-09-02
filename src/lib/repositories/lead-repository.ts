import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { leads, projectRequests, leadActivities } from "@/lib/db/schema";
import type { Lead, LeadActivityType, LeadSource, Attribution, PreferredContactMethod } from "@/domain/lead";
import type { ProjectRequest } from "@/domain/project-request";

export type NewLeadInput = {
  publicReference: string;
  name: string;
  /** Optional — a Project Builder submission may have only a phone. Never pass an empty string here; leave both undefined so the column is stored as NULL. */
  email?: string;
  emailNormalized?: string;
  phone?: string;
  phoneNormalized?: string;
  company?: string;
  country?: string;
  language: string;
  preferredContactMethod?: PreferredContactMethod;
  source: LeadSource;
} & Attribution;

export type IdentitySignals = { emailNormalized?: string; phoneNormalized?: string };
export type IdentityMatch = { lead: Lead; matchedVia: "phone" | "email" };

/** What a caller wants filled in on an already-matched lead — never what to overwrite. */
export type ContactBackfillInput = {
  email?: string;
  emailNormalized?: string;
  phone?: string;
  phoneNormalized?: string;
};

export type NewProjectRequestInput = Omit<ProjectRequest, "id" | "createdAt">;

/**
 * The only place that talks to the database. Every write goes through
 * here — never directly from a server action or UI component — so the
 * persistence strategy (Postgres now, whatever later) stays swappable
 * without touching business logic.
 */
export interface LeadRepository {
  /**
   * Identity resolution for dedup — phone takes priority over email
   * (see lead-service.ts's findOrCreateLead for the full rationale):
   * a normalized-phone match is checked and returned first; only when
   * no phone was given or it matched nothing does a normalized-email
   * match get checked. Never checks both and merges — if phone and
   * email would each match a DIFFERENT existing lead, the phone match
   * wins and the email-matched lead is never touched, by construction
   * (this function returns as soon as it finds the phone match).
   */
  resolveIdentity(signals: IdentitySignals): Promise<IdentityMatch | null>;
  /**
   * Fills in a genuinely-missing email and/or phone on an existing
   * lead — never overwrites a value the lead already has (each column
   * is only ever set via `COALESCE(existing, new)`), and never
   * attributes an email/phone that already identifies a DIFFERENT
   * existing lead (checked first; a conflicting value is silently
   * dropped from the patch rather than applied, so two lead rows can
   * never end up sharing the same normalized email or phone). Returns
   * `null` (not the lead) when nothing was actually written, so the
   * caller knows whether to re-read.
   */
  backfillContactInfo(leadId: string, patch: ContactBackfillInput): Promise<Lead | null>;
  /** Public-reference lookup (the `SP-XXXXXX` code already shown to the visitor) — used only by the optional progressive-qualification pathway to find which lead a follow-up update belongs to, never for anything requiring authentication. */
  findByPublicReference(reference: string): Promise<Lead | null>;
  createLead(input: NewLeadInput): Promise<Lead>;
  createProjectRequest(input: NewProjectRequestInput): Promise<ProjectRequest>;
  getProjectRequestById(id: string): Promise<ProjectRequest | null>;
  /**
   * Project Builder v2 §3 — attaches additional, later-supplied
   * qualification to an *existing* project request row. Never creates
   * a new row; the caller (lead-service's `attachOptionalQualification`)
   * is responsible for verifying the request belongs to the lead
   * identified by the public reference before calling this.
   */
  updateProjectRequestQualification(
    id: string,
    patch: Pick<ProjectRequest, "goals" | "capabilities" | "platforms" | "structuredBrief">,
  ): Promise<ProjectRequest | null>;
  createActivity(leadId: string, type: LeadActivityType, metadata?: Record<string, unknown>): Promise<void>;
}

function toLead(row: typeof leads.$inferSelect): Lead {
  return {
    id: row.id,
    publicReference: row.publicReference,
    name: row.name,
    email: row.email ?? undefined,
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
    budgetCurrency: (row.budgetCurrency as ProjectRequest["budgetCurrency"]) ?? undefined,
    budgetMinAmount: row.budgetMinAmount ?? undefined,
    budgetMaxAmount: row.budgetMaxAmount ?? undefined,
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

  async resolveIdentity(signals: IdentitySignals): Promise<IdentityMatch | null> {
    const db = await this.getDbInstance();

    if (signals.phoneNormalized) {
      const [row] = await db.select().from(leads).where(eq(leads.phoneNormalized, signals.phoneNormalized)).limit(1);
      if (row) return { lead: toLead(row), matchedVia: "phone" };
    }

    if (signals.emailNormalized) {
      const [row] = await db.select().from(leads).where(eq(leads.emailNormalized, signals.emailNormalized)).limit(1);
      if (row) return { lead: toLead(row), matchedVia: "email" };
    }

    return null;
  }

  async backfillContactInfo(leadId: string, patch: ContactBackfillInput): Promise<Lead | null> {
    const db = await this.getDbInstance();

    // Conflict avoidance: if this email/phone already identifies a
    // DIFFERENT existing lead, drop it from the patch rather than
    // attribute it here too — this is what keeps a phone-match and an
    // email-match that point at two different people from ever quietly
    // sharing an identity signal (see the interface doc above).
    let email = patch.email;
    let emailNormalized = patch.emailNormalized;
    if (emailNormalized) {
      const [conflict] = await db.select({ id: leads.id }).from(leads).where(eq(leads.emailNormalized, emailNormalized)).limit(1);
      if (conflict && conflict.id !== leadId) {
        email = undefined;
        emailNormalized = undefined;
      }
    }

    let phone = patch.phone;
    let phoneNormalized = patch.phoneNormalized;
    if (phoneNormalized) {
      const [conflict] = await db.select({ id: leads.id }).from(leads).where(eq(leads.phoneNormalized, phoneNormalized)).limit(1);
      if (conflict && conflict.id !== leadId) {
        phone = undefined;
        phoneNormalized = undefined;
      }
    }

    if (!email && !phone) return null;

    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    // COALESCE is the actual guarantee against overwriting a known
    // value — belt-and-suspenders alongside the caller (lead-service.ts)
    // only ever calling this when it already sees the column is empty.
    if (email && emailNormalized) {
      setValues.email = sql`coalesce(${leads.email}, ${email})`;
      setValues.emailNormalized = sql`coalesce(${leads.emailNormalized}, ${emailNormalized})`;
    }
    if (phone && phoneNormalized) {
      setValues.phone = sql`coalesce(${leads.phone}, ${phone})`;
      setValues.phoneNormalized = sql`coalesce(${leads.phoneNormalized}, ${phoneNormalized})`;
    }

    const [row] = await db.update(leads).set(setValues).where(eq(leads.id, leadId)).returning();
    return row ? toLead(row) : null;
  }

  async findByPublicReference(reference: string): Promise<Lead | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(leads).where(eq(leads.publicReference, reference)).limit(1);
    return row ? toLead(row) : null;
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

  async getProjectRequestById(id: string): Promise<ProjectRequest | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(projectRequests).where(eq(projectRequests.id, id)).limit(1);
    return row ? toProjectRequest(row) : null;
  }

  async updateProjectRequestQualification(
    id: string,
    patch: Pick<ProjectRequest, "goals" | "capabilities" | "platforms" | "structuredBrief">,
  ): Promise<ProjectRequest | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .update(projectRequests)
      .set({ goals: patch.goals, capabilities: patch.capabilities, platforms: patch.platforms, structuredBrief: patch.structuredBrief })
      .where(eq(projectRequests.id, id))
      .returning();
    return row ? toProjectRequest(row) : null;
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
