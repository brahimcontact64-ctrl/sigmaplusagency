import Link from "next/link";
import { requireActor } from "@/lib/auth/dal";
import { ANALYTICS_VIEWER_ROLES } from "@/domain/admin-user";
import { getGrowthAnalyticsService } from "@/lib/services/growth-analytics-service";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { lastNDaysRange } from "@/lib/analytics/rates";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { BarRow } from "@/components/admin/bar-row";
import { formatDateTime, formatPercent } from "@/lib/admin/format";
import type { ContentBreakdownRow } from "@/lib/services/growth-analytics-service";

export const metadata = { title: "Analytics — SIGMA+ Admin" };

const RANGE_OPTIONS = [7, 30, 90] as const;

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireActor();

  if (!ANALYTICS_VIEWER_ROLES.includes(actor.role)) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <EmptyState title="Not authorized" hint="The Analytics/Growth dashboard is restricted to OWNER and ADMIN roles." />
      </div>
    );
  }

  const raw = await searchParams;
  const rangeParam = Array.isArray(raw.range) ? raw.range[0] : raw.range;
  const days = RANGE_OPTIONS.includes(Number(rangeParam) as (typeof RANGE_OPTIONS)[number]) ? Number(rangeParam) : 30;
  const range = lastNDaysRange(days);

  const service = getGrowthAnalyticsService();
  const [overview, builderFunnel, aiFunnel, aiComparison, serviceRows, caseStudyRows, articleRows, acquisition, crmConversion, freshness] = await Promise.all([
    service.getOverview(range),
    service.getProjectBuilderFunnel(range),
    service.getAiConsultantFunnel(range),
    service.getAiAssistedComparison(range),
    service.getServiceBreakdown(range),
    service.getCaseStudyBreakdown(range),
    service.getArticleBreakdown(range),
    service.getAcquisitionBreakdown(range),
    service.getCrmConversion(range),
    service.getDataFreshness(),
  ]);

  const articleTitles = await resolveArticleTitles(articleRows);

  const hasAnyData = overview.sessions > 0 || overview.leadsCreated > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Real conversion intelligence derived from recorded events and CRM state — never fabricated traffic, rankings, or rates. AI-assisted figures are correlation, not causation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <Link
              key={opt}
              href={`/admin/analytics?range=${opt}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                days === opt ? "border-primary-bright text-primary-bright" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {opt}d
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted">
        {freshness ? `Data current as of ${formatDateTime(freshness)}.` : "No analytics events recorded yet."} Window: last {days} days (UTC), production traffic only.
      </p>

      {!hasAnyData && (
        <EmptyState
          title="No analytics data yet for this window"
          hint="Once visitors accept analytics cookies and browse the site, real sessions and conversions will appear here."
        />
      )}

      <Section title="Overview">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Sessions" value={overview.sessions} hint="Distinct analytics sessions, production only" />
          <StatCard label="Leads created" value={overview.leadsCreated} hint={`${formatPercent(overview.conversionRate)} of sessions`} />
          <StatCard label="Qualified" value={overview.qualifiedCount} />
          <StatCard label="Proposals" value={overview.proposalCount} />
          <StatCard label="Won" value={overview.wonCount} />
          <StatCard label="WhatsApp handoffs" value={overview.whatsappHandoffs} />
          <StatCard label="AI-assisted sessions" value={overview.aiAssistedSessions} />
        </div>
      </Section>

      <Section title="Acquisition" hint="Lead-level First Touch attribution, grouped into broad channels — not a session-level breakdown (see measurement plan for why).">
        {acquisition.length === 0 ? (
          <EmptyState title="No leads in this window" />
        ) : (
          <div className="flex flex-col gap-2">
            {acquisition
              .sort((a, b) => b.leadCount - a.leadCount)
              .map((row) => (
                <BarRow key={row.channel} label={row.channel.replace("_", " ")} value={row.leadCount} max={Math.max(...acquisition.map((r) => r.leadCount), 1)} valueLabel={String(row.leadCount)} />
              ))}
          </div>
        )}
      </Section>

      <Section title="Project Builder funnel" hint="Abandonment = started without completing, tab closed mid-flow (deterministic, not a timeout guess).">
        <FunnelTable stages={builderFunnel} />
      </Section>

      <Section title="AI Consultant funnel">
        <FunnelTable stages={aiFunnel} />
      </Section>

      <Section title="AI-assisted vs. other sessions" hint="Correlation only — not a controlled experiment, never a causal claim.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-void p-4">
            <p className="text-xs uppercase tracking-wide text-muted">AI-assisted sessions</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{aiComparison.aiAssistedSessions}</p>
            <p className="mt-1 text-sm text-muted">{formatPercent(aiComparison.aiAssistedRate)} led to a lead within the same session</p>
          </div>
          <div className="rounded-xl border border-border bg-void p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Other sessions</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{aiComparison.otherSessions}</p>
            <p className="mt-1 text-sm text-muted">{formatPercent(aiComparison.otherRate)} led to a lead within the same session</p>
          </div>
        </div>
      </Section>

      <Section title="Services" hint="Views/CTA clicks/attributed leads via session attribution — never forced.">
        <ContentTable rows={serviceRows} />
      </Section>

      <Section title="Case studies">
        <ContentTable rows={caseStudyRows} />
      </Section>

      <Section title="Articles">
        <ContentTable rows={articleRows} idLabel={(id) => articleTitles.get(id) ?? id} />
      </Section>

      <Section title="CRM conversion" hint="Never includes revenue unless a manual deal value was entered on a lead — see money.ts.">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Leads created" value={crmConversion.leadsCreated} />
          <StatCard label="Lead → Qualified" value={formatPercent(crmConversion.leadToQualifiedRate)} />
          <StatCard label="Qualified → Won" value={formatPercent(crmConversion.qualifiedToWonRate)} />
          <StatCard label="Lost" value={crmConversion.lostCount} />
        </div>
      </Section>
    </div>
  );
}

/** Best-effort title lookup for display only — articleId is a raw UUID that means nothing to an admin on its own. Falls back to the raw id for a deleted/inaccessible article rather than failing the whole page. */
async function resolveArticleTitles(rows: ContentBreakdownRow[]): Promise<Map<string, string>> {
  const repo = getArticleRepository();
  const entries = await Promise.all(
    rows.map(async (r) => {
      try {
        const translations = await repo.getTranslationsForArticle(r.id);
        const preferred = translations.find((t) => t.locale === "en") ?? translations[0];
        return [r.id, preferred?.title ?? r.id] as const;
      } catch {
        return [r.id, r.id] as const;
      }
    }),
  );
  return new Map(entries);
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function FunnelTable({ stages }: { stages: { event: string; label: string; sessionCount: number; conversionFromPrevious: number | null }[] }) {
  if (stages.every((s) => s.sessionCount === 0)) return <EmptyState title="No sessions in this window" />;
  const max = Math.max(...stages.map((s) => s.sessionCount), 1);
  return (
    <div className="flex flex-col gap-2">
      {stages.map((s) => (
        <BarRow
          key={s.event}
          label={s.label}
          value={s.sessionCount}
          max={max}
          valueLabel={`${s.sessionCount}${s.conversionFromPrevious !== null ? ` (${formatPercent(s.conversionFromPrevious)})` : ""}`}
        />
      ))}
    </div>
  );
}

function ContentTable({ rows, idLabel }: { rows: ContentBreakdownRow[]; idLabel?: (id: string) => string }) {
  if (rows.length === 0) return <EmptyState title="No views in this window" />;
  const sorted = [...rows].sort((a, b) => b.views - a.views).slice(0, 10);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 font-medium">Views</th>
            <th className="pb-2 font-medium">CTA clicks</th>
            <th className="pb-2 font-medium">Attributed leads</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((row) => (
            <tr key={row.id}>
              <td className="py-2 text-foreground">{idLabel ? idLabel(row.id) : row.id}</td>
              <td className="py-2 text-muted">{row.views}</td>
              <td className="py-2 text-muted">{row.ctaClicks}</td>
              <td className="py-2 text-muted">{row.attributedLeads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
