import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import type { AdminRole, AdminUser } from "@/domain/admin-user";

export type NewAdminUserInput = {
  email: string;
  emailNormalized: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
};

function toAdminUser(row: typeof adminUsers.$inferSelect): AdminUser {
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.emailNormalized,
    name: row.name,
    role: row.role as AdminRole,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastLoginAt: row.lastLoginAt ?? undefined,
  };
}

export interface AdminUserRepository {
  findByEmailNormalized(emailNormalized: string): Promise<(AdminUser & { passwordHash: string }) | null>;
  findById(id: string): Promise<AdminUser | null>;
  /** Upsert by normalized email — lets the seed script double as a password-reset tool. */
  upsert(input: NewAdminUserInput): Promise<AdminUser>;
  recordLogin(id: string): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}

export class DrizzleAdminUserRepository implements AdminUserRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async findByEmailNormalized(emailNormalized: string) {
    const db = await this.getDbInstance();
    const [row] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.emailNormalized, emailNormalized))
      .limit(1);
    if (!row) return null;
    return { ...toAdminUser(row), passwordHash: row.passwordHash };
  }

  async findById(id: string) {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    return row ? toAdminUser(row) : null;
  }

  async upsert(input: NewAdminUserInput): Promise<AdminUser> {
    const db = await this.getDbInstance();
    const [row] = await db
      .insert(adminUsers)
      .values(input)
      .onConflictDoUpdate({
        target: adminUsers.emailNormalized,
        set: {
          email: input.email,
          passwordHash: input.passwordHash,
          name: input.name,
          role: input.role,
          updatedAt: new Date(),
        },
      })
      .returning();
    return toAdminUser(row);
  }

  async recordLogin(id: string): Promise<void> {
    const db = await this.getDbInstance();
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const db = await this.getDbInstance();
    await db.update(adminUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(adminUsers.id, id));
  }
}

let repository: AdminUserRepository | null = null;

export function getAdminUserRepository(): AdminUserRepository {
  if (!repository) repository = new DrizzleAdminUserRepository();
  return repository;
}

export function createTestAdminUserRepository(getDbInstance: typeof getDb): AdminUserRepository {
  return new DrizzleAdminUserRepository(getDbInstance);
}
