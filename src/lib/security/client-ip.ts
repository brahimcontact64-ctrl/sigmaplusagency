import { headers } from "next/headers";

/** Best-effort client IP for rate-limiting keys — trusts the platform's proxy header, which is fine for abuse-mitigation (not for auth). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
