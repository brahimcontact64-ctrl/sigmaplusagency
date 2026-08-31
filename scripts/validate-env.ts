/**
 * `npm run validate:env` — presence-only report of every environment
 * variable this app knows about (src/lib/env.ts). Never prints a
 * value, only whether each is set. Exits non-zero only when a
 * `required-production` var is missing AND NODE_ENV=production —
 * missing optional-integration vars are normal and expected (they
 * degrade to an honest "not configured" state, not a build failure).
 */
import { ENV_VARS, buildEnvPresenceReport, getMissingRequiredProductionVars } from "../src/lib/env";

function main() {
  const report = buildEnvPresenceReport();
  console.log("\nSIGMA+ environment variable report (presence only — no values printed)\n");

  for (const category of ["required-production", "optional-integration", "public", "secret"] as const) {
    const rows = report.filter((r) => r.category === category);
    if (rows.length === 0) continue;
    console.log(`${category}`);
    for (const row of rows) {
      console.log(`  ${row.present ? "✓" : "·"} ${row.name}`);
    }
    console.log("");
  }

  const missingRequired = getMissingRequiredProductionVars();
  if (process.env.NODE_ENV === "production" && missingRequired.length > 0) {
    console.error(`validate:env failed: missing required-production var(s): ${missingRequired.join(", ")}`);
    process.exit(1);
  }

  console.log(`${ENV_VARS.length} known variable(s) checked.\n`);
}

main();
