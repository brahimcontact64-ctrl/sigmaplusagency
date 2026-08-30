import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie } from "./session";
import { getAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import type { AdminActor } from "@/domain/admin-user";
import { assertRole } from "./rbac";

export { assertRole };

/**
 * Secure (DB-verified) session check, memoized per request via React's
 * cache(). Re-reads the admin_users row rather than trusting the JWT's
 * embedded role, so a demoted/deleted admin can't keep acting on a
 * still-valid token until it expires (max 12h anyway — see session.ts).
 */
export const getActor = cache(async (): Promise<AdminActor | null> => {
  const session = await readSessionCookie();
  if (!session) return null;

  const user = await getAdminUserRepository().findById(session.adminUserId);
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
});

/** Use in protected layouts/pages. Redirects unauthenticated visitors to login. */
export async function requireActor(): Promise<AdminActor> {
  const actor = await getActor();
  if (!actor) redirect("/admin/login");
  return actor;
}
