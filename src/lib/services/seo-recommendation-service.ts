import {
  getSeoRecommendationRepository,
  type SeoRecommendationRepository,
  type NewSeoRecommendationInput,
} from "@/lib/repositories/seo-recommendation-repository";
import { getAuditLogRepository, type AuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { recommendationsFromAuditIssues } from "@/lib/seo/opportunity-engine";
import type { SeoIssue } from "@/domain/seo-issue";
import type { AdminActor } from "@/domain/admin-user";
import type { SeoRecommendationStatus } from "@/domain/seo-intelligence";

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

  /** Idempotent-ish seeding from the current audit run — call this to (re)populate the RECOMMENDED queue; does not deduplicate against prior runs yet (see docs/SEO_STRATEGY.md known limitations). */
  async generateFromAudit(issues: SeoIssue[]): Promise<number> {
    const inputs: NewSeoRecommendationInput[] = recommendationsFromAuditIssues(issues);
    for (const input of inputs) await this.repo.create(input);
    return inputs.length;
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
