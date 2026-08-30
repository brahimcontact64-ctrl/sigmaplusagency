/** Lightweight CSS bar chart — a real charting library is overkill for a handful of grouped counts. */
export function BarList({ items }: { items: { label: string; count: number }[] }) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-muted">{item.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-graphite">
            <div
              className="h-full rounded-full bg-primary-bright"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium text-foreground">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}
