/**
 * Pure password-source resolution for the admin bootstrap/rotation
 * script (`scripts/create-admin-user.ts`) — split out into its own
 * dependency-free module so it's directly unit-testable without
 * executing the script's `main()` (a CLI entry point that calls
 * `process.exit()` can't be safely imported as-is; same "extract the
 * pure logic" pattern as `rbac.ts`/`jwt.ts`/`site-config-merge.ts`).
 *
 * `ADMIN_BOOTSTRAP_PASSWORD` (an environment variable, never a CLI
 * argument) is preferred whenever present — a `--password=` value is
 * visible in shell history and briefly in the process argument list,
 * exactly what a production bootstrap must avoid. In production,
 * `--password=` is refused outright rather than silently accepted.
 *
 * Never include the actual password value in a returned error — only
 * fixed, static guidance strings.
 */
export type PasswordResolution = { password: string } | { error: string };

export function resolveBootstrapPassword(
  cliPassword: string | undefined,
  env: { ADMIN_BOOTSTRAP_PASSWORD?: string; NODE_ENV?: string } = process.env,
): PasswordResolution {
  const envPassword = env.ADMIN_BOOTSTRAP_PASSWORD;
  if (envPassword) return { password: envPassword };

  const isProduction = env.NODE_ENV === "production";
  if (isProduction) {
    return {
      error:
        "In production, the password must come from ADMIN_BOOTSTRAP_PASSWORD, never --password= " +
        "(command-line arguments are visible in shell history and the process list). Set " +
        "ADMIN_BOOTSTRAP_PASSWORD (e.g. via Read-Host -AsSecureString) and re-run.",
    };
  }

  if (cliPassword) return { password: cliPassword };

  return { error: "No password provided. Set ADMIN_BOOTSTRAP_PASSWORD, or pass --password= for local/dev use." };
}
