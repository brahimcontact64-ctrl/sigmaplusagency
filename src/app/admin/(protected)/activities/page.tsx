import Link from "next/link";
import { getCrmService } from "@/lib/services/crm-service";
import { EmptyState } from "@/components/admin/empty-state";
import { formatDateTime, activityLabel } from "@/lib/admin/format";

export const metadata = { title: "Activities — SIGMA+ Admin" };
const PAGE_SIZE = 40;

export default async function AdminActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const { items, total } = await getCrmService().listActivities(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Activities</h1>
        <p className="mt-1 text-sm text-muted">Audit-friendly timeline across every lead — {total} total.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No activity yet" hint="Every lead action — submissions, status changes, notes — will appear here." />
      ) : (
        <>
          <ol className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
            {items.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm text-foreground">{activityLabel(activity.type, activity.metadata)}</div>
                  <Link href={`/admin/leads/${activity.leadId}`} className="text-xs text-muted hover:text-primary-bright">
                    {activity.leadName} · {activity.leadReference}
                  </Link>
                </div>
                <span className="shrink-0 text-xs text-muted">{formatDateTime(activity.createdAt)}</span>
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={`?page=${Math.max(1, page - 1)}`}
                className={`rounded-lg border border-border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-primary-bright hover:text-primary-bright"}`}
              >
                Previous
              </Link>
              <Link
                href={`?page=${Math.min(totalPages, page + 1)}`}
                className={`rounded-lg border border-border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-primary-bright hover:text-primary-bright"}`}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
