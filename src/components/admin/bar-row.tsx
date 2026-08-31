/** Lightweight CSS bar with a real text equivalent (Phase 9 §27) — no chart dependency, screen-reader accessible via aria-label rather than relying on the visual bar alone. */
export function BarRow({ label, value, max, valueLabel }: { label: string; value: number; max: number; valueLabel: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 shrink-0 truncate text-muted" title={label}>
        {label}
      </span>
      <div className="h-2 flex-1 rounded-full bg-void" role="img" aria-label={`${label}: ${valueLabel}`}>
        <div className="h-2 rounded-full bg-primary-bright" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right font-medium text-foreground">{valueLabel}</span>
    </div>
  );
}
