import sitemap from "@/app/sitemap";
import { runSeoAudit } from "@/lib/seo/audit";
import { buildSiteModel, buildArticleModel } from "@/lib/seo/site-model";
import { getSearchConsoleConnection } from "@/lib/seo/adapters/search-console";
import { getAnalyticsReportingConnection } from "@/lib/seo/adapters/analytics-reporting";
import { getPageSpeedConnection } from "@/lib/seo/adapters/pagespeed";
import { getKeywordProviderConnection } from "@/lib/seo/providers/keyword-provider";
import { getSeoRecommendationService } from "@/lib/services/seo-recommendation-service";
import { getSeoJobRepository } from "@/lib/repositories/seo-job-repository";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SeoRecommendationActions } from "@/components/admin/seo-recommendation-actions";
import { GenerateRecommendationsButton } from "@/components/admin/generate-recommendations-button";
import { SeoJobsPanel } from "@/components/admin/seo-jobs-panel";
import { DataProvenanceBadge } from "@/components/admin/data-provenance-badge";
import { formatDateTime } from "@/lib/admin/format";
import { SEO_ISSUE_SEVERITIES } from "@/domain/seo-issue";
import type { SeoConnectionState } from "@/domain/seo-intelligence";
import { SEO_JOB_TYPES, type SeoJobRun, type SeoJobType } from "@/domain/seo-job";
import type { WeeklySeoReport } from "@/lib/seo/services/weekly-report";

/**
 * Phase 12 §16 — the recommended (NOT active; see docs/SEO_STRATEGY.md
 * §28 for exact Vercel cron activation steps) cadence per job type,
 * shown next to each job's real last-successful-run timestamp so
 * "next scheduled run" reads as a plan, never as a live guarantee.
 */
const JOB_SCHEDULE_LABEL: Record<SeoJobType, string> = {
  DAILY_TECHNICAL_AUDIT: "Daily",
  DAILY_SEARCH_CONSOLE_SYNC: "Daily",
  DAILY_ANALYTICS_SYNC: "Daily",
  WEEKLY_PAGESPEED_AUDIT: "Weekly",
  WEEKLY_KEYWORD_ANALYSIS: "Weekly",
  WEEKLY_SEO_OPPORTUNITY_ANALYSIS: "Weekly",
  WEEKLY_CONTENT_DECAY_ANALYSIS: "Weekly",
  WEEKLY_EXECUTIVE_REPORT: "Weekly",
};

export const metadata = { title: "SEO — SIGMA+ Admin" };

// Known noindex admin surfaces — not modeled by buildSiteModel() (which
// only covers the public marketing site), listed here for an honest
// "noindex page count" stat. See src/app/admin/layout.tsx's
// `robots: {index:false, follow:false}` metadata — this list is display
// only, not itself an enforcement mechanism.
const NOINDEX_ADMIN_ROUTES = ["/admin", "/admin/login", "/admin/leads", "/admin/pipeline", "/admin/project-requests", "/admin/activities", "/admin/settings", "/admin/seo", "/admin/content"];

