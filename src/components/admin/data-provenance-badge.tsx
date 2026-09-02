import { cn } from "@/lib/utils";

/**
 * Phase 12 §11 — every number/section on /admin/seo must say plainly
 * which of these four buckets it's in. Never a fifth, ad-hoc label:
 * this is the complete vocabulary the dashboard uses to avoid the
 * "fake zero that looks like a live connected value" failure mode.
 */
export const DATA_PROVENANCE_KINDS = ["LIVE_DATA", "ESTIMATE", "AI_RECOMMENDATION", "NOT_CONNECTED"] as const;
export type DataProvenanceKind = (typeof DATA_PROVENANCE_KINDS)[number];

const LABEL: Record<DataProvenanceKind, string> = {
  LIVE_DATA: "Live data",
  ESTIMATE: "Estimate",
  AI_RECOMMENDATION: "AI recommendation",
  NOT_CONNECTED: "Not connected",
};

const STYLE: Record<DataProvenanceKind, string> = {
  LIVE_DATA: "bg-emerald-500/15 text-emerald-400",
  ESTIMATE: "bg-amber-500/15 text-amber-400",
  AI_RECOMMENDATION: "bg-primary/15 text-primary-bright",
  NOT_CONNECTED: "bg-graphite text-muted",
};

export function DataProvenanceBadge({ kind, className }: { kind: DataProvenanceKind; className?: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STYLE[kind], className)}>{LABEL[kind]}</span>;
}
