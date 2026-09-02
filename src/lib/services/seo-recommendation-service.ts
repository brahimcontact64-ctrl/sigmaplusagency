import {
  getSeoRecommendationRepository,
  type SeoRecommendationRepository,
  type NewSeoRecommendationInput,
} from "@/lib/repositories/seo-recommendation-repository";
import { getAuditLogRepository, type AuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { recommendationsFromAuditIssues, recommendationsFromOpportunities } from "@/lib/seo/opportunity-engine";
import type { SeoIssue } from "@/domain/seo-issue";
import type { AdminActor } from "@/domain/admin-user";
import type { SeoRecommendationStatus, SeoOpportunity } from "@/domain/seo-intelligence";

export type ReviewResult = { success: true } | { success: false; error: "not_found" | "invalid_transition" };

/**
 * Approval-first, enforced here (Phase 8 §43): the only status
 * transitions this service allows are RECOMMENDED -> APPROVED and
 * RECOMMENDED -> REJECTED, both requiring an explicit admin actor.
 * Nothing in this codebase can move a recommendation to APPROVED on
 * its own, and reaching APPROVED never itself rewrites a title,
 * publishes an article, or changes a canonical/redirect — it only
 * records that a human signed off on the *idea*.
 */
export class SeoRecommendationService {
  constructor(
    private readonly repo: SeoRecommendationRepository = getSeoRecommendationRepository(),
    private readonly auditLog: AuditLogRepository = getAuditLogRepository(),
  ) {}

  list(status?: SeoRecommendationStatus) {
    return this.repo.list({ status });
  }

  /**
   * Seeding from the current audit run — (re)populates the open
   * recommendation queue. Deduplicated against every already-open
   * (DRAFT/RECOMMENDED) row for the same {type, page, locale} (Phase
   * 12): a repeated/scheduled run finding the same issue again never
   * creates a second row while one is already awaiting review. A row a
   * human already approved/rejected/published never blocks a fresh one
   * — see findOpenDuplicate's doc.
   */
  async generateFromAudit(issues: SeoIssue[]): Promise<{ created: number; skippedDuplicate: number }> {
    return this.createDeduped(recommendationsFromAuditIssues(issues));
  }

  /** Same dedup-on-create pipeline as generateFromAudit, for opportunities detected from real GSC/PageSpeed metrics once those are connected (Phase 12 §8). */
  async generateFromOpportunities(opportunities: SeoOpportunity[]): Promise<{ created: number; skippedDuplicate: number }> {
    return this.createDeduped(recommendationsFromOpportunities(opportunities));
  }

  private async createDeduped(inputs: NewSeoRecommendationInput[]): Promise<{ created: number; skippedDuplicate: number }> {
    let created = 0;
    let skippedDuplicate = 0;
    for (const input of inputs) {
      const duplicate = await this.repo.findOpenDuplicate(input.type, input.page, input.locale, input.source);
      if (duplicate) {
        skippedDuplicate += 1;
        continue;
      }
      await this.repo.create(input);
      created += 1;
    }
    return { created, skippedDuplicate };
  }

  async approve(id: string, actor: AdminActor): Promise<ReviewResult> {
    const current = await this.repo.get(id);
    if (!current) return { success: false, error: "not_found" };
    if (current.status !== "RECOMMENDED" && current.status !== "DRAFT") return { success: false, error: "invalid_transition" };

    await this.repo.updateStatus(id, "APPROVED", actor.email);
    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "seo_recommendation_approved", targetType: "seo_recommendation", targetId: id });
    return { success: true };
  }

  async reject(id: string, actor: AdminActor): Promise<ReviewResult> {
    const current = await this.repo.get(id);
    if (!current) return { success: false, error: "not_found" };
    if (current.status === "PUBLISHED") return { success: false, error: "invalid_transition" };

    await this.repo.updateStatus(id, "REJECTED", actor.email);
    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "seo_recommendation_rejected", targetType: "seo_recommendation", targetId: id });
    return { success: true };
  }
}

let service: SeoRecommendationService | null = null;

export function getSeoRecommendationService(): SeoRecommendationService {
  if (!service) service = new SeoRecommendationService();
  return service;
}
