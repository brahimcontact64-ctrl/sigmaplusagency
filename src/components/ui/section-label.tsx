export function SectionLabel({ index }: { index: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-sm font-semibold text-primary-bright">{index}</span>
      <span className="h-px w-8 bg-border" aria-hidden />
    </div>
  );
}
