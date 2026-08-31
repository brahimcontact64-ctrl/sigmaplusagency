import sitemap from "@/app/sitemap";
import { runSeoAudit } from "@/lib/seo/audit";
import { buildSiteModel } from "@/lib/seo/site-model";
import { getSearchConsoleStatus } from "@/lib/seo/adapters/search-console";
import { getAnalyticsReportingStatus } from "@/lib/seo/adapters/analytics-reporting";
import { getPageSpeedStatus } from "@/lib/seo/adapters/pagespeed";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/admin/empty-state";
import { SEO_ISSUE_SEVERITIES } from "@/domain/seo-issue";

export const metadata = { title: "SEO — SIGMA+ Admin" };

// Known noindex admin surfaces — not modeled by buildSiteModel() (which
// only covers the public marketing site), listed here for an honest
// "noindex page count" stat. See src/app/admin/layout.tsx's
// `robots: {index:false, follow:false}` metadata — this list is display
// only, not itself an enforcement mechanism.
const NOINDEX_ADMIN_ROUTES = ["/admin", "/admin/login", "/admin/leads", "/admin/pipeline", "/admin/project-requests", "/admin/activities", "/admin/settings", "/admin/seo"];

export default async function AdminSeoPage() {
  const pages = buildSiteModel();
  const issues = runSeoAudit();
  const sitemapEntries = sitemap();

  const searchConsole = getSearchConsoleStatus();
  const analyticsReporting = getAnalyticsReportingStatus();
  const pageSpeed = getPageSpeedStatus();

  const bySeverity = Object.fromEntries(SEO_ISSUE_SEVERITIES.map((s) => [s, issues.filter((i) => i.type === s)]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">SEO</h1>
        <p className="mt-1 text-sm text-muted">
          Deterministic technical status only — no fake rankings, no simulated traffic. This is not yet the autonomous SEO agent (Phase 8+).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Indexable pages" value={pages.length} hint="Across all 4 locales" />
        <StatCard label="Known noindex routes" value={NOINDEX_ADMIN_ROUTES.length} hint="Admin — auth-protected regardless" />
        <StatCard label="Sitemap URLs" value={sitemapEntries.length} hint="From the real sitemap.xml generator" />
        <StatCard label="Audit findings" value={issues.length} hint={`${bySeverity.ERROR.length} error · ${bySeverity.WARNING.length} warning · ${bySeverity.OPPORTUNITY.length} opportunity`} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">External data connections</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <AdapterStatus label="Google Search Console" connected={searchConsole.connected} />
          <AdapterStatus label="GA4 reporting" connected={analyticsReporting.connected} />
          <AdapterStatus label="PageSpeed Insights" connected={pageSpeed.connected} />
        </div>
        <p className="mt-3 text-xs text-muted">
          None are connected yet — no credentials are configured, so no external data is fetched or fabricated. See docs/SEO_STRATEGY.md for what each will surface once connected.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Audit findings</h2>
        {issues.length === 0 ? (
          <EmptyState title="No issues found" hint="The deterministic audit found nothing to flag." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="py-2 pr-4 font-medium">Severity</th>
                  <th className="py-2 pr-4 font-medium">Page</th>
                  <th className="py-2 pr-4 font-medium">Message</th>
                  <th className="py-2 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} className="border-b border-border last:border-0 align-top">
                    <td className="py-2 pr-4">
                      <span
                        className={
                          issue.type === "ERROR"
                            ? "rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400"
                            : issue.type === "WARNING"
                              ? "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400"
                              : "rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary-bright"
                        }
                      >
                        {issue.type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted">{issue.page}</td>
                    <td className="py-2 pr-4 text-foreground">{issue.message}</td>
                    <td className="py-2 text-muted">{issue.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AdapterStatus({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-void px-4 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <span className={connected ? "text-xs font-semibold text-emerald-400" : "text-xs font-medium text-muted"}>
        {connected ? "Connected" : "Not connected"}
      </span>
    </div>
  );
}
