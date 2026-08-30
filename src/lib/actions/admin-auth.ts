"use server";

import { redirect } from "next/navigation";
import { adminLoginSchema, type LoginState } from "@/domain/admin-auth";
import { getAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { getAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { createSession, deleteSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/services/identity";
import { loginIpRateLimiter, loginEmailRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { getActor } from "@/lib/auth/dal";

// Correctly formatted but meaningless salt:hash pair, used only so a
// "no such account" lookup burns the same scrypt cost as a real
// password check — otherwise the response-time difference would let
// an attacker enumerate valid admin emails.
const DUMMY_PASSWORD_HASH = `${"00".repeat(16)}:${"00".repeat(64)}`;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;
  const emailNormalized = normalizeEmail(email);
  const ip = await getClientIp();

  if (!loginIpRateLimiter.check(`ip:${ip}`) || !loginEmailRateLimiter.check(`email:${emailNormalized}`)) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const userRepo = getAdminUserRepository();
  const auditLog = getAuditLogRepository();
  const user = await userRepo.findByEmailNormalized(emailNormalized);

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !valid) {
    await auditLog.record({
      actorId: user?.id,
      actorEmail: email,
      action: "login_failed",
    });
    return { error: "Invalid email or password." };
  }

  await createSession({ adminUserId: user.id, email: user.email, name: user.name, role: user.role });
  await userRepo.recordLogin(user.id);
  await auditLog.record({ actorId: user.id, actorEmail: user.email, action: "login" });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const actor = await getActor();
  await deleteSession();
  if (actor) {
    await getAuditLogRepository().record({ actorId: actor.id, actorEmail: actor.email, action: "logout" });
  }
  redirect("/admin/login");
}
