import "server-only";
import { cookies } from "next/headers";
import { encryptSession, decryptSession, SESSION_COOKIE_NAME, type SessionPayload } from "./jwt";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12h — internal tool, not a "remember me" consumer session.

export async function createSession(payload: SessionPayload): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encryptSession(payload, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readSessionCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export type { SessionPayload };
export { SESSION_COOKIE_NAME };
