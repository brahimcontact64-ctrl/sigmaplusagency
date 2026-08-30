import Link from "next/link";
import { getCrmService } from "@/lib/services/crm-service";
import { StatCard } from "@/components/admin/stat-card";
import { BarList } from "@/components/admin/bar-list";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { formatRelative, activityLabel } from "@/lib/admin/format";
import type { LeadStatus } from "@/domain/lead";

export const metadata = { title: "Dashboard — SIGMA+ Admin" };

export default async function AdminDashboardPage() {
  const metrics = await getCrmService().getDashboardMetrics();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Live figures from the lead database — nothing here is simulated.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={metrics.totalLeads} />
        <StatCard label="New leads (7d)" value={metrics.newLeadsLast7Days} />
        <StatCard label="Project requests" value={metrics.totalProjectRequests} />
        <StatCard
          label="Conversion (won)"
          value={metrics.leadsByStatus.find((s) => s.status === "WON")?.count ?? 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Leads by status</h2>
          {metrics.leadsByStatus.length > 0 ? (
            <BarList items={metrics.leadsByStatus.map((s) => ({ label: s.status, count: s.count }))} />
          ) : (
            <p className="text-sm text-muted">No leads yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Leads by source</h2>
          {metrics.leadsBySource.length > 0 ? (
            <BarList items={metrics.leadsBySource.map((s) => ({ label: s.source, count: s.count }))} />
          ) : (
            <p className="text-sm text-muted">No leads yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Leads by language</h2>
          {metrics.leadsByLanguage.length > 0 ? (
            <BarList items={metrics.leadsByLanguage.map((s) => ({ label: s.language.toUpperCase(), count: s.count }))} />
          ) : (
            <p className="text-sm text-muted">No leads yet.</p>
          )}
        </div>
      </div>

      {metrics.projectsByType.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Project requests by type</h2>
          <BarList items={metrics.projectsByType.map((p) => ({ label: p.projectType, count: p.count }))} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent submissions</h2>
            <Link href="/admin/leads" className="text-xs font-medium text-primary-bright hover:underline">
              View all
            </Link>
          </div>
          {metrics.recentLeads.length === 0 ? (
            <EmptyState title="No leads yet" hint="New submissions from the site will show up here immediately." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {metrics.recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/leads/${lead.id}`} className="truncate text-sm font-medium text-foreground hover:text-primary-bright">
                      {lead.name}
                    </Link>
                    <div className="truncate text-xs text-muted">{lead.publicReference}</div>
                  </div>
                  <StatusBadge status={lead.status as LeadStatus} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            <Link href="/admin/activities" className="text-xs font-medium text-primary-bright hover:underline">
              View all
            </Link>
          </div>
          {metrics.recentActivities.length === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {metrics.recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-foreground">{activityLabel(activity.type, activity.metadata)}</div>
                    <div className="truncate text-xs text-muted">
                      {activity.leadName} · {activity.leadReference}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatRelative(activity.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
