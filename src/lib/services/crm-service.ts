import { getCrmRepository, type CrmRepository, type LeadListFilters, type LeadListSort, type LeadListItem } from "@/lib/repositories/crm-repository";
import { getAuditLogRepository, type AuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { LEAD_STATUSES, isValidLeadStatus, type LeadStatus } from "@/domain/lead";
import type { AdminActor } from "@/domain/admin-user";
import type { Lead } from "@/domain/lead";
import type { ProjectRequest } from "@/domain/project-request";
import type { LeadNote } from "@/domain/lead-note";
import type { LeadActivityRecord } from "@/lib/repositories/crm-repository";

const MAX_NOTE_LENGTH = 2000;

export type LeadDetail = {
  lead: Lead;
  projectRequests: ProjectRequest[];
  activities: LeadActivityRecord[];
  notes: LeadNote[];
};

export type ChangeStatusResult =
  | { success: true; lead: Lead }
  | { success: false; error: "not_found" | "invalid_status" | "unchanged" };

export type AddNoteResult = { success: true; note: LeadNote } | { success: false; error: "not_found" | "invalid_note" };

/**
 * CRM domain logic on top of Phase 4's lead tables (read/status-write
 * only — creation still goes exclusively through lead-service, so
 * there's one write path for "a new lead exists" and one for "an
 * admin acted on an existing lead"). Every mutation here takes an
 * explicit `actor`, passed down from a DAL-verified session in the
 * calling server action — this file never reads cookies itself, which
 * keeps it trivially unit-testable and keeps auth a one-time check at
 * the boundary rather than scattered through business logic.
 */
export class CrmService {
  constructor(
    private readonly repo: CrmRepository = getCrmRepository(),
    private readonly auditLog: AuditLogRepository = getAuditLogRepository(),
  ) {}

  listLeads(filters: LeadListFilters, sort: LeadListSort, page: number, pageSize: number) {
    return this.repo.listLeads(filters, sort, page, pageSize);
  }

  async getLeadDetail(leadId: string): Promise<LeadDetail | null> {
    const lead = await this.repo.getLeadById(leadId);
    if (!lead) return null;

    const [projectRequests, activities, notes] = await Promise.all([
      this.repo.getProjectRequestsForLead(leadId),
      this.repo.getActivitiesForLead(leadId),
      this.repo.getNotesForLead(leadId),
    ]);

    return { lead, projectRequests, activities, notes };
  }

  async changeLeadStatus(leadId: string, newStatus: string, actor: AdminActor): Promise<ChangeStatusResult> {
    if (!isValidLeadStatus(newStatus)) return { success: false, error: "invalid_status" };

    const current = await this.repo.getLeadById(leadId);
    if (!current) return { success: false, error: "not_found" };
    if (current.status === newStatus) return { success: false, error: "unchanged" };

    const previousStatus = current.status;
    const updated = await this.repo.updateLeadStatus(leadId, newStatus);
    if (!updated) return { success: false, error: "not_found" };

    await this.repo.createActivity(leadId, "status_changed", {
      previousStatus,
      newStatus,
      actorEmail: actor.email,
    });
    await this.auditLog.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "status_changed",
      targetType: "lead",
      targetId: leadId,
      metadata: { previousStatus, newStatus },
    });

    return { success: true, lead: updated };
  }

  async addNote(leadId: string, note: string, actor: AdminActor): Promise<AddNoteResult> {
    const trimmed = note.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NOTE_LENGTH) {
      return { success: false, error: "invalid_note" };
    }

    const lead = await this.repo.getLeadById(leadId);
    if (!lead) return { success: false, error: "not_found" };

    const created = await this.repo.createNote(leadId, actor.id, actor.name, trimmed);
    await this.repo.createActivity(leadId, "internal_note_added", {
      actorEmail: actor.email,
      notePreview: trimmed.slice(0, 140),
    });
    await this.auditLog.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "note_added",
      targetType: "lead",
      targetId: leadId,
    });

    return { success: true, note: created };
  }

  getDashboardMetrics() {
    return this.repo.getDashboardMetrics();
  }

  listActivities(page: number, pageSize: number) {
    return this.repo.listActivities(page, pageSize);
  }

  listProjectRequests(page: number, pageSize: number) {
    return this.repo.listProjectRequests(page, pageSize);
  }

  getRecentAuditLog(limit = 20) {
    return this.auditLog.listRecent(limit);
  }

  /** Grouped by canonical status order, capped to a bounded recent working set — see master plan "known limitations" for why this isn't fully paginated. */
  async getPipelineBoard(limitPerFetch = 300): Promise<Record<LeadStatus, LeadListItem[]>> {
    const items = await this.repo.listAllLeadsForPipeline(limitPerFetch);
    const board = Object.fromEntries(LEAD_STATUSES.map((s) => [s, [] as LeadListItem[]])) as Record<
      LeadStatus,
      LeadListItem[]
    >;
    for (const item of items) {
      board[item.status].push(item);
    }
    return board;
  }
}

let service: CrmService | null = null;

export function getCrmService(): CrmService {
  if (!service) service = new CrmService();
  return service;
}
