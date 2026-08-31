/**
 * Shared across both the public site and Admin (Phase 10 §47-48) —
 * lives under `ui/`, not `admin/`, precisely so a public page needing
 * an empty state (e.g. Insights with zero published articles) doesn't
 * import from the Admin component tree at all, keeping that boundary
 * real rather than incidental.
 */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
    </div>
  );
}
