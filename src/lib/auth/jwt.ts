import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@/domain/admin-user";

/**
 * Pure JWT sign/verify, deliberately free of `next/headers` and
 * `server-only` — this file is imported directly from proxy.ts for
 * the optimistic session check, and proxy runs before any cookie-store
 * API would be relevant. src/lib/auth/session.ts wraps this with the
 * actual cookie read/write for use in Server Components/Actions.
 */
export const SESSION_COOKIE_NAME = "sigma_admin_session";

export type SessionPayload = {
  adminUserId: string;
  email: string;
  name: string;
  role: AdminRole;
};

let devFallbackSecret: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) return new TextEncoder().encode(secret);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET is not configured. Refusing to start the admin session system in " +
        "production with a fallback key — configure ADMIN_SESSION_SECRET (openssl rand -base64 32).",
    );
  }

  if (!devFallbackSecret) {
    devFallbackSecret = crypto.getRandomValues(new Uint8Array(32));
    console.warn(
      "[admin-session] ADMIN_SESSION_SECRET not set — using an ephemeral dev-only key. " +
        "Set ADMIN_SESSION_SECRET in .env for a stable local session across restarts.",
    );
  }
  return devFallbackSecret;
}

export async function encryptSession(payload: SessionPayload, expiresAt: Date): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (
      typeof payload.adminUserId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      adminUserId: payload.adminUserId,
      email: payload.email,
      name: payload.name,
      role: payload.role as AdminRole,
    };
  } catch {
    // Expired, tampered, or wrong-key token — treat identically to "no session".
    return null;
  }
}
