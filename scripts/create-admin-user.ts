/**
 * Bootstraps (or resets the password of) an admin user. There's no
 * self-serve signup UI by design — admin accounts are provisioned out
 * of band, run via: `npm run admin:create-user -- --email=you@example.com
 * --password=... --name="Your Name" --role=OWNER`.
 *
 * Upserts by normalized email, so re-running with a new --password is
 * also how you reset one.
 */
import { hashPassword } from "../src/lib/auth/password";
import { normalizeEmail } from "../src/lib/services/identity";
import { getAdminUserRepository } from "../src/lib/repositories/admin-user-repository";
import { ADMIN_ROLES, type AdminRole } from "../src/domain/admin-user";

function parseArgs(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const email = args.email;
  const password = args.password;
  const name = args.name ?? email?.split("@")[0] ?? "Admin";
  const role = (args.role ?? "OWNER") as AdminRole;

  if (!email || !password) {
    console.error("Usage: npm run admin:create-user -- --email=you@example.com --password=... [--name=\"Name\"] [--role=OWNER]");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Refusing a password under 12 characters for an admin account.");
    process.exit(1);
  }
  if (!ADMIN_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Must be one of: ${ADMIN_ROLES.join(", ")}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await getAdminUserRepository().upsert({
    email,
    emailNormalized: normalizeEmail(email),
    passwordHash,
    name,
    role,
  });

  console.log(`Admin user ready: ${user.email} (${user.role}), id=${user.id}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create admin user:", error);
  process.exit(1);
});
