"use server";

import { revalidatePath } from "next/cache";
import { requireActor, assertRole } from "@/lib/auth/dal";
import { getSeoRecommendationService } from "@/lib/services/seo-recommendation-service";
import { runSeoAudit } from "@/lib/seo/audit";
import { SEO_EDITOR_ROLES } from "@/domain/admin-user";
import { SEO_JOB_DISPATCH, type JobDispatchResult } from "@/lib/seo/jobs";
import { isValidSeoJobType } from "@/domain/seo-job";
import type { ActionResult } from "./admin-crm";

export async function approveSeoRecommendationAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, SEO_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getSeoRecommendationService().approve(id, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/seo");
  return { success: true };
}

export async function rejectSeoRecommendationAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, SEO_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getSeoRecommendationService().reject(id, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/seo");
  return { success: true };
}

/** Re-runs the deterministic audit and turns its non-ERROR findings into RECOMMENDED rows — never auto-approved. */
export async function generateSeoRecommendationsAction(): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, SEO_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  const issues = await runSeoAudit();
  await getSeoRecommendationService().generateFromAudit(issues);

  revalidatePath("/admin/seo");
  return { success: true };
}

export type RunSeoJobActionResult = ActionResult & { dispatch?: JobDispatchResult };

/**
 * Manual "Run now" trigger for /admin/seo — goes through the exact
 * same dispatch table and lock/history mechanism as the cron endpoint
 * (Phase 12 §3), just authenticated via the admin session instead of
 * CRON_SECRET. Useful for testing a job without waiting for its
 * schedule, or for an on-demand run.
 */
export async function runSeoJobAction(jobType: string): Promise<RunSeoJobActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, SEO_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  if (!isValidSeoJobType(jobType)) {
    return { success: false, error: "invalid_job_type" };
  }

  const dispatch = await SEO_JOB_DISPATCH[jobType]("MANUAL");
  revalidatePath("/admin/seo");
  return { success: true, dispatch };
}
