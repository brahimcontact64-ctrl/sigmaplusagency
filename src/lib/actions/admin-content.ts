"use server";

import { revalidatePath } from "next/cache";
import { requireActor, assertRole } from "@/lib/auth/dal";
import { getArticleService } from "@/lib/services/article-service";
import { CONTENT_EDITOR_ROLES } from "@/domain/admin-user";
import { articleCreateSchema, translationDraftSchema } from "@/domain/article-validation";
import type { ContentStatus } from "@/domain/article";

export type ContentActionResult =
  | { success: true; articleId?: string; translationId?: string }
  | { success: false; error: string; problems?: string[] };

async function requireContentEditor() {
  const actor = await requireActor();
  assertRole(actor, CONTENT_EDITOR_ROLES);
  return actor;
}

export async function createArticleAction(input: unknown): Promise<ContentActionResult> {
  let actor;
  try {
    actor = await requireContentEditor();
  } catch {
    return { success: false, error: "forbidden" };
  }

  const parsed = articleCreateSchema.omit({}).safeParse((input as { article: unknown }).article);
  const translationParsed = translationDraftSchema.safeParse((input as { translation: unknown }).translation);
  if (!parsed.success || !translationParsed.success) return { success: false, error: "validation_error" };

  const result = await getArticleService().createArticleWithTranslation(parsed.data, translationParsed.data, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/content");
  return { success: true, articleId: result.article.id, translationId: result.translation.id };
}

export async function addTranslationAction(articleId: string, input: unknown): Promise<ContentActionResult> {
  let actor;
  try {
    actor = await requireContentEditor();
  } catch {
    return { success: false, error: "forbidden" };
  }

  const parsed = translationDraftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "validation_error" };

  const result = await getArticleService().addTranslation(articleId, parsed.data, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${articleId}`);
  return { success: true, translationId: result.translation.id };
}

export async function saveTranslationAction(translationId: string, articleId: string, input: unknown): Promise<ContentActionResult> {
  let actor;
  try {
    actor = await requireContentEditor();
  } catch {
    return { success: false, error: "forbidden" };
  }

  const parsed = translationDraftSchema.omit({ locale: true }).safeParse(input);
  if (!parsed.success) return { success: false, error: "validation_error" };

  const result = await getArticleService().saveTranslation(translationId, parsed.data, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${articleId}`);
  return { success: true, translationId: result.translation.id };
}

export async function changeArticleSlugAction(translationId: string, articleId: string, newSlug: string): Promise<ContentActionResult> {
  let actor;
  try {
    actor = await requireContentEditor();
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getArticleService().changeSlug(translationId, newSlug, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${articleId}`);
  revalidatePath("/sitemap.xml");
  return { success: true, translationId: result.translation.id };
}

export async function publishArticleAction(translationId: string, articleId: string): Promise<ContentActionResult> {
  let actor;
  try {
    actor = await requireContentEditor();
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getArticleService().publish(translationId, actor);
  if (!result.success) return { success: false, error: result.error, problems: result.problems };

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${articleId}`);
  revalidatePath("/sitemap.xml");
  return { success: true, translationId: result.translation.id };
}

export async function changeArticleStatusAction(translationId: string, articleId: string, status: Exclude<ContentStatus, "PUBLISHED">): Promise<ContentActionResult> {
  let actor;
  try {
    actor = await requireContentEditor();
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getArticleService().changeStatus(translationId, status, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${articleId}`);
  revalidatePath("/sitemap.xml");
  return { success: true, translationId: result.translation.id };
}
