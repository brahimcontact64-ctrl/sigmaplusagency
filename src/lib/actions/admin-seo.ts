"use server";

import { revalidatePath } from "next/cache";
import { requireActor, assertRole } from "@/lib/auth/dal";
import { getSeoRecommendationService } from "@/lib/services/seo-recommendation-service";
import { runSeoAudit } from "@/lib/seo/audit";
import { SEO_EDITOR_ROLES } from "@/domain/admin-user";
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
