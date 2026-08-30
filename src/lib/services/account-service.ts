import { getAdminUserRepository, type AdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { getAuditLogRepository, type AuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { newPasswordSchema } from "@/domain/admin-auth";
import { normalizeEmail } from "@/lib/services/identity";
import type { AdminActor } from "@/domain/admin-user";

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: "mismatch" | "weak_password" | "invalid_current_password" | "not_found" };

/**
 * Deliberately free of cookies/redirect — the server action wraps this
 * with session invalidation and re-login, but the actual policy
 * (current-password check, strength validation, hashing, audit) lives
 * here so it's unit-testable the same way crm-service/settings-service
 * are, and so it never risks logging a password on either side.
 */
export class AccountService {
  constructor(
    private readonly userRepo: AdminUserRepository = getAdminUserRepository(),
    private readonly auditLog: AuditLogRepository = getAuditLogRepository(),
  ) {}

  async changePassword(
    actor: AdminActor,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<ChangePasswordResult> {
    if (newPassword !== confirmPassword) return { success: false, error: "mismatch" };

    const parsed = newPasswordSchema.safeParse(newPassword);
    if (!parsed.success) return { success: false, error: "weak_password" };

    const user = await this.userRepo.findByEmailNormalized(normalizeEmail(actor.email));
    if (!user) return { success: false, error: "not_found" };

    const currentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentValid) return { success: false, error: "invalid_current_password" };

    const newHash = await hashPassword(newPassword);
    await this.userRepo.updatePassword(user.id, newHash);
    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "password_changed" });

    return { success: true };
  }
}

let service: AccountService | null = null;

export function getAccountService(): AccountService {
  if (!service) service = new AccountService();
  return service;
}
