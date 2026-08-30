"use server";

import { redirect } from "next/navigation";
import { adminLoginSchema, changePasswordSchema, type LoginState, type ChangePasswordState } from "@/domain/admin-auth";
import { getAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { getAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { createSession, deleteSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/services/identity";
import { loginIpRateLimiter, loginEmailRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { getActor, requireActor } from "@/lib/auth/dal";
import { getAccountService } from "@/lib/services/account-service";

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

/**
 * Never logs either password value, anywhere in this function or the
 * service it calls. On success, the current session is deleted and the
 * admin is sent back to login — a password change must not leave the
 * old session (or any other device's session under the old password)
 * usable, and re-authenticating confirms the new password actually works.
 */
export async function changePasswordAction(_prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const actor = await requireActor();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await getAccountService().changePassword(
    actor,
    parsed.data.currentPassword,
    parsed.data.newPassword,
    parsed.data.confirmPassword,
  );

  if (!result.success) {
    const messages: Record<typeof result.error, string> = {
      mismatch: "New password and confirmation do not match.",
      weak_password: "New password does not meet the minimum requirements.",
      invalid_current_password: "Current password is incorrect.",
      not_found: "Account not found.",
    };
    return { error: messages[result.error] };
  }

  await deleteSession();
  redirect("/admin/login?passwordChanged=1");
}
