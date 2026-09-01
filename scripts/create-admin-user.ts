/**
 * Bootstraps (or resets the password of) an admin user. There's no
 * self-serve signup UI by design — admin accounts are provisioned out
 * of band, run via:
 *
 *   npm run admin:create-user -- --email=you@example.com --name="Your Name" --role=OWNER
 *
 * with the password supplied via the `ADMIN_BOOTSTRAP_PASSWORD`
 * environment variable (preferred — never appears in shell history or
 * the process argument list) or, for local/dev convenience only,
 * `--password=...`. **In production, `--password=` is refused
 * outright** — see `src/lib/auth/bootstrap-password.ts`.
 *
 * Upserts by normalized email, so re-running with a new password is
 * also how you reset one.
 */
import { hashPassword } from "../src/lib/auth/password";
import { normalizeEmail } from "../src/lib/services/identity";
import { getAdminUserRepository } from "../src/lib/repositories/admin-user-repository";
import { resolveBootstrapPassword } from "../src/lib/auth/bootstrap-password";
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
  const name = args.name ?? email?.split("@")[0] ?? "Admin";
  const role = (args.role ?? "OWNER") as AdminRole;

  if (!email) {
    console.error(
      'Usage: npm run admin:create-user -- --email=you@example.com [--name="Name"] [--role=OWNER]\n' +
        "Password: set ADMIN_BOOTSTRAP_PASSWORD (preferred), or pass --password=... for local/dev use.",
    );
    process.exit(1);
  }

  const resolved = resolveBootstrapPassword(args.password);
  if ("error" in resolved) {
    console.error(resolved.error);
    process.exit(1);
  }
  const { password } = resolved;

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
  // Never log the raw error object — only its message, and never the
  // password (nothing here interpolates it into an Error in the first
  // place, but this stays defensive rather than relying on that alone).
  console.error("Failed to create admin user:", error instanceof Error ? error.message : "unexpected error");
  process.exit(1);
});
