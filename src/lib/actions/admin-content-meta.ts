"use server";

import { revalidatePath } from "next/cache";
import { requireActor, assertRole } from "@/lib/auth/dal";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { getAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { CONTENT_EDITOR_ROLES } from "@/domain/admin-user";
import { articleCreateSchema } from "@/domain/article-validation";
import type { ActionResult } from "./admin-crm";

export async function updateArticleMetaAction(articleId: string, input: unknown): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, CONTENT_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  const parsed = articleCreateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "validation_error" };

  const updated = await getArticleRepository().updateArticle(articleId, parsed.data);
  if (!updated) return { success: false, error: "not_found" };

  await getAuditLogRepository().record({ actorId: actor.id, actorEmail: actor.email, action: "article_updated", targetType: "article", targetId: articleId });

  revalidatePath(`/admin/content/${articleId}`);
  return { success: true };
}
