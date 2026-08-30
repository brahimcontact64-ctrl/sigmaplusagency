/**
 * A stylized, clearly decorative stand-in for a product screenshot.
 * We don't have real screenshots for these projects (see
 * docs/CASE_STUDY_OWNER_INPUT.md) and the old site's thumbnails turned
 * out to be generic placeholder graphics — not real UI — so rather than
 * pretend either way, this renders an abstract browser-chrome frame with
 * the project's own name and accent color. Nothing here claims to be
 * the actual product.
 */
export function ProjectVisual({ name, accent }: { name: string; accent: string }) {
  return (
    <div
      role="img"
      aria-label={`Decorative visual for ${name}`}
      className="overflow-hidden rounded-2xl border border-border bg-graphite"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
      </div>
      <div
        className="flex aspect-video items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${accent} 18%, transparent), transparent 60%)`,
        }}
      >
        <span className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: accent }}>
          {name}
        </span>
      </div>
    </div>
  );
}
