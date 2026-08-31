import Link from "next/link";
import { getCrmService } from "@/lib/services/crm-service";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/admin/format";

export const metadata = { title: "Project Requests — SIGMA+ Admin" };
const PAGE_SIZE = 20;

export default async function AdminProjectRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const { items, total } = await getCrmService().listProjectRequests(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Project Requests</h1>
        <p className="mt-1 text-sm text-muted">{total} total, most recent first.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No project requests yet" hint="Full Project Builder submissions will appear here." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Project type</th>
                  <th className="px-4 py-3 font-medium">Timeline</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Lead status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {items.map((pr) => (
                  <tr key={pr.id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${pr.leadId}`} className="text-foreground hover:text-primary-bright">
                        {pr.leadName}
                      </Link>
                      <div className="font-mono text-xs text-muted">{pr.leadReference}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{pr.projectType}</td>
                    <td className="px-4 py-3 text-muted">{pr.timeline}</td>
                    <td className="px-4 py-3 text-muted">{pr.budgetRange}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pr.leadStatus} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(pr.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