export default async function AdminSeoPage() {
  const [
    staticPages,
    articlePages,
    issues,
    sitemapEntries,
    searchConsole,
    analyticsReporting,
    pageSpeed,
    serp,
    recommendations,
    articleCounts,
    recentJobRuns,
    latestReportRun,
  ] = await Promise.all([
    Promise.resolve(buildSiteModel()),
    buildArticleModel(),
    runSeoAudit(),
    sitemap(),
    getSearchConsoleConnection(),
    getAnalyticsReportingConnection(),
    getPageSpeedConnection(),
    getKeywordProviderConnection(),
    getSeoRecommendationService().list("RECOMMENDED"),
    getArticleRepository().countByStatus(),
    getSeoJobRepository().history(undefined, 10),
    getSeoJobRepository().lastSuccessful("WEEKLY_EXECUTIVE_REPORT"),
  ]);

  const latestReport = latestReportRun?.reportSnapshot as WeeklySeoReport | undefined;

  const lastSuccessfulByJob = Object.fromEntries(
    await Promise.all(SEO_JOB_TYPES.map(async (jobType) => [jobType, await getSeoJobRepository().lastSuccessful(jobType)] as const)),
  ) as Record<SeoJobType, SeoJobRun | null>;

  const pages = [...staticPages, ...articlePages];
  const bySeverity = Object.fromEntries(SEO_ISSUE_SEVERITIES.map((s) => [s, issues.filter((i) => i.type === s)]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">SEO</h1>
        <p className="mt-1 text-sm text-muted">
          Deterministic technical status and approval-first recommendations — no fake rankings, no simulated traffic. This is not the autonomous SEO agent; nothing here publishes or changes anything public on its own.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Indexable pages" value={pages.length} hint={`${staticPages.length} static + ${articlePages.length} article`} />
        <StatCard label="Known noindex routes" value={NOINDEX_ADMIN_ROUTES.length} hint="Admin — auth-protected regardless" />
        <StatCard label="Sitemap URLs" value={sitemapEntries.length} hint="From the real sitemap.xml generator" />
        <StatCard label="Audit findings" value={issues.length} hint={`${bySeverity.ERROR.length} error · ${bySeverity.WARNING.length} warning · ${bySeverity.OPPORTUNITY.length} opportunity`} />
      </div>

      <Section title="Connections" hint="Truthful state only — never shown as connected without a real successful sync.">
        <div className="grid gap-3 sm:grid-cols-4">
          <ConnectionCard label="Google Search Console" state={searchConsole} />
          <ConnectionCard label="GA4 reporting" state={analyticsReporting} />
          <ConnectionCard label="PageSpeed Insights" state={pageSpeed} />
          <ConnectionCard label="SERP / keyword provider" state={serp} />
        </div>
      </Section>

      <Section title="SEO Jobs" hint="Manual trigger — runs go through the exact same lock/history mechanism as the scheduled cron endpoint, tagged MANUAL instead of CRON.">
        <SeoJobsPanel />
      </Section>

      <Section title="Job Schedule &amp; Freshness" hint="Recommended cadence — cron is NOT active yet (see docs/SEO_STRATEGY.md §28 for exact activation steps).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 pr-4 font-medium">Job</th>
                <th className="py-2 pr-4 font-medium">Recommended cadence</th>
                <th className="py-2 font-medium">Last successful run</th>
              </tr>
            </thead>
            <tbody>
              {SEO_JOB_TYPES.map((jobType) => {
                const last = lastSuccessfulByJob[jobType];
                return (
                  <tr key={jobType} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-foreground">{jobType}</td>
                    <td className="py-2 pr-4 text-muted">{JOB_SCHEDULE_LABEL[jobType]}</td>
                    <td className="py-2 text-muted">{last ? formatDateTime(last.completedAt ?? last.startedAt) : "Never"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Recent Job Runs" hint="Job audit history — never deleted.">
        {recentJobRuns.length === 0 ? (
          <EmptyState title="No jobs have run yet" hint="Trigger one above, or wait for the cron schedule once activated." />
        ) : (
          <JobRunsTable runs={recentJobRuns} />
        )}
      </Section>

      <Section
        title="Weekly Executive Report"
        hint="The most recent successful WEEKLY_EXECUTIVE_REPORT run's snapshot."
        action={latestReport ? <DataProvenanceBadge kind="LIVE_DATA" /> : <DataProvenanceBadge kind="NOT_CONNECTED" />}
      >
        {latestReport ? <WeeklyReportSummary report={latestReport} /> : <EmptyState title="No report generated yet" hint="Run the Weekly executive report job above." />}
      </Section>

      <Section title="Search Performance" hint="Requires Google Search Console.">
        {searchConsole.status === "CONNECTED" ? (
          <p className="text-sm text-muted">Connected — query/page performance will appear here once the sync architecture lands real data.</p>
        ) : (
          <EmptyState title="Not connected" hint="Configure GOOGLE_SEARCH_CONSOLE_SITE_URL and credentials to enable this section." />
        )}
      </Section>

      <Section title="PageSpeed" hint="Field (real-user) and lab (synthetic) data are never merged.">
        {pageSpeed.status === "CONNECTED" ? (
          <p className="text-sm text-muted">Connected — Core Web Vitals field/lab data will appear here.</p>
        ) : (
          <EmptyState title="Not connected" hint="Configure PAGESPEED_API_KEY to enable this section." />
        )}
      </Section>

      <Section title="Content" hint="Real counts from the Insights/CMS system.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Published" value={articleCounts.PUBLISHED} />
          <StatCard label="Review" value={articleCounts.REVIEW} />
          <StatCard label="Draft" value={articleCounts.DRAFT} />
          <StatCard label="Archived" value={articleCounts.ARCHIVED} />
        </div>
      </Section>

      <Section
        title="Opportunities"
        hint="Approval-first — nothing here changes public content until an OWNER/ADMIN explicitly approves it."
        action={<GenerateRecommendationsButton />}
      >
        {recommendations.length === 0 ? (
          <EmptyState title="No open recommendations" hint="Generate from the current audit, or check back after a future external sync." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recommendations.map((rec) => (
              <li key={rec.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm text-foreground">{rec.reason}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {rec.page} {rec.locale ? `[${rec.locale}]` : ""} · {rec.source} · confidence {(rec.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="mt-0.5 text-xs text-primary-bright">{rec.recommendedAction}</div>
                </div>
                <SeoRecommendationActions id={rec.id} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Technical Audit">
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
      </Section>
    </div>
  );
}

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ConnectionCard({ label, state }: { label: string; state: SeoConnectionState }) {
  const styles: Record<SeoConnectionState["status"], string> = {
    CONNECTED: "text-emerald-400",
    NOT_CONFIGURED: "text-muted",
    ERROR: "text-red-400",
    EXPIRED: "text-amber-400",
  };
  return (
    <div className="rounded-xl border border-border bg-void px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">{label}</span>
        <span className={`text-xs font-semibold ${styles[state.status]}`}>{state.status.replace("_", " ")}</span>
      </div>
      {state.lastError && <p className="mt-1 text-xs text-muted">{state.lastError}</p>}
      {state.lastSyncedAt && <p className="mt-1 text-xs text-muted">Last synced {formatDateTime(state.lastSyncedAt)}</p>}
    </div>
  );
}

const JOB_RUN_STATUS_STYLE: Record<SeoJobRun["status"], string> = {
  RUNNING: "bg-primary/15 text-primary-bright",
  SUCCEEDED: "bg-emerald-500/15 text-emerald-400",
  PARTIAL: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-red-500/15 text-red-400",
  TIMED_OUT: "bg-graphite text-muted",
};

function JobRunsTable({ runs }: { runs: SeoJobRun[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-150 text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="py-2 pr-4 font-medium">Job</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Trigger</th>
            <th className="py-2 pr-4 font-medium">Started</th>
            <th className="py-2 font-medium">Counts / error</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b border-border last:border-0 align-top">
              <td className="py-2 pr-4 text-foreground">{run.jobType}</td>
              <td className="py-2 pr-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${JOB_RUN_STATUS_STYLE[run.status]}`}>{run.status}</span>
              </td>
              <td className="py-2 pr-4 text-muted">{run.triggeredBy}</td>
              <td className="py-2 pr-4 text-muted">{formatDateTime(run.startedAt)}</td>
              <td className="py-2 text-muted">
                {run.errorSummary ?? (run.counts ? Object.entries(run.counts).map(([k, v]) => `${k}: ${v}`).join(", ") : "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeeklyReportSummary({ report }: { report: WeeklySeoReport }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        Period {report.period.start.slice(0, 10)} → {report.period.end.slice(0, 10)}, vs. {report.previousPeriod.start.slice(0, 10)} →{" "}
        {report.previousPeriod.end.slice(0, 10)}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {report.metrics.map((m) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.current}
            hint={m.deltaPct === null ? `was ${m.previous}` : `${m.deltaPct >= 0 ? "+" : ""}${m.deltaPct.toFixed(0)}% vs. prior period`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Awaiting approval" value={report.recommendationsAwaitingApproval} />
        <StatCard label="Actions completed" value={report.actionsCompletedThisPeriod} hint="Approved/rejected/published this period" />
        <StatCard label="Top opportunities" value={report.topOpportunities.length} />
      </div>

      {report.aiSummary ? (
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Summary</span>
            <DataProvenanceBadge kind="AI_RECOMMENDATION" />
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{report.aiSummary}</p>
        </div>
      ) : (
        <EmptyState title="No AI summary" hint="Configure ANTHROPIC_API_KEY to have SIGMA AI explain this report in plain language." />
      )}
    </div>
  );
}
