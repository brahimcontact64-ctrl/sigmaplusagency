/**
 * `npm run seo:audit` — runs the deterministic SEO audit engine
 * (src/lib/seo/audit.ts) and prints a readable report. Exits non-zero
 * only on ERROR-severity findings, per the brief's own "do not make
 * warnings unnecessarily block builds" instruction. Optionally writes
 * a JSON report to a gitignored directory for CI artifact collection.
 */
import fs from "node:fs";
import path from "node:path";
import { runSeoAudit } from "../src/lib/seo/audit";
import { SEO_ISSUE_SEVERITIES, type SeoIssue, type SeoIssueSeverity } from "../src/domain/seo-issue";

function groupBySeverity(issues: SeoIssue[]): Record<SeoIssueSeverity, SeoIssue[]> {
  const grouped = Object.fromEntries(SEO_ISSUE_SEVERITIES.map((s) => [s, [] as SeoIssue[]])) as Record<SeoIssueSeverity, SeoIssue[]>;
  for (const issue of issues) grouped[issue.type].push(issue);
  return grouped;
}

async function main() {
  const issues = await runSeoAudit();
  const grouped = groupBySeverity(issues);

  console.log(`\nSIGMA+ SEO audit — ${issues.length} finding(s)\n`);

  for (const severity of SEO_ISSUE_SEVERITIES) {
    const group = grouped[severity];
    if (group.length === 0) continue;
    console.log(`${severity} (${group.length})`);
    for (const item of group) {
      const localeTag = item.locale ? ` [${item.locale}]` : "";
      console.log(`  - ${item.page}${localeTag}: ${item.message}`);
      console.log(`    → ${item.recommendation}`);
    }
    console.log("");
  }

  if (issues.length === 0) {
    console.log("No issues found.\n");
  }

  const outDir = path.join(process.cwd(), "generated");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "seo-audit.json");
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), issues }, null, 2));
  console.log(`Full JSON report: ${path.relative(process.cwd(), outFile)}\n`);

  const errorCount = grouped.ERROR.length;
  if (errorCount > 0) {
    console.error(`seo:audit failed: ${errorCount} ERROR-severity finding(s).`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("seo:audit crashed:", error);
  process.exit(1);
});
