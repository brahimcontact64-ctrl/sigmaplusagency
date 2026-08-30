"use server";

import { revalidatePath } from "next/cache";
import { requireActor, assertRole } from "@/lib/auth/dal";
import { getCrmService } from "@/lib/services/crm-service";
import { CRM_EDITOR_ROLES } from "@/domain/admin-user";

export type ActionResult = { success: true } | { success: false; error: string };

/**
 * Actor always comes from the DB-verified session (requireActor), never
 * from an argument the browser could supply — see master plan Phase 5
 * security requirements. Role is re-checked here too, not just in the
 * UI, since the UI hiding a control is not an authorization boundary.
 */
export async function changeLeadStatusAction(leadId: string, newStatus: string): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, CRM_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getCrmService().changeLeadStatus(leadId, newStatus, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
  return { success: true };
}

export async function addLeadNoteAction(leadId: string, note: string): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    assertRole(actor, CRM_EDITOR_ROLES);
  } catch {
    return { success: false, error: "forbidden" };
  }

  const result = await getCrmService().addNote(leadId, note, actor);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/admin/leads/${leadId}`);
  return { success: true };
}
