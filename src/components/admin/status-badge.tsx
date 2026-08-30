import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/domain/lead";

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-primary/15 text-primary-bright",
  CONTACTED: "bg-cyan/15 text-cyan",
  QUALIFIED: "bg-cyan/15 text-cyan",
  MEETING: "bg-violet/15 text-violet",
  PROPOSAL: "bg-violet/15 text-violet",
  NEGOTIATION: "bg-amber-500/15 text-amber-400",
  WON: "bg-emerald-500/15 text-emerald-400",
  LOST: "bg-red-500/15 text-red-400",
  DEVELOPMENT: "bg-primary/15 text-primary-bright",
  REVIEW: "bg-amber-500/15 text-amber-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-400",
  MAINTENANCE: "bg-muted/20 text-muted",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
