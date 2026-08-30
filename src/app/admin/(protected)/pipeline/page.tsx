import Link from "next/link";
import { getCrmService } from "@/lib/services/crm-service";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { formatRelative } from "@/lib/admin/format";
import { LEAD_STATUSES } from "@/domain/lead";

export const metadata = { title: "Pipeline — SIGMA+ Admin" };

export default async function AdminPipelinePage() {
  const board = await getCrmService().getPipelineBoard();
  const total = Object.values(board).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Pipeline</h1>
        <p className="mt-1 text-sm text-muted">
          {total} leads in the working set (most recently updated). Move a card with its status control — no drag-and-drop, keyboard-accessible by default.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {LEAD_STATUSES.map((status) => {
          const items = board[status];
          return (
            <div key={status} className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold tracking-wide text-muted">{status}</h2>
                <span className="text-xs text-muted">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="px-1 text-xs text-muted">No leads.</p>
                ) : (
                  items.map((lead) => (
                    <div key={lead.id} className="flex flex-col gap-2 rounded-xl border border-border bg-void p-3">
                      <Link href={`/admin/leads/${lead.id}`} className="min-w-0 truncate text-sm font-medium text-foreground hover:text-primary-bright">
                        {lead.name}
                      </Link>
                      <div className="truncate text-xs text-muted">{lead.company ?? lead.publicReference}</div>
                      <div className="flex flex-wrap gap-1 text-xs text-muted">
                        {lead.latestProjectType && <span className="rounded-full bg-graphite px-2 py-0.5">{lead.latestProjectType}</span>}
                        {lead.latestBudgetRange && <span className="rounded-full bg-graphite px-2 py-0.5">{lead.latestBudgetRange}</span>}
                        <span className="rounded-full bg-graphite px-2 py-0.5">{lead.source}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted">{formatRelative(lead.createdAt)}</span>
                        <LeadStatusSelect leadId={lead.id} status={lead.status} compact />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
