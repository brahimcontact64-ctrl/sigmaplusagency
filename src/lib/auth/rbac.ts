import type { AdminActor, AdminRole } from "@/domain/admin-user";

/**
 * Deliberately free of "server-only"/"next/headers" — this is pure
 * role-membership logic, split out so it (and the tests covering it)
 * don't drag in Next's server-component-only import guards, the same
 * reasoning that keeps crm-service/settings-service free of cookie
 * access (see their module comments).
 */
export function assertRole(actor: AdminActor, allowed: AdminRole[]): void {
  if (!allowed.includes(actor.role)) {
    throw new Error(`Forbidden: role ${actor.role} cannot perform this action`);
  }
}
