import { requireActor } from "@/lib/auth/dal";
import { AdminShell } from "@/components/admin/shell";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  // Secure, DB-verified check (see dal.ts) — the proxy's cookie check
  // is only an optimistic pre-filter, not the real authorization
  // boundary. Redirects to /admin/login when there's no valid session.
  const actor = await requireActor();

  return <AdminShell actor={actor}>{children}</AdminShell>;
}
