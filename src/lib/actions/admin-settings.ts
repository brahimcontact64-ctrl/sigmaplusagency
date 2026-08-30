"use server";

import { revalidatePath } from "next/cache";
import { requireActor, assertRole } from "@/lib/auth/dal";
import { getSettingsService } from "@/lib/services/settings-service";
import { SETTINGS_EDITOR_ROLES } from "@/domain/admin-user";
import type { ActionResult } from "./admin-crm";

export async function updateSettingAction(key: string, value: unknown): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, SETTINGS_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getSettingsService().update(key, value, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/admin/settings");
  return { success: true };
}
